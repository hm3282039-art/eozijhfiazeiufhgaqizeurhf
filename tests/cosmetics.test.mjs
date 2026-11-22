import assert from 'node:assert/strict';
import {CATALOG,createProgressStore,PROFILE_KEY,COSMETICS_KEY} from '../js/cosmetics.js';
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
const storage=memory(),s=createProgressStore(storage);
assert.deepEqual(new Set(CATALOG.map(i=>i.category)),new Set(['skin','beam','trail','emote']));
assert.equal(s.cosmetics.coins,600);assert.equal(s.cosmetics.equipped.skin,'skin_recruit');
assert.equal(s.equip('skin_cobalt').ok,false);assert.equal(s.unlock('skin_cobalt').ok,true);assert.equal(s.cosmetics.coins,420);assert.equal(s.equip('skin_cobalt').ok,true);
assert.equal(s.unlock('skin_cobalt').ok,true);assert.equal(s.cosmetics.coins,420);
assert.equal(s.unlock('skin_champion').ok,false);assert.equal(s.unlock('skin_icon').ok,false);
assert.equal(s.recordMatch({id:'match-1',won:true,kills:2}),200);assert.equal(s.recordMatch({id:'match-1',won:true,kills:2}),0);
assert.equal(s.profile.matchesPlayed,1);assert.equal(s.profile.wins,1);assert.equal(s.profile.kills,2);assert.equal(s.unlock('skin_champion').ok,true);assert.equal(s.cosmetics.coins,620);
assert.equal(s.recordMatch({id:'abandon',abandoned:true,kills:1}),0);assert.equal(s.profile.matchesPlayed,2);assert.equal(s.profile.kills,3);
s.grantDebug();assert.equal(s.profile.pr,100);assert.equal(s.cosmetics.coins,1120);
const restored=createProgressStore(storage);assert.equal(restored.cosmetics.equipped.skin,'skin_cobalt');assert.equal(restored.profile.wins,1);assert.equal(restored.cosmetics.coins,1120);assert.ok(storage.getItem(PROFILE_KEY));assert.ok(storage.getItem(COSMETICS_KEY));
const empty=createProgressStore(memory());empty.unlock('skin_orchid');empty.unlock('beam_gold');assert.equal(empty.unlock('emote_heart').ok,false);assert.equal(empty.cosmetics.coins,0);
const broken=createProgressStore({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});assert.equal(broken.isPersistent(),false);assert.equal(broken.equip('skin_ranger').ok,true);
console.log('OK — catalogue, achats, équipement, récompenses, sauvegarde et idempotence');
