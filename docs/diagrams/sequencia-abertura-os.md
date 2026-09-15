# Diagrama de sequência — abertura de ordem de serviço

Fluxo do atendente autenticado até a OS persistida e o evento de negócio no New Relic.

```mermaid
sequenceDiagram
    autonumber
    actor Atendente
    participant API as API NestJS
    participant Ident as Contexto identidade
    participant Est as Contexto estoque
    participant Dom as ServiceOrder
    participant Repo as TelemetryServiceOrderRepository
    participant DB as RDS service_order
    participant NR as New Relic

    Atendente->>API: POST /service-orders + Bearer JWT + x-request-id
    API->>API: JwtAuthGuard (atendente ou admin)
    API->>Ident: getOrCreate(cliente)
    Ident->>Ident: recusa se status INACTIVE
    API->>Ident: getOrCreate(veículo)
    API->>Est: valida peças e preços do catálogo
    alt catálogo inativo ou peça inexistente
        API-->>Atendente: 4xx regra de negócio
    else dados válidos
        API->>Dom: ServiceOrder.create(...)
        Dom->>Dom: status RECEIVED + evento ServiceOrderOpened
        API->>Repo: create(order)
        Repo->>DB: INSERT service_order + snapshots + linhas
        Repo->>NR: ServiceOrderEvent + log JSON
        Repo-->>API: OS persistida
        API-->>Atendente: 201 OS + x-request-id
    end
```

## O que a OS grava no RDS

Uma linha em `service_order`: FKs `client_id` / `vehicle_id`, snapshot (`client_name`, `vehicle_plate`, …) e JSONB `service_lines`, `part_lines`, `budget`, `status_history`. Não há tabelas filhas de linha/orçamento. Leitura posterior não faz JOIN com cadastro.

## Telemetria

`previousStatusDurationMs` só existe nas transições seguintes (diagnóstico → execução → finalização). A abertura emite `event = ServiceOrderOpened`, que alimenta o widget de volume diário.
