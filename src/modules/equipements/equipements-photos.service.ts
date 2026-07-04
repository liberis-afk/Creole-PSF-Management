import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EntityFileStorage } from '../../common/files/entity-file-storage';

/** Photos d'un équipement. Mécanique fichier/DB mutualisée (EntityFileStorage). */
@Injectable()
export class EquipementsPhotosService {
  private readonly imagesAutorisees = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly tailleMaxOctets = 10 * 1024 * 1024;

  constructor(private readonly prisma: PrismaService) {}

  private url(equipementId: string, docId: string) {
    return `/api/v1/equipements/${equipementId}/photos/${docId}/fichier`;
  }

  async list(fermeId: string, equipementId: string) {
    await this.assertEquipement(fermeId, equipementId);
    const photos = await this.prisma.document.findMany({
      where: { fermeId, entiteType: 'EQUIPEMENT', entiteId: equipementId, type: 'PHOTO' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, titre: true, typeMime: true, tailleOctets: true, createdAt: true },
    });
    return photos.map((p) => ({
      id: p.id,
      titre: p.titre,
      typeMime: p.typeMime,
      taille: p.tailleOctets,
      url: this.url(equipementId, p.id),
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async upload(
    fermeId: string,
    equipementId: string,
    uploadePar: string,
    fichier: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    titre?: string,
  ) {
    await this.assertEquipement(fermeId, equipementId);
    const { id } = await EntityFileStorage.ecrire(this.prisma, {
      fermeId, entiteType: 'EQUIPEMENT', entiteId: equipementId, sousDossier: 'equipements', uploadePar, fichier,
      imagesAutorisees: this.imagesAutorisees, tailleMaxOctets: this.tailleMaxOctets, titre,
    });
    return { id, url: this.url(equipementId, id) };
  }

  async getFichier(fermeId: string, equipementId: string, photoId: string) {
    return EntityFileStorage.lire(this.prisma, { fermeId, entiteType: 'EQUIPEMENT', entiteId: equipementId, docId: photoId });
  }

  async remove(fermeId: string, equipementId: string, photoId: string): Promise<void> {
    await EntityFileStorage.supprimer(this.prisma, { fermeId, entiteType: 'EQUIPEMENT', entiteId: equipementId, docId: photoId });
  }

  private async assertEquipement(fermeId: string, equipementId: string): Promise<void> {
    const existe = await this.prisma.equipement.count({ where: { id: equipementId, fermeId } });
    if (existe === 0) throw new NotFoundException('Équipement introuvable');
  }
}
