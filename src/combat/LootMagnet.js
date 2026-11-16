import * as THREE from 'three';
import { cylinderGeometry, sphereGeometry } from '../graphics/geometries.js';
import { goldMaterial, glossyMaterial } from '../graphics/materials.js';
import { createRng } from '../utils/random.js';

const GRAVITY = -22;
const BOUNCE = 0.42;
const MAGNET_DELAY = 0.75;
const COLLECT_DISTANCE = 1.0;
const CONFETTI_LIFE = 1.3;

/**
 * Butin et confettis des Breakables :
 *  - à la destruction, une gerbe de pièces / diamants jaillit, rebondit au sol,
 *    puis vole vers le joueur comme un aimant (et incrémente ses compteurs) ;
 *  - une explosion de confettis colorés célèbre la destruction.
 *
 * Optimisation FPS : les géométries et matériaux sont créés une seule fois (props de
 * classe, partagés). Les MESHES utilisent un POOL : un mesh retiré de la scène est
 * remis en réserve et réutilisé à la prochaine gerbe — aucune création/`dispose` dans
 * la boucle de rendu, aucune pression sur le GC.
 */
export class LootMagnet {
  #scene;
  #rng = createRng(2024);
  /** @type {{ mesh: THREE.Mesh, velocity: THREE.Vector3, state: 'burst' | 'magnet', timer: number, currency: string, amount: number }[]} */
  #items = [];
  /** @type {{ mesh: THREE.Mesh, velocity: THREE.Vector3, spin: THREE.Vector3, life: number }[]} */
  #confetti = [];
  /** Pool de meshes de butin (pièces + diamants) : réutilisés au retrait. */
  #pool = [];
  /** Pool de meshes de confettis. */
  #confettiPool = [];

  #coinGeometry = cylinderGeometry(0.3, 0.3, 0.09, 16);
  #diamondGeometry = new THREE.OctahedronGeometry(0.26, 0);
  #coinMaterial = goldMaterial();
  #diamondMaterial = glossyMaterial('#4fc3ff', { emissive: '#1f8ef0', emissiveIntensity: 0.7, roughness: 0.15 });
  #confettiGeometry = new THREE.BoxGeometry(0.14, 0.02, 0.2);
  #confettiMaterials = new Map();

  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.#scene = scene;
  }

  /**
   * Fait jaillir le butin d'un Breakable détruit.
   * @param {THREE.Vector3} position position du Breakable
   * @param {{ coins?: number, diamonds?: number }} loot
   */
  burstLoot(position, loot) {
    if (loot.coins) this.#burstCurrency(position, 'coins', loot.coins, 10);
    if (loot.diamonds) this.#burstCurrency(position, 'diamonds', loot.diamonds, 3);
  }

  /**
   * Explosion de confettis colorés.
   * @param {THREE.Vector3} position
   * @param {string[]} colors
   */
  explodeConfetti(position, colors) {
    for (let i = 0; i < 26; i++) {
      const material = this.#confettiMaterial(this.#rng.pick(colors));
      const mesh = this.#takeConfetti();
      mesh.material = material;
      mesh.position.set(position.x, 0.8, position.z);
      mesh.rotation.set(this.#rng.range(0, 3), this.#rng.range(0, 3), this.#rng.range(0, 3));
      mesh.scale.setScalar(1);
      mesh.visible = true;
      this.#scene.add(mesh);
      this.#confetti.push({
        mesh,
        velocity: new THREE.Vector3(
          this.#rng.range(-4.5, 4.5),
          this.#rng.range(5, 10),
          this.#rng.range(-4.5, 4.5),
        ),
        spin: new THREE.Vector3(this.#rng.range(-9, 9), this.#rng.range(-9, 9), this.#rng.range(-9, 9)),
        life: CONFETTI_LIFE * this.#rng.range(0.75, 1.15),
      });
    }
  }

  /**
   * @param {number} dt
   * @param {THREE.Vector3} playerPosition position du joueur (au sol)
   * @param {(currency: 'coins' | 'diamonds', amount: number) => void} onCollect
   */
  update(dt, playerPosition, onCollect) {
    // ── Butin ────────────────────────────────────────────────────────────────
    for (let i = this.#items.length - 1; i >= 0; i--) {
      const item = this.#items[i];
      const mesh = item.mesh;

      if (item.state === 'burst') {
        item.timer += dt;
        item.velocity.y += GRAVITY * dt;
        mesh.position.addScaledVector(item.velocity, dt);
        mesh.rotation.x += dt * 7;
        mesh.rotation.z += dt * 5;
        if (mesh.position.y < 0.12) {
          mesh.position.y = 0.12;
          item.velocity.y = Math.abs(item.velocity.y) * BOUNCE;
          item.velocity.x *= 0.7;
          item.velocity.z *= 0.7;
          if (Math.abs(item.velocity.y) < 1.2) item.velocity.y = 0;
        }
        if (item.timer >= MAGNET_DELAY) item.state = 'magnet';
      } else {
        // Aimant : accélère vers le joueur.
        const target = this.#scratch.set(playerPosition.x, 1.1, playerPosition.z);
        const toPlayer = target.sub(mesh.position);
        const distance = toPlayer.length();
        if (distance < COLLECT_DISTANCE) {
          onCollect(item.currency, item.amount);
          this.#scene.remove(mesh);
          mesh.visible = false;
          this.#pool.push(mesh); // remis en réserve (pas de dispose : géométrie/matériau partagés)
          this.#items.splice(i, 1);
          continue;
        }
        item.velocity.addScaledVector(toPlayer.normalize(), 55 * dt);
        item.velocity.multiplyScalar(Math.max(0, 1 - 2.2 * dt));
        mesh.position.addScaledVector(item.velocity, dt);
        mesh.rotation.x += dt * 10;
      }
    }

    // ── Confettis ────────────────────────────────────────────────────────────
    for (let i = this.#confetti.length - 1; i >= 0; i--) {
      const piece = this.#confetti[i];
      piece.life -= dt;
      if (piece.life <= 0) {
        this.#scene.remove(piece.mesh);
        piece.mesh.visible = false;
        this.#confettiPool.push(piece.mesh); // remis en réserve
        this.#confetti.splice(i, 1);
        continue;
      }
      piece.velocity.y += GRAVITY * 0.55 * dt;
      piece.velocity.multiplyScalar(Math.max(0, 1 - 1.6 * dt));
      piece.mesh.position.addScaledVector(piece.velocity, dt);
      if (piece.mesh.position.y < 0.05) piece.mesh.position.y = 0.05;
      piece.mesh.rotation.x += piece.spin.x * dt;
      piece.mesh.rotation.y += piece.spin.y * dt;
      piece.mesh.rotation.z += piece.spin.z * dt;
      const shrink = Math.min(1, piece.life / 0.3);
      piece.mesh.scale.setScalar(shrink);
    }
  }

  #scratch = new THREE.Vector3();

  #burstCurrency(position, currency, total, perItem) {
    const count = Math.max(3, Math.min(16, Math.round(total / perItem)));
    const base = Math.floor(total / count);
    let remaining = total;
    for (let i = 0; i < count; i++) {
      const amount = i === count - 1 ? remaining : base;
      remaining -= amount;
      if (amount <= 0) continue;
      const mesh = this.#takeCurrency(currency);
      mesh.position.set(position.x, 0.9, position.z);
      mesh.visible = true;
      this.#scene.add(mesh);
      this.#items.push({
        mesh,
        velocity: new THREE.Vector3(
          this.#rng.range(-3.2, 3.2),
          this.#rng.range(5.5, 9.5),
          this.#rng.range(-3.2, 3.2),
        ),
        state: 'burst',
        timer: 0,
        currency,
        amount,
      });
    }
  }

  /** Prend un mesh de butin dans le pool (ou le crée une fois). */
  #takeCurrency(currency) {
    const mesh = this.#pool.pop() ?? new THREE.Mesh(
      currency === 'coins' ? this.#coinGeometry : this.#diamondGeometry,
      currency === 'coins' ? this.#coinMaterial : this.#diamondMaterial,
    );
    mesh.geometry = currency === 'coins' ? this.#coinGeometry : this.#diamondGeometry;
    mesh.material = currency === 'coins' ? this.#coinMaterial : this.#diamondMaterial;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    return mesh;
  }

  /** Prend un mesh de confetti dans le pool (ou le crée une fois). */
  #takeConfetti() {
    const mesh = this.#confettiPool.pop() ?? new THREE.Mesh(this.#confettiGeometry, this.#confettiMaterial('#ffffff'));
    mesh.geometry = this.#confettiGeometry;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    return mesh;
  }

  #confettiMaterial(color) {
    let material = this.#confettiMaterials.get(color);
    if (!material) {
      material = glossyMaterial(color, { roughness: 0.4 });
      this.#confettiMaterials.set(color, material);
    }
    return material;
  }
}
