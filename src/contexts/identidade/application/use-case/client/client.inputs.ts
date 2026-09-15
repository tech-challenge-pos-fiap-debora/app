import type { ClientStatus } from '../../../domain/entities/client-status';

export type CreateClientInput = {
  name: string;
  document: string;
  email: string;
  status?: ClientStatus;
};

export type UpdateClientInput = {
  name?: string;
  email?: string;
  status?: ClientStatus;
};
