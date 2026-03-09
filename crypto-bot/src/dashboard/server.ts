import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import path from 'path';

export interface BotState {
  pair: string;
  price: number;
  priceChange24h: number;
  rsi: number;
  macd: number;
  ema20: number;
  ema50: number;
  volumeRatio: number;
  obImbalance: number;
  signal: string;
  signalConfidence: number;
  mlScore: number;
  llmScore: number;
  llmReason: string;
  balance: { USDT: number; BTC: number };
  position: {
    active: boolean;
    entryPrice?: number;
    quantity?: number;
    stopLoss?: number;
    takeProfit?: number;
    pnl?: number;
    openedAt?: number;
  };
  trades: Trade[];
  lastUpdate: number;
  status: 'running' | 'error' | 'waiting';
}

export interface Trade {
  time: number;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  pnl?: number;
  reason?: string;
}

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

let clients: Set<WebSocket> = new Set();
let currentState: BotState = {
  pair: process.env.TRADING_PAIR || 'BTC/USDT',
  price: 0,
  priceChange24h: 0,
  rsi: 0,
  macd: 0,
  ema20: 0,
  ema50: 0,
  volumeRatio: 1,
  obImbalance: 0,
  signal: 'WAITING',
  signalConfidence: 0,
  mlScore: 0,
  llmScore: 0,
  llmReason: 'Ожидание первого цикла...',
  balance: { USDT: 0, BTC: 0 },
  position: { active: false },
  trades: [],
  lastUpdate: Date.now(),
  status: 'waiting',
};

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '../../src/dashboard/index.html'));
});

app.get('/state', (_, res) => {
  res.json(currentState);
});

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'state', data: currentState }));
  ws.on('close', () => clients.delete(ws));
});

export function updateState(partial: Partial<BotState>) {
  currentState = { ...currentState, ...partial, lastUpdate: Date.now() };
  const msg = JSON.stringify({ type: 'state', data: currentState });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

export function addTrade(trade: Trade) {
  currentState.trades = [trade, ...currentState.trades].slice(0, 50);
  updateState({});
}

export function startDashboard(port = 4200) {
  httpServer.listen(port, () => {
    console.log(`\n🚀 Dashboard: http://localhost:${port}\n`);
  });
}
