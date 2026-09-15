# Variante B — Fixtures da migration

**Pré-requisito:** `yarn migrate:up` com o mesmo `DATABASE_URL` que a API.

**Antes:** login e contexto em [Fluxo feliz da API — índice](api-fluxo-url-body.md).

Dados relevantes (seed em [`migrations/sql/002_seed.sql`](../migrations/sql/002_seed.sql)):

| Campo | Valor |
|-------|--------|
| Documento | `52998224725` |
| Placa | `APL-1234` |
| `clientId` | `33333333-3333-4333-8333-333333333301` |
| `vehicleId` | `44444444-4444-4444-8444-444444444401` |
| Serviço exemplo (`catalogServiceId`) | `55555555-5555-4555-8555-555555555501` |
| Peça extra sugerida | `DEMO-FILTER-01` |

## Cliente (consulta)

**URL:** `GET http://localhost:3000/clients/52998224725` · **JWT** · sem body.

## Veículo (consulta)

**URL:** `GET http://localhost:3000/vehicle/APL-1234` · **JWT** · sem body.

## Ordem de serviço

**URL:** `POST http://localhost:3000/service-orders` · **JWT**

```json
{
  "clientId": "33333333-3333-4333-8333-333333333301",
  "vehicleId": "44444444-4444-4444-8444-444444444401",
  "requestedServicesDescription": "Revisão demo migration"
}
```

Guarda o `id` da OS como `{OS_ID}`.

---

## Passos após criar a OS

**`{OS_ID}`:** `id` devolvido pelo `POST /service-orders` acima. Usa nas URLs desta secção.

**Ordem:** `PATCH .../diagnosis` (estado `IN_DIAGNOSIS`) → linhas na OS (`/services`, `/parts`) → resto do fluxo.

**Valores desta variante:** documento `52998224725`, placa `APL-1234`, `catalogServiceId` `55555555-5555-4555-8555-555555555501`, peça avulsa `DEMO-FILTER-01`.

### Diagnóstico

**Inicia o diagnóstico:** a OS passa para **`IN_DIAGNOSIS`**. No fluxo deste guia, faz este passo **antes** de `POST .../services` e `POST .../parts` (mudança de status antes de acrescentar peças e serviços). Gerar orçamento exige diagnóstico já registado.

**URL:** `PATCH http://localhost:3000/service-orders/{OS_ID}/diagnosis` · **JWT**

```json
{
  "diagnosis": "Diagnóstico iniciado."
}
```

### Serviço do catálogo na OS

**URL:** `POST http://localhost:3000/service-orders/{OS_ID}/services` · **JWT**

```json
{
  "catalogServiceId": "55555555-5555-4555-8555-555555555501",
  "quantity": 1
}
```

### Peça avulsa na OS

**URL:** `POST http://localhost:3000/service-orders/{OS_ID}/parts` · **JWT**

```json
{
  "productCode": "DEMO-FILTER-01",
  "quantity": 1
}
```

### Gerar orçamento

**Fecha o valor:** calcula totais (FIFO nas peças) e coloca a OS **à espera de aprovação**.

Na **primeira vez** nesse estado há **notificação simulada** (sem e-mail real): registo no **log** com prefixo `[orçamento enviado]` e JSON.

- API local (`yarn start:dev`): **terminal** do processo.
- Docker (`docker-compose`): **`docker compose logs -f api`**.

Repetir `POST /budget` no mesmo estado costuma **não** voltar a imprimir esse envio.

**URL:** `POST http://localhost:3000/service-orders/{OS_ID}/budget` · **JWT** · sem body.

### Consulta pública do orçamento

**URL:** `GET http://localhost:3000/public/service-orders/{OS_ID}/budget?document=52998224725&plate=APL-1234`

Sem JWT · sem body.

### Aprovação pública do orçamento

**URL:** `POST http://localhost:3000/public/service-orders/{OS_ID}/approve-budget?document=52998224725&plate=APL-1234`

Sem JWT · sem body.

### Finalizar execução

**URL:** `POST http://localhost:3000/service-orders/{OS_ID}/finish` · **JWT** · sem body.

### Status público (antes da entrega)

**URL:** `GET http://localhost:3000/public/service-orders/status?document=52998224725`

Sem JWT · sem body.

### Métrica — tempo médio de execução

**URL:** `GET http://localhost:3000/service-orders/metrics/average-execution-time` · **JWT** · sem body.

### Entregar veículo

**URL:** `POST http://localhost:3000/service-orders/{OS_ID}/deliver` · **JWT** · sem body.

### Detalhe da OS

**URL:** `GET http://localhost:3000/service-orders/{OS_ID}` · **JWT** · sem body.

### Status público (após entrega)

**URL:** `GET http://localhost:3000/public/service-orders/status?document=52998224725`

Após `DELIVERED`, esta OS deixa de aparecer na lista.
