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
});
