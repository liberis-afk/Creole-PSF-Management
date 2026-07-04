import { BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs, createReadStream } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Stockage de fichiers partagé par tous les modules (parcelles, cultures,
 * équipements, activités). Centralise la mécanique sensible — validation,
 * écriture disque, création de la ligne Document polymorphe, lecture en flux,
 * suppression — pour supprimer la duplication qui existait dans chaque module.
 *
 * Chaque module conserve son propre contrôle d'appartenance (assert…) et sa
 * projection de liste ; seule la plomberie fichier/DB est mutualisée ici.
 * Cette couche disque local sera remplacée par le FilesModule (S3) au Module 13
 * sans toucher aux modules appelants.
 */
export class EntityFileStorage {
  private static racine(): string {
    return process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  }

  /**
   * Valide le fichier, l'écrit sur disque et crée la ligne Document.
   * Retourne l'id du document créé. Le `type` du Document vaut PHOTO pour une
   * image, AUTRE sinon (PDF…). Le chemin stocké est RELATIF à la racine.
   */
  static async ecrire(
    prisma: PrismaService,
    options: {
      fermeId: string;
      entiteType: string;
      entiteId: string;
      sousDossier: string;
      uploadePar: string;
      fichier: { originalname: string; mimetype: string; size: number; buffer: Buffer };
      imagesAutorisees: string[];
      docsAutorises?: string[];
      tailleMaxOctets: number;
      titre?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<{ id: string }> {
    const { fichier } = options;
    const estImage = options.imagesAutorisees.includes(fichier.mimetype);
    const estDoc = (options.docsAutorises ?? []).includes(fichier.mimetype);
    if (!estImage && !estDoc) {
      const formats = options.docsAutorises?.length ? 'JPEG, PNG, WebP ou PDF' : 'JPEG, PNG ou WebP';
      throw new BadRequestException(`Format non supporté (${formats} attendu).`);
    }
    if (fichier.size > options.tailleMaxOctets) {
      const mo = Math.round(options.tailleMaxOctets / (1024 * 1024));
      throw new BadRequestException(`Fichier trop volumineux (${mo} Mo maximum).`);
    }

    const dossier = join(this.racine(), options.sousDossier, options.entiteId);
    await fs.mkdir(dossier, { recursive: true });
    const extension = extname(fichier.originalname) || (estImage ? '.jpg' : '.pdf');
    const nomFichier = `${randomUUID()}${extension}`;
    await fs.writeFile(join(dossier, nomFichier), fichier.buffer);
    const cheminRelatif = join(options.sousDossier, options.entiteId, nomFichier);

    const document = await prisma.document.create({
      data: {
        fermeId: options.fermeId,
        type: estImage ? 'PHOTO' : 'AUTRE',
        titre: options.titre ?? fichier.originalname,
        fichierUrl: cheminRelatif,
        typeMime: fichier.mimetype,
        tailleOctets: fichier.size,
        entiteType: options.entiteType as never,
        entiteId: options.entiteId,
        latitude: options.latitude,
        longitude: options.longitude,
        uploadePar: options.uploadePar,
      },
      select: { id: true },
    });
    return { id: document.id };
  }

  /** Retourne un flux lisible du fichier (après vérification d'appartenance). */
  static async lire(
    prisma: PrismaService,
    where: { fermeId: string; entiteType: string; entiteId: string; docId: string },
  ) {
    const document = await prisma.document.findFirst({
      where: { id: where.docId, fermeId: where.fermeId, entiteType: where.entiteType as never, entiteId: where.entiteId },
      select: { fichierUrl: true, typeMime: true },
    });
    if (!document) throw new NotFoundException('Fichier introuvable');
    const cheminAbsolu = join(this.racine(), document.fichierUrl);
    try {
      await fs.access(cheminAbsolu);
    } catch {
      throw new NotFoundException('Fichier absent du stockage');
    }
    return { flux: createReadStream(cheminAbsolu), typeMime: document.typeMime ?? 'application/octet-stream' };
  }

  /** Supprime la ligne Document (source de vérité) puis le fichier disque. */
  static async supprimer(
    prisma: PrismaService,
    where: { fermeId: string; entiteType: string; entiteId: string; docId: string },
  ): Promise<void> {
    const document = await prisma.document.findFirst({
      where: { id: where.docId, fermeId: where.fermeId, entiteType: where.entiteType as never, entiteId: where.entiteId },
      select: { id: true, fichierUrl: true },
    });
    if (!document) throw new NotFoundException('Fichier introuvable');
    await prisma.document.delete({ where: { id: document.id } });
    try {
      await fs.unlink(join(this.racine(), document.fichierUrl));
    } catch {
      // Fichier déjà absent : la référence en base est partie, c'est l'essentiel.
    }
  }
}
