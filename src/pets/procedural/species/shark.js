import { sharkFace } from '../faces/sharkFace.js';
import { createSharkFin } from '../parts/fins.js';
import { createAxolotlTail } from '../parts/tails.js';

/**
 * « Shark » : aileron dorsale sur le dos, dents, queue en nageoire.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const sharkSpecies = {
  face: sharkFace,

  buildParts(palette) {
    const fin = createSharkFin(palette);
    const tail = createAxolotlTail(palette);

    return {
      objects: [fin.object3D, tail.object3D],

      animate({ time, move, hop }) {
        fin.object3D.rotation.x = -0.18 + Math.sin(time * 2.4) * 0.05;
        tail.object3D.rotation.y = Math.sin(time * 2.6) * 0.24;
        tail.object3D.rotation.x = Math.sin(time * 3.2) * 0.07 + hop * 0.1 * move;
      },
    };
  },
};
