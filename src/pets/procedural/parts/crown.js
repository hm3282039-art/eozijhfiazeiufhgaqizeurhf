import { goldMaterial, glossyMaterial } from '../../../graphics/materials.js';
import { cylinderGeometry, sphereGeometry, softConeGeometry } from '../../../graphics/geometries.js';
import { bodyLayout, DEFAULT_BODY } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

const SPIKE_COUNT = 5;

/**
 * Couronne dorée des pets « HUGE / TITANIC / GARGANTUAN » : bandeau doré, pointes
 * et gemme rouge, posée sur le sommet du corps.
 * @param {object} [body] dimensions du corps
 */
export function createCrown(body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const crown = pivot('Crown', 0, layout.topY + 0.02, 0);
  const gold = goldMaterial();

  const band = partMesh(cylinderGeometry(0.36, 0.4, 0.24, 18), gold, 'CrownBand');
  band.position.y = 0.12;
  crown.add(band);

  const spikeGeometry = softConeGeometry(0.09, 0.3, 0.05, 10);
  for (let i = 0; i < SPIKE_COUNT; i++) {
    const angle = (i / SPIKE_COUNT) * Math.PI * 2;
    const spike = partMesh(spikeGeometry, gold, 'CrownSpike');
    spike.position.set(Math.cos(angle) * 0.3, 0.24, Math.sin(angle) * 0.3);
    crown.add(spike);
  }

  const gem = partMesh(sphereGeometry(1, 14, 10), glossyMaterial('#ff2e63', { emissive: '#a01030', emissiveIntensity: 0.5 }), 'CrownGem');
  gem.scale.setScalar(0.11);
  gem.position.set(0, 0.14, 0.4);
  crown.add(gem);

  return { object3D: crown };
}
