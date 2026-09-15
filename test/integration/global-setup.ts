import { resetIntegrationDatabase } from './helpers/reset-integration-database';

export default async function globalSetup(): Promise<void> {
  await resetIntegrationDatabase();
}
