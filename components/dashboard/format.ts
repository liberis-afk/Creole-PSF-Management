/**
 * Formatage centralisé. Toute somme d'argent, tout grand nombre et toute date
 * affichés dans le dashboard passent par ici — garantit une présentation
 * cohérente et évite que chaque composant réinvente son Intl.NumberFormat
 * (source classique de formats divergents d'un écran à l'autre).
 */

export function formaterNombre(valeur: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(valeur);
}

export function formaterDevise(valeur: number, devise: string): string {
  // On n'utilise pas style:'currency' avec le code ISO car HTG (gourde
  // haïtienne) n'a pas toujours de symbole rendu proprement selon
  // l'environnement ; on formate le nombre et on suffixe le code, lisible et
  // stable quelle que soit la devise configurée par la ferme.
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(valeur)} ${devise}`;
}

/** Valeur nullable -> "—" (non calculable) plutôt qu'un 0 trompeur. */
export function formaterOuTiret(valeur: number | null, suffixe = ''): string {
  if (valeur === null) return '—';
  return `${formaterNombre(valeur)}${suffixe}`;
}

export function formaterDateCourte(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

export function formaterHeure(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

/** Libellé de mois court à partir d'une période "YYYY-MM" (axe des graphiques). */
export function formaterMoisCourt(periode: string): string {
  const [annee, mois] = periode.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(annee, mois - 1, 1));
}
