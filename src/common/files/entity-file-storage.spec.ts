import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EntityFileStorage } from './entity-file-storage';

/**
 * Tests du stockage de fichiers partagé (factorisé lors de la revue). Les
 * écritures se font dans un dossier temporaire ; Prisma est mocké. Ces tests
 * verrouillent la validation (format/taille) et le chemin relatif stocké.
 */
describe('EntityFileStorage', () => {
  let prisma: any;
  let racine: string;

  const fichierImage = {
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('contenu-image'),
  };

  beforeEach(async () => {
    racine = join(tmpdir(), `psf-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    process.env.UPLOADS_DIR = racine;
    prisma = { document: { create: jest.fn().mockResolvedValue({ id: 'doc-1' }) } };
  });

  afterEach(async () => {
    await fs.rm(racine, { recursive: true, force: true }).catch(() => undefined);
    delete process.env.UPLOADS_DIR;
  });

  describe('ecrire — validation', () => {
    it('refuse un format non autorisé', async () => {
      await expect(
        EntityFileStorage.ecrire(prisma, {
          fermeId: 'f1', entiteType: 'CULTURE', entiteId: 'c1', sousDossier: 'cultures', uploadePar: 'u1',
          fichier: { ...fichierImage, mimetype: 'application/x-msdownload' },
          imagesAutorisees: ['image/jpeg'], tailleMaxOctets: 10 * 1024 * 1024,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.document.create).not.toHaveBeenCalled();
    });

    it('refuse un fichier trop volumineux', async () => {
      await expect(
        EntityFileStorage.ecrire(prisma, {
          fermeId: 'f1', entiteType: 'CULTURE', entiteId: 'c1', sousDossier: 'cultures', uploadePar: 'u1',
          fichier: { ...fichierImage, size: 20 * 1024 * 1024 },
          imagesAutorisees: ['image/jpeg'], tailleMaxOctets: 10 * 1024 * 1024,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepte un PDF quand docsAutorises le permet', async () => {
      const res = await EntityFileStorage.ecrire(prisma, {
        fermeId: 'f1', entiteType: 'ACTIVITE', entiteId: 'a1', sousDossier: 'activites', uploadePar: 'u1',
        fichier: { originalname: 'plan.pdf', mimetype: 'application/pdf', size: 2048, buffer: Buffer.from('%PDF') },
        imagesAutorisees: ['image/jpeg'], docsAutorises: ['application/pdf'], tailleMaxOctets: 15 * 1024 * 1024,
      });
      expect(res.id).toBe('doc-1');
      // Le Document est typé AUTRE (pas une image).
      expect(prisma.document.create.mock.calls[0][0].data.type).toBe('AUTRE');
    });
  });

  describe('ecrire — écriture et persistance', () => {
    it('écrit le fichier sur disque et enregistre un chemin RELATIF', async () => {
      const res = await EntityFileStorage.ecrire(prisma, {
        fermeId: 'f1', entiteType: 'PARCELLE', entiteId: 'p1', sousDossier: 'parcelles', uploadePar: 'u1',
        fichier: fichierImage, imagesAutorisees: ['image/jpeg'], tailleMaxOctets: 10 * 1024 * 1024,
        latitude: 18.5, longitude: -72.3,
      });
      expect(res.id).toBe('doc-1');

      const data = prisma.document.create.mock.calls[0][0].data;
      expect(data.type).toBe('PHOTO');
      expect(data.fermeId).toBe('f1');
      expect(data.entiteType).toBe('PARCELLE');
      expect(data.latitude).toBe(18.5);
      // Chemin relatif (jamais la racine absolue).
      expect(data.fichierUrl.startsWith('parcelles/p1/')).toBe(true);
      // Le fichier existe réellement sur disque.
      await expect(fs.access(join(racine, data.fichierUrl))).resolves.toBeUndefined();
    });
  });
});
