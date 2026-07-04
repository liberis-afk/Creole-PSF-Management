import {
  LIBELLE_TYPE, LIBELLE_STATUT, LIBELLE_PRIORITE, COULEUR_TYPE,
  type TypeActivite, type StatutActivite, type PrioriteActivite,
} from '@/lib/activites-types';

/**
 * Verrouille la complétude des mappings d'affichage : chaque valeur d'enum doit
 * avoir un libellé (et une couleur pour les types). Empêche qu'un ajout d'enum
 * côté backend ne laisse un « undefined » à l'écran.
 */
const TYPES: TypeActivite[] = [
  'PLANTATION', 'SEMIS', 'FERTILISATION', 'IRRIGATION', 'DESHERBAGE',
  'PULVERISATION', 'RECOLTE', 'TRANSPORT', 'MAINTENANCE', 'AUTRE',
];
const STATUTS: StatutActivite[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'EN_RETARD'];
const PRIORITES: PrioriteActivite[] = ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'];

describe('activites-types — mappings d’affichage', () => {
  it.each(TYPES)('type %s a un libellé et une couleur', (type) => {
    expect(LIBELLE_TYPE[type]).toBeTruthy();
    expect(COULEUR_TYPE[type]).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it.each(STATUTS)('statut %s a un libellé', (statut) => {
    expect(LIBELLE_STATUT[statut]).toBeTruthy();
  });

  it.each(PRIORITES)('priorité %s a un libellé', (priorite) => {
    expect(LIBELLE_PRIORITE[priorite]).toBeTruthy();
  });
});
