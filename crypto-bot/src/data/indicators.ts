import { OHLCV, OrderBook } from '../exchange/binance';

export interface Indicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  ema20: number;
  ema50: number;
  ema200: number;
  bbands: { upper: number; middle: number; lower: number };
  atr: number;
  adx: number;         // ADX > 25 = сильный тренд, < 20 = боковик
  volume_ratio: number; // текущий объём vs средний
}

export interface OrderBookMetrics {
  bid_ask_spread: number;
  bid_volume: number;
  ask_volume: number;
  imbalance: number; // > 0 = больше покупателей, < 0 = продавцов
  top_bid: number;
  top_ask: number;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(...new Array(period - 1).fill(NaN));
  result.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function rsi(closes: number[], period = 14): number {
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function atr(candles: OHLCV[], period = 14): number {
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trs.push(tr);
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// Wilder smoothing (используется в ADX)
function wilderSmooth(values: number[], period: number): number {
  let smoothed = values.slice(0, period).reduce((a, b) => a + b, 0);
  for (let i = period; i < values.length; i++) {
    smoothed = smoothed - smoothed / period + values[i];
  }
  return smoothed;
}

// ADX (Average Directional Index) — сила тренда
// > 25: сильный тренд, 20-25: начало тренда, < 20: боковик
function adx(candles: OHLCV[], period = 14): number {
  if (candles.length < period * 2) return 0;

  const trs: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high, low = candles[i].low;
    const prevHigh = candles[i - 1].high, prevLow = candles[i - 1].low, prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
    trs.push(tr);
  }

  const smTR = wilderSmooth(trs, period);
  const smPlusDM = wilderSmooth(plusDMs, period);
  const smMinusDM = wilderSmooth(minusDMs, period);

  if (smTR === 0) return 0;
  const plusDI = (smPlusDM / smTR) * 100;
  const minusDI = (smMinusDM / smTR) * 100;
  const diSum = plusDI + minusDI;
  if (diSum === 0) return 0;

  return Math.abs(plusDI - minusDI) / diSum * 100;
}

export function calculateIndicators(candles: OHLCV[]): Indicators {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  // EMA
  const ema20arr = ema(closes, 20);
  const ema50arr = ema(closes, 50);
  const ema200arr = ema(closes, 200);

  // MACD (12, 26, 9)
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]).filter(v => !isNaN(v));
  const signalLine = ema(macdLine, 9);
  const macdVal = macdLine[macdLine.length - 1];
  const signalVal = signalLine[signalLine.length - 1];

  // Bollinger Bands (20, 2)
  const period = 20;
  const recentCloses = closes.slice(-period);
  const sma = recentCloses.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(recentCloses.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period);

  // Volume ratio — используем последние закрытые свечи, НЕ текущую открытую
  // (Binance возвращает текущую незакрытую свечу последней, её объём неполный)
  const closedVolumes = volumes.slice(0, -1);
  const avgVolume = closedVolumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentVolume = closedVolumes[closedVolumes.length - 1];

  return {
    rsi: rsi(closes),
    macd: {
      value: macdVal,
      signal: signalVal,
      histogram: macdVal - signalVal,
    },
    ema20: ema20arr[ema20arr.length - 1],
    ema50: ema50arr[ema50arr.length - 1],
    ema200: ema200arr[ema200arr.length - 1],
    bbands: {
      upper: sma + 2 * std,
      middle: sma,
      lower: sma - 2 * std,
    },
    atr: atr(candles),
    adx: adx(candles),
    volume_ratio: currentVolume / avgVolume,
  };
}

export function analyzeOrderBook(book: OrderBook): OrderBookMetrics {
  const topBid = book.bids[0][0];
  const topAsk = book.asks[0][0];
  const spread = ((topAsk - topBid) / topBid) * 100;

  const bidVolume = book.bids.slice(0, 10).reduce((s, [, v]) => s + v, 0);
  const askVolume = book.asks.slice(0, 10).reduce((s, [, v]) => s + v, 0);
  const total = bidVolume + askVolume;
  const imbalance = total > 0 ? (bidVolume - askVolume) / total : 0;

  return {
    bid_ask_spread: spread,
    bid_volume: bidVolume,
    ask_volume: askVolume,
    imbalance,
    top_bid: topBid,
    top_ask: topAsk,
  };
}
