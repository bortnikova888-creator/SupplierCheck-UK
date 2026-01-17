import { resolve } from 'node:path';
import { parseServerEnv } from '@pkg/config';
import { buildApiApp } from './app';

const env = parseServerEnv();

const app = await buildApiApp({
  env,
  webBuildPath: resolve(process.cwd(), '..', 'web', 'dist'),
});

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  console.log(`API server running on http://localhost:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app };
