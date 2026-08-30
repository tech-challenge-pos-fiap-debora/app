# Tech Challenge Pós FIAP — Oficina

API de oficina mecânica (ordens de serviço, clientes, veículos, catálogo, produtos e estoque), construída como um **monólito modular** em **NestJS + TypeScript + MongoDB**, com **JWT** e **Swagger** em `/api`, e deploy em **Kubernetes**.

Este README é um **índice**. A documentação detalhada está organizada por fase na pasta [`readme/`](readme) e os diagramas na pasta [`docs/`](docs).

---

## Documentação por fase

| Fase | Conteúdo | Link |
|------|----------|------|
| **Fase 1** | A aplicação: como rodar (Docker Compose / local), APIs, tecnologias e justificativa do MongoDB. Diagrama de componentes do monólito modular. | [`readme/fase-1.md`](readme/fase-1.md) |
| **Fase 2** | Deploy no Kind: Terraform (cluster) + manifestos `k8s/` com **Mongo + API + migrations** no mesmo cluster, HPA e CI/CD. | [`readme/fase-2.md`](readme/fase-2.md) |

---

## Arquitetura proposta

Três diagramas separados (Mermaid) em [`docs/diagrams/`](docs/diagrams):

### Componentes da aplicação

Monólito modular NestJS organizado por *bounded contexts* (`identidade`, `estoque`, `ordem-de-servico`) e um `shared` com value objects, validators e erros de domínio. O contexto `ordem-de-servico` conversa com os demais por meio de uma camada anticorrupção (ports/adapters), sem acoplamento direto.

Diagrama: [`docs/diagrams/componentes-aplicacao.md`](docs/diagrams/componentes-aplicacao.md)

### Infraestrutura provisionada

Cluster **Kubernetes local com Kind**, provisionado por **Terraform** (`infra/`). No mesmo cluster sobem, via [`k8s/`](k8s), **MongoDB**, Job de migrations, API (NodePort) e HPA — todos como workloads Kubernetes. O `metrics-server` habilita o autoscaling.

Diagrama: [`docs/diagrams/infra-kind-k8s.md`](docs/diagrams/infra-kind-k8s.md)

### Fluxo de deploy (CI/CD)

Pipelines no GitHub Actions: **CI** ([`ci.yml`](.github/workflows/ci.yml)) roda testes e build; **CD** ([`cd.yml`](.github/workflows/cd.yml)) testa, constrói as imagens Docker (`production` e `migrations`), provisiona o cluster Kind via Terraform, aplica os manifestos, roda as migrations, faz o deploy da API + HPA e executa o smoke test.

Diagrama: [`docs/diagrams/cicd-deploy.md`](docs/diagrams/cicd-deploy.md)

---

## Instruções

### Executar a aplicação (Fase 2 — somente Kubernetes / Kind)

**Regra:** API, Mongo e migrations rodam **só** no cluster. Não use Docker Compose
nem `yarn start` para servir a aplicação nesta fase.

1. Provisionar o cluster ([`infra/`](infra/)):

```bash
cd infra
terraform init
terraform apply -auto-approve
kind export kubeconfig --name tech-challenge
kubectl get nodes
```

2. Build + load das imagens e apply dos manifestos ([`k8s/`](k8s/)):

```bash
docker build --target production -t tech-challenge-api:latest .
docker build --target migrations -t tech-challenge-api:migrations .
kind load docker-image tech-challenge-api:latest --name tech-challenge
kind load docker-image tech-challenge-api:migrations --name tech-challenge

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/mongo-pvc.yaml -f k8s/mongo-service.yaml -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/migration-job.yaml
kubectl apply -f k8s/api-deployment.yaml -f k8s/api-service.yaml -f k8s/hpa.yaml
kubectl port-forward svc/api 8080:80 -n tech-challenge-namespace
# Health: http://localhost:8080/health/live e /health/ready
```

Passo a passo completo em [`readme/fase-2.md`](readme/fase-2.md). Detalhes do Terraform em [`infra/README.md`](infra/README.md).

### Desenvolvimento sem cluster (Fase 1 — Docker Compose)

Apenas para a documentação da Fase 1 ([`readme/fase-1.md`](readme/fase-1.md)). **Não** é o runtime da Fase 2.

```bash
cp .env.example .env
docker compose up -d --build
yarn migrate:up
# Swagger: http://localhost:3000/api  (login seed: admin@local.dev / admin123)
```

---

## APIs

- **Swagger (OpenAPI):** `http://localhost:8080/api` via `port-forward` no cluster Kind (Fase 2). Em Compose (só Fase 1): `http://localhost:3000/api`.
- **Collection (Postman/Insomnia):** _(a preencher com o link da collection)_
- **Passo a passo dos endpoints da Fase 2** (open → diagnóstico → orçamento → aprovação + status + listagem): [`docs/api-fluxo-fase-2-endpoints.md`](docs/api-fluxo-fase-2-endpoints.md)
- Outros roteiros: [`docs/api-fluxo-url-body.md`](docs/api-fluxo-url-body.md) e variantes na pasta [`docs/`](docs).

---

## Vídeo demonstrativo

Demonstra deploy da aplicação, execução do CI/CD, consumo das APIs e escalabilidade automática (HPA).

- **Link (Google Drive):** [Fase 2 — vídeo demonstrativo](https://drive.google.com/drive/folders/1lh3C0epIgxDlT67pXlC3IdDHHwV4oc2z?usp=sharing)

---

## Outros documentos

- Documentação por fase: [`readme/fase-1.md`](readme/fase-1.md) e [`readme/fase-2.md`](readme/fase-2.md)
- Infraestrutura (Terraform/Kind): [`infra/README.md`](infra/README.md)

**Licença:** UNLICENSED (projeto acadêmico).
