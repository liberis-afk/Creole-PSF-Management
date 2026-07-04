import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { TypeEvenementSecurite, Prisma } from '@prisma/client';

export interface JournalSecuriteEntry {
  utilisateurId?: string;
  fermeId?: string;
  typeEvenement: TypeEvenementSecurite;
  adresseIp?: string;
  userAgent?: string;
  metadonnees?: Prisma.InputJsonValue;
}

/**
 * Écrit dans journal_securite. Volontairement le SEUL point d'écriture de
 * cette table dans toute l'application : aucun autre service n'écrit
 * directement dedans, ce qui garantit un format cohérent et centralise la
 * politique de rétention future (purge, archivage) en un seul endroit.
 *
 * Cette table n'est jamais modifiée ni supprimée depuis l'application —
 * aucune méthode update()/delete() n'existe volontairement sur ce service.
 */
@Injectable()
export class SecurityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: JournalSecuriteEntry): Promise<void> {
    await this.prisma.journalSecurite.create({
      data: {
        utilisateurId: entry.utilisateurId,
        fermeId: entry.fermeId,
        typeEvenement: entry.typeEvenement,
        adresseIp: entry.adresseIp,
        userAgent: entry.userAgent,
        metadonnees: entry.metadonnees,
      },
    });
  }
}
