import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatutCulture } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCultureDto } from './dto/create-culture.dto';
import { UpdateCultureDto } from './dto/update-culture.dto';
import { QueryCultureDto } from './dto/query-culture.dto';

@Injectable()
export class CulturesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- CREATE
  async create(fermeId: string, dto: CreateCultureDto) {
    await this.assertParcelle(fermeId, dto.parcelleId);

    const culture = await this.prisma.culture.create({
      data: {
        fermeId,
        parcelleId: dto.parcelleId,
        nom: dto.nom,
        variete: dto.variete,
        espece: dto.espece,
        cycleJours: dto.cycleJours,
        datePlantation: new Date(dto.datePlantation),
        dateRecoltePrevue: dto.dateRecoltePrevue ? new Date(dto.dateRecoltePrevue) : undefined,
        dateRecolteReelle: dto.dateRecolteReelle ? new Date(dto.dateRecolteReelle) : undefined,
        espacementCm: dto.espacementCm,
        densite: dto.densite,
        population: dto.population,
        quantiteSemences: dto.quantiteSemences,
        uniteSemences: dto.uniteSemences,
        rendementAttenduKg: dto.rendementAttenduKg,
        statut: dto.statut ?? StatutCulture.PLANIFIEE,
      },
      select: { id: true },
    });
    return this.findOne(fermeId, culture.id);
  }

  // ------------------------------------------------------------------ READ
  async findAll(fermeId: string, query: QueryCultureDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CultureWhereInput = {
      fermeId,
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.parcelleId ? { parcelleId: query.parcelleId } : {}),
      ...(query.espece ? { espece: query.espece } : {}),
      ...(query.recherche
        ? {
            OR: [
              { nom: { contains: query.recherche, mode: 'insensitive' } },
              { variete: { contains: query.recherche, mode: 'insensitive' } },
              { espece: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, cultures] = await this.prisma.$transaction([
      this.prisma.culture.count({ where }),
      this.prisma.culture.findMany({
        where,
        orderBy: { [query.tri ?? 'datePlantation']: query.ordre ?? 'desc' },
        skip,
        take: limit,
        include: {
          parcelle: { select: { id: true, nom: true, code: true } },
          _count: { select: { suivis: true, recoltes: true } },
        },
      }),
    ]);

    return {
      donnees: cultures.map((c) => ({
        id: c.id,
        nom: c.nom,
        variete: c.variete,
        espece: c.espece,
        statut: c.statut,
        datePlantation: c.datePlantation.toISOString(),
        dateRecoltePrevue: c.dateRecoltePrevue?.toISOString() ?? null,
        rendementAttenduKg: this.toNumber(c.rendementAttenduKg, true),
        parcelle: c.parcelle,
        nbSuivis: c._count.suivis,
        nbRecoltes: c._count.recoltes,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(fermeId: string, id: string) {
    const c = await this.prisma.culture.findFirst({
      where: { id, fermeId },
      include: {
        parcelle: { select: { id: true, nom: true, code: true, superficieHa: true } },
        _count: { select: { suivis: true, traitements: true, recoltes: true } },
      },
    });
    if (!c) throw new NotFoundException('Culture introuvable');

    return {
      id: c.id,
      nom: c.nom,
      variete: c.variete,
      espece: c.espece,
      cycleJours: c.cycleJours,
      datePlantation: c.datePlantation.toISOString(),
      dateRecoltePrevue: c.dateRecoltePrevue?.toISOString() ?? null,
      dateRecolteReelle: c.dateRecolteReelle?.toISOString() ?? null,
      espacementCm: this.toNumber(c.espacementCm, true),
      densite: this.toNumber(c.densite, true),
      population: c.population,
      quantiteSemences: this.toNumber(c.quantiteSemences, true),
      uniteSemences: c.uniteSemences,
      rendementAttenduKg: this.toNumber(c.rendementAttenduKg, true),
      statut: c.statut,
      parcelle: {
        id: c.parcelle.id,
        nom: c.parcelle.nom,
        code: c.parcelle.code,
        superficieHa: this.toNumber(c.parcelle.superficieHa),
      },
      nbSuivis: c._count.suivis,
      nbTraitements: c._count.traitements,
      nbRecoltes: c._count.recoltes,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  // -------------------------------------------------------------- STATISTIQUES
  /**
   * Statistiques agrégées, calculées en base et filtrées par ferme. Zéro
   * donnée codée en dur : tout se remplit à mesure que des cultures sont
   * créées, comme le tableau de bord.
   */
  async getStatistiques(fermeId: string) {
    const [parStatutBrut, parEspeceBrut, agregats, actives] = await this.prisma.$transaction([
      this.prisma.culture.groupBy({ by: ['statut'], where: { fermeId }, _count: true }),
      this.prisma.culture.groupBy({
        by: ['espece'],
        where: { fermeId, espece: { not: null } },
        _count: { espece: true },
        orderBy: { _count: { espece: 'desc' } },
        take: 5,
      }),
      this.prisma.culture.aggregate({
        where: { fermeId },
        _count: true,
        _sum: { rendementAttenduKg: true, population: true },
      }),
      this.prisma.culture.findMany({
        where: { fermeId, statut: StatutCulture.ACTIVE },
        select: { parcelleId: true },
        distinct: ['parcelleId'],
      }),
    ]);

    // Superficie cultivée = somme des superficies des parcelles distinctes
    // portant au moins une culture active.
    let superficieCultiveeHa = 0;
    if (actives.length > 0) {
      const parcelles = await this.prisma.parcelle.findMany({
        where: { id: { in: actives.map((a) => a.parcelleId) } },
        select: { superficieHa: true },
      });
      superficieCultiveeHa = parcelles.reduce((s, p) => s + this.toNumber(p.superficieHa), 0);
    }

    const parStatut: Record<string, number> = {
      PLANIFIEE: 0,
      ACTIVE: 0,
      RECOLTEE: 0,
      ABANDONNEE: 0,
    };
    for (const ligne of parStatutBrut) {
      parStatut[ligne.statut] = typeof ligne._count === 'number' ? ligne._count : 0;
    }

    return {
      total: typeof agregats._count === 'number' ? agregats._count : 0,
      parStatut,
      parEspece: parEspeceBrut.map((e) => ({
        espece: e.espece,
        nombre: e._count.espece,
      })),
      rendementAttenduTotalKg: this.toNumber(agregats._sum.rendementAttenduKg, true) ?? 0,
      populationTotale: agregats._sum.population ?? 0,
      culturesActives: parStatut.ACTIVE,
      superficieCultiveeHa: Math.round(superficieCultiveeHa * 1000) / 1000,
    };
  }

  // ---------------------------------------------------------------- UPDATE
  async update(fermeId: string, id: string, dto: UpdateCultureDto) {
    await this.assertExiste(fermeId, id);
    if (dto.parcelleId) await this.assertParcelle(fermeId, dto.parcelleId);

    await this.prisma.culture.update({
      where: { id },
      data: {
        parcelleId: dto.parcelleId,
        nom: dto.nom,
        variete: dto.variete,
        espece: dto.espece,
        cycleJours: dto.cycleJours,
        datePlantation: dto.datePlantation ? new Date(dto.datePlantation) : undefined,
        dateRecoltePrevue: dto.dateRecoltePrevue ? new Date(dto.dateRecoltePrevue) : undefined,
        dateRecolteReelle: dto.dateRecolteReelle ? new Date(dto.dateRecolteReelle) : undefined,
        espacementCm: dto.espacementCm,
        densite: dto.densite,
        population: dto.population,
        quantiteSemences: dto.quantiteSemences,
        uniteSemences: dto.uniteSemences,
        rendementAttenduKg: dto.rendementAttenduKg,
        statut: dto.statut,
      },
    });
    return this.findOne(fermeId, id);
  }

  // ---------------------------------------------------------------- DELETE
  async remove(fermeId: string, id: string): Promise<void> {
    await this.assertExiste(fermeId, id);

    // Protection : le schéma cascade les récoltes à la suppression d'une
    // culture. Or une récolte porte des données de production ET de finances.
    // On refuse donc de supprimer une culture qui a des récoltes, et on
    // suggère de la marquer ABANDONNEE — jamais de perte d'historique par
    // accident.
    const nbRecoltes = await this.prisma.recolte.count({ where: { cultureId: id } });
    if (nbRecoltes > 0) {
      throw new ConflictException(
        "Cette culture possède des récoltes enregistrées. Marquez-la plutôt comme abandonnée pour préserver l'historique.",
      );
    }

    await this.prisma.culture.delete({ where: { id } });
  }

  // ------------------------------------------------------------- UTILITAIRES
  private async assertExiste(fermeId: string, id: string): Promise<void> {
    const existe = await this.prisma.culture.count({ where: { id, fermeId } });
    if (existe === 0) throw new NotFoundException('Culture introuvable');
  }

  /** Vérifie que la parcelle existe ET appartient à la ferme du contexte. */
  private async assertParcelle(fermeId: string, parcelleId: string): Promise<void> {
    const existe = await this.prisma.parcelle.count({ where: { id: parcelleId, fermeId } });
    if (existe === 0) {
      throw new BadRequestException("La parcelle indiquée n'existe pas dans cette ferme.");
    }
  }

  private toNumber(valeur: Prisma.Decimal | null | undefined): number;
  private toNumber(valeur: Prisma.Decimal | null | undefined, nullable: true): number | null;
  private toNumber(valeur: Prisma.Decimal | null | undefined, nullable = false): number | null {
    if (valeur === null || valeur === undefined) return nullable ? null : 0;
    return valeur.toNumber();
  }
}
