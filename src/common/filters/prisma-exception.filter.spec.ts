import { HttpAdapterHost } from '@nestjs/core';
import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

/**
 * Vérifie que le filet de sécurité mappe correctement les erreurs Prisma
 * connues et n'expose jamais de détail interne. On mocke l'adaptateur HTTP
 * pour capturer la réponse envoyée.
 */
describe('PrismaExceptionFilter', () => {
  let reply: jest.Mock;
  let filter: PrismaExceptionFilter;
  const reponse = {};
  const host = { switchToHttp: () => ({ getResponse: () => reponse }) } as unknown as ArgumentsHost;

  beforeEach(() => {
    reply = jest.fn();
    const httpAdapterHost = { httpAdapter: { reply } } as unknown as HttpAdapterHost;
    filter = new PrismaExceptionFilter(httpAdapterHost);
  });

  const erreur = (code: string, meta?: Record<string, unknown>) =>
    ({ code, meta, message: 'interne — ne doit pas fuiter' }) as unknown as Prisma.PrismaClientKnownRequestError;

  it('P2002 → 409, message nomme le champ en conflit (et masque fermeId)', () => {
    filter.catch(erreur('P2002', { target: ['fermeId', 'numeroSerie'] }), host);
    const [resp, corps, status] = reply.mock.calls[0];
    expect(resp).toBe(reponse);
    expect(status).toBe(409);
    expect(corps.statusCode).toBe(409);
    expect(corps.error).toBe('P2002');
    expect(corps.message).toContain('numeroSerie');
    expect(corps.message).not.toContain('fermeId'); // le champ technique de tenant est masqué
  });

  it('P2002 sans meta → message générique', () => {
    filter.catch(erreur('P2002'), host);
    expect(reply.mock.calls[0][1].message).toBe('Cette valeur existe déjà.');
  });

  it('P2025 → 404', () => {
    filter.catch(erreur('P2025'), host);
    const [, corps, status] = reply.mock.calls[0];
    expect(status).toBe(404);
    expect(corps.message).toBe('Ressource introuvable.');
  });

  it('P2003 → 409 (clé étrangère)', () => {
    filter.catch(erreur('P2003'), host);
    expect(reply.mock.calls[0][2]).toBe(409);
  });

  it("code inconnu → 500 sans exposer le message interne", () => {
    filter.catch(erreur('P2016'), host);
    const [, corps, status] = reply.mock.calls[0];
    expect(status).toBe(500);
    expect(corps.message).toBe('Erreur de base de données.');
    // Le message interne de Prisma ne doit jamais se retrouver dans la réponse.
    expect(JSON.stringify(corps)).not.toContain('ne doit pas fuiter');
  });
});
