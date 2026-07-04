import { NotFoundException } from '@nestjs/common';
import { StatutActivite } from '@prisma/client';
import { ActivitesService } from './activites.service';

/**
 * Tests unitaires du service activités avec un Prisma entièrement mocké —
 * aucune base requise. On vérifie surtout la construction du `where` (filtres
 * et isolation multi-tenant) et la logique d'affectation des employés.
 */
describe('ActivitesService', () => {
  let service: ActivitesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      calendrierActivite: {
        count: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      activiteEmploye: { deleteMany: jest.fn(), createMany: jest.fn() },
      employe: { findMany: jest.fn() },
      utilisateur: { count: jest.fn() },
      parcelle: { count: jest.fn() },
      culture: { count: jest.fn() },
      // $transaction exécute simplement le tableau de promesses fourni.
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    service = new ActivitesService(prisma);
  });

  describe('findAll — construction du where', () => {
    it("scope toujours par fermeId (isolation multi-tenant)", async () => {
      prisma.calendrierActivite.count.mockResolvedValue(0);
      await service.findAll('ferme-1', { page: 1, limit: 20 } as any);
      const whereCount = prisma.calendrierActivite.count.mock.calls[0][0].where;
      const whereFind = prisma.calendrierActivite.findMany.mock.calls[0][0].where;
      expect(whereCount.fermeId).toBe('ferme-1');
      expect(whereFind.fermeId).toBe('ferme-1');
    });

    it('applique les filtres type / statut / priorité', async () => {
      prisma.calendrierActivite.count.mockResolvedValue(0);
      await service.findAll('f1', { statut: 'EN_COURS', type: 'IRRIGATION', priorite: 'HAUTE', page: 1, limit: 20 } as any);
      const where = prisma.calendrierActivite.findMany.mock.calls[0][0].where;
      expect(where.statut).toBe('EN_COURS');
      expect(where.type).toBe('IRRIGATION');
      expect(where.priorite).toBe('HAUTE');
    });

    it('enRetard seul restreint aux statuts ouverts + date passée', async () => {
      prisma.calendrierActivite.count.mockResolvedValue(0);
      await service.findAll('f1', { enRetard: 'true', page: 1, limit: 20 } as any);
      const where = prisma.calendrierActivite.findMany.mock.calls[0][0].where;
      expect(where.dateProgrammee.lt).toBeInstanceOf(Date);
      expect(where.statut).toEqual({ in: [StatutActivite.PLANIFIEE, StatutActivite.EN_COURS] });
    });

    it("statut explicite + enRetard : le statut explicite prime (correctif de revue)", async () => {
      prisma.calendrierActivite.count.mockResolvedValue(0);
      await service.findAll('f1', { enRetard: 'true', statut: 'TERMINEE', page: 1, limit: 20 } as any);
      const where = prisma.calendrierActivite.findMany.mock.calls[0][0].where;
      // Le statut n'est plus écrasé par le bloc enRetard.
      expect(where.statut).toBe('TERMINEE');
      expect(where.dateProgrammee.lt).toBeInstanceOf(Date);
    });

    it('recherche construit un OR titre/description insensible à la casse', async () => {
      prisma.calendrierActivite.count.mockResolvedValue(0);
      await service.findAll('f1', { recherche: 'maïs', page: 1, limit: 20 } as any);
      const where = prisma.calendrierActivite.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { titre: { contains: 'maïs', mode: 'insensitive' } },
        { description: { contains: 'maïs', mode: 'insensitive' } },
      ]);
    });

    it('pagine correctement (skip/take)', async () => {
      prisma.calendrierActivite.count.mockResolvedValue(50);
      const res = await service.findAll('f1', { page: 3, limit: 10 } as any);
      const args = prisma.calendrierActivite.findMany.mock.calls[0][0];
      expect(args.skip).toBe(20);
      expect(args.take).toBe(10);
      expect(res.pagination).toEqual({ page: 3, limit: 10, total: 50, totalPages: 5 });
    });
  });

  describe('setEmployes', () => {
    it("lève NotFound si l'activité n'appartient pas à la ferme", async () => {
      prisma.calendrierActivite.count.mockResolvedValue(0);
      await expect(service.setEmployes('f1', 'act-x', ['e1'])).rejects.toBeInstanceOf(NotFoundException);
    });

    it('dédoublonne et ne garde que les employés existants de la ferme', async () => {
      prisma.calendrierActivite.count.mockResolvedValue(1);
      // e3 n'appartient pas à la ferme → filtré ; e1 en double → dédoublonné.
      prisma.employe.findMany.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'act-1' } as any);

      await service.setEmployes('f1', 'act-1', ['e1', 'e1', 'e2', 'e3']);

      // La requête de validation ne porte que sur les identifiants uniques.
      expect(prisma.employe.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['e1', 'e2', 'e3'] }, fermeId: 'f1' },
        select: { id: true },
      });
      // Remplacement intégral : purge puis ré-insertion des seuls valides.
      expect(prisma.activiteEmploye.deleteMany).toHaveBeenCalledWith({ where: { activiteId: 'act-1' } });
      expect(prisma.activiteEmploye.createMany).toHaveBeenCalledWith({
        data: [{ activiteId: 'act-1', employeId: 'e1' }, { activiteId: 'act-1', employeId: 'e2' }],
      });
    });

    it('ne tente pas de créer de liaison quand aucun employé valide', async () => {
      prisma.calendrierActivite.count.mockResolvedValue(1);
      prisma.employe.findMany.mockResolvedValue([]);
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'act-1' } as any);

      await service.setEmployes('f1', 'act-1', ['inconnu']);
      expect(prisma.activiteEmploye.createMany).not.toHaveBeenCalled();
    });
  });
});
