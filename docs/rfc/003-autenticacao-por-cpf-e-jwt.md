# RFC-003 — Autenticação por CPF com Function Serverless e JWT

| Campo | Valor |
|---|---|
| Identificador | RFC-003 |
| Título | Autenticação de cliente por CPF via Lambda e JWT compartilhado |
| Status | Aceita |
| Data | 2026-09-13 |
| Autores | Time Tech Challenge POS FIAP |
| Área | Segurança / identidade |
| Relacionada | ADR-001, ADR-003 |

## 1. Resumo

O cliente autentica-se com o CPF em `POST /auth/login` no API Gateway. Uma Lambda valida o documento, consulta existência e status na collection `client` e devolve um JWT. A API NestJS no EKS aceita esse token nas rotas protegidas, com o mesmo `JWT_SECRET`.

## 2. Motivação

O enunciado exige API Gateway, proteção das rotas sensíveis, function serverless que valide CPF, consulte existência e status, e emita JWT. O professor confirmou que, nesta entrega, o gateway pode expor só a rota de login.

## 3. Contexto

A Fase 2 já tinha login de usuários internos (`admin`, `atendente`, `mecanico`, `estoquista`) em `POST /auth/login` na própria API, com e-mail e senha. O cliente não tinha senha — o identificador de negócio é o CPF/CNPJ.

Havia três caminhos possíveis: Cognito, authorizer no API Gateway na frente de todas as rotas, ou uma function só de login e JWT validado pela API.

## 4. Proposta

### 4.1 Fluxo do cliente

1. Cliente envia `{ "cpf": "..." }` para o API Gateway.
2. A Lambda normaliza os dígitos e valida o CPF (`cpf-cnpj-validator`).
3. Consulta `client` por `document`.
4. Recusa se não existir (`401`) ou se `status !== ACTIVE` (`403`).
5. Assina JWT com `sub` = `_id`, `email`, `role: "cliente"` e o `JWT_SECRET` compartilhado.
6. A API valida o Bearer com Passport JWT e `ValidateUserUseCase`: se a role é `cliente`, recarrega o cadastro e recusa inativo ou inexistente.

### 4.2 Fluxo interno

Usuários da oficina continuam autenticando na API (`POST /auth/login` com e-mail e senha). Não passam pela Lambda.

### 4.3 Gateway

API Gateway HTTP (v2), stage `prod`, integração AWS_PROXY, rota `POST /auth/login`. Sem JWT Authorizer: a proteção das rotas da oficina fica no `JwtAuthGuard` + `RolesGuard` do NestJS. O tráfego da API entra pelo ALB do EKS.

### 4.4 Correlação

A Lambda devolve `x-request-id`. Se o cliente reenviar o header nas chamadas seguintes, logs da function e da API compartilham o mesmo `correlationId`.

## 5. Alternativas consideradas

### 5.1 Amazon Cognito

User pool + authorizer nativo. O enunciado pede function que consulta a base da oficina. Cognito duplicaria a identidade e exigiria sync de CPF. Descartado.

### 5.2 API Gateway na frente de todas as rotas, com JWT Authorizer

Atende “roteamento” de forma mais literal. O professor autorizou só o login. Centralizar tudo exigiria VPC Link ou HTTP proxy para o ALB e reescreveria o Ingress. Fora do prazo.

### 5.3 Login de cliente dentro do NestJS

Já existia infraestrutura JWT. Não cumpriria “function serverless” nem o repositório obrigatório da Lambda.

## 6. Decisão

Lambda + API Gateway só no login; JWT HS256 com secret compartilhado; status `ACTIVE`/`INACTIVE` na collection `client`; validação repetida na API.

## 7. Consequências

**Positivas.** Repositório `lambda-auth` cumpre o enunciado. Token curto, sem senha de cliente. Mesmo contrato de papéis da Fase 2.

**Negativas.** Secret compartilhado entre dois repos — precisa coincidir. Sem authorizer no gateway, uma chamada direta ao ALB ainda depende do guard da API (o que já era o modelo da Fase 2).

**Obrigações.** `JWT_SECRET` idêntico nos secrets da Lambda e do EKS. Campo `status` persistido e checado nos dois lados.
