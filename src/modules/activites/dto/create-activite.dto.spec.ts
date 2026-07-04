import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateActiviteDto } from './create-activite.dto';

/**
 * Teste les règles de validation du DTO de création d'activité, dont la borne
 * @Min(0) sur le coût ajoutée lors de la revue. Aucune base, aucune app : on
 * valide l'objet DTO isolément via class-validator.
 */
describe('CreateActiviteDto — validation', () => {
  const base = { titre: 'Semis test', type: 'SEMIS', dateProgrammee: '2026-07-15' };

  const valider = (payload: Record<string, unknown>) =>
    validate(plainToInstance(CreateActiviteDto, payload));

  it('accepte un payload minimal valide', async () => {
    const errors = await valider(base);
    expect(errors).toHaveLength(0);
  });

  it('rejette un coût négatif (@Min(0))', async () => {
    const errors = await valider({ ...base, cout: -5 });
    expect(errors.some((e) => e.property === 'cout')).toBe(true);
  });

  it('accepte un coût positif', async () => {
    const errors = await valider({ ...base, cout: 1500 });
    expect(errors.some((e) => e.property === 'cout')).toBe(false);
  });

  it('exige titre, type et dateProgrammee', async () => {
    const errors = await valider({ cout: 10 });
    const proprietesEnErreur = errors.map((e) => e.property);
    expect(proprietesEnErreur).toEqual(expect.arrayContaining(['titre', 'type', 'dateProgrammee']));
  });

  it('rejette un type hors de l’énumération', async () => {
    const errors = await valider({ ...base, type: 'INEXISTANT' });
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  it('rejette une date mal formée', async () => {
    const errors = await valider({ ...base, dateProgrammee: 'pas-une-date' });
    expect(errors.some((e) => e.property === 'dateProgrammee')).toBe(true);
  });
});
