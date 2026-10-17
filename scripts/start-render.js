const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('[Render Runner] Starting Shashka API & Telegram Bot...');
console.log('====================================================');

// 1. Start API Server (Fastify + Socket.IO)
const apiProcess = spawn('node', [path.join(__dirname, '../apps/api/dist/index.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    API_PORT: process.env.PORT || '10000',
  },
});

apiProcess.on('exit', (code, signal) => {
  console.error(`[Render Runner] API process exited with code ${code} and signal ${signal}`);
});

// 2. Start Telegram Bot (grammY)
const botProcess = spawn('node', [path.join(__dirname, '../apps/bot/dist/index.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Keep bot in long polling mode so it doesn't fight over PORT with API
    NODE_ENV: 'development',
  },
});

botProcess.on('exit', (code, signal) => {
  console.error(`[Render Runner] Bot process exited with code ${code} and signal ${signal}`);
});

function shutdown() {
  console.log('[Render Runner] Graceful shutdown initiated...');
  try {
    apiProcess.kill('SIGTERM');
  } catch {}
  try {
    botProcess.kill('SIGTERM');
  } catch {}
  setTimeout(() => process.exit(0), 1500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
