import { Client } from '../entities/client';

export interface ClientRepositoryInterface {
  create: (data: Client) => Promise<Client>;
  find: () => Promise<Client[]>;
  findById: (id: string) => Promise<Client | null>;
  findByDocument: (document: string) => Promise<Client>;
  updateByDocument: (
    document: string,
    dataUpdate: Partial<{ name: string; email: string; status: string }>,
  ) => Promise<Client>;
  remove: (document: string) => Promise<void>;
}
