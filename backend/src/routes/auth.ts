import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(60),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

function generateTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Clean old tokens for user (keep last 5)
  const existing = await prisma.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: 4,
  });
  if (existing.length > 0) {
    await prisma.refreshToken.deleteMany({ where: { id: { in: existing.map((t) => t.id) } } });
  }

  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
}

authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, username, displayName, password } = parsed.data;
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (exists) {
    res.status(409).json({ error: 'Email or username already taken' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, displayName, passwordHash },
  });
  await prisma.collection.create({ data: { userId: user.id } });

  const { accessToken, refreshToken } = generateTokens(user.id);
  await storeRefreshToken(user.id, refreshToken);

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, email, username, displayName },
  });
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { accessToken, refreshToken } = generateTokens(user.id);
  await storeRefreshToken(user.id, refreshToken);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName },
  });
});

authRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  const { refreshToken } = parsed.data;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { tokenHash } });
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const accessToken = jwt.sign({ userId: stored.userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  res.json({ accessToken });
});
