import { Indicators, OrderBookMetrics } from '../data/indicators';
import { TradeSignal } from './hybrid';

// Стратегия: Скальпинг (быстрые сделки на дисбалансе стакана)
export function scalpingStrategy(ind: Indicators, obm: OrderBookMetrics, price: number): TradeSignal {
  let score = 0;
  const reasons: string[] = [];

  // Главное — дисбаланс стакана ордеров
  if (obm.imbalance > 0.5) {
    score += 0.4; reasons.push(`Сильные покупатели в стакане (+${(obm.imbalance * 100).toFixed(0)}%)`);
  } else if (obm.imbalance > 0.3) {
    score += 0.25; reasons.push(`Покупатели доминируют (+${(obm.imbalance * 100).toFixed(0)}%)`);
  } else if (obm.imbalance < -0.5) {
    score -= 0.4; reasons.push(`Сильные продавцы в стакане (${(obm.imbalance * 100).toFixed(0)}%)`);
  } else if (obm.imbalance < -0.3) {
    score -= 0.25; reasons.push(`Продавцы доминируют (${(obm.imbalance * 100).toFixed(0)}%)`);
  }

  // Спред — узкий спред лучше для скальпинга
  if (obm.bid_ask_spread < 0.01) {
    score *= 1.1; reasons.push(`Узкий спред (${obm.bid_ask_spread.toFixed(4)}%)`);
  } else if (obm.bid_ask_spread > 0.05) {
    score *= 0.7; reasons.push(`Широкий спред — риск (${obm.bid_ask_spread.toFixed(4)}%)`);
  }

  // Объём — нужна ликвидность
  if (ind.volume_ratio > 1.5) {
    score += Math.sign(score) * 0.2;
    reasons.push(`Высокая ликвидность (${ind.volume_ratio.toFixed(1)}x)`);
  } else if (ind.volume_ratio < 0.5) {
    score *= 0.5; reasons.push('Низкий объём — опасно для скальпинга');
  }

  // RSI не в экстремуме — скальпируем в диапазоне
  if (ind.rsi > 40 && ind.rsi < 60) {
    score *= 1.1; reasons.push(`RSI в нейтральной зоне (${ind.rsi.toFixed(1)}) — хорошо для скальпинга`);
  }

  // MACD краткосрочный импульс
  if (Math.abs(ind.macd.histogram) > 0.0001) {
    score += Math.sign(ind.macd.histogram) * 0.15;
    reasons.push(`MACD импульс: ${ind.macd.histogram > 0 ? '↑' : '↓'}`);
  }

  score = Math.max(-1, Math.min(1, score));
  const confidence = Math.abs(score);
  // Скальпинг активирует при более низком пороге
  const signal = score > 0.25 ? 'BUY' : score < -0.25 ? 'SELL' : 'HOLD';

  return { signal, confidence, mlScore: score, llmScore: 0, finalScore: score, reasons };
}
