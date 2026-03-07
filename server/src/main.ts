import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CORS_ORIGINS, PORT } from './common/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true
    }
  });
  await app.listen(PORT);
  logger.log(`Habbit Runner API listening on http://localhost:${PORT}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start server', error);
  process.exit(1);
});
