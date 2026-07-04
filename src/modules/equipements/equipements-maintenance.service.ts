import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateEntretienDto, UpdateEntretienDto, CreateUtilisationDto } from './dto/entretien.dto';

/**
 * Maintenance (entretiens), utilisation (heures d'usage) et historique
 * consolidé d'un équipement. Entretiens et utilisations appartiennent en propre
 * à l'équipement → gérés ici. L'historique agrège maintenances, coûts et
 * utilisations pour la vue détail.
 */
@Injectable()
export class EquipementsMaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- ENTRETIENS
  async listEntretiens(fermeId: string, equipementId: string) {
    await this.assertEquipement(fermeId, equipementId);
    const entretiens = await this.prisma.entretienEquipement.findMany({
      where: { equipementId },
      orderBy: { dateEntretien: 'desc' },
    });
    return entretiens.map((e) => this.formaterEntretien(e));
  }

  async addEntretien(fermeId: string, equipementId: string, dto: CreateEntretienDto) {
    await this.assertEquipement(fermeId, equipementId);
    const e = await this.prisma.entretienEquipement.create({
      data: {
        equipementId,
        type: dto.type,
        statut: dto.statut,
        dateEntretien: new Date(dto.dateEntretien),
        description: dto.description,
        cout: dto.cout,
        piecesUtilisees: dto.piecesUtilisees ?? [],
        effectuePar: dto.effectuePar,
        prochaineEcheance: dto.prochaineEcheance ? new Date(dto.prochaineEcheance) : undefined,
      },
    });
    return this.formaterEntretien(e);
  }

  async updateEntretien(fermeId: string, equipementId: string, entretienId: string, dto: UpdateEntretienDto) {
    await this.assertEntretien(fermeId, equipementId, entretienId);
    const e = await this.prisma.entretienEquipement.update({
      where: { id: entretienId },
      data: {
        type: dto.type,
        statut: dto.statut,
        dateEntretien: dto.dateEntretien ? new Date(dto.dateEntretien) : undefined,
        description: dto.description,
        cout: dto.cout,
        piecesUtilisees: dto.piecesUtilisees,
        effectuePar: dto.effectuePar,
        prochaineEcheance: dto.prochaineEcheance ? new Date(dto.prochaineEcheance) : undefined,
      },
    });
    return this.formaterEntretien(e);
  }

  async removeEntretien(fermeId: string, equipementId: string, entretienId: string): Promise<void> {
    await this.assertEntretien(fermeId, equipementId, entretienId);
    await this.prisma.entretienEquipement.delete({ where: { id: entretienId } });
  }

  // ---------------------------------------------------------------- UTILISATION
  async listUtilisations(fermeId: string, equipementId: string) {
    await this.assertEquipement(fermeId, equipementId);
    const utilisations = await this.prisma.utilisationEquipement.findMany({
      where: { equipementId },
      orderBy: { date: 'desc' },
      include: { operateur: { select: { id: true, prenom: true, nom: true } } },
    });
    return utilisations.map((u) => ({
      id: u.id,
      date: u.date.toISOString(),
      heuresUtilisation: u.heuresUtilisation.toNumber(),
      operateur: u.operateur ? { id: u.operateur.id, nom: `${u.operateur.prenom} ${u.operateur.nom}` } : null,
      notes: u.notes,
    }));
  }

  async addUtilisation(fermeId: string, equipementId: string, dto: CreateUtilisationDto) {
    await this.assertEquipement(fermeId, equipementId);
    if (dto.operateurId) {
      const existe = await this.prisma.employe.count({ where: { id: dto.operateurId, fermeId } });
      if (existe === 0) throw new NotFoundException("L'opérateur indiqué n'existe pas dans cette ferme.");
    }
    const u = await this.prisma.utilisationEquipement.create({
      data: {
        equipementId,
        date: new Date(dto.date),
        heuresUtilisation: dto.heuresUtilisation,
        operateurId: dto.operateurId,
        notes: dto.notes,
      },
    });
    return { id: u.id };
  }

  // ---------------------------------------------------------------- HISTORIQUE
  /** Historique consolidé : maintenances, coûts cumulés et utilisations. */
  async getHistorique(fermeId: string, equipementId: string) {
    await this.assertEquipement(fermeId, equipementId);

    const [entretiens, utilisations, agregatEntretien, agregatUtilisation] = await Promise.all([
      this.prisma.entretienEquipement.findMany({ where: { equipementId }, orderBy: { dateEntretien: 'desc' }, take: 50 }),
      this.prisma.utilisationEquipement.findMany({
        where: { equipementId },
        orderBy: { date: 'desc' },
        take: 50,
        include: { operateur: { select: { prenom: true, nom: true } } },
      }),
      this.prisma.entretienEquipement.aggregate({ where: { equipementId }, _sum: { cout: true }, _count: true }),
      this.prisma.utilisationEquipement.aggregate({ where: { equipementId }, _sum: { heuresUtilisation: true } }),
    ]);

    const nbPannes = await this.prisma.entretienEquipement.count({
      where: { equipementId, type: 'CORRECTIF' },
    });

    return {
      maintenances: entretiens.map((e) => this.formaterEntretien(e)),
      utilisations: utilisations.map((u) => ({
        id: u.id,
        date: u.date.toISOString(),
        heuresUtilisation: u.heuresUtilisation.toNumber(),
        operateur: u.operateur ? `${u.operateur.prenom} ${u.operateur.nom}` : null,
        notes: u.notes,
      })),
      resume: {
        coutTotalMaintenance: this.toNumber(agregatEntretien._sum.cout, true) ?? 0,
        nbMaintenances: typeof agregatEntretien._count === 'number' ? agregatEntretien._count : 0,
        nbPannes,
        heuresUtilisationTotal: this.toNumber(agregatUtilisation._sum.heuresUtilisation, true) ?? 0,
      },
    };
  }

  // ------------------------------------------------------------- UTILITAIRES
  private formaterEntretien(e: {
    id: string;
    type: string;
    statut: string;
    dateEntretien: Date;
    description: string | null;
    cout: Prisma.Decimal | null;
    piecesUtilisees: string[];
    effectuePar: string | null;
    prochaineEcheance: Date | null;
  }) {
    return {
      id: e.id,
      type: e.type,
      statut: e.statut,
      dateEntretien: e.dateEntretien.toISOString(),
      description: e.description,
      cout: this.toNumber(e.cout, true),
      piecesUtilisees: e.piecesUtilisees,
      effectuePar: e.effectuePar,
      prochaineEcheance: e.prochaineEcheance?.toISOString() ?? null,
    };
  }

  private async assertEquipement(fermeId: string, equipementId: string): Promise<void> {
    const existe = await this.prisma.equipement.count({ where: { id: equipementId, fermeId } });
    if (existe === 0) throw new NotFoundException('Équipement introuvable');
  }

  private async assertEntretien(fermeId: string, equipementId: string, entretienId: string): Promise<void> {
    await this.assertEquipement(fermeId, equipementId);
    const existe = await this.prisma.entretienEquipement.count({ where: { id: entretienId, equipementId } });
    if (existe === 0) throw new NotFoundException('Entretien introuvable');
  }

  private toNumber(valeur: Prisma.Decimal | null | undefined, nullable = false): number | null {
    if (valeur === null || valeur === undefined) return nullable ? null : 0;
    return valeur.toNumber();
  }
}
