import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { lerp } from '../utils/math.js';

/**
 * Fabrique de géométries « douces » (coins arrondis partout, style Blender / PS99).
 * Les formes paramétrées par de simples nombres sont mises en cache et partagées.
 */
const cache = new Map();

function cached(key, factory) {
  let geometry = cache.get(key);
  if (!geometry) {
    geometry = factory();
    cache.set(key, geometry);
  }
  return geometry;
}

/** Cube aux arêtes très adoucies — la brique de base du style PS99. */
export function roundedBoxGeometry(width, height, depth, radius, segments = 4) {
  return cached(`rbox|${width}|${height}|${depth}|${radius}|${segments}`, () =>
    new RoundedBoxGeometry(width, height, depth, segments, radius));
}

export function sphereGeometry(radius = 1, widthSegments = 24, heightSegments = 16) {
  return cached(`sphere|${radius}|${widthSegments}|${heightSegments}`, () =>
    new THREE.SphereGeometry(radius, widthSegments, heightSegments));
}

export function cylinderGeometry(radiusTop, radiusBottom, height, radialSegments = 18) {
  return cached(`cyl|${radiusTop}|${radiusBottom}|${height}|${radialSegments}`, () =>
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments));
}

export function capsuleGeometry(radius, length, radialSegments = 14) {
  return cached(`capsule|${radius}|${length}|${radialSegments}`, () =>
    new THREE.CapsuleGeometry(radius, length, 6, radialSegments));
}

export function torusGeometry(radius, tube, arc = Math.PI * 2, tubularSegments = 48, radialSegments = 12) {
  return cached(`torus|${radius}|${tube}|${arc}|${tubularSegments}|${radialSegments}`, () =>
    new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc));
}

/**
 * Cône à pointe arrondie, posé sur sa base (y = 0 → y = height).
 * Sert aux oreilles de chat, aux cornes et aux piques.
 */
export function softConeGeometry(radius, height, tipRadius = radius * 0.4, radialSegments = 20) {
  return cached(`cone|${radius}|${height}|${tipRadius}|${radialSegments}`, () => {
    const rho = Math.min(tipRadius, radius * 0.95, height * 0.45);
    const centerY = height - rho;

    // Point de tangence entre le flanc du cône et la sphère de la pointe.
    const distance = Math.hypot(radius, centerY);
    const beta = Math.asin(Math.min(1, rho / distance));
    const theta = Math.atan2(centerY, -radius) - beta;
    const tangentLength = Math.sqrt(Math.max(distance * distance - rho * rho, 0));
    const tx = radius + tangentLength * Math.cos(theta);
    const ty = tangentLength * Math.sin(theta);
    const startAngle = Math.atan2(ty - centerY, tx);

    const points = [new THREE.Vector2(0, 0), new THREE.Vector2(radius, 0), new THREE.Vector2(tx, ty)];
    const steps = 7;
    for (let i = 1; i <= steps; i++) {
      const angle = lerp(startAngle, Math.PI / 2, i / steps);
      const x = i === steps ? 0 : rho * Math.cos(angle);
      points.push(new THREE.Vector2(x, centerY + rho * Math.sin(angle)));
    }
    return new THREE.LatheGeometry(points, radialSegments);
  });
}

/**
 * Cylindre aux arêtes arrondies, posé sur sa base (y = 0 → y = height).
 * Sert aux socles, margelles et piliers ronds.
 */
export function softCylinderGeometry(radius, height, bevel = 0.12, radialSegments = 36) {
  return cached(`softcyl|${radius}|${height}|${bevel}|${radialSegments}`, () => {
    const b = Math.min(bevel, radius * 0.5, height * 0.5);
    const points = [new THREE.Vector2(0, 0)];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const angle = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
      points.push(new THREE.Vector2(radius - b + Math.cos(angle) * b, b + Math.sin(angle) * b));
    }
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * (Math.PI / 2);
      points.push(new THREE.Vector2(radius - b + Math.cos(angle) * b, height - b + Math.sin(angle) * b));
    }
    points.push(new THREE.Vector2(0, height));
    return new THREE.LatheGeometry(points, radialSegments);
  });
}

/** Œuf centré sur l'origine (plus large en bas, plus pointu en haut). */
export function eggGeometry(radius, height, radialSegments = 40) {
  return cached(`egg|${radius}|${height}|${radialSegments}`, () => {
    const points = [];
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI;
      const r = i === 0 || i === steps ? 0 : radius * Math.sin(t) * (1 + 0.22 * Math.cos(t));
      points.push(new THREE.Vector2(r, -Math.cos(t) * height * 0.5));
    }
    return new THREE.LatheGeometry(points, radialSegments);
  });
}

/**
 * Tube dont le rayon varie le long d'une courbe (queues de pets).
 * @param {THREE.Curve<THREE.Vector3>} curve
 */
export function taperedTubeGeometry(curve, {
  radiusStart = 0.1,
  radiusEnd = 0.05,
  tubularSegments = 24,
  radialSegments = 10,
} = {}) {
  // Tube de rayon 1 : chaque sommet est à (centre + normale) → on rééchelonne anneau par anneau.
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, 1, radialSegments, false);
  const position = geometry.attributes.position;
  const center = new THREE.Vector3();
  const vertex = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, center);
    const radius = lerp(radiusStart, radiusEnd, t);
    for (let j = 0; j <= radialSegments; j++) {
      const index = i * (radialSegments + 1) + j;
      vertex.fromBufferAttribute(position, index).sub(center).multiplyScalar(radius).add(center);
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
  }
  position.needsUpdate = true;
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
}
