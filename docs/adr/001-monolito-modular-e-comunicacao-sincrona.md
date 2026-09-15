# ADR-001 — Monólito modular e comunicação síncrona HTTP

| Campo | Valor |
|---|---|
| Identificador | ADR-001 |
| Título | Monólito modular com comunicação síncrona entre contextos |
| Status | Aceita |
| Data | 2026-09-13 |
| Decisores | Time Tech Challenge POS FIAP |

## Contexto

A oficina precisa de identidade, estoque e ordem de serviço no mesmo ciclo de atendimento. Separar microserviços na Fase 3 exigiria filas, contratos versionados e três deploys para um time pequeno.

Os bounded contexts já existiam no NestJS (`identidade`, `estoque`, `ordem-de-servico`, `shared`), com ports e adapters.

## Decisão

Manter um único processo Node no Kubernetes. A comunicação entre contextos é **síncrona e em processo**: o contexto de OS chama ports (`ClientProvisioning`, `VehicleProvisioning`, `ProductLookup`) implementados por adapters que usam os repositórios dos outros módulos. Não há broker, não há HTTP interno, não há gRPC.

A borda HTTP é REST síncrono. O cliente da oficina e a Lambda falam JSON sobre HTTPS.

## Consequências

O deploy é uma imagem e um Deployment. A consistência da abertura da OS cabe numa transação SQL no RDS PostgreSQL. O custo é o acoplamento de release: um contexto instável derruba o processo inteiro — mitigado por HPA, probes e limites de recurso, não por isolamento de serviço.
