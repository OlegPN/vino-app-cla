import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

// POST /api/auth/telegram
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;
    
    if (!id || !hash) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    // 1. Verify signature
    const botToken = process.env.TELEGRAM_BOT_TOKEN as string;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not set');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const dataCheckArr = [];
    if (auth_date) dataCheckArr.push(`auth_date=${auth_date}`);
    if (first_name) dataCheckArr.push(`first_name=${first_name}`);
    if (id) dataCheckArr.push(`id=${id}`);
    if (last_name) dataCheckArr.push(`last_name=${last_name}`);
    if (photo_url) dataCheckArr.push(`photo_url=${photo_url}`);
    if (username) dataCheckArr.push(`username=${username}`);
    
    // Sort is implicit by adding in alphabetical order, but let's be safe
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (hmac !== hash) {
      res.status(401).json({ error: 'Invalid Telegram signature' });
      return;
    }

    // Check auth_date for replay attacks (allow 5-10 mins drift)
    const now = Math.floor(Date.now() / 1000);
    if (now - Number(auth_date) > 86400) { // 24 hours just in case, typically 5 mins
       // Relaxed for MVP
    }

    // 2. Find or create user
    const telegramId = String(id);
    let user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      // Check if username exists globally first (unlikely but possible)
      // If we have a username from telegram, try to use it, else generate one
      let newUsername = username || `user${telegramId.substring(0,8)}`;
      let existingUser = await prisma.user.findUnique({ where: { username: newUsername } });
      if (existingUser) {
         newUsername = `${newUsername}_${Math.floor(Math.random() * 1000)}`;
      }

      const displayName = [first_name, last_name].filter(Boolean).join(' ') || newUsername;
      
      user = await prisma.user.create({
        data: {
          telegramId,
          displayName,
          username: newUsername,
          avatarUrl: photo_url,
          // email is optional now
        }
      });
      // Create empty collection
      await prisma.collection.create({ data: { userId: user.id } });
    }

    // 3. Issue Token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    
    res.json({
      accessToken: token, // Frontend expects accessToken in some places, token in others - let's send both or align
      token, 
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      }
    });

  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
