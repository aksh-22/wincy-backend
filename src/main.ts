import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { AllExceptionsFilter } from './filters/exceptions.filter';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
  .setTitle('Wincy')
  .setDescription('Wincy API description')
  .setVersion('1.0')
  .addTag('wincy')
  .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalFilters(new AllExceptionsFilter);
  app.useGlobalPipes(new ValidationPipe({whitelist: true}));
  app.enableCors();
  app.use(helmet());

  await app.listen(ConfigService.keys.PORT || 3000);
}
bootstrap();
