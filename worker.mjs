const VERSION=12, DT=1/120, R=17, FLOOR=420, GRAVITY=2200, JUMP=760;
function daylight(t){const phase=t%64,ease=v=>v*v*v*(v*(v*6-15)+10);return phase<24?ease(phase/24):phase<40?1:1-ease((phase-40)/24);}
function challengeAt(x){const metres=Math.max(0,(x-100)/10),limits=[150,400,750,1200];let stage=1;while(stage<=limits.length&&metres>=limits[stage-1])stage++;return {stage,name:['RHYTHM','PRESSURE','HARD','EXPERT','EXTREME'][stage-1],progress:Math.min(1,metres/1200)};}
const supports=o=>['platform','swing','crumble','pad','lift','boat','elevator'].includes(o.kind);
function copyPlayer(p){return {...p,crumble:{...(p.crumble||{})},switches:{...(p.switches||{})},lifts:{...(p.lifts||{})}};}
function sceneryTile(camera,rate,spacing,n){const index=Math.floor(camera*rate/spacing)-1+n;return {index,x:index*spacing-camera*rate};}
const sunPosition=camera=>800-Math.sin(camera*.00009)*35;
const COLORS=['#ffcc66','#66dfdc','#ed8fae','#adabff'];
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const speed=x=>{x=Math.max(100,x);return x<4000?390+(x-100)*.04:Math.min(720,546+(x-4000)*.012);};
function nominalTime(x){if(x<=100)return 0;const first=Math.log(546/390)/.04;if(x<=4000)return Math.log(speed(x)/390)/.04;if(x<=18500)return first+Math.log(speed(x)/546)/.012;return first+Math.log(720/546)/.012+(x-18500)/720;}

const cueX=cue=>typeof cue==='number'?cue:cue.x;
const shiftCue=(cue,seconds)=>typeof cue==='number'?cue+speed(cue)*seconds:cue.ride?{...cue,rideDelay:Math.max(.02,cue.rideDelay+seconds)}:{...cue,x:cue.x+speed(cue.x)*seconds};
function cueReady(p,cue){return cue?.ride?p.riding===cue.ride&&p.rideAge>=cue.rideDelay:p.x>=cueX(cue);}
function objectAt(o,time=0,racer=null){
 if(o.kind==='duckbar'&&o.skin==='press'){const shift=(1+Math.sin(time*Math.PI*2/o.period+o.phase))*o.amplitude/2;return {...o,y:o.y-shift};}
 if(o.kind==='boat'){const a=time*Math.PI*2/o.period+o.phase;return {...o,x:o.x+Math.sin(a)*o.amplitude,y:o.y+Math.sin(a*2)*7};}
 if(o.kind==='elevator'){const age=Math.max(0,time-(racer?.lifts?.[o.id]??time));return {...o,y:o.y-o.rise*(1-Math.cos(age*Math.PI*2/o.period))/2,age};}

 if(o.kind==='crumble'){const touched=racer?.crumble?.[o.id],age=touched===undefined?0:time-touched;return {...o,age,broken:touched!==undefined&&age>o.life};}
 if(o.kind==='gate')return {...o,open:(racer?.switches?.[o.id]||0)>time};
 if(o.kind==='switch')return {...o,activated:(racer?.switches?.[o.gate]||0)>time};
 if(o.kind==='lift'){const a=Math.sin(time*Math.PI*2/o.period+o.phase)*o.amplitude;return {...o,x:o.x+(o.axis==='x'?a:0),y:o.y+(o.axis==='y'?a:0)};}
 if(o.kind==='fireball'){const age=((time+o.phase)%o.period+o.period)%o.period,active=age>=o.windup&&age<o.windup+o.life;return {...o,active,shotAge:age-o.windup,x:o.originX+o.vx*Math.max(0,age-o.windup)-o.w/2,y:o.originY-o.h/2};}
 if(o.kind==='mover'){const motion=Math.sin(time*Math.PI*2/o.period+o.phase);return {...o,x:o.x+(o.axis==='x'?motion*o.amplitude:0),y:o.y+(o.axis==='y'?motion*o.amplitude:0)};}
 if(o.kind==='swing'){const angle=o.angle*Math.sin(time*Math.PI*2/o.period+o.phase);return {...o,x:o.pivotX+o.length*Math.sin(angle)-o.w/2,y:o.pivotY+o.length*Math.cos(angle),theta:angle};}
 return o;
}
function player(id,name='You',color=0){return {id,name,color,x:100,y:FLOOR-R,vy:0,alive:true,ground:true,coyote:.075,buffer:0,distance:0,death:0,time:0,riding:null,rideAge:0,crumble:{},switches:{},lifts:{},pads:0,plates:0,lives:3,hits:0,duck:0,duckBuffer:0,duckCooldown:0,ducks:0};}
function tap(p){if(p.alive){p.buffer=.145;p.duckBuffer=0;}}
function duck(p){if(!p.alive)return false;p.buffer=0;if(!p.ground||p.duckCooldown>0){p.duckBuffer=.145;return false;}if(p.duck>0)return false;p.duck=.68;p.duckCooldown=.70;p.duckBuffer=0;p.ducks=(p.ducks||0)+1;return true;}
function performCue(p,cue){if(cue?.action==='duck')duck(p);else tap(p);}

function score(p){p.distance=Math.max(p.distance||0,Math.round((p.x-100)*10)/100);p.death=p.alive?0:p.x;}
function runnerStep(p,course,dt=DT){
 if(!p.alive)return;p.time=(p.time||0)+dt;p.buffer=Math.max(0,p.buffer-dt);p.duck=Math.max(0,(p.duck||0)-dt);p.duckCooldown=Math.max(0,(p.duckCooldown||0)-dt);
 p.duckBuffer=Math.max(0,(p.duckBuffer||0)-dt);if(p.duckBuffer>0&&p.ground&&p.duckCooldown<=0)duck(p);
 if(p.riding){const source=course.getObject(p.riding);if(!source){p.alive=false;score(p);return;}const seat=objectAt(source,p.time,p);p.rideAge+=dt;p.rideOffset=(p.rideOffset||0)*Math.exp(-dt*12);p.x=seat.x+seat.w/2+p.rideOffset;p.y=seat.y-R;p.vy=0;p.ground=true;p.coyote=.075;
  if(p.rideAge>3.5){p.alive=false;p.gripLost=true;score(p);return;}
  if(p.buffer<=0){score(p);return;}p.riding=null;p.rideAge=0;
 }
 if(p.ground&&p.onSupport){const support=course.getObject?.(p.onSupport);if(support?.kind==='lift'){const before=objectAt(support,p.time-dt,p),after=objectAt(support,p.time,p);p.x+=after.x-before.x;p.y+=after.y-before.y;}}
 p.coyote=p.ground?.075:Math.max(0,p.coyote-dt);let stick=p.ground;
 if(p.buffer>0&&p.coyote>0){p.duck=0;p.vy=-JUMP;p.ground=false;stick=false;p.coyote=0;p.buffer=0;p.jumps=(p.jumps||0)+1;}
 const ox=p.x,oy=p.y;p.x+=(course.rules==='jumpduck'?rushSpeed(p.time):speed(p.x))*dt;p.vy+=GRAVITY*dt;p.y+=p.vy*dt;p.ground=false;p.onSupport=null;
 const base=course.groundAt?.(p.x)??FLOOR;let surface=base,floor=true,landedSeat=null,landedSupport=null;const raw=course.near(p.x),objects=raw.map(o=>objectAt(o,p.time,p));
 for(const o of objects)if(o.kind==='gap'&&p.x>o.x&&p.x<o.x+o.w)floor=false;
 for(let i=0;i<objects.length;i++){const o=objects[i];if(!supports(o)||o.broken)continue;const prev=objectAt(raw[i],p.time-dt,p);
  if(p.x+R*.7>o.x&&p.x-R*.7<o.x+o.w&&oy+R<=prev.y+3&&p.vy>=0&&(p.y+R>=o.y||stick&&Math.abs(oy+R-o.y)<3)){if(!floor||o.y<=surface){surface=o.y;landedSupport=o;landedSeat=['swing','boat','elevator'].includes(o.kind)?o:null;}floor=true;}
 }
 if(floor&&p.vy>=0&&((oy+R<=surface+3&&p.y+R>=surface)||(stick&&Math.abs(surface-(oy+R))<12))){p.y=surface-R;p.vy=0;p.ground=true;p.onSupport=landedSupport?.id||null;if(landedSeat){p.riding=landedSeat.id;p.rideAge=0;p.rideOffset=Math.max(landedSeat.grand?-landedSeat.w/2:-50,Math.min(landedSeat.grand?landedSeat.w/2:50,p.x-(landedSeat.x+landedSeat.w/2)));if(landedSeat.kind==='elevator'){p.lifts??={};p.lifts[landedSeat.id]??=p.time;p.elevators=(p.elevators||0)+1;}else if(landedSeat.kind==='boat')p.boats=(p.boats||0)+1;else p.swings=(p.swings||0)+1;}}
 if(p.ground&&landedSupport?.kind==='crumble'){p.crumble??={};p.crumble[landedSupport.id]??=p.time;}
 if(p.ground&&landedSupport?.kind==='pad'){p.vy=-JUMP*landedSupport.boost;p.y-=.1;p.ground=false;p.coyote=0;p.buffer=0;p.pads=(p.pads||0)+1;p.lastPad=landedSupport.id;p.lastPadTime=p.time;}
 for(const o of objects)if(o.kind==='switch'&&p.ground&&p.x>=o.x&&p.x<=o.x+o.w&&Math.abs(p.y+R-(o.y+o.h))<7){p.switches??={};if(p.switches[o.gate]===undefined){p.switches[o.gate]=p.time+o.duration;p.plates=(p.plates||0)+1;}}
 for(const original of objects){const o=original.kind==='gate'?objectAt(original,p.time,p):original;if(o.kind==='gap'||o.kind==='switch'||o.kind==='fireball'&&!o.active||o.broken||o.kind==='gate'&&o.open)continue;if(supports(o)&&p.y+R<=o.y+2)continue;
  const rr=R-3,rx=p.duck>0?18:rr,ry=p.duck>0?6:rr,cy=p.duck>0?p.y+R-7:p.y,nx=Math.max(o.x,Math.min(p.x,o.x+o.w)),ny=Math.max(o.y,Math.min(cy,o.y+o.h));if(((p.x-nx)/rx)**2+((cy-ny)/ry)**2>=1)continue;
  if(o.kind!=='spike'&&!o.lethal&&p.vy<0&&(oy-rr>=o.y+o.h-4||p.y>=o.y+o.h+2)){p.y=o.y+o.h+R;p.vy=0;p.buffer=0;p.bumps=(p.bumps||0)+1;continue;}
  if(o.kind==='ceiling'){if(p.vy<0){p.y=Math.max(p.y,o.y+o.h+R);p.vy=0;p.buffer=0;p.bumps=(p.bumps||0)+1;}continue;}
  p.alive=false;p.riding=null;break;
 }
 if(p.y>base+210)p.alive=false;if(p.time>=(p.nextCleanup||0)){for(const [id,t]of Object.entries(p.crumble||{}))if(p.time-t>12)delete p.crumble[id];for(const [id,t]of Object.entries(p.switches||{}))if(p.time-t>12)delete p.switches[id];p.nextCleanup=p.time+2;}score(p);
}
function environment(objects,groundAt){return {near:x=>objects.filter(o=>o.x+o.w+(o.range||o.amplitude||o.length||0)>x-80&&o.x-(o.range||o.amplitude||o.length||0)<x+100),getObject:id=>objects.find(o=>o.id===id),groundAt};}
function runRoute(objects,start,end,triggers,groundAt,initial=null,timeOffset=0){const c=environment(objects,groundAt),p=initial?copyPlayer(initial):player('verify');if(!initial){p.x=start;p.y=groundAt(start)-R;p.time=nominalTime(start)+timeOffset;}let i=0;
 for(let n=0;n<3000&&p.alive&&p.x<end;n++){if(i<triggers.length&&cueReady(p,triggers[i])){performCue(p,triggers[i]);i++;}step(p,c);}
 return {p,success:p.alive&&p.x>=end&&p.ground};
}
// Cache a checkpoint ahead of each input, so testing its window does not replay
// the entire preceding course. Require stable contact before the next input.
function routeWindows(objects,start,end,triggers,groundAt){
 if(!runRoute(objects,start,end,triggers,groundAt).success)return null;
 if(triggers.some(t=>t?.ride))return rideWindows(objects,start,end,triggers,groundAt);
 if(!triggers.length)return [];
 const c=environment(objects,groundAt),p=player('verify');p.x=start;p.y=groundAt(start)-R;p.time=nominalTime(start);let i=0;const prefixes=[];
 for(let n=0;n<3000&&p.alive&&p.x<end;n++){
  for(let j=0;j<triggers.length;j++){const x=cueX(triggers[j]);if(!prefixes[j]&&p.x>=x-speed(x)*.25)prefixes[j]=copyPlayer(p);}
  if(i<triggers.length&&cueReady(p,triggers[i])){performCue(p,triggers[i]);i++;}step(p,c);
 }
 const windows=[];
 for(let i=0;i<triggers.length;i++){
  const cue=triggers[i],x=cueX(cue),s=speed(x),next=i+1<triggers.length?cueX(triggers[i+1]):end,finish=i+1<triggers.length?next-speed(next)*.015:end,valid=[];
  if(!prefixes[i])return null;
  for(let j=-22;j<=22;j++)if(runRoute(objects,prefixes[i].x,finish,[shiftCue(cue,j*.01)],groundAt,prefixes[i]).success)valid.push(j);
  let best=[],run=[];for(const v of valid){if(run.length&&v-run.at(-1)>1)run=[];run.push(v);if(run.length>best.length)best=[...run];}
  if(!best.length||(best.at(-1)-best[0])*.01<.079||best[0]>-2||best.at(-1)<2)return null;
  windows.push({...(typeof cue==='object'?cue:{}),x,min:x+best[0]*s*.01,max:x+best.at(-1)*s*.01});
 }
 const centered=windows.map(w=>w.action?w:w.x);
 for(const phase of [0,.25,.5,.75])for(const offset of [0,-.018,.018]){const shifted=travel(start,phase*DT);if(!runRoute(objects,shifted,end,centered.map(v=>shiftCue(v,offset)),groundAt).success)return null;}
 if(objects.some(o=>['mover','swing','lift','fireball','boat','elevator','duckbar'].includes(o.kind)))for(let phase=0;phase<12;phase++)for(const jitter of [0,-.012,.012])if(!runRoute(objects,start,end,centered.map(v=>shiftCue(v,jitter)),groundAt,null,phase*.2).success)return null;
 return windows;
}
function rideWindows(objects,start,end,triggers,groundAt){
 const windows=[];
 for(let i=0;i<triggers.length;i++){
  const valid=[];for(let j=-16;j<=16;j++){const plan=[...triggers];plan[i]=shiftCue(plan[i],j*.01);if(runRoute(objects,start,end,plan,groundAt).success)valid.push(j);}
  let best=[],run=[];for(const v of valid){if(run.length&&v-run.at(-1)>1)run=[];run.push(v);if(run.length>best.length)best=[...run];}
  if(!best.length||best.at(-1)-best[0]<8||best[0]>-2||best.at(-1)<2)return null;
  const t=triggers[i],x=cueX(t),v=speed(x);windows.push({...(typeof t==='object'?t:{}),x,min:x+best[0]*v*.01,max:x+best.at(-1)*v*.01,...(t.ride?{delayMin:t.rideDelay+best[0]*.01,delayMax:t.rideDelay+best.at(-1)*.01}:{})});
 }
 for(let phase=0;phase<16;phase++)for(const jitter of [0,-.018,.018])if(!runRoute(objects,start,end,triggers.map(t=>shiftCue(t,jitter)),groundAt,null,phase*.2).success)return null;
 return windows;
}
function windowFor(objects,x){return routeWindows(objects,x-speed(x)*.8,Math.max(...objects.map(o=>o.x+o.w))+speed(x)*.9,[x-speed(x)*.27],()=>FLOOR)?.[0]||null;}
function travel(x,time){for(let t=0;t<time;t+=DT)x+=speed(x)*Math.min(DT,time-t);return x;}
function flight(fromHeight,toHeight){return (JUMP+Math.sqrt(JUMP*JUMP-2*GRAVITY*(toHeight-fromHeight)))/GRAVITY;}
const LABELS={'late-chain':'LAST-MOMENT RUSH','duck-run':'SQUEEZE GATES','duck-vault':'DUCK / SNAP JUMP','duck-gap':'LOW PASS / LATE GAP','divide':'SUMMIT / DEEP CAVE','boat-run':'FERRY HOP','grand-swing':'GIANT PENDULUM','elevator-run':'SKY LIFT','rock-weave':'BASALT WEAVE','barrel-run':'ROLLING DRUMS','needlebridge':'NEEDLE BRIDGE','spike-islands':'SPIKE ISLANDS',staircase:'BROKEN STAIRS',sawtooth:'SAWTOOTH',dropchain:'DROP CHAIN','twin-gaps':'DOUBLE CUT','long-gap':'LATE LAUNCH','triple-bars':'BROKEN RHYTHM','late-vault':'HIGH VAULT','roof-gap':'LOW CLEARANCE',downhill:'DOWNHILL SWITCH',roller:'ROLLING RIDGE',recovery:'BREATHE',intro:'FIND YOUR RHYTHM',swing:'SWING TRANSFER',fork:'FORKED CROSSING',sweep:'SWEEPING TEETH',piston:'RISING TEETH',crumble:'CRUMBLE RELAY','pad-run':'SPRING TRANSFER','gate-run':'PLATE & GATE',gauntlet:'GAUNTLET','lift-run':'RISING CAUSEWAY','slider-run':'SLIDING ISLANDS','fire-run':'FIRE VOLLEY',overfire:'OVERHEAD FIRE'};
const FAMILIES=['late-chain','duck-run','duck-vault','duck-gap','boat-run','grand-swing','elevator-run','rock-weave','barrel-run','needlebridge','spike-islands','staircase','sawtooth','dropchain','twin-gaps','long-gap','triple-bars','late-vault','roof-gap','downhill','roller','swing','fork','sweep','piston','crumble','pad-run','gate-run','lift-run','slider-run','fire-run','overfire'];
function makeSection(kind,start,y,r,index){const s=speed(start+400),objects=[],triggers=[],terrain=[];let length,exit=y,alternatives=null,components=null,biome=null;const difficulty=challengeAt(start).progress,stage=challengeAt(start).stage;const add=(kind,x,top,w,h)=>objects.push({kind,x,y:top,w,h});
 if(kind==='late-chain'){
  let at=start+s*(.90+r()*.12);const count=2+(stage>=2?1:0)+(stage>=4&&r()<.4?1:0);
  objects.push({kind:'ceiling',x:at-s*.70,y:y-130,w:s*.48,h:90,skin:'cave'});
  for(let j=0;j<count;j++){
   const v=speed(at),h=42+r()*5,w=v*(.455+r()*.012+difficulty*.008)-2*(R-3);add('spike',at,y-h,w,h);triggers.push(at-v*.145);at=travel(at,.775+r()*.065);
  }
  length=at-start+s*.42;
 }else if(kind==='duck-run'){
  let at=start+s*(.72+r()*.10);const count=stage>=3?3:2;
  for(let j=0;j<count;j++){
   objects.push({kind:'duckbar',lethal:true,x:at,y:y-105,w:s*(.17+r()*.025),h:81,skin:j%2?'fan':'press',period:2.4,phase:r()*Math.PI*2,amplitude:32});
   triggers.push({x:at-s*.13,action:'duck'});at+=s*(.84+r()*.13);
  }length=at-start+s*.32;
 }else if(kind==='duck-vault'||kind==='duck-gap'){
  const first=start+s*(.76+r()*.08),bar=first+s*.76,width=s*.19;
  add('spike',first,y-35,s*.23,35);triggers.push(first-s*.24);
  objects.push({kind:'duckbar',lethal:true,x:bar,y:y-105,w:width,h:81,skin:kind==='duck-vault'?'fan':'press',period:2.4,phase:r()*Math.PI*2,amplitude:32});triggers.push({x:bar-s*.13,action:'duck'});
  const last=bar+width+s*.32;
  if(kind==='duck-gap'){const gapWidth=s*(.625+difficulty*.025);add('gap',last,y,gapWidth,260);triggers.push(last+s*.005);length=last+gapWidth-start+s*.72;}
  else{
   let at=last;for(let j=0;j<2;j++){const v=speed(at);add('spike',at,y-44,v*(.458+difficulty*.008)-2*(R-3),44);triggers.push(at-v*.145);at=travel(at,.79+r()*.04);}length=at-start+s*.4;
  }
 }else if(kind==='divide'){
  const variant=Math.floor(r()*4),climbCount=variant===0?2:r()<.55?3:4,topHeight=variant===0?120+r()*20:172+r()*36,caveDrop=variant===0?130+r()*20:150+r()*26;
  let takeoff=start+s*(.48+r()*.20),height=0,lastCenter=0;const upper=[],lower=[],upperKinds=[],lowerKinds=[];
  for(let j=0;j<climbCount;j++){
   const nextHeight=j===climbCount-1?topHeight:topHeight*(j+1)/climbCount+(r()-.5)*10,center=travel(takeoff,flight(height,nextHeight)),w=s*(.24+r()*.04-difficulty*.055);
   upper.push(takeoff);lastCenter=center;if(j<climbCount-1)objects.push({kind:'platform',x:center-w/2,y:y-nextHeight,w,h:20,route:'CLIMB'});
   height=nextHeight;takeoff=center+w*(.36+r()*.06);
  }
  const main=lastCenter-s*.11,roof=y-topHeight,bottom=y+caveDrop,down=upper[0]+s*(.10+r()*.08),flat=down+s*(.85+r()*.25);
  let cursor=main+s*.24;
  if(variant===2){const ferry=makeSection('boat-run',cursor,bottom,r,index);objects.push(...ferry.objects);lower.push(...ferry.triggers);cursor+=ferry.length+s*.10;lowerKinds.push('river');}
  const count=[2,3,1,4][variant];let previous='';
  for(let j=0;j<count;j++){
   const pool=(j===count-1&&!lowerKinds.some(k=>k==='gap'||k==='roof-gap')?['gap','roof-gap']:['gap','roof-gap','spikes','rock','teeth',...(stage>=2?['squeeze']:[])]).filter(k=>k!==previous),type=pool[Math.floor(r()*pool.length)],at=cursor+s*(.58+r()*.18);previous=type;lowerKinds.push(type);
   if(type==='gap'||type==='roof-gap'){
    const width=s*((j===count-1?.615:.565)+difficulty*.026+r()*(j===count-1?.012:.065));add('gap',at,bottom,width,260);lower.push(at+s*.005);
    if(type==='roof-gap')objects.push({kind:'ceiling',x:at-s*(.58+r()*.04),y:bottom-151,w:s*.32,h:68,skin:'cave'});
    cursor=at+width+s*(.26+r()*.20);
   }else if(type==='spikes'){
    const v=speed(at),w=v*(.34+r()*.055+difficulty*.02);add('spike',at,bottom-36,w,36);lower.push(at-v*(.33-w/(2*v)));cursor=at+s*(.72+r()*.22);
   }else if(type==='rock'){
    objects.push({kind:'block',x:at,y:bottom-(93+r()*12),w:s*(.10+r()*.035),h:105,skin:'basalt'});objects.at(-1).h=bottom-objects.at(-1).y;lower.push(at-s*.27);cursor=at+s*(.75+r()*.18);
   }else if(type==='squeeze'){
    objects.push({kind:'duckbar',lethal:true,x:at,y:bottom-105,w:s*.19,h:81,skin:'press',period:2.4,phase:r()*Math.PI*2,amplitude:35});lower.push({x:at-s*.13,action:'duck'});cursor=at+s*.55;
   }else{
    objects.push({kind:'mover',lethal:true,axis:'x',x:at,y:bottom-44,w:42,h:30,amplitude:28,period:2.4,phase:r()*Math.PI*2});lower.push(at-s*.28);cursor=at+s*(.75+r()*.18);
   }
  }
  const deckEnd=Math.max(cursor+s*.25,main+s*2.55),gaps=[];let at=main+s*(.69+r()*.16),lastType='';
  while(at<deckEnd-s*.85){
   const pool=['gap','spikes','rock'].filter(k=>k!==lastType),type=pool[Math.floor(r()*pool.length)];lastType=type;upperKinds.push(type);
   if(type==='gap'){const w=s*(.50+r()*.065);gaps.push([at,w]);upper.push(at+s*.005);at+=w+s*(.45+r()*.26);}
   else if(type==='spikes'){const w=s*(.14+r()*.09);add('spike',at,roof-32,w,32);upper.push(at-s*.25);at+=s*(.92+r()*.34);}
   else{const h=72+r()*18;objects.push({kind:'block',x:at,y:roof-h,w:s*(.09+r()*.03),h,skin:'basalt'});upper.push(at-s*.27);at+=s*(1.02+r()*.27);}
  }
  let left=main;for(const [gx,gw]of gaps){objects.push({kind:'platform',x:left,y:roof,w:gx-left,h:64,route:'SUMMIT'});left=gx+gw;}objects.push({kind:'platform',x:left,y:roof,w:deckEnd-left,h:64,route:'SUMMIT'});
  const up=deckEnd+s*(.12+r()*.14),upEnd=up+s*(.95+r()*.45);length=upEnd-start+s*(.45+r()*.23);
  terrain.push({x:start,w:down-start,y0:y,y1:y},{x:down,w:flat-down,y0:y,y1:bottom},{x:flat,w:up-flat,y0:bottom,y1:bottom},{x:up,w:upEnd-up,y0:bottom,y1:y},{x:upEnd,w:start+length-upEnd,y0:y,y1:y});
  upper.sort((a,b)=>cueX(a)-cueX(b));triggers.push(...upper);alternatives=[lower];biome={split:main,merge:up,roof,bottom,deckEnd,variant,climbCount,layout:lowerKinds.join('/')+' | '+upperKinds.join('/')};
 }else if(kind==='boat-run'){
  const center=start+s*(.90+r()*.16),id='boat-'+start,boatHeight=18+r()*12,dockHeight=64+r()*18,landing=travel(center,flight(boatHeight,dockHeight)),width=s*(.23+r()*.035),boatWidth=176+r()*26;
  objects.push({kind:'boat',id,x:center-boatWidth/2,y:y-boatHeight,w:boatWidth,h:24,amplitude:14+r()*5,period:3.2,phase:r()*Math.PI*2});
  objects.push({kind:'platform',x:landing-width/2,y:y-dockHeight,w:width,h:22,skin:'dock'});
  const launch=landing+width*(.28+r()*.07),exitLanding=travel(launch,flight(dockHeight,0));
  objects.push({kind:'gap',x:center-s*.35,y,w:exitLanding-s*.065-(center-s*.35),h:260,water:true});
  triggers.push(center-s*flight(0,boatHeight),{x:center,ride:id,rideDelay:.20+r()*.08},launch);length=exitLanding-start+s*(.50+r()*.20);
 }else if(kind==='elevator-run'){
  const center=start+s*.95,id='elevator-'+start,base=35,rise=145,delay=.64;
  const departure=base+rise*(1-Math.cos(delay*Math.PI*2/2.4))/2,landing=travel(center,flight(departure,225)),width=s*.18;
  objects.push({kind:'elevator',id,x:center-62,y:y-base,w:124,h:21,rise,period:2.4});
  objects.push({kind:'platform',x:landing-width/2,y:y-225,w:width,h:22,skin:'dock'});
  const launch=landing+width*.30,exitLanding=travel(launch,flight(225,0));
  add('gap',center-s*.36,y,exitLanding-s*.06-(center-s*.36),260);triggers.push(center-s*flight(0,base),{x:center,ride:id,rideDelay:delay},launch);length=exitLanding-start+s*.65;
 }else if(kind==='grand-swing'){
  const center=start+s*1.05,id='grand-'+start,seatHeight=80,landing=travel(center,flight(seatHeight,130)),width=s*.48;
  objects.push({kind:'swing',id,x:center-s*.54,y:y-seatHeight,w:s*1.08,h:20,pivotX:center,pivotY:y-seatHeight-310,length:310,angle:.20,period:2.4,phase:r()*Math.PI*2,grand:true});
  objects.push({kind:'platform',x:landing-width/2,y:y-130,w:width,h:20});
  const launch=landing+width*.24,exitLanding=travel(launch,flight(130,0));
  add('gap',center-s*.43,y,exitLanding-s*.07-(center-s*.43),260);triggers.push(center-s*.91,{x:center,ride:id,rideDelay:.28},launch);length=exitLanding-start+s*.7;
 }else if(kind==='rock-weave'){
  const at=start+s*.9;objects.push({kind:'block',x:at,y:y-100,w:s*.13,h:100,skin:'basalt'});triggers.push(at-s*.27);
  objects.push({kind:'ceiling',x:at+s*.65,y:y-151,w:s*.31,h:68,skin:'cave'});
  const gap=at+s*1.38;add('gap',gap,y,s*(.62+difficulty*.025),260);triggers.push(gap+s*.005);
  const spike=gap+s*1.18;add('spike',spike,y-38,s*.27,38);triggers.push(spike-s*.23);length=spike-start+s*1.2;
 }else if(kind==='barrel-run'){
  let at=start+s*.88;for(let j=0;j<3;j++){objects.push({kind:'mover',lethal:true,skin:'drum',axis:'x',x:at,y:y-45,w:44,h:42,amplitude:25,period:2.4,phase:r()*Math.PI*2});triggers.push(at-s*.28);at+=s*(.90+r()*.12);}length=at-start+s*.5;
 }else if(kind==='gauntlet'){
  let cursor=start,height=y;const children=[],count=stage>=4&&r()<.35?3:2;
  const pool=['late-chain','duck-vault','piston','twin-gaps','crumble','pad-run','gate-run','triple-bars','needlebridge','lift-run','slider-run','fire-run','overfire'];
  for(let j=0;j<count;j++){
   const candidates=j===0?pool.filter(k=>['crumble','pad-run','gate-run','lift-run','slider-run'].includes(k)):pool;const chosen=candidates[Math.floor(r()*candidates.length)];pool.splice(pool.indexOf(chosen),1);const child=makeSection(chosen,cursor,height,r,index+j);
   const maxRight=Math.max(...child.objects.map(o=>o.x+o.w));
   const cut=Math.min(child.length,Math.max(maxRight-cursor+s*.25,cueX(child.triggers.at(-1))-cursor+s*.94));
   const last=child.terrain.at(-1);last.w-=child.length-cut;child.length=cut;
   objects.push(...child.objects);triggers.push(...child.triggers);terrain.push(...child.terrain);children.push(child.kind);cursor+=child.length;height=child.exit;
  }length=cursor-start;exit=height;components=children;
 }else if(kind==='lift-run'||kind==='slider-run'){
  let height=0,takeoff=start+s*.62;const first=takeoff;
  for(let j=0;j<3;j++){
   const nextHeight=[55,90,60][j],center=travel(takeoff,flight(height,nextHeight)),width=s*(.30-difficulty*.035);
   objects.push({kind:'lift',id:'lift-'+start+'-'+j,x:center-width/2,y:y-nextHeight,w:width,h:18,axis:kind==='slider-run'?'x':'y',amplitude:kind==='slider-run'?24:10,period:2.4,phase:r()*Math.PI*2});
   triggers.push(takeoff);takeoff=center+width*.34;height=nextHeight;
  }
  triggers.push(takeoff);const landing=travel(takeoff,flight(height,0));add('gap',first+s*.18,y,landing-s*.065-(first+s*.18),260);length=landing-start+s*.62;
 }else if(kind==='fire-run'||kind==='overfire'){
  const addFire=(at,high=false)=>objects.push({kind:'fireball',lethal:true,x:at-s*.10,y:y-(high?90:32)-12,w:24,h:24,originX:at+s*.24,originY:y-(high?90:32),vx:-s*.34/1.1,windup:.35,life:1.1,period:1.8,phase:r()*2.4,range:s*.36});
  const at=start+s*.84;addFire(at);triggers.push(at-s*.28);
  if(kind==='overfire'){addFire(at+s*.85,true);const gap=at+s*1.48;add('gap',gap,y,s*.64,260);triggers.push(gap+s*.005);length=gap-start+s*1.6;}
  else{let cursor=at;for(let j=0;j<1+(stage>=4?1:0);j++){cursor+=s*(.94+r()*.12);addFire(cursor);triggers.push(cursor-s*.28);}length=cursor-start+s*1.2;}
 }else if(kind==='pad-run'){
  const center=start+s*.94,boost=1.18;
  const bounceV=JUMP*boost,h1=38,h2=70,t=(bounceV+Math.sqrt(bounceV*bounceV-2*GRAVITY*(h2-h1)))/GRAVITY;
  const target=travel(center,t),width=s*(.21-difficulty*.065);
  objects.push({kind:'pad',id:'pad-'+start,x:center-s*.11,y:y-h1,w:s*.22,h:18,boost});
  add('platform',target-width/2,y-h2,width,18);
  add('gap',center-s*.25,y,target+width*.2+s*.64-(center-s*.25),260);
  triggers.push(center-s*flight(0,h1),target+width*.40);length=target-start+s*1.8;
 }else if(kind==='gate-run'){
  const at=start+s*.8,gate='gate-'+start;
  add('spike',at,y-36,s*.24,36);
  objects.push({kind:'switch',x:at+s*.40,y:y-5,w:s*.16,h:5,gate,duration:1.08-difficulty*.12});
  add('spike',at+s*.95,y-38,s*.18,38);
  objects.push({kind:'gate',id:gate,x:at+s*1.30,y:y-205,w:22,h:205,lethal:true});
  triggers.push(at-s*.22,at+s*.70);length=at-start+s*2.2;
 }else if(kind==='swing'){
  const center=start+s*1.0;length=s*3.2;
  add('gap',center-s*.35,y,s*1.10,260);
  objects.push({kind:'swing',id:'swing-'+start,x:center-90,y:y-65,w:180,h:16,pivotX:center,pivotY:y-65-160,length:160,angle:.34,period:2.4,phase:r()*Math.PI*2});
  triggers.push(center-s*.60,center+32);
 }else if(kind==='fork'){
  const at=start+s*.95;length=s*3.2;
  add('gap',at,y,s*1.13,260);
  objects.push({kind:'platform',x:at+s*.08,y:y-90,w:s*.47,h:18,route:'HIGH'},{kind:'platform',x:at+s*.17,y:y-18,w:s*.62,h:18,route:'LOW'});
  triggers.push(at-s*.29,at+s*.43);alternatives=[[at+s*.015,at+s*.69]];
 }else if(kind==='sweep'||kind==='piston'){
  let at=start+s*.85;const count=2+Math.floor(r()*2);
  for(let i=0;i<count;i++){
   objects.push({kind:'mover',lethal:true,axis:kind==='sweep'?'x':'y',x:at,y:y-(kind==='sweep'?44:75),w:42,h:30,amplitude:kind==='sweep'?40:32,period:2.4,phase:r()*Math.PI*2});
   triggers.push(at-s*(kind==='sweep'?.28:.32));at+=s*(.85+r()*.2);
  }length=at-start+s*.6;
 }else if(['needlebridge','spike-islands','staircase','sawtooth','dropchain','crumble'].includes(kind)){
  const count=kind==='needlebridge'||kind==='crumble'?2+Math.floor(r()*(2+Math.floor(difficulty))):2+Math.floor(r()*(2+Math.floor(difficulty)));let height=0,takeoff=start+s*(.52+r()*.18);const first=takeoff;let lastLanding;
  for(let j=0;j<count;j++){
   let nextHeight;
   if(kind==='staircase')nextHeight=Math.min(165,55+j*(26+r()*12));
   else if(kind==='sawtooth')nextHeight=j%2?45+r()*18:100+r()*18;
   else if(kind==='dropchain')nextHeight=j===0?90:Math.max(42,90-j*(15+r()*8));
   else nextHeight=48+r()*55;
   const center=travel(takeoff,flight(height,nextHeight));
   const width=s*(kind==='crumble'?(.42+r()*.08):(.22+r()*.06-difficulty*.12));
   if(kind==='crumble')objects.push({kind:'crumble',id:'crumble-'+start+'-'+j,x:center-width/2,y:y-nextHeight,w:width,h:18,life:.36-difficulty*.17});
   else add('platform',center-width/2,y-nextHeight,width,18);
   triggers.push(takeoff);height=nextHeight;lastLanding=center;
   // Different widths give different waits between landing and the next tap.
   takeoff=center+width*(kind==='crumble'?.23:(.38+r()*.07));
  }
  triggers.push(takeoff);const exitLanding=travel(takeoff,flight(height,0));const bedStart=first+s*.19,bedEnd=exitLanding-s*(.05+r()*.015);
  if(kind==='spike-islands'||kind==='sawtooth'){
   // Leave room to clear the spike tips on descent, then a broken floor exit
   // keeps the final landing precise without an unavoidable spike collision.
   const spikeEnd=Math.min(bedEnd,exitLanding-s*.15);
   add('spike',bedStart,y-30,spikeEnd-bedStart,30);add('gap',spikeEnd,y,bedEnd-spikeEnd,260);
  }else add('gap',bedStart,y,bedEnd-bedStart,260);
  length=exitLanding-start+s*(.62-difficulty*.36+r()*.14);
 }else if(kind==='long-gap'||kind==='roof-gap'||kind==='twin-gaps'){
  const at=start+s*(.75+r()*.28),width=s*(.60+r()*.022+difficulty*.047);
  add('gap',at,y,width,260);triggers.push(at+s*.005);
  let end=at+width;
  if(kind==='twin-gaps')for(let j=0;j<1+(stage>=4?1:0);j++){
   const next=end+s*(.22-difficulty*.09+r()*.07);add('gap',next,y,s*(.60+r()*.022+difficulty*.042),260);triggers.push(next+s*.005);end=next+objects.at(-1).w;
  }
  if(kind==='roof-gap')add('ceiling',at-s*.6,y-150,s*.35,92);
  length=end-start+s*(.85+r()*.25);
 }else if(kind==='triple-bars'||kind==='late-vault'||kind==='intro'||kind==='recovery'){
  const count=kind==='triple-bars'?2+Math.floor(difficulty*2)+Math.floor(r()*2):1;let at=start+s*(.65+r()*.35);
  for(let j=0;j<count;j++){
   if(kind==='late-vault'){const h=96+r()*14;add('block',at,y-h,s*(.10+r()*.04),h);triggers.push(at-s*.27);}
   else{const w=kind==='recovery'||kind==='intro'?32:speed(at)*(.40+r()*.025+difficulty*.015);add('spike',at,y-32,w,32);triggers.push(kind==='recovery'||kind==='intro'?at-s*.27:at-speed(at)*(.33-w/(2*speed(at))));}
   at+=s*(.98-difficulty*.19+r()*.18);
  }
  length=at-start+s*(kind==='recovery'?.12:.3);if(kind==='recovery'){objects.length=0;triggers.length=0;length=s*(1.6-difficulty*.5+r()*.15);}
 }else if(kind==='downhill'||kind==='roller'){
  const drop=120+r()*160,approach=s*(.5+r()*.2),slope=s*(1.4+r()*1.2);
  terrain.push({x:start,w:approach,y0:y,y1:y},{x:start+approach,w:slope,y0:y,y1:y+drop});
  let flatStart=start+approach+slope;exit=y+drop;
  if(kind==='roller'){const up=s*(1.0+r()*.7),rise=drop*(.35+r()*.3);terrain.push({x:flatStart,w:up,y0:exit,y1:exit-rise});flatStart+=up;exit-=rise;}
  // Alternate a precision gap or an irregular pair of spikes after the slope.
  const at=flatStart+s*.35;
  if(r()<.5){add('gap',at,exit,s*(.62+r()*.025),260);triggers.push(at+s*.005);length=at-start+s*1.55;}
  else{add('spike',at,exit-32,s*(.21+r()*.08),32);triggers.push(at-s*.25);const at2=at+s*(.85+r()*.25);add('spike',at2,exit-32,40+r()*28,32);triggers.push(at2-s*.27);length=at2-start+s*1.05;}
  terrain.push({x:flatStart,w:start+length-flatStart,y0:exit,y1:exit});
 }
 if(!terrain.length)terrain.push({x:start,w:length,y0:y,y1:y});
 return {kind,start,y,length,exit,objects,triggers,terrain,alternatives,components,biome,label:kind==='divide'?['CAVERN CUT / SUMMIT','DEEP RELAY / SUMMIT','CAVE RIVER / SUMMIT','BROKEN RIDGE / CAVE'][biome.variant]:kind==='boat-run'?'RIVER CROSSING':LABELS[kind]};
}
// Per-camera appearance only: geometry and scores never depend on presentation.
function routeEnvironment(course,x,y){
 const sec=course.sections.find(s=>s.biome&&x>=s.x&&x<=s.x+s.w);if(!sec)return {cave:0,mountain:0,name:'OPEN RANGE'};
 const b=sec.biome,ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);},strength=ease((x-sec.x)/260)*ease((sec.x+sec.w-x)/340),depth=ease((y+R-b.roof-55)/100);
 return {cave:strength*depth,mountain:strength*(1-depth),name:depth>.5?'DEEP CAVE · HARD':'MOUNTAIN SUMMIT',section:sec};
}
class Course{
 constructor(seed,rules='race'){this.rules=rules==='jumpduck'?rules:'race';this.seed=seed;this.random=rng(seed);this.patterns=[];this.objects=[];this.terrain=[{x:-100000,w:100700,y0:FLOOR,y1:FLOOR}];this.sections=[];this.next=700;this.height=FLOOR;this.index=0;this.bag=[];this.sinceRest=0;this.restAfter=3;this.bagStage=0;this.previous='';this.nextDivide=3600;this.nextBoat=0;this.nextFeature=5000;this.nextDuck=3000;this.needNormal=false;this.hasDuck=false;this.featureKind=seed&1?'elevator-run':'grand-swing';this.recent=[];this.rejections=0;this.fallbacks=0;this.fallbackKinds={};}
 groundAt(x){let lo=0,hi=this.terrain.length-1;while(lo<=hi){const m=(lo+hi)>>1,t=this.terrain[m];if(x<t.x)hi=m-1;else if(x>t.x+t.w)lo=m+1;else return t.y0+(t.y1-t.y0)*Math.max(0,Math.min(1,(x-t.x)/t.w));}return this.terrain[Math.max(0,Math.min(hi,this.terrain.length-1))].y1;}
 ensure(x){while(this.next<x+3600)this.generate();}
 choose(){
  if(this.index===0)return 'intro';
  if(this.index===1){this.nextBoat=this.next+4500+this.random()*2200;this.sinceRest++;this.needNormal=true;return 'boat-run';}
  if(this.index===2){this.sinceRest++;this.needNormal=true;const kind=['late-chain','duck-vault','duck-gap'][Math.floor(this.random()*3)];if(kind!=='late-chain')this.nextDuck=this.next+3500+this.random()*1800;return kind;}
  if(!this.hasDuck){this.needNormal=true;this.nextDuck=this.next+4000+this.random()*2500;this.sinceRest++;return ['duck-run','duck-vault','duck-gap'][Math.floor(this.random()*3)];}
  if(this.sinceRest>=this.restAfter){this.sinceRest=0;this.restAfter=3+Math.floor(challengeAt(this.next).progress*2)+Math.floor(this.random()*2);return 'recovery';}
  if(!this.needNormal){
   const due=[['duck',this.nextDuck],['divide',this.nextDivide],['ride',this.nextFeature],['boat',this.nextBoat]].filter(v=>this.next>=v[1]).sort((a,b)=>a[1]-b[1]);
   const event=!this.hasDuck?'duck':this.next>=this.nextBoat+6000?'boat':due[0]?.[0];
   if(event){let kind;this.needNormal=true;
    if(event==='duck'){const pool=['duck-run','duck-vault','duck-gap'].filter(k=>k!==this.previous);kind=pool[Math.floor(this.random()*pool.length)];this.nextDuck=this.next+4000+this.random()*2500;}
    else if(event==='boat'){kind='boat-run';this.nextBoat=this.next+4500+this.random()*2200;}
    else if(event==='divide'){kind='divide';this.nextDivide=this.next+10000+this.random()*5000;}
    else{kind=this.featureKind;this.featureKind=kind==='elevator-run'?'grand-swing':'elevator-run';this.nextFeature=this.next+5000+this.random()*2200;}
    this.sinceRest+=kind==='divide'?2:1;return kind;
   }
  }
  this.needNormal=false;
  if(!this.hasDuck){this.sinceRest++;return ['triple-bars','long-gap','late-vault','barrel-run'][Math.floor(this.random()*4)];}
  const tier=challengeAt(this.next);if(tier.stage!==this.bagStage){if(this.bagStage<2)this.bag=[];this.bagStage=tier.stage;}
  if(tier.stage>=2&&!this.recent.includes('gauntlet')&&this.random()<.12+tier.progress*.20){this.sinceRest+=tier.stage>=4?2:1;return 'gauntlet';}
  if(!this.bag.length){this.bag=tier.stage===1?['needlebridge','long-gap','sweep','fork','pad-run','gate-run','late-vault']:FAMILIES.filter(k=>!['boat-run','duck-run','duck-vault','duck-gap'].includes(k));for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}}
  if(this.recent.includes(this.bag.at(-1))){const other=this.bag.findIndex(k=>!this.recent.includes(k));if(other>=0)[this.bag[other],this.bag[this.bag.length-1]]=[this.bag.at(-1),this.bag[other]];}
  this.sinceRest++;return this.bag.pop();
 }
 generate(){if(this.rules==='jumpduck')return generateRush(this);const kind=this.choose(),start=this.next,y=this.height;let section,windows;
  for(let attempt=0;attempt<8;attempt++){
   section=makeSection(kind,start,y,this.random,this.index);const n=this.terrain.length;this.terrain.push(...section.terrain);
   windows=routeWindows(section.objects,start,start+section.length,section.triggers,x=>this.groundAt(x));
   if(windows&&section.alternatives){section.routePlans=[windows.map(w=>({...w}))];for(const plan of section.alternatives){const alt=routeWindows(section.objects,start,start+section.length,plan,x=>this.groundAt(x));if(!alt){windows=null;break;}section.routePlans.push(alt);}}
   if(windows)break;this.terrain.length=n;this.rejections++;
  }
  if(!windows){this.fallbacks++;this.fallbackKinds[kind]=(this.fallbackKinds[kind]||0)+1;section=makeSection('recovery',start,y,this.random,this.index);const n=this.terrain.length;this.terrain.push(...section.terrain);windows=routeWindows(section.objects,start,start+section.length,section.triggers,x=>this.groundAt(x));if(!windows){this.terrain.length=n;throw Error('No verified route');}}
  this.objects.push(...section.objects);for(const win of windows)this.patterns.push({x:win.x,kind:section.kind,win});this.sections.push({x:start,w:section.length,y,biome:section.biome,label:section.label,kind:section.kind,components:section.components,stage:challengeAt(start).stage,routes:section.routePlans||null});this.height=section.exit;this.next=start+section.length;this.hasDuck ||= section.triggers.some(c=>c?.action==='duck');this.previous=section.kind;this.recent.push(section.kind);this.recent=this.recent.slice(-3);this.index++;
 }
 getObject(id){return this.objects.find(o=>o.id===id);}
 near(x){return this.objects.filter(o=>o.x+o.w+(o.range||o.amplitude||o.length||0)>x-80&&o.x-(o.range||o.amplitude||o.length||0)<x+100);}
 trim(x){this.objects=this.objects.filter(o=>o.x+o.w>x-1500);this.patterns=this.patterns.filter(o=>o.x>x-1500);this.sections=this.sections.filter(o=>o.x+o.w>x-1500);while(this.terrain.length>2&&this.terrain[1].x+this.terrain[1].w<x-1800)this.terrain.shift();}
}
function cpu(p,course,difficulty='normal',random=Math.random){
 if(!p.alive)return;
 const fork=course.sections.find(s=>s.routes&&p.x>=s.x-150&&p.x<s.x+s.w);
 let plans=course.patterns;
 if(fork){if(p.branchSection!==fork.x){p.branchSection=fork.x;p.branchIndex=random()<.5?0:1;}plans=fork.routes[p.branchIndex].map(win=>({x:win.x,kind:'fork',win}));}
 const pat=plans.find(v=>v.x>(p.handled||0)&&v.x+120>p.x);if(!pat)return;
 if(p.targetPattern!==pat.x){p.targetPattern=pat.x;const level={easy:[.16,.15],normal:[.07,.10],hard:[.025,.05]}[difficulty]||[.07,.10];p.skip=random()<level[0];p.target=pat.win.x+(random()-.5)*speed(pat.x)*level[1];p.targetDelay=(pat.win.rideDelay||0)+(random()-.5)*level[1];}
 if(pat.win.ride?p.riding===pat.win.ride&&p.rideAge>=p.targetDelay:p.x>=p.target){if(!p.skip)performCue(p,pat.win);p.handled=pat.x;}
}
function ranks(players){const sorted=[...players].sort((a,b)=>b.distance-a.distance);let rank=1;return sorted.map((p,i)=>{if(i&&p.distance!==sorted[i-1].distance)rank=i+1;return {...p,rank};});}

// Jump & Duck uses the same jump/collision engine, with a common time-driven pace.
function rushSpeed(seconds){const t=Math.max(0,seconds);return t<=60?420+18*t:1500+150*Math.log1p((t-60)/20);}
function rushX(seconds){const t=Math.max(0,seconds);if(t<=60)return 100+420*t+9*t*t;const u=t-60;return 57700+1500*u+150*((u+20)*Math.log1p(u/20)-u);}
function rushTime(x){if(x<=57700)return (-420+Math.sqrt(420**2+36*Math.max(0,x-100)))/18;let lo=60,hi=60+(x-57700)/1500;for(let n=0;n<38;n++){const m=(lo+hi)/2;if(rushX(m)<x)lo=m;else hi=m;}return (lo+hi)/2;}
function generateRush(c){
 const at=c.next,t=rushTime(at),v=rushSpeed(t),r=c.random;let type;
 if(c.index<3)type=['jump','duck','either'][c.index];else{
  if(!c.rushBag?.length){c.rushBag=['jump','duck','either','jump','duck','either'];for(let i=5;i>0;i--){const j=Math.floor(r()*(i+1));[c.rushBag[i],c.rushBag[j]]=[c.rushBag[j],c.rushBag[i]];}}
  if(c.rushBag.at(-1)===c.previous){const j=c.rushBag.findIndex(v=>v!==c.previous);if(j>=0)[c.rushBag[j],c.rushBag[c.rushBag.length-1]]=[c.rushBag.at(-1),c.rushBag[j]];}type=c.rushBag.pop();
 }c.previous=type;
 const action=type==='either'?(r()<.5?'jump':'duck'):type,w=v*(type==='jump'?.14:.17),id='rush-'+c.index;
 const o=type==='jump'?{id,kind:'spike',skin:'rushrail',required:type,x:at,y:FLOOR-36,w,h:36,lethal:true}:{id,kind:'duckbar',skin:type==='duck'?'rushduck':'rusheither',required:type,x:at,y:FLOOR-(type==='duck'?280:86),w,h:type==='duck'?256:62,lethal:true};
 const cue={x:at-v*(action==='jump'?(type==='either'?.24:.20):.13),...(action==='duck'?{action:'duck'}:{})};c.objects.push(o);c.patterns.push({x:cue.x,kind:'rush',win:{...cue,min:cue.x-v*.045,max:cue.x+v*.045}});
 const interval=(c.index>0&&c.index%16===0?1.18:Math.max(.75,1.06-t*.006)+r()*.06),next=rushX(t+interval);
 c.sections.push({x:at-v*.35,w:next-at,y:FLOOR,kind:'rush',label:type==='jump'?'JUMP ONLY':type==='duck'?'DUCK ONLY':'JUMP OR DUCK'});c.next=next;c.index++;
}
function step(p,course,dt=DT){
 if(course.rules!=='jumpduck')return runnerStep(p,course,dt);if(!p.alive)return;
 p.lives??=3;p.hits??=0;p.jdInvul=Math.max(0,(p.jdInvul||0)-dt);
 const view={rules:'jumpduck',groundAt:()=>FLOOR,near:x=>course.near(x).filter(o=>o.id!==p.lastHazard&&p.jdInvul<=0)};
 runnerStep(p,view,dt);p.distance=Math.round(p.time*1000)/1000;
 if(!p.alive){p.hits++;p.lives=Math.max(0,3-p.hits);p.lastHitTime=p.time;if(p.lives>0){p.alive=true;p.x-=72;p.y=FLOOR-R;p.vy=0;p.ground=true;p.coyote=.075;p.buffer=0;p.duck=0;p.duckBuffer=0;p.duckCooldown=0;p.jdInvul=.55;p.handled=Math.max(p.handled||0,p.x+72);}}
}

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
export default {async fetch(req,env){
 const u=new URL(req.url);if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 const health=()=>Response.json({game:'Bounce Rush',role:'multiplayer-server',version:VERSION,modes:['race','jumpduck'],rooms:!!env.ROOMS,...(!env.ROOMS?{error:'ROOMS binding missing. Deploy the supplied wrangler.toml.'}:{})},{status:env.ROOMS?200:503,headers:cors});
 if(u.pathname==='/health')return health();
 if(u.pathname==='/create'&&req.method==='POST'){
  if(!env.ROOMS)return Response.json({error:'ROOMS binding is missing. Deploy the supplied wrangler.toml.'},{status:503,headers:cors});
  try{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(6)),code=[...bytes].map(v=>alphabet[v%alphabet.length]).join('');const stub=env.ROOMS.get(env.ROOMS.idFromName(code));const result=await stub.fetch('https://room/init');if(!result.ok)throw Error('Room initialisation failed');return Response.json({code},{headers:cors});}catch{return Response.json({error:'Could not initialise a room. Check the ROOMS binding and RaceRoom SQLite migration in Cloudflare.'},{status:503,headers:cors});}
 }
 const match=u.pathname.match(/^\/room\/([A-Z2-9]{6})$/);if(match){if(!env.ROOMS)return Response.json({error:'ROOMS binding missing.'},{status:503,headers:cors});return env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(req);}
 if(env.ASSETS&&['GET','HEAD'].includes(req.method))return env.ASSETS.fetch(req);
 return health();
}};
export class RaceRoom{
 constructor(state,env){this.state=state;this.env=env;this.clients=new Map();this.phase='lobby';this.rules='race';this.host=null;this.timer=null;this.players=[];this.created=false;state.blockConcurrencyWhile(async()=>{this.created=!!(await state.storage.get('created'));});}
 async fetch(req){const u=new URL(req.url);if(u.pathname==='/init'){this.created=true;await this.state.storage.put('created',true);await this.state.storage.setAlarm(Date.now()+6*60*60*1000);return new Response('ok');}
 if(!this.created)return new Response('Room not found',{status:404});if(req.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});if(this.clients.size>=4)return new Response('Room full',{status:409});if(['race','preparing'].includes(this.phase))return new Response('Race in progress',{status:409});
 const pair=new WebSocketPair(),client=pair[0],ws=pair[1];ws.accept();const id=crypto.randomUUID();const used=[...this.clients.values()].map(c=>c.color);const color=[0,1,2,3].find(v=>!used.includes(v));const name=(u.searchParams.get('name')||'Player').replace(/[\x00-\x1f]/g,'').slice(0,16);const c={id,ws,name,color,ready:false,lastJump:0,messages:0,bucket:Date.now()};this.clients.set(id,c);if(this.phase==='done'){this.phase='lobby';for(const v of this.clients.values())v.ready=false;}this.host??=id;this.code=u.pathname.split('/').pop();ws.send(JSON.stringify({type:'welcome',id,version:VERSION}));ws.addEventListener('message',e=>this.receive(c,e));ws.addEventListener('close',()=>this.disconnect(id));ws.addEventListener('error',()=>this.disconnect(id));this.lobby();return new Response(null,{status:101,webSocket:client});}
 emit(data){const body=JSON.stringify(data);for(const c of this.clients.values())try{c.ws.send(body);}catch{}}
 error(c,message){try{c.ws.send(JSON.stringify({type:'error',message}));}catch{}}
 lobby(){this.emit({type:'lobby',code:this.code,host:this.host,rules:this.rules,version:VERSION,players:[...this.clients.values()].map(({id,name,color,ready})=>({id,name,color,ready}))});}
 receive(c,e){if(typeof e.data!=='string'||e.data.length>256)return;const now=Date.now();if(now-c.bucket>1000){c.bucket=now;c.messages=0;}if(++c.messages>35){c.ws.close(1008,'Rate limit');return;}let m;try{m=JSON.parse(e.data);}catch{return;}if(!m||typeof m!=='object'||Array.isArray(m))return;
 if((m.type==='jump'||m.type==='duck')&&this.phase==='race'){
  const p=this.players.find(p=>p.id===c.id);if(!p)return;
  if(m.seq!==undefined){if(!Number.isSafeInteger(m.seq)||m.seq<=0||m.seq<=(p.inputSeq||0))return;p.inputSeq=m.seq;}
  const gap=m.type==='jump'?65:90,key=m.type==='jump'?'lastJump':'lastDuck';
  if(now>=this.startAt&&now-(c[key]||0)>=gap){if(m.type==='jump')tap(p);else duck(p);c[key]=now;}return;
 }
 if(m.type==='settings'&&this.phase==='lobby'){if(c.id!==this.host)return this.error(c,'Only the host can choose the mode.');if(!['race','jumpduck'].includes(m.rules))return this.error(c,'Unknown game mode.');this.rules=m.rules;for(const v of this.clients.values())v.ready=false;this.lobby();return;}
 if(m.type==='loaded'&&this.phase==='preparing'){c.loaded=true;if([...this.clients.values()].every(v=>v.loaded))this.launch();return;}
 if(m.type==='away'&&this.phase==='race'){const p=this.players.find(p=>p.id===c.id);if(p)p.alive=false;this.broadcast();return;}
 if(m.type==='ready'&&this.phase==='lobby'){c.ready=!c.ready;this.lobby();return;}
 if(m.type==='start'&&this.phase==='lobby'){if(c.id!==this.host)return this.error(c,'Only the host can start.');if([...this.clients.values()].some(v=>!v.ready))return this.error(c,'Everyone must be ready.');if(this.clients.size<2&&!m.fill)return this.error(c,'Invite a friend or enable CPU fill.');this.start(!!m.fill);return;}
 if(m.type==='rematch'&&this.phase==='done'){this.phase='lobby';for(const v of this.clients.values())v.ready=false;this.lobby();}
 }
 start(fill){this.seed=crypto.getRandomValues(new Uint32Array(1))[0];this.course=new Course(this.seed,this.rules);this.course.ensure(6000);this.players=[...this.clients.values()].map(c=>player(c.id,c.name,c.color));if(fill){const used=this.players.map(p=>p.color);for(const color of [0,1,2,3].filter(v=>!used.includes(v)))this.players.push({...player('cpu'+color,'CPU '+(color+1),color),isCPU:true});}for(const c of this.clients.values()){c.lastJump=0;c.lastDuck=0;c.loaded=false;}this.phase='preparing';this.emit({type:'prepare',seed:this.seed,rules:this.rules,version:VERSION,players:this.players});this.prepareTimer=setTimeout(()=>{for(const c of [...this.clients.values()])if(!c.loaded){try{c.ws.close(1001,'Course loading timed out');}catch{}this.disconnect(c.id);}if(this.phase==='preparing'&&this.clients.size)this.launch();},15000);}
 launch(){if(this.phase!=='preparing'||!this.clients.size)return;clearTimeout(this.prepareTimer);this.prepareTimer=null;this.phase='race';this.startAt=Date.now()+3000;this.tickAt=this.startAt;this.lastBroadcast=0;this.broadcast();this.timer=setInterval(()=>this.tick(),16);}

 tick(){if(this.phase!=='race')return;const now=Date.now();if(now<this.startAt){if(now-this.lastBroadcast>=100)this.broadcast();return;}
 // Fixed-step server simulation. Cap catch-up work per callback, retaining time debt.
 let n=0;while(this.tickAt+DT*1000<=now&&n++<240){const lead=this.players.find(p=>p.alive);if(!lead)break;this.course.ensure(Math.max(...this.players.filter(p=>p.alive).map(p=>p.x)));for(const p of this.players){if(p.isCPU)cpu(p,this.course,'normal');step(p,this.course);}this.tickAt+=DT*1000;this.course.trim(Math.min(lead.x,...this.players.filter(p=>p.alive).map(p=>p.x)));}
 if(this.players.every(p=>!p.alive)){this.phase='done';clearInterval(this.timer);this.timer=null;this.broadcast();}else if(now-this.lastBroadcast>=50)this.broadcast();
 }
 broadcast(){this.lastBroadcast=Date.now();this.emit({type:'state',version:VERSION,seed:this.seed,rules:this.rules,countdown:Math.max(0,(this.startAt-Date.now())/1000),done:this.phase==='done',players:this.players});}
 disconnect(id){if(!this.clients.has(id))return;this.clients.delete(id);const p=this.players.find(p=>p.id===id);if(p)p.alive=false;if(this.host===id)this.host=this.clients.keys().next().value||null;if(!this.clients.size){clearTimeout(this.prepareTimer);clearInterval(this.timer);this.timer=null;this.phase='lobby';this.players=[];}else if(this.phase==='lobby')this.lobby();else if(this.phase==='preparing'){if([...this.clients.values()].every(v=>v.loaded))this.launch();}else{if(this.players.every(p=>!p.alive)&&this.phase==='race'){this.phase='done';clearInterval(this.timer);this.timer=null;}this.broadcast();}}
 async alarm(){clearTimeout(this.prepareTimer);for(const c of this.clients.values())c.ws.close(1001,'Room expired');clearInterval(this.timer);await this.state.storage.deleteAll();this.created=false;}
}
