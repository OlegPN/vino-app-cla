import { Indicators, OrderBookMetrics } from '../data/indicators';
import { TradeSignal } from './hybrid';

// Стратегия: Скальпинг (быстрые сделки на дисбалансе стакана)
export function scalpingStrategy(ind: Indicators, obm: OrderBookMetrics, price: number): TradeSignal {
  let score = 0;
  const reasons: string[] = [];

  // Фильтр объёма — скальпинг требует ликвидности (блокируем при объёме < 70% нормы)
  if (ind.volume_ratio < 0.7) {
    reasons.push(`Недостаточный объём (${ind.volume_ratio.toFixed(2)}x) — скальпинг невозможен`);
    return { signal: 'HOLD', confidence: 0, mlScore: 0, llmScore: 0, finalScore: 0, reasons };
  }

  // Фильтр тренда — скальпируем только по тренду
  const emaTrendPct = (ind.ema20 - ind.ema50) / ind.ema50;
  if (emaTrendPct < -0.015) {
    // Медвежий тренд: только SELL, BUY заблокирован
    reasons.push(`EMA тренд вниз (${(emaTrendPct * 100).toFixed(1)}%) — BUY заблокирован`);
    score = Math.min(score, 0);
  } else if (emaTrendPct > 0.01) {
    score += 0.1; reasons.push(`EMA тренд бычий (+${(emaTrendPct * 100).toFixed(1)}%)`);
  }

  // EMA200 — не покупаем в глобальном медвежьем рынке
  if (price < ind.ema200 * 0.99) {
    score = Math.min(score, 0);
    reasons.push('Ниже EMA200 — глобальный медвежий рынок');
  }

  // ADX — при слабом тренде скальпинг ещё опаснее
  if (ind.adx < 12) {
    reasons.push(`ADX (${ind.adx.toFixed(0)}) — нет тренда, скальпинг невозможен`);
    return { signal: 'HOLD', confidence: 0, mlScore: 0, llmScore: 0, finalScore: 0, reasons };
  }

  // RSI перекуплен — не покупаем
  if (ind.rsi > 72) {
    score = Math.min(score, 0);
    reasons.push(`RSI перекуплен (${ind.rsi.toFixed(1)}) — BUY заблокирован`);
  } else if (ind.rsi > 40 && ind.rsi < 60) {
    score *= 1.1; reasons.push(`RSI нейтральный (${ind.rsi.toFixed(1)})`);
  }

  // Главное — дисбаланс стакана (повышен порог с 0.3 до 0.35)
  if (obm.imbalance > 0.5) {
    score += 0.4; reasons.push(`Сильные покупатели (${(obm.imbalance * 100).toFixed(0)}%)`);
  } else if (obm.imbalance > 0.35) {
    score += 0.25; reasons.push(`Покупатели доминируют (${(obm.imbalance * 100).toFixed(0)}%)`);
  } else if (obm.imbalance < -0.5) {
    score -= 0.4; reasons.push(`Сильные продавцы (${(obm.imbalance * 100).toFixed(0)}%)`);
  } else if (obm.imbalance < -0.35) {
    score -= 0.25; reasons.push(`Продавцы доминируют (${(obm.imbalance * 100).toFixed(0)}%)`);
  }

  // Спред — узкий спред лучше для скальпинга
  if (obm.bid_ask_spread < 0.01) {
    score *= 1.1; reasons.push(`Узкий спред (${obm.bid_ask_spread.toFixed(4)}%)`);
  } else if (obm.bid_ask_spread > 0.05) {
    score *= 0.6; reasons.push(`Широкий спред (${obm.bid_ask_spread.toFixed(4)}%) — риск`);
  }

  // Высокий объём усиливает сигнал
  if (ind.volume_ratio > 1.5) {
    score += Math.sign(score) * 0.2;
    reasons.push(`Высокая ликвидность (${ind.volume_ratio.toFixed(1)}x)`);
  }

  // MACD импульс
  if (Math.abs(ind.macd.histogram) > 0.0001) {
    score += Math.sign(ind.macd.histogram) * 0.15;
    reasons.push(`MACD импульс: ${ind.macd.histogram > 0 ? '↑' : '↓'}`);
  }

  score = Math.max(-1, Math.min(1, score));
  const confidence = Math.abs(score);
  // Повышен порог с 0.25 до 0.35 — только чёткие сигналы
  const signal = score > 0.35 ? 'BUY' : score < -0.35 ? 'SELL' : 'HOLD';

  return { signal, confidence, mlScore: score, llmScore: 0, finalScore: score, reasons };
}
