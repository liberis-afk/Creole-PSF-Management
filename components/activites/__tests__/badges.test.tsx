import { render, screen } from '@testing-library/react';
import { StatutBadge, PrioriteBadge, TypeBadge, RetardBadge } from '@/components/activites/badges';

/** Rendu des badges : le bon libellé français apparaît pour chaque valeur. */
describe('Badges activités', () => {
  it('StatutBadge affiche le libellé du statut', () => {
    render(<StatutBadge statut="EN_COURS" />);
    expect(screen.getByText('En cours')).toBeInTheDocument();
  });

  it('PrioriteBadge affiche le libellé de la priorité', () => {
    render(<PrioriteBadge priorite="URGENTE" />);
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('TypeBadge affiche le libellé du type', () => {
    render(<TypeBadge type="RECOLTE" />);
    expect(screen.getByText('Récolte')).toBeInTheDocument();
  });

  it('RetardBadge affiche « En retard »', () => {
    render(<RetardBadge />);
    expect(screen.getByText('En retard')).toBeInTheDocument();
  });
});
