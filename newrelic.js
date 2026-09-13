'use strict';

/**
 * Configuração do agente APM. Carregado antes do bootstrap pelo
 * `node -r newrelic dist/main.js` definido no Dockerfile, pois a instrumentação
 * precisa envolver os módulos (http, express, mongodb) antes de eles serem exigidos.
 */
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'tech-challenge-api'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,

  // Permite subir a aplicação sem telemetria em ambiente local e nos testes.
  agent_enabled: process.env.NEW_RELIC_ENABLED !== 'false',

  distributed_tracing: {
    enabled: true,
  },

  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    // Em container não há volume para arquivo de log do agente.
    filepath: 'stdout',
  },

  application_logging: {
    enabled: true,
    // Envia os logs da aplicação já correlacionados com trace.id e span.id.
    forwarding: {
      enabled: true,
      max_samples_stored: 10000,
    },
    local_decorating: {
      enabled: false,
    },
    metrics: {
      enabled: true,
    },
  },

  transaction_tracer: {
    enabled: true,
    record_sql: 'obfuscated',
  },

  error_collector: {
    enabled: true,
    // Respostas de negócio esperadas não são falhas da aplicação.
    ignore_status_codes: [400, 401, 403, 404, 409],
  },

  attributes: {
    exclude: [
      'request.headers.authorization',
      'request.headers.cookie',
      'request.headers.x-api-key',
      'request.body.password',
      'request.body.cpf',
      'request.body.document',
    ],
  },
};
