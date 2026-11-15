import { dogFace } from '../faces/dogFace.js';
import { createDogEars } from '../parts/ears.js';
import { createDogTail } from '../parts/tails.js';

/**
 * « Happy Dog » : oreilles tombantes, museau, langue qui dépasse et queue qui remue.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const dogSpecies = {
  face: dogFace,

  buildParts(palette) {
    const ears = createDogEars(palette);
    const tail = createDogTail(palette);

    return {
      objects: [ears.object3D, tail.object3D],

      animate({ time, move, hop }) {
        // Un chien heureux remue la queue en permanence.
        tail.wag.rotation.z = Math.sin(time * 15) * 0.58;

        // Les oreilles se soulèvent à chaque saut puis retombent.
        for (const ear of ears.ears) {
          const { side, restZ } = ear.userData;
          ear.rotation.z = restZ + side * (hop * 0.75 * move + Math.sin(time * 2.1) * 0.025);
        }
      },
    };
  },
};
