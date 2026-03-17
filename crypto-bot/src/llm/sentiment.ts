import axios from 'axios';
import { logger } from '../utils/logger';

export interface SentimentResult {
  score: number;       // -1 (очень медвежий) до +1 (очень бычий)
  confidence: number;  // 0-1
  reasoning: string;
  action: 'BUY' | 'SELL' | 'HOLD';
}

export interface MarketContext {
  symbol: string;
  price: number;
  priceChange24h: number;
  rsi: number;
  macdHistogram: number;
  volumeRatio: number;
  orderBookImbalance: number;
}

export async function analyzeSentiment(
  context: MarketContext,
  newsHeadlines: string[] = [],
  model?: string
): Promise<SentimentResult> {
  const newsText = newsHeadlines.length > 0
    ? `\nПоследние новости:\n${newsHeadlines.map(h => `- ${h}`).join('\n')}`
    : '\nНовости: нет данных';

  const prompt = `Ты — опытный криптотрейдер. Проанализируй рыночные данные и дай торговый сигнал.

Актив: ${context.symbol}
Текущая цена: $${context.price.toFixed(2)}
Изменение за 24ч: ${context.priceChange24h.toFixed(2)}%
RSI (14): ${context.rsi.toFixed(1)}
MACD гистограмма: ${context.macdHistogram.toFixed(4)}
Объём (отношение к среднему): ${context.volumeRatio.toFixed(2)}x
Дисбаланс стакана ордеров: ${(context.orderBookImbalance * 100).toFixed(1)}% (>0 = покупатели доминируют)
${newsText}

Ответь СТРОГО в формате JSON:
{
  "score": <число от -1 до 1>,
  "confidence": <число от 0 до 1>,
  "action": "<BUY|SELL|HOLD>",
  "reasoning": "<краткое объяснение на русском, 1-2 предложения>"
}`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model || process.env.LLM_MODEL || 'google/gemini-2.0-flash-001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/crypto-ai-bot',
        },
        timeout: 30000,
      }
    );

    const text: string = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]) as SentimentResult;
    logger.info(`LLM: ${result.action} (score: ${result.score.toFixed(2)}, conf: ${result.confidence.toFixed(2)}) — ${result.reasoning}`);
    return result;
  } catch (err) {
    logger.error(`LLM analysis failed: ${err}`);
    return { score: 0, confidence: 0, reasoning: 'LLM ошибка', action: 'HOLD' };
  }
}
