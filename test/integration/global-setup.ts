import mongoose from 'mongoose';
import { INTEGRATION_MONGO_URL } from './helpers/mongo-url';

export default async function globalSetup(): Promise<void> {
  await mongoose.connect(INTEGRATION_MONGO_URL);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
