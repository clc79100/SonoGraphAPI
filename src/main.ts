import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  // eslint-disable-next-line no-console
  console.log(`Sonograph API listening on :${envs.PORT}`);
}

bootstrap();
