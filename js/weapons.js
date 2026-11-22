export const RARITIES=[{name:'GRIS',color:'#aab4ad',mult:1},{name:'VERT',color:'#79c76b',mult:1.08},{name:'BLEU',color:'#5eabe4',mult:1.16},{name:'VIOLET',color:'#b584e6',mult:1.25},{name:'OR',color:'#efbd54',mult:1.34},{name:'MYTHIQUE',color:'#ff8051',mult:1.5}];
// Ammunition reserves are unlimited; magazines reload automatically when empty.
export const WEAPONS={
 assault:{name:'FUSIL D’ASSAUT CLASSIQUE',icon:'⌁',damage:18,rate:.22,range:480,speed:950,spread:.075,pellets:1,magazine:30,reload:1.8},
 burst:{name:'FUSIL À RAFALE',damage:17,rate:.62,range:520,speed:1000,spread:.05,pellets:1,magazine:30,reload:2,burst:3},
 heavy:{name:'FUSIL D’ASSAUT LOURD',damage:29,rate:.36,range:510,speed:950,spread:.09,pellets:1,magazine:20,reload:2.3},
 smg:{name:'PM TACTIQUE',icon:'≋',damage:10,rate:.105,range:330,speed:900,spread:.13,pellets:1,magazine:25,reload:1.5},
 p90:{name:'PM P90',damage:9,rate:.075,range:340,speed:920,spread:.14,pellets:1,magazine:50,reload:2.3},
 shotgun:{name:'POMPE CHASSEUR',icon:'╾',damage:13,rate:1.05,range:210,speed:800,spread:.25,pellets:7,magazine:5,reload:2},
 auto_shotgun:{name:'POMPE AUTOMATIQUE',damage:8,rate:.35,range:185,speed:800,spread:.3,pellets:7,magazine:8,reload:2.2},
 dmr:{name:'PRÉCISION SEMI-AUTO',icon:'╼',damage:27,rate:.38,range:620,speed:1100,spread:.035,pellets:1,magazine:12,reload:2},
 pistol:{name:'PISTOLET LOURD',icon:'╾',damage:24,rate:.32,range:350,speed:950,spread:.06,pellets:1,magazine:12,reload:1.5},
 sniper:{name:'SNIPER COUP PAR COUP',icon:'╼',damage:90,rate:1.4,range:850,speed:1350,spread:.012,pellets:1,magazine:1,reload:2.3,visionBonus:180},
 grenade:{name:'LANCE-GRENADES',damage:55,rate:1.05,range:430,speed:500,spread:.025,pellets:1,magazine:6,reload:2.8,blast:100},
 mini:{name:'MINI POTION',icon:'▰',heal:'mini'},shield:{name:'GROSSE POTION',icon:'▰',heal:'shield'},kit:{name:'KIT DE SOIN',icon:'✚',heal:'kit'},slurp:{name:'BLEUVAGE',icon:'▰',heal:'slurp'},smoke:{name:'GRENADE FUMIGÈNE',icon:'◌',heal:'smoke'}};
export function weapon(type,rarity=0){const spec=WEAPONS[type];return{type,rarity,...spec,...(spec?.magazine?{ammo:spec.magazine,reloadLeft:0}:{})}}
export function randomWeapon(max=4){const types=['assault','burst','heavy','smg','p90','shotgun','auto_shotgun','sniper','dmr','pistol','grenade','mini','mini','shield','shield','kit','kit','slurp','smoke'];return weapon(types[Math.floor(Math.random()*types.length)],Math.min(max,Math.floor(Math.random()*Math.random()*(max+1))))}
export function useHealing(entity,item){if(item.type==='mini'&&entity.shield<50){entity.shield=Math.min(50,entity.shield+25);return true}if(item.type==='shield'&&entity.shield<100){entity.shield=Math.min(100,entity.shield+50);return true}if(item.type==='kit'&&entity.hp<100){entity.hp=100;return true}if(item.type==='slurp'&&(entity.hp<100||entity.shield<100)){entity.slurpTime=10;return true}return false}
export function tickEquipment(entity,dt){for(const item of entity.inventory||[]){if(item?.reloadLeft>0){item.reloadLeft=Math.max(0,item.reloadLeft-dt);if(item.reloadLeft===0)item.ammo=item.magazine}}if(entity.alive&&!entity.knocked&&entity.slurpTime>0){const step=Math.min(dt,entity.slurpTime);entity.slurpTime-=step;const healing=3*step;if(entity.hp<100){const used=Math.min(100-entity.hp,healing);entity.hp+=used;entity.shield=Math.min(100,entity.shield+healing-used)}else entity.shield=Math.min(100,entity.shield+healing)}}
