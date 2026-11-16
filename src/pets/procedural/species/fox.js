import { foxFace } from '../faces/foxFace.js';
import { createFoxEars } from '../parts/ears.js';
import { createFoxTail } from '../parts/tails.js';

/**
 * « Fox » : oreilles pointues dressées, museau blanc, queue touffue qui balance.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const foxSpecies = {
  name: 'Fox',
  face: foxFace,

  buildParts(palette, body) {
    const ears = createFoxEars(palette, body);
    const tail = createFoxTail(palette, body);

    return {
      objects: [ears.object3D, tail.object3D],

      animate({ time, move, hop }) {
        // La queue balance doucement, plus vive en déplacement.
        tail.wag.rotation.z = Math.sin(time * 6) * 0.5;
        tail.wag.rotation.x = Math.sin(time * 3) * 0.08;

        for (const ear of ears.ears) {
          const twitch = Math.max(0, Math.sin(time * 1.1 + ear.position.x * 4)) ** 10;
          ear.rotation.z = ear.userData.restZ + twitch * 0.05 + hop * 0.2 * move;
        }
      },
    };
  },
};
