import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

export const usersRouter = Router();

// GET /api/users/:id
usersRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: (req.params.id as string) },
    select: {
      id: true, username: true, displayName: true, avatarUrl: true, bio: true,
      _count: { select: { reviews: true, followers: true, following: true } },
    },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ user });
});

// POST /api/users/:id/follow
usersRouter.post('/:id/follow', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const followingId = (req.params.id as string);
  if (followingId === req.userId) { res.status(400).json({ error: 'Cannot follow yourself' }); return; }
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId!, followingId } },
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    res.json({ following: false });
  } else {
    await prisma.follow.create({ data: { followerId: req.userId!, followingId } });
    res.json({ following: true });
  }
});

// GET /api/users/:id/activity - reviews feed
usersRouter.get('/:id/activity', async (req: Request, res: Response): Promise<void> => {
  const reviews = await prisma.review.findMany({
    where: { userId: (req.params.id as string) },
    include: {
      wine: { include: { winery: true } },
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ reviews });
});
