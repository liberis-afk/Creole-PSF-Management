import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSuiviDto, CreateTraitementDto } from './dto/create-suivi.dto';

/**
 * Suivi de la culture : observations (stade/santé), traitements, rendements et
 * calendrier cultural.
 *
 * Suivis et traitements appartiennent en propre à la culture → création +
 * lecture. Les rendements (table Recolte) relèvent du Module 11 : on les LIT
 * uniquement, sans les gérer. Le calendrier cultural est calculé à partir des
 * dates et du cycle de la culture ; les activités déjà liées à la culture
 * (Module 5) sont lues en seule lecture — ce module ne construit pas le
 * calendrier agricole.
 */
@Injectable()
export class CulturesSuiviService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------ SUIVIS
  async listSuivis(fermeId: string, cultureId: string) {
    await this.assertCulture(fermeId, cultureId);
    const suivis = await this.prisma.suiviCulture.findMany({
      where: { cultureId },
      orderBy: { dateSuivi: 'desc' },
    });
    return suivis.map((s) => ({
      id: s.id,
      dateSuivi: s.dateSuivi.toISOString(),
      stade: s.stade,
      etatSante: s.etatSante,
      maladies: s.maladies,
      ravageurs: s.ravageurs,
      notes: s.notes,
    }));
  }

  async addSuivi(fermeId: string, cultureId: string, enregistrePar: string, dto: CreateSuiviDto) {
    await this.assertCulture(fermeId, cultureId);
    const s = await this.prisma.suiviCulture.create({
      data: {
        cultureId,
        dateSuivi: dto.dateSuivi ? new Date(dto.dateSuivi) : undefined,
        stade: dto.stade,
        etatSante: dto.etatSante,
        maladies: dto.maladies ?? [],
        ravageurs: dto.ravageurs ?? [],
        notes: dto.notes,
        enregistrePar,
      },
    });
    return { id: s.id };
  }

  // ------------------------------------------------------------- TRAITEMENTS
  async listTraitements(fermeId: string, cultureId: string) {
    await this.assertCulture(fermeId, cultureId);
    const traitements = await this.prisma.traitementCulture.findMany({
      where: { cultureId },
      orderBy: { dateTraitement: 'desc' },
    });
    return traitements.map((t) => ({
      id: t.id,
      dateTraitement: t.dateTraitement.toISOString(),
      type: t.type,
      produit: t.produit,
      dose: t.dose ? t.dose.toNumber() : null,
      unite: t.unite,
      appliquePar: t.appliquePar,
      notes: t.notes,
    }));
  }

  async addTraitement(fermeId: string, cultureId: string, dto: CreateTraitementDto) {
    await this.assertCulture(fermeId, cultureId);
    const t = await this.prisma.traitementCulture.create({
      data: {
        cultureId,
        dateTraitement: new Date(dto.dateTraitement),
        type: dto.type,
        produit: dto.produit,
        dose: dto.dose,
        unite: dto.unite,
        appliquePar: dto.appliquePar,
        notes: dto.notes,
      },
    });
    return { id: t.id };
  }

  // -------------------------------------------------------------- RENDEMENTS
  /** Récoltes de la culture, en lecture seule (module Récoltes non construit). */
  async listRendements(fermeId: string, cultureId: string) {
    await this.assertCulture(fermeId, cultureId);
    const recoltes = await this.prisma.recolte.findMany({
      where: { cultureId },
      orderBy: { dateRecolte: 'desc' },
      select: {
        id: true,
        dateRecolte: true,
        quantite: true,
        unite: true,
        rendementReel: true,
        qualite: true,
        destination: true,
      },
    });

    const totalRecolte = recoltes.reduce((s, r) => s + r.quantite.toNumber(), 0);

    return {
      lignes: recoltes.map((r) => ({
        id: r.id,
        date: r.dateRecolte.toISOString(),
        quantite: r.quantite.toNumber(),
        unite: r.unite,
        rendementReel: r.rendementReel ? r.rendementReel.toNumber() : null,
        qualite: r.qualite,
        destination: r.destination,
      })),
      totalRecolteKg: Math.round(totalRecolte * 1000) / 1000,
    };
  }

  // --------------------------------------------------------- CALENDRIER CULTURAL
  /**
   * Calendrier cultural = frise de vie de la culture, CALCULÉE :
   *   - jalons : plantation, récolte prévue (explicite ou plantation+cycle),
   *     récolte réelle
   *   - progression : jours écoulés / durée du cycle
   *   - stade actuel : dernier suivi enregistré
   *   - activités : celles déjà liées à la culture (Module 5), en lecture seule
   *
   * Aucune écriture ici : ce module ne construit pas le calendrier agricole.
   */
  async getCalendrier(fermeId: string, cultureId: string) {
    const culture = await this.prisma.culture.findFirst({
      where: { id: cultureId, fermeId },
      select: {
        datePlantation: true,
        dateRecoltePrevue: true,
        dateRecolteReelle: true,
        cycleJours: true,
        statut: true,
      },
    });
    if (!culture) throw new NotFoundException('Culture introuvable');

    const plantation = culture.datePlantation;
    // Récolte prévue : valeur explicite, sinon plantation + cycle si connu.
    let recoltePrevue = culture.dateRecoltePrevue;
    if (!recoltePrevue && culture.cycleJours) {
      recoltePrevue = new Date(plantation.getTime() + culture.cycleJours * 86_400_000);
    }

    // Progression sur le cycle (bornée 0–100).
    let progression: number | null = null;
    if (culture.cycleJours && culture.cycleJours > 0) {
      const joursEcoules = (Date.now() - plantation.getTime()) / 86_400_000;
      progression = Math.max(0, Math.min(100, Math.round((joursEcoules / culture.cycleJours) * 100)));
    }

    const [dernierSuivi, activites] = await Promise.all([
      this.prisma.suiviCulture.findFirst({
        where: { cultureId },
        orderBy: { dateSuivi: 'desc' },
        select: { stade: true, etatSante: true, dateSuivi: true },
      }),
      // Lecture seule des activités liées (Module 5, non construit ici).
      this.prisma.calendrierActivite.findMany({
        where: { cultureId, fermeId },
        orderBy: { dateProgrammee: 'asc' },
        take: 50,
        select: { id: true, type: true, titre: true, dateProgrammee: true, statut: true, priorite: true },
      }),
    ]);

    return {
      jalons: {
        plantation: plantation.toISOString(),
        recoltePrevue: recoltePrevue?.toISOString() ?? null,
        recoltePrevueEstimee: !culture.dateRecoltePrevue && !!recoltePrevue,
        recolteReelle: culture.dateRecolteReelle?.toISOString() ?? null,
      },
      cycleJours: culture.cycleJours,
      progression,
      stadeActuel: dernierSuivi
        ? { stade: dernierSuivi.stade, etatSante: dernierSuivi.etatSante, date: dernierSuivi.dateSuivi.toISOString() }
        : null,
      activites: activites.map((a) => ({
        id: a.id,
        type: a.type,
        titre: a.titre,
        date: a.dateProgrammee.toISOString(),
        statut: a.statut,
        priorite: a.priorite,
      })),
    };
  }

  private async assertCulture(fermeId: string, cultureId: string): Promise<void> {
    const existe = await this.prisma.culture.count({ where: { id: cultureId, fermeId } });
    if (existe === 0) throw new NotFoundException('Culture introuvable');
  }
}
