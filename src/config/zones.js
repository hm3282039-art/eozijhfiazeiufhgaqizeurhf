import { WORLD } from './worldConfig.js';

/** État des zones (déblocages) : partagé entre le jeu, le panneau de téléportation et la porte. */
export const zoneState = { zone2Unlocked: false };

/**
 * Les zones du jeu (bandeau de zone + panneau de téléportation).
 * La Zone 2 se débloque en payant la porte (1 000 pièces) — ou gratuitement depuis le panneau Admin.
 */
export const ZONES = Object.freeze([
  {
    id: 'spawn',
    index: 1,
    name: 'Spawn',
    emoji: '🏝️',
    description: 'Le hub de départ : fontaine, arche arc-en-ciel et œuf géant.',
    unlocked: true,
    destination: WORLD.spawn,
  },
  {
    id: 'zone-2',
    index: 2,
    name: 'Zone 2',
    emoji: '🌸',
    description: 'Forêt de cerisiers et d’or : coffres riches et Coffre Boss Géant !',
    get unlocked() {
      return zoneState.zone2Unlocked;
    },
    price: { currency: 'coins', amount: WORLD.gate.price },
    destination: WORLD.zone2.entrance,
  },
]);
