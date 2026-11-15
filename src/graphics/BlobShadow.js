import * as THREE from 'three';
import { createCanvas } from './canvas.js';
import { clamp } from '../utils/math.js';

/** Hauteur de l'ombre au-dessus de la pelouse (juste au-dessus des pavés du chemin). */
const GROUND_OFFSET = 0.07;

let sharedTexture = null;
let sharedGeometry = null;

function getTexture() {
  if (sharedTexture) return sharedTexture;
  const size = 128;
  const { canvas, ctx } = createCanvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.75)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  sharedTexture = new THREE.CanvasTexture(canvas);
  return sharedTexture;
}

function getGeometry() {
  if (!sharedGeometry) {
    sharedGeometry = new THREE.PlaneGeometry(1, 1);
    sharedGeometry.rotateX(-Math.PI / 2);
  }
  return sharedGeometry;
}

/**
 * Ombre ronde et douce posée au sol sous un personnage (« blob shadow »).
 * Elle rétrécit et s'éclaircit quand le personnage s'élève : on lit tout de suite la hauteur du saut.
 */
export class BlobShadow {
  #baseRadius;
  #baseOpacity;

  constructor(radius = 0.8, opacity = 0.3) {
    this.#baseRadius = radius;
    this.#baseOpacity = opacity;

    this.mesh = new THREE.Mesh(
      getGeometry(),
      new THREE.MeshBasicMaterial({
        map: getTexture(),
        color: 0x0b2a12,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    this.mesh.name = 'BlobShadow';
    this.mesh.position.y = GROUND_OFFSET;
    this.mesh.renderOrder = 1;
    this.setHeight(0);
  }

  /** @param {number} height hauteur du personnage au-dessus du sol */
  setHeight(height) {
    const lift = clamp(height / 4, 0, 1);
    const scale = this.#baseRadius * 2 * (1 - lift * 0.45);
    this.mesh.scale.set(scale, 1, scale);
    this.mesh.material.opacity = this.#baseOpacity * (1 - lift * 0.6);
  }

  dispose() {
    this.mesh.material.dispose();
  }
}
