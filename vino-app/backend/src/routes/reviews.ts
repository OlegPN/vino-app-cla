import { Router, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

export const reviewsRouter = Router();

const reviewSchema = z.object({
  wineId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  text: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
});

// POST /api/reviews
reviewsRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { wineId, rating, text, imageUrl } = parsed.data;
  const review = await prisma.review.upsert({
    where: { userId_wineId: { userId: req.userId!, wineId } },
    update: { rating, text, imageUrl },
    create: { userId: req.userId!, wineId, rating, text, imageUrl },
  });
  // Recalculate wine avg rating
  const agg = await prisma.review.aggregate({ where: { wineId }, _avg: { rating: true }, _count: true });
  await prisma.wine.update({
    where: { id: wineId },
    data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
  });
  res.json({ review });
});

// POST /api/reviews/:id/like
reviewsRouter.post('/:id/like', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.like.findUnique({
    where: { userId_reviewId: { userId: req.userId!, reviewId: (req.params.id as string) } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    res.json({ liked: false });
  } else {
    await prisma.like.create({ data: { userId: req.userId!, reviewId: (req.params.id as string) } });
    res.json({ liked: true });
  }
});
