import { describe, expect, it } from '@jest/globals';
import { Client } from '../../../domain/entities/client';
import { ClientRepositoryInterface } from '../../../domain/repositories/client.repository';
import { CreateClientUseCase } from './create-client';
import { DeleteClientUseCase } from './delete-client';
import { GetAllClientsUseCase } from './get-all-clients';
import { GetClientUseCase } from './get-client';
import { UpdateClientUseCase } from './update-client';

class InMemoryClientRepository implements ClientRepositoryInterface {
  public clients = new Map<string, Client>();

  create(data: Client): Promise<Client> {
    this.clients.set(data.document, data);
    return Promise.resolve(data);
  }

  find(): Promise<Client[]> {
    return Promise.resolve([...this.clients.values()]);
  }

  findById(id: string): Promise<Client | null> {
    return Promise.resolve(
      [...this.clients.values()].find((c) => c.id === id) ?? null,
    );
  }

  findByDocument(document: string): Promise<Client> {
    const c = this.clients.get(document);
    if (!c) throw new Error('not found');
    return Promise.resolve(c);
  }

  updateByDocument(
    document: string,
    dataUpdate: Partial<Client>,
  ): Promise<Client> {
    const current = this.clients.get(document);
    if (!current) throw new Error('not found');
    const updated = Client.create(
      {
        name: dataUpdate.name ?? current.name,
        document: current.document,
        email: dataUpdate.email ?? current.email,
        status: current.status,
      },
      current.id,
    );
    this.clients.set(document, updated);
    return Promise.resolve(updated);
  }

  remove(document: string): Promise<void> {
    this.clients.delete(document);
    return Promise.resolve();
  }
}

describe('Client use cases', () => {
  it('creates a client', async () => {
    const repository = new InMemoryClientRepository();
    const useCase = new CreateClientUseCase(repository);

    const response = await useCase.execute({
      name: 'Joao Silva',
      document: '52998224725',
      email: 'joao@email.com',
    });

    expect(response).toMatchObject({
      id: expect.any(String),
      name: 'Joao Silva',
      document: '52998224725',
      email: 'joao@email.com',
      status: 'ACTIVE',
    });
    expect(repository.clients.size).toBe(1);
  });

  it('gets a client by document', async () => {
    const repository = new InMemoryClientRepository();
    await repository.create(
      Client.create({
        name: 'Joao Silva',
        document: '52998224725',
        email: 'joao@email.com',
      }),
    );
    const useCase = new GetClientUseCase(repository);

    const response = await useCase.execute('52998224725');

    expect(response.name).toBe('Joao Silva');
    expect(response.document).toBe('52998224725');
  });

  it('updates a client', async () => {
    const repository = new InMemoryClientRepository();
    await repository.create(
      Client.create({
        name: 'Joao Silva',
        document: '52998224725',
        email: 'joao@email.com',
      }),
    );
    const useCase = new UpdateClientUseCase(repository);

    const response = await useCase.execute('52998224725', {
      email: 'novo@email.com',
    });

    expect(response.email).toBe('novo@email.com');
    expect(repository.clients.get('52998224725')?.email).toBe('novo@email.com');
  });

  it('deletes a client', async () => {
    const repository = new InMemoryClientRepository();
    await repository.create(
      Client.create({
        name: 'Joao Silva',
        document: '52998224725',
        email: 'joao@email.com',
      }),
    );
    const useCase = new DeleteClientUseCase(repository);

    await useCase.execute('52998224725');

    expect(repository.clients.has('52998224725')).toBe(false);
  });

  it('lists all clients', async () => {
    const repository = new InMemoryClientRepository();
    await repository.create(
      Client.create({
        name: 'Joao Silva',
        document: '52998224725',
        email: 'joao@email.com',
      }),
    );
    const useCase = new GetAllClientsUseCase(repository);
    const list = await useCase.execute();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: expect.any(String),
      document: '52998224725',
    });
  });
});
