import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: configService.get<string[]>('cors.origin'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // rejette silencieusement les champs non déclarés dans les DTO
      forbidNonWhitelisted: true, // ...et lève une erreur explicite plutôt que de les ignorer
      transform: true, // convertit automatiquement les payloads vers les types des DTO
    }),
  );

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Creole PSF Manage — API')
    .setDescription(
      "Documentation de l'API REST. Module 1 (Authentification) implémenté ; " +
        'les modules suivants seront ajoutés progressivement à cette même documentation.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = configService.get<number>('port')!;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API démarrée sur http://localhost:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`Documentation Swagger : http://localhost:${port}/api/docs`);
}

bootstrap();
