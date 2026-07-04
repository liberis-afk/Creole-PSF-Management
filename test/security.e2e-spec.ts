import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests e2e de l'API. NÉCESSITE une base de test accessible via DATABASE_URL
 * (le PrismaService se connecte au démarrage de l'application).
 *
 * Ces tests vérifient la config globale de sécurité : le guard JWT global
 * protège toutes les routes non marquées @Public. On n'a pas besoin de données
 * ni d'authentification pour prouver le rejet 401.
 */
describe('API — sécurité (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('refuse la liste des activités sans token (401)', () => {
    return request(app.getHttpServer()).get('/api/v1/activites').expect(401);
  });

  it('refuse la vue calendrier sans token (401)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/activites/calendrier?debut=2026-07-01&fin=2026-07-31')
      .expect(401);
  });

  it('refuse la liste des parcelles sans token (401)', () => {
    return request(app.getHttpServer()).get('/api/v1/parcelles').expect(401);
  });

  it('refuse la création (POST) sans token (401)', () => {
    return request(app.getHttpServer()).post('/api/v1/activites').send({ titre: 'x' }).expect(401);
  });
});
