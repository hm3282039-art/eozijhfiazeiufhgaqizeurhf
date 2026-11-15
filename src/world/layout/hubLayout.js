import { WORLD } from '../../config/worldConfig.js';

/**
 * Plan de décoration du Hub (Zone 1) : tout est placé « à la main » pour composer
 * de jolies vues depuis le spawn et laisser de grandes pelouses dégagées pour jouer.
 * Rappel : +Z = sud (spawn), −Z = nord (porte de la Zone 2).
 */

/** Arbres : `shape` = 'round' (boules) ou 'cube' (cubes arrondis) · `color` = clé de PALETTE.foliage. */
export const TREES = [
  // ── Autour de la place du spawn ──────────────────────────────────────────
  { x: -13.5, z: 31.5, shape: 'round', color: 'pink', scale: 1.05 },
  { x: 13.8, z: 30.5, shape: 'cube', color: 'green', scale: 1.0 },
  { x: -14.5, z: 14.5, shape: 'cube', color: 'lime', scale: 0.95 },
  { x: 14.2, z: 13.8, shape: 'round', color: 'green', scale: 1.1 },

  // ── Fond sud (derrière le spawn) ─────────────────────────────────────────
  { x: -24, z: 38.5, shape: 'cube', color: 'green', scale: 1.2 },
  { x: -8.5, z: 39.5, shape: 'round', color: 'lime', scale: 1.0 },
  { x: 7.5, z: 39.8, shape: 'round', color: 'pink', scale: 0.95 },
  { x: 23.5, z: 38, shape: 'round', color: 'green', scale: 1.25 },

  // ── Côté ouest ───────────────────────────────────────────────────────────
  { x: -25, z: 25, shape: 'round', color: 'green', scale: 1.15 },
  { x: -24.5, z: 10.5, shape: 'round', color: 'pink', scale: 1.1 },
  { x: -9, z: -6.5, shape: 'round', color: 'lime', scale: 0.9 },
  { x: -25, z: -8, shape: 'cube', color: 'teal', scale: 1.15 },
  { x: -17, z: -17.5, shape: 'round', color: 'pink', scale: 1.2 },
  { x: -8.5, z: -24, shape: 'cube', color: 'green', scale: 1.0 },
  { x: -24.5, z: -27, shape: 'round', color: 'green', scale: 1.1 },
  { x: -15, z: -35, shape: 'cube', color: 'lime', scale: 1.1 },
  { x: -24.5, z: -37, shape: 'round', color: 'pink', scale: 0.95 },

  // ── Côté est ─────────────────────────────────────────────────────────────
  { x: 25, z: 24, shape: 'cube', color: 'teal', scale: 1.1 },
  { x: 24.5, z: 9, shape: 'round', color: 'lime', scale: 1.05 },
  { x: 9.5, z: 0.5, shape: 'round', color: 'pink', scale: 1.0 },
  { x: 18.5, z: -5.5, shape: 'cube', color: 'green', scale: 1.2 },
  { x: 25, z: -15, shape: 'round', color: 'pink', scale: 1.1 },
  { x: 9, z: -18.5, shape: 'round', color: 'green', scale: 0.95 },
  { x: 17, z: -26, shape: 'round', color: 'lime', scale: 1.15 },
  { x: 25, z: -31, shape: 'cube', color: 'green', scale: 1.05 },
  { x: 9.5, z: -34.5, shape: 'round', color: 'pink', scale: 1.05 },
  { x: 19, z: -37.5, shape: 'round', color: 'teal', scale: 0.9 },
];

/** Buissons : `berries` = couleur des baies (optionnel). */
export const BUSHES = [
  { x: -5.2, z: 9.2, color: 'green', scale: 1.0, berries: '#ff5a7a' },
  { x: 5.4, z: 8.8, color: 'lime', scale: 0.9 },
  { x: -11.5, z: 27.5, color: 'lime', scale: 1.05 },
  { x: 11.8, z: 18.5, color: 'green', scale: 1.0, berries: '#ffd84a' },
  { x: -21, z: 34.5, color: 'teal', scale: 1.1 },
  { x: 20.5, z: 33.5, color: 'green', scale: 1.15, berries: '#ffffff' },
  { x: -5, z: -12, color: 'green', scale: 0.95 },
  { x: 5.2, z: -9.5, color: 'teal', scale: 0.9, berries: '#ff7eb6' },
  { x: -21.5, z: 1, color: 'lime', scale: 1.0 },
  { x: -12.5, z: 6.8, color: 'green', scale: 0.85, berries: '#ffd84a' },
  { x: 21, z: 2.5, color: 'green', scale: 1.1 },
  { x: -5.2, z: -30, color: 'lime', scale: 1.0, berries: '#ff5a7a' },
  { x: 5.3, z: -28, color: 'green', scale: 1.05 },
  { x: -20, z: -22, color: 'green', scale: 1.1, berries: '#ffffff' },
  { x: 21.5, z: -22.5, color: 'teal', scale: 1.0 },
  { x: -6.8, z: -37.5, color: 'green', scale: 1.15 },
  { x: 6.6, z: -37.8, color: 'lime', scale: 1.1, berries: '#ffd84a' },
];

/** Rochers décoratifs (avec collision). */
export const ROCKS = [
  { x: -19.5, z: 20.5, scale: 1.0 },
  { x: 19, z: 20, scale: 0.85 },
  { x: 13.5, z: -11.5, scale: 1.1 },
  { x: -13, z: -27.5, scale: 0.95 },
  { x: 23, z: -3, scale: 0.8 },
  { x: -23.5, z: -17.5, scale: 0.9 },
];

/**
 * Zones où l'on ne sème pas de fleurs : chemin, place, socle de l'œuf, porte,
 * et pied des arbres / rochers.
 */
export function isDecorationBlocked(x, z) {
  const { plaza, path, eggPedestal, gate, arch } = WORLD;

  if (Math.hypot(x - plaza.x, z - plaza.z) < plaza.radius + 1.2) return true;
  if (Math.abs(x) < path.halfWidth + 1 && z < path.startZ + 3) return true;
  if (Math.hypot(x - eggPedestal.x, z - eggPedestal.z) < eggPedestal.radius + 1) return true;
  if (Math.abs(x) < gate.halfOpening + gate.pillarSize + 1.5 && z < gate.z + 3.5) return true;
  if (Math.abs(Math.abs(x) - 4.55) < 2.4 && Math.abs(z - arch.z) < 2.4) return true;

  for (const tree of TREES) {
    if (Math.hypot(x - tree.x, z - tree.z) < 1.2) return true;
  }
  for (const rock of ROCKS) {
    if (Math.hypot(x - rock.x, z - rock.z) < 2.2) return true;
  }
  return false;
}
