/**
 * Seed minimal pour tester le module Authentification de bout en bout.
 * Volontairement limité aux données nécessaires à CE module : les 8 rôles
 * système de la SFD sont créés (gabarits, fermeId = null), mais seul le
 * catalogue de permissions du module 1 est peuplé — les permissions des
 * modules suivants (parcelles.*, finances.*, ...) seront ajoutées par leurs
 * propres seeds au fur et à mesure, sans jamais toucher à ce fichier
 * (append-only par convention pour éviter les conflits de fusion).
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ROLES_SYSTEME = [
  'Super Administrateur',
  'Administrateur',
  'Gestionnaire',
  'Agronome',
  'Comptable',
  "Chef d'équipe",
  'Employé',
  'Visiteur',
] as const;

const PERMISSIONS_MODULE_AUTH = [
  { code: 'auth.sessions.voir', module: 'auth', description: 'Voir ses propres sessions actives' },
  { code: 'utilisateurs.gerer', module: 'auth', description: 'Créer/modifier/désactiver des utilisateurs' },
  { code: 'roles.gerer', module: 'auth', description: 'Créer/modifier des rôles personnalisés' },
  { code: 'permissions.gerer', module: 'auth', description: 'Assigner des permissions à un rôle' },
] as const;

async function main() {
  console.log('Seed — création des permissions du module Authentification...');
  for (const permission of PERMISSIONS_MODULE_AUTH) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }

  console.log('Seed — création des rôles système...');
  for (const nomRole of ROLES_SYSTEME) {
    await prisma.role.upsert({
      where: { fermeId_nom: { fermeId: null, nom: nomRole } },
      update: {},
      create: { nom: nomRole, estSysteme: true, fermeId: null },
    });
  }

  const superAdminRole = await prisma.role.findFirstOrThrow({
    where: { nom: 'Super Administrateur', estSysteme: true },
  });

  console.log('Seed — attribution de toutes les permissions au Super Administrateur...');
  const toutesPermissions = await prisma.permission.findMany();
  for (const permission of toutesPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id },
      },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }

  console.log('Seed — création de la ferme de démonstration...');
  const ferme = await prisma.ferme.upsert({
    where: { code: 'FERME-DEMO' },
    update: {},
    create: {
      nom: 'Ferme Créole Démo',
      code: 'FERME-DEMO',
      ville: 'Port-au-Prince',
      pays: 'Haïti',
    },
  });

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@creolepsf.ht';
  const motDePasse = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMoi123!';

  console.log(`Seed — création du compte administrateur de démonstration (${email})...`);
  const motDePasseHash = await argon2.hash(motDePasse);
  const utilisateur = await prisma.utilisateur.upsert({
    where: { email },
    update: {},
    create: {
      email,
      motDePasseHash,
      prenom: 'Admin',
      nom: 'Démo',
      statut: 'ACTIF',
    },
  });

  await prisma.fermeUtilisateur.upsert({
    where: { fermeId_utilisateurId: { fermeId: ferme.id, utilisateurId: utilisateur.id } },
    update: {},
    create: {
      fermeId: ferme.id,
      utilisateurId: utilisateur.id,
      roleId: superAdminRole.id,
      statut: 'ACCEPTEE',
    },
  });

  console.log('Seed terminé.');
  console.log(`   Ferme       : ${ferme.nom} (${ferme.code})`);
  console.log(`   Utilisateur : ${email} / ${motDePasse}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
