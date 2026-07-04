import { PrismaClient } from '@prisma/client';

/**
 * Tests d'intégration BASE DE DONNÉES. NÉCESSITE une base de test accessible via
 * DATABASE_URL, avec le schéma migré (`prisma migrate deploy`).
 *
 * On vérifie des garanties structurelles qui ne se voient pas dans les tests
 * unitaires : contraintes d'unicité et suppressions en cascade réellement
 * appliquées par PostgreSQL.
 */
describe('Base de données — contraintes et cascade (intégration)', () => {
  const prisma = new PrismaClient();
  let fermeId: string;

  beforeAll(async () => {
    const ferme = await prisma.ferme.create({
      data: { nom: 'Ferme Test', code: `TEST-${Date.now()}` },
      select: { id: true },
    });
    fermeId = ferme.id;
  });

  afterAll(async () => {
    // La suppression de la ferme cascade sur toutes ses données de test.
    await prisma.ferme.delete({ where: { id: fermeId } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it("applique l'unicité [fermeId, numeroSerie] sur les équipements", async () => {
    await prisma.equipement.create({
      data: { fermeId, nom: 'Tracteur A', type: 'TRACTEUR', numeroSerie: 'SN-UNIQUE-1' },
    });
    await expect(
      prisma.equipement.create({
        data: { fermeId, nom: 'Tracteur B', type: 'TRACTEUR', numeroSerie: 'SN-UNIQUE-1' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' }); // violation de contrainte unique
  });

  it('cascade la suppression d’une activité sur ses employés affectés et commentaires', async () => {
    const activite = await prisma.calendrierActivite.create({
      data: { fermeId, type: 'SEMIS', titre: 'Semis test', dateProgrammee: new Date() },
      select: { id: true },
    });
    const employe = await prisma.employe.create({
      data: { fermeId, prenom: 'Jean', nom: 'Pierre', fonction: 'Ouvrier', salaire: 500, dateEmbauche: new Date() },
      select: { id: true },
    });
    await prisma.activiteEmploye.create({ data: { activiteId: activite.id, employeId: employe.id } });
    await prisma.commentaireActivite.create({ data: { activiteId: activite.id, contenu: 'Note de test' } });

    // Sanity : les liaisons existent bien avant suppression.
    expect(await prisma.activiteEmploye.count({ where: { activiteId: activite.id } })).toBe(1);
    expect(await prisma.commentaireActivite.count({ where: { activiteId: activite.id } })).toBe(1);

    await prisma.calendrierActivite.delete({ where: { id: activite.id } });

    // Cascade : liaisons et commentaires supprimés ; l'employé, lui, subsiste.
    expect(await prisma.activiteEmploye.count({ where: { activiteId: activite.id } })).toBe(0);
    expect(await prisma.commentaireActivite.count({ where: { activiteId: activite.id } })).toBe(0);
    expect(await prisma.employe.count({ where: { id: employe.id } })).toBe(1);
  });

  it('met à NULL la parcelle d’une activité quand la parcelle est supprimée (SetNull)', async () => {
    const parcelle = await prisma.parcelle.create({
      data: { fermeId, nom: 'Parcelle test', code: `P-${Date.now()}`, superficieHa: 1.5 },
      select: { id: true },
    });
    const activite = await prisma.calendrierActivite.create({
      data: { fermeId, type: 'IRRIGATION', titre: 'Irrigation test', dateProgrammee: new Date(), parcelleId: parcelle.id },
      select: { id: true },
    });

    await prisma.parcelle.delete({ where: { id: parcelle.id } });

    const apres = await prisma.calendrierActivite.findUnique({ where: { id: activite.id }, select: { parcelleId: true } });
    expect(apres?.parcelleId).toBeNull(); // l'activité survit, le lien est dénoué
  });
});
