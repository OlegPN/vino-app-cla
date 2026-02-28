import { Router, Request, Response } from 'express';
import { WineType } from '@prisma/client';
import { prisma } from '../db';
import { z } from 'zod';

export const winesRouter = Router();

const filterSchema = z.object({
  q: z.string().optional(),
  type: z.nativeEnum(WineType).optional(),
  country: z.string().optional(),
  minRating: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

// GET /api/wines - search & filter
winesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = filterSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { q, type, country, minRating, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const wines = await prisma.wine.findMany({
    where: {
      ...(q && { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { winery: { name: { contains: q, mode: 'insensitive' } } },
      ]}),
      ...(type && { type }),
      ...(country && { region: { country: { contains: country, mode: 'insensitive' } } }),
      ...(minRating && { avgRating: { gte: minRating } }),
    },
    include: { winery: true, region: true, foodPairings: true, prices: true },
    skip,
    take: limit,
    orderBy: { avgRating: 'desc' },
  });
  res.json({ wines, page, limit });
});

// GET /api/wines/trending
winesRouter.get('/trending', async (_req: Request, res: Response): Promise<void> => {
  const wines = await prisma.wine.findMany({
    orderBy: [{ reviewCount: 'desc' }, { avgRating: 'desc' }],
    take: 10,
    include: { winery: true, region: true },
  });
  res.json({ wines });
});

// GET /api/wines/:id
winesRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const wine = await prisma.wine.findUnique({
    where: { id: (req.params.id as string) },
    include: {
      winery: true,
      region: true,
      foodPairings: true,
      prices: true,
      reviews: {
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!wine) {
    res.status(404).json({ error: 'Wine not found' });
    return;
  }
  res.json({ wine });
});
