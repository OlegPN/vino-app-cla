import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';

dotenv.config();

import { authRouter } from './routes/auth';
import { winesRouter } from './routes/wines';
import { reviewsRouter } from './routes/reviews';
import { collectionRouter } from './routes/collection';
import { scannerRouter } from './routes/scanner';
import { usersRouter } from './routes/users';
import { wineListsRouter } from './routes/wineLists';
import { uploadRouter } from './routes/upload';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { prisma } from './db';

const app = express();
const PORT = process.env.PORT || 3000;

// Security & performance
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/wines', winesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/users', usersRouter);
app.use('/api/wine-lists', wineListsRouter);
app.use('/api/upload', uploadRouter);

// Health check with DB ping
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🍷 Vino API running on port ${PORT}`);
});

export default app;
