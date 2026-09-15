# Fase 1 — Aplicação (Oficina Mecânica / Ordem de Serviço)

> **Produção (Fase 3):** **RDS PostgreSQL** via `DATABASE_URL`. Ver [`docs/arquitetura.md`](../docs/arquitetura.md).

API de oficina mecânica: ordens de serviço, clientes, veículos, catálogo, produtos, estoque e rotas públicas para orçamento/status. **NestJS**, **TypeScript**, **PostgreSQL**, **JWT** e **Swagger** em **`/api`**.

> Esta é a documentação da **Fase 1** (a aplicação em si). O passo a passo de
> infraestrutura/deploy em Kubernetes está em [`fase-2.md`](fase-2.md).

---

## Arquitetura da aplicação

Monólito modular NestJS com *bounded contexts* DDD e camadas Clean Architecture.
A visão de componentes (contextos, rotas HTTP, ACL entre módulos e PostgreSQL) está em:

[`../docs/diagrams/componentes-aplicacao.md`](../docs/diagrams/componentes-aplicacao.md)

---

## Como rodar o projeto com Docker Compose

### Requisitos

- **Docker** — criar e gerir contêineres.
- **Docker Compose** — subir API e Postgres juntos.
- **Node.js** (recomendado via [nvm](https://github.com/nvm-sh/nvm), versão em [`.nvmrc`](../.nvmrc)) e **Yarn** — para instalar dependências e correr **`yarn migrate:up`** na tua máquina (as migrations ligam ao Postgres em `localhost:5432`).

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

   O `.env` deve ter `DATABASE_URL` apontando para o Postgres no host (ex.: `postgresql://postgres:postgres@localhost:5432/techchallenge`) — ver comentários em [`.env.example`](../.env.example).

6. **Subir os serviços** (API + Postgres em segundo plano, com rebuild se necessário):

   ```bash
   docker compose up -d --build
   ```

   Em ambientes mais antigos, o equivalente pode ser: `docker-compose up -d --build`.

7. **Aplicar migrations** (schema + seed), **na máquina**, com o mesmo `DATABASE_URL` do `.env`:

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
3. **PostgreSQL** acessível na porta **5432**, por exemplo só o Postgres com Docker:

   ```bash
   docker compose up -d postgres
   ```

   ou:

   ```bash
   docker run -d --name postgres-dev -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
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
- NestJS, TypeORM, Passport/JWT
- PostgreSQL (`pg`)
- Docker e Docker Compose
- Migrations SQL (`migrations/sql/`, `scripts/run-migrations.mjs`)

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

## Banco de dados

A aplicação usa **PostgreSQL** (local via Docker Compose / Kind; produção via **RDS**).
A justificativa da escolha na Fase 3 está em
[`docs/rfc/002-escolha-do-postgresql-rds.md`](../docs/rfc/002-escolha-do-postgresql-rds.md).

---

## Testes, lint e produção

| Comando | Descrição |
|---------|-----------|
| `yarn test` | Testes unitários (com cobertura mínima nos domínios críticos) |
| `yarn test:integration` | Testes de integração do fluxo principal da OS (Postgres em execução) |
| `yarn lint` | ESLint |
| `yarn format` | Prettier |
| `yarn build` | Build para produção |
| `yarn start:prod` | Correr o build |

---

**Licença:** UNLICENSED (projeto acadêmico).
