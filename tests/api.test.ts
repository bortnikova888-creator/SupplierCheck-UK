import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createHealthResponse } from '@pkg/core';

describe('API Health Check', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(cors);
    app.get('/api/healthz', async () => createHealthResponse('api'));
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/healthz returns ok status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/healthz',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('api');
    expect(body.timestamp).toBeDefined();
  });
});
