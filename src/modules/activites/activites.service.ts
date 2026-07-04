import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutActivite } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateActiviteDto } from './dto/create-activite.dto';
import { UpdateActiviteDto } from './dto/update-activite.dto';
import { QueryActiviteDto } from './dto/query-activite.dto';
import { STATUTS_ACTIVITE_OUVERTS, estEnRetard } from './activites.helpers';

@Injectable()
export class ActivitesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- CREATE
  async create(fermeId: string, dto: CreateActiviteDto) {
    await this.verifierLiens(fermeId, dto.responsableId, dto.parcelleId, dto.cultureId);
    const employeIds = await this.filtrerEmployes(fermeId, dto.employeIds);

    const activite = await this.prisma.calendrierActivite.create({
      data: {
        fermeId,
        titre: dto.titre,
        type: dto.type,
        description: dto.description,
        dateProgrammee: new Date(dto.dateProgrammee),
        dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
        heureProgrammee: dto.heureProgrammee,
        priorite: dto.priorite,
        statut: dto.statut,
        cout: dto.cout,
        responsableId: dto.responsableId,
        parcelleId: dto.parcelleId,
        cultureId: dto.cultureId,
        termineeLe: dto.statut === StatutActivite.TERMINEE ? new Date() : undefined,
        employesAffectes: employeIds.length ? { create: employeIds.map((employeId) => ({ employeId })) } : undefined,
      },
      select: { id: true },
    });
    return this.findOne(fermeId, activite.id);
  }

  // ------------------------------------------------------------------ READ
  async findAll(fermeId: string, query: QueryActiviteDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CalendrierActiviteWhereInput = {
      fermeId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.priorite ? { priorite: query.priorite } : {}),
      ...(query.responsableId ? { responsableId: query.responsableId } : {}),
      ...(query.parcelleId ? { parcelleId: query.parcelleId } : {}),
      ...(query.cultureId ? { cultureId: query.cultureId } : {}),
      // Retard = date dépassée + activité ouverte. Un filtre `statut` explicite
      // prime (on n'écrase plus le statut) ; sinon on restreint aux statuts
      // ouverts. Les deux combinés (ex. statut=TERMINEE + enRetard) donnent
      // logiquement un ensemble vide, ce qui est correct.
      ...(query.enRetard === 'true' ? { dateProgrammee: { lt: new Date() } } : {}),
      ...(query.statut
        ? { statut: query.statut }
        : query.enRetard === 'true'
          ? { statut: { in: STATUTS_ACTIVITE_OUVERTS } }
          : {}),
      ...(query.recherche
        ? {
            OR: [
              { titre: { contains: query.recherche, mode: 'insensitive' } },
              { description: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, activites] = await this.prisma.$transaction([
      this.prisma.calendrierActivite.count({ where }),
      this.prisma.calendrierActivite.findMany({
        where,
        orderBy: { [query.tri ?? 'dateProgrammee']: query.ordre ?? 'asc' },
        skip,
        take: limit,
        include: {
          responsable: { select: { id: true, prenom: true, nom: true } },
          parcelle: { select: { id: true, nom: true } },
          culture: { select: { id: true, nom: true } },
          _count: { select: { employesAffectes: true, commentaires: true } },
        },
      }),
    ]);

    return {
      donnees: activites.map((a) => this.resumer(a)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(fermeId: string, id: string) {
    const a = await this.prisma.calendrierActivite.findFirst({
      where: { id, fermeId },
      include: {
        responsable: { select: { id: true, prenom: true, nom: true } },
        parcelle: { select: { id: true, nom: true, code: true } },
        culture: { select: { id: true, nom: true } },
        employesAffectes: {
          include: { employe: { select: { id: true, prenom: true, nom: true, fonction: true } } },
        },
        _count: { select: { commentaires: true } },
      },
    });
    if (!a) throw new NotFoundException('Activité introuvable');

    return {
      id: a.id,
      titre: a.titre,
      type: a.type,
      description: a.description,
      dateProgrammee: a.dateProgrammee.toISOString(),
      dateFin: a.dateFin?.toISOString() ?? null,
      heureProgrammee: a.heureProgrammee,
      priorite: a.priorite,
      statut: a.statut,
      enRetard: estEnRetard(a.dateProgrammee, a.statut),
      cout: a.cout ? a.cout.toNumber() : null,
      responsable: a.responsable ? { id: a.responsable.id, nom: `${a.responsable.prenom} ${a.responsable.nom}` } : null,
      parcelle: a.parcelle ? { id: a.parcelle.id, nom: a.parcelle.nom, code: a.parcelle.code } : null,
      culture: a.culture ? { id: a.culture.id, nom: a.culture.nom } : null,
      employes: a.employesAffectes.map((ae) => ({
        id: ae.employe.id,
        nom: `${ae.employe.prenom} ${ae.employe.nom}`,
        fonction: ae.employe.fonction,
      })),
      nbCommentaires: a._count.commentaires,
      termineeLe: a.termineeLe?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------- UPDATE
  async update(fermeId: string, id: string, dto: UpdateActiviteDto) {
    const actuelle = await this.prisma.calendrierActivite.findFirst({ where: { id, fermeId }, select: { statut: true } });
    if (!actuelle) throw new NotFoundException('Activité introuvable');
    await this.verifierLiens(fermeId, dto.responsableId, dto.parcelleId, dto.cultureId);

    // termineeLe : posé quand on passe à TERMINEE, effacé si on repart d'un terminé.
    let termineeLe: Date | null | undefined;
    if (dto.statut === StatutActivite.TERMINEE && actuelle.statut !== StatutActivite.TERMINEE) termineeLe = new Date();
    else if (dto.statut && dto.statut !== StatutActivite.TERMINEE && actuelle.statut === StatutActivite.TERMINEE) termineeLe = null;

    await this.prisma.calendrierActivite.update({
      where: { id },
      data: {
        titre: dto.titre,
        type: dto.type,
        description: dto.description,
        dateProgrammee: dto.dateProgrammee ? new Date(dto.dateProgrammee) : undefined,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
        heureProgrammee: dto.heureProgrammee,
        priorite: dto.priorite,
        statut: dto.statut,
        cout: dto.cout,
        responsableId: dto.responsableId,
        parcelleId: dto.parcelleId,
        cultureId: dto.cultureId,
        termineeLe,
      },
    });

    // Si la liste d'employés est fournie, on la remplace intégralement.
    if (dto.employeIds) await this.setEmployes(fermeId, id, dto.employeIds);

    return this.findOne(fermeId, id);
  }

  // ---------------------------------------------------------------- DELETE
  async remove(fermeId: string, id: string): Promise<void> {
    const existe = await this.prisma.calendrierActivite.count({ where: { id, fermeId } });
    if (existe === 0) throw new NotFoundException('Activité introuvable');
    // Employés affectés et commentaires sont supprimés en cascade (schéma).
    await this.prisma.calendrierActivite.delete({ where: { id } });
  }

  // --------------------------------------------------------- EMPLOYÉS AFFECTÉS
  async setEmployes(fermeId: string, activiteId: string, employeIds: string[]) {
    const existe = await this.prisma.calendrierActivite.count({ where: { id: activiteId, fermeId } });
    if (existe === 0) throw new NotFoundException('Activité introuvable');

    const valides = await this.filtrerEmployes(fermeId, employeIds);
    await this.prisma.$transaction([
      this.prisma.activiteEmploye.deleteMany({ where: { activiteId } }),
      ...(valides.length
        ? [this.prisma.activiteEmploye.createMany({ data: valides.map((employeId) => ({ activiteId, employeId })) })]
        : []),
    ]);
    return this.findOne(fermeId, activiteId);
  }

  // ------------------------------------------------------------- UTILITAIRES
  private resumer(a: {
    id: string; titre: string; type: string; dateProgrammee: Date; dateFin: Date | null;
    heureProgrammee: string | null; priorite: string; statut: StatutActivite; cout: Prisma.Decimal | null;
    responsable: { id: string; prenom: string; nom: string } | null;
    parcelle: { id: string; nom: string } | null;
    culture: { id: string; nom: string } | null;
    _count: { employesAffectes: number; commentaires: number };
  }) {
    return {
      id: a.id,
      titre: a.titre,
      type: a.type,
      dateProgrammee: a.dateProgrammee.toISOString(),
      dateFin: a.dateFin?.toISOString() ?? null,
      heureProgrammee: a.heureProgrammee,
      priorite: a.priorite,
      statut: a.statut,
      enRetard: estEnRetard(a.dateProgrammee, a.statut),
      cout: a.cout ? a.cout.toNumber() : null,
      responsable: a.responsable ? { id: a.responsable.id, nom: `${a.responsable.prenom} ${a.responsable.nom}` } : null,
      parcelle: a.parcelle ? { id: a.parcelle.id, nom: a.parcelle.nom } : null,
      culture: a.culture ? { id: a.culture.id, nom: a.culture.nom } : null,
      nbEmployes: a._count.employesAffectes,
      nbCommentaires: a._count.commentaires,
    };
  }


  /** Vérifie que responsable/parcelle/culture appartiennent bien à la ferme. */
  private async verifierLiens(fermeId: string, responsableId?: string, parcelleId?: string, cultureId?: string): Promise<void> {
    if (responsableId) {
      const ok = await this.prisma.utilisateur.count({ where: { id: responsableId, fermeId } });
      if (ok === 0) throw new BadRequestException("Le responsable indiqué n'existe pas dans cette ferme.");
    }
    if (parcelleId) {
      const ok = await this.prisma.parcelle.count({ where: { id: parcelleId, fermeId } });
      if (ok === 0) throw new BadRequestException("La parcelle indiquée n'existe pas dans cette ferme.");
    }
    if (cultureId) {
      const ok = await this.prisma.culture.count({ where: { id: cultureId, fermeId } });
      if (ok === 0) throw new BadRequestException("La culture indiquée n'existe pas dans cette ferme.");
    }
  }

  /** Ne conserve que les employés existants et appartenant à la ferme (dé-doublonnés). */
  private async filtrerEmployes(fermeId: string, employeIds?: string[]): Promise<string[]> {
    if (!employeIds || employeIds.length === 0) return [];
    const uniques = [...new Set(employeIds)];
    const trouves = await this.prisma.employe.findMany({
      where: { id: { in: uniques }, fermeId },
      select: { id: true },
    });
    return trouves.map((e) => e.id);
  }
}
