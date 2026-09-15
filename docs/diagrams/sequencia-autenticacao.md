# Diagrama de sequência — autenticação por CPF

Fluxo do cliente até o consumo de uma rota protegida.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente
    participant GW as API Gateway
    participant FN as Lambda auth
    participant DB as RDS client
    participant ALB as ALB / API NestJS
    participant NR as New Relic

    Cliente->>GW: POST /auth/login { cpf } + x-request-id
    GW->>FN: proxy HTTP
    FN->>FN: normaliza e valida dígitos do CPF
    alt CPF inválido ou ausente
        FN-->>Cliente: 400 + correlationId
    else CPF válido
        FN->>DB: SELECT WHERE document = cpf
        alt não encontrado
            FN-->>Cliente: 401 Cliente não encontrado
        else status INACTIVE
            FN-->>Cliente: 403 Cliente inativo
        else status ACTIVE
            FN->>FN: jwt.sign(sub, email, role=cliente)
            FN->>NR: log JSON correlationId
            FN-->>Cliente: 200 { access_token } + x-request-id
        end
    end

    Cliente->>ALB: GET/POST rota protegida<br/>Authorization: Bearer + x-request-id
    ALB->>ALB: JwtAuthGuard + ValidateUserUseCase
    ALB->>DB: SELECT client BY id(sub) AND status ACTIVE
    alt token inválido ou cliente inativo
        ALB-->>Cliente: 401
    else autorizado
        ALB->>ALB: executa use case
        ALB->>NR: log JSON + transação APM
        ALB-->>Cliente: 2xx + x-request-id
    end
```

## Notas

- Usuário interno (`admin`, `atendente`…) autentica em `POST /auth/login` **da API**, com e-mail e senha. Esse caminho não passa pela Lambda.
- O `JWT_SECRET` da function e o do Deployment precisam ser o mesmo.
- Lambda e API usam o mesmo RDS via `DATABASE_URL` (rede privada da VPC).
