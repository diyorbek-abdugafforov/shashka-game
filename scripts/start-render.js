const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('[Render Runner] Starting Shashka API & Telegram Bot...');
console.log('====================================================');

const sharedEnv = {
  ...process.env,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8587302791:AAGKLkSf8LQ9nRF5wPPx8xn_Ao-SweGRwE0',
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'wikipediyauzrobot',
  APP_URL: process.env.APP_URL || 'https://shashka-shaxmat.netlify.app',
  WEB_URL: process.env.WEB_URL || 'https://shashka-shaxmat.netlify.app',
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_GfwoOztS26di@ep-lingering-lake-b4jgtvn6-pooler.c-6.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
};

let apiProcess = null;
let botProcess = null;
let isShuttingDown = false;

// 1. Start API Server (Fastify + Socket.IO)
function startApi() {
  if (isShuttingDown) return;
  console.log('[Render Runner] Spawning API Server...');
  apiProcess = spawn('node', [path.join(__dirname, '../apps/api/dist/index.js')], {
    stdio: 'inherit',
    env: {
      ...sharedEnv,
      API_PORT: process.env.PORT || '10000',
    },
  });

  apiProcess.on('exit', (code, signal) => {
    console.error(`[Render Runner] API process exited with code ${code} and signal ${signal}`);
    if (!isShuttingDown) {
      console.log('[Render Runner] Restarting API process in 3s...');
      setTimeout(startApi, 3000);
    }
  });
}

// 2. Start Telegram Bot (grammY) with auto-restart
function startBot() {
  if (isShuttingDown) return;
  console.log('[Render Runner] Spawning Telegram Bot (@wikipediyauzrobot)...');
  botProcess = spawn('node', [path.join(__dirname, '../apps/bot/dist/index.js')], {
    stdio: 'inherit',
    env: {
      ...sharedEnv,
      NODE_ENV: 'development', // Long polling mode
    },
  });

  botProcess.on('exit', (code, signal) => {
    console.error(`[Render Runner] Bot process exited with code ${code} and signal ${signal}`);
    if (!isShuttingDown) {
      console.log('[Render Runner] Restarting Telegram Bot process in 3s...');
      setTimeout(startBot, 3000);
    }
  });
}

// 3. Keep-alive self-ping to prevent Render Free Tier from sleeping
const PING_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes
function keepAlive() {
  const url = 'https://shashka-backend.onrender.com/health';
  fetch(url)
    .then((res) => console.log(`[Render Runner] Keep-alive ping sent to ${url} (status: ${res.status})`))
    .catch((err) => console.warn(`[Render Runner] Keep-alive ping failed: ${err.message}`));
}
setInterval(keepAlive, PING_INTERVAL_MS);
setTimeout(keepAlive, 20 * 1000);

function shutdown() {
  isShuttingDown = true;
  console.log('[Render Runner] Graceful shutdown initiated...');
  try {
    apiProcess?.kill('SIGTERM');
  } catch {}
  try {
    botProcess?.kill('SIGTERM');
  } catch {}
  setTimeout(() => process.exit(0), 1500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startApi();
startBot();
