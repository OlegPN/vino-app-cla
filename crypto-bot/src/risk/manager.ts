import { logger } from '../utils/logger';

export interface Position {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  openedAt: number;
}

export class RiskManager {
  private maxPositionUsdt: number;
  private stopLossPct: number;
  private takeProfitPct: number;
  private position: Position | null = null;

  // Trailing stop state
  private highestPrice = 0;        // LONG: отслеживаем максимум
  private lowestPrice = Infinity;  // SHORT: отслеживаем минимум
  private originalStopLoss = 0;

  constructor() {
    this.maxPositionUsdt = Number(process.env.MAX_POSITION_SIZE_USDT) || 100;
    this.stopLossPct = Number(process.env.STOP_LOSS_PERCENT) || 2;
    this.takeProfitPct = Number(process.env.TAKE_PROFIT_PERCENT) || 4;
  }

  hasOpenPosition(): boolean {
    return this.position !== null;
  }

  getPosition(): Position | null {
    return this.position;
  }

  openPosition(
    symbol: string,
    price: number,
    quantity: number,
    atr?: number,
    direction: 'LONG' | 'SHORT' = 'LONG',
  ): Position {
    let slDelta: number;
    let tpDelta: number;

    if (atr && atr > 0) {
      // ATR-based: SL = 1.5×ATR, TP = 3×ATR → Risk/Reward = 2:1
      slDelta = Math.max(price * 0.01, Math.min(price * 0.04, atr * 1.5));
      tpDelta = Math.max(price * 0.02, Math.min(price * 0.08, atr * 3.0));
    } else {
      slDelta = price * (this.stopLossPct / 100);
      tpDelta = price * (this.takeProfitPct / 100);
    }

    // LONG: SL ниже, TP выше; SHORT: SL выше, TP ниже
    const stopLoss   = direction === 'LONG' ? price - slDelta : price + slDelta;
    const takeProfit = direction === 'LONG' ? price + tpDelta : price - tpDelta;

    this.highestPrice = price;
    this.lowestPrice  = price;
    this.originalStopLoss = stopLoss;

    this.position = { symbol, direction, entryPrice: price, quantity, stopLoss, takeProfit, openedAt: Date.now() };
    logger.info(`Position opened: ${direction} ${symbol} @ $${price} | SL: $${stopLoss.toFixed(2)} | TP: $${takeProfit.toFixed(2)} | ATR: ${atr ? atr.toFixed(2) : 'N/A'}`);
    return this.position;
  }

  closePosition(): void {
    if (this.position) {
      logger.info(`Position closed: ${this.position.direction} ${this.position.symbol}`);
      this.position = null;
      this.highestPrice = 0;
      this.lowestPrice  = Infinity;
      this.originalStopLoss = 0;
    }
  }

  // Трейлинг стоп — вызывать каждый цикл.
  // Возвращает true если SL обновился (нужно обновить биржевой ордер).
  updateTrailingStop(currentPrice: number): boolean {
    if (!this.position) return false;
    return this.position.direction === 'SHORT'
      ? this.trailShort(currentPrice)
      : this.trailLong(currentPrice);
  }

  private trailLong(currentPrice: number): boolean {
    const pos = this.position!;
    if (currentPrice > this.highestPrice) this.highestPrice = currentPrice;

    const slPct = (pos.entryPrice - this.originalStopLoss) / pos.entryPrice;
    let slUpdated = false;

    // Фаза 1 — Breakeven: когда прибыль = риск → SL → точка входа
    const breakEvenTrigger = pos.entryPrice * (1 + slPct);
    if (currentPrice >= breakEvenTrigger && pos.stopLoss < pos.entryPrice) {
      const newSL = pos.entryPrice * 1.001;
      pos.stopLoss = newSL;
      logger.info(`Trailing LONG → Breakeven: SL $${newSL.toFixed(2)}`);
      slUpdated = true;
    }

    // Фаза 2 — Trailing: после 2×риска тащим SL за максимумом
    const trailTrigger = pos.entryPrice * (1 + slPct * 2);
    if (this.highestPrice >= trailTrigger) {
      const trailSL = this.highestPrice * (1 - slPct);
      if (trailSL > pos.stopLoss) {
        pos.stopLoss = trailSL;
        logger.info(`Trailing LONG → SL $${trailSL.toFixed(2)} (max: $${this.highestPrice.toFixed(2)}, gain: +${((this.highestPrice / pos.entryPrice - 1) * 100).toFixed(1)}%)`);
        slUpdated = true;
      }
    }

    return slUpdated;
  }

  private trailShort(currentPrice: number): boolean {
    const pos = this.position!;
    if (currentPrice < this.lowestPrice) this.lowestPrice = currentPrice;

    // slPct = расстояние SL от входа в %
    const slPct = (this.originalStopLoss - pos.entryPrice) / pos.entryPrice;
    let slUpdated = false;

    // Фаза 1 — Breakeven: когда прибыль (падение) = риск → SL → точка входа
    const breakEvenTrigger = pos.entryPrice * (1 - slPct);
    if (currentPrice <= breakEvenTrigger && pos.stopLoss > pos.entryPrice) {
      const newSL = pos.entryPrice * 0.999; // чуть ниже entry (покрываем комиссию)
      pos.stopLoss = newSL;
      logger.info(`Trailing SHORT → Breakeven: SL $${newSL.toFixed(2)}`);
      slUpdated = true;
    }

    // Фаза 2 — Trailing: после 2×риска тащим SL за минимумом
    const trailTrigger = pos.entryPrice * (1 - slPct * 2);
    if (this.lowestPrice <= trailTrigger) {
      const trailSL = this.lowestPrice * (1 + slPct);
      if (trailSL < pos.stopLoss) { // ниже — лучше для SHORT
        pos.stopLoss = trailSL;
        logger.info(`Trailing SHORT → SL $${trailSL.toFixed(2)} (min: $${this.lowestPrice.toFixed(2)}, gain: +${((pos.entryPrice / this.lowestPrice - 1) * 100).toFixed(1)}%)`);
        slUpdated = true;
      }
    }

    return slUpdated;
  }

  // Проверяем нужно ли закрыть позицию по SL/TP
  shouldClose(currentPrice: number): { close: boolean; reason: string } {
    if (!this.position) return { close: false, reason: '' };
    const pos = this.position;

    if (pos.direction === 'SHORT') {
      if (currentPrice >= pos.stopLoss) {
        const loss = ((currentPrice - pos.entryPrice) / pos.entryPrice * 100).toFixed(2);
        return { close: true, reason: `SHORT Stop Loss (+${loss}% от входа)` };
      }
      if (currentPrice <= pos.takeProfit) {
        const profit = ((pos.entryPrice - currentPrice) / pos.entryPrice * 100).toFixed(2);
        return { close: true, reason: `SHORT Take Profit (+${profit}%)` };
      }
      return { close: false, reason: '' };
    }

    // LONG
    if (currentPrice <= pos.stopLoss) {
      const loss = ((currentPrice - pos.entryPrice) / pos.entryPrice * 100).toFixed(2);
      return { close: true, reason: `Stop Loss сработал (${loss}%)` };
    }
    if (currentPrice >= pos.takeProfit) {
      const profit = ((currentPrice - pos.entryPrice) / pos.entryPrice * 100).toFixed(2);
      return { close: true, reason: `Take Profit достигнут (+${profit}%)` };
    }
    return { close: false, reason: '' };
  }

  calculatePositionSize(usdtBalance: number, price: number): number {
    const positionUsdt = Math.min(usdtBalance * 0.95, this.maxPositionUsdt);
    return positionUsdt / price;
  }

  getStats(): string {
    if (!this.position) return 'Нет открытых позиций';
    const age = Math.floor((Date.now() - this.position.openedAt) / 60000);
    return `${this.position.direction} ${this.position.symbol} @ $${this.position.entryPrice} | ${age} мин | SL: $${this.position.stopLoss.toFixed(2)} | TP: $${this.position.takeProfit.toFixed(2)}`;
  }
}
