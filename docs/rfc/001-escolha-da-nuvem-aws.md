# RFC-001 — Escolha da nuvem AWS

| Campo | Valor |
|---|---|
| Identificador | RFC-001 |
| Título | Escolha da nuvem AWS para o Tech Challenge Fase 3 |
| Status | Aceita |
| Data | 2026-09-13 |
| Autores | Time Tech Challenge POS FIAP |
| Área | Infraestrutura / nuvem |

## 1. Resumo

Adotar Amazon Web Services como provedor único da Fase 3, restrito ao que o AWS Academy Learner Lab permite provisionar.

## 2. Motivação

O enunciado libera a escolha da nuvem, desde que existam API Gateway, function serverless, banco gerenciado, cluster Kubernetes com escalabilidade e Terraform. Era preciso um provedor em que o time tivesse conta institucional, orçamento e permissão real para criar esses recursos.

## 3. Contexto

O curso disponibiliza o Learner Lab. A conta rotaciona a cada sessão, as credenciais IAM são temporárias e várias APIs estão bloqueadas por Service Control Policy: não há `iam:CreateRole`, não há OIDC para GitHub e o DocumentDB não cria instância.

A aplicação da Fase 2 rodava em Kubernetes (Kind). Na Fase 3 o runtime migra para EKS e o banco para RDS PostgreSQL na mesma VPC.

## 4. Proposta

Usar AWS em `us-east-1` com este recorte:

- EKS para a API, com node group e HPA.
- API Gateway HTTP + Lambda para `POST /auth/login`.
- ECR para as imagens da API e das migrations.
- ALB (AWS Load Balancer Controller) para expor o Service do cluster.
- **RDS PostgreSQL** na VPC, provisionado pelo `infra-database` (RFC-002).
- State do Terraform em S3, bucket fixo por conta do lab.

IAM dedicado e IRSA ficam de fora: tudo assume a `LabRole` pré-existente.

## 5. Alternativas consideradas

### 5.1 Google Cloud (GKE + Cloud Functions + Cloud SQL)

Atende o enunciado. O time não tem crédito institucional equivalente ao Academy. Descartada por prazo.

### 5.2 Azure (AKS + Azure Functions + Azure Database)

Mesmo argumento: não há lab oficial da disciplina.

### 5.3 Kubernetes só local (Kind), sem nuvem

Atendia a Fase 2. Não atende “infraestrutura em nuvem”, API Gateway gerenciado nem function serverless.

## 6. Decisão

AWS Academy Learner Lab, região `us-east-1`, com os serviços listados na seção 4.

## 7. Consequências

**Positivas.** Os quatro repositórios provisionam recursos reais. Banco gerenciado, API e Lambda na mesma VPC.

**Negativas.** Credenciais IAM precisam ser ressincronizadas a cada sessão. Sem OIDC, o CI guarda access key temporária. Sem IRSA, o ALB Controller usa o instance profile do nó. DocumentDB indisponível no lab.

**Obrigações.** O runbook do `infra-kubernetes` documenta o ritual de sessão. A RFC-002 registra o RDS PostgreSQL.
