import { axolotlFace } from '../faces/axolotlFace.js';
import { createAxolotlGills } from '../parts/fins.js';
import { createAxolotlTail } from '../parts/tails.js';

/**
 * « Axolotl » : branchies roses sur les côtés de la tête, queue nageoire douce.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const axolotlSpecies = {
  face: axolotlFace,

  buildParts(palette) {
    const gills = createAxolotlGills(palette);
    const tail = createAxolotlTail(palette);

    return {
      objects: [gills.object3D, tail.object3D],

      animate({ time, move, hop }) {
        // Les branchies frétillent et la queue ondule.
        gills.object3D.children.forEach((group, index) => {
          group.rotation.z = Math.sin(time * 5 + index * 1.5) * 0.12;
        });
        tail.object3D.rotation.y = Math.sin(time * 2.2) * 0.2;
        tail.object3D.rotation.x = Math.sin(time * 3) * 0.06 + hop * 0.1 * move;
      },
    };
  },
};
