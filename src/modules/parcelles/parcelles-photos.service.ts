import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EntityFileStorage } from '../../common/files/entity-file-storage';

/**
 * Photos d'une parcelle (avec métadonnées GPS). La mécanique fichier/DB est
 * mutualisée dans EntityFileStorage ; ce service garde le contrôle
 * d'appartenance, la projection de liste (GPS inclus) et la construction d'URL.
 */
@Injectable()
export class ParcellesPhotosService {
  private readonly imagesAutorisees = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly tailleMaxOctets = 10 * 1024 * 1024;

  constructor(private readonly prisma: PrismaService) {}

  private url(parcelleId: string, docId: string) {
    return `/api/v1/parcelles/${parcelleId}/photos/${docId}/fichier`;
  }

  async list(fermeId: string, parcelleId: string) {
    await this.assertParcelle(fermeId, parcelleId);
    const photos = await this.prisma.document.findMany({
      where: { fermeId, entiteType: 'PARCELLE', entiteId: parcelleId, type: 'PHOTO' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, titre: true, typeMime: true, tailleOctets: true, latitude: true, longitude: true, createdAt: true },
    });
    return photos.map((p) => ({
      id: p.id,
      titre: p.titre,
      typeMime: p.typeMime,
      taille: p.tailleOctets,
      latitude: p.latitude ? Number(p.latitude) : null,
      longitude: p.longitude ? Number(p.longitude) : null,
      url: this.url(parcelleId, p.id),
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async upload(
    fermeId: string,
    parcelleId: string,
    uploadePar: string,
    fichier: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    meta?: { latitude?: number; longitude?: number; titre?: string },
  ) {
    await this.assertParcelle(fermeId, parcelleId);
    const { id } = await EntityFileStorage.ecrire(this.prisma, {
      fermeId, entiteType: 'PARCELLE', entiteId: parcelleId, sousDossier: 'parcelles', uploadePar, fichier,
      imagesAutorisees: this.imagesAutorisees, tailleMaxOctets: this.tailleMaxOctets,
      titre: meta?.titre, latitude: meta?.latitude, longitude: meta?.longitude,
    });
    return { id, url: this.url(parcelleId, id) };
  }

  async getFichier(fermeId: string, parcelleId: string, photoId: string) {
    return EntityFileStorage.lire(this.prisma, { fermeId, entiteType: 'PARCELLE', entiteId: parcelleId, docId: photoId });
  }

  async remove(fermeId: string, parcelleId: string, photoId: string): Promise<void> {
    await EntityFileStorage.supprimer(this.prisma, { fermeId, entiteType: 'PARCELLE', entiteId: parcelleId, docId: photoId });
  }

  private async assertParcelle(fermeId: string, parcelleId: string): Promise<void> {
    const existe = await this.prisma.parcelle.count({ where: { id: parcelleId, fermeId } });
    if (existe === 0) throw new NotFoundException('Parcelle introuvable');
  }
}
