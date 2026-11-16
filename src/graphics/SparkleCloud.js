import * as THREE from 'three';
import { createCanvas } from './canvas.js';
import { createRng } from '../utils/random.js';

let sharedTexture = null;

/** Petite étoile douce (halo radial) utilisée par les particules brillantes. */
function getTexture() {
  if (sharedTexture) return sharedTexture;
  const size = 64;
  const { canvas, ctx } = createCanvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  sharedTexture = new THREE.CanvasTexture(canvas);
  return sharedTexture;
}

/**
 * Nuage de petites particules brillantes (étincelles dorées / blanches) qui flottent
 * doucement : montée lente + balancement latéral, recyclées en hauteur.
 * Sert aux étincelles des pets dorés et à l'ambiance autour du spawn.
 *
 * @param {{
 *   count?: number,
 *   radius?: number,          rayon du cylindre (0 = nuage compact autour de l'origine)
 *   height?: number,          hauteur maximale
 *   size?: number,            taille d'une particule
 *   colors?: string[],        palette des particules
 *   seed?: number,
 * }} [options]
 */
export class SparkleCloud {
  #points;
  #positions;
  #base;
  #phase;
  #speed;
  #count;
  #height;
  #radius;

  constructor({ count = 14, radius = 0.9, height = 2.2, size = 0.22, colors = ['#ffd94d', '#fff3b0', '#ffffff'], seed = 7 } = {}) {
    const rng = createRng(seed);
    this.#count = count;
    this.#height = height;
    this.#radius = radius;

    this.#positions = new Float32Array(count * 3);
    this.#base = new Float32Array(count * 3);
    this.#phase = new Float32Array(count);
    this.#speed = new Float32Array(count);
    const colorAttribute = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const angle = rng.range(0, Math.PI * 2);
      const distance = radius * Math.sqrt(rng.range(0, 1));
      this.#base[i * 3] = Math.cos(angle) * distance;
      this.#base[i * 3 + 1] = rng.range(0, height);
      this.#base[i * 3 + 2] = Math.sin(angle) * distance;
      this.#phase[i] = rng.range(0, Math.PI * 2);
      this.#speed[i] = rng.range(0.5, 1.1);
      color.set(rng.pick(colors));
      color.toArray(colorAttribute, i * 3);
    }
    this.#positions.set(this.#base);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.#positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorAttribute, 3));

    this.#points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: getTexture(),
        size,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    );
    this.#points.name = 'Sparkles';
    this.#points.frustumCulled = false;
  }

  /** Le `THREE.Points` à attacher à la scène (ou au pet). */
  get object3D() {
    return this.#points;
  }

  /**
   * @param {number} dt
   * @param {number} time temps de jeu (s)
   */
  update(dt, time) {
    const positions = this.#positions;
    for (let i = 0; i < this.#count; i++) {
      const j = i * 3;
      const phase = this.#phase[i] + time * this.#speed[i];
      // Montée lente qui boucle sur la hauteur + balancement latéral.
      const rise = ((time * 0.22 * this.#speed[i] + this.#base[j + 1]) % this.#height + this.#height) % this.#height;
      positions[j] = this.#base[j] + Math.sin(phase) * 0.18;
      positions[j + 1] = rise;
      positions[j + 2] = this.#base[j + 2] + Math.cos(phase * 0.8) * 0.18;
    }
    this.#points.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.#points.geometry.dispose();
    this.#points.material.dispose();
  }
}
