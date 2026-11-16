/**
 * Plan de la Zone 1 (Hub de départ).
 *
 * Repère : Y vers le haut, l'île est centrée sur X = 0.
 * Le spawn est au SUD (+Z) et la porte de la Zone 2 au NORD (−Z).
 */
export const WORLD = Object.freeze({
  island: {
    /** Limites de la pelouse. */
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

  eggPedestal: { x: -17.5, z: 3.5, radius: 3.5 },

  /**
   * Point d'arrivée du joueur, légèrement décalé par rapport à l'axe de l'île pour que
   * « avancer » dès le lancement longe la fontaine au lieu de buter dedans.
   *   yaw          orientation du joueur (0 = regarde vers +Z, c'est-à-dire vers la caméra de départ)
   *   formationYaw cap initial de la formation de pets : ils se placent à l'opposé de ce cap,
   *                donc ici ENTRE le joueur et la caméra, pour une jolie « photo d'équipe ».
   */
  spawn: { x: -1.8, z: 29.4, yaw: 0.2, formationYaw: 0.2 + Math.PI },

  /**
   * Zone 2 : une seconde île au nord, reliée à la Zone 1 par la porte.
   * Sa dalle (z jusqu'à −40) passe SOUS la pelouse de la Zone 1 : aucune couture visible,
   * et la bordure de pierres de la Zone 1 (avec son ouverture à la porte) reste en place.
   */
  zone2: {
    island: { minX: -30, maxX: 30, minZ: -96, maxZ: -40 },
    /** Point d'arrivée de la téléportation (juste derrière la porte, face au nord). */
    entrance: { x: 0, z: -48, yaw: Math.PI, formationYaw: 0 },
    /** Socle du Coffre Boss Géant, au fond de la Zone 2. */
    bossChest: { x: 0, z: -88 },
    /** Ligne de séparation entre les deux zones (pour le bandeau de zone). */
    boundaryZ: -42,
  },
});

/** Rectangle dans lequel le joueur (et ses pets) peuvent se déplacer. */
export function getWalkableBounds(margin = 0) {
  const { minX, maxX, minZ, maxZ, borderThickness } = WORLD.island;
  const zone2 = WORLD.zone2.island;
  return {
    minX: Math.min(minX, zone2.minX) + borderThickness + margin,
    maxX: Math.max(maxX, zone2.maxX) - borderThickness - margin,
    minZ: Math.min(minZ, zone2.minZ) + borderThickness + margin,
    maxZ: Math.max(maxZ, zone2.maxZ) - borderThickness - margin,
  };
}
