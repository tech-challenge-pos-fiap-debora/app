# app — API da oficina

## Propósito

Aplicação principal da oficina mecânica. Roda no Amazon EKS: ordens de serviço, clientes, veículos, catálogo, estoque, login interno e validação do JWT emitido pela Lambda. É o quarto repositório exigido pelo Tech Challenge (código que executa no Kubernetes).

Documentação arquitetural da Fase 3: [`docs/arquitetura.md`](docs/arquitetura.md).

| Fase | Conteúdo | Link |
|------|----------|------|
| **Fase 1** | Aplicação local (Docker Compose), APIs e diagrama de componentes. | [`readme/fase-1.md`](readme/fase-1.md) |
| **Fase 2** | Deploy no Kind: Terraform + manifestos `k8s/` (legado local). | [`readme/fase-2.md`](readme/fase-2.md) |
| **Fase 3** | **EKS + RDS PostgreSQL** (produção). | [`docs/arquitetura.md`](docs/arquitetura.md) |

## Tecnologias

- Node.js 22, TypeScript, NestJS 11
- PostgreSQL via TypeORM + driver `pg`
- JWT (Passport) para equipe e para o token `role=cliente` da Lambda
- Docker (imagem `production` e `migrations`)
- New Relic (APM, logs JSON, eventos de negócio)
- Jest (unitário e integração)

## Pré-requisitos

- Node 22 e Yarn
- Docker e Docker Compose, para o caminho local (Postgres no compose)
- Cluster do `infra-kubernetes` e `DATABASE_URL` do RDS, para produção
- Secrets no GitHub: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `INFRA_DISPATCH_TOKEN` (opcional)

## Execução local

```bash
cp .env.example .env
docker compose up -d --build
yarn migrate:up
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api
- Seed: `admin@local.dev` / senha do `.env` (`SEED_ADMIN_PASSWORD`)

Sem Compose: Postgres local, `yarn migrate:up`, `yarn start:dev`.

```bash
yarn test
yarn test:integration
yarn build
```

## Deploy

A `main` publica imagens no ECR e dispara o workflow `Deploy Prod` do `infra-kubernetes`.

```bash
# feito pelo GitHub Actions em .github/workflows/publish-ecr.yml
docker build --target production -t tech-challenge-api:local .
docker build --target migrations -t tech-challenge-api-migrations:local .
```

O Deployment no EKS inicia com `node -r newrelic dist/main.js`. Sem `NEW_RELIC_LICENSE_KEY` a telemetria é no-op.

## Pipeline

| Workflow | Gatilho | O que faz |
|---|---|---|
| [`ci.yml`](.github/workflows/ci.yml) | PR e push na `main` | `yarn test`, `yarn test:integration`, `yarn build` |
| [`publish-ecr.yml`](.github/workflows/publish-ecr.yml) | push na `main` | build/push ECR + `gh workflow run` no `infra-kubernetes` |
| [`cd.yml`](.github/workflows/cd.yml) | manual | Kind da Fase 2 (legado; não é produção) |

A `main` é protegida: só entra alteração por Pull Request.

## Diagrama deste repositório

```mermaid
flowchart LR
    HTTP[REST / JWT] --> Nest[NestJS monólito modular]
    Nest --> Id[identidade]
    Nest --> Es[estoque]
    Nest --> OS[ordem-de-servico]
    OS -->|ports/adapters| Id
    OS -->|ports/adapters| Es
    Nest --> PG[(RDS PostgreSQL)]
    Nest --> NR[New Relic APM e logs]
```

Visão de nuvem: [`docs/diagrams/componentes-nuvem.md`](docs/diagrams/componentes-nuvem.md).

## Deploys ativos (produção)

| O quê | URL |
|---|---|
| API | http://k8s-techchal-api-3be88fc582-917637512.us-east-1.elb.amazonaws.com |
| Swagger | http://k8s-techchal-api-3be88fc582-917637512.us-east-1.elb.amazonaws.com/api |
| Health | http://k8s-techchal-api-3be88fc582-917637512.us-east-1.elb.amazonaws.com/health/live |
| Login cliente (API Gateway) | `POST` https://b831ifscuh.execute-api.us-east-1.amazonaws.com/prod/auth/login |
| New Relic | https://one.newrelic.com/redirect/entity/ODUwODAzNnxWSVp8REFTSEJPQVJEfGRhOjEzMTY1ODM5 |

## APIs

- Swagger: http://localhost:3000/api (local) ou o ALB acima
- OpenAPI JSON: http://localhost:3000/api-json
- Login de equipe: `POST /auth/login` `{ "email", "password" }`
- Login de cliente: API Gateway do `lambda-auth`, depois Bearer nas rotas com `@AuthRoles`
- Health: `GET /health/live`, `GET /health/ready`

Roteiros: [`docs/api-fluxo-fase-2-endpoints.md`](docs/api-fluxo-fase-2-endpoints.md), [`docs/api-fluxo-url-body.md`](docs/api-fluxo-url-body.md).

## Vídeo demonstrativo

- **Fase 3** (entrega do portal): autenticação por CPF, CI/CD, APIs protegidas, dashboard New Relic, logs e traces. O link do YouTube/Vimeo entra no PDF.
- **Fase 2** (histórico Kind/HPA): [Google Drive](https://drive.google.com/drive/folders/1lh3C0epIgxDlT67pXlC3IdDHHwV4oc2z?usp=sharing)

## Outros documentos

- Documentação por fase: [`readme/fase-1.md`](readme/fase-1.md) e [`readme/fase-2.md`](readme/fase-2.md)
- Infraestrutura (Terraform/Kind): [`infra/README.md`](infra/README.md)

**Licença:** UNLICENSED (projeto acadêmico).
