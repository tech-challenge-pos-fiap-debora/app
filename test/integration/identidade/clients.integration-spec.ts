import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { newClientCreateBody, VALID_CPF_CLIENTS } from '../mocks/client.mock';
import {
  bootstrapIntegrationApp,
  loginAsIntegrationAdmin,
  shutdownIntegrationApp,
} from '../helpers/integration-app';

describe('Clients (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapIntegrationApp();
  }, 120_000);

  afterAll(async () => {
    await shutdownIntegrationApp(app);
  });

  it('POST /clients sem JWT — 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/clients')
      .send(newClientCreateBody());
    expect(res.status).toBe(401);
  });

  it('POST /clients com JWT — cria cliente', async () => {
    const token = await loginAsIntegrationAdmin(app);
    const body = newClientCreateBody();
    const res = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBeDefined();
    expect(res.body.document).toBe(body.document);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('GET /clients — lista inclui cliente criado', async () => {
    const token = await loginAsIntegrationAdmin(app);
    const list = await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(
      list.body.some(
        (c: { document: string }) => c.document === VALID_CPF_CLIENTS,
      ),
    ).toBe(true);
  });

  it('GET /clients/:document — retorna cliente', async () => {
    const token = await loginAsIntegrationAdmin(app);
    const one = await request(app.getHttpServer())
      .get(`/clients/${VALID_CPF_CLIENTS}`)
      .set('Authorization', `Bearer ${token}`);
    expect(one.status).toBe(200);
    expect(one.body.document).toBe(VALID_CPF_CLIENTS);
  });
});
