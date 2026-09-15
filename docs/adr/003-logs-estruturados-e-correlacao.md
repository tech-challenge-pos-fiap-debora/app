# ADR-003 — Logs JSON e correlação por correlationId e traceId

| Campo | Valor |
|---|---|
| Identificador | ADR-003 |
| Título | Logs estruturados em JSON com correlationId e traceId |
| Status | Aceita |
| Data | 2026-09-13 |
| Decisores | Time Tech Challenge POS FIAP |

## Contexto

O enunciado pede log estruturado, de preferência JSON, e um mecanismo para seguir uma requisição entre Lambda, API e banco. O logger padrão do Nest escreve texto livre, sem id compartilhado.

## Decisão

1. **Formato.** Uma linha JSON por evento (Pino na API, `JSON.stringify` na Lambda). Campo de mensagem: `message`. Nível em texto (`info`, `warn`, `error`).
2. **correlationId.** Header `x-request-id`. Se o cliente envia, reutiliza; senão a API gera UUID e a Lambda usa o header ou o `awsRequestId`. O valor volta no header da resposta e entra em toda linha de log.
3. **traceId.** O agente New Relic da API anexa `trace.id` / `span.id` no encaminhamento de log e grava `traceId` nos eventos `ServiceOrderEvent`.
4. **O que não se loga.** Authorization, cookie, CPF no body do APM, probes `/health/*`.
5. **Transporte.** Agente Node encaminha o stdout da API. A extensão da Lambda encaminha o stdout da function. Sem Fluent Bit no cluster.

## Consequências

Uma busca `WHERE correlationId = '...'` no New Relic mostra login e chamadas seguintes se o cliente propagar o header. Do evento de OS abre-se o trace. Sem o header no segundo hop, cada componente ainda tem o próprio id — a correlação ponta a ponta é responsabilidade do cliente HTTP (Postman, no vídeo).
