import pino from 'pino';
import { getConfig, isDev } from '../config.js';

const config = getConfig();

export const logger = pino({
  level: config.LOG_LEVEL || 'info',
  transport: isDev()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;
