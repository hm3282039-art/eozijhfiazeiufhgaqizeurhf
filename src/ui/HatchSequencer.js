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
  explode: 0.85,
  reveal: 2.4,
};

/**
 * Séquenceur d'éclosion d'œuf : animation cinématique complète.
 *
 *  1. **darken**  : l'écran s'assombrit légèrement ;
 *  2. **shake**   : un œuf 3D apparaît devant la caméra. Il s'illumine de l'intérieur
 *                   (halo qui pulse + lumière interne), se fissure (éclats de coquille)
 *                   et secoue de plus en plus fort ;
 *  3. **explode** : **les deux coquilles s'ouvrent** (séparation + rotation), flash
 *                   blanc + confettis ; le pet jaillit entre les coquilles ;
 *  4. **reveal**  : le pet s'élève en tournoiement avec un halo, bandeau
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
  #shellTop = null;
  #shellBottom = null;
  #halo = null;
  #flash = null;
  #eggLight = null;
  #petVisual = null;
  #petHalo = null;
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

  // ── Phase 2 : œuf qui s'illumine, se fissure et secoue ─────────────────────
  #updateShake(dt) {
    const t = this.#elapsed;
    const progress = Math.min(1, t / PHASE.shake);

    // Accélération progressive : amplitude et fréquence croissent.
    const amplitude = 0.12 + progress * 0.5;
    const freq = 6 + progress * 14;
    const shake = Math.sin(t * freq) * amplitude;
    const tilt = Math.cos(t * freq * 0.8) * amplitude * 0.4;

    if (this.#eggGroup) {
      this.#eggGroup.position.x = shake;
      this.#eggGroup.rotation.z = tilt;
    }

    // Halo qui pulse : l'œuf s'illumine de l'intérieur vers la fin.
    if (this.#halo) {
      const glow = Math.pow(progress, 1.5);
      this.#halo.scale.setScalar(1 + glow * 0.9);
      this.#halo.material.opacity = 0.25 + glow * 0.55;
    }
    if (this.#eggLight) {
      this.#eggLight.intensity = Math.pow(progress, 1.5) * 2.4;
    }

    // Flashs lumineux : plus intenses vers la fin.
    const flashIntensity = Math.pow(progress, 2) * (0.5 + 0.5 * Math.abs(Math.sin(t * freq * 0.5)));
    if (this.#flash) {
      this.#flash.material.opacity = flashIntensity * 0.6;
      this.#flash.scale.setScalar(1 + flashIntensity * 0.4);
    }

    // Éclats de coquille et étincelles au gré des secousses.
    if (Math.random() < progress * 0.6 && this.#loot?.explodeConfetti) {
      const pos = this.#eggWorldPos();
      const colors = [this.#roll.eggDef.colors[0], this.#roll.eggDef.colors[1], '#ffffff'];
      this.#loot.explodeConfetti(pos, colors);
    }

    if (this.#elapsed >= PHASE.shake) {
      this.#phase = 'explode';
      this.#elapsed = 0;
    }
  }

  // ── Phase 3 : ouverture des coquilles + explosion ─────────────────────────
  #updateExplode(dt) {
    const t = this.#elapsed;
    const progress = Math.min(1, t / PHASE.explode);

    // Les deux coquilles s'ouvrent : écart vertical + rotation.
    if (this.#shellTop) {
      this.#shellTop.position.y = progress * 1.6;
      this.#shellTop.rotation.z = progress * 0.7;
      this.#shellTop.rotation.y = progress * 0.8;
      this.#shellTop.material.opacity = 1 - progress * 0.35;
    }
    if (this.#shellBottom) {
      this.#shellBottom.position.y = -progress * 1.4;
      this.#shellBottom.rotation.z = -progress * 0.6;
      this.#shellBottom.rotation.y = -progress * 0.8;
      this.#shellBottom.material.opacity = 1 - progress * 0.35;
    }
    if (this.#halo) {
      this.#halo.material.opacity = Math.max(0, 0.9 - progress * 0.9);
      this.#halo.scale.setScalar(1.4 + progress * 1.2);
    }
    if (this.#eggLight) {
      this.#eggLight.intensity = Math.max(0, 2.4 - progress * 2.4);
    }

    // Flash blanc qui décroît.
    if (this.#flash) {
      this.#flash.material.opacity = Math.max(0, 1 - progress);
      this.#flash.scale.setScalar(2.5 - progress * 1.5);
    }

    // Confettis jaillis.
    this.#confettiTimer -= dt;
    if (this.#confettiTimer <= 0 && this.#loot?.explodeConfetti) {
      this.#confettiTimer = 0.08;
      const pos = this.#eggWorldPos();
      this.#loot.explodeConfetti(pos, ['#ffffff', '#ffd94d', '#ff5a7a', '#7cb8ff', '#a45cff']);
    }

    if (this.#elapsed >= PHASE.explode) {
      this.#phase = 'reveal';
      this.#elapsed = 0;
      this.#revealPet();
    }
  }

  // ── Phase 4 : révélation du pet + bandeau ─────────────────────────────────
  #updateReveal(dt) {
    if (this.#petVisual) {
      // Le pet tourne et s'élève devant la caméra.
      this.#petVisual.object3D.rotation.y += dt * 2.4;
      const rise = Math.min(1, this.#elapsed / 0.6);
      const bob = Math.sin(this.#elapsed * 3) * 0.12;
      this.#petVisual.object3D.position.y = 1.2 - 0.4 + rise * 0.4 + bob;
      this.#petVisual.update?.({ dt, time: this.#elapsed, move: 0, hop: 0 });
      this.#petVisual.updateVariant?.(dt, this.#elapsed);
    }
    if (this.#petHalo) {
      const pulse = 1 + Math.sin(this.#elapsed * 4) * 0.08;
      this.#petHalo.scale.setScalar(pulse);
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

  /**
   * Crée l'œuf en **deux coquilles** (supérieure / inférieure) qui s'ouvriront à
   * l'explosion. Chaque coquille utilise une texture à dégradé d'opacité pour
   * faire une « coupe » nette au milieu (l'œuf fermé = les deux superposées).
   */
  #createEgg() {
    const group = new THREE.Group();
    group.name = 'HatchEgg';

    const color = this.#roll.eggDef.colors[0];
    this.#shellTop = new THREE.Mesh(eggGeometry(1.0, 2.2), this.#shellMaterial(color, true));
    this.#shellBottom = new THREE.Mesh(eggGeometry(1.0, 2.2), this.#shellMaterial(color, false));
    this.#shellTop.castShadow = false;
    this.#shellBottom.castShadow = false;
    group.add(this.#shellTop);
    group.add(this.#shellBottom);

    // Halo lumineux autour de l'œuf (visible quand il s'illumine de l'intérieur).
    this.#halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 24, 18),
      new THREE.MeshBasicMaterial({
        color: '#fff3b0',
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(this.#halo);

    // Lumière interne : l'œuf s'illumine avant l'ouverture.
    this.#eggLight = new THREE.PointLight('#ffd966', 0, 9, 2);
    group.add(this.#eggLight);

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

  /**
   * Matériau d'une coquille : texture canvas à dégradé vertical d'opacité.
   * `isTop` vrai → opaque en haut, transparent en bas ; faux → l'inverse.
   */
  #shellMaterial(color, isTop) {
    const { canvas, ctx } = createCanvas(128, 256);
    const { r, g, b } = new THREE.Color(color);
    const rgb = `${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)}`;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    if (isTop) {
      gradient.addColorStop(0, `rgba(${rgb},1)`);
      gradient.addColorStop(1, `rgba(${rgb},0)`);
    } else {
      gradient.addColorStop(0, `rgba(${rgb},0)`);
      gradient.addColorStop(1, `rgba(${rgb},1)`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
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

    // Halo autour du pet révélé (légère aura dorée).
    this.#petHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 20, 14),
      new THREE.MeshBasicMaterial({
        color: '#ffe9a8',
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.#petVisual.object3D.add(this.#petHalo);

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
    this.#shellTop = null;
    this.#shellBottom = null;
    this.#halo = null;
    this.#flash = null;
    this.#eggLight = null;

    if (this.#petVisual) {
      // Le pet réel est ajouté à l'équipe : on retire seulement la version tournoyante.
      this.#scene.remove(this.#petVisual.object3D);
      this.#petVisual.dispose();
      this.#petVisual = null;
      this.#petHalo = null;
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
    this.#confettiTimer = 0;
  }
}
