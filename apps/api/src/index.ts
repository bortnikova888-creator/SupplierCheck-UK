import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createHealthResponse } from '@pkg/core';

const PORT = Number(process.env.PORT) || 3001;

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

app.get('/api/healthz', async () => {
  return createHealthResponse('api');
});

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`API server running on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app };
