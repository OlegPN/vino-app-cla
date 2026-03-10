import { Indicators, OrderBookMetrics } from '../data/indicators';
import { TradeSignal } from './hybrid';

// Стратегия: Возврат к среднему (RSI + Bollinger Bands)
export function meanReversionStrategy(ind: Indicators, obm: OrderBookMetrics, price: number): TradeSignal {
  let score = 0;
  const reasons: string[] = [];

  // RSI экстремумы — основа стратегии
  if (ind.rsi < 25) {
    score += 0.5; reasons.push(`RSI сильно перепродан (${ind.rsi.toFixed(1)}) — разворот вверх`);
  } else if (ind.rsi < 35) {
    score += 0.3; reasons.push(`RSI перепродан (${ind.rsi.toFixed(1)})`);
  } else if (ind.rsi > 75) {
    score -= 0.5; reasons.push(`RSI сильно перекуплен (${ind.rsi.toFixed(1)}) — разворот вниз`);
  } else if (ind.rsi > 65) {
    score -= 0.3; reasons.push(`RSI перекуплен (${ind.rsi.toFixed(1)})`);
  }

  // Bollinger Bands — цена у края = возврат к середине
  const bbRange = ind.bbands.upper - ind.bbands.lower;
  const bbPos = (price - ind.bbands.lower) / bbRange;

  if (bbPos < 0.1) {
    score += 0.35; reasons.push(`Цена у нижней BB (${(bbPos * 100).toFixed(0)}%) — отскок вверх`);
  } else if (bbPos < 0.2) {
    score += 0.2; reasons.push('Цена близко к нижней BB');
  } else if (bbPos > 0.9) {
    score -= 0.35; reasons.push(`Цена у верхней BB (${(bbPos * 100).toFixed(0)}%) — откат вниз`);
  } else if (bbPos > 0.8) {
    score -= 0.2; reasons.push('Цена близко к верхней BB');
  }

  // Объём при развороте
  if (ind.volume_ratio > 2 && Math.abs(score) > 0.3) {
    score *= 1.15; reasons.push('Высокий объём подтверждает разворот');
  } else if (ind.volume_ratio < 0.5) {
    score *= 0.4; reasons.push(`Низкий объём (${ind.volume_ratio.toFixed(2)}x) — разворот ненадёжен`);
  }

  // EMA200 — в глобальном медвежьем тренде требуем экстремальный RSI (<25) для BUY
  if (score > 0 && price < ind.ema200) {
    if (ind.rsi >= 25) {
      score *= 0.4; // ослабляем сигнал — только очень перепроданный RSI проходит
      reasons.push('Ниже EMA200 — BUY требует экстремального RSI < 25');
    } else {
      reasons.push('RSI экстремальный + ниже EMA200 — возможен отскок');
    }
  }

  // Стакан против тренда (ищем противодавление)
  if (score > 0 && obm.imbalance > 0.3) {
    score += 0.1; reasons.push('Покупатели в стакане поддерживают разворот');
  } else if (score < 0 && obm.imbalance < -0.3) {
    score -= 0.1; reasons.push('Продавцы в стакане поддерживают разворот');
  }

  score = Math.max(-1, Math.min(1, score));
  const confidence = Math.abs(score);
  const signal = score > 0.35 ? 'BUY' : score < -0.35 ? 'SELL' : 'HOLD';

  return { signal, confidence, mlScore: score, llmScore: 0, finalScore: score, reasons };
}
