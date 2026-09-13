import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import {
  TELEMETRY,
  type TelemetryPort,
} from '../../domain/ports/telemetry.port';
import { TelemetryInterceptor } from '../../interfaces/http/interceptors/telemetry.interceptor';
import { buildLoggerOptions } from './pino-logger.config';
import { TelemetryModule } from './telemetry.module';

@Module({
  imports: [
    TelemetryModule,
    LoggerModule.forRootAsync({
      imports: [TelemetryModule],
      inject: [TELEMETRY],
      useFactory: (telemetry: TelemetryPort) => buildLoggerOptions(telemetry),
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TelemetryInterceptor,
    },
  ],
  exports: [TelemetryModule, LoggerModule],
})
export class ObservabilityModule {}
