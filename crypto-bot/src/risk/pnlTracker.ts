import fs from 'fs';
import path from 'path';

export interface TradeRecord {
  id: number;
  time: number;
  pair: string;
  strategy: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  usdtValue: number;
  pnl?: number;
  pnlPct?: number;
  reason?: string;
}

export interface PnLStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  avgPnL: number;
  startBalance: number;
  currentBalance: number;
  roi: number;
  equityCurve: number[];
}

const DATA_FILE = path.join('logs', 'trades.json');

export class PnLTracker {
  private trades: TradeRecord[] = [];
  private startBalance = 0;
  private idCounter = 1;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        this.trades = data.trades || [];
        this.startBalance = data.startBalance || 0;
        this.idCounter = (this.trades[this.trades.length - 1]?.id || 0) + 1;
      }
    } catch {}
  }

  private save() {
    try {
      fs.mkdirSync('logs', { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify({
        trades: this.trades,
        startBalance: this.startBalance,
        updatedAt: Date.now(),
      }, null, 2));
    } catch {}
  }

  setStartBalance(balance: number) {
    if (this.startBalance === 0) {
      this.startBalance = balance;
      this.save();
    }
  }

  addBuy(pair: string, strategy: string, price: number, quantity: number): TradeRecord {
    const trade: TradeRecord = {
      id: this.idCounter++,
      time: Date.now(),
      pair,
      strategy,
      side: 'BUY',
      price,
      quantity,
      usdtValue: price * quantity,
    };
    this.trades.push(trade);
    this.save();
    return trade;
  }

  addSell(pair: string, strategy: string, price: number, quantity: number, entryPrice: number, reason?: string): TradeRecord {
    const pnl = (price - entryPrice) * quantity;
    const pnlPct = ((price - entryPrice) / entryPrice) * 100;
    const trade: TradeRecord = {
      id: this.idCounter++,
      time: Date.now(),
      pair,
      strategy,
      side: 'SELL',
      price,
      quantity,
      usdtValue: price * quantity,
      pnl,
      pnlPct,
      reason,
    };
    this.trades.push(trade);
    this.save();
    return trade;
  }

  getStats(currentBalance: number): PnLStats {
    const closedTrades = this.trades.filter(t => t.pnl !== undefined);
    const wins = closedTrades.filter(t => (t.pnl ?? 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl ?? 0) <= 0);
    const totalPnL = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

    // Equity curve (стартовый баланс + накопленный PnL)
    let running = this.startBalance;
    const equityCurve = closedTrades.map(t => {
      running += t.pnl ?? 0;
      return Math.round(running * 100) / 100;
    });

    return {
      totalTrades: closedTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      totalPnL,
      bestTrade: wins.length > 0 ? Math.max(...wins.map(t => t.pnl!)) : 0,
      worstTrade: losses.length > 0 ? Math.min(...losses.map(t => t.pnl!)) : 0,
      avgPnL: closedTrades.length > 0 ? totalPnL / closedTrades.length : 0,
      startBalance: this.startBalance,
      currentBalance,
      roi: this.startBalance > 0 ? ((currentBalance - this.startBalance) / this.startBalance) * 100 : 0,
      equityCurve: equityCurve.slice(-50),
    };
  }

  getRecentTrades(limit = 20): TradeRecord[] {
    return this.trades.slice(-limit).reverse();
  }
}
