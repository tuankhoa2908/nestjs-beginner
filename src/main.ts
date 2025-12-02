import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import config from './configs/app_server.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(config.SERVER.PORT);
}

bootstrap();
