export const WORLD=9600;
export const POIS=[{name:'TILTED TOWN',x:1400,y:1400,color:'#b8b3c6'},{name:'PLEASANT PARK',x:4600,y:1300,color:'#90d78b'},{name:'LOOT LAKE',x:3000,y:3000,color:'#79dce2'},{name:'BASE MILITAIRE',x:4600,y:4600,color:'#d3c18b'},{name:'NEON CITY',x:7700,y:1450,color:'#e4a6e6'},{name:'SUNSET STATION',x:7550,y:3600,color:'#eac38c'},{name:'RIVER OUTPOST',x:6550,y:5600,color:'#80d1b7'},{name:'FROST FIELDS',x:1550,y:7650,color:'#cce9f2'},{name:'CAMP RADAR',x:4050,y:7550,color:'#bcc9a0'},{name:'DUSTY DEPOT',x:7650,y:7650,color:'#e0aa80'}];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class SpatialGrid{constructor(size=180){this.size=size;this.cells=new Map()}add(o){for(let x=Math.floor(o.x/this.size);x<=Math.floor((o.x+o.w)/this.size);x++)for(let y=Math.floor(o.y/this.size);y<=Math.floor((o.y+o.h)/this.size);y++){let k=x+','+y;if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(o)}}query(x,y,r=0){const found=new Set();for(let i=Math.floor((x-r)/this.size);i<=Math.floor((x+r)/this.size);i++)for(let j=Math.floor((y-r)/this.size);j<=Math.floor((y+r)/this.size);j++)for(const o of this.cells.get(i+','+j)||[])found.add(o);return [...found]}}
export function createMap(){const walls=[],compounds=[],bushes=[],decor=[];const add=(x,y,w,h,type='wall')=>walls.push({x,y,w,h,type});const building=(x,y,w,h,kind='house')=>{compounds.push({x,y,w,h,kind});add(x,y,w,16,kind);add(x,y,16,h,kind);add(x+w-16,y,16,h,kind);add(x,y+h-16,w*.36,16,kind);add(x+w*.6,y+h-16,w*.4,16,kind);if(w>260){add(x+w*.5,y+16,14,h*.38,kind);add(x+w*.5,y+h*.68,14,h*.32-16,kind)}};
// Tilted Town: compact city blocks and room dividers.
for(let row=0;row<3;row++)for(let col=0;col<3;col++)building(930+col*330,900+row*315,230+(col%2)*30,220+(row%2)*25,'town');
// Pleasant Park: cottages with lawns and hedges.
for(const [x,y] of [[4070,870],[4490,850],[4880,920],[4090,1350],[4510,1420],[4890,1390],[4280,1780],[4750,1800]])building(x,y,210,190,'house');
// Military hangars, containers, and barricades.
for(const [x,y,w,h] of [[4060,4080,360,240],[4550,4080,400,240],[4090,4590,390,230],[4640,4600,380,240]])building(x,y,w,h,'military');
for(let i=0;i<9;i++)add(4050+(i%3)*360,4990+Math.floor(i/3)*80,110,32,i%2?'container':'sandbag');
// A few small buildings in the wilderness.
for(const [x,y] of [[900,3500],[1550,4700],[2450,4850],[800,2450],[3350,1050],[3550,5000]])building(x,y,200,170,'house');
// Lakeside huts, docks and cover leave the central mythic chest reachable.
for(const [x,y] of [[2430,2720],[3360,2640],[2650,3380],[3280,3370]])building(x,y,165,135,'house');
add(2800,2820,65,22,'sandbag');add(3140,3120,55,22,'crate');
// New named towns and small villages each have accessible buildings and cover.
for(const poi of POIS.slice(4)){for(let row=0;row<2;row++)for(let col=0;col<3;col++){const x=poi.x-420+col*280,y=poi.y-280+row*300;building(x,y,190+(col===1?40:0),180,poi.name.includes('CITY')?'town':poi.name.includes('DEPOT')?'military':'house')}}
// Extra small compounds throughout the island, keeping roads, the lake and existing doorways clear.
const openArea=(x,y,w,h,pad=70)=>x>40&&y>40&&x+w<WORLD-40&&y+h<WORLD-40&&Math.hypot(x+w/2-3000,y+h/2-3000)>660&&!compounds.some(b=>x<b.x+b.w+pad&&x+w>b.x-pad&&y<b.y+b.h+pad&&y+h>b.y-pad);
for(let row=0;row<18;row++)for(let col=0;col<18;col++){const x=180+col*520+(row%2)*85,y=190+row*520;const w=160+(col%3)*25,h=140+(row%2)*30;if((x<2810&&x+w>2600)||(y<2830&&y+h>2620)||!openArea(x,y,w,h,100))continue;building(x,y,w,h,(row+col)%5===0?'town':'house')}
// Cover near all four named locations; gaps remain between obstacles and entrances.
for(const poi of POIS){for(let i=0;i<35;i++){let x=poi.x-750+(i%7)*220,y=poi.y-700+Math.floor(i/7)*285;let w=65,h=24;if(openArea(x,y,w,h,80)&&Math.hypot(x-3000,y-3000)>225)add(x,y,w,h,i%3===0?'crate':i%3===1?'container':'sandbag')}}
let seed=12982;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};for(let i=0;i<1500;i++){let x=100+rand()*(WORLD-200),y=100+rand()*(WORLD-200);if(Math.hypot(x-3000,y-3000)<500)continue;const kind=rand();if(kind<.53)bushes.push({x,y,w:48,h:36});else decor.push({x,y,type:kind<.68?'rock':kind<.82?'crate':kind<.92?'barrel':'flowers',variant:Math.floor(rand()*4)})}
// Additional shrubs around each location make stealth viable in every biome.
for(const poi of POIS)for(let i=0;i<30;i++){let x=poi.x-750+(i%6)*250+(i%2)*25,y=poi.y-600+Math.floor(i/6)*270;if(Math.hypot(x-3000,y-3000)>180)bushes.push({x,y,w:48,h:36})}
// Purposeful cover around homes.
for(let i=0;i<20;i++)bushes.push({x:4020+(i%5)*220,y:1080+Math.floor(i/5)*260,w:48,h:36});
// Bushes belong outside; they should not appear through the floors of houses.
for(let i=bushes.length-1;i>=0;i--){const b=bushes[i];if(compounds.some(c=>b.x+b.w/2>c.x&&b.x+b.w/2<c.x+c.w&&b.y+b.h/2>c.y&&b.y+b.h/2<c.y+c.h))bushes.splice(i,1)}
const grid=new SpatialGrid(),bushGrid=new SpatialGrid(180);walls.forEach(w=>grid.add(w));bushes.forEach(b=>bushGrid.add(b));return{walls,grid,bushes,bushGrid,decor,compounds,pois:POIS}}
export function inBush(map,e){return map.bushGrid.query(e.x,e.y,35).some(b=>e.x>=b.x-8&&e.x<=b.x+b.w+8&&e.y>=b.y-8&&e.y<=b.y+b.h+8)}
export function collides(map,x,y,r=12){if(x-r<0||y-r<0||x+r>WORLD||y+r>WORLD)return true;for(const w of map.grid.query(x,y,r)){const px=clamp(x,w.x,w.x+w.w),py=clamp(y,w.y,w.y+w.h);if((x-px)**2+(y-py)**2<r*r)return true}return false}
export function moveEntity(map,e,dx,dy){if(!collides(map,e.x+dx,e.y,e.r))e.x+=dx;if(!collides(map,e.x,e.y+dy,e.r))e.y+=dy}
export function randomOpen(map,center=null,radius=1100){for(let i=0;i<300;i++){const x=center?clamp(center.x+(Math.random()-.5)*radius*2,35,WORLD-35):35+Math.random()*(WORLD-70),y=center?clamp(center.y+(Math.random()-.5)*radius*2,35,WORLD-35):35+Math.random()*(WORLD-70);if(!collides(map,x,y,18))return{x,y}}return{x:3000,y:3000}}
function containsPoint(w,x,y){return x>=w.x&&x<=w.x+w.w&&y>=w.y&&y<=w.y+w.h}
function segmentHits(w,x1,y1,x2,y2){let lo=0,hi=1;for(const [p,d,min,max] of [[x1,x2-x1,w.x,w.x+w.w],[y1,y2-y1,w.y,w.y+w.h]]){if(Math.abs(d)<.00001){if(p<min||p>max)return false}else{let a=(min-p)/d,b=(max-p)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false}}return lo<1&&hi>0}
export function lineBlocked(map,x1,y1,x2,y2){const mx=(x1+x2)/2,my=(y1+y2)/2,r=Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/2+20;return map.grid.query(mx,my,r).some(w=>segmentHits(w,x1,y1,x2,y2))}
// Bushes obstruct sight, not bullets. An observer inside a bush can still see out;
// targets inside are handled by the hiding/reveal rule.
export function visionBlocked(map,x1,y1,x2,y2){if(lineBlocked(map,x1,y1,x2,y2))return true;if(!map.bushGrid)return false;const mx=(x1+x2)/2,my=(y1+y2)/2,r=Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/2+30;return map.bushGrid.query(mx,my,r).some(b=>!containsPoint(b,x1,y1)&&!containsPoint(b,x2,y2)&&segmentHits(b,x1,y1,x2,y2))}
