import { bunnyFace } from '../faces/bunnyFace.js';
import { createBunnyEars } from '../parts/ears.js';
import { createBunnyTail } from '../parts/tails.js';

/**
 * « Bunny » : deux très longues oreilles verticales arrondies, petites dents blanches,
 * queue pompon ronde.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const bunnySpecies = {
  face: bunnyFace,

  buildParts(palette) {
    const ears = createBunnyEars(palette);
    const tail = createBunnyTail(palette);

    return {
      objects: [ears.object3D, tail.object3D],

      animate({ time, move, hop }) {
        // Les oreilles se penchent légèrement au rythme du saut.
        for (const ear of ears.ears) {
          const twitch = Math.max(0, Math.sin(time * 1.4 + ear.position.x * 4)) ** 8;
          ear.rotation.z = Math.sin(time * 0.9) * 0.08 + hop * 0.25 * move;
          ear.rotation.x = twitch * 0.08 - hop * 0.15 * move;
        }

        tail.object3D.rotation.z = Math.sin(time * 2.4) * 0.18;
      },
    };
  },
};
