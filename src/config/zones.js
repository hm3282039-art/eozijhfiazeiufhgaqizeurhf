import { WORLD } from './worldConfig.js';

/**
 * Les zones du jeu (bandeau de zone + panneau de téléportation).
 * La Version 1 ne contient que le Hub ; la Zone 2 est annoncée par la porte verrouillée.
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
    emoji: '🔒',
    description: 'Derrière le mur laser… bientôt disponible !',
    unlocked: false,
    price: { currency: 'coins', amount: WORLD.gate.price },
    destination: null,
  },
]);
