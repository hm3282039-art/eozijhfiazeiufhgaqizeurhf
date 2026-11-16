import { dragonFace } from '../faces/dragonFace.js';
import { createDragonHorns, createDragonSpikes } from '../parts/horns.js';
import { createDragonTail } from '../parts/tails.js';
import { createDragonWings } from '../parts/wings.js';
import { createDragonMuzzle } from '../parts/muzzles.js';

/**
 * « Dragon » : silhouette imposante et haute (1.3 × 1.25 × 1.35) — vrai museau avancé
 * avec narines et crocs blancs, grandes ailes déployées sur les côtés, crête d'épines
 * le long du dos, longue queue reptilienne, grandes cornes courbées.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const dragonSpecies = {
  name: 'Dragon',
  body: { width: 1.3, height: 1.25, depth: 1.35, segments: 6, radius: 0.28 },
  face: dragonFace,

  buildParts(palette, body) {
    const wings = createDragonWings(palette, body);
    const horns = createDragonHorns(palette, body);
    const spikes = createDragonSpikes(palette, body);
    const tail = createDragonTail(palette, body);
    const muzzle = createDragonMuzzle(palette, body);
    let flapPhase = 0;

    return {
      objects: [wings.object3D, horns.object3D, spikes.object3D, tail.object3D, muzzle.object3D],

      animate({ dt, time, move, hop }) {
        // Ailes : GRANDES ailes qui battent vraiment, plus amples en déplacement.
        flapPhase += dt * lerp(3.2, 12, move);
        const flap = 0.08 + Math.sin(flapPhase) * lerp(0.18, 0.6, move);
        for (const wing of wings.wings) {
          wing.rotation.z = flap;
          wing.rotation.x = Math.sin(flapPhase * 0.5) * 0.12;
        }

        // Crête d'épines : ondule doucement.
        spikes.spikes.forEach((spike, index) => {
          spike.rotation.x = spike.userData.baseRotation - Math.sin(time * 2.2 + index * 1.1) * 0.1;
        });

        // Cornes : basculent légèrement.
        horns.object3D.children.forEach((horn, index) => {
          horn.rotation.x = horn.userData.baseRotation + Math.sin(time * 1.4 + index * 1.3) * 0.12;
        });

        // Longue queue qui ondule.
        tail.object3D.rotation.y = Math.sin(time * 1.8) * 0.3 + hop * 0.2 * move;
        tail.object3D.rotation.x = -0.1 + Math.sin(time * 2.6) * 0.15;
      },
    };
  },
};

/** Pct linéaire (évitement d'une dépendance inutile pour ce builder). */
function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
