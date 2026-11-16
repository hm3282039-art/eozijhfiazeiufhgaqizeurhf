/**
 * Plan des ZONES du jeu (structuré, objets propres).
 *
 * Repère : Y vers le haut, les îles sont alignées sur l'axe nord–sud (−Z = nord).
 *   Zone 1 (Spawn)        → île centrale, sud
 *   Zone 2 (Forêt Sakura) → île au nord, déblocable à 1 000 pièces
 *   Zone 3 (Mines Cristal) → île au nord de la Zone 2, déblocable à 10 000 pièces
 */
export const WORLD = Object.freeze({
  island: {
    /** Limites de la pelouse de la Zone 1. */
    minX: -30,
    maxX: 30,
    minZ: -42,
    maxZ: 44,
    /** Épaisseur de la bordure de pierre (zone non marchable). */
    borderThickness: 2.3,
    cliffHeight: 9,
  },

  waterLevel: -7.5,

  plaza: { x: 0, z: 22, radius: 9.6 },
  fountain: { x: 0, z: 22, radius: 3.5 },
  arch: { x: 0, z: 10.6, halfSpan: 5.3 },

  path: { halfWidth: 3.1, startZ: 13.4, endZ: -42 },

  /** Porte Zone 1 → Zone 2 (au nord de la Zone 1). */
  gate: {
    x: 0,
    z: -40.4,
    /** Demi-largeur de l'ouverture (entre les deux piliers). */
    halfOpening: 3.6,
    pillarSize: 2.2,
    height: 7.4,
    price: 1000,
    label: 'ZONE 2',
  },

  /** Porte Zone 2 → Zone 3 (au nord de la Zone 2). */
  gate2: {
    x: 0,
    z: -94.6,
    halfOpening: 3.6,
    pillarSize: 2.2,
    height: 7.4,
    price: 10000,
    label: 'ZONE 3',
  },

  /** Les 3 piédestaux des œufs d'éclosion, autour de la fontaine (Zone 1). */
  eggPedestals: [
    { x: -13, z: 30 },
    { x: 0, z: 31 },
    { x: 13, z: 30 },
  ],

  /** Piédestal décoratif (œuf géant) au centre de la place. */
  eggPedestal: { x: 0, z: 22, radius: 3.5 },

  /**
   * Point d'arrivée du joueur, légèrement décalé par rapport à l'axe de l'île pour que
   * « avancer » dès le lancement longe la fontaine au lieu de buter dedans.
   *   yaw          orientation du joueur (0 = regarde vers +Z, c'est-à-dire vers la caméra de départ)
   *   formationYaw cap initial de la formation de pets : ils se placent à l'opposé de ce cap,
   *                donc ici ENTRE le joueur et la caméra, pour une jolie « photo d'équipe ».
   */
  spawn: { x: -1.8, z: 29.4, yaw: 0.2, formationYaw: 0.2 + Math.PI },

  /** Zone 2 : île au nord, reliée à la Zone 1 par la porte. */
  zone2: {
    island: { minX: -30, maxX: 30, minZ: -96, maxZ: -40 },
    /** Point d'arrivée de la téléportation (juste derrière la porte, face au nord). */
    entrance: { x: 0, z: -48, yaw: Math.PI, formationYaw: 0 },
    /** Ligne de séparation entre les zones (pour le bandeau de zone). */
    boundaryZ: -42,
    /** Socle décoratif du Coffre Boss (le boss n'est pas spawné en début de jeu). */
    bossChest: { x: 0, z: -88 },
  },

  /** Zone 3 : « Mines de Cristal & Or », au nord de la Zone 2. */
  zone3: {
    island: { minX: -34, maxX: 34, minZ: -152, maxZ: -96 },
    /** Point d'arrivée de la téléportation. */
    entrance: { x: 0, z: -104, yaw: Math.PI, formationYaw: 0 },
    /** Ligne de séparation Zone 2 / Zone 3. */
    boundaryZ: -96,
  },
});

/** Rectangle dans lequel le joueur (et ses pets) peuvent se déplacer. */
export function getWalkableBounds(margin = 0) {
  const { minX, maxX, minZ, maxZ, borderThickness } = WORLD.island;
  const zone2 = WORLD.zone2.island;
  const zone3 = WORLD.zone3.island;
  return {
    minX: Math.min(minX, zone2.minX, zone3.minX) + borderThickness + margin,
    maxX: Math.max(maxX, zone2.maxX, zone3.maxX) - borderThickness - margin,
    minZ: Math.min(minZ, zone2.minZ, zone3.minZ) + borderThickness + margin,
    maxZ: Math.max(maxZ, zone2.maxZ, zone3.maxZ) - borderThickness - margin,
  };
}
