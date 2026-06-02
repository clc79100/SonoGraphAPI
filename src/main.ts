import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/logger/all-exceptions.filter';
import { envs } from './config/envs';

async function bootstrap() {
  if (
    envs.NODE_ENV === 'production' &&
    envs.APPLICATIONINSIGHTS_CONNECTION_STRING
  ) {
    // Debe inicializarse antes de NestFactory.create para que el SDK pueda
    // parchear http/https/pg/ioredis antes de que NestJS los cargue.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appInsights = require('applicationinsights');
    appInsights
      .setup(envs.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoCollectRequests(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectExceptions(false)
      .setAutoCollectConsole(false)
      .setSendLiveMetrics(false)
      .start();

    // 20% de sampling para GET /genres — se llama mucho y siempre es exitoso
    appInsights.defaultClient.addTelemetryProcessor(
      (envelope: { data: { baseData?: { name?: string } } }) => {
        const name = envelope.data?.baseData?.name ?? '';
        if (name.includes('/genres') && Math.random() > 0.2) return false;
        return true;
      },
    );
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: envs.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  });

  await app.listen(envs.PORT);
  app
    .get(WINSTON_MODULE_NEST_PROVIDER)
    .log(`Sonograph API listening on :${envs.PORT}`, 'Bootstrap');
}

bootstrap();
