import mongoose from 'mongoose';
import { INTEGRATION_MONGO_URL } from './helpers/mongo-url';

export default async function globalTeardown(): Promise<void> {
  try {
    await mongoose.connect(INTEGRATION_MONGO_URL);
    await mongoose.connection.dropDatabase();
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}
