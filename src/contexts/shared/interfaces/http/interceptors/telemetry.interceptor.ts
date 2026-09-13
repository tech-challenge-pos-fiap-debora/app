import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DomainError } from '../../../domain/errors';
import {
  TELEMETRY,
  type TelemetryPort,
} from '../../../domain/ports/telemetry.port';

/**
 * Registra falhas que não são regra de negócio — banco indisponível, timeout,
 * erro em adapter entre contextos. Alimenta o painel de erros de integração e
 * a política de alerta de falha no processamento de ordens de serviço.
 */
@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  constructor(
    @Inject(TELEMETRY)
    private readonly telemetry: TelemetryPort,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const operation = `${context.getClass().name}.${context.getHandler().name}`;

    return next.handle().pipe(
      catchError((error: unknown) => {
        if (this.isUnexpected(error)) {
          const failure =
            error instanceof Error ? error : new Error(String(error));

          this.telemetry.recordEvent('IntegrationFailureEvent', {
            operation,
            errorType: failure.name,
            message: failure.message,
          });
          this.telemetry.recordError(failure, { operation });
        }

        return throwError(() => error);
      }),
    );
  }

  private isUnexpected(error: unknown): boolean {
    return !(error instanceof DomainError) && !(error instanceof HttpException);
  }
}
