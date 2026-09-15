# Diagrama de Infraestrutura — Kind + Kubernetes

> **Legado (Fase 2).** A Fase 3 usa **EKS + RDS PostgreSQL**. Este diagrama descreve o Kind local.

Desenho de solução do que o repositório **realmente provisiona**: cluster
**Kind** via Terraform ([`infra/`](../../infra)) e workloads nos manifestos
[`k8s/`](../../k8s). Usado localmente e no pipeline de CD.

**Runtime no cluster:** PostgreSQL (Kind local), Job de migrations e API rodam **somente**
como pods/workloads no namespace `tech-challenge-namespace`. Não há Compose
nem API fora do Kind nesta fase. Docker no host apenas executa
os nós do Kind e carrega imagens.

## Visão da solução

```mermaid
flowchart TB
    Client["Cliente HTTP"]

    subgraph Host["Host / GitHub Actions runner"]
        TF["Terraform (infra/)"]
        Kind["Kind cluster (control-plane)"]
        TF -->|cria| Kind
    end

    subgraph Cluster["Cluster Kind"]
        MS["metrics-server"]

        subgraph NS["Namespace tech-challenge-namespace"]
            CM["ConfigMap api-config"]
            Secret["Secret api-secret"]

            PgPVC[("PVC postgres-data")]
            PgDep["Deployment postgres"]
            PgSvc["Service postgres ClusterIP:5432"]

            MigJob["Job api-migration"]
            ApiDep["Deployment api"]
            ApiSvc["Service api NodePort 30080"]
            HPA["HPA api-hpa 1-5"]

            PgDep --> PgPVC
            PgSvc --> PgDep
            MigJob -->|DATABASE_URL| PgSvc
            ApiDep -->|DATABASE_URL| PgSvc
            ApiDep --> CM
            ApiDep --> Secret
            HPA --> ApiDep
            ApiSvc --> ApiDep
        end

        Kind --> MS
        Kind --> NS
    end

    Client -->|port-forward ou NodePort| ApiSvc
```

## O que o Terraform cria (`infra/`)

| Recurso | Arquivo / recurso | Papel |
|---------|-------------------|--------|
| Cluster Kind | `kind_cluster.this` | Control-plane com mapeamento de portas 80/443 |
| Namespace | `kubernetes_namespace.app` | Namespace da aplicação |
| metrics-server | `kubectl_manifest.metrics_server` | Métricas para o HPA |

PostgreSQL, API, Job e HPA **não** são criados pelo Terraform — só via
`kubectl apply` dos YAMLs em `k8s/`. Mesmo assim, **todos rodam no Kubernetes**
(não há banco ou API fora do cluster nesta fase).

## Workloads (`k8s/`)

| Manifesto | Kind | Nome |
|-----------|------|------|
| `namespace.yaml` | Namespace | `tech-challenge-namespace` |
| `configmap.yaml` | ConfigMap | `api-config` |
| `secret.yaml` | Secret | `api-secret` |
| `postgres-pvc.yaml` | PersistentVolumeClaim | `postgres-data` |
| `postgres-deployment.yaml` | Deployment | `postgres` |
| `postgres-service.yaml` | Service (ClusterIP) | `postgres` |
| `migration-job.yaml` | Job | `api-migration` |
| `api-deployment.yaml` | Deployment | `api` (probes `/health/live`, `/health/ready`) |
| `api-service.yaml` | Service (NodePort 30080) | `api` |
| `hpa.yaml` | HorizontalPodAutoscaler | `api-hpa` (CPU 70% / memória 80%, 1–5 réplicas) |

## Imagens Docker

| Target no `Dockerfile` | Tag usada no cluster |
|------------------------|----------------------|
| `production` | `tech-challenge-api:latest` |
| `migrations` | `tech-challenge-api:migrations` |
