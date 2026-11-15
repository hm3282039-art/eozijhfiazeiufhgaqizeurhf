import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createToyMaterial, toyMaterial } from '../../graphics/materials.js';
import { createFaceTextures } from './faces/createFaceTextures.js';
import { createPaws } from './parts/paws.js';
import { BODY, BODY_CENTER_Y, BODY_TOP_Y } from './petAnatomy.js';
import { SPECIES_BUILDERS } from './species/index.js';

/** Indice du groupe de matériaux « face avant (+Z) » d'une RoundedBoxGeometry. */
const FRONT_FACE = 4;

let bodyGeometry = null;

/** Le corps « guimauve carrée très adoucie », partagé par tous les pets procéduraux. */
function getBodyGeometry() {
  bodyGeometry ??= new RoundedBoxGeometry(BODY.width, BODY.height, BODY.depth, BODY.segments, BODY.radius);
  return bodyGeometry;
}

/**
 * Générateur procédural « style Blender » : construit un pet complet sans aucun fichier 3D.
 *
 *  1. corps        RoundedBoxGeometry(1.2, 1.1, 1.2, 6, 0.28)
 *  2. visage       texture <canvas> kawaii appliquée UNIQUEMENT sur la face avant
 *  3. accessoires  pattes arrondies + queue + éléments propres à l'espèce (oreilles, cornes, ailes…)
 *
 * @param {{ builder: string, palette: import('./species/index.js').PetPalette }} options
 * @returns {import('../Pet.js').PetVisual}
 */
export function buildProceduralPet({ builder, palette }) {
  const species = SPECIES_BUILDERS[builder];
  if (!species) throw new Error(`Espèce procédurale inconnue : « ${builder} »`);

  const root = new THREE.Group();
  root.name = `ProceduralPet(${builder})`;

  // ── 1 & 2. Corps + visage ────────────────────────────────────────────────
  const faceTextures = createFaceTextures(builder, species.face, palette);
  const skinMaterial = toyMaterial(palette.body);
  const faceMaterial = createToyMaterial({ map: faceTextures.open });

  const materials = new Array(6).fill(skinMaterial);
  materials[FRONT_FACE] = faceMaterial;

  const body = new THREE.Mesh(getBodyGeometry(), materials);
  body.name = 'Body';
  body.position.y = BODY_CENTER_Y;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // ── 3. Accessoires sculptés ──────────────────────────────────────────────
  root.add(createPaws(palette.secondary).object3D);

  const parts = species.buildParts(palette);
  root.add(...parts.objects);

  // Hauteur totale (oreilles et cornes comprises) : sert à placer l'étiquette.
  const height = new THREE.Box3().setFromObject(root).max.y;

  return {
    kind: 'procedural',
    object3D: root,
    height: Math.max(height, BODY_TOP_Y),
    portrait: faceTextures.open.image,
    update: (pose) => parts.animate(pose),
    setEyesClosed(closed) {
      faceMaterial.map = closed ? faceTextures.closed : faceTextures.open;
    },
    dispose() {
      // Géométries, textures et matériaux de couleur sont partagés : seul le matériau du visage est propre au pet.
      faceMaterial.dispose();
    },
  };
}
