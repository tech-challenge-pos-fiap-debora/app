import { resetIntegrationDatabase } from './helpers/reset-integration-database';

export default async function globalTeardown(): Promise<void> {
  await resetIntegrationDatabase().catch(() => undefined);
}
