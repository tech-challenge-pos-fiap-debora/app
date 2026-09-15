# Fase 2 — Infraestrutura e Deploy em Kubernetes

> **Fase 3:** produção usa **EKS + RDS PostgreSQL**. Este documento descreve o Kind + Mongo da Fase 2. Ver [`docs/arquitetura.md`](../docs/arquitetura.md).

Esta fase leva a aplicação da Fase 1 para um cluster **Kubernetes**, com
infraestrutura provisionada por **Terraform**, imagens **Docker** multi-stage,
**Job de migrations**, **Deployment** da API, **HorizontalPodAutoscaler (HPA)**,
health checks e pipeline **CI/CD** no GitHub Actions.

O cluster é criado com **Kind** (Kubernetes IN Docker) via Terraform
([`infra/`](../infra)), e os workloads são aplicados pelos manifestos de
[`k8s/`](../k8s). Ver o [diagrama de infraestrutura](../docs/diagrams/infra-kind-k8s.md).

> Para a documentação da aplicação (como rodar localmente, APIs, MongoDB), veja
> [`fase-1.md`](fase-1.md).

---

## Arquitetura e Diagramas

- **Componentes da aplicação (monólito modular):** [`../docs/diagrams/componentes-aplicacao.md`](../docs/diagrams/componentes-aplicacao.md)
- **Infraestrutura (Kind + Kubernetes):** [`../docs/diagrams/infra-kind-k8s.md`](../docs/diagrams/infra-kind-k8s.md)
- **Fluxo CI/CD:** [`../docs/diagrams/cicd-deploy.md`](../docs/diagrams/cicd-deploy.md)
- **Endpoints da Fase 2 (passo a passo):** [`../docs/api-fluxo-fase-2-endpoints.md`](../docs/api-fluxo-fase-2-endpoints.md) — open → diagnóstico → orçamento → aprovação + status + listagem

---

## Componentes de infraestrutura no repositório

| Caminho | O que é |
|---------|---------|
| [`Dockerfile`](../Dockerfile) | Imagem multi-stage: `development`, `build`, `prod-deps`, `migrations`, `production` |
| [`infra/`](../infra) | Terraform que cria o cluster Kind + namespace + metrics-server |
| [`k8s/`](../k8s) | Manifestos Kubernetes (ConfigMap, Secret, Mongo, Job de migrations, API, Service, HPA) |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | CI: testes unitários/integração + build |
| [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) | CD: build das imagens + Terraform + deploy no cluster |

### Manifestos em `k8s/`

| Arquivo | Recurso |
|---------|---------|
| `namespace.yaml` | Namespace `tech-challenge-namespace` |
| `configmap.yaml` | Variáveis não sensíveis (`NODE_ENV`, `PORT`, `MONGO_URL`, ...) |
| `secret.yaml` | Segredos (`JWT_SECRET`, `SEED_ADMIN_PASSWORD`, ...) |
| `mongo-pvc.yaml` / `mongo-service.yaml` / `mongo-deployment.yaml` | MongoDB com volume persistente |
| `migration-job.yaml` | Job que roda `yarn migrate:up` antes da API subir |
| `api-deployment.yaml` | Deployment da API (initContainer aguarda o Mongo, probes `/health/live` e `/health/ready`) |
| `api-service.yaml` | Service que expõe a API |
| `hpa.yaml` | HPA (1→5 réplicas, alvo de 70% de CPU e 80% de memória) |

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) em execução
- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- Node.js (ver [`.nvmrc`](../.nvmrc)) e Yarn — para build/testes locais

---

## Passo a passo

### 1. Build e testes locais (gate de qualidade)

```bash
yarn install --frozen-lockfile
yarn test                 # testes unitários + cobertura
yarn test:unit:docker     # mesma suíte unitária, dentro do container da API (sem Mongo)
yarn test:integration     # integração (requer MongoDB); ou:
yarn test:integration:docker
yarn build
```

### 2. Build das imagens Docker

O `Dockerfile` é multi-stage. Para o deploy no cluster são usadas duas imagens:

```bash
# Imagem de produção da API
docker build --target production -t tech-challenge-api:latest .

# Imagem do Job de migrations
docker build --target migrations -t tech-challenge-api:migrations .
```

### 3. Provisionar o cluster (Terraform + Kind)

Cria o cluster Kind, o namespace da aplicação e o metrics-server (necessário para o HPA).
Detalhes e variáveis em [`../infra/README.md`](../infra/README.md).

```bash
cd infra
terraform init
terraform apply -auto-approve
```

Exporte o kubeconfig e valide:

```bash
kind export kubeconfig --name tech-challenge
kubectl cluster-info
kubectl get nodes
kubectl get ns tech-challenge-namespace
```

### 4. Carregar as imagens no cluster Kind

Como o Kind não usa o Docker do host diretamente, é preciso carregar as imagens:

```bash
kind load docker-image tech-challenge-api:latest --name tech-challenge
kind load docker-image tech-challenge-api:migrations --name tech-challenge
```

### 5. Aplicar configuração (namespace, ConfigMap, Secret)

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
```

> **Segredos:** ajuste `k8s/secret.yaml` com valores reais (por exemplo `JWT_SECRET`
> e `SEED_ADMIN_PASSWORD`) antes de aplicar. Não versione segredos de produção.

### 6. Subir o MongoDB

```bash
kubectl apply -f k8s/mongo-pvc.yaml
kubectl apply -f k8s/mongo-service.yaml
kubectl apply -f k8s/mongo-deployment.yaml
kubectl rollout status deployment/mongo -n tech-challenge-namespace --timeout=180s
```

### 7. Rodar as migrations (Job)

```bash
kubectl delete job api-migration -n tech-challenge-namespace --ignore-not-found
kubectl apply -f k8s/migration-job.yaml
kubectl wait --for=condition=complete job/api-migration -n tech-challenge-namespace --timeout=180s \
  || kubectl logs job/api-migration -n tech-challenge-namespace --all-containers
```

### 8. Deploy da API + HPA

```bash
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl rollout status deployment/api -n tech-challenge-namespace --timeout=180s
```

### 9. Verificação (smoke test)

```bash
kubectl get all -n tech-challenge-namespace
kubectl get hpa -n tech-challenge-namespace

# Encaminha a porta do Service da API para a máquina local
kubectl port-forward svc/api 8080:80 -n tech-challenge-namespace &

curl -fsS http://localhost:8080/health/live
curl -fsS http://localhost:8080/health/ready
# Swagger, se exposto: http://localhost:8080/api
```

### 10. Destruir o ambiente

```bash
cd infra
terraform destroy -auto-approve
```

---

## CI/CD (GitHub Actions)

O pipeline automatiza todo o fluxo acima. Veja o
[diagrama de CI/CD](../docs/diagrams/cicd-deploy.md).

- **CI** ([`ci.yml`](../.github/workflows/ci.yml)): a cada `push`/`pull_request`,
  roda `yarn test`, `yarn test:integration` (com serviço MongoDB) e `yarn build`.
- **CD** ([`cd.yml`](../.github/workflows/cd.yml)): em `push` para
  `main`/`master`/`fase-02` (ou manual), executa:
  1. **Testes + build** (gate do deploy);
  2. **Build das imagens** Docker (`production` e `migrations`) salvas como artefatos;
  3. **Deploy**: `terraform apply` (Kind), carrega imagens, aplica config, sobe o
     Mongo, roda as migrations, faz o deploy da API + HPA e executa **smoke test**
     em `/health/live` e `/health/ready`. Ao final, com `if: always()`, o workflow
     roda `terraform destroy` e derruba o cluster Kind (sucesso ou falha). O
     runner do GitHub Actions é efêmero: esse cluster existe só durante o job; a
     validação do CD é o smoke test. Para demos ou inspeção prolongada, use o
     Kind local (`infra/` + passos manuais desta página).

---

## Observabilidade e escala

- **Health checks:** `livenessProbe` e `readinessProbe` apontam para
  `/health/live` e `/health/ready` (ver [`k8s/api-deployment.yaml`](../k8s/api-deployment.yaml)).
- **Autoscaling:** HPA de 1 a 5 réplicas com alvo de 70% de CPU e 80% de memória
  (ver [`k8s/hpa.yaml`](../k8s/hpa.yaml)), suportado pelo metrics-server.
