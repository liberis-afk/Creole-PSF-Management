import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EntityFileStorage } from '../../common/files/entity-file-storage';

/** Photos d'une culture. Mécanique fichier/DB mutualisée (EntityFileStorage). */
@Injectable()
export class CulturesPhotosService {
  private readonly imagesAutorisees = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly tailleMaxOctets = 10 * 1024 * 1024;

  constructor(private readonly prisma: PrismaService) {}

  private url(cultureId: string, docId: string) {
    return `/api/v1/cultures/${cultureId}/photos/${docId}/fichier`;
  }

  async list(fermeId: string, cultureId: string) {
    await this.assertCulture(fermeId, cultureId);
    const photos = await this.prisma.document.findMany({
      where: { fermeId, entiteType: 'CULTURE', entiteId: cultureId, type: 'PHOTO' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, titre: true, typeMime: true, tailleOctets: true, createdAt: true },
    });
    return photos.map((p) => ({
      id: p.id,
      titre: p.titre,
      typeMime: p.typeMime,
      taille: p.tailleOctets,
      url: this.url(cultureId, p.id),
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async upload(
    fermeId: string,
    cultureId: string,
    uploadePar: string,
    fichier: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    titre?: string,
  ) {
    await this.assertCulture(fermeId, cultureId);
    const { id } = await EntityFileStorage.ecrire(this.prisma, {
      fermeId, entiteType: 'CULTURE', entiteId: cultureId, sousDossier: 'cultures', uploadePar, fichier,
      imagesAutorisees: this.imagesAutorisees, tailleMaxOctets: this.tailleMaxOctets, titre,
    });
    return { id, url: this.url(cultureId, id) };
  }

  async getFichier(fermeId: string, cultureId: string, photoId: string) {
    return EntityFileStorage.lire(this.prisma, { fermeId, entiteType: 'CULTURE', entiteId: cultureId, docId: photoId });
  }

  async remove(fermeId: string, cultureId: string, photoId: string): Promise<void> {
    await EntityFileStorage.supprimer(this.prisma, { fermeId, entiteType: 'CULTURE', entiteId: cultureId, docId: photoId });
  }

  private async assertCulture(fermeId: string, cultureId: string): Promise<void> {
    const existe = await this.prisma.culture.count({ where: { id: cultureId, fermeId } });
    if (existe === 0) throw new NotFoundException('Culture introuvable');
  }
}
