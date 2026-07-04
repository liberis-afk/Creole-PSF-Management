import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutParcelle } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateParcelleDto } from './dto/create-parcelle.dto';
import { UpdateParcelleDto } from './dto/update-parcelle.dto';
import { QueryParcelleDto } from './dto/query-parcelle.dto';
import { GeometrieDto } from './dto/geometrie.dto';

/** Forme d'une parcelle renvoyée au client (scalaires + géométrie GeoJSON). */
export interface ParcelleReponse {
  id: string;
  nom: string;
  code: string;
  superficieHa: number;
  adresse: string | null;
  altitude: number | null;
  typeSol: string | null;
  ph: number | null;
  matiereOrganique: number | null;
  texture: string | null;
  drainage: string | null;
  statut: string;
  contour: unknown | null;
  centroide: unknown | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ParcellesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- CREATE
  async create(fermeId: string, dto: CreateParcelleDto): Promise<ParcelleReponse> {
    const contour = dto.geometrie?.contour;

    // Superficie : explicite si fournie, sinon calculée depuis le contour,
    // sinon erreur (le champ est non-null en base — pas de parcelle sans
    // surface).
    let superficieHa = dto.superficieHa ?? null;
    if (superficieHa === null && contour) {
      superficieHa = await this.calculerSuperficieHa(contour);
    }
    if (superficieHa === null) {
      throw new BadRequestException(
        'La superficie est requise, ou fournissez un contour pour la calculer automatiquement.',
      );
    }

    try {
      // Étape 1 : création des champs scalaires via Prisma.
      const cree = await this.prisma.parcelle.create({
        data: {
          fermeId,
          nom: dto.nom,
          code: dto.code,
          superficieHa,
          adresse: dto.adresse,
          altitude: dto.altitude,
          typeSol: dto.typeSol,
          ph: dto.ph,
          matiereOrganique: dto.matiereOrganique,
          texture: dto.texture,
          drainage: dto.drainage,
          statut: dto.statut ?? StatutParcelle.ACTIVE,
        },
        select: { id: true },
      });

      // Étape 2 : écriture de la géométrie en SQL brut (PostGIS), Prisma ne
      // gérant pas les colonnes Unsupported.
      await this.ecrireGeometrie(cree.id, dto.geometrie);

      return this.findOne(fermeId, cree.id);
    } catch (error) {
      throw this.gererErreurUnicite(error, dto.code);
    }
  }

  // ------------------------------------------------------------------ READ
  async findAll(fermeId: string, query: QueryParcelleDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ParcelleWhereInput = {
      fermeId,
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.drainage ? { drainage: query.drainage } : {}),
      ...(query.typeSol ? { typeSol: query.typeSol } : {}),
      ...(query.recherche
        ? {
            OR: [
              { nom: { contains: query.recherche, mode: 'insensitive' } },
              { code: { contains: query.recherche, mode: 'insensitive' } },
              { adresse: { contains: query.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, parcelles] = await this.prisma.$transaction([
      this.prisma.parcelle.count({ where }),
      this.prisma.parcelle.findMany({
        where,
        orderBy: { [query.tri ?? 'createdAt']: query.ordre ?? 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { cultures: true, analysesSol: true } } },
      }),
    ]);

    return {
      donnees: parcelles.map((p) => ({
        id: p.id,
        nom: p.nom,
        code: p.code,
        superficieHa: this.toNumber(p.superficieHa),
        adresse: p.adresse,
        typeSol: p.typeSol,
        drainage: p.drainage,
        statut: p.statut,
        nbCultures: p._count.cultures,
        nbAnalyses: p._count.analysesSol,
        createdAt: p.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(fermeId: string, id: string): Promise<ParcelleReponse> {
    const parcelle = await this.prisma.parcelle.findFirst({
      where: { id, fermeId },
    });
    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    const geometrie = await this.lireGeometrie(id);

    return {
      id: parcelle.id,
      nom: parcelle.nom,
      code: parcelle.code,
      superficieHa: this.toNumber(parcelle.superficieHa),
      adresse: parcelle.adresse,
      altitude: this.toNumber(parcelle.altitude, true),
      typeSol: parcelle.typeSol,
      ph: this.toNumber(parcelle.ph, true),
      matiereOrganique: this.toNumber(parcelle.matiereOrganique, true),
      texture: parcelle.texture,
      drainage: parcelle.drainage,
      statut: parcelle.statut,
      contour: geometrie.contour,
      centroide: geometrie.centroide,
      createdAt: parcelle.createdAt.toISOString(),
      updatedAt: parcelle.updatedAt.toISOString(),
    };
  }

  /** Données géométriques légères de toutes les parcelles, pour la carte. */
  async findAllForMap(fermeId: string) {
    // Requête unique renvoyant la géométrie en GeoJSON pour l'ensemble des
    // parcelles de la ferme. On ne passe pas par findOne en boucle (N+1).
    const lignes = await this.prisma.$queryRaw<
      Array<{
        id: string;
        nom: string;
        code: string;
        statut: string;
        superficieha: Prisma.Decimal;
        contour: string | null;
        centroide: string | null;
      }>
    >`
      SELECT id, nom, code, statut, "superficieHa" AS superficieha,
             ST_AsGeoJSON(limites) AS contour,
             ST_AsGeoJSON(centroide::geometry) AS centroide
      FROM parcelles
      WHERE "fermeId" = ${fermeId}
    `;

    return lignes.map((l) => ({
      id: l.id,
      nom: l.nom,
      code: l.code,
      statut: l.statut,
      superficieHa: this.toNumber(l.superficieha),
      contour: l.contour ? JSON.parse(l.contour) : null,
      centroide: l.centroide ? JSON.parse(l.centroide) : null,
    }));
  }

  // ---------------------------------------------------------------- UPDATE
  async update(fermeId: string, id: string, dto: UpdateParcelleDto): Promise<ParcelleReponse> {
    await this.assertExiste(fermeId, id);

    const contour = dto.geometrie?.contour;
    // Si un nouveau contour est fourni sans superficie explicite, on recalcule.
    let superficieHa = dto.superficieHa;
    if (superficieHa === undefined && contour) {
      superficieHa = await this.calculerSuperficieHa(contour);
    }

    try {
      await this.prisma.parcelle.update({
        where: { id },
        data: {
          nom: dto.nom,
          code: dto.code,
          superficieHa,
          adresse: dto.adresse,
          altitude: dto.altitude,
          typeSol: dto.typeSol,
          ph: dto.ph,
          matiereOrganique: dto.matiereOrganique,
          texture: dto.texture,
          drainage: dto.drainage,
          statut: dto.statut,
        },
      });

      // Géométrie mise à jour seulement si explicitement transmise.
      if (dto.geometrie) {
        await this.ecrireGeometrie(id, dto.geometrie);
      }

      return this.findOne(fermeId, id);
    } catch (error) {
      throw this.gererErreurUnicite(error, dto.code ?? '');
    }
  }

  // ---------------------------------------------------------------- DELETE
  async remove(fermeId: string, id: string): Promise<void> {
    await this.assertExiste(fermeId, id);
    // Les entités enfants strictement dépendantes (analyses de sol) sont
    // supprimées en cascade via le schéma. Les cultures liées bloquent la
    // suppression (restriction implicite) : on renvoie un message clair.
    try {
      await this.prisma.parcelle.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(
          'Cette parcelle est référencée par des cultures ou récoltes et ne peut pas être supprimée.',
        );
      }
      throw error;
    }
  }

  // ------------------------------------------------------------- UTILITAIRES

  private async assertExiste(fermeId: string, id: string): Promise<void> {
    const existe = await this.prisma.parcelle.count({ where: { id, fermeId } });
    if (existe === 0) {
      throw new NotFoundException('Parcelle introuvable');
    }
  }

  /**
   * Écrit contour et/ou centroïde via PostGIS. Trois cas :
   *   - contour fourni : limites = polygone, centroide = ST_Centroid(polygone)
   *   - point GPS seul : centroide = point, limites inchangé
   *   - rien : no-op
   * Les valeurs GeoJSON sont passées en paramètres liés ($1) — jamais
   * concaténées — donc pas d'injection SQL possible.
   */
  private async ecrireGeometrie(id: string, geometrie?: GeometrieDto): Promise<void> {
    if (!geometrie) return;

    if (geometrie.contour) {
      const geojson = JSON.stringify(geometrie.contour);
      await this.prisma.$executeRaw`
        UPDATE parcelles
        SET limites = ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326),
            centroide = ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326))::geography
        WHERE id = ${id}
      `;
      return;
    }

    if (geometrie.pointGps) {
      const { lat, lng } = geometrie.pointGps;
      await this.prisma.$executeRaw`
        UPDATE parcelles
        SET centroide = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        WHERE id = ${id}
      `;
    }
  }

  /** Lit la géométrie d'une parcelle et la renvoie en objets GeoJSON. */
  private async lireGeometrie(id: string): Promise<{ contour: unknown | null; centroide: unknown | null }> {
    const lignes = await this.prisma.$queryRaw<Array<{ contour: string | null; centroide: string | null }>>`
      SELECT ST_AsGeoJSON(limites) AS contour,
             ST_AsGeoJSON(centroide::geometry) AS centroide
      FROM parcelles
      WHERE id = ${id}
    `;
    const ligne = lignes[0];
    return {
      contour: ligne?.contour ? JSON.parse(ligne.contour) : null,
      centroide: ligne?.centroide ? JSON.parse(ligne.centroide) : null,
    };
  }

  /**
   * Superficie en hectares depuis un polygone GeoJSON. ST_Area sur une
   * geography renvoie des m² (calcul géodésique correct sur l'ellipsoïde),
   * qu'on divise par 10 000. C'est la "mesure automatique" du cahier des
   * charges, faite par la base plutôt qu'approximée en JavaScript.
   */
  private async calculerSuperficieHa(contour: object): Promise<number> {
    const geojson = JSON.stringify(contour);
    const resultat = await this.prisma.$queryRaw<Array<{ ha: number }>>`
      SELECT ST_Area(ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326)::geography) / 10000.0 AS ha
    `;
    const ha = resultat[0]?.ha ?? 0;
    // Arrondi à 3 décimales, cohérent avec Decimal(14,3) du schéma.
    return Math.round(ha * 1000) / 1000;
  }

  private gererErreurUnicite(error: unknown, code: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`Le code de parcelle "${code}" est déjà utilisé dans cette ferme.`);
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
