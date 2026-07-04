import { ConflictException, NotFoundException } from '@nestjs/common';
import { CulturesService } from './cultures.service';

/**
 * Vérifie la règle métier critique : on ne supprime jamais une culture qui
 * porte des récoltes (le schéma cascaderait des données de production/finances).
 */
describe('CulturesService — remove (protection)', () => {
  let service: CulturesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      culture: { count: jest.fn(), delete: jest.fn() },
      recolte: { count: jest.fn() },
    };
    service = new CulturesService(prisma);
  });

  it("lève NotFound si la culture n'existe pas dans la ferme", async () => {
    prisma.culture.count.mockResolvedValue(0);
    await expect(service.remove('f1', 'c-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuse la suppression si des récoltes sont liées', async () => {
    prisma.culture.count.mockResolvedValue(1);
    prisma.recolte.count.mockResolvedValue(3);
    await expect(service.remove('f1', 'c1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.culture.delete).not.toHaveBeenCalled();
  });

  it('supprime la culture quand aucune récolte liée', async () => {
    prisma.culture.count.mockResolvedValue(1);
    prisma.recolte.count.mockResolvedValue(0);
    await service.remove('f1', 'c1');
    expect(prisma.culture.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
