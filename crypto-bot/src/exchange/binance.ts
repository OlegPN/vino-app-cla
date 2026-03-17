import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBook {
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

export interface Balance {
  USDT: number;
  [coin: string]: number;
}

const BASE_URL         = 'https://testnet.binance.vision';
const FUTURES_BASE_URL = process.env.BINANCE_TESTNET === 'true'
  ? 'https://testnet.binancefuture.com'
  : 'https://fapi.binance.com';

export class BinanceClient {
  private apiKey: string;
  private secret: string;
  public readonly futuresMode: boolean;

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY ?? '';
    this.secret = process.env.BINANCE_SECRET_KEY ?? '';
    this.futuresMode = process.env.BINANCE_FUTURES === 'true';
    if (process.env.BINANCE_TESTNET === 'true') {
      logger.info(`Binance Testnet mode enabled${this.futuresMode ? ' (FUTURES)' : ' (SPOT)'}`);
    }
    if (this.futuresMode) {
      logger.info(`Futures endpoint: ${FUTURES_BASE_URL}`);
    }
  }

  private sign(query: string): string {
    return crypto.createHmac('sha256', this.secret).update(query).digest('hex');
  }

  private async publicGet(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${path}${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return res.json();
  }

  private async privateGet(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const serverTime = await this.getServerTime();
    const qs = new URLSearchParams({ ...params, timestamp: String(serverTime) }).toString();
    const sig = this.sign(qs);
    const url = `${BASE_URL}${path}?${qs}&signature=${sig}`;
    const res = await fetch(url, {
      headers: { 'X-MBX-APIKEY': this.apiKey },
      signal: AbortSignal.timeout(15000),
    });
    return res.json();
  }

  private async privatePost(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const serverTime = await this.getServerTime();
    const qs = new URLSearchParams({ ...params, timestamp: String(serverTime) }).toString();
    const sig = this.sign(qs);
    const url = `${BASE_URL}${path}?${qs}&signature=${sig}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': this.apiKey },
      signal: AbortSignal.timeout(15000),
    });
    return res.json();
  }

  private async privateDelete(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const serverTime = await this.getServerTime();
    const qs = new URLSearchParams({ ...params, timestamp: String(serverTime) }).toString();
    const sig = this.sign(qs);
    const url = `${BASE_URL}${path}?${qs}&signature=${sig}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'X-MBX-APIKEY': this.apiKey },
      signal: AbortSignal.timeout(15000),
    });
    return res.json();
  }

  async getServerTime(): Promise<number> {
    const data = await this.publicGet('/api/v3/time') as { serverTime: number };
    return data.serverTime;
  }

  async getOHLCV(symbol: string, interval: string, limit = 200): Promise<OHLCV[]> {
    const data = await this.publicGet('/api/v3/klines', {
      symbol: symbol.replace('/', ''),
      interval,
      limit: String(limit),
    }) as number[][];
    return data.map(c => ({
      timestamp: c[0],
      open: parseFloat(String(c[1])),
      high: parseFloat(String(c[2])),
      low: parseFloat(String(c[3])),
      close: parseFloat(String(c[4])),
      volume: parseFloat(String(c[5])),
    }));
  }

  async getOrderBook(symbol: string, limit = 20): Promise<OrderBook> {
    const data = await this.publicGet('/api/v3/depth', {
      symbol: symbol.replace('/', ''),
      limit: String(limit),
    }) as { bids: string[][]; asks: string[][] };
    return {
      bids: data.bids.map(([p, q]) => [parseFloat(p), parseFloat(q)]),
      asks: data.asks.map(([p, q]) => [parseFloat(p), parseFloat(q)]),
      timestamp: Date.now(),
    };
  }

  async getBalance(): Promise<Balance> {
    const data = await this.privateGet('/api/v3/account') as {
      balances: { asset: string; free: string }[];
    };
    const result: Balance = { USDT: 0 };
    for (const { asset, free } of data.balances) {
      const amount = parseFloat(free);
      if (amount > 0) result[asset] = amount;
    }
    return result;
  }

  async getTicker(symbol: string): Promise<{ last: number; percentage: number }> {
    const data = await this.publicGet('/api/v3/ticker/24hr', {
      symbol: symbol.replace('/', ''),
    }) as { lastPrice: string; priceChangePercent: string };
    return {
      last: parseFloat(data.lastPrice),
      percentage: parseFloat(data.priceChangePercent),
    };
  }

  async placeMarketBuy(symbol: string, usdtAmount: number): Promise<{ fillPrice: number; quantity: number }> {
    const ticker = await this.getTicker(symbol);
    const estimatedPrice = ticker.last;
    const rawQty = usdtAmount / estimatedPrice;
    const quantity = parseFloat(rawQty.toFixed(5));
    logger.info(`BUY ${quantity} ${symbol} @ ~$${estimatedPrice}`);
    const resp = await this.privatePost('/api/v3/order', {
      symbol: symbol.replace('/', ''),
      side: 'BUY',
      type: 'MARKET',
      quantity: String(quantity),
    }) as { fills?: { price: string; qty: string }[]; executedQty?: string };

    // Вычисляем средневзвешенную цену исполнения
    let fillPrice = estimatedPrice;
    let filledQty = quantity;
    if (resp.fills && resp.fills.length > 0) {
      const totalQty = resp.fills.reduce((s, f) => s + parseFloat(f.qty), 0);
      fillPrice = resp.fills.reduce((s, f) => s + parseFloat(f.price) * parseFloat(f.qty), 0) / totalQty;
      filledQty = totalQty;
      logger.info(`BUY: ${filledQty.toFixed(5)} ${symbol.split('/')[0]} @ $${fillPrice.toFixed(2)} (оценка $${estimatedPrice})`);
    }
    return { fillPrice, quantity: filledQty };
  }

  async placeMarketSell(symbol: string, quantity: number) {
    const qty = parseFloat(quantity.toFixed(5));
    logger.info(`SELL ${qty} ${symbol}`);
    return this.privatePost('/api/v3/order', {
      symbol: symbol.replace('/', ''),
      side: 'SELL',
      type: 'MARKET',
      quantity: String(qty),
    });
  }

  async cancelOrder(orderId: string, symbol: string) {
    return this.privateDelete('/api/v3/order', {
      symbol: symbol.replace('/', ''),
      orderId,
    });
  }

  async cancelAllOrders(symbol: string) {
    try {
      return await this.privateDelete('/api/v3/openOrders', {
        symbol: symbol.replace('/', ''),
      });
    } catch (e) {
      logger.warn(`cancelAllOrders ${symbol}: ${e}`);
    }
  }

  // Размещает рыночный стоп-ордер на бирже (срабатывает точно по stopPrice)
  private async futuresPost(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const serverTime = await this.getServerTime();
    const qs = new URLSearchParams({ ...params, timestamp: String(serverTime) }).toString();
    const sig = this.sign(qs);
    const url = `${FUTURES_BASE_URL}${path}?${qs}&signature=${sig}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': this.apiKey },
      signal: AbortSignal.timeout(15000),
    });
    return res.json();
  }

  private async futuresDelete(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const serverTime = await this.getServerTime();
    const qs = new URLSearchParams({ ...params, timestamp: String(serverTime) }).toString();
    const sig = this.sign(qs);
    const url = `${FUTURES_BASE_URL}${path}?${qs}&signature=${sig}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'X-MBX-APIKEY': this.apiKey },
      signal: AbortSignal.timeout(15000),
    });
    return res.json();
  }

  // Открыть SHORT (фьючерсы: SELL MARKET)
  async openShort(symbol: string, usdtAmount: number): Promise<{ fillPrice: number; quantity: number }> {
    const ticker = await this.getTicker(symbol);
    const estimatedPrice = ticker.last;
    const rawQty = usdtAmount / estimatedPrice;
    const quantity = parseFloat(rawQty.toFixed(5));
    logger.info(`SHORT OPEN ${quantity} ${symbol} @ ~$${estimatedPrice}`);
    const resp = await this.futuresPost('/fapi/v1/order', {
      symbol: symbol.replace('/', ''),
      side: 'SELL',
      type: 'MARKET',
      quantity: String(quantity),
    }) as { avgPrice?: string; executedQty?: string };
    const fillPrice = resp.avgPrice ? parseFloat(resp.avgPrice) : estimatedPrice;
    const filledQty  = resp.executedQty ? parseFloat(resp.executedQty) : quantity;
    logger.info(`SHORT opened: ${filledQty} ${symbol} @ $${fillPrice}`);
    return { fillPrice, quantity: filledQty };
  }

  // Закрыть SHORT (фьючерсы: BUY MARKET reduceOnly)
  async closeShort(symbol: string, quantity: number): Promise<void> {
    const qty = parseFloat(quantity.toFixed(5));
    logger.info(`SHORT CLOSE ${qty} ${symbol}`);
    await this.futuresPost('/fapi/v1/order', {
      symbol: symbol.replace('/', ''),
      side: 'BUY',
      type: 'MARKET',
      quantity: String(qty),
      reduceOnly: 'true',
    });
  }

  // Стоп-ордер для фьючерсной позиции (LONG или SHORT)
  async placeFuturesStopLoss(symbol: string, direction: 'LONG' | 'SHORT', stopPrice: number): Promise<void> {
    const sp   = stopPrice.toFixed(2);
    const side = direction === 'LONG' ? 'SELL' : 'BUY'; // закрываем позицию
    logger.info(`Futures SL ${direction} ${symbol}: ${side} @ $${sp}`);
    await this.futuresPost('/fapi/v1/order', {
      symbol: symbol.replace('/', ''),
      side,
      type: 'STOP_MARKET',
      stopPrice: sp,
      closePosition: 'true',
    });
  }

  // Отменить все фьючерсные ордера
  async cancelAllFuturesOrders(symbol: string): Promise<void> {
    try {
      await this.futuresDelete('/fapi/v1/allOpenOrders', { symbol: symbol.replace('/', '') });
    } catch (e) {
      logger.warn(`cancelAllFuturesOrders ${symbol}: ${e}`);
    }
  }

  async placeStopLoss(symbol: string, quantity: number, stopPrice: number) {
    const qty = parseFloat(quantity.toFixed(5));
    // stopPrice нужно округлить до 2 знаков для большинства пар
    const sp = stopPrice.toFixed(2);
    logger.info(`STOP_LOSS ордер: SELL ${qty} ${symbol} @ stopPrice $${sp}`);
    return this.privatePost('/api/v3/order', {
      symbol: symbol.replace('/', ''),
      side: 'SELL',
      type: 'STOP_LOSS',
      quantity: String(qty),
      stopPrice: sp,
    });
  }

  async getOpenOrders(symbol: string) {
    return this.privateGet('/api/v3/openOrders', {
      symbol: symbol.replace('/', ''),
    });
  }
}
