import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCommentaireDto } from './dto/commentaire.dto';

/**
 * Fil de commentaires d'une activité : liste chronologique + ajout. Chaque
 * commentaire porte son auteur (utilisateur) et sa date. Un auteur ne peut
 * supprimer que ses propres commentaires (la permission de modération plus large
 * relèvera d'un rôle dédié plus tard).
 */
@Injectable()
export class ActivitesCommentairesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(fermeId: string, activiteId: string) {
    await this.assertActivite(fermeId, activiteId);
    const commentaires = await this.prisma.commentaireActivite.findMany({
      where: { activiteId },
      orderBy: { createdAt: 'asc' },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } },
    });
    return commentaires.map((c) => ({
      id: c.id,
      contenu: c.contenu,
      auteur: c.auteur ? { id: c.auteur.id, nom: `${c.auteur.prenom} ${c.auteur.nom}` } : null,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async add(fermeId: string, activiteId: string, auteurId: string, dto: CreateCommentaireDto) {
    await this.assertActivite(fermeId, activiteId);
    const c = await this.prisma.commentaireActivite.create({
      data: { activiteId, auteurId, contenu: dto.contenu },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } },
    });
    return {
      id: c.id,
      contenu: c.contenu,
      auteur: c.auteur ? { id: c.auteur.id, nom: `${c.auteur.prenom} ${c.auteur.nom}` } : null,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async remove(fermeId: string, activiteId: string, commentaireId: string, demandeurId: string): Promise<void> {
    await this.assertActivite(fermeId, activiteId);
    const commentaire = await this.prisma.commentaireActivite.findFirst({
      where: { id: commentaireId, activiteId },
      select: { id: true, auteurId: true },
    });
    if (!commentaire) throw new NotFoundException('Commentaire introuvable');
    if (commentaire.auteurId && commentaire.auteurId !== demandeurId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres commentaires.');
    }
    await this.prisma.commentaireActivite.delete({ where: { id: commentaire.id } });
  }

  private async assertActivite(fermeId: string, activiteId: string): Promise<void> {
    const existe = await this.prisma.calendrierActivite.count({ where: { id: activiteId, fermeId } });
    if (existe === 0) throw new NotFoundException('Activité introuvable');
  }
}
