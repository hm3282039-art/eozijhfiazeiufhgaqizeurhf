import * as THREE from 'three';
import { PET_VARIANTS_VISUAL, normalizeVariant } from '../config/variantConfig.js';
import { BlobShadow } from '../graphics/BlobShadow.js';
import { PetLabel } from './PetLabel.js';
import { loadPetModel } from './PetModelLoader.js';
import { buildProceduralPet } from './procedural/ProceduralPetBuilder.js';

/**
 * Représentation 3D d'un pet, quelle que soit son origine (fichier Blender ou générateur).
 *
 * @typedef {object} PetVisual
 * @property {'model' | 'procedural'} kind
 * @property {THREE.Object3D} object3D            origine au sol, avant = +Z
 * @property {number} height                      hauteur totale (pour placer l'étiquette)
 * @property {HTMLCanvasElement} [portrait]       dessin du visage (vignette du panneau « Pets »)
 * @property {(pose: import('./procedural/species/index.js').PartPose) => void} update
 * @property {(dt: number, time: number) => void} [updateVariant]  variantes doré / arc-en-ciel
 * @property {(closed: boolean) => void} [setEyesClosed]  clignement (pets procéduraux)
 * @property {() => void} dispose
 */

let nextId = 1;

/**
 * Un pet — classe HYBRIDE :
 *
 *  A. Modèle Blender : si `modelUrl` est fourni (ex : 'assets/models/cat.glb'),
 *     le fichier .glb est chargé avec GLTFLoader.
 *  B. Procédural : si `modelUrl` est `null`, ou si le fichier est introuvable / invalide,
 *     le pet est sculpté par le générateur procédural « style Blender ».
 *
 * Hiérarchie de `object3D` :
 *   object3D   ← position au sol + orientation (PetMovement)
 *   ├─ visualRoot ← saut, balancement, respiration (PetAnimator)
 *   │  └─ visual.object3D (modèle .glb OU pet procédural)
 *   ├─ ombre ronde (reste au sol)
 *   └─ étiquette (nom)
 */
export class Pet {
  /** Orientation autour de l'axe vertical (0 = regarde vers +Z). */
  yaw = 0;
  /** Vitesse horizontale mesurée (unités/s). */
  speed = 0;
  /** @type {PetVisual | null} */
  visual = null;

  #disposed = false;

  /**
   * @param {{
   *   species: { id: string, name: string, builder: string, modelUrl: string | null, modelRotationY?: number,
   *              palette: import('./procedural/species/index.js').PetPalette },
   *   name?: string,
   *   palette?: import('./procedural/species/index.js').PetPalette,
   *   modelUrl?: string | null,
   *   variant?: string,   'normal' | 'golden' | 'rainbow' | 'huge' (voir `config/variantConfig.js`)
   *   isTest?: boolean,
   * }} config
   */
  constructor({ species, name, palette, modelUrl, variant, isTest = false }) {
    this.id = nextId++;
    this.species = species;
    this.name = name ?? species.name;
    this.palette = palette ?? species.palette;
    this.modelUrl = modelUrl !== undefined ? modelUrl : species.modelUrl;
    this.variant = normalizeVariant(variant);
    /** Multiplicateur de dégâts lié à la variante (doré ×3, arc-en-ciel ×5, HUGE ×2). */
    this.damageMultiplier = PET_VARIANTS_VISUAL[this.variant].damageMultiplier;
    this.isTest = isTest;

    this.object3D = new THREE.Group();
    this.object3D.name = `Pet(${this.name})`;

    this.visualRoot = new THREE.Group();
    this.visualRoot.name = 'VisualRoot';
    this.object3D.add(this.visualRoot);

    this.shadow = new BlobShadow(0.78, 0.3);
    this.object3D.add(this.shadow.mesh);

    this.label = new PetLabel(this.name);
    this.object3D.add(this.label.sprite);

    /** Résolue quand le pet est prêt à être affiché (modèle chargé ou pet procédural construit). */
    this.ready = this.#createVisual();
  }

  get position() {
    return this.object3D.position;
  }

  /** `'model'` (fichier Blender) ou `'procedural'` — `null` tant que le pet charge. */
  get source() {
    return this.visual?.kind ?? null;
  }

  /** Anime la variante visuelle (couleurs arc-en-ciel, étincelles dorées…). */
  updateVariant(dt, time) {
    this.visual?.updateVariant?.(dt, time);
  }

  dispose() {
    this.#disposed = true;
    this.object3D.removeFromParent();
    this.visual?.dispose();
    this.shadow.dispose();
    this.label.dispose();
  }

  async #createVisual() {
    let visual = null;

    // A. Modèle Blender (.glb)
    if (this.modelUrl) {
      try {
        visual = await loadPetModel(this.modelUrl, { rotationY: this.species.modelRotationY ?? 0, variant: this.variant });
      } catch (error) {
        console.warn(
          `[Pet] Modèle « ${this.modelUrl} » introuvable ou invalide pour ${this.name} → générateur procédural.`,
          error?.message ?? error,
        );
      }
    }

    // B. Générateur procédural (par défaut, ou en secours)
    visual ??= buildProceduralPet({ builder: this.species.builder, palette: this.palette, variant: this.variant });

    if (this.#disposed) {
      visual.dispose();
      return this;
    }

    this.visual = visual;
    this.visualRoot.add(visual.object3D);
    this.label.setHeight(visual.height);
    return this;
  }
}
