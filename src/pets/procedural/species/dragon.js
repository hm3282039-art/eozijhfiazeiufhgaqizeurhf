import { lerp } from '../../../utils/math.js';
import { dragonFace } from '../faces/dragonFace.js';
import { createDragonHorns, createDragonSpikes } from '../parts/horns.js';
import { createDragonTail } from '../parts/tails.js';
import { createDragonWings } from '../parts/wings.js';

/**
 * « Mini Dragon » : cornes dorées, crête, deux petites ailes dorsales qui battent,
 * regard déterminé et crocs blancs.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const dragonSpecies = {
  face: dragonFace,

  buildParts(palette) {
    const horns = createDragonHorns(palette);
    const spikes = createDragonSpikes(palette);
    const wings = createDragonWings(palette);
    const tail = createDragonTail(palette);
    let flapPhase = 0;

    return {
      objects: [horns.object3D, spikes.object3D, wings.object3D, tail.object3D],

      animate({ dt, time, move }) {
        // Battement doux au repos, plus rapide et plus ample en déplacement.
        flapPhase += dt * lerp(4.6, 13, move);
        const flap = 0.08 + Math.sin(flapPhase) * lerp(0.26, 0.5, move);
        for (const wing of wings.wings) wing.rotation.z = flap;

        tail.object3D.rotation.y = Math.sin(time * 2.1) * 0.24;
      },
    };
  },
};
