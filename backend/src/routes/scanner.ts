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

  // Extract first meaningful line for search (Vision returns full text block)
  const firstLine = searchText.split('\n')[0].trim();

  // Search wine in DB by extracted text
  const wine = await prisma.wine.findFirst({
    where: {
      OR: [
        { name: { contains: firstLine, mode: 'insensitive' } },
        { name: { contains: searchText.substring(0, 50), mode: 'insensitive' } },
      ],
    },
    include: { winery: true, region: true, foodPairings: true, prices: true },
  });

  if (wine) {
    res.json({ found: true, wine });
  } else {
    res.json({ found: false, suggestedName: firstLine, wine: null });
  }
});
