import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { winesRouter } from './routes/wines';
import { reviewsRouter } from './routes/reviews';
import { collectionRouter } from './routes/collection';
import { scannerRouter } from './routes/scanner';
import { usersRouter } from './routes/users';
import { wineListsRouter } from './routes/wineLists';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/wines', winesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/users', usersRouter);
app.use('/api/wine-lists', wineListsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🍷 Vino API running on port ${PORT}`);
});

export default app;
