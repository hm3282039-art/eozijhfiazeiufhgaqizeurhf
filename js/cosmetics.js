import {rankFor,rankedScore,cupMatchScore,cupStandings,cupRewards,CUPS,cupFor,eligibleCup} from './competition.js';
// Cosmetics and progression are local preparation data, not a real-money shop.
export const CATALOG = [
  {id:'skin_recruit',name:'Recrue solaire',category:'skin',rarity:'Commun',cost:0,initial:true,color:'#ffd961',icon:'♟'},
  {id:'skin_ranger',name:'Ranger menthe',category:'skin',rarity:'Commun',cost:0,initial:true,color:'#62dac2',icon:'♟'},
  {id:'skin_cobalt',name:'Éclaireur cobalt',category:'skin',rarity:'Rare',cost:180,color:'#5e9df5',icon:'♟'},
  {id:'skin_orchid',name:'Agent orchidée',category:'skin',rarity:'Épique',cost:300,color:'#cc84ec',icon:'♟'},
  {id:'skin_blaze',name:'Pilote braise',category:'skin',rarity:'Rare',cost:220,color:'#f47456',icon:'♟'},
  {id:'skin_arctic',name:'Sentinelle arctique',category:'skin',rarity:'Épique',cost:320,color:'#8adfe9',icon:'♟'},
  {id:'skin_eclipse',name:'Éclipse royale',category:'skin',rarity:'Légendaire',cost:450,color:'#9c80ed',icon:'♟'},
  {id:'skin_champion',name:'Champion doré',category:'skin',rarity:'Légendaire',condition:{type:'wins',value:1,label:'Remporter un Top 1'},color:'#ffad32',icon:'♟'},
  {id:'skin_icon',name:'Icône de la Cup',category:'skin',rarity:'Compétitif/Icon',condition:{type:'futureCup',label:'Top 10 en Cup locale'},color:'#fa6d95',icon:'♟'},
  {id:'beam_tactical',name:'Blanc tactique',category:'beam',rarity:'Commun',cost:0,initial:true,color:'#ddffe1',icon:'◢'},
  {id:'beam_blue',name:'Bleu néon',category:'beam',rarity:'Rare',cost:120,color:'#55cfff',icon:'◢'},
  {id:'beam_violet',name:'Violet spectral',category:'beam',rarity:'Épique',cost:200,color:'#c68cff',icon:'◢'},
  {id:'beam_gold',name:'Or solaire',category:'beam',rarity:'Légendaire',cost:300,color:'#ffd45a',icon:'◢'},
  {id:'trail_dust',name:'Poussière',category:'trail',rarity:'Commun',cost:0,initial:true,color:'#e1e4ba',icon:'⋰'},
  {id:'trail_leaves',name:'Feuilles',category:'trail',rarity:'Rare',cost:90,color:'#8af58a',icon:'✿'},
  {id:'trail_stars',name:'Étoiles',category:'trail',rarity:'Épique',cost:180,color:'#ffdd70',icon:'✦'},
  {id:'emote_wave',name:'Salut !',category:'emote',rarity:'Commun',cost:0,initial:true,color:'#fce287',icon:'✋'},
  {id:'emote_gg',name:'Bien joué',category:'emote',rarity:'Rare',cost:100,color:'#92e6ff',icon:'★'},
  {id:'emote_heart',name:'Cœur',category:'emote',rarity:'Épique',cost:160,color:'#ff8db6',icon:'♥'},
  {id:'emote_crown',name:'Couronne',category:'emote',rarity:'Compétitif/Icon',condition:{type:'futurePR',label:'100 PR simulés'},color:'#ffdb6e',icon:'♛'}
];
const skinStyles={skin_recruit:'recruit',skin_ranger:'hood',skin_cobalt:'visor',skin_orchid:'cape',skin_blaze:'pilot',skin_arctic:'armor',skin_eclipse:'cape',skin_champion:'crown',skin_icon:'icon'};
for(const item of CATALOG)if(item.category==='skin')item.style=skinStyles[item.id]||'recruit';
export const CATEGORIES = {skin:'Skins',beam:'Faisceaux',trail:'Traînées',emote:'Emotes'};
export const PROFILE_KEY='playerProfile', COSMETICS_KEY='lastSignalCosmetics';
const defaults={skin:'skin_recruit',beam:'beam_tactical',trail:'trail_dust',emote:'emote_wave'};
const profileDefault=()=>({rank:'Non classé',rankPoints:0,pr:0,earnings:0,wins:0,kills:0,matchesPlayed:0,cupHistory:[],activeCup:null,lastResult:null,processedMatches:[],nickname:'JOUEUR',banner:'aurora',formatStats:{},rankProtection:0,selectedCupId:'solo',cupSessions:{},legacyCup:null});
const cosmeticDefault=()=>({coins:600,unlocked:CATALOG.filter(item=>item.initial).map(item=>item.id),equipped:{...defaults}});
const itemById=id=>CATALOG.find(item=>item.id===id);
const safeNumber=value=>Number.isFinite(value)&&value>=0?Math.floor(value):0;
export function createProgressStore(storage){
  let persistent=true;
  const read=key=>{try{return JSON.parse(storage?.getItem(key)||'null')}catch{persistent=false;return null}};
  const rawProfile=read(PROFILE_KEY),rawCosmetics=read(COSMETICS_KEY);
  const profile=profileDefault();
  if(rawProfile&&typeof rawProfile==='object'){
    profile.nickname=typeof rawProfile.nickname==='string'?rawProfile.nickname.slice(0,20):'JOUEUR';profile.banner=['aurora','solar','night'].includes(rawProfile.banner)?rawProfile.banner:'aurora';if(rawProfile.formatStats&&typeof rawProfile.formatStats==='object')for(const k of ['1','2','3','4']){const v=rawProfile.formatStats[k];if(v&&typeof v==='object')profile.formatStats[k]={matches:safeNumber(v.matches),wins:safeNumber(v.wins),kills:safeNumber(v.kills),bestCup:Number.isFinite(v.bestCup)&&v.bestCup>0?Math.floor(v.bestCup):null}}
    profile.rank=typeof rawProfile.rank==='string'?rawProfile.rank:profile.rank;
    for(const key of ['rankPoints','pr','earnings','wins','kills','matchesPlayed'])profile[key]=safeNumber(rawProfile[key]);
    profile.cupHistory=Array.isArray(rawProfile.cupHistory)?rawProfile.cupHistory:[];
    profile.rankProtection=Math.min(2,safeNumber(rawProfile.rankProtection));profile.selectedCupId=CUPS.some(c=>c.id===rawProfile.selectedCupId)?rawProfile.selectedCupId:'solo';
    if(rawProfile.cupSessions&&typeof rawProfile.cupSessions==='object'){for(const event of CUPS){const cup=rawProfile.cupSessions[event.id];if(cup&&Array.isArray(cup.matches)){const matches=cup.matches.slice(0,10);profile.cupSessions[event.id]={id:String(cup.id||'cup'),eventId:event.id,matches,points:safeNumber(cup.points),complete:!!cup.complete||matches.length>=10}}}profile.legacyCup=rawProfile.legacyCup||null}
    else if(rawProfile.activeCup&&Array.isArray(rawProfile.activeCup.matches)){profile.legacyCup={...rawProfile.activeCup,archiveReason:'Ancien barème 3.0 : session archivée sans conversion'};}
    profile.activeCup=profile.cupSessions[profile.selectedCupId]||null;
    profile.lastResult=rawProfile.lastResult&&typeof rawProfile.lastResult==='object'?rawProfile.lastResult:null;
    profile.processedMatches=Array.isArray(rawProfile.processedMatches)?rawProfile.processedMatches.filter(id=>typeof id==='string').slice(-100):[];
  }
  profile.rank=rankFor(profile.rankPoints).name;
  const cosmetics=cosmeticDefault();
  if(rawCosmetics&&typeof rawCosmetics==='object'){
    if(Number.isFinite(rawCosmetics.coins))cosmetics.coins=safeNumber(rawCosmetics.coins);
    if(Array.isArray(rawCosmetics.unlocked))cosmetics.unlocked=[...new Set([...cosmetics.unlocked,...rawCosmetics.unlocked.filter(id=>itemById(id))])];
    if(rawCosmetics.equipped&&typeof rawCosmetics.equipped==='object')for(const category of Object.keys(defaults)){
      const id=rawCosmetics.equipped[category],item=itemById(id);
      if(item?.category===category&&cosmetics.unlocked.includes(id))cosmetics.equipped[category]=id;
    }
  }
  const save=()=>{try{if(!storage){persistent=false;return}storage.setItem(PROFILE_KEY,JSON.stringify(profile));storage.setItem(COSMETICS_KEY,JSON.stringify(cosmetics))}catch{persistent=false}};
  for(const id of ['skin_champion','skin_icon']){const item=itemById(id);if((id==='skin_champion'&&profile.wins>0)||(id==='skin_icon'&&profile.cupHistory.some(cup=>cup.place<=10)))if(!cosmetics.unlocked.includes(id))cosmetics.unlocked.push(id)}
  save();
  function canUnlockCondition(item){const c=item?.condition;return !c||(c.type==='wins'&&profile.wins>=c.value)||(c.type==='futureCup'&&profile.cupHistory.some(cup=>cup.place<=10))||(c.type==='futurePR'&&profile.pr>=100)}
  function unlock(id){const item=itemById(id);if(!item)return{ok:false,message:'Objet introuvable.'};if(cosmetics.unlocked.includes(id))return{ok:true,message:'Objet déjà débloqué.'};
    if(item.condition){if(!canUnlockCondition(item))return{ok:false,message:item.condition.label+' : condition non remplie.'}}
    else if(cosmetics.coins<(item.cost||0))return{ok:false,message:'Pas assez de pièces de test.'};
    if(!item.condition)cosmetics.coins-=item.cost||0;cosmetics.unlocked.push(id);save();return{ok:true,message:`${item.name} débloqué !`}}
  function equip(id){const item=itemById(id);if(!item||!cosmetics.unlocked.includes(id))return{ok:false,message:'Débloque cet objet avant de l’équiper.'};cosmetics.equipped[item.category]=id;save();return{ok:true,message:`${item.name} équipé !`}}
  function selectCup(id){const event=CUPS.find(c=>c.id===id);if(!event||!eligibleCup(profile.rankPoints,event))return false;profile.selectedCupId=id;profile.activeCup=profile.cupSessions[id]||null;save();return true}
  function canPlayCup(){const event=cupFor(profile.selectedCupId),cup=profile.cupSessions[event.id];return eligibleCup(profile.rankPoints,event)&&!cup?.complete&&(cup?.matches.length||0)<10}
  function startCup(){if(!canPlayCup())return null;const id=profile.selectedCupId;if(!profile.cupSessions[id])profile.cupSessions[id]={id:`cup-${Date.now()}-${Math.random().toString(36).slice(2)}`,eventId:id,matches:[],points:0,complete:false};profile.activeCup=profile.cupSessions[id];save();return profile.activeCup}
  function resetCup(){const old=profile.cupSessions[profile.selectedCupId];if(old&&!old.complete)return false;delete profile.cupSessions[profile.selectedCupId];profile.activeCup=null;save();return true}
  function recordMatch({id,won=false,kills=0,abandoned=false,scope='normal',size=1,placement=80,teams=80,cupId=profile.selectedCupId}){if(!id||profile.processedMatches.includes(id))return 0;let cup=null;if(scope==='cup'){if(cupId!==profile.selectedCupId||size!==cupFor(cupId).size||!canPlayCup())return 0;cup=startCup();if(!cup)return 0}profile.processedMatches.push(id);if(profile.processedMatches.length>100)profile.processedMatches.shift();profile.matchesPlayed++;const format=String([1,2,3,4].includes(size)?size:1);const stats=profile.formatStats[format] ||= {matches:0,wins:0,kills:0,bestCup:null};stats.matches++;kills=safeNumber(kills);stats.kills+=kills;if(won&&!abandoned)stats.wins++;profile.kills+=kills;if(won&&!abandoned){profile.wins++;if(!cosmetics.unlocked.includes('skin_champion'))cosmetics.unlocked.push('skin_champion')}const reward=abandoned?0:60+kills*10+(won?120:0);cosmetics.coins+=reward;
    const result={scope,reward};if(scope==='ranked'){const rankResult=rankedScore(profile.rankPoints,placement,teams,kills,abandoned,profile.rankProtection);profile.rankPoints=rankResult.pointsAfter;profile.rank=rankResult.rankAfter;profile.rankProtection=rankResult.protectionAfter;Object.assign(result,rankResult)}
    if(scope==='cup'){const score=cupMatchScore(placement,teams,kills,abandoned);cup.matches.push({placement,teams,kills,points:score.points,abandoned});cup.points+=score.points;Object.assign(result,score,{cupId,cupName:cupFor(cupId).name,cupTotal:cup.points,cupGames:cup.matches.length});if(cup.matches.length>=10){cup.complete=true;const standings=cupStandings(cup),place=standings.findIndex(s=>!s.bot)+1,rewards=cupRewards(place);profile.pr+=rewards.pr;profile.earnings+=rewards.earnings;cosmetics.coins+=rewards.coins;if(place<=10&&!cosmetics.unlocked.includes('skin_icon'))cosmetics.unlocked.push('skin_icon');Object.assign(result,{cupPlace:place,pr:rewards.pr,earnings:rewards.earnings,cupCoins:rewards.coins});profile.cupHistory.push({id:cup.id,eventId:cupId,name:cupFor(cupId).name,points:cup.points,place,pr:rewards.pr,earnings:rewards.earnings,coins:rewards.coins,size});stats.bestCup=stats.bestCup==null?place:Math.min(stats.bestCup,place)}}
    profile.lastResult=result;save();return reward}
  function setIdentity(nickname,banner){profile.nickname=String(nickname||'JOUEUR').trim().slice(0,20)||'JOUEUR';profile.banner=['aurora','solar','night'].includes(banner)?banner:'aurora';save()}
  function grantDebug(){cosmetics.coins+=500;profile.pr+=100;save()}
  return {profile,cosmetics,unlock,equip,recordMatch,startCup,selectCup,canPlayCup,resetCup,grantDebug,setIdentity,canUnlockCondition,getItem:itemById,isPersistent:()=>persistent};
}
let storage;try{storage=globalThis.localStorage}catch{storage=null}
export const progress=createProgressStore(storage);
