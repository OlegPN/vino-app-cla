import { Indicators, OrderBookMetrics } from '../data/indicators';
import { SentimentResult } from '../llm/sentiment';
import { logger } from '../utils/logger';

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export interface TradeSignal {
  signal: Signal;
  confidence: number;    // 0-1
  mlScore: number;       // технический сигнал
  llmScore: number;      // LLM сигнал
  finalScore: number;    // итоговый
  reasons: string[];
}

// Технический анализ — возвращает скор от -1 до +1
function technicalScore(ind: Indicators, obm: OrderBookMetrics, price: number): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // RSI
  if (ind.rsi < 30) { score += 0.3; reasons.push(`RSI перепродан (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi > 70) { score -= 0.3; reasons.push(`RSI перекуплен (${ind.rsi.toFixed(1)})`); }
  else if (ind.rsi < 45) { score += 0.1; }
  else if (ind.rsi > 55) { score -= 0.1; }

  // MACD
  if (ind.macd.histogram > 0 && ind.macd.value > ind.macd.signal) {
    score += 0.2; reasons.push('MACD бычий кроссовер');
  } else if (ind.macd.histogram < 0 && ind.macd.value < ind.macd.signal) {
    score -= 0.2; reasons.push('MACD медвежий кроссовер');
  }

  // EMA тренд
  if (price > ind.ema20 && ind.ema20 > ind.ema50) {
    score += 0.2; reasons.push('Цена выше EMA20 > EMA50 (бычий тренд)');
  } else if (price < ind.ema20 && ind.ema20 < ind.ema50) {
    score -= 0.2; reasons.push('Цена ниже EMA20 < EMA50 (медвежий тренд)');
  }

  // Bollinger Bands
  if (price < ind.bbands.lower) { score += 0.15; reasons.push('Цена ниже нижней BB'); }
  else if (price > ind.bbands.upper) { score -= 0.15; reasons.push('Цена выше верхней BB'); }

  // Объём — усиляет сигнал при высоком, ослабляет при низком
  if (ind.volume_ratio > 2) { score *= 1.2; reasons.push(`Высокий объём (${ind.volume_ratio.toFixed(1)}x)`); }
  else if (ind.volume_ratio < 0.5) {
    score *= 0.3;
    reasons.push(`Критически низкий объём (${ind.volume_ratio.toFixed(2)}x) — сигнал ненадёжен`);
  } else if (ind.volume_ratio < 0.7) {
    score *= 0.6;
    reasons.push(`Низкий объём (${ind.volume_ratio.toFixed(2)}x)`);
  }

  // EMA200 — не открываем лонг в глобальном медвежьем рынке
  if (price < ind.ema200 * 0.99) {
    score = Math.min(score, 0.05); // ограничиваем BUY скор
    reasons.push('Цена ниже EMA200 — глобальный медвежий рынок');
  }

  // ADX — усиляем сигнал в тренде, ослабляем в боковике
  if (ind.adx < 15) {
    score *= 0.5;
    reasons.push(`ADX (${ind.adx.toFixed(0)}) — боковик, сигналы ненадёжны`);
  } else if (ind.adx > 30) {
    score *= 1.15;
    reasons.push(`ADX (${ind.adx.toFixed(0)}) — сильный тренд`);
  }

  // Стакан
  if (obm.imbalance > 0.3) { score += 0.15; reasons.push(`Стакан: покупатели (${(obm.imbalance * 100).toFixed(0)}%)`); }
  else if (obm.imbalance < -0.3) { score -= 0.15; reasons.push(`Стакан: продавцы (${(obm.imbalance * 100).toFixed(0)}%)`); }

  return { score: Math.max(-1, Math.min(1, score)), reasons };
}

export function combineSignals(
  ind: Indicators,
  obm: OrderBookMetrics,
  price: number,
  sentiment: SentimentResult
): TradeSignal {
  const { score: mlScore, reasons: mlReasons } = technicalScore(ind, obm, price);
  const llmScore = sentiment.score;

  // Веса: 60% технический + 40% LLM
  const llmWeight = sentiment.confidence * 0.4;
  const mlWeight = 0.6;
  const finalScore = mlScore * mlWeight + llmScore * llmWeight;

  const reasons = [...mlReasons, `LLM: ${sentiment.reasoning}`];

  // Определяем сигнал
  let signal: Signal = 'HOLD';
  const confidence = Math.abs(finalScore);

  if (finalScore > 0.4) signal = 'BUY';
  else if (finalScore < -0.4) signal = 'SELL';

  logger.info(`Signal: ${signal} | ML: ${mlScore.toFixed(2)} | LLM: ${llmScore.toFixed(2)} | Final: ${finalScore.toFixed(2)} | Conf: ${confidence.toFixed(2)}`);

  return { signal, confidence, mlScore, llmScore, finalScore, reasons };
}
