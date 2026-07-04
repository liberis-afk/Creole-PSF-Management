import type { Config } from 'tailwindcss';

const config: Config = {
  // 'class' plutôt que 'media' : le thème sombre est piloté par une classe
  // sur <html> que l'utilisateur contrôle explicitement (voir ThemeProvider),
  // pas seulement par la préférence système. On respecte quand même la
  // préférence système comme valeur INITIALE (voir le script anti-flash).
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette volontairement restreinte (1 accent + neutres) — cohérent
        // avec l'inspiration Stripe/Linear : beaucoup d'espace, hiérarchie
        // typographique forte, la couleur réservée aux éléments actifs.
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
      },
      fontFamily: {
        // Pile système : rendu immédiat, pas de FOUT, cohérent avec l'exigence
        // "rapide" de la SFD. Une police de marque pourra être ajoutée plus tard.
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
