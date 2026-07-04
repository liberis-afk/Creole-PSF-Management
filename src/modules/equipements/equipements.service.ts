import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EtatEquipement, Prisma, StatutEquipement } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateEquipementDto } from './dto/create-equipement.dto';
import { UpdateEquipementDto } from './dto/update-equipement.dto';
import { QueryEquipementDto } from './dto/query-equipement.dto';

@Injectable()
export class EquipementsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- CREATE
  async create(fermeId: string, dto: CreateEquipementDto) {
    if (dto.responsableId) await this.assertEmploye(fermeId, dto.responsableId);

    try {
      const equipement = await this.prisma.equipement.create({
        data: {
          fermeId,
          nom: dto.nom,
          type: dto.type,
          marque: dto.marque,
          modele: dto.modele,
          numeroSerie: dto.numeroSerie,
          etat: dto.etat ?? EtatEquipement.BON,
          dateAchat: dto.dateAchat ? new Date(dto.dateAchat) : undefined,
          coutAchat: dto.coutAchat,
          localisation: dto.localisation,
          responsableId: dto.responsableId,
          notes: dto.notes,
          // Cohérence avec le statut opérationnel lu par le tableau de bord.
          statut: this.statutDepuisEtat(dto.etat ?? EtatEquipement.BON),
        },
        select: { id: true },
      });
      return this.findOne(fermeId, equipement.id);
    } catch (error) {
      throw this.gererErreurUnicite(error, dto.numeroSerie);
    }
  }

  // ------------------------------------------------------------------ READ
  async findAll(fermeId: string, query: QueryEquipementDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EquipementWhereInput = {
      fermeId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.etat ? { etat: query.etat } : {}),
      ...(query.responsableId ? { responsableId: query.responsableId } : {}),
      ...(query.recherche
        ? {
            OR: [
              { nom: { contains: query.recherche, mode: 'insensitive' } },
              { marque: { contains: query.recherche, mode: 'insensitive' } },
              { modele: { contains: query.recherche, mode: 'insensitive' } },
              { numeroSerie: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, equipements] = await this.prisma.$transaction([
      this.prisma.equipement.count({ where }),
      this.prisma.equipement.findMany({
        where,
        orderBy: { [query.tri ?? 'dateAchat']: query.ordre ?? 'desc' },
        skip,
        take: limit,
        include: {
          responsable: { select: { id: true, prenom: true, nom: true } },
          _count: { select: { entretiens: true, utilisations: true } },
        },
      }),
    ]);

    return {
      donnees: equipements.map((e) => ({
        id: e.id,
        nom: e.nom,
        type: e.type,
        etat: e.etat,
        numeroSerie: e.numeroSerie,
        marque: e.marque,
        modele: e.modele,
        dateAchat: e.dateAchat?.toISOString() ?? null,
        coutAchat: this.toNumber(e.coutAchat, true),
        localisation: e.localisation,
        responsable: e.responsable ? { id: e.responsable.id, nom: `${e.responsable.prenom} ${e.responsable.nom}` } : null,
        nbEntretiens: e._count.entretiens,
        nbUtilisations: e._count.utilisations,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(fermeId: string, id: string) {
    const e = await this.prisma.equipement.findFirst({
      where: { id, fermeId },
      include: {
        responsable: { select: { id: true, prenom: true, nom: true, fonction: true } },
        _count: { select: { entretiens: true, utilisations: true } },
      },
    });
    if (!e) throw new NotFoundException('Équipement introuvable');

    return {
      id: e.id,
      nom: e.nom,
      type: e.type,
      marque: e.marque,
      modele: e.modele,
      numeroSerie: e.numeroSerie,
      etat: e.etat,
      statut: e.statut,
      dateAchat: e.dateAchat?.toISOString() ?? null,
      coutAchat: this.toNumber(e.coutAchat, true),
      localisation: e.localisation,
      responsable: e.responsable
        ? { id: e.responsable.id, nom: `${e.responsable.prenom} ${e.responsable.nom}`, fonction: e.responsable.fonction }
        : null,
      notes: e.notes,
      nbEntretiens: e._count.entretiens,
      nbUtilisations: e._count.utilisations,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------- UPDATE
  async update(fermeId: string, id: string, dto: UpdateEquipementDto) {
    await this.assertExiste(fermeId, id);
    if (dto.responsableId) await this.assertEmploye(fermeId, dto.responsableId);

    try {
      await this.prisma.equipement.update({
        where: { id },
        data: {
          nom: dto.nom,
          type: dto.type,
          marque: dto.marque,
          modele: dto.modele,
          numeroSerie: dto.numeroSerie,
          etat: dto.etat,
          dateAchat: dto.dateAchat ? new Date(dto.dateAchat) : undefined,
          coutAchat: dto.coutAchat,
          localisation: dto.localisation,
          responsableId: dto.responsableId,
          notes: dto.notes,
          // Si l'état change, on resynchronise le statut opérationnel.
          statut: dto.etat ? this.statutDepuisEtat(dto.etat) : undefined,
        },
      });
      return this.findOne(fermeId, id);
    } catch (error) {
      throw this.gererErreurUnicite(error, dto.numeroSerie ?? '');
    }
  }

  // ---------------------------------------------------------------- DELETE
  async remove(fermeId: string, id: string): Promise<void> {
    await this.assertExiste(fermeId, id);
    // Entretiens, utilisations et consommations sont supprimés en cascade
    // (schéma). La confirmation côté UI protège de la suppression accidentelle.
    await this.prisma.equipement.delete({ where: { id } });
  }

  // ------------------------------------------------------------- UTILITAIRES

  /**
   * Mappe la condition physique (etat) vers le statut opérationnel lu par le
   * tableau de bord : un équipement en panne est marqué EN_PANNE, sinon
   * OPERATIONNEL. Le passage EN_MAINTENANCE reste piloté par les entretiens.
   */
  private statutDepuisEtat(etat: EtatEquipement): StatutEquipement {
    return etat === EtatEquipement.EN_PANNE ? StatutEquipement.EN_PANNE : StatutEquipement.OPERATIONNEL;
  }

  private async assertExiste(fermeId: string, id: string): Promise<void> {
    const existe = await this.prisma.equipement.count({ where: { id, fermeId } });
    if (existe === 0) throw new NotFoundException('Équipement introuvable');
  }

  private async assertEmploye(fermeId: string, employeId: string): Promise<void> {
    const existe = await this.prisma.employe.count({ where: { id: employeId, fermeId } });
    if (existe === 0) {
      throw new BadRequestException("Le responsable indiqué n'existe pas dans cette ferme.");
    }
  }

  private gererErreurUnicite(error: unknown, numeroSerie: string | undefined): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`Le numéro de série "${numeroSerie}" est déjà utilisé dans cette ferme.`);
    }
    return error instanceof Error ? error : new Error('Erreur inconnue');
  }

  private toNumber(valeur: Prisma.Decimal | null | undefined): number;
  private toNumber(valeur: Prisma.Decimal | null | undefined, nullable: true): number | null;
  private toNumber(valeur: Prisma.Decimal | null | undefined, nullable = false): number | null {
    if (valeur === null || valeur === undefined) return nullable ? null : 0;
    return valeur.toNumber();
  }
}
