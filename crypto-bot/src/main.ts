import 'dotenv/config';
import { BinanceClient } from './exchange/binance';
import { calculateIndicators, analyzeOrderBook } from './data/indicators';
import { analyzeSentiment, MarketContext } from './llm/sentiment';
import { combineSignals } from './strategies/hybrid';
import { RiskManager } from './risk/manager';
import { logger } from './utils/logger';
import { startDashboard, updateState, addTrade } from './dashboard/server';

const SYMBOL = process.env.TRADING_PAIR || 'BTC/USDT';
const TIMEFRAME = process.env.TIMEFRAME || '1h';
const INTERVAL_MS = 60_000;
const DASHBOARD_PORT = 4200;

const binance = new BinanceClient();
const riskManager = new RiskManager();

async function runCycle() {
  try {
    logger.info(`--- Цикл анализа ${SYMBOL} ---`);

    // 1. Данные
    const [candles, orderBook, ticker] = await Promise.all([
      binance.getOHLCV(SYMBOL, TIMEFRAME, 200),
      binance.getOrderBook(SYMBOL, 20),
      binance.getTicker(SYMBOL),
    ]);

    const price = ticker.last;
    const priceChange24h = ticker.percentage ?? 0;

    // 2. Индикаторы
    const indicators = calculateIndicators(candles);
    const obMetrics = analyzeOrderBook(orderBook);

    // 3. LLM анализ
    const context: MarketContext = {
      symbol: SYMBOL,
      price,
      priceChange24h,
      rsi: indicators.rsi,
      macdHistogram: indicators.macd.histogram,
      volumeRatio: indicators.volume_ratio,
      orderBookImbalance: obMetrics.imbalance,
    };
    const sentiment = await analyzeSentiment(context);

    // 4. Сигнал
    const tradeSignal = combineSignals(indicators, obMetrics, price, sentiment);

    logger.info(`Цена: $${price} | RSI: ${indicators.rsi.toFixed(1)} | Сигнал: ${tradeSignal.signal} (${(tradeSignal.confidence * 100).toFixed(0)}%)`);
    tradeSignal.reasons.forEach(r => logger.info(`  → ${r}`));

    // 5. Баланс для дашборда
    const balance = await binance.getBalance();

    // 6. Позиция
    const pos = riskManager.getPosition();
    let posState = { active: false } as {
      active: boolean; entryPrice?: number; quantity?: number;
      stopLoss?: number; takeProfit?: number; pnl?: number; openedAt?: number;
    };

    if (pos) {
      const pnl = (price - pos.entryPrice) * pos.quantity;
      posState = { active: true, ...pos, pnl };

      const { close, reason } = riskManager.shouldClose(price);
      if (close) {
        logger.info(`Закрываем позицию: ${reason}`);
        await binance.placeMarketSell(SYMBOL, pos.quantity);
        addTrade({ time: Date.now(), side: 'SELL', price, quantity: pos.quantity, pnl, reason });
        riskManager.closePosition();
        posState = { active: false };
      }
    } else if (tradeSignal.signal === 'BUY' && tradeSignal.confidence >= 0.3) {
      const usdtBalance = balance.USDT || 0;
      if (usdtBalance >= 10) {
        const maxUsdt = Math.min(usdtBalance * 0.95, Number(process.env.MAX_POSITION_SIZE_USDT) || 100);
        const quantity = riskManager.calculatePositionSize(usdtBalance, price);
        logger.info(`BUY: ${quantity.toFixed(5)} BTC @ $${price}`);
        await binance.placeMarketBuy(SYMBOL, maxUsdt);
        riskManager.openPosition(SYMBOL, price, quantity);
        addTrade({ time: Date.now(), side: 'BUY', price, quantity });
        const newPos = riskManager.getPosition()!;
        posState = { active: true, ...newPos, pnl: 0 };
      }
    }

    // 7. Обновляем дашборд
    updateState({
      pair: SYMBOL,
      price,
      priceChange24h,
      rsi: indicators.rsi,
      macd: indicators.macd.histogram,
      ema20: indicators.ema20,
      ema50: indicators.ema50,
      volumeRatio: indicators.volume_ratio,
      obImbalance: obMetrics.imbalance,
      signal: tradeSignal.signal,
      signalConfidence: tradeSignal.confidence,
      mlScore: tradeSignal.mlScore,
      llmScore: tradeSignal.llmScore,
      llmReason: sentiment.reasoning,
      balance: { USDT: balance.USDT || 0, BTC: balance.BTC || 0 },
      position: posState,
      status: 'running',
    });

  } catch (err) {
    logger.error(`Ошибка цикла: ${err}`);
    updateState({ status: 'error' });
  }
}

async function main() {
  logger.info('=== CryptoAI Bot запущен ===');
  logger.info(`Пара: ${SYMBOL} | Таймфрейм: ${TIMEFRAME}`);

  startDashboard(DASHBOARD_PORT);

  try {
    const balance = await binance.getBalance();
    logger.info(`USDT: ${balance.USDT} | BTC: ${balance.BTC || 0}`);
    updateState({ balance: { USDT: balance.USDT || 0, BTC: balance.BTC || 0 } });
  } catch (err) {
    logger.error(`Ошибка подключения: ${err}`);
    process.exit(1);
  }

  await runCycle();
  setInterval(runCycle, INTERVAL_MS);
}

main();
