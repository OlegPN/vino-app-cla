import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { PnLStats, TradeRecord } from '../risk/pnlTracker';

export type StrategyName = 'hybrid' | 'trend' | 'meanReversion' | 'scalping';

export const AVAILABLE_PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
export const AVAILABLE_STRATEGIES: { id: StrategyName; label: string; desc: string }[] = [
  { id: 'hybrid', label: 'Hybrid AI', desc: 'ML + LLM анализ' },
  { id: 'trend', label: 'Trend Following', desc: 'EMA Crossover + Momentum' },
  { id: 'meanReversion', label: 'Mean Reversion', desc: 'RSI + Bollinger Bands' },
  { id: 'scalping', label: 'Scalping', desc: 'Стакан + быстрые сделки' },
];

export interface BotState {
  pair: string;
  strategy: StrategyName;
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
  balance: { USDT: number; [k: string]: number };
  position: {
    active: boolean;
    entryPrice?: number;
    quantity?: number;
    stopLoss?: number;
    takeProfit?: number;
    pnl?: number;
    openedAt?: number;
  };
  trades: TradeRecord[];
  pnl: PnLStats;
  lastUpdate: number;
  status: 'running' | 'error' | 'waiting';
}

type CommandHandler = (cmd: { type: string; value: string }) => void;

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

let clients = new Set<WebSocket>();
let commandHandler: CommandHandler | null = null;

let currentState: BotState = {
  pair: process.env.TRADING_PAIR || 'BTC/USDT',
  strategy: (process.env.STRATEGY as StrategyName) || 'hybrid',
  price: 0, priceChange24h: 0, rsi: 0, macd: 0,
  ema20: 0, ema50: 0, volumeRatio: 1, obImbalance: 0,
  signal: 'WAITING', signalConfidence: 0,
  mlScore: 0, llmScore: 0,
  llmReason: 'Ожидание первого цикла...',
  balance: { USDT: 0 },
  position: { active: false },
  trades: [],
  pnl: { totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, totalPnL: 0, bestTrade: 0, worstTrade: 0, avgPnL: 0, startBalance: 0, currentBalance: 0, roi: 0, equityCurve: [] },
  lastUpdate: Date.now(),
  status: 'waiting',
};

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '../../src/dashboard/index.html'));
});
app.get('/state', (_, res) => res.json(currentState));

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'state', data: currentState }));
  ws.send(JSON.stringify({ type: 'meta', pairs: AVAILABLE_PAIRS, strategies: AVAILABLE_STRATEGIES }));

  ws.on('message', (raw) => {
    try {
      const cmd = JSON.parse(raw.toString());
      if (commandHandler) commandHandler(cmd);
    } catch {}
  });

  ws.on('close', () => clients.delete(ws));
});

function broadcast(msg: object) {
  const str = JSON.stringify(msg);
  for (const c of clients) {
    if (c.readyState === WebSocket.OPEN) c.send(str);
  }
}

export function updateState(partial: Partial<BotState>) {
  currentState = { ...currentState, ...partial, lastUpdate: Date.now() };
  broadcast({ type: 'state', data: currentState });
}

export function onCommand(handler: CommandHandler) {
  commandHandler = handler;
}

export function startDashboard(port = 4200) {
  httpServer.listen(port, () => {
    console.log(`\n🚀 Dashboard: http://localhost:${port}\n`);
  });
}
