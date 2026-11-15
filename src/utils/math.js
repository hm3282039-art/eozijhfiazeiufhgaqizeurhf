/** Petites fonctions mathématiques partagées par tous les systèmes. */

export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Facteur d'interpolation indépendant du framerate.
 * `lerp(a, b, dampFactor(k, dt))` converge à la même vitesse à 30 ou 144 FPS.
 */
export function dampFactor(sharpness, dt) {
  return 1 - Math.exp(-sharpness * dt);
}

/** Lerp exponentiel indépendant du framerate. */
export function damp(current, target, sharpness, dt) {
  return lerp(current, target, dampFactor(sharpness, dt));
}

/** Plus petit écart signé entre deux angles (résultat dans ]−π, π]). */
export function angleDelta(from, to) {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta <= -Math.PI) delta += TAU;
  return delta;
}

/** Lerp exponentiel entre deux angles en passant par le chemin le plus court. */
export function dampAngle(current, target, sharpness, dt) {
  return current + angleDelta(current, target) * dampFactor(sharpness, dt);
}
