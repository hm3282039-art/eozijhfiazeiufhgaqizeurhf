import * as THREE from 'three';
import { ThirdPersonCamera } from './camera/ThirdPersonCamera.js';
import { GAME_CONFIG } from './config/gameConfig.js';
import { PET_VARIANTS, PET_SPECIES, STARTER_PETS } from './config/petSpecies.js';
import { RARITIES } from './config/rarityConfig.js';
import { HATCH_EGGS } from './config/eggCatalog.js';
import { WORLD } from './config/worldConfig.js';
import { ZONES, zoneState } from './config/zones.js';
import { createRenderer } from './core/createRenderer.js';
import { EVENTS, EventBus } from './core/EventBus.js';
import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { Shop } from './economy/Shop.js';
import { Wallet } from './economy/Wallet.js';
import { setMaxAnisotropy } from './graphics/canvas.js';
import { PetManager } from './pets/PetManager.js';
import { BreakableManager } from './world/props/breakables/BreakableManager.js';
import { LootMagnet } from './combat/LootMagnet.js';
import { Player } from './player/Player.js';
import { HUD } from './ui/HUD.js';
import { AdminPanel } from './ui/panels/AdminPanel.js';
import { FloatingText } from './ui/components/FloatingText.js';
import { formatNumber } from './utils/format.js';
import { World } from './world/World.js';

/**
 * Le jeu : crée tous les systèmes, les relie entre eux et fait tourner la boucle principale.
 *
 * Ordre d'une image :
 *   joueur (entrées → déplacement) → pets (formation / combat → animation) → décor
 *   → butin & breakables → caméra → étiquettes / barres de vie → rendu
 */
export class Game {
  /** Passe à `true` quand le monde est construit et les pets de départ prêts. */
  isReady = false;

  #canvas;
  #hudRoot;
  #time = 0;
  #focus = new THREE.Vector3();
  #testPetCursor = 0;
  #raycaster = new THREE.Raycaster();
  #pointer = new THREE.Vector2();
  #projectVec = new THREE.Vector3();
  #lastClickMs = 0;
  #mood = 'day';
  #roundCursor = 0;
  /** Gamepasses activés (id de `config/eggCatalog.js`). */
  #gamepasses = new Set();

  #loop = new GameLoop((dt) => this.#frame(dt));

  /**
   * @param {{ canvas: HTMLCanvasElement, hudRoot: HTMLElement }} elements
   */
  constructor({ canvas, hudRoot }) {
    this.#canvas = canvas;
    this.#hudRoot = hudRoot;
  }

  /** Construit le monde, le joueur, les pets de départ, les coffres et l'interface. */
  async init() {
    this.events = new EventBus();

    // ── Rendu ────────────────────────────────────────────────────────────────
    this.renderer = createRenderer(this.#canvas);
    setMaxAnisotropy(this.renderer.capabilities.getMaxAnisotropy());
    this.scene = new THREE.Scene();
    this.cameraRig = new ThirdPersonCamera(this.#canvas);

    // ── Monde + joueur ───────────────────────────────────────────────────────
    this.input = new InputManager(window);
    this.world = new World(this.scene);

    this.player = new Player({ input: this.input, collision: this.world.collision });
    this.scene.add(this.player.object3D);

    // ── Économie + systèmes de combat ─────────────────────────────────────────
    this.wallet = new Wallet(this.events);
    this.pets = new PetManager({ scene: this.scene, collision: this.world.collision, events: this.events });
    this.shop = new Shop({
      wallet: this.wallet,
      pets: this.pets,
      getHatchPoint: () => this.player.position,
      flags: { ultraChance: () => this.hasGamepass('ultra-chance') },
    });

    // FloatingText (barres de vie / chiffres) + butin & confettis, puis les Breakables.
    this.floatingText = new FloatingText(this.#hudRoot);
    this.loot = new LootMagnet(this.scene);
    this.breakables = new BreakableManager(this.scene, {
      floatingText: this.floatingText,
      loot: this.loot,
    });
    this.breakables.spawnAll();
    // Chaque coup de pet porte sur le Breakable.
    this.pets.onPetHit = (pet, breakable) => this.breakables.hit(breakable, this.pets.petDamage(pet));

    // Les 3 pets de départ (modèle .glb si `modelUrl` est défini, sinon générateur procédural).
    await Promise.all(STARTER_PETS.map((species) => this.pets.addPet({ species }, { animate: false })));

    // ── Interface ────────────────────────────────────────────────────────────
    this.hud = new HUD({
      root: this.#hudRoot,
      events: this.events,
      wallet: this.wallet,
      pets: this.pets,
      shop: this.shop,
      breakables: this.breakables,
      floatingText: this.floatingText,
      actions: {
        teleportTo: (zone) => this.teleportTo(zone),
        cycleAnimation: () => this.cyclePetAnimation(),
        addTestPet: () => this.addTestPet(),
        removeTestPet: () => this.removeTestPet(),
        openAdmin: () => this.adminPanel.open(),
        activateGamepass: (id) => this.activateGamepass(id),
        hasGamepass: (id) => this.hasGamepass(id),
        admin: {
          addCoins: (amount) => this.#addCurrency('coins', amount),
          addDiamonds: (amount) => this.#addCurrency('diamonds', amount),
          resetWallet: () => {
            this.wallet.reset();
            this.#toast('Monnaies remises à zéro.', { variant: 'info', icon: '🔄' });
          },
          spawnPet: (variant) => this.#spawnVariantPet(variant),
          toggleDamageBoost: () => {
            const enabled = this.pets.setDamageBoost(!this.pets.damageBoostEnabled);
            this.#toast(`Boost dégâts des pets : ${enabled ? 'ON (×10)' : 'OFF'}`, {
              variant: enabled ? 'warning' : 'info',
              icon: '⚔️',
            });
            return enabled;
          },
          spawnBossChest: () => this.spawnBossChest(),
          nukeMap: () => this.nukeMap(),
          unlockZone2: () => this.#unlockZone2(true),
          setPlayerSpeed: (value) => this.player.speedMultiplier = value,
          setPetSize: (value) => this.pets.setSizeMultiplier(value),
          toggleMood: () => this.toggleMood(),
        },
      },
    });
    this.adminPanel = this.hud.adminPanel;

    // ── Mise en place ────────────────────────────────────────────────────────
    this.#placeAt(WORLD.spawn);
    window.addEventListener('resize', this.#resize);
    this.#resize();

    // Clics (Breakables : survol + attaque ; porte : cadenas déverrouillable) + F2 (Admin).
    this.#canvas.addEventListener('click', this.#onClick);
    window.addEventListener('keydown', (event) => {
      if (event.code === 'F2') {
        event.preventDefault();
        this.adminPanel.toggle();
      }
    });

    // Compile les shaders et dessine une première image avant de retirer l'écran de chargement.
    this.renderer.compile(this.scene, this.cameraRig.camera);
    this.#frame(0);
    this.isReady = true;
  }

  start() {
    this.#loop.start();
  }

  pause() {
    this.#loop.stop();
  }

  // ── Actions déclenchées par l'interface ────────────────────────────────────

  /** Téléporte le joueur (et ses pets) dans une zone débloquée. */
  teleportTo(zone) {
    if (!zone.unlocked || !zone.destination) return;
    this.#placeAt(zone.destination);
    this.events.emit(EVENTS.PLAYER_TELEPORTED, zone);
    this.#toast(`Téléporté : Zone ${zone.index} — ${zone.name}`, { variant: 'success', icon: '🚀' });
  }

  /** Bouton de test : passe au style d'animation de pets suivant. */
  cyclePetAnimation() {
    const style = this.pets.cycleAnimationStyle();
    this.#toast(`Animation des pets : ${style.label} — déplace-toi pour la voir !`, { icon: '🎬' });
  }

  /** Bouton de test : ajoute un pet (variante de couleur) à l'équipe. */
  async addTestPet() {
    if (this.pets.isFull) {
      this.#toast(`Maximum de ${this.pets.maxCount} pets atteint !`, { variant: 'warning', icon: '🐾' });
      return;
    }
    const variant = PET_VARIANTS[this.#testPetCursor++ % PET_VARIANTS.length];
    const pet = await this.pets.addPet(
      { species: variant.species, name: variant.name, palette: variant.palette, isTest: true },
      { at: this.player.position },
    );
    if (pet) this.#toast(`${pet.name} rejoint ton équipe !`, { variant: 'success', icon: '✨' });
  }

  /** Bouton de test : retire le dernier pet de test. */
  removeTestPet() {
    const pet = this.pets.removeLastTestPet();
    if (pet) this.#toast(`${pet.name} est rentré à la maison.`, { icon: '👋' });
  }

  // ── Actions de l'Admin Panel ───────────────────────────────────────────────

  /** Ajoute une monnaie (Admin). */
  #addCurrency(currency, amount) {
    this.wallet.add(currency, amount);
    const label = currency === 'coins' ? 'Pièces Jaunes' : 'Diamants Bleus';
    this.#toast(`+${formatNumber(amount)} ${label}`, { variant: 'success', icon: currency === 'coins' ? '🪙' : '💎' });
  }

  /** Spawn d'un pet par rareté / variante (Admin) — HUGE / TITANIC / GARGANTUAN + variantes. */
  async #spawnVariantPet(variant) {
    if (this.pets.isFull) {
      this.#toast(`Maximum de ${this.pets.maxCount} pets atteint !`, { variant: 'warning', icon: '🐾' });
      return;
    }
    // Un id de rareté spéciale (huge/titanic/gargantuan) est traité comme une rareté ;
    // golden/rainbow/shiny sont des variantes visuelles.
    const isSpecialRarity = RARITIES[variant] && RARITIES[variant].special;
    const names = {
      huge: 'HUGE Cat Géant',
      titanic: 'TITANIC Cat Géant',
      gargantuan: 'GARGANTUAN Cat Géant',
      golden: 'Golden Pet',
      rainbow: 'Rainbow Pet',
      shiny: 'Shiny Pet',
    };
    const pet = await this.pets.addPet(
      {
        species: 'cat',
        name: names[variant] ?? variant,
        variant: isSpecialRarity ? 'normal' : variant,
        rarity: isSpecialRarity ? variant : 'legendary',
        isTest: true,
      },
      { at: this.player.position },
    );
    if (pet) {
      const icons = { huge: '🔥', titanic: '🦣', gargantuan: '🐉' };
      this.#toast(`${pet.name} rejoint ton équipe !`, { variant: 'success', icon: icons[variant] ?? '✨' });
    }
  }

  /** Un gamepass est-il activé ? @param {string} id */
  hasGamepass(id) {
    return this.#gamepasses.has(id);
  }

  /**
   * Active un gamepass (Boutique Exclusive) et applique son effet immédiat.
   * @param {string} id id de `config/eggCatalog.js`
   * @returns {boolean} vrai si activé (ou déjà activé)
   */
  activateGamepass(id) {
    if (this.#gamepasses.has(id)) return true;
    this.#gamepasses.add(id);

    switch (id) {
      case 'extra-pets':
        // 15 slots d'équipe supplémentaires.
        this.pets.setMaxCountDelta(15);
        this.events.emit(EVENTS.PETS_CHANGED, this.pets);
        break;
      case 'super-magnet':
        // Aimant plus large (rapide, valeur référencée par LootMagnet si disponible).
        if (this.loot && typeof this.loot.setMagnetRange === 'function') this.loot.setMagnetRange(2.6);
        break;
      case 'vip':
        this.#toast('VIP activé : bonus de pièces à chaque éclosion !', { variant: 'success', icon: '👑' });
        break;
      case 'auto-hatch':
        this.#toast('Auto-Hatch activé : les œufs du spawn éclosent instantanément !', { variant: 'success', icon: '🥚' });
        break;
      case 'ultra-chance':
        this.#toast('Ultra Chance activé : chances de rareté et de HUGE doublées !', { variant: 'success', icon: '🍀' });
        break;
      default:
        break;
    }

    this.events.emit(EVENTS.TOAST, {
      variant: 'success',
      icon: '🎫',
      message: `Gamepass activé !`,
    });
    return true;
  }

  /** Fait tomber un Coffre Boss devant le joueur (Admin). */
  spawnBossChest() {
    const breakable = this.breakables.addBreakable('boss-chest', this.player.position.x, this.player.position.z - 2.5);
    this.#toast(`Coffre Boss Géant apparu ! (${formatNumber(breakable.maxHp)} PV)`, { variant: 'warning', icon: '👑' });
  }

  /** Explose tous les coffres de la carte (Admin). */
  nukeMap() {
    const count = this.breakables.breakables.filter((b) => b.alive).length;
    this.breakables.nuke();
    this.#toast(`💥 ${count} coffres cassés d'un coup !`, { variant: 'success', icon: '💥' });
  }

  /** Bascule l'ambiance jour / coucher de soleil doré. */
  toggleMood() {
    this.#mood = this.#mood === 'day' ? 'sunset' : 'day';
    this.world.setMood(this.#mood);
    return this.#mood;
  }

  /**
   * Débloque la Zone 2 : retire le prix (ou passe à 0 si `free`), éteint le mur laser,
   * désactive son collider et lance une petite explosion de fête.
   * @param {boolean} [free] si `true`, débloque gratuitement (Admin)
   * @returns {boolean} `true` si le déblocage a eu lieu
   */
  #unlockZone2(free = false) {
    if (zoneState.zone2Unlocked) return false;

    const { currency, amount } = ZONES[1].price;
    if (!free) {
      if (this.wallet.canAfford(currency, amount)) {
        this.wallet.spend(currency, amount);
      } else {
        const missing = amount - this.wallet.getBalance(currency);
        this.#toast(`Il te manque ${formatNumber(missing)} pièces !`, { variant: 'warning', icon: '🔒' });
        return false;
      }
    }

    zoneState.zone2Unlocked = true;
    this.world.gate.unlock();
    this.world.collision.removeByTag('gate-laser');
    this.#celebrateUnlock();

    this.events.emit(EVENTS.ZONE_UNLOCKED, { zone: ZONES[1] });
    this.hud.refreshZone2Unlocked();
    this.#toast('🎉 ZONE 2 DÉBLOQUÉE !', { variant: 'success', icon: '🎉', duration: 4200 });
    return true;
  }

  /** Petite explosion de fête + pluie de confettis dorés (déblocage de la Zone 2). */
  #celebrateUnlock() {
    this.loot.explodeConfetti(new THREE.Vector3(0, 0.6, WORLD.gate.z), ['#ffc93c', '#ffd94d', '#fff3b0', '#ffffff']);
    for (let i = 0; i < 8; i++) {
      setTimeout(
        () => {
          if (i % 2 === 0) {
            this.loot.burstLoot(new THREE.Vector3(0, 0.6, WORLD.gate.z), { coins: 100 });
            this.wallet.add('coins', 100);
          }
          this.loot.explodeConfetti(new THREE.Vector3((i % 4 - 1.5) * 3, 0.6, WORLD.gate.z + (i % 3 - 1) * 3), ['#ffc93c', '#ffd94d', '#ff5a7a']);
        },
        i * 220,
      );
    }
  }

  /**
   * La porte est-elle accessible ? (collision du mur laser + vue du panneau)
   * @returns {{ zone2: boolean, zone2Missing: number }}
   */
  get zone2() {
    return zoneState.zone2Unlocked;
  }

  // ── Outils de débogage (console du navigateur : `game.debugStep(2)`) ────────

  /**
   * Avance la simulation de `seconds` secondes par pas fixes, puis dessine une image.
   * Utile pour les tests automatisés (résultat indépendant du framerate).
   */
  debugStep(seconds, step = 1 / 60) {
    const steps = Math.max(1, Math.round(seconds / step));
    for (let i = 0; i < steps; i++) this.#update(step);
    this.#render();
  }

  /**
   * Projette un point du monde en coordonnées écran (`null` si derrière la caméra).
   * Utile pour le débogage et les tests (cliquer sur un objet en écran).
   */
  screenPos(x, y, z) {
    const v = this.#projectVec.set(x, y, z).project(this.cameraRig.camera);
    if (v.z > 1 || v.z < -1) return null;
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  // ── Boucle principale ──────────────────────────────────────────────────────

  #frame(dt) {
    this.#update(dt);
    this.#render();
  }

  #update(dt) {
    this.#time += dt;
    const time = this.#time;
    const { player } = this;

    const { touched } = player.update(dt, time, this.cameraRig.getForward());
    if (touched === 'gate-laser') {
      this.events.emit(EVENTS.GATE_BLOCKED, { price: WORLD.gate.price });
    }

    this.pets.update(dt, time, player);
    this.world.update(dt, time, player.position);
    this.breakables.update(dt, time);

    // Butin & confettis : gerbe de pièces/diamants, aimantés vers le joueur.
    this.loot.update(
      dt,
      player.position,
      (currency, amount) => this.wallet.add(currency, amount),
    );

    this.cameraRig.update(dt, this.#getCameraFocus());
    this.pets.updateLabels(this.cameraRig.camera);
    this.floatingText.update(this.cameraRig.camera, this.breakables.breakables, this.pets.target, dt);
    this.input.endFrame();
  }

  #render() {
    this.renderer.render(this.scene, this.cameraRig.camera);
  }

  // ── Clics : Breakables (attaque) et porte (déverrouillage) ──────────────────

  /**
   * Un clic sur le canvas :
   *  - sur un Breakable : les pets quittent la formation et l'attaquent (le raycast
   *    considère aussi l'ambiance du cercle d'attaque) ;
   *  - sur le cadenas / le panneau de la porte : tente de déverrouiller la Zone 2 ;
   *  - autre part : rappelle les pets (et désactive l'attaque si un coffre a été détruit).
   */
  #onClick = (event) => {
    // Pas un vrai clic (frettation) : ignore les doubles clics rapides.
    const now = event.timeStamp;
    if (now - this.#lastClickMs < 180) return;
    this.#lastClickMs = now;

    if (this.adminPanel.isOpen) return;

    const camera = this.cameraRig.camera;
    const hitBreakable = this.breakables.pick(event.clientX, event.clientY, camera);

    if (hitBreakable) {
      if (!hitBreakable.alive) {
        // Coffre en réapparition : rappel des pets.
        this.pets.setTarget(null);
        return;
      }
      this.pets.setTarget(hitBreakable);
      return;
    }

    // Cadenas ou panneau de la porte : déverrouillage.
    const gateTarget = this.#pickGateTarget(event.clientX, event.clientY, camera);
    if (gateTarget) this.#unlockZone2(false);

    // Sinon : retour à la formation.
    this.pets.setTarget(null);
  };

  /** Cherche un élément de la porte (cadenas / panneau) sous la souris. */
  #pickGateTarget(clientX, clientY, camera) {
    if (zoneState.zone2Unlocked) return false;
    const targets = this.world.gate.lockTargets ?? [];
    if (targets.length === 0) return false;

    // Projette la grille raycaster au pixel pour identifier les objets.
    this.#pointer.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.#raycaster.setFromCamera(this.#pointer, camera);
    this.#raycaster.far = 120;
    const hits = this.#raycaster.intersectObjects(targets, false);
    return hits.length > 0;
  }

  // ── Utilitaires ────────────────────────────────────────────────────────────

  /** Point visé par la caméra : la tête du joueur (les sauts ne sont suivis qu'en partie). */
  #getCameraFocus() {
    const { position, altitude } = this.player;
    return this.#focus.set(position.x, GAME_CONFIG.camera.focusHeight + altitude * 0.55, position.z);
  }

  /**
   * Installe le joueur, ses pets et la caméra à un point d'arrivée.
   * @param {{ x: number, z: number, yaw: number, formationYaw: number }} destination
   */
  #placeAt({ x, z, yaw, formationYaw }) {
    this.player.teleport(x, z, yaw);
    this.pets.snapToFormation(this.player, formationYaw);
    this.cameraRig.snapTo(this.#getCameraFocus(), ThirdPersonCamera.startView);
  }

  #toast(message, options = {}) {
    this.events.emit(EVENTS.TOAST, { message, ...options });
  }

  #resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, GAME_CONFIG.renderer.maxPixelRatio));
    this.renderer.setSize(width, height, false);
    this.cameraRig.resize(width / Math.max(height, 1));
  };
}
