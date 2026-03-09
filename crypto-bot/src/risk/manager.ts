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

  openPosition(symbol: string, price: number, quantity: number): Position {
    this.position = {
      symbol,
      entryPrice: price,
      quantity,
      stopLoss: price * (1 - this.stopLossPct / 100),
      takeProfit: price * (1 + this.takeProfitPct / 100),
      openedAt: Date.now(),
    };
    logger.info(`Position opened: ${symbol} @ $${price} | SL: $${this.position.stopLoss.toFixed(2)} | TP: $${this.position.takeProfit.toFixed(2)}`);
    return this.position;
  }

  closePosition(): void {
    if (this.position) {
      logger.info(`Position closed: ${this.position.symbol}`);
      this.position = null;
    }
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
