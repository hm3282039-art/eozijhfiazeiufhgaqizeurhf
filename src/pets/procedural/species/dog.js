import { dogFace } from '../faces/dogFace.js';
import { createDogEars } from '../parts/ears.js';
import { createDogTail } from '../parts/tails.js';
import { createDogMuzzle } from '../parts/muzzles.js';
import { goldMaterial, glossyMaterial } from '../../../graphics/materials.js';
import { torusGeometry, sphereGeometry } from '../../../graphics/geometries.js';
import { partMesh, pivot } from '../parts/partUtils.js';

/**
 * « Dog / Corgi » : corps bas et allongé en longueur (1.05 × 0.9 × 1.45) — vrai museau
 * 3D ressortant avec truffe noire brillante et langue rose pendante, grosses oreilles
 * tombantes, collier avec médaille dorée, queue courte qui remue vite.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const dogSpecies = {
  name: 'Dog',
  body: { width: 1.05, height: 0.9, depth: 1.45, segments: 6, radius: 0.26 },
  face: dogFace,

  buildParts(palette, body) {
    const ears = createDogEars(palette, body);
    const tail = createDogTail(palette, body);
    const muzzle = createDogMuzzle(palette, body);

    // Collier autour du cou + médaille dorée.
    const collar = pivot('Collar');
    const collarMesh = partMesh(torusGeometry(0.4, 0.05, Math.PI * 2, 28, 8), glossyMaterial('#2f6df2', { roughness: 0.3 }), 'Collar');
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.rotation.z = 0.12;
    collarMesh.position.set(0, body.height * 0.45, body.depth * 0.42);
    collar.add(collarMesh);

    const medallion = partMesh(sphereGeometry(1, 16, 12), goldMaterial(), 'Medallion');
    medallion.scale.setScalar(0.12);
    medallion.position.set(0, body.height * 0.38, body.depth * 0.58);
    collar.add(medallion);

    return {
      objects: [ears.object3D, tail.object3D, muzzle.object3D, collar],

      animate({ time, move, hop }) {
        // Oreilles tombantes qui ondulent.
        for (const ear of ears.ears) {
          ear.rotation.z = ear.userData.restZ + Math.sin(time * 1.8 + ear.userData.side * 0.8) * 0.12;
        }

        // Queue courte qui remue vite (plus vite en déplacement).
        tail.wag.rotation.z = Math.sin(time * 12 * (0.6 + move)) * 0.5;

        // Langue rose qui remue un peu.
        muzzle.wag.rotation.z = Math.sin(time * 6) * 0.15;
      },
    };
  },
};
