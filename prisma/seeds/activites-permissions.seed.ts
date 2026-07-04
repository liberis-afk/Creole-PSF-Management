/**
 * Seed des permissions du module Activités (Calendrier agricole) — autonome et
 * idempotent. Même approche que les modules précédents.
 *
 * Lancement : `ts-node prisma/seeds/activites-permissions.seed.ts`
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: 'activites.consulter', module: 'activites', description: 'Consulter les activités et le calendrier' },
  { code: 'activites.creer', module: 'activites', description: 'Créer une activité' },
  { code: 'activites.modifier', module: 'activites', description: 'Modifier une activité, ses employés, commentaires et pièces jointes' },
  { code: 'activites.supprimer', module: 'activites', description: 'Supprimer une activité' },
] as const;

const ATTRIBUTIONS: Record<string, string[]> = {
  'Super Administrateur': ['activites.consulter', 'activites.creer', 'activites.modifier', 'activites.supprimer'],
  Administrateur: ['activites.consulter', 'activites.creer', 'activites.modifier', 'activites.supprimer'],
  Gestionnaire: ['activites.consulter', 'activites.creer', 'activites.modifier', 'activites.supprimer'],
  Agronome: ['activites.consulter', 'activites.creer', 'activites.modifier'],
  Comptable: ['activites.consulter'],
  "Chef d'équipe": ['activites.consulter', 'activites.creer', 'activites.modifier'],
  Employé: ['activites.consulter'],
  Visiteur: ['activites.consulter'],
};

async function main() {
  console.log('Seed Activités — création des permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code: permission.code }, update: {}, create: permission });
  }

  console.log('Seed Activités — attribution aux rôles système...');
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

  console.log('Seed Activités terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
