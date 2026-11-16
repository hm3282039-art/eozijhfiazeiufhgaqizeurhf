import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { glowMaterial } from '../graphics/materials.js';

/**
 * Planche volante « hoverboard » : une planche néon bleu/violet avec une traînée
 * lumineuse, qui apparaît sous le joueur quand le hoverboard est activé (touche H).
 *
 * La planche est attachée à `object3D` (le joueur) : elle suit automatiquement ses
 * déplacements. Elle est invisible tant que le hoverboard n'est pas actif.
 */
export class Hoverboard {
  #object3D;
  #trail = [];
  #trailCount = 6;

  /**
   * @param {THREE.Object3D} parent objet parent (le joueur)
   */
  constructor(parent) {
    const { size } = GAME_CONFIG.hoverboard;

    this.#object3D = new THREE.Group();
    this.#object3D.name = 'Hoverboard';
    this.#object3D.visible = false;

    // Plateau principal : longue plaque arrondie néon.
    const board = new THREE.Mesh(
      new RoundedBoxGeometry(size.width, size.thickness, size.length, 6, size.thickness * 0.6),
      new THREE.MeshStandardMaterial({
        color: '#3a2a6b',
        roughness: 0.3,
        metalness: 0.6,
        emissive: '#5a3aff',
        emissiveIntensity: 0.5,
      }),
    );
    board.name = 'HoverboardBoard';
    board.castShadow = false;
    board.position.y = 0.06;
    this.#object3D.add(board);

    // Bandes néon bleu/violet sur les côtés.
    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(
        new RoundedBoxGeometry(size.width * 0.16, size.thickness * 0.5, size.length * 0.92, 4, 0.04),
        new THREE.MeshStandardMaterial({
          color: '#27d3ee',
          emissive: '#27d3ee',
          emissiveIntensity: 1.2,
          roughness: 0.4,
        }),
      );
      strip.position.set(side * (size.width * 0.32), 0.06, 0);
      this.#object3D.add(strip);
    }

    // Glow sous la planche.
    const glowGeometry = new THREE.PlaneGeometry(1, 1);
    glowGeometry.rotateX(-Math.PI / 2);
    const glow = new THREE.Mesh(
      glowGeometry,
      glowMaterial('#7c4dff', { opacity: 0.6 }),
    );
    glow.position.y = -0.05;
    glow.scale.set(size.width * 1.6, 1, size.length * 1.6);
    this.#object3D.add(glow);

    // Traînée lumineuse (sprites additifs derrière la planche).
    for (let i = 0; i < this.#trailCount; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: i % 2 === 0 ? '#27d3ee' : '#a45cff',
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      sprite.position.set(0, 0, -size.length * 0.5 - i * 0.5);
      sprite.scale.setScalar(size.width * (1 - i / this.#trailCount) * 0.9);
      this.#object3D.add(sprite);
      this.#trail.push(sprite);
    }

    parent.add(this.#object3D);
  }

  get object3D() {
    return this.#object3D;
  }

  /** Active / désactive la planche. @param {boolean} active */
  setActive(active) {
    this.#object3D.visible = active;
  }

  /** Anime la planche (traînée, pulsation). @param {number} dt @param {number} time */
  update(dt, time) {
    if (!this.#object3D.visible) return;

    // Pulsation du glow.
    const glow = this.#object3D.children.find((c) => c.geometry?.type === 'PlaneGeometry');
    if (glow) {
      const pulse = 0.85 + Math.sin(time * 4) * 0.15;
      glow.material.opacity = 0.5 + Math.sin(time * 4) * 0.15;
      glow.scale.setScalar(pulse * 1.2);
    }

    // Traînée : on fait osciller l'opacité pour un effet de « vitesse ».
    for (let i = 0; i < this.#trail.length; i++) {
      const sprite = this.#trail[i];
      sprite.material.opacity = (1 - i / this.#trail.length) * (0.5 + 0.5 * Math.abs(Math.sin(time * 8 + i)));
    }
  }
}
