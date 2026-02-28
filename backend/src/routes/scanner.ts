import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const scannerRouter = Router();

interface VisionResponse {
  responses: Array<{
    textAnnotations?: Array<{ description: string }>;
  }>;
}

async function recognizeWithGoogleVision(imageBase64: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey || apiKey === 'stub') {
    // Fall back to stub
    logger.debug('[STUB] Vision API called, image size:', { size: imageBase64.length });
    return 'Château Margaux';
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 10 }],
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      logger.error('Google Vision API error', { status: res.status });
      return null;
    }

    const data = (await res.json()) as VisionResponse;
    const annotations = data.responses?.[0]?.textAnnotations;
    if (!annotations || annotations.length === 0) return null;

    // First annotation contains the full text
    return annotations[0].description;
  } catch (err) {
    logger.error('Google Vision API request failed', { err });
    return null;
  }
}

// ── Smart label search ─────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'and', 'del', 'de', 'di', 'du', 'le', 'la', 'les', 'of', 'von',
  'wine', 'winery', 'estate', 'chateau', 'château', 'domaine', 'bodega',
  'grand', 'cru', 'reserve', 'reserva', 'riserva', 'mis', 'en', 'bouteille',
  'appellation', 'contrôlée', 'controlée', 'aoc', 'doc', 'docg', 'igt',
  'red', 'white', 'rosé', 'dry', 'sec', 'brut', 'vintage', 'product', 'contains',
  'sulphites', 'alcohol', 'vol', 'cl', 'ml', 'ltd', 'inc',
]);

/** Extract 4-digit year between 1900–2099 */
function extractVintage(text: string): number | null {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

/** Tokenise label text into meaningful words */
function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яёéèêëàâùûüîïôçæœ0-9\s'-]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
}

type WineWithRelations = Awaited<ReturnType<typeof prisma.wine.findFirst>>;

async function findWineFromText(text: string): Promise<WineWithRelations> {
  const tokens = tokenise(text);
  const vintage = extractVintage(text);

  if (tokens.length === 0) return null;

  // Build OR conditions across name, winery name, region name, grape varieties
  const orConditions = tokens.flatMap(token => [
    { name: { contains: token, mode: 'insensitive' as const } },
    { winery: { name: { contains: token, mode: 'insensitive' as const } } },
    { region: { name: { contains: token, mode: 'insensitive' as const } } },
    { region: { country: { contains: token, mode: 'insensitive' as const } } },
    { grapeVarieties: { has: token } },
  ]);

  const candidates = await prisma.wine.findMany({
    where: { OR: orConditions },
    include: { winery: true, region: true, foodPairings: true, prices: true },
    take: 20,
  });

  if (candidates.length === 0) return null;

  // Score each candidate: count how many tokens match name/winery/region
  const scored = candidates.map(wine => {
    const haystack = [
      wine.name,
      wine.winery?.name ?? '',
      wine.region?.name ?? '',
      wine.region?.country ?? '',
      ...(wine.grapeVarieties ?? []),
    ].join(' ').toLowerCase();

    let score = tokens.filter(t => haystack.includes(t)).length;

    // Bonus: vintage matches exactly
    if (vintage && wine.vintage === vintage) score += 2;

    // Bonus: wine name starts with first token
    if (wine.name.toLowerCase().startsWith(tokens[0])) score += 1;

    return { wine, score };
  });

  scored.sort((a, b) => b.score - a.score);

  logger.debug('[SCANNER] Candidates scored', scored.map(s => ({ name: s.wine.name, score: s.score })));

  // Only return if at least one token matched
  return scored[0].score > 0 ? scored[0].wine : null;
}

async function getSuggestions(text: string, limit = 3): Promise<WineWithRelations[]> {
  const tokens = tokenise(text);
  const vintage = extractVintage(text);

  if (tokens.length === 0) {
    // No tokens — return top-rated wines as fallback
    return prisma.wine.findMany({
      include: { winery: true, region: true, foodPairings: true, prices: true },
      orderBy: { avgRating: 'desc' },
      take: limit,
    });
  }

  const orConditions = tokens.flatMap(token => [
    { name: { contains: token, mode: 'insensitive' as const } },
    { winery: { name: { contains: token, mode: 'insensitive' as const } } },
    { region: { name: { contains: token, mode: 'insensitive' as const } } },
    { region: { country: { contains: token, mode: 'insensitive' as const } } },
  ]);

  const candidates = await prisma.wine.findMany({
    where: { OR: orConditions },
    include: { winery: true, region: true, foodPairings: true, prices: true },
    take: 20,
  });

  // Score same way as findWineFromText
  const scored = candidates.map(wine => {
    const haystack = [
      wine.name,
      wine.winery?.name ?? '',
      wine.region?.name ?? '',
      wine.region?.country ?? '',
    ].join(' ').toLowerCase();

    let score = tokens.filter(t => haystack.includes(t)).length;
    if (vintage && wine.vintage === vintage) score += 2;

    return { wine, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // If we got some scored results, return top N; otherwise top-rated fallback
  const top = scored.slice(0, limit).filter(s => s.score > 0).map(s => s.wine);
  if (top.length > 0) return top;

  return prisma.wine.findMany({
    include: { winery: true, region: true, foodPairings: true, prices: true },
    orderBy: { avgRating: 'desc' },
    take: limit,
  });
}

// POST /api/scanner/scan
scannerRouter.post('/scan', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { imageBase64, barcode } = req.body;

  if (!imageBase64 && !barcode) {
    res.status(400).json({ error: 'Provide imageBase64 or barcode' });
    return;
  }

  let searchText: string | null = null;

  if (barcode) {
    logger.debug('[STUB] Barcode lookup:', { barcode });
    searchText = 'Opus One 2018';
  } else {
    searchText = await recognizeWithGoogleVision(imageBase64);
  }

  if (!searchText) {
    res.json({ found: false, wine: null });
    return;
  }

  const wine = await findWineFromText(searchText);
  const firstLine = searchText.split('\n')[0].trim();

  if (wine) {
    res.json({ found: true, wine });
  } else {
    const suggestions = await getSuggestions(searchText);
    res.json({ found: false, suggestedName: firstLine, wine: null, suggestions });
  }
});
