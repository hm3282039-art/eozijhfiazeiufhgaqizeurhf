import assert from 'node:assert/strict';
import {weapon,WEAPONS,useHealing,tickEquipment} from '../js/weapons.js';
import {fire,updateBullets} from '../js/entities.js';
import {SpatialGrid} from '../js/map.js';
import {liveCompetition,rankProgress,cupMatchScore,rankedScore} from '../js/competition.js';
import {createProgressStore} from '../js/cosmetics.js';
for(const type of ['shotgun','auto_shotgun','assault','burst','heavy','smg','p90','sniper','dmr','grenade','mini','shield','kit','slurp'])assert.ok(WEAPONS[type],type);
assert.ok(weapon('p90').magazine>weapon('smg').magazine);assert.ok(weapon('sniper').visionBonus>0);
const e={x:100,y:100,alive:true,team:0,inventory:[weapon('burst')],slot:0,cooldown:0},g={time:1,gracePeriod:0,bullets:[],fighters:[e],map:{grid:new SpatialGrid()},emitWave(){},spawnParticles(){}};fire(g,e,0);assert.equal(g.bullets.length,1);g.time=1.1;updateBullets(g,0);assert.equal(g.bullets.length,2);g.time=1.2;updateBullets(g,0);assert.equal(g.bullets.length,3);assert.equal(e.inventory[0].ammo,27);
const gun=weapon('sniper');e.inventory=[gun];e.cooldown=0;fire(g,e,0);assert.equal(gun.ammo,0);tickEquipment(e,gun.reload);assert.equal(gun.ammo,1);
const h={hp:90,shield:10,alive:true,inventory:[]};assert.ok(useHealing(h,weapon('slurp')));tickEquipment(h,10);assert.equal(h.hp,100);assert.equal(h.shield,30);
const target={x:150,y:100,r:11,alive:true,team:1,hp:100,shield:0,inventory:[]};g.fighters.push(target);g.loot=[];g.addFeed=()=>{};g.size=1;g.waves=[];g.bullets=[{x:140,y:100,vx:100,vy:0,left:100,damage:50,blast:100,owner:e}];updateBullets(g,.1);assert.ok(target.hp<100);
assert.equal(rankProgress(150).percent,50);assert.equal(rankProgress(4200).percent,null);for(const place of [80,40,20,8,1]){assert.equal(liveCompetition('cup',30,place,80,2).score,cupMatchScore(place,80,2).points);assert.equal(liveCompetition('ranked',700,place,80,2).delta,rankedScore(700,place,80,2).delta)}
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},store=createProgressStore(storage);store.setIdentity('Nova','solar');store.recordMatch({id:'s1',size:2,kills:3,won:true});store.recordMatch({id:'s2',size:4,kills:1});let restored=createProgressStore(storage);assert.equal(restored.profile.nickname,'Nova');assert.equal(restored.profile.banner,'solar');assert.equal(restored.profile.formatStats['2'].wins,1);assert.equal(restored.profile.formatStats['4'].kills,1);console.log('OK — arsenal, rafales, rechargement, explosif, Bleuvage, HUD et profil');
