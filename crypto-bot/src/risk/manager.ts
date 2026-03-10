import { logger } from '../utils/logger';

export interface Position {
  symbol: string;
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
  private highestPrice = 0;
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

  openPosition(symbol: string, price: number, quantity: number, atr?: number): Position {
    let stopLoss: number;
    let takeProfit: number;

    if (atr && atr > 0) {
      // ATR-based: SL = 1.5×ATR, TP = 3×ATR → Risk/Reward = 2:1
      const slDelta = Math.max(price * 0.01, Math.min(price * 0.04, atr * 1.5));
      const tpDelta = Math.max(price * 0.02, Math.min(price * 0.08, atr * 3.0));
      stopLoss = price - slDelta;
      takeProfit = price + tpDelta;
    } else {
      stopLoss = price * (1 - this.stopLossPct / 100);
      takeProfit = price * (1 + this.takeProfitPct / 100);
    }

    this.highestPrice = price;
    this.originalStopLoss = stopLoss;

    this.position = { symbol, entryPrice: price, quantity, stopLoss, takeProfit, openedAt: Date.now() };
    logger.info(`Position opened: ${symbol} @ $${price} | SL: $${stopLoss.toFixed(2)} | TP: $${takeProfit.toFixed(2)} | ATR: ${atr ? atr.toFixed(2) : 'N/A'}`);
    return this.position;
  }

  closePosition(): void {
    if (this.position) {
      logger.info(`Position closed: ${this.position.symbol}`);
      this.position = null;
      this.highestPrice = 0;
      this.originalStopLoss = 0;
    }
  }

  // Трейлинг стоп — вызывать каждый цикл.
  // Возвращает true если SL обновился (нужно обновить биржевой ордер).
  updateTrailingStop(currentPrice: number): boolean {
    if (!this.position) return false;

    if (currentPrice > this.highestPrice) {
      this.highestPrice = currentPrice;
    }

    // Расстояние SL в % от точки входа
    const slPct = (this.position.entryPrice - this.originalStopLoss) / this.position.entryPrice;
    let slUpdated = false;

    // Фаза 1 — Breakeven: когда прибыль достигла величины риска, SL → точка входа
    const breakEvenTrigger = this.position.entryPrice * (1 + slPct);
    if (currentPrice >= breakEvenTrigger && this.position.stopLoss < this.position.entryPrice) {
      const newSL = this.position.entryPrice * 1.001; // чуть выше entry (покрываем комиссию)
      this.position.stopLoss = newSL;
      logger.info(`Trailing → Breakeven: SL $${newSL.toFixed(2)} (gain +${(slPct * 100).toFixed(1)}% достигнут)`);
      slUpdated = true;
    }

    // Фаза 2 — Trailing: трейлинг на расстоянии SL% ниже максимума (после двойного риска)
    const trailTrigger = this.position.entryPrice * (1 + slPct * 2);
    if (this.highestPrice >= trailTrigger) {
      const trailSL = this.highestPrice * (1 - slPct);
      if (trailSL > this.position.stopLoss) {
        this.position.stopLoss = trailSL;
        logger.info(`Trailing → SL $${trailSL.toFixed(2)} (max: $${this.highestPrice.toFixed(2)}, gain: +${((this.highestPrice / this.position.entryPrice - 1) * 100).toFixed(1)}%)`);
        slUpdated = true;
      }
    }

    return slUpdated;
  }

  // Проверяем нужно ли закрыть позицию по SL/TP
  shouldClose(currentPrice: number): { close: boolean; reason: string } {
    if (!this.position) return { close: false, reason: '' };

    if (currentPrice <= this.position.stopLoss) {
      const loss = ((currentPrice - this.position.entryPrice) / this.position.entryPrice * 100).toFixed(2);
      return { close: true, reason: `Stop Loss сработал (${loss}%)` };
    }

    if (currentPrice >= this.position.takeProfit) {
      const profit = ((currentPrice - this.position.entryPrice) / this.position.entryPrice * 100).toFixed(2);
      return { close: true, reason: `Take Profit достигнут (+${profit}%)` };
    }

    return { close: false, reason: '' };
  }

  // Размер позиции с учётом риска
  calculatePositionSize(usdtBalance: number, price: number): number {
    const positionUsdt = Math.min(usdtBalance * 0.95, this.maxPositionUsdt);
    return positionUsdt / price;
  }

  getStats(): string {
    if (!this.position) return 'Нет открытых позиций';
    const age = Math.floor((Date.now() - this.position.openedAt) / 60000);
    return `${this.position.symbol} @ $${this.position.entryPrice} | ${age} мин | SL: $${this.position.stopLoss.toFixed(2)} | TP: $${this.position.takeProfit.toFixed(2)}`;
  }
}
