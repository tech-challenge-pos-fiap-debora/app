# RFC-004 — Observabilidade com New Relic

| Campo | Valor |
|---|---|
| Identificador | RFC-004 |
| Título | New Relic como plataforma única de APM, logs, Kubernetes e alertas |
| Status | Aceita |
| Data | 2026-09-13 |
| Autores | Time Tech Challenge POS FIAP |
| Área | Observabilidade |
| Relacionada | ADR-003 |

## 1. Resumo

Instrumentar API, cluster e Lambda com New Relic. Dashboards e alertas entram como código Terraform no `infra-kubernetes`.

## 2. Motivação

O enunciado pede latência das APIs, CPU e memória do Kubernetes, healthchecks, disponibilidade, falhas no processamento de OS, logs JSON com correlação e dashboards de volume diário, tempo médio por status e erros de integração — demonstráveis no vídeo.

## 3. Contexto

A Fase 2 tinha só probes `/health/live` e `/health/ready`. Sem APM, sem log estruturado global, sem correlation id.

Datadog e New Relic estão no texto oficial. O plano gratuito do Datadog cobre infraestrutura (até 5 hosts, 1 dia de retenção) e **não inclui APM nem gestão de logs**. O trial de 14 dias expiraria durante a avaliação. O New Relic tem free tier perpétuo: 100 GB/mês, um usuário full, APM com tracing, Kubernetes, logs e serverless, sem cartão.

## 4. Proposta

- Agente Node carregado com `node -r newrelic dist/main.js`.
- Logs JSON via Pino, com `x-request-id` = `correlationId`, anexado à transação.
- Encaminhamento de log pelo próprio agente (`application_logging.forwarding`). Fluent Bit do `nri-bundle` fica desligado para não duplicar linha.
- Eventos `ServiceOrderEvent` e `IntegrationFailureEvent` para os widgets de negócio.
- Helm `nri-bundle` no cluster: infraestrutura, `kube-state-metrics`, eventos, metadata injection.
- Layer oficial na Lambda quando a license key existe.
- Região US, alinhada ao EKS em `us-east-1`.

OpenTelemetry não entra: o agente New Relic já instrumenta HTTP, Express e PostgreSQL (`pg`). Os dois juntos duplicariam spans.

## 5. Alternativas consideradas

### 5.1 Datadog

Pedido no enunciado. Sem APM/logs no free permanente. Descartado.

### 5.2 Prometheus + Grafana + Loki no cluster

Atende métricas e logs. Não entrega APM/traces prontos nem serverless. Operar três stacks no Learner Lab é custo de nó que o HPA já disputa.

### 5.3 CloudWatch só

Barato. Dashboards de negócio e traces distribuídos ficam pobres. O enunciado cita ferramenta tipo Datadog/New Relic.

## 6. Decisão

New Relic, região United States, instrumentação por agente (não por OpenTelemetry).

## 7. Consequências

**Positivas.** Um único produto cobre o vídeo. Dashboards versionados. Free tier sobrevive à entrega.

**Negativas.** License key, account id e user API key (`NRAK`) são secrets. Sem a user key o Terraform não cria dashboard; o cluster sobe mesmo assim.

**Obrigações.** Demonstrar no vídeo: APM, log com `correlationId`, evento de OS e o dashboard provisionado.
