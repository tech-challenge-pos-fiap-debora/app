# Documentação arquitetural — Fase 3

Índice do que o enunciado pede. Tudo neste repositório, para o PDF do portal só apontar links.

## 1. Diagramas

| Artefato | Arquivo |
|---|---|
| Componentes (nuvem, APIs, banco, Kubernetes, Lambda, monitoramento) | [diagrams/componentes-nuvem.md](diagrams/componentes-nuvem.md) |
| Sequência — autenticação por CPF | [diagrams/sequencia-autenticacao.md](diagrams/sequencia-autenticacao.md) |
| Sequência — abertura de ordem de serviço | [diagrams/sequencia-abertura-os.md](diagrams/sequencia-abertura-os.md) |
| Modelo de dados / ER | [modelo-de-dados.md](modelo-de-dados.md) |

## 2. RFCs

| RFC | Tema |
|---|---|
| [RFC-001](rfc/001-escolha-da-nuvem-aws.md) | Nuvem AWS / Learner Lab |
| [RFC-002](rfc/002-escolha-do-postgresql-rds.md) | Banco RDS PostgreSQL |
| [RFC-003](rfc/003-autenticacao-por-cpf-e-jwt.md) | Autenticação por CPF |
| [RFC-004](rfc/004-observabilidade-com-new-relic.md) | New Relic |

## 3. ADRs

| ADR | Decisão permanente |
|---|---|
| [ADR-001](adr/001-monolito-modular-e-comunicacao-sincrona.md) | Comunicação síncrona no monólito modular |
| [ADR-002](adr/002-escalabilidade-com-hpa.md) | HPA |
| [ADR-003](adr/003-logs-estruturados-e-correlacao.md) | Logs JSON, correlationId e traceId |
| [ADR-004](adr/004-organizacao-em-quatro-repositorios.md) | Quatro repositórios e CI/CD |

## 4. Observabilidade operacional

O detalhe de agents, NRQL e alertas fica no repositório `infra-kubernetes`, arquivo `docs/OBSERVABILIDADE.md`.

## 5. Deploys ativos (produção)

| O quê | URL |
|---|---|
| API (ALB) | http://k8s-techchal-api-3be88fc582-917637512.us-east-1.elb.amazonaws.com |
| Swagger | http://k8s-techchal-api-3be88fc582-917637512.us-east-1.elb.amazonaws.com/api |
| Health | http://k8s-techchal-api-3be88fc582-917637512.us-east-1.elb.amazonaws.com/health/live |
| Login cliente (API Gateway) | `POST` https://b831ifscuh.execute-api.us-east-1.amazonaws.com/prod/auth/login |
| Dashboard New Relic | https://one.newrelic.com/redirect/entity/ODUwODAzNnxWSVp8REFTSEJPQVJEfGRhOjEzMTY1ODM5 |

O hostname do ALB muda se o Ingress for recriado. Confirme com `kubectl get ingress api -n tech-challenge-namespace`.

## 6. Adaptação para RDS — o que foi entregue

| Repositório | Situação |
|---|---|
| `infra-database` | RDS PostgreSQL 16 provisionado; `connection_url` nos secrets |
| `infra-kubernetes` | Secret `DATABASE_URL`, `PGSSL`, Job de migrations SQL |
| `lambda-auth` | driver `pg` no bundle, `DATABASE_URL`, Terraform + API Gateway |
| `app` | TypeORM + `pg`, repositórios SQL, migrations SQL, testes, `.env` |
| Documentação | RFC-002, ER, diagramas, READMEs e RUNBOOK atualizados |

Relacionamentos: seção 5 de [modelo-de-dados.md](modelo-de-dados.md).
