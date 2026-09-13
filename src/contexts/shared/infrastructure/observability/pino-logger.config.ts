import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import type { TelemetryPort } from '../../domain/ports/telemetry.port';

export const CORRELATION_ID_HEADER = 'x-request-id';

/**
 * Logs em JSON com um identificador de correlação por requisição. O mesmo id é
 * devolvido no header da resposta e anexado à transação do APM, o que permite
 * partir de uma linha de log e chegar ao trace correspondente (e vice-versa).
 */
export function buildLoggerOptions(telemetry: TelemetryPort): Params {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  return {
    pinoHttp: {
      level:
        process.env.LOG_LEVEL ||
        (isTest ? 'silent' : isProduction ? 'info' : 'debug'),

      // Alinha o campo de mensagem ao que o New Relic espera ao indexar logs.
      messageKey: 'message',
      formatters: {
        level: (label) => ({ level: label }),
      },

      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const received = req.headers[CORRELATION_ID_HEADER];
        const correlationId =
          typeof received === 'string' && received.trim()
            ? received.trim()
            : randomUUID();

        res.setHeader(CORRELATION_ID_HEADER, correlationId);
        telemetry.addTransactionAttribute('correlationId', correlationId);

        return correlationId;
      },

      customProps: (req) => ({
        correlationId: req.id,
        service: process.env.NEW_RELIC_APP_NAME || 'tech-challenge-api',
      }),

      // Probes do Kubernetes batem a cada poucos segundos e não agregam sinal.
      autoLogging: {
        ignore: (req: IncomingMessage) => (req.url || '').startsWith('/health'),
      },

      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },

      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          'res.headers["set-cookie"]',
        ],
        remove: true,
      },

      // pino-pretty roda em worker thread, que trava o encerramento do Jest.
      // Em produção o formato precisa ser JSON puro para o Fluent Bit.
      transport:
        isProduction || isTest
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            },
    },
  };
}
