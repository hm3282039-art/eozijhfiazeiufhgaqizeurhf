/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 * Le décor est généré avec une graine fixe : l'île est identique à chaque lancement.
 */
export function createRng(seed = 1) {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    /** Nombre dans [0, 1[. */
    next,
    /** Nombre dans [min, max[. */
    range: (min, max) => min + next() * (max - min),
    /** Entier dans [min, max]. */
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    /** Élément aléatoire d'un tableau. */
    pick: (array) => array[Math.floor(next() * array.length)],
    /** Vrai avec la probabilité donnée. */
    chance: (probability) => next() < probability,
  };
}
