'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FermeChoix {
  id: string;
  nom: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  // État du flux multi-fermes : quand renseigné, on affiche le sélecteur.
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [fermes, setFermes] = useState<FermeChoix[]>([]);

  async function soumettreConnexion(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErreur(data.message ?? 'Échec de la connexion');
        return;
      }

      if (data.statut === 'SELECTION_FERME_REQUISE') {
        setPreAuthToken(data.preAuthToken);
        setFermes(data.fermes);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setErreur('Impossible de contacter le serveur');
    } finally {
      setChargement(false);
    }
  }

  async function choisirFerme(fermeId: string) {
    setErreur(null);
    setChargement(true);
    try {
      const res = await fetch('/api/auth/select-farm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthToken, fermeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.message ?? 'Échec de la sélection');
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setErreur('Impossible de contacter le serveur');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Creole PSF Manage</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestion agricole professionnelle</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          {!preAuthToken ? (
            <form onSubmit={soumettreConnexion} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              {erreur && <p className="text-sm text-red-600 dark:text-red-400">{erreur}</p>}

              <button
                type="submit"
                disabled={chargement}
                className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {chargement ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">Choisissez une ferme :</p>
              {erreur && <p className="text-sm text-red-600 dark:text-red-400">{erreur}</p>}
              {fermes.map((ferme) => (
                <button
                  key={ferme.id}
                  onClick={() => choisirFerme(ferme.id)}
                  disabled={chargement}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left text-sm transition hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50 dark:border-gray-800 dark:hover:border-brand-500 dark:hover:bg-brand-600/10"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{ferme.nom}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{ferme.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
