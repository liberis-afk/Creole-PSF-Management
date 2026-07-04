import { redirect } from 'next/navigation';
import { apiServerFetch } from '@/lib/api-server';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/app-shell';

interface Profil {
  utilisateur: { prenom: string; nom: string; email: string };
  ferme: { nom: string };
  role: { nom: string };
  permissions: string[];
}

/**
 * Layout partagé par toutes les pages protégées. Récupère le profil via
 * GET /auth/me côté serveur, puis monte la coquille applicative (sidebar,
 * navbar, footer) autour du contenu de chaque page.
 *
 * Ce composant reste un composant SERVEUR : il fait l'appel authentifié et
 * la redirection éventuelle. Toute l'interactivité (thème, sidebar, menu) est
 * déléguée à <Providers> et <AppShell>, qui sont clients. Le contenu des
 * pages (children) traverse la coquille sans devenir client.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { ok, data: profil } = await apiServerFetch<Profil>('/auth/me');

  if (!ok || !profil) {
    redirect('/login');
  }

  const nomComplet = `${profil.utilisateur.prenom} ${profil.utilisateur.nom}`;

  return (
    <Providers>
      <AppShell
        nomComplet={nomComplet}
        email={profil.utilisateur.email}
        role={profil.role.nom}
        ferme={profil.ferme.nom}
      >
        {children}
      </AppShell>
    </Providers>
  );
}
