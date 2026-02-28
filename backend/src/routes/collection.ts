import { Router, Response } from 'express';
import { CollectionStatus } from '@prisma/client';
import { prisma } from '../db';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

export const collectionRouter = Router();

// GET /api/collection - get my collection
collectionRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const collection = await prisma.collection.findUnique({
    where: { userId: req.userId! },
    include: {
      items: {
        include: { wine: { include: { winery: true, region: true } } },
        orderBy: { addedAt: 'desc' },
      },
    },
  });
  res.json({ collection });
});

const addSchema = z.object({
  wineId: z.string().uuid(),
  status: z.nativeEnum(CollectionStatus),
  quantity: z.number().int().min(1).default(1),
});

// POST /api/collection - add wine to collection
collectionRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { wineId, status, quantity } = parsed.data;
  const collection = await prisma.collection.findUnique({ where: { userId: req.userId! } });
  if (!collection) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const item = await prisma.collectionItem.create({
    data: { collectionId: collection.id, wineId, status, quantity },
    include: { wine: true },
  });
  res.json({ item });
});

// PATCH /api/collection/:itemId - update status
collectionRouter.patch('/:itemId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, quantity } = req.body;
  const item = await prisma.collectionItem.update({
    where: { id: (req.params.itemId as string) },
    data: { ...(status && { status }), ...(quantity && { quantity }) },
  });
  res.json({ item });
});

// DELETE /api/collection/:itemId
collectionRouter.delete('/:itemId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.collectionItem.delete({ where: { id: (req.params.itemId as string) } });
  res.json({ success: true });
});
