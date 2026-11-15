import * as THREE from 'three';
import { ThirdPersonCamera } from './camera/ThirdPersonCamera.js';
import { GAME_CONFIG } from './config/gameConfig.js';
import { PET_VARIANTS, STARTER_PETS } from './config/petSpecies.js';
import { WORLD } from './config/worldConfig.js';
import { createRenderer } from './core/createRenderer.js';
import { EVENTS, EventBus } from './core/EventBus.js';
import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { Shop } from './economy/Shop.js';
import { Wallet } from './economy/Wallet.js';
import { setMaxAnisotropy } from './graphics/canvas.js';
import { PetManager } from './pets/PetManager.js';
import { Player } from './player/Player.js';
import { HUD } from './ui/HUD.js';
import { World } from './world/World.js';

/**
 * Le jeu : crée tous les systèmes, les relie entre eux et fait tourner la boucle principale.
 *
 * Ordre d'une image :
 *   joueur (entrées → déplacement) → pets (formation → animation) → décor → caméra
 *   → étiquettes des pets (taille selon le zoom) → rendu
 */
export class Game {
  /** Passe à `true` quand le monde est construit et les pets de départ prêts. */
  isReady = false;

  #canvas;
  #hudRoot;
  #time = 0;
  #focus = new THREE.Vector3();
  #testPetCursor = 0;
  #loop = new GameLoop((dt) => this.#frame(dt));

  /**
   * @param {{ canvas: HTMLCanvasElement, hudRoot: HTMLElement }} elements
   */
  constructor({ canvas, hudRoot }) {
    this.#canvas = canvas;
    this.#hudRoot = hudRoot;
  }

  /** Construit le monde, le joueur, les pets de départ et l'interface. */
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

    // ── Économie + pets ──────────────────────────────────────────────────────
    this.wallet = new Wallet(this.events);
    this.pets = new PetManager({ scene: this.scene, collision: this.world.collision, events: this.events });
    this.shop = new Shop({ wallet: this.wallet, pets: this.pets, getHatchPoint: () => this.player.position });

    // Les 3 pets de départ (modèle .glb si `modelUrl` est défini, sinon générateur procédural).
    await Promise.all(STARTER_PETS.map((species) => this.pets.addPet({ species }, { animate: false })));

    // ── Interface ────────────────────────────────────────────────────────────
    this.hud = new HUD({
      root: this.#hudRoot,
      events: this.events,
      wallet: this.wallet,
      pets: this.pets,
      shop: this.shop,
      actions: {
        teleportTo: (zone) => this.teleportTo(zone),
        cycleAnimation: () => this.cyclePetAnimation(),
        addTestPet: () => this.addTestPet(),
        removeTestPet: () => this.removeTestPet(),
      },
    });

    // ── Mise en place ────────────────────────────────────────────────────────
    this.#placeAt(WORLD.spawn);
    window.addEventListener('resize', this.#resize);
    this.#resize();

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
    if (touched === 'gate-laser') this.events.emit(EVENTS.GATE_BLOCKED, { price: WORLD.gate.price });

    this.pets.update(dt, time, player);
    this.world.update(dt, time, player.position);
    this.cameraRig.update(dt, this.#getCameraFocus());
    this.pets.updateLabels(this.cameraRig.camera);
    this.input.endFrame();
  }

  #render() {
    this.renderer.render(this.scene, this.cameraRig.camera);
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
