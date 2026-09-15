# Diagrama de Infraestrutura — Kind + Kubernetes

> **Legado (Fase 2).** A Fase 3 usa **EKS + RDS PostgreSQL**. Este diagrama descreve o Kind local.

Desenho de solução do que o repositório **realmente provisiona**: cluster
**Kind** via Terraform ([`infra/`](../../infra)) e workloads nos manifestos
[`k8s/`](../../k8s). Usado localmente e no pipeline de CD.

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

            MongoPVC[("PVC mongo-data")]
            MongoDep["Deployment mongo"]
            MongoSvc["Service mongo ClusterIP:27017"]

            MigJob["Job api-migration"]
            ApiDep["Deployment api"]
            ApiSvc["Service api NodePort 30080"]
            HPA["HPA api-hpa 1-5"]

            MongoDep --> MongoPVC
            MongoSvc --> MongoDep
            MigJob -->|MONGO_URL| MongoSvc
            ApiDep -->|MONGO_URL| MongoSvc
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

MongoDB, API, Job e HPA **não** são criados pelo Terraform — só via `kubectl apply` dos YAMLs em `k8s/`.

## Workloads (`k8s/`)

| Manifesto | Kind | Nome |
|-----------|------|------|
| `namespace.yaml` | Namespace | `tech-challenge-namespace` |
| `configmap.yaml` | ConfigMap | `api-config` |
| `secret.yaml` | Secret | `api-secret` |
| `mongo-pvc.yaml` | PersistentVolumeClaim | `mongo-data` |
| `mongo-deployment.yaml` | Deployment | `mongo` |
| `mongo-service.yaml` | Service (ClusterIP) | `mongo` |
| `migration-job.yaml` | Job | `api-migration` |
| `api-deployment.yaml` | Deployment | `api` (probes `/health/live`, `/health/ready`) |
| `api-service.yaml` | Service (NodePort 30080) | `api` |
| `hpa.yaml` | HorizontalPodAutoscaler | `api-hpa` (CPU 70% / memória 80%, 1–5 réplicas) |

## Imagens Docker

| Target no `Dockerfile` | Tag usada no cluster |
|------------------------|----------------------|
| `production` | `tech-challenge-api:latest` |
| `migrations` | `tech-challenge-api:migrations` |
