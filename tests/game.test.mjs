import assert from 'node:assert/strict';
import { WORLD, createMap, inBush, collides } from '../js/map.js';
import { createFighters, createLoot, damage, eliminate } from '../js/entities.js';

const map = createMap();
assert.equal(WORLD, 9600);
assert.equal(map.pois.length, 10);
assert.equal(collides(map, 3000, 3000), false); 
assert.ok(map.compounds.length>200);
assert.ok(map.bushes.length>800);
assert.ok(map.walls.some(w=>w.type==='crate'));
const bush = map.bushes[0];
assert.equal(inBush(map, { x: bush.x + 10, y: bush.y + 10 }), true);
assert.equal(createLoot(map, 'royale').filter(l => l.mythic).length, 1);
for (const mode of ['royale', 'zone', 'night']) {
  for (const size of [1, 2, 3, 4]) {
    const fighters = createFighters(map, size, mode);
    assert.equal(fighters.length, 80);
    assert.equal(fighters.filter(f => f.ally).length, size);
    assert.equal(fighters[0].hp, 100);
    assert.equal(fighters[0].alive, true);
    const game = { size, fighters, loot: [], addFeed() {}, placement: null };
    damage(game, fighters[0], 1000, null);
    if (size > 1) {
      assert.equal(fighters[0].knocked, true);
      assert.equal(fighters[0].alive, true);
      assert.equal(game.placement, null);
      // Eliminating a KO teammate must not end the match while another ally survives.
      eliminate(game, fighters[0], null);
      assert.equal(game.placement, null);
      for (const ally of fighters.filter(f => f.ally && f.alive)) damage(game, ally, 1000, null);
    }
    assert.equal(fighters.some(f => f.ally && f.alive), false);
    assert.equal(game.placement, Math.ceil(80 / size));
  }
}
console.log('OK — 12 configurations, KO, élimination, classement, buissons et carte');
