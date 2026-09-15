/**
 * URL fixa dos testes de integração, sem leitura de variável de ambiente.
 *
 * O global-setup e o global-teardown recriam o schema public. Fixar no código
 * evita apontar por engano para o RDS de produção.
 *
 * Vale no service container do GitHub Actions e no serviço `postgres` do
 * docker-compose, ambos publicando 5432 no host.
 */
export const INTEGRATION_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:5432/techchallenge';
