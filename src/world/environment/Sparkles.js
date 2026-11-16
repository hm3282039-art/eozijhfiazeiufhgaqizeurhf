import { SparkleCloud } from '../../graphics/SparkleCloud.js';

/**
 * Petites particules brillantes dorées et blanches qui flottent doucement
 * dans l'air autour du spawn (ambiance magique façon PS99).
 */
export function createSparkles() {
  const cloud = new SparkleCloud({
    count: 90,
    radius: 17,
    height: 8,
    size: 0.3,
    colors: ['#ffd94d', '#fff3b0', '#ffffff', '#ffe9a8'],
    seed: 1234,
  });
  cloud.object3D.position.set(0, 0.3, 22);
  cloud.object3D.name = 'SpawnSparkles';

  return {
    object3D: cloud.object3D,
    update: (dt, time) => cloud.update(dt, time),
  };
}
