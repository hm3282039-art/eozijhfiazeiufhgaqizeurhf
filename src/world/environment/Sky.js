import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { createCanvas } from '../../graphics/canvas.js';
import { SUN_DIRECTION } from './Lighting.js';

const SKY_RADIUS = 700;

/** Remplit le dégradé du dôme à partir d'une palette (zénith / milieu / horizon). */
function paintDome(geometry, palette) {
  const zenith = new THREE.Color(palette.zenith);
  const mid = new THREE.Color(palette.mid);
  const horizon = new THREE.Color(palette.horizon);

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i++) {
    const height = position.getY(i) / SKY_RADIUS; // −1 (nadir) → +1 (zénith)
    if (height <= 0.02) {
      color.copy(horizon);
    } else if (height < 0.3) {
      color.copy(horizon).lerp(mid, (height - 0.02) / 0.28);
    } else {
      color.copy(mid).lerp(zenith, Math.min(1, (height - 0.3) / 0.55));
    }
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/** Dôme de ciel en dégradé (bleu vif au zénith → bleu très clair à l'horizon). */
function createDome() {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 32);
  paintDome(geometry, PALETTE.moods.day.sky);

  const dome = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  dome.name = 'SkyDome';
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  return dome;
}

/** Halo lumineux du soleil, aligné sur la direction de la lumière principale. */
function createSunGlow() {
  const size = 256;
  const { canvas, ctx } = createCanvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.16, 'rgba(255, 250, 220, 1)');
  gradient.addColorStop(0.24, 'rgba(255, 238, 170, 0.55)');
  gradient.addColorStop(0.55, 'rgba(255, 230, 150, 0.14)');
  gradient.addColorStop(1, 'rgba(255, 230, 150, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  sprite.name = 'SunGlow';
  sprite.position.copy(SUN_DIRECTION).multiplyScalar(SKY_RADIUS * 0.9);
  sprite.scale.setScalar(230);
  sprite.renderOrder = -9;
  return sprite;
}

/**
 * Ciel bleu lumineux + léger brouillard atmosphérique.
 * Deux ambiances (jour / coucher de soleil doré) entre lesquelles on glisse en douceur.
 * @param {THREE.Scene} scene reçoit la couleur de fond et le brouillard
 */
export function createSky(scene) {
  scene.background = new THREE.Color(PALETTE.moods.day.fog);
  scene.fog = new THREE.Fog(PALETTE.moods.day.fog, 75, 430);

  const group = new THREE.Group();
  group.name = 'Sky';
  const dome = createDome();
  const glow = createSunGlow();
  group.add(dome, glow);

  /** Ambiance visée (palette complète) et ambiance actuelle (interpolée). */
  let target = PALETTE.moods.day;
  const current = {
    zenith: new THREE.Color(PALETTE.moods.day.sky.zenith),
    mid: new THREE.Color(PALETTE.moods.day.sky.mid),
    horizon: new THREE.Color(PALETTE.moods.day.sky.horizon),
    fog: new THREE.Color(PALETTE.moods.day.fog),
    glow: new THREE.Color(PALETTE.moods.day.glow),
  };
  const targetColors = {
    zenith: new THREE.Color(),
    mid: new THREE.Color(),
    horizon: new THREE.Color(),
    fog: new THREE.Color(),
    glow: new THREE.Color(),
  };

  /** Bascule l'ambiance (le glissement se fait dans `update`). */
  const setMood = (mood) => {
    target = PALETTE.moods[mood] ?? PALETTE.moods.day;
    targetColors.zenith.set(target.sky.zenith);
    targetColors.mid.set(target.sky.mid);
    targetColors.horizon.set(target.sky.horizon);
    targetColors.fog.set(target.fog);
    targetColors.glow.set(target.glow);
  };

  const update = (dt) => {
    const t = Math.min(1, dt * 1.6);
    let settled = true;
    for (const key of Object.keys(current)) {
      current[key].lerp(targetColors[key], t);
      // Distance L1 canaux R,V,B (Color n'a pas de distanceTo).
      const d =
        Math.abs(current[key].r - targetColors[key].r) +
        Math.abs(current[key].g - targetColors[key].g) +
        Math.abs(current[key].b - targetColors[key].b);
      if (d > 0.001) settled = false;
    }
    if (settled) return;
    paintDome(dome.geometry, {
      zenith: `#${current.zenith.getHexString()}`,
      mid: `#${current.mid.getHexString()}`,
      horizon: `#${current.horizon.getHexString()}`,
    });
    dome.geometry.attributes.color.needsUpdate = true;
    scene.background.copy(current.fog);
    scene.fog.color.copy(current.fog);
    glow.material.color.copy(current.glow);
  };

  return { object3D: group, update, setMood };
}
