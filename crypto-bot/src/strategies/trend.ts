import { Indicators, OrderBookMetrics } from '../data/indicators';
import { TradeSignal } from './hybrid';

// Стратегия: Следование тренду (EMA Crossover + Momentum)
export function trendStrategy(ind: Indicators, obm: OrderBookMetrics, price: number): TradeSignal {
  let score = 0;
  const reasons: string[] = [];

  // Golden/Death Cross EMA 20/50
  const emaCross = ind.ema20 - ind.ema50;
  if (emaCross > 0 && price > ind.ema20) {
    score += 0.35; reasons.push(`EMA Golden Cross: EMA20 > EMA50 (+${emaCross.toFixed(0)})`);
  } else if (emaCross < 0 && price < ind.ema20) {
    score -= 0.35; reasons.push(`EMA Death Cross: EMA20 < EMA50 (${emaCross.toFixed(0)})`);
  }

  // EMA 200 - глобальный тренд
  if (price > ind.ema200) {
    score += 0.2; reasons.push('Цена выше EMA200 (бычий рынок)');
  } else {
    score -= 0.2; reasons.push('Цена ниже EMA200 (медвежий рынок)');
  }

  // MACD momentum
  if (ind.macd.histogram > 0 && ind.macd.value > 0) {
    score += 0.25; reasons.push('MACD позитивный и растёт');
  } else if (ind.macd.histogram < 0 && ind.macd.value < 0) {
    score -= 0.25; reasons.push('MACD негативный и падает');
  }

  // Объём подтверждает тренд
  if (ind.volume_ratio > 1.5) {
    score *= 1.2; reasons.push(`Объём подтверждает (${ind.volume_ratio.toFixed(1)}x)`);
  }

  // Стакан
  if (obm.imbalance > 0.2) { score += 0.1; }
  else if (obm.imbalance < -0.2) { score -= 0.1; }

  score = Math.max(-1, Math.min(1, score));
  const confidence = Math.abs(score);
  const signal = score > 0.35 ? 'BUY' : score < -0.35 ? 'SELL' : 'HOLD';

  return { signal, confidence, mlScore: score, llmScore: 0, finalScore: score, reasons };
}
