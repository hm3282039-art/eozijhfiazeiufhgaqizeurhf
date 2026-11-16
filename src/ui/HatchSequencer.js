import * as THREE from 'three';
import { eggGeometry } from '../graphics/geometries.js';
import { createToyMaterial, glowMaterial } from '../graphics/materials.js';
import { buildProceduralPet } from '../pets/procedural/ProceduralPetBuilder.js';
import { PET_SPECIES } from '../config/petSpecies.js';
import { getRarity } from '../config/rarityConfig.js';
import { createCanvas, fontStyle, drawOutlinedText } from '../graphics/canvas.js';

/** Durées (s) de chaque phase de l'éclosion. */
const PHASE = {
  darken: 0.4,
  shake: 2.2,
  explode: 0.7,
  reveal: 2.4,
};

/**
 * Séquenceur d'éclosion d'œuf : animation cinématique complète.
 *
 *  1. **darken**  : l'écran s'assombrit légèrement ;
 *  2. **shake**   : un œuf 3D apparaît devant la caméra, oscille/secoue de gauche à droite
 *                   en accélérant, avec des flashs lumineux ;
 *  3. **explode** : flash blanc + confettis (géré par `loot.explodeConfetti`);
 *  4. **reveal**  : le pet obtenu tourne devant l'écran avec un bandeau
 *                   Nom / Espèce / Rareté, puis est ajouté à l'inventaire.
 *
 * @param {{
 *   scene: THREE.Scene,
 *   camera: THREE.Camera,
 *   loot: { explodeConfetti: Function, burstLoot: Function },
 *   addPet: (config: object) => Promise<object>,
 *   toast: (message: string, options?: object) => void,
 * }} deps
 */
export class HatchSequencer {
  #scene;
  #camera;
  #loot;
  #addPet;
  #toast;

  #active = false;
  #phase = '';
  #elapsed = 0;
  #roll = null;
  #eggGroup = null;
  #petVisual = null;
  #flash = null;
  #overlay = null;
  #banner = null;
  #confettiTimer = 0;
  #petAdded = false;

  constructor({ scene, camera, loot, addPet, toast }) {
    this.#scene = scene;
    this.#camera = camera;
    this.#loot = loot;
    this.#addPet = addPet;
    this.#toast = toast;
  }

  get isActive() {
    return this.#active;
  }

  /**
   * Lance l'éclosion d'un œuf.
   * @param {object} eggDef définition dans `config/eggCatalog.js`
   * @param {{ species: string, rarity: string }} roll tirage du pet
   */
  start(eggDef, roll) {
    if (this.#active) return;
    this.#active = true;
    this.#roll = { ...roll, eggDef };
    this.#elapsed = 0;
    this.#phase = 'darken';
    this.#petAdded = false;

    this.#createOverlay();
    this.#createEgg();
  }

  /** Annule la séquence (nettoyage). */
  cancel() {
    this.#cleanup();
    this.#active = false;
  }

  /** Appelé à chaque frame pendant l'éclosion. @param {number} dt */
  update(dt) {
    if (!this.#active) return;
    this.#elapsed += dt;

    switch (this.#phase) {
      case 'darken':
        this.#updateDarken(dt);
        break;
      case 'shake':
        this.#updateShake(dt);
        break;
      case 'explode':
        this.#updateExplode(dt);
        break;
      case 'reveal':
        this.#updateReveal(dt);
        break;
      default:
        break;
    }
  }

  // ── Phase 1 : assombrir l'écran ───────────────────────────────────────────
  #updateDarken(dt) {
    if (this.#overlay) this.#overlay.style.opacity = String(Math.min(1, this.#elapsed / PHASE.darken) * 0.55);
    if (this.#elapsed >= PHASE.darken) {
      this.#phase = 'shake';
      this.#elapsed = 0;
      this.#showEgg();
    }
  }

  // ── Phase 2 : œuf qui secoue et accélére ───────────────────────────────────
  #updateShake(dt) {
    const t = this.#elapsed;
    // Accélération progressive : amplitude et fréquence croissent.
    const progress = Math.min(1, t / PHASE.shake);
    const amplitude = 0.15 + progress * 0.55;
    const freq = 6 + progress * 14;
    const shake = Math.sin(t * freq) * amplitude;
    const tilt = Math.cos(t * freq * 0.8) * amplitude * 0.4;

    if (this.#eggGroup) {
      this.#eggGroup.position.x = shake;
      this.#eggGroup.rotation.z = tilt;
    }

    // Flashs lumineux : plus intenses vers la fin.
    const flashIntensity = Math.pow(progress, 2) * (0.6 + 0.4 * Math.abs(Math.sin(t * freq * 0.5)));
    if (this.#flash) {
      this.#flash.material.opacity = flashIntensity;
      this.#flash.scale.setScalar(1 + flashIntensity * 0.5);
    }

    // Petites étincelles au gré des secousses.
    if (Math.random() < progress * 0.5 && this.#loot?.explodeConfetti) {
      const pos = this.#eggWorldPos();
      this.#loot.explodeConfetti(pos, ['#ffffff', eggDef?.colors?.[1] ?? '#fff3b0', '#ffffff']);
    }

    if (this.#elapsed >= PHASE.shake) {
      this.#phase = 'explode';
      this.#elapsed = 0;
    }
  }

  // ── Phase 3 : explosion blanche + confettis ───────────────────────────────
  #updateExplode(dt) {
    if (this.#flash) {
      this.#flash.material.opacity = Math.max(0, 1 - this.#elapsed / PHASE.explode);
      this.#flash.scale.setScalar(2.5 - this.#elapsed / PHASE.explode);
    }
    // Confettis jaillis.
    this.#confettiTimer -= dt;
    if (this.#confettiTimer <= 0 && this.#loot?.explodeConfetti) {
      this.#confettiTimer = 0.08;
      const pos = this.#eggWorldPos();
      this.#loot.explodeConfetti(pos, ['#ffffff', '#ffd94d', '#ff5a7a', '#7cb8ff', '#a45cff']);
    }

    // Déplace l'œuf hors du champ et prépare le pet.
    if (this.#eggGroup) this.#eggGroup.visible = false;

    if (this.#elapsed >= PHASE.explode) {
      this.#phase = 'reveal';
      this.#elapsed = 0;
      this.#revealPet();
    }
  }

  // ── Phase 4 : révélation du pet + bandeau ─────────────────────────────────
  #updateReveal(dt) {
    if (this.#petVisual) {
      // Le pet tourne devant la caméra.
      this.#petVisual.object3D.rotation.y += dt * 2.4;
      const bob = Math.sin(this.#elapsed * 3) * 0.12;
      this.#petVisual.object3D.position.y = 1.2 + bob;
      this.#petVisual.update?.({ dt, time: this.#elapsed, move: 0, hop: 0 });
      this.#petVisual.updateVariant?.(dt, this.#elapsed);
    }

    if (this.#banner) {
      const fadeIn = Math.min(1, this.#elapsed / 0.3);
      const fadeOut = this.#elapsed > PHASE.reveal - 0.5 ? Math.max(0, (PHASE.reveal - this.#elapsed) / 0.5) : 1;
      this.#banner.style.opacity = String(fadeIn * fadeOut);
    }

    // Ajoute le pet à l'équipe au milieu de la phase (il apparaît déjà en tournoiement).
    if (!this.#petAdded) {
      this.#petAdded = true;
      this.#finish();
    }

    if (this.#elapsed >= PHASE.reveal) {
      this.#cleanup();
      this.#active = false;
    }
  }

  // ── Création des éléments ─────────────────────────────────────────────────
  #createOverlay() {
    this.#overlay = document.createElement('div');
    this.#overlay.className = 'hatch-overlay';
    this.#overlay.style.opacity = '0';
    document.body.appendChild(this.#overlay);
  }

  #createEgg() {
    const group = new THREE.Group();
    group.name = 'HatchEgg';

    const egg = new THREE.Mesh(
      eggGeometry(1.0, 2.2),
      createToyMaterial({ color: this.#roll.eggDef.colors[0], roughness: 0.3 }),
    );
    egg.castShadow = false;
    group.add(egg);

    // Flash blanc (plan ajouté au groupe pour l'éclairage).
    const flashGeometry = new THREE.PlaneGeometry(4, 4);
    this.#flash = new THREE.Mesh(
      flashGeometry,
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.#flash.position.z = 0.5;
    group.add(this.#flash);

    this.#eggGroup = group;
    this.#scene.add(group);
  }

  #showEgg() {
    // Positionne l'œuf devant la caméra, tourné vers le joueur.
    const cam = this.#camera;
    cam.updateMatrixWorld();
    const offset = new THREE.Vector3(0, 0.6, -3.2).applyQuaternion(cam.quaternion);
    this.#eggGroup.position.copy(cam.position).add(offset);
    this.#eggGroup.rotation.set(0, Math.PI, 0);
    this.#eggGroup.visible = true;
  }

  #eggWorldPos() {
    if (!this.#eggGroup) return new THREE.Vector3();
    const vec = new THREE.Vector3();
    this.#eggGroup.getWorldPosition(vec);
    return vec;
  }

  #revealPet() {
    // Crée le pet procédural temporaire (tournoiement).
    const species = PET_SPECIES[this.#roll.species];
    this.#petVisual = buildProceduralPet({
      builder: species.builder,
      palette: species.palette,
      variant: 'normal',
      rarity: this.#roll.rarity,
    });
    this.#scene.add(this.#petVisual.object3D);

    // Position devant la caméra.
    const cam = this.#camera;
    cam.updateMatrixWorld();
    const offset = new THREE.Vector3(0, 1.2, -3.5).applyQuaternion(cam.quaternion);
    this.#petVisual.object3D.position.copy(cam.position).add(offset);

    // Crée le bandeau (DOM) Nom / Espèce / Rareté.
    this.#createBanner();
  }

  #createBanner() {
    const rarity = getRarity(this.#roll.rarity);
    const species = PET_SPECIES[this.#roll.species];
    const canvas = createCanvas(640, 260);
    const { ctx } = canvas;

    ctx.clearRect(0, 0, 640, 260);
    // Fond translucide.
    ctx.fillStyle = 'rgba(20, 24, 45, 0.82)';
    this.#roundRect(ctx, 20, 20, 600, 220, 40);
    ctx.fill();
    ctx.strokeStyle = rarity.color;
    ctx.lineWidth = 8;
    ctx.stroke();

    // Titre « 🎊 Éclosion ! »
    ctx.textAlign = 'center';
    ctx.font = fontStyle(700, 52);
    drawOutlinedText(ctx, '🎊 Éclosion ! 🎊', 320, 70, { fill: '#fff', stroke: '#1d2140', lineWidth: 10 });

    // Nom du pet.
    ctx.font = fontStyle(700, 46);
    drawOutlinedText(ctx, species.name, 320, 130, { fill: '#fff', stroke: '#1d2140', lineWidth: 9 });

    // Rareté (couleur).
    ctx.font = fontStyle(700, 40);
    ctx.fillStyle = rarity.color;
    drawOutlinedText(ctx, `★ ${rarity.label} ★`, 320, 190, { fill: rarity.color, stroke: '#1d2140', lineWidth: 8 });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
    );
    sprite.scale.set(4.5, 1.84, 1);

    const cam = this.#camera;
    const offset = new THREE.Vector3(0, 3.4, -3.5).applyQuaternion(cam.quaternion);
    sprite.position.copy(cam.position).add(offset);
    this.#scene.add(sprite);
    this.#banner = sprite;
    this.#banner.material.map = texture;
  }

  #roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ── Finalisation : ajout du pet à l'équipe ────────────────────────────────
  #finish() {
    const roll = this.#roll;
    // Le pet est déjà affiché en tournoiement : on l'ajoute à l'équipe (sans re-pop).
    this.#addPet({ species: roll.species, rarity: roll.rarity, name: PET_SPECIES[roll.species].name })
      .then((pet) => {
        if (pet) {
          this.#toast?.(`🎊 ${pet.name} (${getRarity(roll.rarity).label}) éclos !`, { variant: 'success', icon: '🥚' });
        }
      })
      .catch((error) => console.warn('[Hatch] Ajout du pet échoué :', error?.message ?? error));
  }

  // ── Nettoyage ──────────────────────────────────────────────────────────────
  #cleanup() {
    this.#scene.remove(this.#eggGroup);
    this.#eggGroup?.traverse((node) => {
      if (node.isMesh) {
        node.geometry?.dispose();
        if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
        else node.material?.dispose();
      }
    });
    this.#eggGroup = null;

    if (this.#petVisual) {
      // Le pet réel est ajouté à l'équipe : on retire seulement la version tournoyante.
      this.#scene.remove(this.#petVisual.object3D);
      this.#petVisual.dispose();
      this.#petVisual = null;
    }

    if (this.#banner) {
      this.#scene.remove(this.#banner);
      this.#banner.material.map?.dispose();
      this.#banner.material.dispose();
      this.#banner = null;
    }

    if (this.#overlay) {
      this.#overlay.remove();
      this.#overlay = null;
    }
    this.#flash = null;
    this.#confettiTimer = 0;
  }
}
