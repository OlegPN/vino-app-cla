import { WebSocket } from 'ws';
const ws = new WebSocket('wss://aibot.claw.su');
let currentTest = 0;

ws.on('open', () => {
  console.log('Connected');
  runNext();
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'state') {
    const s = msg.data;
    console.log(`  STATE: pair=${s.pair} strategy=${s.strategy} status=${s.status} price=${s.price}`);
  }
});

ws.on('error', (err) => {
  console.error('WS ERROR:', err.message);
});

const tests = [
  {type:'setPair', value:'ETH/USDT'},
  {type:'setPair', value:'SOL/USDT'},
  {type:'setPair', value:'BNB/USDT'},
  {type:'setPair', value:'XRP/USDT'},
  {type:'setPair', value:'BTC/USDT'},
  {type:'setStrategy', value:'trend'},
  {type:'setStrategy', value:'meanReversion'},
  {type:'setStrategy', value:'scalping'},
  {type:'setStrategy', value:'hybrid'},
];

function runNext() {
  if (currentTest >= tests.length) {
    console.log('\nAll tests sent. Waiting 10s for responses...');
    setTimeout(() => { ws.close(); process.exit(0); }, 10000);
    return;
  }
  const cmd = tests[currentTest++];
  console.log(`\nSending: ${cmd.type} = ${cmd.value}`);
  ws.send(JSON.stringify(cmd));
  setTimeout(runNext, 5000);
}
