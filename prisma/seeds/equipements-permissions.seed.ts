/**
 * Seed des permissions du module Équipements — autonome et idempotent.
 * Même approche que parcelles/cultures : le module enregistre ses propres
 * permissions sans toucher au seed du Module 1.
 *
 * Lancement : `ts-node prisma/seeds/equipements-permissions.seed.ts`
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: 'equipements.consulter', module: 'equipements', description: 'Consulter les équipements, maintenances et statistiques' },
  { code: 'equipements.creer', module: 'equipements', description: 'Créer un équipement' },
  { code: 'equipements.modifier', module: 'equipements', description: 'Modifier un équipement, ses entretiens, utilisations et photos' },
  { code: 'equipements.supprimer', module: 'equipements', description: 'Supprimer un équipement' },
] as const;

const ATTRIBUTIONS: Record<string, string[]> = {
  'Super Administrateur': ['equipements.consulter', 'equipements.creer', 'equipements.modifier', 'equipements.supprimer'],
  Administrateur: ['equipements.consulter', 'equipements.creer', 'equipements.modifier', 'equipements.supprimer'],
  Gestionnaire: ['equipements.consulter', 'equipements.creer', 'equipements.modifier', 'equipements.supprimer'],
  Agronome: ['equipements.consulter'],
  Comptable: ['equipements.consulter'],
  "Chef d'équipe": ['equipements.consulter', 'equipements.modifier'],
  Employé: ['equipements.consulter'],
  Visiteur: ['equipements.consulter'],
};

async function main() {
  console.log('Seed Équipements — création des permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code: permission.code }, update: {}, create: permission });
  }

  console.log('Seed Équipements — attribution aux rôles système...');
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

  console.log('Seed Équipements terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
