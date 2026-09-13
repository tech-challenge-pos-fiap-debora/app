import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureHttpApp } from './contexts/shared/interfaces/http/config/configure-http-app';

async function bootstrap() {
  // bufferLogs segura os logs do boot até o logger JSON assumir.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureHttpApp(app);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
