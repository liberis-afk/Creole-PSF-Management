import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EntityFileStorage } from '../../common/files/entity-file-storage';

/**
 * Pièces jointes d'une activité : photos ET documents (PDF). Mécanique
 * fichier/DB mutualisée (EntityFileStorage). Le champ `type` du Document
 * distingue PHOTO des autres pièces.
 */
@Injectable()
export class ActivitesPhotosService {
  private readonly imagesAutorisees = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly docsAutorises = ['application/pdf'];
  private readonly tailleMaxOctets = 15 * 1024 * 1024;

  constructor(private readonly prisma: PrismaService) {}

  private url(activiteId: string, docId: string) {
    return `/api/v1/activites/${activiteId}/pieces-jointes/${docId}/fichier`;
  }

  async list(fermeId: string, activiteId: string) {
    await this.assertActivite(fermeId, activiteId);
    const pieces = await this.prisma.document.findMany({
      where: { fermeId, entiteType: 'ACTIVITE', entiteId: activiteId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, titre: true, type: true, typeMime: true, tailleOctets: true, createdAt: true },
    });
    return pieces.map((p) => ({
      id: p.id,
      titre: p.titre,
      type: p.type,
      estImage: (p.typeMime ?? '').startsWith('image/'),
      typeMime: p.typeMime,
      taille: p.tailleOctets,
      url: this.url(activiteId, p.id),
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async upload(
    fermeId: string,
    activiteId: string,
    uploadePar: string,
    fichier: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    titre?: string,
  ) {
    await this.assertActivite(fermeId, activiteId);
    const { id } = await EntityFileStorage.ecrire(this.prisma, {
      fermeId, entiteType: 'ACTIVITE', entiteId: activiteId, sousDossier: 'activites', uploadePar, fichier,
      imagesAutorisees: this.imagesAutorisees, docsAutorises: this.docsAutorises,
      tailleMaxOctets: this.tailleMaxOctets, titre,
    });
    return { id, url: this.url(activiteId, id) };
  }

  async getFichier(fermeId: string, activiteId: string, pieceId: string) {
    return EntityFileStorage.lire(this.prisma, { fermeId, entiteType: 'ACTIVITE', entiteId: activiteId, docId: pieceId });
  }

  async remove(fermeId: string, activiteId: string, pieceId: string): Promise<void> {
    await EntityFileStorage.supprimer(this.prisma, { fermeId, entiteType: 'ACTIVITE', entiteId: activiteId, docId: pieceId });
  }

  private async assertActivite(fermeId: string, activiteId: string): Promise<void> {
    const existe = await this.prisma.calendrierActivite.count({ where: { id: activiteId, fermeId } });
    if (existe === 0) throw new NotFoundException('Activité introuvable');
  }
}
