import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAnalyseSolDto } from './dto/create-analyse-sol.dto';

/**
 * Historique d'une parcelle. Ce service LIT des données appartenant à d'autres
 * domaines (cultures, récoltes, suivis) mais ne les crée/modifie jamais — il
 * ne fait qu'assembler la vue historique propre à la parcelle, exactement
 * comme le tableau de bord agrège sans posséder. Aucun autre module n'est
 * modifié.
 *
 * Les analyses de sol, elles, appartiennent en propre au domaine Parcelle
 * (table AnalyseSol, aucune autre entité ne les possède) : ce service en gère
 * donc la lecture ET la création.
 */
@Injectable()
export class ParcellesHistoriqueService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistorique(fermeId: string, parcelleId: string) {
    await this.assertParcelle(fermeId, parcelleId);

    // Toutes les sous-requêtes sont en lecture seule et tolèrent l'absence de
    // données (les modules Cultures/Récoltes ne sont pas encore alimentés) :
    // elles renvoient alors des listes vides, et l'UI affiche un état vide.
    const [cultures, recoltes, suivis, analysesSol] = await Promise.all([
      this.prisma.culture.findMany({
        where: { parcelleId },
        orderBy: { datePlantation: 'desc' },
        take: 20,
        select: {
          id: true,
          nom: true,
          variete: true,
          datePlantation: true,
          dateRecolteReelle: true,
          statut: true,
        },
      }),
      this.prisma.recolte.findMany({
        where: { parcelleId },
        orderBy: { dateRecolte: 'desc' },
        take: 20,
        select: { id: true, dateRecolte: true, quantite: true, unite: true, rendementReel: true },
      }),
      this.prisma.suiviCulture.findMany({
        where: { culture: { parcelleId } },
        orderBy: { dateSuivi: 'desc' },
        take: 20,
        select: { id: true, dateSuivi: true, etatSante: true, maladies: true, ravageurs: true },
      }),
      this.prisma.analyseSol.findMany({
        where: { parcelleId },
        orderBy: { dateAnalyse: 'desc' },
      }),
    ]);

    return {
      culturesPrecedentes: cultures.map((c) => ({
        id: c.id,
        nom: c.nom,
        variete: c.variete,
        datePlantation: c.datePlantation.toISOString(),
        dateRecolte: c.dateRecolteReelle?.toISOString() ?? null,
        statut: c.statut,
      })),
      rendements: recoltes.map((r) => ({
        id: r.id,
        date: r.dateRecolte.toISOString(),
        quantite: this.toNumber(r.quantite),
        unite: r.unite,
        rendementReel: r.rendementReel ? this.toNumber(r.rendementReel) : null,
      })),
      observationsSante: suivis.map((s) => ({
        id: s.id,
        date: s.dateSuivi.toISOString(),
        etatSante: s.etatSante,
        maladies: s.maladies,
        ravageurs: s.ravageurs,
      })),
      analysesSol: analysesSol.map((a) => this.formaterAnalyse(a)),
    };
  }

  async listAnalysesSol(fermeId: string, parcelleId: string) {
    await this.assertParcelle(fermeId, parcelleId);
    const analyses = await this.prisma.analyseSol.findMany({
      where: { parcelleId },
      orderBy: { dateAnalyse: 'desc' },
    });
    return analyses.map((a) => this.formaterAnalyse(a));
  }

  async addAnalyseSol(fermeId: string, parcelleId: string, dto: CreateAnalyseSolDto) {
    await this.assertParcelle(fermeId, parcelleId);
    const analyse = await this.prisma.analyseSol.create({
      data: {
        parcelleId,
        dateAnalyse: new Date(dto.dateAnalyse),
        ph: dto.ph,
        matiereOrganique: dto.matiereOrganique,
        azote: dto.azote,
        phosphore: dto.phosphore,
        potassium: dto.potassium,
        texture: dto.texture,
        laboratoire: dto.laboratoire,
        notes: dto.notes,
      },
    });
    return this.formaterAnalyse(analyse);
  }

  private async assertParcelle(fermeId: string, parcelleId: string): Promise<void> {
    const existe = await this.prisma.parcelle.count({ where: { id: parcelleId, fermeId } });
    if (existe === 0) {
      throw new NotFoundException('Parcelle introuvable');
    }
  }

  private formaterAnalyse(a: {
    id: string;
    dateAnalyse: Date;
    ph: Prisma.Decimal | null;
    matiereOrganique: Prisma.Decimal | null;
    azote: Prisma.Decimal | null;
    phosphore: Prisma.Decimal | null;
    potassium: Prisma.Decimal | null;
    texture: string | null;
    laboratoire: string | null;
    notes: string | null;
  }) {
    return {
      id: a.id,
      dateAnalyse: a.dateAnalyse.toISOString(),
      ph: this.toNumber(a.ph, true),
      matiereOrganique: this.toNumber(a.matiereOrganique, true),
      azote: this.toNumber(a.azote, true),
      phosphore: this.toNumber(a.phosphore, true),
      potassium: this.toNumber(a.potassium, true),
      texture: a.texture,
      laboratoire: a.laboratoire,
      notes: a.notes,
    };
  }

  private toNumber(valeur: Prisma.Decimal | null, nullable = false): number | null {
    if (valeur === null) return nullable ? null : 0;
    return valeur.toNumber();
  }
}
