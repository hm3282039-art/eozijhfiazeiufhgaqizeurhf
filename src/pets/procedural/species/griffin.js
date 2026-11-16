import { lerp } from '../../../utils/math.js';
import { griffinFace } from '../faces/griffinFace.js';
import { createDragonWings } from '../parts/wings.js';
import { createDogTail } from '../parts/tails.js';

/**
 * « Griffin » : ailes de dragon dans le dos + queue qui remue, regard perçant.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const griffinSpecies = {
  name: 'Griffin',
  face: griffinFace,

  buildParts(palette, body) {
    const wings = createDragonWings(palette, body);
    const tail = createDogTail(palette, body);
    let flapPhase = 0;

    return {
      objects: [wings.object3D, tail.object3D],

      animate({ dt, time, move, hop }) {
        // Battement d'ailes : doux au repos, plus ample en déplacement.
        flapPhase += dt * lerp(3.6, 11, move);
        const flap = 0.1 + Math.sin(flapPhase) * lerp(0.28, 0.55, move);
        for (const wing of wings.wings) wing.rotation.z = flap;

        tail.wag.rotation.z = Math.sin(time * 8) * 0.45;
        tail.object3D.rotation.x = -0.8 + hop * 0.1 * move;
      },
    };
  },
};
