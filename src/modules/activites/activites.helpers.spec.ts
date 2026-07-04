import { StatutActivite } from '@prisma/client';
import { estEnRetard, STATUTS_ACTIVITE_OUVERTS } from './activites.helpers';

describe('activites.helpers — estEnRetard', () => {
  const hier = new Date('2026-01-01T00:00:00Z');
  const demain = new Date('2100-01-01T00:00:00Z');

  it('marque en retard une activité planifiée dont la date est passée', () => {
    expect(estEnRetard(hier, StatutActivite.PLANIFIEE)).toBe(true);
  });

  it('marque en retard une activité en cours dont la date est passée', () => {
    expect(estEnRetard(hier, StatutActivite.EN_COURS)).toBe(true);
  });

  it("ne marque pas en retard une activité terminée, même en retard de date", () => {
    expect(estEnRetard(hier, StatutActivite.TERMINEE)).toBe(false);
  });

  it("ne marque pas en retard une activité annulée", () => {
    expect(estEnRetard(hier, StatutActivite.ANNULEE)).toBe(false);
  });

  it("ne marque pas en retard une activité future encore ouverte", () => {
    expect(estEnRetard(demain, StatutActivite.PLANIFIEE)).toBe(false);
  });

  it('ne considère ouverts que PLANIFIEE et EN_COURS', () => {
    expect(STATUTS_ACTIVITE_OUVERTS).toEqual([StatutActivite.PLANIFIEE, StatutActivite.EN_COURS]);
  });
});
