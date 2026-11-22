import assert from 'node:assert/strict';
import {createMap,dist,WORLD} from '../js/map.js';
import {interact,createFighters,fire} from '../js/entities.js';
import {weapon} from '../js/weapons.js';
import {createStorm,updateStorm,nextZone} from '../js/storm.js';
const rifle=weapon('assault'),pump=weapon('shotgun'),potion=weapon('mini'),sniper=weapon('sniper');
const p={x:100,y:100,alive:true,knocked:false,team:0,slot:0,inventory:[rifle,null,null],shield:0,hp:100};
const g={fighters:[p],loot:[{x:105,y:100,item:pump}],time:0};
assert.equal(interact(g,p),true);assert.equal(p.inventory[0],rifle);assert.equal(p.inventory[1],pump);assert.equal(p.slot,0);
g.loot.push({x:105,y:100,item:potion});assert.equal(interact(g,p),true);assert.equal(p.inventory[2],potion);assert.equal(p.inventory[0],rifle);
const item={x:105,y:100,item:sniper};g.loot.push(item);assert.equal(interact(g,p),false);assert.equal(p.inventory[0],rifle);assert.equal(g.loot[0],item);
assert.equal(interact(g,p),true);assert.equal(p.inventory[0],sniper);assert.equal(g.loot.length,1);assert.equal(g.loot[0].item,rifle);
// A changed slot or expired confirmation cannot replace anything silently.
g.time=1;assert.equal(interact(g,p),false);p.slot=1;assert.equal(interact(g,p),false);assert.equal(p.inventory[1],pump);g.time=5;assert.equal(interact(g,p),false);assert.equal(p.inventory[1],pump);assert.equal(interact(g,p),true);assert.equal(p.inventory[1],rifle);assert.equal(g.loot[0].item,pump);
const shooter={x:100,y:100,inventory:[weapon('assault')],slot:0,cooldown:0,knocked:false,player:false};const battle={time:0,gracePeriod:8,bullets:[],emitWave(){},spawnParticles(){}};fire(battle,shooter,0);assert.equal(battle.bullets.length,0);battle.time=8;fire(battle,shooter,0);assert.equal(battle.bullets.length,1);
const map=createMap();assert.equal(createFighters(map,1,'zone',true).length,32);for(const mode of ['royale','zone'])for(const size of [1,2,3,4]){const bots=createFighters(map,size,mode);for(let i=0;i<bots.length;i++)for(let j=i+1;j<bots.length;j++)if(bots[i].team!==bots[j].team)assert.ok(dist(bots[i],bots[j])>190);}
let storm=createStorm('royale');assert.equal(storm.x,WORLD/2);for(let i=0;i<15;i++){const next=nextZone(storm);assert.ok(dist(storm,next)+next.radius<=storm.radius+.00001);storm=next}
const z=createStorm('zone');let old=z.phase;assert.equal(updateStorm(z,z.timer+1,'zone'),true);assert.equal(z.phase,old+1);assert.equal(z.timer,50);
console.log('OK — ramassage sans perte, remplacement explicite, spawns séparés et prochaines zones');
