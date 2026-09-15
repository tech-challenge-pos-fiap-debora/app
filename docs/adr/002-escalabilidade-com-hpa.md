# ADR-002 — Escalabilidade horizontal por HPA

| Campo | Valor |
|---|---|
| Identificador | ADR-002 |
| Título | HPA como estratégia de escalabilidade da API |
| Status | Aceita |
| Data | 2026-09-13 |
| Decisores | Time Tech Challenge POS FIAP |

## Contexto

O enunciado pede cluster Kubernetes com escalabilidade. O Learner Lab limita o tamanho do node group (default 1–3 nós, instâncias pequenas). Cluster Autoscaler e Karpenter exigem IAM que o lab não deixa criar.

A API é stateless. O estado vive no **RDS PostgreSQL** (`infra-database`).

## Decisão

Escalar **pods**, não nós, com Horizontal Pod Autoscaler:

- alvo: Deployment `api`
- mínimo 1, máximo 5 réplicas
- CPU 70%, memória 80%
- Metrics Server instalado via Helm no módulo `platform`

O node group tem `min_size`/`max_size` no ASG do EKS só como teto manual. Sem Cluster Autoscaler, pods pendentes por falta de nó não abrem máquina nova.

## Consequências

O HPA demonstra o requisito de escalabilidade no vídeo (`kubectl get hpa`). Em pico maior que a capacidade dos nós, os pods ficam `Pending` — aceitável no lab. O pool de conexões PostgreSQL deve ser dimensionado por réplica (ex.: PgBouncer ou limite por pod).
