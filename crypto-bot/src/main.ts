import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { BinanceClient } from './exchange/binance';
import { calculateIndicators, analyzeOrderBook } from './data/indicators';
import { analyzeSentiment, MarketContext } from './llm/sentiment';
import { combineSignals } from './strategies/hybrid';
import { trendStrategy } from './strategies/trend';
import { meanReversionStrategy } from './strategies/meanReversion';
import { scalpingStrategy } from './strategies/scalping';
import { RiskManager } from './risk/manager';
import { PnLTracker } from './risk/pnlTracker';
import { logger } from './utils/logger';
import { startDashboard, updateState, sendNotification, onCommand, StrategyName, AVAILABLE_PAIRS } from './dashboard/server';
import type { TradeSignal } from './strategies/hybrid';

const DASHBOARD_PORT = 4200;
const BOT_STATE_FILE = path.join('logs', 'bot-settings.json');

// Загружаем сохранённые настройки или берём из .env
function loadSettings(): { pair: string; pairStrategies: Record<string, StrategyName> } {
  const defaultStrategies = (): Record<string, StrategyName> =>
    Object.fromEntries(AVAILABLE_PAIRS.map(p => [p, 'hybrid'])) as Record<string, StrategyName>;

  try {
    if (fs.existsSync(BOT_STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOT_STATE_FILE, 'utf-8'));
      const valid: StrategyName[] = ['hybrid', 'trend', 'meanReversion', 'scalping'];
      const pair = AVAILABLE_PAIRS.includes(data.pair) ? data.pair : (process.env.TRADING_PAIR || 'BTC/USDT');

      let pairStrategies: Record<string, StrategyName>;
      if (data.pairStrategies && typeof data.pairStrategies === 'object') {
        // Новый формат: per-pair стратегии
        pairStrategies = Object.fromEntries(
          AVAILABLE_PAIRS.map(p => [p, valid.includes(data.pairStrategies[p]) ? data.pairStrategies[p] : 'hybrid'])
        ) as Record<string, StrategyName>;
      } else {
        // Старый формат: одна стратегия — применяем ко всем парам
        const strat = valid.includes(data.strategy) ? data.strategy : 'hybrid';
        pairStrategies = Object.fromEntries(AVAILABLE_PAIRS.map(p => [p, strat])) as Record<string, StrategyName>;
      }

      logger.info(`Восстановлены настройки: ${pair} | ${pairStrategies[pair]}`);
      return { pair, pairStrategies };
    }
  } catch { /* файла нет, используем дефолты */ }

  return { pair: process.env.TRADING_PAIR || 'BTC/USDT', pairStrategies: defaultStrategies() };
}

function saveSettings() {
  try {
    fs.mkdirSync('logs', { recursive: true });
    fs.writeFileSync(BOT_STATE_FILE, JSON.stringify({ pair: currentPair, pairStrategies, updatedAt: Date.now() }, null, 2));
  } catch (e) { logger.warn(`Не удалось сохранить настройки: ${e}`); }
}

const savedSettings = loadSettings();
let currentPair = savedSettings.pair;
let pairStrategies: Record<string, StrategyName> = savedSettings.pairStrategies;
let TIMEFRAME = '1h';
let isRunning = false;
let cycleVersion = 0; // инкрементируется при restartCycle, чтобы прервать старый цикл

function getStrategy(pair: string): StrategyName {
  return pairStrategies[pair] || 'hybrid';
}

const binance = new BinanceClient();
const riskManager = new RiskManager();
const pnlTracker = new PnLTracker();

function getTimeframe(strategy: StrategyName): string {
  return strategy === 'scalping' ? '5m' : '1h';
}

function runSignal(strategy: StrategyName, ind: ReturnType<typeof calculateIndicators>, obm: ReturnType<typeof analyzeOrderBook>, price: number): TradeSignal {
  switch (strategy) {
    case 'trend':        return trendStrategy(ind, obm, price);
    case 'meanReversion': return meanReversionStrategy(ind, obm, price);
    case 'scalping':     return scalpingStrategy(ind, obm, price);
    default:             return { signal: 'HOLD', confidence: 0, mlScore: 0, llmScore: 0, finalScore: 0, reasons: [] };
  }
}

async function runCycle() {
  if (isRunning) return;
  isRunning = true;
  const myVersion = cycleVersion; // запоминаем версию — если сменится, прерываем цикл

  try {
    const pair = currentPair;
    const strategy = getStrategy(pair);
    TIMEFRAME = getTimeframe(strategy);

    logger.info(`--- ${pair} | ${strategy} | ${TIMEFRAME} ---`);

    const [candles, orderBook, ticker] = await Promise.all([
      binance.getOHLCV(pair, TIMEFRAME, 200),
      binance.getOrderBook(pair, 20),
      binance.getTicker(pair),
    ]);

    // Если пара/стратегия сменилась пока мы ждали — выходим
    if (myVersion !== cycleVersion) { isRunning = false; return; }

    const price = ticker.last;
    const priceChange24h = ticker.percentage ?? 0;
    const indicators = calculateIndicators(candles);
    const obMetrics = analyzeOrderBook(orderBook);

    // Выбираем стратегию
    let tradeSignal: TradeSignal;
    let llmReason = '';

    if (strategy === 'hybrid') {
      const context: MarketContext = {
        symbol: pair, price, priceChange24h,
        rsi: indicators.rsi,
        macdHistogram: indicators.macd.histogram,
        volumeRatio: indicators.volume_ratio,
        orderBookImbalance: obMetrics.imbalance,
      };
      const sentiment = await analyzeSentiment(context);
      if (myVersion !== cycleVersion) { isRunning = false; return; } // прерываем после медленного LLM
      tradeSignal = combineSignals(indicators, obMetrics, price, sentiment);
      llmReason = sentiment.reasoning;
    } else {
      tradeSignal = runSignal(strategy, indicators, obMetrics, price);
      llmReason = tradeSignal.reasons.join('. ');
    }

    logger.info(`Цена: $${price} | Сигнал: ${tradeSignal.signal} (${(tradeSignal.confidence * 100).toFixed(0)}%)`);
    tradeSignal.reasons.forEach(r => logger.info(`  → ${r}`));

    // Баланс
    const balance = await binance.getBalance();
    // Проверяем после каждого await — пара могла смениться
    if (myVersion !== cycleVersion) { isRunning = false; return; }
    pnlTracker.setStartBalance(balance.USDT || 0);

    // Позиция
    const pos = riskManager.getPosition();
    let posState: BotState['position'] = { active: false };

    if (pos) {
      // Получаем актуальную цену для пары позиции (даже если сейчас активна другая пара)
      let posPrice = price;
      if (pos.symbol !== pair) {
        try {
          const posTicker = await binance.getTicker(pos.symbol);
          posPrice = posTicker.last;
          logger.info(`SL/TP мониторинг ${pos.symbol}: $${posPrice} (активна пара ${pair})`);
        } catch (e) {
          logger.warn(`Не удалось получить цену ${pos.symbol} для SL/TP: ${e}`);
        }
        if (myVersion !== cycleVersion) { isRunning = false; return; }
      }

      // Трейлинг стоп — обновляем SL по максимуму, обновляем биржевой ордер если SL сдвинулся
      const slUpdated = riskManager.updateTrailingStop(posPrice);
      if (slUpdated) {
        const updatedPos = riskManager.getPosition()!;
        binance.cancelAllOrders(updatedPos.symbol).then(() =>
          binance.placeStopLoss(updatedPos.symbol, updatedPos.quantity, updatedPos.stopLoss)
            .catch(e => logger.warn(`Trailing SL order update failed: ${e}`))
        ).catch(() => {});
      }

      const pnl = (posPrice - pos.entryPrice) * pos.quantity;
      posState = { active: true, ...riskManager.getPosition()!, pnl };

      const { close, reason } = riskManager.shouldClose(posPrice);
      if (close) {
        logger.info(`Закрываем ${pos.symbol}: ${reason}`);
        await binance.cancelAllOrders(pos.symbol); // снимаем биржевой SL ордер
        await binance.placeMarketSell(pos.symbol, pos.quantity);
        pnlTracker.addSell(pos.symbol, getStrategy(pos.symbol), posPrice, pos.quantity, pos.entryPrice, reason);
        riskManager.closePosition();
        posState = { active: false };
      }
    } else if (tradeSignal.signal === 'BUY' && tradeSignal.confidence >= 0.45 && indicators.volume_ratio >= 0.7) {
      const usdtBalance = balance.USDT || 0;
      if (usdtBalance >= 10) {
        // Финальная проверка перед торговой операцией — не торгуем на старой паре
        if (myVersion !== cycleVersion) { isRunning = false; return; }
        const maxUsdt = Math.min(usdtBalance * 0.95, Number(process.env.MAX_POSITION_SIZE_USDT) || 100);
        const quantity = riskManager.calculatePositionSize(usdtBalance, price);
        await binance.placeMarketBuy(pair, maxUsdt);
        const openedPos = riskManager.openPosition(pair, price, quantity, indicators.atr);
        // Размещаем биржевой стоп-ордер — сработает точно по уровню SL без задержки опроса
        binance.placeStopLoss(pair, quantity, openedPos.stopLoss).catch(e =>
          logger.warn(`Не удалось разместить STOP_LOSS ордер: ${e}`)
        );
        pnlTracker.addBuy(pair, strategy, price, quantity);
        const newPos = riskManager.getPosition()!;
        posState = { active: true, ...newPos, pnl: 0 };
      }
    }

    // Финальная проверка перед отправкой в дашборд — не затираем актуальное состояние
    if (myVersion !== cycleVersion) { isRunning = false; return; }

    // Обновляем дашборд
    const pnlStats = pnlTracker.getStats(balance.USDT || 0);

    updateState({
      pair, strategy,
      pairStrategies: { ...pairStrategies },
      price, priceChange24h,
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
      llmReason,
      balance: { USDT: balance.USDT || 0, ...(balance[pair.split('/')[0]] ? { [pair.split('/')[0]]: balance[pair.split('/')[0]] } : {}) },
      position: posState,
      trades: pnlTracker.getRecentTrades(20),
      pnl: pnlStats,
      status: 'running',
    });

  } catch (err) {
    logger.error(`Ошибка: ${err}`);
    updateState({ status: 'error' });
  } finally {
    isRunning = false;
  }
}

// Интервал зависит от стратегии текущей пары
function getCycleInterval(): number {
  return getStrategy(currentPair) === 'scalping' ? 15_000 : 60_000;
}

let cycleTimer: ReturnType<typeof setInterval>;

function restartCycle() {
  clearInterval(cycleTimer);
  cycleVersion++;   // инвалидируем текущий цикл — он сам прервётся
  isRunning = false; // немедленно разрешаем запуск нового цикла
  const ms = getCycleInterval();
  logger.info(`Цикл: каждые ${ms / 1000}с | Пара: ${currentPair} | Стратегия: ${getStrategy(currentPair)}`);
  runCycle();
  cycleTimer = setInterval(runCycle, ms);
}

async function main() {
  logger.info('=== CryptoAI Bot запущен ===');

  startDashboard(DASHBOARD_PORT);

  // Сразу отдаём в дашборд сохранённые настройки — до завершения первого цикла
  updateState({ pair: currentPair, strategy: getStrategy(currentPair), pairStrategies: { ...pairStrategies }, status: 'waiting', signal: 'WAITING', signalConfidence: 0 });

  // Команды из браузера
  onCommand((cmd) => {
    if (cmd.type === 'setPair' && AVAILABLE_PAIRS.includes(cmd.value)) {
      logger.info(`Смена пары: ${currentPair} → ${cmd.value}`);
      currentPair = cmd.value;
      saveSettings();
      // Мгновенная реакция UI — не ждём завершения цикла
      updateState({ pair: cmd.value, strategy: getStrategy(cmd.value), pairStrategies: { ...pairStrategies }, status: 'waiting', signal: 'WAITING', signalConfidence: 0, price: 0, priceChange24h: 0 });
      restartCycle();
    }
    if (cmd.type === 'setStrategy') {
      logger.info(`Смена стратегии для ${currentPair}: ${getStrategy(currentPair)} → ${cmd.value}`);
      pairStrategies[currentPair] = cmd.value as StrategyName;
      saveSettings();
      // Мгновенная реакция UI
      updateState({ strategy: cmd.value as StrategyName, pairStrategies: { ...pairStrategies }, status: 'waiting', signal: 'WAITING', signalConfidence: 0 });
      restartCycle();
    }
  });

  try {
    const balance = await binance.getBalance();
    logger.info(`USDT: ${balance.USDT} | ${currentPair.split('/')[0]}: ${balance[currentPair.split('/')[0]] || 0}`);
    pnlTracker.setStartBalance(balance.USDT || 0);
  } catch (err) {
    logger.error(`Ошибка подключения: ${err}`);
    process.exit(1);
  }

  restartCycle();
}

// Типы для updateState
type BotState = Parameters<typeof updateState>[0] & { pair: string; strategy: StrategyName };

main();
