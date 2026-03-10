import 'dotenv/config';
import * as ccxt from 'ccxt';

async function test() {
  const exchange = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_SECRET_KEY,
  });
  exchange.setSandboxMode(true);

  try {
    const balance = await exchange.fetchBalance();
    console.log('✓ Подключение к Binance Testnet успешно!');
    console.log('Баланс:');
    for (const [coin, amount] of Object.entries(balance.total)) {
      if ((amount as number) > 0) console.log(`  ${coin}: ${amount}`);
    }

    const ticker = await exchange.fetchTicker('BTC/USDT');
    console.log(`\nBTC/USDT: $${ticker.last}`);
  } catch (err) {
    console.error('Ошибка:', err);
  }
}

test();
