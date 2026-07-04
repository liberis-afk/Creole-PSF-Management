import { act, renderHook, waitFor } from '@testing-library/react';
import { useActivitesList } from '@/lib/use-activites-list';

/**
 * Teste la logique du hook de liste : appel au montage avec les bons
 * paramètres, rechargement sur filtre, et anti-rebond (350 ms) de la recherche.
 * `fetch` est mocké — aucun réseau.
 */
describe('useActivitesList', () => {
  const reponse = { donnees: [], pagination: { page: 1, limit: 15, total: 0, totalPages: 0 } };
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => reponse });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('charge la liste au montage avec les paramètres par défaut', async () => {
    const { result } = renderHook(() => useActivitesList());
    await waitFor(() => expect(result.current.chargement).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/activites?');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=15');
    expect(result.current.data).toEqual(reponse);
  });

  it('recharge en appliquant le filtre type', async () => {
    const { result } = renderHook(() => useActivitesList());
    await waitFor(() => expect(result.current.chargement).toBe(false));

    act(() => result.current.setType('IRRIGATION'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toContain('type=IRRIGATION');
  });

  it('débounce la recherche : recharge seulement après 350 ms', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useActivitesList());
    // Laisse l'appel initial se résoudre.
    await act(async () => { await Promise.resolve(); });
    const baseline = fetchMock.mock.calls.length;

    act(() => result.current.setRechercheSaisie('maïs'));
    act(() => { jest.advanceTimersByTime(340); });
    expect(fetchMock.mock.calls.length).toBe(baseline); // pas encore rechargé

    await act(async () => { jest.advanceTimersByTime(20); await Promise.resolve(); });
    const dernier = decodeURIComponent(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0] as string);
    expect(dernier).toContain('recherche=maïs');
  });
});
