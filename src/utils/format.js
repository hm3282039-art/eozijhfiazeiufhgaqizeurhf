const frenchNumber = new Intl.NumberFormat('fr-FR');

const COMPACT_UNITS = [
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e4, suffix: 'k', divisor: 1e3 },
];

/**
 * Écrit un nombre à la française. `Intl` sépare les milliers par une espace fine insécable
 * (U+202F), presque invisible dans la police du jeu : on la remplace par une espace insécable
 * normale pour que « 1 000 » se lise bien.
 */
function french(value) {
  return frenchNumber.format(value).replace(/\u202f/g, '\u00a0');
}

/** 1234567 → « 1 234 567 » */
export function formatNumber(value) {
  return french(Math.floor(value));
}

/** Format compact des compteurs de monnaie : 950 → « 950 » · 12 500 → « 12,5k » · 3 200 000 → « 3,2M ». */
export function formatCompact(value) {
  const amount = Math.floor(value);
  for (const { value: threshold, suffix, divisor = threshold } of COMPACT_UNITS) {
    if (amount >= threshold) {
      const scaled = Math.floor((amount / divisor) * 10) / 10;
      return `${french(scaled)}${suffix}`;
    }
  }
  return french(amount);
}

/**
 * Typographie française : l'espace qui précède « ! ? : ; » (et celle à l'intérieur des
 * guillemets « … ») devient insécable, pour qu'un signe de ponctuation ne se retrouve
 * jamais seul au début d'une ligne.
 */
export function frenchTypography(text) {
  return text.replace(/ ([!?:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
}
