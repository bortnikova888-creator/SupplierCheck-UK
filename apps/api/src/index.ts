import { parseServerEnv } from '@pkg/config/server';
import { buildApiApp } from './app';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const env = parseServerEnv();
const appPromise = buildApiApp({ env });

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

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
  const app = await appPromise;
  await app.ready();
  app.server.emit('request', req, res);
}

export { appPromise as app };
