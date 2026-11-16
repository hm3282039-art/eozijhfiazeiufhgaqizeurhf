import { WORLD } from './worldConfig.js';

/**
 * État des zones (déblocages) : partagé entre le jeu, le panneau de téléportation
 * et les portes. Zone 2 à 1 000 pièces, Zone 3 à 10 000 pièces.
 */
export const zoneState = { zone2Unlocked: false, zone3Unlocked: false };

/**
 * Les zones du jeu (bandeau de zone + panneau de téléportation).
 * La Zone 2 se débloque à 1 000 pièces, la Zone 3 à 10 000 pièces
 * (ou gratuitement depuis le panneau Admin).
 */
export const ZONES = Object.freeze([
  {
    id: 'spawn',
    index: 1,
    name: 'Spawn',
    emoji: '🏝️',
    description: 'Le hub de départ : fontaine, arche arc-en-ciel et les 3 œufs.',
    unlocked: true,
    destination: WORLD.spawn,
  },
  {
    id: 'zone-2',
    index: 2,
    name: 'Forêt Sakura',
    emoji: '🌸',
    description: 'Forêt de cerisiers et d’or : coffres riches et bois moussu.',
    get unlocked() {
      return zoneState.zone2Unlocked;
    },
    price: { currency: 'coins', amount: WORLD.gate.price },
    destination: WORLD.zone2.entrance,
  },
  {
    id: 'zone-3',
    index: 3,
    name: 'Mines de Cristal',
    emoji: '💎',
    description: 'Mines de cristal & or : cristaux géants et coffres très résistants.',
    get unlocked() {
      return zoneState.zone3Unlocked;
    },
    price: { currency: 'coins', amount: WORLD.gate2.price },
    destination: WORLD.zone3.entrance,
  },
]);
