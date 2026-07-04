import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/**
 * Filet de sécurité global pour les erreurs Prisma connues. Garantit qu'AUCUNE
 * erreur de base de données non gérée ne fuit vers le client en 500 avec des
 * détails internes (nom de table, requête…).
 *
 * Les services peuvent toujours attraper un cas précis pour renvoyer un message
 * métier plus parlant (ex. « Le code X est déjà utilisé ») : ils lèvent alors
 * une HttpException que ce filtre ne voit jamais. Ce filtre ne traite que les
 * erreurs Prisma qui remontent sans avoir été gérées.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur de base de données.';

    switch (exception.code) {
      case 'P2002': {
        // Violation de contrainte d'unicité.
        status = HttpStatus.CONFLICT;
        const cibles = (exception.meta?.target as string[] | undefined)?.filter((c) => c !== 'fermeId').join(', ');
        message = cibles ? `Cette valeur est déjà utilisée (${cibles}).` : 'Cette valeur existe déjà.';
        break;
      }
      case 'P2025':
        // Enregistrement requis introuvable (update/delete).
        status = HttpStatus.NOT_FOUND;
        message = 'Ressource introuvable.';
        break;
      case 'P2003':
        // Violation de clé étrangère.
        status = HttpStatus.CONFLICT;
        message = "Opération impossible : cette donnée est référencée ailleurs.";
        break;
      default:
        // Code non cartographié : on journalise côté serveur sans rien exposer.
        this.logger.error(`Erreur Prisma non gérée [${exception.code}] : ${exception.message}`);
    }

    httpAdapter.reply(
      ctx.getResponse(),
      { statusCode: status, message, error: exception.code },
      status,
    );
  }
}
