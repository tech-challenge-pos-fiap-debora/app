# ADR-004 — Quatro repositórios com CI/CD independente

| Campo | Valor |
|---|---|
| Identificador | ADR-004 |
| Título | Separação obrigatória em quatro repositórios Git |
| Status | Aceita |
| Data | 2026-09-13 |
| Decisores | Time Tech Challenge POS FIAP |

## Contexto

O enunciado exige quatro repositórios: Lambda, Terraform do Kubernetes, Terraform do banco e aplicação. Cada um com pipeline própria. A `main` protegida, alteração só por Pull Request.

## Decisão

| Repositório | Responsabilidade | Pipeline |
|---|---|---|
| `lambda-auth` | Código da function, API Gateway, Terraform | `terraform plan` no PR; `apply` na `main` |
| `infra-kubernetes` | VPC, EKS, ECR, ALB, workloads, New Relic | `plan` no PR; `apply` + `kubectl` na `main` |
| `infra-database` | RDS PostgreSQL (Terraform) | `plan` no PR; `apply` na `main` |
| `app` | NestJS, Dockerfile, testes | CI em PR/`main`; publish ECR na `main` e disparo do deploy EKS |

Ordem de apply: banco → cluster → API → Lambda (a Lambda descobre a VPC por tag).

Não usar monorepo nem submodules. Contratos entre repos são secrets (`DATABASE_URL`, `JWT_SECRET`) e tags da VPC.

O enunciado cita deploy automático de homologação e produção. O Learner Lab oferece **uma conta, uma VPC e uma sessão IAM** — um segundo cluster EKS + RDS estouraria cota e custo. Homologação, neste recorte, é o `terraform plan` / CI do Pull Request; produção é o `apply` na `main`. Não há branch `homolog` nem ambiente paralelo.

## Consequências

Cada pipeline falha isolada. O custo é a orquestração: a imagem da API só existe depois do ECR, que só existe depois do `infra-kubernetes`. O dispatch `workflow_dispatch` no `app` cobre esse encadeamento.
