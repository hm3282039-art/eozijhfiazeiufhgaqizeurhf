import * as THREE from 'three';
import { GAME_CONFIG } from '../../config/gameConfig.js';
import { RARITIES } from '../../config/rarityConfig.js';
import { roundedBoxGeometry } from '../../graphics/geometries.js';
import { toyMaterial } from '../../graphics/materials.js';
import { SparkleCloud } from '../../graphics/SparkleCloud.js';
import { createFaceTextures, repaintFaceTexture } from './faces/createFaceTextures.js';
import { bodyLayout, DEFAULT_BODY } from './petAnatomy.js';
import { SPECIES_BUILDERS } from './species/index.js';
import { createCrown } from './parts/crown.js';
import { createAuraRing, createGoldenShoulders, createHalo } from './parts/muzzles.js';
import { createPaws } from './parts/paws.js';

const FRONT_FACE = 4;

/** Toutes les géométries et textures sont créées une seule fois au démarrage et partagées. */
const geometryCache = new Map();

function getBodyGeometry(body) {
  const key = `${body.width}x${body.height}x${body.depth}|${body.segments}|${body.radius}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, roundedBoxGeometry(body.width, body.height, body.depth, body.segments, body.radius));
  }
  return geometryCache.get(key);
}

const rainbowPalettes = new WeakMap();

/**
 * Construit un pet procédural entier : corps, visage, pattes, accessoires d'espèce,
 * variantes de couleur, aura de rareté et couronne des espèces « spéciales ».
 *
 * `builder` expose la description de l'espèce :
 * - `body` : dimensions du corps (proportions propres à l'espèce)
 * - `face` : peintre du visage (canvas 2D, coordonnées normalisées FACE)
 * - `buildParts(palette)` : accessoires 3D + leur animation
 *
 * Aucun objet géométrie ou texture n'est recréé dans la boucle de rendu :
 * les textures Rainbow sont REPEINTES sur un canvas déjà alloué, et l'aura tourne
 * en transformant les Meshes.
 *
 * @returns {import('../Pet.js').PetModel}
 */
export function buildProceduralPet({ builder, palette, variant = 'normal', rarity = 'common' }) {
  // `builder` peut être l'identifiant d'espèce (`'cat'`…) ou un objet builder déjà résolu.
  const speciesBuilder = typeof builder === 'string' ? (SPECIES_BUILDERS[builder] ?? builder) : builder;
  const layout = bodyLayout(speciesBuilder.body);
  const root = new THREE.Group();
  root.name = `ProceduralPet:${speciesBuilder.name}`;

  const body = layout.body;
  const bodyGeometry = getBodyGeometry(body);
  const materials = new Array(6).fill(toyMaterial(palette.body));
  const faceMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.45,
    metalness: 0.04,
    transparent: true,
  });
  materials[FRONT_FACE] = faceMaterial;
  const bodyMesh = new THREE.Mesh(bodyGeometry, materials);
  bodyMesh.position.y = layout.centerY;
  bodyMesh.castShadow = false;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Textures du visage (cache par espèce + palette + proportions).
  const textures = createFaceTextures(speciesBuilder.name, speciesBuilder.face, palette, body);
  faceMaterial.map = textures.open;
  faceMaterial.needsUpdate = true;

  // Pattes (adaptées aux proportions du corps).
  const { object3D: pawsGroup } = createPaws(palette.secondary, body);
  root.add(pawsGroup);

  // Accessoires de l'espèce (oreilles, ailes, queue, museau…).
  const parts = speciesBuilder.buildParts(palette, body);
  for (const object3D of parts.objects) {
    if (object3D) root.add(object3D);
  }

  // —— Variantes de couleur : peinture par « composite », toujours réutilisable. ——
  const variantPalette = variant !== 'normal' ? createVariantPalette(palette, variant) : palette;
  if (variant === 'rainbow') {
    rainbowPalettes.set(palette, variantPalette);
    // Repeint la texture de face existante (pas de nouvelle texture) et applique
    // un matériau translucide pour l'effet iridescent.
    repaintFaceTexture(textures.open, speciesBuilder.face, variantPalette, { body });
    faceMaterial.transparent = true;
    faceMaterial.opacity = 0.92;
  }
  applyMaterials(root, variant);

  // —— Aura de rareté + couronne des espèces spéciales. ——
  const isSpecial = RARITIES[rarity]?.special === true;
  const auraRadius = Math.max(layout.width, layout.depth) * 1.3;
  const aura = RARITIES[rarity]?.aura === true
    ? new SparkleCloud(variant === 'rainbow' ? '#ffd86b' : RARITIES[rarity].aura, 16, auraRadius, 0.45, 0.85)
    : null;
  if (aura) root.add(aura.object3D);

  let crown = null;
  if (isSpecial) {
    const special = speciesBuilder.special ?? {};
    const decoration = createCrown(body);
    crown = special.halo ? decoration.object3D : decoration.object3D;
    root.add(crown);
    if (special.shoulders) root.add(createGoldenShoulders(body).object3D);
    if (special.halo) {
      const halo = createHalo(body);
      root.add(halo.object3D);
      root.userData.halo = halo;
    }
    root.userData.auraRing = createAuraRing(body).object3D;
    root.add(root.userData.auraRing);
    root.userData.crown = crown;
    root.scale.setScalar(RARITIES[rarity].scale);
  }

  const petModel = {
    kind: 'procedural',
    object3D: root,
    height: layout.topY,
    portrait: textures.open.image ?? null,

    update(pose = {}) {
      parts.animate?.({
        dt: pose.dt ?? 0.016,
        time: pose.time ?? 0,
        move: pose.move ?? 0,
        hop: pose.hop ?? 0,
      });

      // Aura géante : cercle tournant + éclats tournants (transform, pas de recréation).
      if (root.userData.auraRing) root.userData.auraRing.rotation.z += 0.045;
      if (aura) {
        aura.object3D.position.y = layout.centerY;
        aura.object3D.rotation.y += 0.22;
        aura.update(0.016, pose.time ?? 0);
      }
      if (root.userData.crown) {
        root.userData.crown.children.forEach((child, index) => {
          child.rotation.z = Math.sin(pose.time ?? 0 + index * 0.8) * 0.12;
        });
      }
    },

    updateVariant(dt, time) {
      if (variant !== 'rainbow') return;
      // Effet Rainbow : teinte qui tourne, repeinture du canvas existant (pas de création).
      variantPalette.accent = `hsl(${(time * 45) % 360}, 90%, 60%)`;
      repaintFaceTexture(textures.open, speciesBuilder.face, variantPalette, { body });
    },

    setEyesClosed(closed) {
      faceMaterial.map = closed ? textures.closed : textures.open;
      faceMaterial.needsUpdate = true;
    },

    dispose() {
      if (aura) aura.dispose();
    },
  };

  return petModel;
}

/** Palette de variante : on ne copie pas l'objet, on crée une palette équivalente. */
function createVariantPalette(palette, variant) {
  if (variant === 'golden') {
    return { ...palette, body: '#f7c948', secondary: '#f2b73c', accent: '#fbe98c', ink: '#3a2700' };
  }
  if (variant === 'shiny') {
    return { ...palette, body: '#5fc3b4', secondary: '#3fa896', accent: '#bff0e6', ink: '#0b2622' };
  }
  // rainbow : teinte initiale, recalculée par updateVariant.
  return { ...palette, body: '#ff5fa2', secondary: '#f24b8f', accent: '#ff86c4', ink: '#2a0a1a' };
}

/**
 * Applique un filtrage uniforme à tous les matériaux d'un pet :
 * les matériaux sont clonés une fois (pas en boucle) et ne sont pas partagés.
 * Le corps utilise un TABLEAU de 6 matériaux (faces du RoundedBox) : on clone chaque élément.
 */
function applyMaterials(node, mode) {
  const apply = (material) => {
    material.emissive = new THREE.Color(material.emissive?.getHex?.() ?? '#000000');
    if (mode === 'golden') {
      material.emissive = new THREE.Color('#5c3d00');
      material.emissiveIntensity = 0.45;
      material.roughness = 0.25;
    } else if (mode === 'shiny') {
      material.roughness = 0.12;
      material.metalness = 0.85;
      material.emissiveIntensity = 0.2;
    } else if (mode === 'rainbow') {
      material.emissive = new THREE.Color('#0b1a26');
      material.emissiveIntensity = 0.45;
      material.roughness = 0.22;
      material.metalness = 0.55;
    }
  };
  node.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => {
        const clone = material.clone();
        apply(clone);
        return clone;
      });
    } else {
      const clone = child.material.clone();
      apply(clone);
      child.material = clone;
    }
  });
}

export { geometryCache };
