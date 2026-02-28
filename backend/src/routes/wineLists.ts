import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

export const wineListsRouter = Router();

// GET /api/wine-lists/my
wineListsRouter.get('/my', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const lists = await prisma.wineList.findMany({
    where: { userId: req.userId! },
    include: { _count: { select: { items: true } } },
  });
  res.json({ lists });
});

// POST /api/wine-lists
wineListsRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, isPublic } = req.body;
  if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
  const list = await prisma.wineList.create({
    data: { userId: req.userId!, name, description, isPublic: isPublic ?? true },
  });
  res.status(201).json({ list });
});

// POST /api/wine-lists/:id/wines
wineListsRouter.post('/:id/wines', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { wineId, note } = req.body;
  const item = await prisma.wineListItem.create({
    data: { wineListId: (req.params.id as string), wineId, note },
    include: { wine: true },
  });
  res.json({ item });
});

// GET /api/wine-lists/:id
wineListsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const list = await prisma.wineList.findUnique({
    where: { id: (req.params.id as string) },
    include: {
      items: { include: { wine: { include: { winery: true } } } },
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
  if (!list) { res.status(404).json({ error: 'List not found' }); return; }
  res.json({ list });
});
