# Diagrama de Fluxo CI/CD

> **Fase 3 (produção):** CI usa PostgreSQL; deploy na AWS via ECR + `infra-kubernetes`.
> Os diagramas abaixo descrevem também o CD legado da Fase 2 (Kind + Postgres local).

Baseado nos workflows reais do repositório:
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) e
[`.github/workflows/cd.yml`](../../.github/workflows/cd.yml).

## CI — Integração Contínua (`ci.yml`)

Dispara em `push` para `main`/`master` e em `pull_request`. Sobe um serviço
PostgreSQL e roda testes + build.

```mermaid
flowchart LR
    Trigger["push / pull_request"] --> Checkout["Checkout"]
    Checkout --> Install["yarn install --frozen-lockfile"]
    Install --> Unit["yarn test"]
    Unit --> Integration["yarn test:integration PostgreSQL service"]
    Integration --> Build["yarn build"]
```

## CD — Entrega/Deploy Contínuo (`cd.yml`)

Dispara em `push` para `main`/`master`/`fase-02` (ou `workflow_dispatch`). Três
jobs encadeados: testes, build das imagens e provisionamento + deploy.

```mermaid
flowchart TB
    Trigger["push main/master/fase-02 ou workflow_dispatch"]

    subgraph Test["Job 1: Testes + build"]
        T1["yarn test"] --> T2["yarn test:integration"] --> T3["yarn build"]
    end

    subgraph Images["Job 2: Build das imagens Docker"]
        I1["Buildx"] --> I2["Build target=production"]
        I2 --> I3["Build target=migrations"]
        I3 --> I4["Upload artefatos .tar"]
    end

    subgraph Deploy["Job 3: Provisiona Terraform/Kind + deploy K8s"]
        D1["Download das imagens"] --> D2["terraform apply Kind + namespace + metrics-server"]
        D2 --> D3["kind load docker-image"]
        D3 --> D4["kubectl apply namespace ConfigMap Secret"]
        D4 --> D5["PostgreSQL PVC Service Deployment"]
        D5 --> D6["Job api-migration"]
        D6 --> D7["API Deployment Service HPA"]
        D7 --> D8["Smoke test /health/live e /health/ready"]
        D8 --> D9["terraform destroy if always"]
    end

    Trigger --> Test
    Test --> Images
    Images --> Deploy
```

> Após o smoke test, o `cd.yml` roda `terraform destroy` com `if: always()`
> (sucesso ou falha). O cluster Kind do CD vive só no runner efêmero do job;
> demos ou inspeção prolongada usam Kind local (`infra/`).

## Resumo

| Etapa | Onde | O que faz |
|-------|------|-----------|
| **CI** | `ci.yml` (job `test`) | Build, testes unitários e de integração a cada PR/push |
| **CD — Build** | `cd.yml` (job `build-images`) | Gera imagens Docker `production` e `migrations` |
| **CD — Deploy** | `cd.yml` (job `deploy`) | Cria cluster Kind, aplica migrations, faz deploy da API + HPA, valida com smoke test e destrói o cluster |
