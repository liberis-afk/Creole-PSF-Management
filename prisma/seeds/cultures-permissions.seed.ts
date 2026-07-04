/**
 * Seed des permissions du module Cultures — autonome et idempotent.
 * Même approche que le seed Parcelles : chaque module enregistre ses propres
 * permissions sans toucher au seed du Module 1.
 *
 * Lancement : `ts-node prisma/seeds/cultures-permissions.seed.ts`
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: 'cultures.consulter', module: 'cultures', description: 'Consulter les cultures' },
  { code: 'cultures.creer', module: 'cultures', description: 'Créer une culture' },
  { code: 'cultures.modifier', module: 'cultures', description: 'Modifier une culture, ses suivis, traitements et photos' },
  { code: 'cultures.supprimer', module: 'cultures', description: 'Supprimer une culture' },
] as const;

const ATTRIBUTIONS: Record<string, string[]> = {
  'Super Administrateur': ['cultures.consulter', 'cultures.creer', 'cultures.modifier', 'cultures.supprimer'],
  Administrateur: ['cultures.consulter', 'cultures.creer', 'cultures.modifier', 'cultures.supprimer'],
  Gestionnaire: ['cultures.consulter', 'cultures.creer', 'cultures.modifier', 'cultures.supprimer'],
  Agronome: ['cultures.consulter', 'cultures.creer', 'cultures.modifier'],
  "Chef d'équipe": ['cultures.consulter', 'cultures.modifier'],
  Employé: ['cultures.consulter'],
  Visiteur: ['cultures.consulter'],
};

async function main() {
  console.log('Seed Cultures — création des permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }

  console.log('Seed Cultures — attribution aux rôles système...');
  for (const [nomRole, codes] of Object.entries(ATTRIBUTIONS)) {
    const role = await prisma.role.findFirst({ where: { nom: nomRole, estSysteme: true } });
    if (!role) {
      console.warn(`  Rôle système "${nomRole}" absent, ignoré.`);
      continue;
    }
    for (const code of codes) {
      const permission = await prisma.permission.findUnique({ where: { code } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seed Cultures terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
