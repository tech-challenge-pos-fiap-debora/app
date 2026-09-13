import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { expect } from '@jest/globals';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { configureHttpApp } from '../../../src/contexts/shared/interfaces/http/config/configure-http-app';
import {
  INTEGRATION_ADMIN_EMAIL,
  INTEGRATION_ADMIN_NAME,
  INTEGRATION_ADMIN_PASSWORD,
  INTEGRATION_JWT_SECRET,
} from '../dev-credentials.fixture';
import { integrationAdminCredentials } from '../mocks/auth.mock';
import { INTEGRATION_MONGO_URL } from './mongo-url';

export async function bootstrapIntegrationApp(): Promise<INestApplication> {
  // Sobrescreve MONGO_URL para a aplicação sob teste não usar o banco real caso
  // a variável esteja definida no ambiente de quem roda a suíte.
  process.env.MONGO_URL = INTEGRATION_MONGO_URL;
  process.env.JWT_SECRET = INTEGRATION_JWT_SECRET;
  process.env.JWT_EXPIRES_IN = '1d';
  process.env.SEED_ADMIN_EMAIL = INTEGRATION_ADMIN_EMAIL;
  process.env.SEED_ADMIN_PASSWORD = INTEGRATION_ADMIN_PASSWORD;
  process.env.SEED_ADMIN_NAME = INTEGRATION_ADMIN_NAME;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  configureHttpApp(app);
  await app.init();
  return app;
}

export async function shutdownIntegrationApp(
  app: INestApplication,
): Promise<void> {
  await app.close();
}

export async function loginWithCredentials(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const e = email?.trim();
  const p = password?.trim();
  if (!e || !p) {
    throw new Error('loginWithCredentials: email e password são obrigatórios');
  }
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: e, password: p });
  expect([200, 201]).toContain(res.status);
  expect(typeof res.body.access_token).toBe('string');
  return res.body.access_token as string;
}

export async function loginAsIntegrationAdmin(
  app: INestApplication,
): Promise<string> {
  return loginWithCredentials(
    app,
    integrationAdminCredentials.email,
    integrationAdminCredentials.password,
  );
}
