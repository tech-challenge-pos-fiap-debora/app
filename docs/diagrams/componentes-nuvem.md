# Diagrama de componentes — visão de nuvem

Visão da Fase 3: nuvem AWS, API Gateway, Lambda, EKS, RDS PostgreSQL e New Relic.

```mermaid
flowchart TB
    subgraph Internet
        Cliente[Cliente com CPF]
        Equipe[Atendente / Mecânico / Admin]
    end

    subgraph AWS["AWS us-east-1 — Learner Lab"]
        GW["API Gateway HTTP\nPOST /auth/login"]
        LBD["Lambda auth\nvalida CPF, status, emite JWT"]
        ALB["Application Load Balancer\nIngress da API"]

        subgraph EKS["EKS — tech-challenge-prod"]
            API["Deployment api\nNestJS + agente New Relic"]
            HPA["HPA 1..5\nCPU 70% / mem 80%"]
            NRAGENT["nri-bundle\ninfra + kube-state-metrics"]
        end

        subgraph RDS["RDS PostgreSQL 16"]
            DB[("techchallenge\nclient, user, vehicle,\nproduct, service_order…")]
        end

        NAT["NAT Gateway"]
        ECR["ECR\napi e migrations"]
    end

    subgraph Observ["New Relic US"]
        APM[APM e traces]
        LOGS[Logs JSON]
        DASH[Dashboards e alertas]
    end

    Cliente -->|CPF + x-request-id| GW --> LBD
    LBD -->|JWT| Cliente
    LBD -->|5432 / VPC| DB
    Cliente -->|Bearer JWT| ALB --> API
    Equipe -->|email e senha / JWT| ALB
    API --> DB
    HPA --> API
    ECR --> API
    API --> APM
    API --> LOGS
    LBD --> LOGS
    NRAGENT --> DASH
    APM --> DASH
    LOGS --> DASH
```

## Componentes

| Componente | Repositório | Papel |
|---|---|---|
| API Gateway + Lambda | `lambda-auth` | Porta de autenticação do cliente |
| EKS, VPC, ALB, ECR, HPA | `infra-kubernetes` | Runtime da API e observabilidade de cluster |
| RDS PostgreSQL | `infra-database` | Banco gerenciado |
| API NestJS | `app` | Domínio, JWT interno, Swagger `/api` |
| New Relic | instrumentação em `app`, `lambda-auth` e Helm no `infra-kubernetes` | APM, logs, dashboards |

A API não passa pelo API Gateway. O tráfego de negócio entra pelo ALB. O gateway só autentica o cliente, conforme combinado para esta entrega.
