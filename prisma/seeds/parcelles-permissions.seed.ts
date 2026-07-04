/**
 * Seed des permissions du module Parcelles — autonome et idempotent.
 *
 * Volontairement séparé du seed du Module 1 (qu'on ne modifie pas) : chaque
 * module enregistre ses propres permissions. Ce script (a) crée les 4
 * permissions du module si absentes, et (b) les attribue aux rôles système
 * pertinents, y compris au Super Administrateur — car le seed initial n'a
 * accordé QUE les permissions existantes à sa création, pas celles ajoutées
 * ensuite.
 *
 * Lancement : `ts-node prisma/seeds/parcelles-permissions.seed.ts`
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: 'parcelles.consulter', module: 'parcelles', description: 'Consulter les parcelles' },
  { code: 'parcelles.creer', module: 'parcelles', description: 'Créer une parcelle' },
  { code: 'parcelles.modifier', module: 'parcelles', description: 'Modifier une parcelle, ses analyses et photos' },
  { code: 'parcelles.supprimer', module: 'parcelles', description: 'Supprimer une parcelle' },
] as const;

// Attribution par défaut sensée. Modifiable ensuite via le Module 17.
const ATTRIBUTIONS: Record<string, string[]> = {
  'Super Administrateur': ['parcelles.consulter', 'parcelles.creer', 'parcelles.modifier', 'parcelles.supprimer'],
  Administrateur: ['parcelles.consulter', 'parcelles.creer', 'parcelles.modifier', 'parcelles.supprimer'],
  Gestionnaire: ['parcelles.consulter', 'parcelles.creer', 'parcelles.modifier', 'parcelles.supprimer'],
  Agronome: ['parcelles.consulter', 'parcelles.creer', 'parcelles.modifier'],
  "Chef d'équipe": ['parcelles.consulter'],
  Employé: ['parcelles.consulter'],
  Visiteur: ['parcelles.consulter'],
};

async function main() {
  console.log('Seed Parcelles — création des permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }

  console.log('Seed Parcelles — attribution aux rôles système...');
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

  console.log('Seed Parcelles terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
