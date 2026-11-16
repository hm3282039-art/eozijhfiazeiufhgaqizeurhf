import { axolotlFace } from '../faces/axolotlFace.js';
import { createAxolotlGills } from '../parts/fins.js';
import { createAxolotlTail } from '../parts/tails.js';
import { createBunnyMuzzle } from '../parts/muzzles.js';

/**
 * « Axolotl » : corps doux et cylindrique — 6 GRANDES branchies externes roses en
 * éventail (3 de chaque côté de la tête), nageoire caudale translucide.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const axolotlSpecies = {
  name: 'Axolotl',
  body: { width: 0.9, height: 0.75, depth: 1.3, segments: 6, radius: 0.3 },
  face: axolotlFace,

  buildParts(palette, body) {
    const gills = createAxolotlGills(palette, body);
    const tail = createAxolotlTail(palette, body);
    const muzzle = createBunnyMuzzle(palette, body);

    return {
      objects: [gills.object3D, tail.object3D, muzzle.object3D],

      animate({ time, move, hop }) {
        // Les 6 branchies frétillent indépendamment.
        gills.gillGroups.forEach((gillGroup, groupIndex) => {
          gillGroup.children.forEach((gill, index) => {
            gill.rotation.z = Math.sin(time * 5 + groupIndex * 1.5 + index * 1.2) * 0.12;
          });
        });

        tail.object3D.rotation.y = Math.sin(time * 2.2) * 0.2;
        tail.object3D.rotation.x = Math.sin(time * 3) * 0.06 + hop * 0.1 * move;
      },
    };
  },
};
