/**
 * Réglages globaux du jeu (rendu, caméra, joueur, pets).
 * Tout ce qui se « tune » est ici : aucune valeur magique dans les systèmes.
 */
export const GAME_CONFIG = Object.freeze({
  renderer: {
    maxPixelRatio: 2,
    toneMappingExposure: 1.0,
    shadowMapSize: 2048,
    /** Demi-largeur (en unités monde) de la zone couverte par l'ombre du soleil. */
    shadowRange: 34,
  },

  camera: {
    fov: 55,
    /** En dessous de ce rapport largeur / hauteur, le champ vertical s'élargit (fenêtre étroite). */
    fovReferenceAspect: 1.25,
    maxFov: 80,
    near: 0.1,
    far: 900,
    minDistance: 5,
    maxDistance: 36,
    startDistance: 13,
    /** Angle horizontal de départ autour du joueur (radians, 0 = caméra au sud). */
    startAzimuth: 0.42,
    /** Angle vertical de départ (radians depuis la verticale). */
    startPolar: 1.27,
    minPolar: 0.25,
    maxPolar: 1.5,
    rotateSpeed: 0.7,
    zoomSpeed: 1.6,
    damping: 0.12,
    /** Hauteur du point visé au-dessus des pieds du joueur. */
    focusHeight: 2.1,
    followSharpness: 16,
    verticalSharpness: 7,
    zoomSharpness: 10,
  },

  player: {
    walkSpeed: 10,
    groundAcceleration: 14,
    airAcceleration: 5,
    turnSharpness: 14,
    jumpSpeed: 14.5,
    gravity: 40,
    coyoteTime: 0.1,
    jumpBufferTime: 0.12,
    radius: 0.55,
  },

  pets: {
    /** Nombre maximum de pets possédés (starters + pets de test / boutique). */
    maxOwned: 12,
    formation: {
      maxColumns: 4,
      /** Distance entre le joueur et la première rangée. */
      followDistance: 2.7,
      columnSpacing: 1.95,
      rowSpacing: 1.9,
      /** Réactivité du cap de la formation quand le joueur change de direction. */
      turnSharpness: 5.5,
      /** Vitesse de pivot maximale de la formation autour du joueur (rad/s). */
      maxTurnRate: 6,
    },
    /** Rayon de collision d'un pet (obstacles du décor). */
    radius: 0.6,
    /** Espace minimal laissé entre deux pets, en plus de leurs rayons. */
    separationGap: 0.1,
    followSharpness: 6.5,
    /** Vitesse maximale d'un pet (unités/s) : environ 2× celle du joueur, pour le rattraper. */
    maxSpeed: 21,
    turnSharpness: 10,
    /** Vitesse (unités/s) au-dessus de laquelle un pet est considéré « en mouvement ». */
    moveThreshold: 0.75,
    hop: {
      frequency: 10.5,
      height: 0.42,
      tilt: 0.16,
    },
    idle: {
      breathSpeed: 2.3,
      breathAmount: 0.028,
    },
    blink: { minDelay: 1.8, maxDelay: 5.2, duration: 0.13 },
    /** Largeur (px) de la texture de visage dessinée sur canvas. */
    faceTextureWidth: 1024,
    /** Taille cible (plus grande dimension) d'un modèle .glb une fois normalisé. */
    modelTargetSize: 1.45,
  },

  wallet: {
    startCoins: 0,
    startDiamonds: 0,
  },
});
