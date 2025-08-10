import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const messageProcessingTime = new Trend('message_processing_time');

// --- Stress Test Configuration ---
const TOTAL_RESTAURANTS = 10;
const TABLES_PER_RESTAURANT = 30;
const ACTIVE_TABLE_PERCENTAGE = 0.8;
const CLIENTS_PER_TABLE = 4;
const MESSAGE_SEND_INTERVAL = 500; // ms

const TOTAL_TABLES = TOTAL_RESTAURANTS * TABLES_PER_RESTAURANT;
const ACTIVE_SESSIONS = Math.floor(TOTAL_TABLES * ACTIVE_TABLE_PERCENTAGE);
const TOTAL_VUS = ACTIVE_SESSIONS * CLIENTS_PER_TABLE;

export const options = {
  scenarios: {
    default: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: TOTAL_VUS },
        { duration: '3m', target: TOTAL_VUS },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'checks': ['rate>0.99'],
    'message_processing_time': ['p(95)<500'],
  },
};

const WS_URL = 'ws://localhost:3000/socket.io/?EIO=4&transport=websocket';

export default function () {
  const sessionId = `test-session-${__VU % ACTIVE_SESSIONS}`;
  const url = `${WS_URL}&sessionId=${sessionId}`;
  
  let messageTimestamp = 0;

  const res = ws.connect(url, {}, function (socket) {
    let intervalId;

    socket.on('open', () => {
      console.log(`VU ${__VU}: Connected to session ${sessionId}`);
      socket.send('40');

      // Schedule the first message after a short delay
      setTimeout(() => {
        messageTimestamp = Date.now();
        sendAddItem(socket, 1);
      }, MESSAGE_SEND_INTERVAL);
      
      // Schedule subsequent messages using k6's scheduler
      let itemCounter = 2;
      intervalId = setInterval(() => {
        messageTimestamp = Date.now();
        sendAddItem(socket, itemCounter);
        itemCounter++;
      }, MESSAGE_SEND_INTERVAL);
    });

    socket.on('message', (data) => {
      if (typeof data === 'string' && data.startsWith('42')) {
        const message = JSON.parse(data.substring(2));
        if (message[0] === 'cart-updated') {
            if (messageTimestamp > 0) {
              const processingTime = Date.now() - messageTimestamp;
              messageProcessingTime.add(processingTime);
            }
            const cart = message[1];
            check(cart, { 'cart has items': (c) => c && c.items && c.items.length >= 0 });
        }
      }
    });

    socket.on('close', () => {
      console.log(`VU ${__VU}: Disconnected`);
      clearInterval(intervalId);
    });

    socket.on('error', (e) => {
      console.error(`An error occurred: ${e.error}`);
      clearInterval(intervalId);
    });
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
  
  // This sleep keeps the VU alive for a single, long iteration.
  // The test's stages will eventually end and terminate this.
  sleep(600); // Sleep for 10 minutes (longer than any stage)
}

function sendAddItem(socket, itemIndex) {
  const payload = {
    productId: `product-${itemIndex}`,
    quantity: 1,
    unitPrice: '15.99',
  };
  
  socket.send(`42["add-item",${JSON.stringify(payload)}]`);
}