import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createToyMaterial, glossyMaterial, goldMaterial } from '../../graphics/materials.js';
import { SparkleCloud } from '../../graphics/SparkleCloud.js';
import { createFaceTextures, paintFaceTexture } from './faces/createFaceTextures.js';
import { createPaws } from './parts/paws.js';
import { createCrown } from './parts/crown.js';
import { BODY, BODY_CENTER_Y, BODY_TOP_Y } from './petAnatomy.js';
import { SPECIES_BUILDERS } from './species/index.js';
import { PET_VARIANTS_VISUAL } from '../../config/variantConfig.js';

/** Indice du groupe de matériaux « face avant (+Z) » d'une RoundedBoxGeometry. */
const FRONT_FACE = 4;

/** Palette entièrement dorée (visage + accessoires des pets « Golden »). */
const GOLD_PALETTE = Object.freeze({
  body: '#ffc93c',
  secondary: '#ffe680',
  accent: '#ffd23f',
  cheek: '#ff9a9a',
  ink: '#262b47',
});

let bodyGeometry = null;

/** Le corps « guimauve carrée très adoucie », partagé par tous les pets procéduraux. */
function getBodyGeometry() {
  bodyGeometry ??= new RoundedBoxGeometry(BODY.width, BODY.height, BODY.depth, BODY.segments, BODY.radius);
  return bodyGeometry;
}

/**
 * Générateur procédural « style Blender » : construit un pet complet sans aucun fichier 3D.
 *
 *  1. corps        RoundedBoxGeometry(1.2, 1.1, 1.2, 6, 0.28) en matériau « Toy Glossy »
 *  2. visage       texture <canvas> kawaii appliquée UNIQUEMENT sur la face avant
 *  3. accessoires  pattes arrondies + queue + éléments propres à l'espèce (oreilles, cornes, ailes…)
 *
 * Variantes (`variant`) :
 *   golden  : tout en or brillant + étincelles jaunes
 *   rainbow : les couleurs cyclent sur le spectre arc-en-ciel (visage redessiné au fil des teintes)
 *   huge    : 2,5× plus gros avec une couronne dorée
 *
 * @param {{ builder: string, palette: import('./species/index.js').PetPalette, variant?: string }} options
 * @returns {import('../Pet.js').PetVisual}
 */
export function buildProceduralPet({ builder, palette, variant = 'normal' }) {
  const species = SPECIES_BUILDERS[builder];
  if (!species) throw new Error(`Espèce procédurale inconnue : « ${builder} »`);

  const isGolden = variant === 'golden';
  const isRainbow = variant === 'rainbow';
  const isHuge = variant === 'huge';
  const effectivePalette = isGolden ? GOLD_PALETTE : palette;

  const root = new THREE.Group();
  root.name = `ProceduralPet(${builder}${variant !== 'normal' ? `, ${variant}` : ''})`;

  // ── 1 & 2. Corps + visage ────────────────────────────────────────────────
  const faceTextures = createFaceTextures(builder, species.face, effectivePalette);
  const skinMaterial = isGolden ? goldMaterial() : glossyMaterial(effectivePalette.body);
  const faceMaterial = createToyMaterial({ map: faceTextures.open, roughness: 0.3, metalness: 0.05 });

  const materials = new Array(6).fill(skinMaterial);
  materials[FRONT_FACE] = faceMaterial;

  const body = new THREE.Mesh(getBodyGeometry(), materials);
  body.name = 'Body';
  body.position.y = BODY_CENTER_Y;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // ── 3. Accessoires sculptés ──────────────────────────────────────────────
  root.add(createPaws(effectivePalette.secondary).object3D);

  const parts = species.buildParts(effectivePalette);
  root.add(...parts.objects);

  // ── Variantes ────────────────────────────────────────────────────────────
  let sparkles = null;
  /** @type {{ material: THREE.Material, hue: number, saturation: number, lightness: number }[]} */
  const rainbowMaterials = [];
  let rainbowFace = null;

  // Traitement des matériaux d'un mesh : le corps est un mesh à matériaux multiples
  // (5 groupes « peau » + 1 groupe « visage »). On conserve toujours le visage
  // (son texture) et on transforme les autres matériaux selon la variante.
  const rainbowColor = new THREE.Color();
  const applyMaterials = (node, mode) => {
    if (!node.isMesh) return;
    const isArray = Array.isArray(node.material);
    const mats = isArray ? node.material : [node.material];
    const next = mats.map((m) => {
      if (m === faceMaterial) return m; // le visage garde sa texture
      if (mode === 'golden') return goldMaterial();
      if (mode === 'rainbow') {
        const clone = m.clone(); // matériau unique (les partagés ne doivent pas changer)
        const hsl = {};
        clone.color.getHSL(hsl);
        rainbowMaterials.push({ material: clone, hue: hsl.h, saturation: hsl.s, lightness: hsl.l });
        return clone;
      }
      return m;
    });
    node.material = isArray ? next : next[0];
  };

  if (isGolden) {
    // Tout passe en or brillant (le visage garde sa texture, dessinée aux couleurs dorées).
    root.traverse((node) => applyMaterials(node, 'golden'));
    sparkles = new SparkleCloud({ count: 16, radius: 0.85, height: 2.4, size: 0.2, colors: ['#ffd94d', '#fff3b0', '#ffb81f'] });
    sparkles.object3D.position.y = 0.2;
    root.add(sparkles.object3D);
  }

  if (isRainbow) {
    // Matériaux clonés (les matériaux partagés ne doivent pas changer de couleur pour les autres pets).
    root.traverse((node) => applyMaterials(node, 'rainbow'));
    rainbowFace = { open: faceTextures.open, closed: faceTextures.closed, lastPaint: -1, lastHue: -1 };
  }

  if (isHuge) {
    root.add(createCrown().object3D);
    root.scale.setScalar(PET_VARIANTS_VISUAL.huge.scale);
  }

  // Hauteur totale (oreilles, cornes et couronne comprises) : sert à placer l'étiquette.
  const height = new THREE.Box3().setFromObject(root).max.y;

  const applyRainbow = (hue, time) => {
    for (const entry of rainbowMaterials) {
      entry.material.color.setHSL((hue + entry.hue) % 1, entry.saturation, entry.lightness);
    }
    // Le fond du visage suit la teinte du corps : on redessine la texture (throttle ~8 fois/s).
    if (rainbowFace && Math.abs(hue - rainbowFace.lastHue) > 0.035 && time - rainbowFace.lastPaint > 0.12) {
      const eyesClosed = faceMaterial.map === rainbowFace.closed;
      rainbowFace.lastHue = hue;
      rainbowFace.lastPaint = time;
      rainbowColor.setHSL(hue, 0.82, 0.58);
      const rainbowPalette = { ...palette, body: `#${rainbowColor.getHexString()}` };
      const open = paintFaceTexture(species.face, rainbowPalette);
      const closed = paintFaceTexture(species.face, rainbowPalette, { width: 512, closed: true });
      rainbowFace.open.dispose();
      rainbowFace.closed.dispose();
      rainbowFace.open = open;
      rainbowFace.closed = closed;
      faceMaterial.map = eyesClosed ? closed : open;
      faceMaterial.needsUpdate = true;
    }
  };

  return {
    kind: 'procedural',
    object3D: root,
    height: Math.max(height, BODY_TOP_Y),
    portrait: faceTextures.open.image,
    update: (pose) => parts.animate(pose),
    updateVariant(dt, time) {
      if (sparkles) sparkles.update(dt, time);
      if (isRainbow) applyRainbow((time * 0.22) % 1, time);
    },
    setEyesClosed(closed) {
      faceMaterial.map = closed ? (rainbowFace?.closed ?? faceTextures.closed) : (rainbowFace?.open ?? faceTextures.open);
    },
    dispose() {
      // Géométries, textures et matériaux de couleur sont partagés : seul le matériau du visage est propre au pet.
      faceMaterial.dispose();
      if (rainbowFace) {
        rainbowFace.open.dispose();
        rainbowFace.closed.dispose();
      }
      for (const entry of rainbowMaterials) entry.material.dispose();
      sparkles?.dispose();
    },
  };
}
