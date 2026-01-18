import { parseServerEnv } from '@pkg/config/server';
import { buildApiApp } from './app';

const env = parseServerEnv();

const app = await buildApiApp({ env });

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  console.log(`API server running on http://localhost:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app };
