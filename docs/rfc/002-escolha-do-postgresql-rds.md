# RFC-002 — Escolha do Amazon RDS PostgreSQL como banco gerenciado

| Campo | Valor |
|---|---|
| Identificador | RFC-002 |
| Título | Amazon RDS PostgreSQL como banco gerenciado |
| Status | Aceita |
| Data | 2026-09-14 |
| Autores | Time Tech Challenge POS FIAP |
| Área | Dados |
| Relacionada | RFC-001, ADR-001, `docs/modelo-de-dados.md` |

## 1. Resumo

Adotar **Amazon RDS PostgreSQL 16** na VPC do Learner Lab como banco gerenciado. O repositório `infra-database` provisiona a instância com Terraform. A API NestJS, a Lambda de autenticação e os testes usam a mesma base relacional via `DATABASE_URL`.

## 2. Motivação

O enunciado exige banco gerenciado, modelo relacional, diagrama entidade-relacionamento e justificativa da escolha.

O AWS Academy Learner Lab **nega** `rds:CreateDBInstance` para o engine `docdb` (DocumentDB). Libera PostgreSQL, MySQL, MariaDB e Aurora em classes nano/micro/small/medium, gp2 até 100 GB, sem Multi-AZ e sem Enhanced Monitoring.

MongoDB Atlas e DocumentDB foram descartados: o banco gerenciado precisa estar na AWS e ser provisionado pelo Terraform do quarto repositório.

## 3. Proposta

### 3.1 Motor e acesso

- PostgreSQL 16, driver `pg`, ORM TypeORM no NestJS.
- Migrations versionadas em SQL (`migrations/sql/`).
- Lambda de auth: consulta `SELECT` na tabela `client`.

### 3.2 Hospedagem

RDS `db.t3.micro`, 20 GB gp2, database `techchallenge`, subnets privadas da VPC `tech-challenge`, security group liberando porta 5432 dentro do CIDR da VPC. API (EKS), Lambda (subnets privadas) e Job de migrations alcançam o endpoint pela rede interna — sem exposição pública.

### 3.3 Modelo relacional

O domínio mapeia para tabelas com FK onde o cadastro é fonte de verdade e **colunas copiadas** (snapshot) onde a ordem de serviço precisa preservar nome, placa e preço do dia. Detalhes em `docs/modelo-de-dados.md`.

## 4. Alternativas consideradas

| Alternativa | Motivo da rejeição |
|---|---|
| Amazon DocumentDB | `CreateDBInstance` negado para engine `docdb` no lab |
| MongoDB Atlas | Fora da AWS; não atende “banco gerenciado na conta do lab” |
| MongoDB em Deployment no EKS | Não é banco gerenciado |
| MySQL / MariaDB RDS | Válidos no lab; PostgreSQL escolhido por suporte JSON e tipos ricos para histórico de status |

## 5. Decisão

RDS PostgreSQL provisionado pelo `infra-database`. Contrato entre repositórios: secret `DATABASE_URL` (connection string `postgresql://…`) nos repos `infra-kubernetes` e `lambda-auth`.

## 6. Consequências

**Positivas.** Banco gerenciado real na AWS. Modelo ER nativo para o enunciado. Backup e criptografia gerenciados pelo RDS. Mesma VPC da API e da Lambda.

**Negativas.** Reescrita da camada de persistência (repositórios, migrations, testes de integração). Credenciais do lab continuam rotacionando a cada sessão.

**Obrigações.** Índices únicos em `client.document`, `vehicle.plate`, `user.email`, `product.code`. Snapshot de cliente/veículo na abertura da OS. `ON DELETE RESTRICT` nas FKs de OS para não apagar histórico.
