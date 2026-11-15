import { GAME_CONFIG } from '../../config/gameConfig.js';
import { TAU, smoothstep } from '../../utils/math.js';

const HOP = GAME_CONFIG.pets.hop;

/**
 * Styles d'animation de déplacement des pets.
 *
 * Chaque style remplit une « pose » à partir de :
 *   phase  phase du cycle (radians) — avance avec le temps
 *   time   temps propre au pet (s)
 * La pose est ensuite pondérée par l'animateur (0 = au repos, 1 = en plein déplacement).
 *
 * @typedef {object} MotionPose
 * @property {number} y        hauteur au-dessus du sol
 * @property {number} tiltZ    balancement gauche / droite (rotation Z)
 * @property {number} tiltX    inclinaison avant / arrière (rotation X)
 * @property {number} spinY    rotation supplémentaire sur soi-même
 * @property {number} stretch  > 0 : étiré en hauteur · < 0 : écrasé
 * @property {number} hop      0 = au sol → 1 = sommet du saut (pour les oreilles, la queue…)
 *
 * @typedef {{ id: string, label: string, frequency: number, pose: (out: MotionPose, phase: number, time: number) => void }} PetAnimationStyle
 */

/** @type {readonly PetAnimationStyle[]} */
export const PET_ANIMATION_STYLES = Object.freeze([
  {
    // Le « saut de pet » signature de PS99 : petits bonds rapides + balancement gauche/droite.
    id: 'hop',
    label: 'Rebond',
    frequency: HOP.frequency,
    pose(out, phase) {
      const wave = Math.abs(Math.sin(phase));
      out.y = wave * HOP.height;
      out.tiltZ = Math.sin(phase) * HOP.tilt;
      out.tiltX = 0.07;
      out.spinY = 0;
      out.stretch = (wave - 0.35) * 0.17;
      out.hop = wave;
    },
  },
  {
    // Le pet plane au-dessus du sol en ondulant doucement.
    id: 'float',
    label: 'Lévitation',
    frequency: 3.4,
    pose(out, phase, time) {
      out.y = 0.5 + Math.sin(phase) * 0.13;
      out.tiltZ = Math.sin(time * 2.2) * 0.1;
      out.tiltX = 0.2 + Math.sin(phase + 1) * 0.04;
      out.spinY = 0;
      out.stretch = Math.sin(phase) * 0.025;
      out.hop = 0.5 + Math.sin(phase) * 0.5;
    },
  },
  {
    // Un bond plus haut, avec une vrille complète à chaque saut.
    id: 'spin',
    label: 'Toupie',
    frequency: 7.5,
    pose(out, phase) {
      const cycle = (phase / Math.PI) % 1;
      const wave = Math.sin(cycle * Math.PI);
      out.y = wave * HOP.height * 1.5;
      out.tiltZ = 0;
      out.tiltX = 0;
      out.spinY = smoothstep(0.08, 0.92, cycle) * TAU;
      out.stretch = (wave - 0.3) * 0.2;
      out.hop = wave;
    },
  },
  {
    // Le pet reste presque au sol et se dandine comme un pingouin.
    id: 'waddle',
    label: 'Dandinement',
    frequency: 9,
    pose(out, phase) {
      const wave = Math.abs(Math.sin(phase));
      out.y = wave * 0.1;
      out.tiltZ = Math.sin(phase) * 0.34;
      out.tiltX = 0.05;
      out.spinY = Math.sin(phase) * 0.22;
      out.stretch = (wave - 0.5) * 0.05;
      out.hop = wave * 0.4;
    },
  },
]);

export const DEFAULT_PET_ANIMATION = PET_ANIMATION_STYLES[0];

/** @returns {MotionPose} */
export function createMotionPose() {
  return { y: 0, tiltZ: 0, tiltX: 0, spinY: 0, stretch: 0, hop: 0 };
}
