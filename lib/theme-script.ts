/**
 * Ce script est injecté tel quel dans le <head> et s'exécute AVANT que React
 * n'hydrate la page. Sans lui, la page se rendrait d'abord en clair puis
 * basculerait en sombre une fois React monté — le fameux "flash of incorrect
 * theme". En posant la classe 'dark' sur <html> immédiatement, on l'évite.
 *
 * Logique : préférence explicite de l'utilisateur (localStorage) si elle
 * existe, sinon préférence système. Enveloppé dans un try/catch car
 * localStorage peut être inaccessible (mode privé strict, cookies bloqués) —
 * dans ce cas on retombe silencieusement sur le thème clair.
 */
export const themeInitScript = `
(function () {
  try {
    var stocke = localStorage.getItem('psf-theme');
    var prefereSombre = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var sombre = stocke ? stocke === 'dark' : prefereSombre;
    if (sombre) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;
