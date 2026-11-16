import * as THREE from 'three';
import { BREAKABLE_TYPES } from '../../../config/breakableConfig.js';
import { GAME_CONFIG } from '../../../config/gameConfig.js';
import { PALETTE } from '../../../config/palette.js';
import { BlobShadow } from '../../../graphics/BlobShadow.js';
import { createCanvas } from '../../../graphics/canvas.js';
import { mergeStaticMeshes } from '../../../graphics/mergeMeshes.js';
import { cylinderGeometry, roundedBoxGeometry, sphereGeometry } from '../../../graphics/geometries.js';
import { createCrown } from '../../../pets/procedural/parts/crown.js';
import { createRng } from '../../../utils/random.js';

const WHITE = new THREE.Color('#ffffff');

/** Matériau « Toy Glossy » propre à ce Breakable (le flash blanc ne doit pas toucher les autres). */
function glossy(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.1, ...options });
}

/** Or brillant propre à ce Breakable. */
function gold(options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: PALETTE.breakable.gold,
    metalness: 0.55,
    roughness: 0.24,
    clearcoat: 0.85,
    clearcoatRoughness: 0.22,
    emissive: '#6a4200',
    emissiveIntensity: 0.22,
    ...options,
  });
}

function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Tas de pièces dorées : pièces empilées en pyramide + quelques-unes éparpillées. */
function buildCoinPile() {
  const rng = createRng(42);
  const group = new THREE.Group();
  group.name = 'CoinPile';
  const coinGeometry = cylinderGeometry(0.34, 0.34, 0.1, 18);
  const coinMaterial = gold();

  const addCoin = (x, y, z, tilt = 0) => {
    const coin = mesh(coinGeometry, coinMaterial, x, y, z);
    coin.rotation.set(tilt, rng.range(0, Math.PI * 2), tilt * 0.6);
    group.add(coin);
  };

  // Pyramide : 9 + 5 + 2 + 1 pièces.
  const layers = [
    { count: 9, radius: 0.62, y: 0.06 },
    { count: 5, radius: 0.42, y: 0.17 },
    { count: 2, radius: 0.22, y: 0.28 },
    { count: 1, radius: 0, y: 0.39 },
  ];
  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      const angle = (i / layer.count) * Math.PI * 2 + rng.range(-0.2, 0.2);
      addCoin(Math.cos(angle) * layer.radius, layer.y, Math.sin(angle) * layer.radius, rng.range(-0.06, 0.06));
    }
  }
  // Pièces éparpillées autour.
  for (let i = 0; i < 6; i++) {
    const angle = rng.range(0, Math.PI * 2);
    const distance = rng.range(0.85, 1.25);
    addCoin(Math.cos(angle) * distance, 0.05, Math.sin(angle) * distance, rng.range(-0.12, 0.12));
  }

  return mergeStaticMeshes(group);
}

/** Coffre en bois & or : corps + couvercle arrondis, sangles dorées et serrure. */
function buildChest({ bodyColor = PALETTE.breakable.wood, lidColor = PALETTE.breakable.wood, scale = 1 } = {}) {
  const group = new THREE.Group();
  group.name = 'Chest';
  const wood = glossy(bodyColor);
  const woodLid = glossy(lidColor);
  const goldMaterial = gold();

  const base = mesh(roundedBoxGeometry(1.7, 0.95, 1.15, 0.2, 4), wood, 0, 0.48, 0);
  const lid = mesh(roundedBoxGeometry(1.78, 0.62, 1.22, 0.26, 4), woodLid, 0, 1.18, 0);
  group.add(base, lid);

  // Sangles dorées (devant + derrière + dessus).
  for (const x of [-0.58, 0.58]) {
    group.add(mesh(roundedBoxGeometry(0.18, 1.62, 1.26, 0.06, 2), goldMaterial, x, 0.82, 0));
  }
  group.add(mesh(roundedBoxGeometry(1.8, 0.16, 1.26, 0.06, 2), goldMaterial, 0, 0.95, 0));

  // Serrure dorée + trou de serrure.
  group.add(mesh(roundedBoxGeometry(0.4, 0.46, 0.14, 0.08, 3), goldMaterial, 0, 0.92, 0.62));
  const keyhole = mesh(cylinderGeometry(0.07, 0.07, 0.05, 12), glossy('#262b47'), 0, 0.92, 0.7);
  keyhole.rotation.x = Math.PI / 2;
  group.add(keyhole);

  // Poignées latérales.
  for (const side of [-1, 1]) {
    const handle = mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI), goldMaterial, side * 0.88, 0.7, 0);
    handle.rotation.z = side * Math.PI / 2;
    group.add(handle);
  }

  group.scale.setScalar(scale);
  return group;
}

/** Coffre Boss Géant : énorme coffre royal rouge et or, couronné et serti de gemmes. */
function buildBossChest() {
  const group = new THREE.Group();
  group.name = 'BossChest';
  const red = glossy(PALETTE.breakable.royalRed);
  const redDark = glossy(PALETTE.breakable.royalRedDark);
  const goldMaterial = gold();

  const base = mesh(roundedBoxGeometry(3.4, 1.9, 2.3, 0.34, 4), red, 0, 0.95, 0);
  const lid = mesh(roundedBoxGeometry(3.55, 1.25, 2.42, 0.44, 4), redDark, 0, 2.35, 0);
  group.add(base, lid);

  for (const x of [-1.15, 1.15]) {
    group.add(mesh(roundedBoxGeometry(0.34, 3.2, 2.5, 0.1, 2), goldMaterial, x, 1.6, 0));
  }
  group.add(mesh(roundedBoxGeometry(3.6, 0.3, 2.5, 0.1, 2), goldMaterial, 0, 1.9, 0));

  // Serrure royale.
  group.add(mesh(roundedBoxGeometry(0.8, 0.9, 0.22, 0.14, 3), goldMaterial, 0, 1.85, 1.22));
  const keyhole = mesh(cylinderGeometry(0.14, 0.14, 0.08, 12), glossy('#262b47'), 0, 1.85, 1.34);
  keyhole.rotation.x = Math.PI / 2;
  group.add(keyhole);

  // Gemmes sur la face avant.
  const gemColors = ['#ff5a7a', '#4fc3ff', '#ffd94d'];
  [-2.2, -1.5, 1.5, 2.2].forEach((x, i) => {
    const gem = mesh(sphereGeometry(1, 12, 10), glossy(gemColors[i % gemColors.length], { emissive: gemColors[i % gemColors.length], emissiveIntensity: 0.55 }), x, 0.95, 1.16);
    gem.scale.setScalar(0.17);
    group.add(gem);
  });

  // Couronne dorée sur le couvercle.
  const crown = createCrown().object3D;
  crown.position.y = 2.95;
  crown.scale.setScalar(2.1);
  group.add(crown);

  return group;
}

/** Halo lumineux (sprite additif) pour les cristaux. */
function createGlowSprite(color, scale) {
  const size = 128;
  const { canvas, ctx } = createCanvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(79, 195, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sprite.scale.setScalar(scale);
  return sprite;
}

/** Cristal de diamants : amas de cristaux bleus lumineux sur un rocher. */
function buildCrystal() {
  const rng = createRng(99);
  const group = new THREE.Group();
  group.name = 'Crystal';
  const rockMaterial = glossy('#8b96aa', { roughness: 0.7 });
  const crystalMaterial = glossy(PALETTE.breakable.crystal, {
    emissive: PALETTE.breakable.crystalDark,
    emissiveIntensity: 0.65,
    roughness: 0.15,
  });

  const rock = mesh(new THREE.DodecahedronGeometry(0.85, 0), rockMaterial, 0, 0.35, 0);
  rock.scale.set(1.2, 0.7, 1.2);
  group.add(rock);

  const crystalGeometry = new THREE.OctahedronGeometry(0.5, 0);
  const crystals = [
    { x: 0, z: 0, h: 2.1, tilt: 0.08 },
    { x: 0.55, z: 0.25, h: 1.4, tilt: 0.35 },
    { x: -0.5, z: 0.3, h: 1.25, tilt: -0.3 },
    { x: 0.2, z: -0.55, h: 1.0, tilt: 0.22 },
    { x: -0.3, z: -0.45, h: 0.8, tilt: -0.18 },
  ];
  for (const spec of crystals) {
    const crystal = mesh(crystalGeometry, crystalMaterial, spec.x, 0.55 + spec.h / 2, spec.z);
    crystal.scale.set(0.55, spec.h, 0.55);
    crystal.rotation.set(spec.tilt, rng.range(0, Math.PI), spec.tilt * 0.7);
    group.add(crystal);
  }

  const glow = createGlowSprite('rgba(79, 195, 255, 0.8)', 4.2);
  glow.position.y = 1.3;
  group.add(glow);

  return group;
}

const BUILDERS = {
  'coin-pile': buildCoinPile,
  chest: () => buildChest(),
  crystal: buildCrystal,
  'boss-chest': buildBossChest,
};

/**
 * Un Breakable : objet cassable (coffre, tas de pièces, cristal) avec points de vie,
 * flash blanc et squash & stretch à chaque coup, puis réapparition après destruction.
 */
export class Breakable {
  /** @type {BreakableType} */
  type;
  maxHp;
  hp;
  /** Position au sol (y = 0). */
  position;
  radius;
  height;
  state = 'alive';
  hovered = false;
  /** Dégâts accumulés sur la fenêtre en cours (affichés en un seul chiffre). */
  damageBuffer = 0;
  damageCrit = false;
  #flash = 0;
  #squash = 0;
  #respawnTimer = 0;
  #spawnT = 1;
  #timeSinceDamage = Infinity;
  #damageWindow = 0;
  #materials = [];

  /**
   * @param {string} typeId clé de `BREAKABLE_TYPES`
   * @param {number} x
   * @param {number} z
   * @param {number} [y] hauteur de la base (ex : posé sur un socle)
   */
  constructor(typeId, x, z, y = 0) {
    this.type = BREAKABLE_TYPES[typeId];
    if (!this.type) throw new Error(`Type de Breakable inconnu : « ${typeId} »`);
    this.maxHp = this.type.hp;
    this.hp = this.maxHp;
    this.position = new THREE.Vector3(x, y, z);
    this.radius = this.type.radius;
    this.height = this.type.height;

    this.object3D = new THREE.Group();
    this.object3D.name = `Breakable(${this.type.id})`;
    this.object3D.position.copy(this.position);
    this.object3D.userData.breakable = this;

    this.model = BUILDERS[this.type.id]();
    this.object3D.add(this.model);

    this.shadow = new BlobShadow(this.radius * 1.15, 0.34);
    this.shadow.mesh.position.y = 0.07 - y; // l'ombre reste au sol, même sur un socle
    this.object3D.add(this.shadow.mesh);

    // Matériaux uniques (pour le flash blanc et la surbrillance au survol).
    const seen = new Set();
    this.model.traverse((node) => {
      if (!node.isMesh) return;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (seen.has(material)) continue;
        seen.add(material);
        material.userData.baseEmissive = material.emissive ? material.emissive.clone() : new THREE.Color('#000000');
        material.userData.baseEmissiveIntensity = material.emissiveIntensity ?? 1;
        this.#materials.push(material);
      }
    });
  }

  get alive() {
    return this.state === 'alive';
  }

  /** Fraction de vie restante (0 → 1). */
  get hpFraction() {
    return Math.max(0, this.hp / this.maxHp);
  }

  /** La barre de vie doit-elle être affichée ? (ciblé, survolé ou récemment frappé) */
  get showHpBar() {
    return this.alive && (this.hovered || this.#timeSinceDamage < GAME_CONFIG.combat.hpBarTimeout);
  }

  /** Surbrillance quand la souris passe dessus. */
  setHovered(hovered) {
    this.hovered = hovered;
  }

  /**
   * Inflige des dégâts.
   * @param {number} amount
   * @returns {number} les dégâts réellement appliqués (plafonnés aux PV restants)
   */
  damage(amount) {
    if (!this.alive) return 0;
    const dealt = Math.min(amount, this.hp);
    this.hp -= dealt;
    this.#flash = 1;
    this.#squash = 1;
    this.#timeSinceDamage = 0;
    this.damageBuffer += dealt;
    return dealt;
  }

  /** Détruit le Breakable : il disparaît et réapparaîtra après `respawnTime`. */
  destroy() {
    if (!this.alive) return;
    this.state = 'destroyed';
    this.object3D.visible = false;
    this.hovered = false;
    this.#respawnTimer = this.type.respawnTime;
    this.damageBuffer = 0;
    this.damageCrit = false;
  }

  /** @param {number} dt */
  update(dt) {
    if (!this.alive) {
      this.#respawnTimer -= dt;
      if (this.#respawnTimer <= 0) {
        this.state = 'alive';
        this.hp = this.maxHp;
        this.object3D.visible = true;
        this.#spawnT = 0;
        this.#timeSinceDamage = Infinity;
      }
      return;
    }

    this.#timeSinceDamage += dt;
    this.#damageWindow += dt;

    // Flash blanc qui retombe + surbrillance au survol.
    this.#flash = Math.max(0, this.#flash - dt * 4.5);
    const hoverGlow = this.hovered ? 0.35 : 0;
    for (const material of this.#materials) {
      if (!material.emissive) continue;
      material.emissive.copy(material.userData.baseEmissive).lerp(WHITE, this.#flash);
      material.emissiveIntensity = material.userData.baseEmissiveIntensity + this.#flash * 1.5 + hoverGlow;
    }

    // Squash & stretch : écrasé au moment du coup, puis retour élastique.
    this.#squash = Math.max(0, this.#squash - dt * 5);
    // Apparition « pop » après réapparition.
    this.#spawnT = Math.min(1, this.#spawnT + dt / 0.45);
    const t = this.#spawnT;
    const pop = 1 + 2.9 * (t - 1) ** 3 + 1.9 * (t - 1) ** 2; // easeOutBack
    const squashY = 1 - this.#squash * 0.22;
    const squashXZ = 1 + this.#squash * 0.13;
    this.model.scale.set(squashXZ * pop, squashY * pop, squashXZ * pop);
  }

  /** Temps écoulé depuis la dernière fenêtre de dégâts (pour afficher le chiffre). */
  get damageWindowElapsed() {
    return this.#damageWindow;
  }

  resetDamageWindow() {
    this.#damageWindow = 0;
  }
}
