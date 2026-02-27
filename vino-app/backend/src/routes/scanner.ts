import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

export const scannerRouter = Router();

// Stub: simulate label recognition
const stubRecognizeLabel = async (imageBase64: string): Promise<string | null> => {
  // In production: call Google Vision API, extract text, match to wine DB
  console.log('[STUB] Vision API called, image size:', imageBase64.length);
  // Return a stub wine name for demo
  return 'Château Margaux';
};

// POST /api/scanner/scan
scannerRouter.post('/scan', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { imageBase64, barcode } = req.body;

  if (!imageBase64 && !barcode) {
    res.status(400).json({ error: 'Provide imageBase64 or barcode' });
    return;
  }

  let wineName: string | null = null;

  if (barcode) {
    // Stub barcode lookup
    console.log('[STUB] Barcode lookup:', barcode);
    wineName = 'Opus One 2018';
  } else {
    wineName = await stubRecognizeLabel(imageBase64);
  }

  if (!wineName) {
    res.json({ found: false, wine: null });
    return;
  }

  // Search wine in DB
  const wine = await prisma.wine.findFirst({
    where: { name: { contains: wineName, mode: 'insensitive' } },
    include: { winery: true, region: true, foodPairings: true, prices: true },
  });

  if (wine) {
    res.json({ found: true, wine });
  } else {
    res.json({ found: false, suggestedName: wineName, wine: null });
  }
});
