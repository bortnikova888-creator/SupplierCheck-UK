import { parseServerEnv } from '@pkg/config/server';
import { buildApiApp } from './app';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

if (!isVercel) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const env = parseServerEnv();
let initError: unknown = null;
const appPromise = buildApiApp({ env }).catch((err) => {
  initError = err;
  console.error('API_INIT_FAILED', err);
  throw err;
});

function sendInitError(res: ServerResponse, err: unknown): void {
  const payload = {
    error: 'API_INIT_FAILED',
    message: String(err),
    name: (err as { name?: string } | null)?.name,
    stack: process.env.NODE_ENV !== 'production' ? (err as { stack?: string } | null)?.stack : undefined,
  };
  res.statusCode = 500;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

if (!isVercel) {
  void appPromise
    .then(async (app) => {
      await app.listen({ port: env.PORT, host: env.HOST });
      console.log(`API server running on http://localhost:${env.PORT}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (initError) {
    console.error('API_INIT_FAILED', initError);
    sendInitError(res, initError);
    return;
  }

  try {
    const app = await appPromise;
    await app.ready();
    app.server.emit('request', req, res);
  } catch (err) {
    initError = initError ?? err;
    console.error('API_INIT_FAILED', err);
    sendInitError(res, err);
  }
}

export { appPromise as app };
