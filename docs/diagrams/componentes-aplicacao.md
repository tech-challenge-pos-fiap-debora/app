# Diagrama de Componentes — Monólito Modular (NestJS)

A aplicação é um **monólito modular** organizado por *bounded contexts* de DDD.
Cada contexto vive em `src/contexts/<contexto>` e é dividido nas camadas
`domain`, `application`, `infrastructure` e `interfaces` (Clean Architecture).

Os contextos são registrados como módulos NestJS em
`src/contexts/shared/infrastructure/ioc/*` e importados por `src/app.module.ts`.

O contexto `ordem-de-servico` acessa `identidade` e `estoque` apenas pela
camada anticorrupção em `src/contexts/ordem-de-servico/infrastructure/adapters/`
(`IdentidadeClientAdapter`, `IdentidadeVehicleAdapter`, `EstoqueProductAdapter`).

## Contextos e submódulos

| Contexto | Submódulos (rotas HTTP) | Responsabilidade |
|----------|-------------------------|------------------|
| `identidade` | `auth`, `client`, `vehicle` | Autenticação/JWT, clientes e veículos |
| `estoque` | `product`, `product-batch` | Produtos e lotes/estoque |
| `ordem-de-servico` | `catalog-service`, `service-order` | Catálogo de serviços e Ordens de Serviço |
| `shared` | `config`, `health`, `validators` | Configuração, health checks e validadores comuns |

## Visão de componentes

```mermaid
flowchart TB
    Client["Cliente HTTP / Swagger (/api)"]

    subgraph App["AppModule (NestJS)"]
        direction TB

        subgraph Identidade["Contexto: identidade"]
            Auth["auth (JWT / login / users)"]
            Clients["client (/clients)"]
            Vehicle["vehicle (/vehicle)"]
        end

        subgraph Estoque["Contexto: estoque"]
            Product["product (/product)"]
            ProductBatch["product-batch (/product-batch)"]
        end

        subgraph Ordem["Contexto: ordem-de-servico"]
            Catalog["catalog-service (/services)"]
            ServiceOrder["service-order (/service-orders + /public)"]
            Adapters["adapters ACL"]
        end

        subgraph Shared["Contexto: shared"]
            Config["config"]
            Health["health (/health/live, /health/ready)"]
            Validators["validators (CPF/CNPJ, placa)"]
        end
    end

    PG[("PostgreSQL RDS")]

    Client --> Auth
    Client --> Clients
    Client --> Vehicle
    Client --> Product
    Client --> ProductBatch
    Client --> Catalog
    Client --> ServiceOrder
    Client --> Health

    ServiceOrder --> Adapters
    Adapters -.->|snapshot cliente/veiculo| Identidade
    Adapters -.->|consulta produtos| Estoque
    ServiceOrder --> Catalog

    Identidade --> PG
    Estoque --> PG
    Ordem --> PG
```

## Camadas por contexto (Clean Architecture)

```mermaid
flowchart LR
    subgraph Contexto["src/contexts/<contexto>"]
        Interfaces["interfaces (HTTP: controllers, DTOs, validators)"]
        Application["application (use-cases)"]
        Domain["domain (entities, value-objects, repositories, ports, services)"]
        Infrastructure["infrastructure (repositórios SQL, IoC)"]
    end

    Interfaces --> Application
    Application --> Domain
    Infrastructure --> Application
    Infrastructure --> Domain
```

> **Nota:** as regras de dependência apontam sempre para o `domain`. As camadas
> `interfaces` e `infrastructure` dependem de `application`/`domain`, nunca o
> contrário. Em `domain`, `ports/` guarda contratos externos (`*.port.ts`);
> `services/` fica só para lógica de domínio pura (sem I/O), quando existir.
