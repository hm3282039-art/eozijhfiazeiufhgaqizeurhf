/**
 * Palette « Toy / Low-Poly Vibrant ».
 * Les couleurs sont volontairement très saturées : le tone mapping ACES
 * les adoucit légèrement au rendu.
 */
export const PALETTE = Object.freeze({
  sky: {
    zenith: '#1f8fff',
    mid: '#6cc4ff',
    horizon: '#d2f0ff',
  },
  fog: '#cdeeff',

  light: {
    hemisphereSky: '#ffffff',
    hemisphereGround: '#b4f59c',
    sun: '#fff0d2',
    fill: '#bfe3ff',
  },

  grass: {
    base: '#5ed43a',
    light: '#6fe04a',
    dark: '#51c531',
    side: '#49b82d',
  },

  stone: {
    base: '#a9b3c4',
    light: '#c5cedb',
    dark: '#8b96aa',
    cliff: '#98a3b6',
  },

  path: {
    base: '#dcb761',
    stones: ['#f8dd8d', '#f2cf74', '#fbe8ad', '#edc96a', '#f6d680'],
  },

  wood: {
    trunk: '#93602f',
    trunkDark: '#74471f',
    plank: '#c98a4b',
  },

  foliage: {
    green: ['#35b83c', '#4fd04a', '#2aa544'],
    lime: ['#7edb3c', '#9be84f', '#62c636'],
    teal: ['#27b989', '#3fd3a0', '#1ea37c'],
    pink: ['#ff86c3', '#ffa9d6', '#ff65ae'],
  },

  flowers: ['#ffffff', '#ffd84a', '#ff7eb6', '#ff5a5a', '#b48bff', '#6ad4ff'],

  water: {
    ocean: '#2fc3f3',
    oceanDeep: '#1aa5e6',
    fountain: '#7fe3ff',
  },

  gate: {
    pillar: '#8f9bb3',
    pillarCap: '#ffcf3f',
    laser: '#ff2e63',
    laserGlow: '#ff8fb0',
    sign: '#2a2f55',
  },

  gold: '#ffc93c',
  white: '#ffffff',
  ink: '#262b47',

  /** Ambiances « jour » / « coucher de soleil doré » (panneau Admin) : le ciel et les lumières glissent de l'une à l'autre. */
  moods: {
    day: {
      sky: { zenith: '#1f8fff', mid: '#6cc4ff', horizon: '#d2f0ff' },
      fog: '#cdeeff',
      sun: '#fff0d2',
      sunIntensity: 2.3,
      hemisphereSky: '#ffffff',
      hemisphereGround: '#b4f59c',
      hemisphereIntensity: 1.25,
      fill: '#bfe3ff',
      fillIntensity: 0.25,
      glow: '#fff3c4',
    },
    sunset: {
      sky: { zenith: '#5a4a9e', mid: '#ff9a5c', horizon: '#ffd9a0' },
      fog: '#ffc98f',
      sun: '#ffb066',
      sunIntensity: 1.9,
      hemisphereSky: '#ffd9b0',
      hemisphereGround: '#8a5a3a',
      hemisphereIntensity: 0.95,
      fill: '#ff9a6a',
      fillIntensity: 0.15,
      glow: '#ff9a4d',
    },
  },

  /** Couleurs des Breakables. */
  breakable: {
    wood: '#a06a35',
    woodDark: '#7c4f24',
    gold: '#ffc93c',
    goldDark: '#e39a12',
    royalRed: '#e0304e',
    royalRedDark: '#b01e3c',
    crystal: '#4fc3ff',
    crystalDark: '#1f8ef0',
    gem: '#ff5a7a',
  },

  /** Herbe émeraude de la Zone 2 (forêt de cerisiers & or). */
  grassEmerald: {
    base: '#2fbf71',
    light: '#3fd183',
    dark: '#28a862',
    side: '#24995a',
  },

  /** Sol sombre / violet des Mines de Cristal (Zone 3). */
  grassCrystal: {
    base: '#3a2a52',
    light: '#4a3868',
    dark: '#2c2040',
    side: '#241a35',
  },

  /** Couleurs des cristaux géants de la Zone 3. */
  crystalMine: {
    cyan: '#27d3ee',
    cyanDark: '#0ea5c4',
    magenta: '#ff2ee0',
    magentaDark: '#c010a0',
    violet: '#7c4dff',
  },
});
