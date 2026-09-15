# Documentação arquitetural — Fase 3

Ponto de entrada para o avaliador. O PDF do portal só precisa apontar para este arquivo e para os quatro repositórios.

## Como ler esta entrega (5 minutos)

| O enunciado pede | Onde está |
|---|---|
| 4 repositórios com CI/CD e README | Tabela abaixo |
| API Gateway + Lambda (CPF → JWT) | [`lambda-auth`](https://github.com/tech-challenge-pos-fiap-debora/lambda-auth) |
| Kubernetes + Terraform + HPA | [`infra-kubernetes`](https://github.com/tech-challenge-pos-fiap-debora/infra-kubernetes) |
| Banco gerenciado + Terraform | [`infra-database`](https://github.com/tech-challenge-pos-fiap-debora/infra-database) |
| Aplicação no cluster | este repo (`app`) |
| Diagrama de componentes (nuvem) | [diagrams/componentes-nuvem.md](diagrams/componentes-nuvem.md) |
| Sequência — autenticação | [diagrams/sequencia-autenticacao.md](diagrams/sequencia-autenticacao.md) |
| Sequência — abertura de OS | [diagrams/sequencia-abertura-os.md](diagrams/sequencia-abertura-os.md) |
| ER, relacionamentos, justificativa do banco | [modelo-de-dados.md](modelo-de-dados.md) + [RFC-002](rfc/002-escolha-do-postgresql-rds.md) |
| Dashboards, latência, K8s, logs, traces | **New Relic** (não um `.md`). Link na seção 4 |
| `soat-architecture` | collaborator nos quatro repositórios |

**Produção agora (Learner Lab ligado):**

| O quê | URL |
|---|---|
| Swagger da API | http://k8s-techchal-api-3be88fc582-917637512.us-east-1.elb.amazonaws.com/api |
| Health | http://k8s-techchal-api-3be88fc582-917637512.us-east-1.elb.amazonaws.com/health/live |
| Login do cliente | `POST` https://b831ifscuh.execute-api.us-east-1.amazonaws.com/prod/auth/login `{ "cpf": "52998224725" }` |
| New Relic | https://one.newrelic.com/redirect/entity/ODUwODAzNnxWSVp8REFTSEJPQVJEfGRhOjEzMTY1ODM5 |

Dois logins distintos, de propósito:

1. **Cliente** — CPF na Lambda / API Gateway → JWT `role=cliente`.
2. **Equipe** — e-mail/senha em `POST /auth/login` **da API** (ALB) → JWT `admin` / `atendente` / `mecanico` / `estoquista`.

O API Gateway **não** fica na frente da API. Só autentica o cliente. O tráfego da oficina entra pelo ALB.

## 1. Quatro repositórios

| Repositório | Papel | Pipeline |
|---|---|---|
| [app](https://github.com/tech-challenge-pos-fiap-debora/app) | NestJS, Dockerfile, testes | CI no PR; publish ECR na `main` |
| [lambda-auth](https://github.com/tech-challenge-pos-fiap-debora/lambda-auth) | Lambda + API Gateway | `plan` no PR; `apply` + smoke na `main` |
| [infra-kubernetes](https://github.com/tech-challenge-pos-fiap-debora/infra-kubernetes) | VPC, EKS, ALB, HPA, New Relic | `plan` no PR; `apply` + deploy K8s na `main` |
| [infra-database](https://github.com/tech-challenge-pos-fiap-debora/infra-database) | RDS PostgreSQL | `plan` no PR; `apply` na `main` |

Ordem de provisionamento: banco → cluster → API → Lambda.

`main` protegida: merge só por Pull Request. Homologação no lab = `terraform plan` / CI do PR (uma conta AWS, sem segundo cluster). Produção = `apply` na `main`. Detalhe no [ADR-004](adr/004-organizacao-em-quatro-repositorios.md).

## 2. Diagramas

| Artefato | Arquivo |
|---|---|
| Componentes (nuvem, APIs, banco, Kubernetes, Lambda, monitoramento) | [diagrams/componentes-nuvem.md](diagrams/componentes-nuvem.md) |
| Componentes da aplicação (bounded contexts) | [diagrams/componentes-aplicacao.md](diagrams/componentes-aplicacao.md) |
| Sequência — autenticação por CPF | [diagrams/sequencia-autenticacao.md](diagrams/sequencia-autenticacao.md) |
| Sequência — abertura de ordem de serviço | [diagrams/sequencia-abertura-os.md](diagrams/sequencia-abertura-os.md) |
| Modelo de dados / ER | [modelo-de-dados.md](modelo-de-dados.md) |

## 3. RFCs e ADRs

| RFC | Tema |
|---|---|
| [RFC-001](rfc/001-escolha-da-nuvem-aws.md) | Nuvem AWS / Learner Lab |
| [RFC-002](rfc/002-escolha-do-postgresql-rds.md) | Banco RDS PostgreSQL |
| [RFC-003](rfc/003-autenticacao-por-cpf-e-jwt.md) | Autenticação por CPF |
| [RFC-004](rfc/004-observabilidade-com-new-relic.md) | New Relic |

| ADR | Decisão permanente |
|---|---|
| [ADR-001](adr/001-monolito-modular-e-comunicacao-sincrona.md) | Comunicação síncrona no monólito modular |
| [ADR-002](adr/002-escalabilidade-com-hpa.md) | HPA |
| [ADR-003](adr/003-logs-estruturados-e-correlacao.md) | Logs JSON, correlationId e traceId |
| [ADR-004](adr/004-organizacao-em-quatro-repositorios.md) | Quatro repositórios e CI/CD |

## 4. Observabilidade — ver no New Relic

A evidência (latência, CPU/memória, health, volume de OS, erros, logs JSON, traces) está na conta New Relic:

- Dashboard *Tech Challenge - Oficina Mecanica (prod)*: https://one.newrelic.com/redirect/entity/ODUwODAzNnxWSVp8REFTSEJPQVJEfGRhOjEzMTY1ODM5
- APM: `tech-challenge-api`
- Lambda: `tech-challenge-lambda-auth` (APM ou Serverless)
- Kubernetes: cluster `tech-challenge-prod-eks`
- Logs: filtrar `correlationId` (header `x-request-id`)

O arquivo [`OBSERVABILIDADE.md`](https://github.com/tech-challenge-pos-fiap-debora/infra-kubernetes/blob/main/docs/OBSERVABILIDADE.md) do `infra-kubernetes` descreve agents e NRQL. Não substitui o dashboard.

## 5. Banco

Instância RDS `tech-challenge-prod-pg`, database `techchallenge`, **sem IP público**. O console AWS mostra a instância, não as linhas. Schema e relacionamentos: [modelo-de-dados.md](modelo-de-dados.md).

## 6. Fases anteriores

[`readme/fase-1.md`](../readme/fase-1.md) e [`readme/fase-2.md`](../readme/fase-2.md) são histórico (Compose e Kind). A entrega desta fase é **EKS + RDS + Lambda + New Relic**.
