import dotenv from 'dotenv';
import path from 'node:path';
import { envSchema, type Env } from './env.js';

import fs from 'node:fs';

// Load .env from workspace root or parent directories
let searchDir = process.cwd();
while (searchDir) {
  const envPath = path.join(searchDir, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
  const parent = path.dirname(searchDir);
  if (parent === searchDir) break;
  searchDir = parent;
}
dotenv.config();

function loadConfig(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    // In non-production or build time, provide descriptive error or fallback
    console.error('❌ Invalid or missing environment variables:\n' + formattedErrors);
    
    // Throw error to prevent booting with invalid configuration
    throw new Error(`Configuration validation error:\n${formattedErrors}`);
  }

  return result.data;
}

let cachedConfig: Env | null = null;

export function getConfig(): Env {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export const isProd = (env: Env = getConfig()): boolean => env.NODE_ENV === 'production';
export const isDev = (env: Env = getConfig()): boolean => env.NODE_ENV === 'development';
export const isTest = (env: Env = getConfig()): boolean => env.NODE_ENV === 'test';

export * from './env.js';
