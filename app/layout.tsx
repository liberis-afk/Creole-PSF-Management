import type { Metadata } from 'next';
import './globals.css';
import { themeInitScript } from '@/lib/theme-script';

export const metadata: Metadata = {
  title: 'Creole PSF Manage',
  description: 'Plateforme de gestion agricole',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Script anti-flash de thème : doit s'exécuter avant le rendu du body.
            dangerouslySetInnerHTML est le moyen standard et sûr ici — le
            contenu est une constante interne, jamais une entrée utilisateur. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
