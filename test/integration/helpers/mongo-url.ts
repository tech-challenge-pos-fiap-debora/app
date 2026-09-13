/**
 * URL fixa dos testes de integração, sem leitura de variável de ambiente.
 *
 * O global-setup e o global-teardown chamam dropDatabase(). Como o banco de
 * produção passou a ser um MongoDB Atlas — o único lugar onde os dados
 * sobrevivem à recriação do ambiente — deixar a URL configurável abriria a
 * possibilidade de apontar a suíte para ele por engano e apagar tudo. Fixar no
 * código elimina esse caminho.
 *
 * O endereço vale nos dois cenários em que a suíte roda: o service container do
 * GitHub Actions e o serviço `mongo` do docker-compose, ambos publicando 27017
 * no host.
 */
export const INTEGRATION_MONGO_URL =
  'mongodb://127.0.0.1:27017/tech-challenge-integration';
