# Fase 1 — Aplicação (Oficina Mecânica / Ordem de Serviço)

> **Fase 3:** produção usa **RDS PostgreSQL** (`DATABASE_URL`). Este documento descreve a Fase 1 original (MongoDB local). Ver [`docs/arquitetura.md`](../docs/arquitetura.md).

API de oficina mecânica: ordens de serviço, clientes, veículos, catálogo, produtos, estoque e rotas públicas para orçamento/status. **NestJS**, **TypeScript**, **MongoDB**, **JWT** e **Swagger** em **`/api`**.

> Esta é a documentação da **Fase 1** (a aplicação em si). O passo a passo de
> infraestrutura/deploy em Kubernetes está em [`fase-2.md`](fase-2.md).

---

## Arquitetura da aplicação

Monólito modular NestJS com *bounded contexts* DDD e camadas Clean Architecture.
A visão de componentes (contextos, rotas HTTP, ACL entre módulos e MongoDB) está em:

[`../docs/diagrams/componentes-aplicacao.md`](../docs/diagrams/componentes-aplicacao.md)

---

## Como rodar o projeto com Docker Compose

### Requisitos

- **Docker** — criar e gerir contêineres.
- **Docker Compose** — subir API e Mongo juntos.
- **Node.js** (recomendado via [nvm](https://github.com/nvm-sh/nvm), versão em [`.nvmrc`](../.nvmrc)) e **Yarn** — para instalar dependências e correr **`yarn migrate:up`** na tua máquina (as migrations ligam ao Mongo em `localhost:27017`).

### Execução

1. **Clonar** o repositório na tua máquina:

   SSH:

   ```bash
   git clone git@github.com:SEU_USUARIO/tech-challenge-pos-fiap.git
   ```

   HTTPS:

   ```bash
   git clone https://github.com/SEU_USUARIO/tech-challenge-pos-fiap.git
   ```

2. **Entrar na pasta** do projeto:

   ```bash
   cd tech-challenge-pos-fiap
   ```

3. **Ativar a versão de Node** do projeto (se usares nvm):

   ```bash
   nvm use
   ```

   Se a versão ainda não existir: `nvm install` e depois `nvm use`.

4. **Instalar dependências:**

   ```bash
   yarn install
   ```

5. **Criar o ficheiro de ambiente** a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

   O `.env` deve ter `MONGO_URL` apontando para o Mongo no host (ex.: `mongodb://localhost:27017/techChallenge`), para a API no host e para as migrations — ver comentários em [`.env.example`](../.env.example).

6. **Subir os serviços** (API + Mongo em segundo plano, com rebuild se necessário):

   ```bash
   docker compose up -d --build
   ```

   Em ambientes mais antigos, o equivalente pode ser: `docker-compose up -d --build`.

7. **Aplicar migrations** (dados iniciais na base), **na máquina**, com o mesmo `MONGO_URL` do `.env`:

   ```bash
   yarn migrate:up
   ```

**Depois de subir**

- API: **http://localhost:3000**
- **Documentação interativa (Swagger):** **http://localhost:3000/api**
- Utilizador seed (login): `admin@local.dev` / `admin123`

---

## Execução local sem Docker (API na máquina)

1. Segue os passos **1 a 5** da secção anterior (clone, `cd`, `nvm use`, `yarn install`, `cp .env.example .env`).
2. Garante **Node** (via nvm ou instalador oficial) e **Yarn**.
3. **MongoDB** acessível na porta **27017**, por exemplo só o Mongo com Docker:

   ```bash
   docker compose up -d mongo
   ```

   ou:

   ```bash
   docker run -d --name mongo-dev -p 27017:27017 mongo:7
   ```

4. **Migrations** e **arranque em modo desenvolvimento:**

   ```bash
   yarn migrate:up
   yarn start:dev
   ```

5. Abre o Swagger: **http://localhost:3000/api**

---

## Documentação das APIs

A referência completa dos endpoints, corpos de pedido e respostas está no **Swagger/OpenAPI** em:

**http://localhost:3000/api**

Lá podes testar rotas com JWT (botão *Authorize*, token do `POST /auth/login`) e as rotas públicas sob **`/public/...`**.

Roteiros manuais com **URL e body:**

- [`../docs/api-fluxo-url-body.md`](../docs/api-fluxo-url-body.md) — índice e login
- [`../docs/api-fluxo-abrir-os-endpoint.md`](../docs/api-fluxo-abrir-os-endpoint.md) — abrir OS pelo endpoint
- [`../docs/api-fluxo-variante-a-criar-pela-api.md`](../docs/api-fluxo-variante-a-criar-pela-api.md) — criar dados pela API
- [`../docs/api-fluxo-variante-b-migration-fixtures.md`](../docs/api-fluxo-variante-b-migration-fixtures.md) — fixtures via `yarn migrate:up`

---

## Tecnologias utilizadas

- Node.js, TypeScript
- NestJS, Mongoose, Passport/JWT
- MongoDB
- Docker e Docker Compose
- migrate-mongo (migrations)

---

## Visão geral dos recursos (detalhe no Swagger)

| Área | Exemplos (prefixos reais no Swagger) |
|------|----------------------------------------|
| Autenticação | `POST /auth/login`, `POST /auth/users` |
| Clientes, veículos | `/clients`, `/vehicle` |
| Produtos e estoque | `/product`, `/product-batch` |
| Catálogo e OS | `/services`, `/service-orders` |
| Público (cliente) | `GET /public/service-orders/...`, aprovar/rejeitar orçamento |

---

## Justificativa da escolha do MongoDB

O MongoDB se encaixa muito bem no contexto desta aplicação, principalmente devido à estrutura da Ordem de Serviço (OS), que concentra diversas informações relacionadas ao atendimento em um único registro.

A modelagem orientada a documentos permite armazenar na própria Ordem de Serviço todos os dados necessários para sua consulta, funcionando como um *snapshot* das informações relevantes no momento da criação. Dessa forma, a OS torna-se um registro independente, reduzindo a necessidade de múltiplas consultas e relacionamentos para recuperar os dados de um atendimento.

Outro ponto importante é a flexibilidade do esquema. Em estágios iniciais da aplicação, a estrutura da Ordem de Serviço pode não possuir relacionamentos mais complexos, como peças, histórico detalhado ou múltiplos status. Conforme a aplicação evolui, novos campos e estruturas podem ser adicionados ao documento sem a necessidade de migrações complexas ou alterações significativas no banco de dados. Isso permite que documentos mais antigos coexistam com versões mais recentes da estrutura.

Além disso, o MongoDB oferece suporte a transações ACID, garantindo consistência e confiabilidade dos dados. Após avaliar os requisitos do projeto, identificou-se que a principal necessidade era assegurar a integridade das informações registradas durante o ciclo de vida da Ordem de Serviço.

A aplicação possui um fluxo orientado a ações realizadas pelos usuários. Por exemplo, um atendente cria manualmente uma Ordem de Serviço, um mecânico adiciona peças e atualiza o orçamento, e o cliente realiza a aprovação do serviço. Como as alterações no banco de dados são resultado de ações humanas e ocorrem de forma gradual, não existe um cenário de alta concorrência ou processamento massivo que exija soluções voltadas principalmente para escalabilidade.

Dessa forma, a confiabilidade dos dados, a flexibilidade da modelagem e a capacidade de evolução do esquema sem grandes impactos na aplicação foram os principais critérios para a escolha do MongoDB, pois estão diretamente alinhados às necessidades do domínio e ao fluxo operacional da aplicação.

Por fim, a utilização do NestJS contribuiu para essa escolha, pois a integração com o MongoDB por meio do Mongoose é simples, madura e amplamente utilizada pela comunidade, facilitando a modelagem, validação e manutenção dos documentos da aplicação.

---

## Testes, lint e produção

| Comando | Descrição |
|---------|-----------|
| `yarn test` | Testes unitários (com cobertura mínima nos domínios críticos) |
| `yarn test:integration` | Testes de integração do fluxo principal da OS (Mongo em execução) |
| `yarn lint` | ESLint |
| `yarn format` | Prettier |
| `yarn build` | Build para produção |
| `yarn start:prod` | Correr o build |

---

**Licença:** UNLICENSED (projeto acadêmico).
