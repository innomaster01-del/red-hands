// ===== game engine =====
const cv=document.getElementById('c');let ctx=cv.getContext('2d');
let W,H,DPR,cx,cy,L;
const SPEEDS={easy:{tp:320,aiDodge:.2,aiFlinch:.38,tell:300,aiSp:.2,aim:.14},normal:{tp:235,aiDodge:.32,aiFlinch:.26,tell:170,aiSp:.4,aim:.09},hard:{tp:175,aiDodge:.44,aiFlinch:.15,tell:60,aiSp:.55,aim:.06}};
// rubber band: when the CPU is ahead it eases off, when the player is ahead it tightens up (vs-computer only)
function aiAdapt(){if(G.mode!=='ai')return 1;const diff=P[1].hp-P[0].hp;return clamp(1-0.11*diff,0.62,1.3);}
const MAXHP=5;
const G={mode:'demo',twoHands:false,phase:'idle',att:0,t:0,pt:0,speed:PROF.speed||'normal',strike:null,shake:0,flipT:-1e9,armedT:0,demo:true,
  hitstop:0,slowT:0,zoom:null,flash:0,tutStep:0,tutAdvance:false,names:['',''],gs:null,flinchHand:0,hit:false,muted:PROF.muted};
const nH=()=>G.twoHands?2:1;
const laneX=k=>nH()===1?0:(k===0?-1:1)*W*0.245;
const opp=k=>nH()===1?0:1-k;
const REST=()=>0.1*L, PEAK=()=>-0.6*L, HITR=()=>0.45*L, FLINCH=()=>0.2*L;
function computeL(){L=G.twoHands?Math.min(W*0.25,H*0.2):Math.min(W*0.44,H*0.26);}
const SAFE={t:0,b:0};function readSafe(){try{let d=document.getElementById('safeProbe');if(!d){d=document.createElement('div');d.id='safeProbe';d.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';document.body.appendChild(d);}const cs=getComputedStyle(d);SAFE.t=parseFloat(cs.paddingTop)||0;SAFE.b=parseFloat(cs.paddingBottom)||0;}catch(e){}}
function resize(){readSafe();DPR=Math.min(window.devicePixelRatio||1,2.5);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cx=W/2;cy=H/2;computeL();}
addEventListener('resize',resize);resize();

function mkHand(k){return{k,x:0,y:0.1*L,ptr:null,fx:0,fy:0,sx:0,sy:0,t0:0,lfx:0,lfy:0,lft:0,offx:0,offy:0,touch:false,touchT:0,feint:0,aimx:0,flash:0,squash:0,shakeT:-1e9,marks:[],fa:null,dodge:null,prevDodge:null,feintSeen:false,dizzyT:-1e9,dizzyPerm:false,ice:0,char:0,flat:0,burnT:-1e9,crack:0}}
function mkPlayer(i){return{i,hp:MAXHP,ai:false,hands:[mkHand(0)],streak:0,charge:0,dbl:false,look:i?P2_LOOK:PROF.equip,plan:null,feints:0,seenT:-1,face:{e:'idle',until:0},energy:0,buf:[],bufT:0,bufK:0,bufBad:0,frozen:0,armSp:null,armT:0}}
function setFace(pl,e,ms){pl.face={e,until:ms<0?1e12:G.t+ms};}
const P=[mkPlayer(0),mkPlayer(1)];
const mkGS=()=>({hits:0,dodges:0,attempts:0,run:0,maxRun:0,flinches:0,feintsOk:0,maxCombo:0,bestReact:null,reactSum:0,reactN:0,doubleBoth:0,breaks:0});
const def=()=>1-G.att;
let parts=[],bursts=[],msgs=[],rings=[],bolts=[];

// ---------- audio ----------
let AC=null,noiseBuf=null;
const VO={},VO_KEYS=['fight','finish','fatality','flawless','youwin','cpuwins','combo','onfire','unstop','legend','breaker','sp_fire','sp_ice','sp_bolt','sp_tornado','sp_mega','blue','red','ko'];
function loadVO(){VO_KEYS.forEach(k=>{fetch('vo/'+k+'.mp3').then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(buf=>{VO[k]=buf;}).catch(()=>{});});}
function playVO(k,delay=0){const m=annMode();if(!AC||G.muted||G.demo||m==='off'||m==='fx')return false;if(m==='he'&&sayHe(k,delay))return true;if(!VO[k])return false;const s=AC.createBufferSource(),g=AC.createGain();s.buffer=VO[k];g.gain.value=.75;s.connect(g);g.connect(AC.destination);s.start(AC.currentTime+delay);return true;}
function initAudio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new(window.AudioContext||window.webkitAudioContext)();setTimeout(loadVO,0);const n=AC.sampleRate*1.2;noiseBuf=AC.createBuffer(1,n,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;}catch(e){AC=null}}
const canPlay=()=>AC&&!G.muted&&!G.demo;
const SFXV=.13;function env(g,t,a,peak,dec){peak=Math.max(.0002,peak*SFXV);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.001,t+dec);}
function noise(t,dur,ftype,freq,q,peak,dec){const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=ftype;f.frequency.value=freq;f.Q.value=q;const g=AC.createGain();env(g,t,.004,peak,dec);s.connect(f);f.connect(g);g.connect(AC.destination);s.start(t);s.stop(t+dur);return f;}
function osc(t,type,f0,f1,dur,peak,a=.005){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,a,peak,dur);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur+.03);return o;}
function sfxHit(sound,power=1){if(!canPlay())return;const t=AC.currentTime,pw=Math.min(1.8,power);
  if(sound==='sd_duck'){noise(t,.1,'bandpass',1800,1,.4*pw,.08);const o=osc(t,'sawtooth',520,300,.22,.35*pw);const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=1100;f.Q.value=3;o.disconnect();const g=AC.createGain();env(g,t,.01,.5*pw,.22);o.connect(f);f.connect(g);g.connect(AC.destination);osc(t+.13,'sawtooth',480,280,.18,.2*pw);}
  else if(sound==='sd_drum'){noise(t,.25,'highpass',1500,.7,.7*pw,.2);osc(t,'triangle',220,110,.15,.6*pw);if(pw>1.2)osc(t+.08,'sine',90,45,.4,.8);}
  else if(sound==='sd_boom'){noise(t,.9,'lowpass',600+300*pw,.8,1*pw,.8);osc(t,'sine',120,30,.6,.9*pw);}
  else if(sound==='sd_laser'){osc(t,'square',1800,120,.25,.25*pw);osc(t,'sawtooth',900,60,.3,.15*pw);noise(t,.08,'highpass',3000,1,.3,.06);}
  else{noise(t,.22,'bandpass',1400+Math.random()*700,.8,.9*pw,.12+.05*pw);osc(t,'sine',170+Math.random()*40,50,.14+.05*pw,.7*pw);if(pw>1.3)noise(t+.02,.5,'lowpass',400,.7,.6,.45);}
}
function sfxWhoosh(){if(!canPlay())return;const t=AC.currentTime;const f=noise(t,.28,'bandpass',350,1.2,.3,.22);f.frequency.setValueAtTime(350,t);f.frequency.exponentialRampToValueAtTime(2200,t+.18);}
function sfxTone(fr,type='triangle',dur=.12,vol=.22,gap=.09){if(!canPlay())return;const t0=AC.currentTime;fr.forEach((f,i)=>osc(t0+i*gap,type,f,0,dur,vol,.01));}
function sfxBoing(){if(!canPlay())return;const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(700,t+.08);o.frequency.exponentialRampToValueAtTime(160,t+.3);env(g,t,.005,.3,.32);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.35);}
function buzz(p){if(G.demo||!PROF.vibe)return;try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}

// ---------- frames ----------
function toWorld(p,x,y){return p===0?[cx+x,cy+y]:[cx-x,cy-y]}
function toLocal(p,wx,wy){return p===0?[wx-cx,wy-cy]:[cx-wx,cy-wy]}
function inFrame(p,fn){ctx.save();ctx.translate(cx,cy);if(p===1)ctx.rotate(PI);fn();ctx.restore();}

// ---------- fx ----------
// ---------- glass text layer (real backdrop blur, DOM over the canvas) ----------
const FXL=document.getElementById('fxl');
function hexRgb(h){h=(h||'#ffffff').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return(n>>16)+','+((n>>8)&255)+','+(n&255);}
function fxWrap(f){const w=document.createElement('div');w.className='fxw'+(f===1?' flip':'');FXL.appendChild(w);return w;}
const msgEls=[null,null];
function msg(p,text,color='#fff',size=1){if(G.demo||P[p].ai)return;if(G.mode==='2p'&&G.banner&&G.t-G.banner.t<300&&G.banner.f!==p)return;
  if(msgEls[p]){msgEls[p].remove();msgEls[p]=null;}
  const w=fxWrap(viewFrame(p)),el=document.createElement('div');el.className='gl';el.style.setProperty('--c',hexRgb(color==='#fff'?'#8a7cff':color));
  el.style.top=Math.max(H*0.6,H-262-SAFE.b)+'px';el.style.fontSize=Math.round(Math.min(26,W*0.06)*size)+'px';el.textContent=text;w.appendChild(el);msgEls[p]=w;
  setTimeout(()=>{if(msgEls[p]===w){w.remove();msgEls[p]=null;}else w.remove();},1400);}
function clearMsgs(){msgEls.forEach((e,i)=>{if(e)e.remove();msgEls[i]=null;});}
let bEl=null,bRef=null;
function syncBanner(){const b=G.banner;if(b===bRef)return;
  if(bEl){const o=bEl;o.firstChild&&o.firstChild.classList.add('out');setTimeout(()=>o.remove(),380);}bEl=null;bRef=b;
  if(b&&!G.demo){const w=fxWrap(b.f),el=document.createElement('div');el.className='gban'+(b.style==='red'?' red':'');el.style.setProperty('--c',hexRgb(b.col||'#ff4d6d'));
    el.style.top=Math.round(H*0.2)+'px';el.textContent=b.text;w.appendChild(el);bEl=w;}}
function clearFx(){FXL.innerHTML='';msgEls[0]=msgEls[1]=null;bEl=null;bRef=null;}
function showFatCard(ft){const w=fxWrap(viewFrame(ft.w)),el=document.createElement('div');el.className='gfat';el.style.top=Math.round(H*.36)+'px';
  const a=document.createElement('b');a.textContent=t('fatality');el.appendChild(a);const s2=document.createElement('span');s2.textContent=ft.sub;el.appendChild(s2);w.appendChild(el);}
function showWinCard(wt){const w=fxWrap(viewFrame(wt.w)),el=document.createElement('div');el.className='gwin';
  el.style.top=Math.round(H*(G.fatTitle?0.6:0.5))+'px';const a=document.createElement('b');a.textContent=wt.txt;el.appendChild(a);
  if(wt.flawless){const s2=document.createElement('span');s2.textContent=t('flawless');el.appendChild(s2);}w.appendChild(el);}
function burst(wx,wy,text,col,tag){bursts.push({x:wx,y:wy,text,col,tag,t:G.t,life:640,rot:rand(-.25,.25)});}
function sparks(wx,wy,n,type){const cols={sp_stars:['#ffd23f','#fff','#ff4d6d','#ff9f1c'],sp_hearts:['#ff4d6d','#ff7ac8','#fff'],sp_fire:['#ff3b1f','#ff9f1c','#ffd23f'],sp_confetti:['#ffd23f','#ff4d6d','#3b7bff','#3ee08f','#fff'],sp_coins:['#f5c542','#ffe48a']}[type]||['#ffd23f','#fff'];
  const shape={sp_stars:'star',sp_hearts:'heart',sp_fire:'fire',sp_confetti:'conf',sp_coins:'coin'}[type]||'star';
  for(let i=0;i<n;i++){const a=rand(0,PI*2),s=rand(.9,3.6)*L/100;parts.push({x:wx,y:wy,vx:Math.cos(a)*s*1.6,vy:Math.sin(a)*s*1.6-(shape==='fire'?1:0),life:rand(380,750),t:G.t,col:cols[i%cols.length],sz:rand(.03,.065)*L,rot:rand(0,6),vr:rand(-8,8),shape,drag:.92});}}
function winFx(type){const cols=['#ffd23f','#ff4d6d','#3b7bff','#3ee08f','#fff'];
  if(type==='wn_fireworks'){for(let b=0;b<7;b++){const x=rand(W*.15,W*.85),y=rand(H*.12,H*.55),col=cols[b%5],d=b*260;for(let i=0;i<34;i++){const a=i/34*PI*2,s=rand(2.4,4.2);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1300,t:G.t+d,col,sz:4,rot:0,vr:0,shape:'dot',drag:.965,grav:.05});}}}
  else if(type==='wn_emoji'||type==='wn_gold'){for(let i=0;i<70;i++)parts.push({x:rand(0,W),y:rand(-H*.6,-20),vx:rand(-.4,.4),vy:rand(2,4.5),life:rand(2200,3400),t:G.t,col:'#f5c542',sz:rand(22,38),rot:rand(-.5,.5),vr:rand(-2,2),shape:type==='wn_gold'?'coin':'emoji',em:['🖐️','✋','🤚','💥'][i%4],drag:1});}
  else{for(let i=0;i<130;i++)parts.push({x:rand(0,W),y:rand(-H*.3,0),vx:rand(-.6,.6),vy:rand(1,3.5),life:rand(1800,3200),t:G.t,col:cols[i%5],sz:rand(5,10),rot:rand(0,6),vr:rand(-6,6),shape:'conf',drag:1,sway:true});}}

// ---------- flow ----------
function setupPlayers(){P.forEach(p=>{p.hands=[];for(let k=0;k<nH();k++)p.hands.push(mkHand(k));Object.assign(p,{hp:MAXHP,streak:0,charge:0,dbl:false,plan:null,feints:0,seenT:-1,face:{e:'idle',until:0},energy:0,buf:[],bufT:0,bufBad:0,frozen:0,armSp:null,rdy:{}});});}
function startGame(mode,opts={}){
  initAudio();
  G.mode=mode;G.demo=false;G.practice=false;G.paused=false;G.train=null;G.fatalFx=null;G.twoHands=!!opts.twoHands&&mode!=='tut'&&mode!=='react';computeL();
  setupPlayers();
  P[0].ai=false;P[1].ai=(mode!=='2p');if(mode==='ai'||mode==='2p')P.forEach(p=>p.energy=35);
  P[0].look=PROF.equip;P[1].look=mode==='2p'?P2_LOOK:(AI_LOOKS[G.speed]||AI_LOOKS.normal);
  G.names=opts.names||[PROF.name||t('you'),mode==='2p'?t('red'):t('cpu')];
  G.gs=[mkGS(),mkGS()];G.strike=null;G.hitstop=0;G.slowT=0;G.zoom=null;G.flash=0;
  G.att=mode==='tut'?0:(Math.random()<.5?0:1);if(mode==='react')G.att=1;
  if(mode==='tut'){G.tutStep=1;G.tutAdvance=false;}
  if(mode==='react'){G.prevSpeed=G.speed;G.speed='normal';G.att=1;G.rtRound=0;P[1].look=AI_LOOKS.normal;}
  parts=[];bursts=[];msgs=[];rings=[];G.combo=null;G.banner=null;G.winPose=null;G.fatal=null;G.fatalDone=null;bolts=[];G.fatTitle=null;G.winTitle=null;G.cine=0;G.cin=null;clearFx();
  toReset();
  if(mode!=='tut'){G.phase='countdown';G.pt=G.t;G.cdN=-1;}
}
function startDemo(){clearFx();G.cin=null;G.fatTitle=null;G.winTitle=null;G.cine=0;G.combo=null;G.banner=null;G.winPose=null;rings=[];G.demo=true;G.mode='demo';G.twoHands=false;computeL();setupPlayers();P.forEach(p=>p.ai=true);P[0].look=PROF.equip;P[1].look=P2_LOOK;G.att=0;G.gs=[mkGS(),mkGS()];parts=[];bursts=[];msgs=[];toReset();}
function toReset(){G.phase='reset';G.pt=G.t;G.strike=null;
  P.forEach(p=>{p.plan=null;p.feints=0;p.hands.forEach(h=>{h.feint=0;h.aimx=0;h.fa=null;h.dodge=null;h.prevDodge=null;h.feintSeen=false;});});}
function toArmed(){G.phase='armed';G.pt=G.t;G.armedT=G.t;P[def()].armSp=null;
  P[def()].hands.forEach(h=>{if(h.ptr!=null){h.offx=0-h.fx;h.offy=REST()-h.fy;h.touch=true;}h.touchT=G.t;});
  P[G.att].hands.forEach(h=>{h.touch=false;if(h.ptr!=null){h.sx=h.fx;h.sy=h.fy;h.t0=-1e9;}});
}
function startStrike(k,type,forced,dir,special){
  if(!forced&&G.phase!=='armed')return;
  const a=P[G.att];a.buf=[];
  if(type==='double'){a.dbl=false;a.charge=0;}
  if(special==='tornado')type='tornado';
  G.strike={k,j:opp(k),type,dir:dir||1,stage:1,hits:0,forced:!!forced,special:special||null};
  if(special){const sp=SPECIALS.find(x=>x.id===special);G.banner={text:sp.ic+' '+t('sp_'+special),col:sp.col,style:sp.style,t:G.t,f:viewFrame(a.i),life:1100,n:0};announce(t('sp_'+special),'special','sp_'+special);sfxSpecial(special);
    if(special==='bolt'){const d=P[def()],dh=d.hands[opp(k)];const [wx,wy]=toWorld(d.i,laneX(opp(k))+dh.x,dh.y+0.5*L);addBolt(wx,wy);G.flash=.5;}
    if(!a.ai&&G.mode!=='tut')unlockAch('special');if(G.train)trainCheck('sp',special);}
  G.phase='slap';a.hands.forEach(h=>{h.feint=0;h.fa=null;});
  beginStage();
}
function beginStage(){const s=G.strike,a=P[G.att],h=a.hands[s.k],d=P[def()],dh=d.hands[s.j];
  s.t0=G.t;s.y0=h.y;s.x0=h.x;s.impacted=false;s.reacted=0;s.trail=[];
  s.tp=SPEEDS[G.speed].tp*(s.special==='bolt'?0.55:s.special==='mega'?1.1:s.special==='tornado'?1.25:1)*(s.type==='diag'?1.2:1)*(s.stage===2?0.8:1)*(s.forced?0.7:1)*(G.mode==='tut'&&a.ai?2.3:1);
  if(!a.ai&&!s.forced&&!s.special&&s.stage===1&&a.swipeK){s.tp*=a.swipeK;s.fast=a.swipeK<.9;}a.swipeK=0;
  if(s.forced)s.aim=0;else if(s.stage===2)s.aim=clamp(-(laneX(s.j)+dh.x)-laneX(s.k),-0.32*L,0.32*L);else s.aim=h.aimx;
  sfxWhoosh();
}
function updStrike(){const s=G.strike,a=P[G.att],h=a.hands[s.k];
  if(!s.impacted){const u=(G.t-s.t0)/s.tp;
    if(u<1){(s.trail=s.trail||[]).push({x:h.x,y:h.y});if(s.trail.length>5)s.trail.shift();const AN=.16,back=0.13*L;h.y=u<AN?s.y0+back*Math.sin(u/AN*PI/2):lerp(s.y0+back,PEAK(),Math.pow((u-AN)/(1-AN),1.55));
      if(s.type==='tornado')h.x=s.aim+Math.sin(u*PI*3)*0.6*L;else if(s.type==='diag')h.x=lerp(s.x0,s.aim+s.dir*0.45*L*(2*u-1),Math.min(1,u*4));else h.x=lerp(s.x0,s.aim,Math.min(1,u*2));
      specialTrail(s,h);}
    else{h.y=PEAK();h.x=s.type==='diag'?s.aim+s.dir*0.45*L:s.aim;impactStage();}
  }else{const v=(G.t-s.impT)/200;h.y=lerp(PEAK(),REST(),1-Math.pow(1-Math.min(1,v),3));
    if(s.type==='double'&&s.stage===1&&v>=0.6&&P[def()].hp>0){s.stage=2;beginStage();}
    else if(v>=1)finishStrike();}
}
function impactStage(){const s=G.strike,a=P[G.att],d=P[def()],h=a.hands[s.k],dh=d.hands[s.j];
  s.impacted=true;s.impT=G.t;
  const lk=laneX(s.k),sy=PEAK()+0.25*L,dx=-(laneX(s.j)+dh.x),dy=-(dh.y+0.45*L);
  let dist;
  if(s.type==='diag'){const px=clamp(dx,lk+s.aim-0.45*L,lk+s.aim+0.45*L);dist=Math.hypot(dx-px,dy-sy);}
  else if(s.type==='tornado'){const px=clamp(dx,lk+s.aim-0.75*L,lk+s.aim+0.75*L);dist=Math.hypot(dx-px,dy-sy);}
  else dist=Math.hypot(lk+h.x-dx,sy-dy);
  let hit=s.forced||dist<HITR()*(s.type==='diag'?0.92:s.special==='fire'?1.35:1);
  const ilx=-(lk+h.x)-(laneX(s.j)+dh.x),ily=-sy-dh.y;
  let graze=false;
  if(!s.forced&&s.stage===1&&G.mode!=='tut'){if(hit&&ily<0.1*L)graze=true;else if(!hit&&dist<HITR()*1.3)graze=true;if(graze)hit=false;}
  if(s.stage===1&&!s.forced&&d.frozen){d.frozen=0;}
  const [wx,wy]=toWorld(G.att,(lk+h.x+dx)/2,(sy+dy)/2);
  const track=G.mode!=='tut'&&!G.demo;
  if(track&&s.stage===1&&!s.forced&&!d.ai){const g=G.gs[d.i];g.attempts++;
    if(graze){g.run=0;}else if(!hit){g.dodges++;g.run++;g.maxRun=Math.max(g.maxRun,g.run);
      if(s.reacted){g.bestReact=g.bestReact==null?s.reacted:Math.min(g.bestReact,s.reacted);g.reactSum+=s.reacted;g.reactN++;if(s.reacted<180)unlockAch('lightning');}
      if(g.run>=10)unlockAch('ninja');}else g.run=0;}
  if(hit){
    const dmg=s.special==='mega'?2:1;s.hits++;d.hp=Math.max(0,d.hp-dmg);a.energy=Math.min(100,a.energy+14+5*Math.min(4,a.streak));
    if(s.special==='fire'){dh.burnT=G.t;dh.char=Math.max(dh.char,.45);}if(s.special==='ice'){d.frozen=1;dh.ice=1;}if(s.special==='mega'){G.shake=26;}if(s.special==='bolt'){const [bx,by]=toWorld(d.i,laneX(s.j)+dh.x,dh.y+0.5*L);addBolt(bx,by);dh.char=Math.max(dh.char,.35);}
   dh.flash=1;dh.squash=1;dh.shakeT=G.t+120;h.squash=.8;dh.rv=(dh.rv||0)+0.0045*L*(s.special==='mega'?1.6:1);dh.dizzyT=G.t;if(d.hp<=0)dh.dizzyPerm=true;
    setFace(a,'happy',1000);setFace(d,'ouch',1200);
    dh.marks.push({t:G.t,x:clamp(ilx+rand(-.07,.07)*L,-0.12*L,0.12*L),y:rand(.4,.48)*L,r:rand(-.16,.16),s:rand(.9,1.05),kind:ily<0.18*L?'tip':'palm'});
    a.streak++;a.charge++;
    if(track){const g=G.gs[a.i];g.hits++;g.maxCombo=Math.max(g.maxCombo,a.streak);
      if(!a.ai){if(a.streak>=5)unlockAch('combo5');if(s.type==='diag')unlockAch('diagonal');if(s.type==='double'&&s.stage===2&&s.hits===2){g.doubleBoth++;unlockAch('double');}}}
    const decisive=d.hp<=0;
    const power=(decisive?1.6:1)*(s.type==='double'&&s.stage===2?1.25:1)*(s.type==='diag'?1.15:1)*(G.speed==='hard'?1.1:1);
    sfxHit(a.look.sound,power);buzz(decisive?[120,50,180]:s.special==='mega'?[150,50,220]:s.special?[100,40,150]:70);
    G.hitstop=decisive?200:Math.round(60+25*power);
    G.shake=Math.min(26,10+a.streak*3)*(decisive?1.5:1);
    if(decisive&&!G.demo&&G.mode!=='tut'){G.slowT=1200;G.zoom={x:wx,y:wy,a:0.2,t0:performance.now()};G.flash=1;}
    const wl=(item(a.look.words)||item('wd_classic')).w;const words=wl[LANG]||wl.he;
    burst(wx,wy,words[(Math.random()*words.length)|0],decisive?'#ff9f1c':a.streak>=2?comboCol(a.streak):'#ffd23f',a.streak>=2?'x'+a.streak:null);
    rings.push({x:wx,y:wy,t:G.t,life:420,max:L*(decisive?1.5:1.0),col:'#fff',w:10},{x:wx,y:wy,t:G.t+60,life:480,max:L*(decisive?1.9:1.3),col:comboCol(a.streak),w:6});
    for(let i=0;i<10;i++){const an=rand(0,PI*2),sp=rand(.6,1.8);parts.push({x:wx+Math.cos(an)*L*.15,y:wy+Math.sin(an)*L*.1,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp*.6,life:rand(500,800),t:G.t,col:'rgba(255,255,255,.55)',sz:rand(.05,.09)*L,rot:0,vr:0,shape:'dust',drag:.95});}
    if(a.streak>=2&&!G.demo&&G.mode!=='tut'){G.combo={n:a.streak,t:G.t,p:a.i,endT:null,broken:false};comboBanner(a);}
    sparks(wx,wy,decisive?32:18,a.look.sparks);
  }else if(graze){s.graze=true;dh.rv=(dh.rv||0)+0.002*L;dh.marks.push({x:clamp(ilx,-0.22*L,0.22*L),r:rand(-.3,.3),kind:'tip'});dh.flash=.6;dh.squash=.5;dh.shakeT=G.t+60;
    burst(wx,wy,t('graze_burst'),'#ff9fbf');sfxHit(a.look.sound,.45);buzz(25);G.shake=5;setFace(d,'scared',1000);setFace(a,'smug',900);
  }else if(s.stage===1){burst(wx,wy,t('miss_burst'),'#9fe7ff');if(canPlay())sfxTone([330,247],'sine',.16,.16,.1);
    if(!s.forced){d.energy=Math.min(100,d.energy+25);setFace(a,'angry',1000);setFace(d,'cool',1200);if(a.streak>=3&&!G.demo&&G.mode!=='tut')comboBreak(a,d,dh,s.j);}}
}
function finishStrike(){const s=G.strike,a=P[G.att],d=P[def()];
  G.phase='result';G.pt=G.t;G.hit=s.hits>0;G.graze=!G.hit&&!!s.graze;
  if(G.hit){
    if(d.hp<=0&&G.mode!=='tut'){msg(G.att,t('m_win'),'#ffd23f',1.2);msg(d.i,t('m_lose'),'#fff',1);}
    else{msg(G.att,s.hits===2?t('m_double'):a.streak>1?t('m_combo',a.streak):tp('m_hit_p'),a.streak>1?comboCol(a.streak):'#ffb020',1.1);msg(d.i,tp('m_ouch_p'),'#ff4d6d',1.1);
}
  }else if(G.graze){msg(G.att,t('m_graze_att'),'#ff8fa3',1);msg(d.i,t('m_graze_def'),'#ffd23f',1.1);}
  else{a.streak=0;a.charge=0;endCombo();msg(G.att,tp('m_miss_p'),'#3bc3ff',1);msg(d.i,G.mode==='react'&&s.reacted?`⚡ ${Math.round(s.reacted)}ms!`:tp('m_dodged_p'),'#22c56e',1.1);}
  if(G.mode==='tut'){
    if(G.tutStep===1&&G.hit&&G.att===0)G.tutAdvance=true;
    else if(G.tutStep===2&&G.att===1){if(!G.hit)G.tutAdvance=true;else msg(0,t('tut_retry2'),'#ffd23f',1);}
    else if(G.tutStep===3&&!s.forced&&G.hit)msg(0,t('tut_hint3'),'#ffd23f',.9);
    else if(G.tutStep===3&&s.forced&&G.tutFlinched)G.tutAdvance=true;
    else if(G.tutStep===4&&G.att===0){if(s.special&&G.hit)G.tutAdvance=true;else msg(0,t('tut_hint4'),'#ffd23f',.9);}
  }
}
function flinch(j){const d=P[def()],a=P[G.att];G.phase='flinch';G.pt=G.t;G.flinchHand=j;sfxBoing();buzz(30);
  const feinting=a.hands.some(h=>h.feint>0.04*L);
  if(G.mode!=='tut'&&!G.demo){if(!d.ai)G.gs[d.i].flinches++;if(feinting)a.energy=Math.min(100,a.energy+15);if(feinting&&!a.ai){G.gs[a.i].feintsOk++;if(G.gs[a.i].feintsOk>=3)unlockAch('trickster');}}
  if(G.mode==='tut'){if(G.tutStep===3&&G.att===0)G.tutFlinched=true;if(G.tutStep===2&&G.att===1)msg(0,t('tut_flinch2'),'#ffd23f',1);}
  msg(d.i,t('m_flinch'),'#ffd23f',1.1);msg(G.att,t('m_free'),'#3ee08f',.9);setFace(d,'scared',1000);setFace(a,'smug',1000);
  d.hands.forEach(h=>{h.dodge=null;h.prevDodge=null;});
}
function endResult(){const d=P[def()];
  if(G.mode==='tut'){P.forEach(p=>p.hp=MAXHP);
    if(G.tutAdvance){G.tutAdvance=false;G.tutFlinched=false;G.tutStep++;
      if(G.tutStep>4){G.phase='over';onTutorialDone();return;}
      G.att=G.tutStep===2?1:0;G.flipT=G.t;sfxTone([659,784,1047],'triangle',.12,.18,.08);onTutStep(G.tutStep);}
    if(G.tutStep===4)P[0].energy=100;
    toReset();return;}
  if(G.train){trainNext();return;}
  if(G.mode==='react'){P.forEach(p=>p.hp=MAXHP);G.rtRound++;if(G.rtRound>=5){G.phase='over';G.speed=G.prevSpeed||G.speed;onReactDone();return;}G.att=1;toReset();return;}
  if(d.hp<=0){if(G.demo){P.forEach(p=>{p.hp=MAXHP;p.energy=0;p.hands.forEach(h=>{h.marks=[];h.char=0;h.ice=0;h.dizzyPerm=false;});});toReset();return;}toFinish(G.att);return;}
  if(!G.hit&&!G.graze){G.att=1-G.att;G.flipT=G.t;}
  toReset();
}
function timeout(){endCombo();msg(G.att,t('m_timeout'),'#fff',1);msg(def(),t('m_yourturn'),'#ffd23f',1);P[G.att].streak=0;P[G.att].charge=0;G.att=1-G.att;G.flipT=G.t;sfxTone([440,330],'sine',.15,.15,.1);toReset();}
function gameOver(w,quick){G.phase='over';G.winPose={w,t:G.t,still:!!quick};
  if(!G.demo){const nm=G.mode==='2p'?t('wins',G.names[w]):(w===0?t('go_win'):t('go_cpu'));G.winTitle={t:G.t+(quick?150:500),w,txt:nm,flawless:P[w].hp===MAXHP};clearMsgs();G.banner=null;const wt=G.winTitle;setTimeout(()=>{if(G.winTitle===wt&&G.phase==='over')showWinCard(wt);},quick?500:700);}endCombo();setFace(P[w],'happy',-1);setFace(P[1-w],'ouch',-1);winFx(PROF.equip.win);announce(t('ann_win'),'win',G.demo?null:G.mode==='2p'?(w===0?'blue':'red'):(w===0?'youwin':'cpuwins'));if(!G.demo&&P[w].hp===MAXHP)playVO('flawless',1.3);setTimeout(()=>onGameOver(w),3000);}


// ---------- combos ----------
const COMBO_COLS={2:'#5fb8ff',3:'#ff9f1c',4:'#3cdcff',5:'#c86bff'};
const comboCol=n=>COMBO_COLS[Math.min(5,Math.max(2,n))];
const viewFrame=p=>G.mode==='2p'?p:0;
function endCombo(){if(G.combo&&!G.combo.endT)G.combo.endT=G.t;}
function comboBanner(a){const n=a.streak,txt=t('st_'+Math.min(5,n));
  G.banner={text:txt,col:comboCol(n),t:G.t,f:viewFrame(a.i),life:1250,n};
  announce(txt,'combo',['','','combo','onfire','unstop','legend'][Math.min(5,n)]);
  }
function comboBreak(a,d,dh,j){
  const c=G.combo;if(c){c.broken=true;c.endT=G.t;
    const [x,y]=comboPos(viewFrame(c.p),c.p);const [wx,wy]=toWorld(viewFrame(c.p),x,y);
    for(let i=0;i<22;i++){const an=rand(0,PI*2),sp=rand(2,6);parts.push({x:wx,y:wy,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,life:rand(600,1000),t:G.t,col:i%2?'#ffffff':comboCol(c.n),sz:rand(8,16),rot:rand(0,6),vr:rand(-10,10),shape:'shard',drag:.96,grav:.12});}}
  G.banner={text:t('breaker'),col:'#22c56e',t:G.t,f:viewFrame(d.i),life:1300,n:0};
  announce(t('breaker'),'combo','breaker');G.hitstop=110;G.shake=14;
  if(canPlay()){const tt=AC.currentTime;noise(tt,.3,'highpass',3500,1,.6,.25);sfxTone([1568,1319,1760,2093],'triangle',.09,.14,.04);}
  if(d.hp<MAXHP){d.hp++;msg(d.i,t('m_break_bonus'),'#3ee08f',1.1);}
  if(!d.ai){G.gs[d.i].breaks++;unlockAch('breaker');}
  setFace(d,'cool',1500);setFace(a,'angry',1500);buzz([30,30,30]);
}
function comboPos(f,p){const mine=f===p;return[nH()>1?0:-W*0.31,(mine?1:-1)*H*0.14];}
const annMode=()=>{let m=PROF.annMode||(PROF.announcer===false?'off':(LANG==='he'?'he':'en'));if(m==='voice')m=LANG==='he'?'he':'en';return m;};
const HE_LINES={fight:'קְרָב!',finish:'תִּגְמֹר אוֹתוֹ!',fatality:'חִיסוּל!',flawless:'נִיצָּחוֹן מֻשְׁלָם!',youwin:'נִיצַּחְתָּ!',cpuwins:'הַמַּחְשֵׁב נִיצֵּחַ!',combo:'קוֹמְבּוֹ!',onfire:'בּוֹעֵר!',unstop:'בִּלְתִּי עָצִיר!',legend:'אַגָּדָה!',breaker:'שָׁבַרְתָּ אֶת הַקּוֹמְבּוֹ!',
  sp_fire:'סְטִירַת אֵשׁ!',sp_ice:'סְטִירַת קֶרַח!',sp_bolt:'בָּרָק!',sp_tornado:'טוֹרְנָדוֹ!',sp_mega:'מֶגָה סְטִירָה!',blue:'הַכָּחֹל נִיצֵּחַ!',red:'הָאָדֹם נִיצֵּחַ!',ko:'נוֹקְאָאוּט!'};
function heVoice(){try{const vs=speechSynthesis.getVoices().filter(v=>/^(he|iw)/i.test(v.lang));return vs.find(v=>/natural|neural|premium|enhanced|google/i.test(v.name))||vs[0]||null;}catch(e){return null;}}
function sayHe(k,delay){const v=heVoice();if(!v||!HE_LINES[k])return false;try{const ss=speechSynthesis;ss.cancel();const u=new SpeechSynthesisUtterance(HE_LINES[k]);u.voice=v;u.lang=v.lang;u.pitch=.82;u.rate=.98;u.volume=1;setTimeout(()=>ss.speak(u),delay*1000);return true;}catch(e){return false;}}
// cinematic synthesized stingers instead of the robotic TTS
function stinger(kind){if(!canPlay())return;const t0=AC.currentTime;
  const chord=(fr,type,dur,vol,del=0)=>fr.forEach(f=>{osc(t0+del,type,f,0,dur,vol,.02);osc(t0+del,type,f*1.006,0,dur,vol*.6,.02);});
  if(kind==='fatal'){osc(t0,'sine',48,28,2.2,.9);noise(t0,2,'lowpass',180,.7,.5,1.9);const r=noise(t0,1.1,'bandpass',300,1.5,.35,1.05);r.frequency.exponentialRampToValueAtTime(4000,t0+1);chord([110,130.8,164.8],'sawtooth',1.6,.05,.05);chord([55,82.4],'square',1.4,.05,.05);}
  else if(kind==='finish'){[0,.32,.64].forEach((d,i)=>{osc(t0+d,'sine',90-i*10,35,.45,.9);noise(t0+d,.25,'lowpass',500,.8,.6,.22);});chord([146.8,174.6,220],'sawtooth',1.1,.04,.64);}
  else if(kind==='win'){chord([523.3,659.3,784],'triangle',.25,.07);chord([587.3,740,880],'triangle',.25,.07,.18);chord([659.3,830.6,987.8,1318.5],'triangle',.9,.07,.36);noise(t0+.36,.8,'highpass',6000,.7,.15,.7);}
  else if(kind==='special'){const r=noise(t0,.45,'bandpass',400,2,.4,.4);r.frequency.exponentialRampToValueAtTime(3500,t0+.35);chord([392,523.3,784],'sawtooth',.4,.045,.3);osc(t0+.3,'sine',80,40,.5,.7);}
  else{const r=noise(t0,.3,'bandpass',600,2,.3,.28);r.frequency.exponentialRampToValueAtTime(5000,t0+.25);chord([523.3,784,1046.5],'square',.22,.035,.22);}}
function announce(txt,kind,key){if(G.demo)return;const m=annMode();if(m==='off')return;stinger(kind||'combo');if(key)playVO(key,kind==='fatal'?.25:.05);}
try{window.speechSynthesis&&speechSynthesis.getVoices();}catch(e){}


// ---------- specials / finishers ----------
function spUnlocked(sp){return levelInfo(PROF.xp).lvl>=sp.lvl;}
function addBolt(x,y){const pts=[];let px=x+rand(-60,60),py=y<cy?-20:H+20;const n=9;for(let i=0;i<=n;i++){const u=i/n;pts.push([lerp(px,x,u)+(i&&i<n?rand(-28,28):0),lerp(py,y,u)]);}bolts.push({pts,t:G.t,life:260});
  if(canPlay()){const tt=AC.currentTime;noise(tt,.5,'highpass',2500,.7,.7,.4);osc(tt,'sawtooth',90,40,.4,.4);}}
function sfxSpecial(id){if(!canPlay())return;const t0=AC.currentTime;
  if(id==='fire'){noise(t0,.6,'lowpass',900,.8,.6,.55);osc(t0,'sawtooth',110,60,.5,.2);}
  else if(id==='ice'){sfxTone([1760,2093,2637,3136],'sine',.18,.12,.04);noise(t0,.3,'highpass',5000,1,.3,.25);}
  else if(id==='tornado'){const f=noise(t0,.9,'bandpass',300,2,.5,.8);f.frequency.exponentialRampToValueAtTime(1800,t0+.6);}
  else if(id==='mega'){osc(t0,'square',70,35,.6,.4);noise(t0,.5,'lowpass',500,.7,.6,.45);}
  else{osc(t0,'sawtooth',220,880,.25,.2);}}
function specialTrail(s,h){if(!s.special||Math.random()<.35)return;const a=P[G.att];const [wx,wy]=toWorld(a.i,laneX(s.k)+h.x+rand(-.25,.25)*L,h.y+rand(.1,.9)*L);
  const sp=s.special,c={fire:['#ffcf40','#ff6a1f','#ff2a00'],ice:['#ffffff','#a8ecff','#5cc8ff'],bolt:['#fff6a0','#ffe95c','#ffffff'],tornado:['#c8ffe0','#7dffb0','#ffffff'],mega:['#ff6b7a','#ff2a4a','#ffd0d0']}[sp];
  for(let i=0;i<3;i++)parts.push({x:wx,y:wy,vx:rand(-1,1),vy:rand(-1,1),life:rand(300,550),t:G.t,col:c[i%3],sz:rand(5,11),rot:0,vr:0,shape:sp==='ice'?'star':'fire',drag:.95,add:true});}
function toFinish(w){if(typeof fvPreload==='function')fvPreload(w===0?0:1);endCombo();G.phase='finish';G.pt=G.t;G.finW=w;const l=1-w;P[w].buf=[];P[w].taps=[];G.charge=null;
  P[l].hands.forEach(h=>{h.dizzyPerm=true;h.x=0;h.y=REST();});
  G.banner={text:t('finish_him'),col:'#ff2a3a',style:'red',t:G.t,f:viewFrame(w),life:1900,n:0};announce(t('finish_him'),'finish','finish');buzz([60,60,60,60,60]);
  if(canPlay()){const t0=AC.currentTime;[0,.35,.7].forEach(d=>{osc(t0+d,'sine',70,40,.35,.8);noise(t0+d,.2,'lowpass',300,.7,.5,.18);});}
  if(P[w].ai)P[w].finPlan={at:G.t+rand(1100,1900),id:FINISHERS[(Math.random()*FINISHERS.length)|0].id};}
function startFatal(id){if(G.train)trainCheck('fin',id);const w=G.finW,l=1-w;G.phase='fatal';G.pt=G.t;G.charge=null;clearMsgs();bursts=[];G.combo=null;
  const [wx,wy]=loserPt(l);
  G.fatal={id,w,stage:0,wx,wy,cam:0};P[w].buf=[];
  G.banner={text:FINISHERS.find(f=>f.id===id).ic+' '+t('fin_'+id),col:'#ff2a3a',style:'red',t:G.t,f:viewFrame(w),life:1000,n:0};
  if(canPlay()){const t0=AC.currentTime;osc(t0,'sine',55,40,1.2,.6);noise(t0,1.2,'lowpass',200,.7,.25,1.1);}
  G.banner=null;syncBanner();cinStart(id);}
function fatalBoom(x,y,col,n=24){for(let i=0;i<n;i++){const an=rand(0,PI*2),sp=rand(2,6);parts.push({x,y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,life:rand(500,900),t:G.t,col,sz:rand(5,10),rot:rand(0,6),vr:rand(-6,6),shape:'star',drag:.93,add:true});}}
function updFatal(rdt){const f=G.fatal,w=f.w,l=1-w,e=G.t-G.pt,dh=P[l].hands[0],a=P[w].hands[0];const ds=P[l].hands;
  const [wx,wy]=loserPt(l);f.wx=wx;f.wy=wy;
  f.cam=Math.min(1,e/500);
  ds.forEach(h=>{h.x=lerp(h.x,0,.2);h.y=lerp(h.y,REST(),.2);});
  if(f.id==='bolt'){
    if(e>200&&e<2600)f.cloud=Math.min(1,(e-200)/400);
    [550,800,1050].forEach((tt,k)=>{if(e>=tt&&f.stage===k){f.stage++;addBolt(wx+rand(-.1,.1)*L,wy);ds.forEach(h=>{h.char=Math.min(.85,h.char+.3);h.flash=1;h.squash=1;h.shakeT=G.t;});G.flash=.8;G.shake=20;G.hitstop=90;buzz(80);fatalBoom(wx,wy,'#fff6a0',14);}});
    if(e>1100&&Math.random()<rdt/45)parts.push({x:wx+rand(-.25,.25)*L,y:wy+rand(-.2,.2)*L,vx:rand(-.2,.2),vy:(l===0?-1:1)*rand(.5,1),life:1300,t:G.t,col:'rgba(70,70,80,.55)',sz:rand(.05,.09)*L,rot:0,vr:0,shape:'dust',drag:.99});}
  else if(f.id==='fire'){
    if(e<380){const u=e/380;f.ball={x:lerp(f.ax||wx,wx,u*u),y:lerp(f.ay||wy,wy,u*u),r:0.18*L*(0.7+u*0.5)};if(!f.ax){const [ax,ay]=toWorld(w,laneX(0)+a.x,a.y+0.4*L);f.ax=ax;f.ay=ay;f.ball.x=ax;f.ball.y=ay;}}
    else if(f.stage===0){f.stage=1;f.ball=null;ds.forEach(h=>{h.flash=1;h.squash=1;h.burnT=G.t+99999;});G.flash=.6;G.shake=18;G.hitstop=80;sfxSpecial('fire');buzz([100,40,150]);fatalBoom(wx,wy,'#ffb020',26);rings.push({x:wx,y:wy,t:G.t,life:500,max:L*1.6,col:'#ffcf40',w:12});}
    if(f.stage===1){ds.forEach(h=>h.char=Math.min(.6,h.char+rdt/2500));f.flames=Math.min(1,(e-380)/300);}}
  else if(f.id==='ice'){
    ds.forEach(h=>h.ice=Math.min(1,e/600));
    if(e>650&&f.stage<2){f.block=Math.min(1,(e-650)/350);if(f.stage===0){f.stage=1;G.flash=.5;G.shake=10;if(canPlay()){const tt=AC.currentTime;noise(tt,.4,'highpass',4000,1,.5,.35);sfxTone([2637,3136,3520],'triangle',.12,.12,.05);}buzz([60,30,200]);fatalBoom(wx,wy,'#dff8ff',20);}}
    if(e>2100&&f.stage===1){f.stage=2;f.block=0;G.shake=26;G.flash=.6;G.hitstop=120;buzz([40,30,260]);
      if(canPlay()){const tt=AC.currentTime;noise(tt,.7,'highpass',2500,.8,.9,.6);sfxTone([3520,2637,1976,1568],'triangle',.1,.12,.03);}
      for(let i=0;i<46;i++){const an=rand(0,PI*2),sp=rand(2.5,8);parts.push({x:wx+rand(-.3,.3)*L,y:wy+rand(-.4,.4)*L,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-1,life:rand(900,1500),t:G.t,col:i%3?'rgba(200,240,255,.9)':'#ffffff',sz:rand(7,18),rot:rand(0,6),vr:rand(-12,12),shape:'shard',drag:.95,grav:.18});}
      rings.push({x:wx,y:wy,t:G.t,life:500,max:L*1.8,col:'#dff8ff',w:10});}
    if(Math.random()<rdt/40){parts.push({x:wx+rand(-.45,.45)*L,y:wy+rand(-.45,.45)*L,vx:0,vy:0,life:600,t:G.t,col:'#ffffff',sz:rand(3,7),rot:0,vr:3,shape:'star',drag:1,add:true});}}
  else if(f.id==='tornado'){
    f.swirl=Math.min(1,e/500);
    if(e>500){const u=Math.min(1,(e-500)/1500);ds.forEach(h=>{h.spin=(h.spin||0)+rdt*0.02*(0.3+u);h.sc=1-u*0.65;h.lift=u;});}
    if(e>500&&f.stage===0){f.stage=1;if(canPlay()){const tt=AC.currentTime;const fl=noise(tt,1.8,'bandpass',300,2,.6,1.7);fl.frequency.exponentialRampToValueAtTime(2200,tt+1.5);}buzz([40,40,40,40,40,40,200]);}}
  else if(f.id==='giant'){
    if(e<700){const u=e/700;f.gh={u,sc:1+1.7*Math.sin(u*PI/2),y:lerp(REST()+0.6*L,REST()+0.2*L,u)};}
    else if(e<820){const u=(e-700)/120;f.gh={u:1,sc:2.7,y:lerp(REST()+0.2*L,-0.25*L,u*u)};}
    else{if(f.stage===0){f.stage=1;ds.forEach(h=>{h.flash=1;h.squash=1;h.shakeT=G.t;h.marks.push({t:G.t,x:0,y:0.42*L,r:rand(-.1,.1),s:1.25,kind:'palm'});});
        rings.push({x:wx,y:wy,t:G.t,life:600,max:L*2.2,col:'#fff',w:14},{x:wx,y:wy,t:G.t+80,life:700,max:L*2.8,col:'#ff4d6d',w:8});
        G.shake=30;G.hitstop=200;G.flash=.7;sfxHit('sd_classic',1.8);buzz([250,80,350]);burst(wx,wy,LANG==='he'?'טראח!':'WHAM!','#ff9f1c');fatalBoom(wx,wy,'#ffd23f',30);}
      const u=Math.min(1,(e-820)/600);f.gh={u:1,sc:lerp(2.7,1,u),y:lerp(-0.25*L,REST()+0.9*L,u*u)};if(u>=1)f.gh=null;}}
  if(e>1700&&!f.txt){f.txt=1;G.fatTitle={t:G.t,w,sub:FINISHERS.find(x=>x.id===f.id).ic+' '+t('fin_'+f.id)};G.shake=24;G.flash=.35;buzz([200,60,260]);announce(t('fatality'),'fatal','fatality');rings.push({x:cx,y:cy+(w===0?-1:1)*H*0.03,t:G.t,life:700,max:W*0.9,col:'#ff2a3a',w:16},{x:cx,y:cy,t:G.t+90,life:800,max:W*1.2,col:'#ffd0d0',w:6});}
  if(e>3300){if(G.practice){G.fatal=null;G.fatTitle=null;resetFinishHand(l);toFinish(w);return;}G.fatalDone=f.id;const keep=f;G.fatal=null;G.fatalFx=keep;gameOver(w,true);}}
function resetFinishHand(l){P[l].hands.forEach(h=>{Object.assign(h,{ice:0,char:0,flat:0,burnT:-1e9,spin:0,sc:1,lift:0,marks:[],flash:0});});}
// ---------- finisher gestures ----------
function finGesture(pl,h,dur,dx,fwd,mv){
  const pts=h.path||[];
  // circle: total turning angle around centroid
  if(pts.length>8&&mv>0){let cxp=0,cyp=0;pts.forEach(p=>{cxp+=p[0];cyp+=p[1];});cxp/=pts.length;cyp/=pts.length;let tot=0,prev=null,len=0;
    pts.forEach((p,i)=>{const an=Math.atan2(p[1]-cyp,p[0]-cxp);if(prev!=null){let da=an-prev;while(da>PI)da-=2*PI;while(da<-PI)da+=2*PI;tot+=da;}prev=an;if(i)len+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]);});
    if(Math.abs(tot)>4.4&&len>0.6*L)return'tornado';}
  if(fwd<-0.15*L&&dur<450&&Math.abs(fwd)>Math.abs(dx))return'ice';
  if(fwd>0.3*L&&dur>=380&&Math.abs(fwd)>Math.abs(dx))return'giant';
  if(mv<20&&dur>=550)return'fire';
  if(mv<20&&dur<300){const now=G.t;pl.taps=(pl.taps||[]).filter(tt=>now-tt<900);pl.taps.push(now);if(pl.taps.length>=3){pl.taps=[];return'bolt';}return'tap';}
  return null;}


// ---------- input ----------
function playerFor(e){if(G.mode!=='2p')return 0;return e.clientY>cy?0:1;}
function dblRect(){return{x:-95,y:H/2-150-SAFE.b,w:190,h:40};}
function chipList(p){const pl=P[p];if(pl.ai||G.demo||G.mode==='react')return[];return SPECIALS;}
function chipRects(p){const L2=chipList(p),n=L2.length;if(!n)return[];const w=Math.min(92,(W-28)/n-6),h=50,gap=6,tw=n*w+(n-1)*gap,y=H/2-108-(p===0?SAFE.b:SAFE.t);
  return L2.map((sp,i)=>({sp,x:-tw/2+i*(w+gap),y,w,h}));}
// combos unlock moves: 2 hits in a row -> next slap is Fire, 3 -> Lightning, 4 -> Tornado, 5+ -> Mega
function attackWith(pl,k,type,dir){startStrike(k,type,false,dir);}
const canDouble=p=>false;
const SWIPE={low:{dist:.2,dur:420},normal:{dist:.12,dur:540},high:{dist:.08,dur:700}};
const gestPhase=()=>G.phase==='armed'||(G.phase==='finish');
const isGestPlayer=p=>(G.phase==='finish'&&p===G.finW)||((G.phase==='armed'||G.phase==='reset')&&p===G.att);
cv.addEventListener('pointerdown',e=>{
  if(G.demo||G.phase==='over'||G.phase==='idle'||G.phase==='fatal')return;e.preventDefault();initAudio();
  const p=playerFor(e),pl=P[p];if(pl.ai)return;
  const [x,y]=toLocal(p,e.clientX,e.clientY);
  if(p===G.att||(G.phase==='finish'&&p===G.finW)){
    const r=dblRect();if(G.phase!=='finish'&&canDouble(p)&&!pl.armSp&&x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h){pl.dbl=!pl.dbl;sfxTone([pl.dbl?880:440],'triangle',.08,.15);return;}
    const k=nH()===1?0:(x<0?0:1),h=pl.hands[k];if(h.ptr!=null)return;
    h.ptr=e.pointerId;Object.assign(h,{fx:x,fy:y,sx:x,sy:y,t0:performance.now(),lfx:x,lfy:y,lft:performance.now(),touch:false,draw:false,path:null,downT:G.t});if(G.phase==='armed'&&G.t-(pl.tapT||-1e9)<430){pl.tapT=0;h.draw=true;h.drawT=G.t;h.path=[[x,y]];buzz(14);sfxTone([330,495],'triangle',.05,.08,.04);}if(G.phase==='finish'){h.draw=true;h.drawT=G.t;h.path=[[x,y]];}
  }else{
    let best=null,bd=1e9;pl.hands.forEach((h,k)=>{if(h.ptr!=null)return;const d=Math.abs(x-(laneX(k)+h.x));if(d<bd){bd=d;best=h;}});
    if(!best)return;const h=best;h.ptr=e.pointerId;Object.assign(h,{fx:x,fy:y,sx:x,sy:y,t0:performance.now(),touch:true,touchT:G.t,offx:h.x-x,offy:h.y-y});
  }
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
},{passive:false});
function findHand(id){for(const p of P)for(const h of p.hands)if(h.ptr===id)return[p,h];return[null,null];}
cv.addEventListener('pointermove',e=>{
  const [pl,h]=findHand(e.pointerId);if(!h)return;
  const [x,y]=toLocal(pl.i,e.clientX,e.clientY),now=performance.now();h.fx=x;h.fy=y;if(h.draw&&h.path){const lp=h.path[h.path.length-1];if(Math.hypot(x-lp[0],y-lp[1])>2.5)h.path.push([x,y]);}
  if(pl.i===G.att&&G.phase==='armed'&&!h.draw){
    const fwd=h.sy-y,dx=x-h.sx,dt=Math.max(1,now-h.lft),vy=(h.lfy-y)/dt,vx=(x-h.lfx)/dt;
    h.feint=clamp((fwd-14)*0.6,0,0.22*L);h.aimx=Math.abs(dx)<14?0:clamp((dx-Math.sign(dx)*14)*0.6,-0.32*L,0.32*L);
    const diagOk=hasUnlock('diag')&&G.mode!=='tut';
    if(diagOk&&Math.abs(dx)>0.3*L&&Math.abs(vx)>0.9&&Math.abs(dx)>fwd*0.8){pl.swipeK=clamp(1.42-0.26*Math.abs(vx),0.7,1.32);h.aimx=clamp(dx*0.3,-0.25*L,0.25*L);startStrike(h.k,'diag',false,Math.sign(dx));}
    else if(fwd>0.5*L||(vy>1.1&&fwd>Math.max(26,0.17*L)&&now-h.t0>35)){pl.swipeK=clamp(1.42-0.26*Math.max(vy,fwd/Math.max(60,now-h.t0)),0.7,1.32);attackWith(pl,h.k,pl.dbl?'double':'normal');}
  }
  h.lfx=x;h.lfy=y;h.lft=now;
});
function seqList(pl){return G.phase==='finish'?FINISHERS:SPECIALS;}
function addDir(pl,dir,k){pl.buf.push(dir);pl.bufT=G.t;pl.bufK=k;pl.bufBad=0;
  const list=seqList(pl),b=pl.buf.join('');
  if(!list.some(x=>x.seq.join('').startsWith(b))){pl.bufBad=G.t;sfxTone([180],'square',.1,.12);setTimeout(()=>{if(pl.bufBad)pl.buf=[];},350);}
  else sfxTone([440+pl.buf.length*120],'square',.05,.1);}
function execTap(pl,k){const b=pl.buf.join('');pl.buf=[];
  if(G.phase==='finish'){const f=FINISHERS.find(x=>x.seq.join('')===b);if(f){buzz(40);startFatal(f.id);}else if(b){pl.bufBad=G.t;sfxTone([180],'square',.1,.12);}return;}
  if(b){const sp=SPECIALS.find(x=>x.seq.join('')===b);
    if(sp){if(G.mode==='tut'&&G.tutStep!==4){}else if(G.mode==='tut'){startStrike(k,'normal',false,1,sp.id);return;}else if(!pl.ai&&!spUnlocked(sp))msg(pl.i,t('locked_lvl',sp.lvl),'#ff8fa3',.9);
      else if(pl.energy<sp.cost)msg(pl.i,t('no_energy'),'#9fe7ff',.9);
      else{pl.energy-=sp.cost;startStrike(k,'normal',false,1,sp.id);return;}}}
  attackWith(pl,k,pl.dbl?'double':'normal');}
function up(e){const [pl,h]=findHand(e.pointerId);if(!h)return;
  if(h.draw){if(isGestPlayer(pl.i))finishDraw(pl,h);else{h.draw=false;h.path=null;}}
  else if(isGestPlayer(pl.i)&&G.phase!=='finish'){const dur=performance.now()-h.t0,mv=Math.hypot(h.fx-h.sx,h.sy-h.fy);
    if(mv<16&&dur<260&&G.phase==='armed'){pl.tapT=G.t;pl.tapXY=[h.fx,h.fy];}h.feint=0;}
  h.ptr=null;h.touch=false;}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
addEventListener('keydown',e=>{if(e.code==='Space'&&!G.demo&&!P[G.att].ai&&G.phase==='armed')startStrike(0,P[G.att].dbl?'double':'normal');});

// ---------- AI ----------
function aiUpdate(p,dt){
  const me=P[p],op=P[1-p],S=SPEEDS[G.speed],tut=G.mode==='tut';
  if(G.att===p){
    if(G.phase!=='armed'||G.train)return;
    if(tut&&G.tutStep!==2)return;
    if(!me.plan)me.plan={at:G.t+(tut?rand(1300,2300):rand(700,2600)),feint:!tut&&Math.random()<.5&&me.feints<3,k:(Math.random()*nH())|0};
    {const h0=me.hands[me.plan.k],tl=tut?380:S.tell;if(!me.plan.feint&&!h0.fa&&tl>0&&G.t>=me.plan.at-tl&&G.t<me.plan.at){const u=(G.t-(me.plan.at-tl))/tl;h0.feint=-Math.sin(u*PI)*0.07*L;}}
    const h=me.hands[me.plan.k];
    if(!h.fa&&G.t>=me.plan.at){
      if(me.plan.feint){me.feints++;h.fa={t0:G.t,amp:rand(.1,.21)*L,dur:rand(260,440)};me.plan={at:G.t+rand(700,2000),feint:Math.random()<.4&&me.feints<3,k:(Math.random()*nH())|0};}
      else{const k=me.plan.k,j=opp(k),dh=op.hands[j];me.plan=null;
        const ns=S.aim/aiAdapt();h.feint=0;h.aimx=clamp(-(laneX(j)+dh.x)-laneX(k)+rand(-ns,ns)*L,-.3*L,.3*L);
        const rx=G.mode==='react';const useDbl=!tut&&!rx&&me.charge>=2&&hasUnlock('double')&&Math.random()<.6;
        const useDiag=!tut&&!rx&&!useDbl&&hasUnlock('diag')&&Math.random()<.22;
        if(useDbl)me.dbl=true;
        const aff=!tut&&!rx?SPECIALS.filter(sp=>me.energy>=sp.cost):[];
        if(aff.length&&Math.random()<S.aiSp*aiAdapt()){const sp=aff[(Math.random()*aff.length)|0];me.energy-=sp.cost;me.dbl=false;startStrike(k,'normal',false,1,sp.id);}
        else startStrike(k,useDiag?'diag':(useDbl?'double':'normal'),false,Math.random()<.5?-1:1);}
    }
    me.hands.forEach(h=>{if(h.fa){const u=(G.t-h.fa.t0)/h.fa.dur;if(u>=1){h.fa=null;h.feint=0;}else h.feint=Math.sin(u*PI)*h.fa.amp;}});
  }else{
    me.hands.forEach(h=>h.touch=true);
    if(G.phase==='armed')op.hands.forEach((oh,k)=>{const h=me.hands[opp(k)];
      if(oh.feint>0.09*L&&!h.feintSeen){h.feintSeen=true;const pf=tut?(G.tutStep===3?1:0):G.train?0:clamp(S.aiFlinch/aiAdapt(),0,.6);if(Math.random()<pf)h.dodge={at:G.t+rand(90,180),x:rand(-.35,.35)*L,y:REST()+rand(.4,.7)*L};}
      if(oh.feint<0.03*L)h.feintSeen=false;});
    const s=G.strike;
    if(G.phase==='slap'&&s&&!s.forced&&me.seenT!==s.t0){me.seenT=s.t0;const h=me.hands[s.j];
      let pd=tut||G.train?0:S.aiDodge*aiAdapt();if(s.stage===2)pd*=0.7;if(me.frozen)pd*=0.25;if(s.type==='tornado')pd*=0.6;
      const good=Math.random()<pd,react=good?rand(.25,.6)*s.tp:rand(1.05,1.7)*s.tp,side=Math.random()<.5?-1:1;
      if(h.dodge&&G.t>=h.dodge.at)h.prevDodge=h.dodge;
      h.dodge={at:s.t0+react,x:(s.type==='diag'||s.type==='tornado'?rand(-.1,.1):side*rand(.15,.5))*L,y:REST()+rand(.55,.9)*L};}
    const lock=G.phase==='flinch'||(G.phase==='slap'&&s&&s.forced);
    me.hands.forEach(h=>{let tx=0,ty=REST();
      if(!lock&&h.dodge){const dd=G.t>=h.dodge.at?h.dodge:h.prevDodge;if(dd){tx=dd.x;ty=dd.y;}}
      const k=1-Math.exp(-dt*0.032);h.x=lerp(h.x,tx,k);h.y=lerp(h.y,ty,k);});
  }
}

// ---------- update ----------
function update(dt,rdt){
  G.t+=dt;
  const a=P[G.att],d=P[def()];
  P.forEach(p=>{if(p.ai)aiUpdate(p.i,dt);});
  if(!d.ai)d.hands.forEach((h,j)=>{const lock=G.phase==='flinch'||G.phase==='finish'||G.phase==='fatal'||(G.phase==='slap'&&G.strike&&G.strike.forced&&G.strike.j===j);
    if(h.ptr!=null&&!lock){const lx=laneX(j);const tx=clamp(h.fx+h.offx,-W/2+0.3*L-lx,W/2-0.3*L-lx),ty=clamp(h.fy+h.offy,-0.05*L,H/2-0.55*L);if(d.frozen){const kf=1-Math.exp(-dt*0.0045);h.x=lerp(h.x,tx,kf);h.y=lerp(h.y,ty,kf);}else{h.x=tx;h.y=ty;}}
    else{const k=1-Math.exp(-dt*(lock?0.03:0.014));h.x=lerp(h.x,0,k);h.y=lerp(h.y,REST(),k);}
    if(G.phase==='slap'&&G.strike&&G.strike.j===j&&G.strike.stage===1&&!G.strike.reacted&&!G.strike.impacted&&Math.hypot(h.x,h.y-REST())>0.12*L)G.strike.reacted=G.t-G.strike.t0;});
  a.hands.forEach((h,k)=>{
    if(G.phase==='slap'&&G.strike&&G.strike.k===k)return;
    const armed=G.phase==='armed',kk=1-Math.exp(-dt*(armed?0.03:0.015));
    h.y=lerp(h.y,REST()-(armed?h.feint:0),kk);h.x=lerp(h.x,armed?h.aimx:0,kk);});
  if(G.phase==='slap'&&G.strike)updStrike();
  if(G.phase==='countdown'){const e=G.t-G.pt,n=Math.floor(e/550);if(n!==G.cdN){G.cdN=n;if(n<3)sfxTone([n===2?660:523],'square',.12,.14);else{sfxTone([784,1047],'square',.14,.16,.07);sfxWhoosh();playVO('fight');}}
    if(e>2200){toReset();msg(G.att,t('m_start'),'#ffd23f',1.1);msg(def(),t('m_ready'),'#fff',1);}}
  if(G.phase==='armed'&&a.hands.some(h=>h.feint>0.1*L)&&d.face.e!=='scared')setFace(d,'scared',500);
  P.forEach(p=>{p.armSp=null;});gestureTick();
  if(false){a.noticeN=a.streak;const sp=SPECIALS.find(x=>x.id===a.armSp);msg(a.i,t('combo_next',sp.ic+' '+t('sp_'+sp.id)),sp.col,1);sfxTone([784,1175],'triangle',.1,.12,.06);}
  if(G.combo&&!G.combo.endT&&G.combo.n>=3&&rdt>0&&Math.random()<rdt/40){const f=viewFrame(G.combo.p),[x,y]=comboPos(f,G.combo.p),[wx,wy]=toWorld(f,x,y);
    const n=G.combo.n,col=n>=5?['#c86bff','#ff4dd2']:n>=4?['#3cdcff','#fff']:['#ff3b1f','#ff9f1c','#ffd23f'];
    parts.push({x:wx+rand(-30,30),y:wy+rand(-10,25),vx:rand(-.3,.3),vy:-rand(1,2.2),life:rand(400,700),t:G.t,col:col[(Math.random()*col.length)|0],sz:rand(5,9),rot:0,vr:0,shape:'fire',drag:.98});}
  if(G.phase==='over'&&G.winPose){const w=G.winPose.w,kk=1-Math.exp(-rdt*0.01);
    P[w].hands.forEach(h=>{h.y=lerp(h.y,REST()-0.12*L+Math.sin(G.t/260)*0.04*L,kk);h.x=lerp(h.x,0,kk);});
    if(!G.winPose.still)P[1-w].hands.forEach(h=>{h.y=lerp(h.y,REST()+0.12*L,kk);h.x=lerp(h.x,0,kk);});
    if(!G.winPose.still&&Math.random()<rdt/220){const lp=1-w;P[lp].hands.forEach((h,k)=>{const [wx,wy]=toWorld(lp,laneX(k)+h.x+rand(-.2,.2)*L,h.y-0.05*L);parts.push({x:wx,y:wy,vx:rand(-.4,.4),vy:(lp===0?-1:1)*rand(.6,1.2),life:700,t:G.t,col:'rgba(220,240,255,.7)',sz:rand(.05,.08)*L,rot:0,vr:0,shape:'dust',drag:.97});});}}
  P.forEach(pl=>{
    pl.hands.forEach(h=>{if(!G.fatal){h.char=Math.max(0,h.char-rdt/2600);if(!pl.frozen&&G.phase!=='over')h.ice=Math.max(0,h.ice-rdt/600);}
      if(G.t-h.burnT<1300&&Math.random()<rdt/25){const [wx,wy]=toWorld(pl.i,laneX(h.k)+h.x+rand(-.25,.25)*L,h.y+rand(.2,.9)*L);parts.push({x:wx,y:wy,vx:rand(-.3,.3),vy:(pl.i===0?-1:1)*rand(.8,1.8),life:rand(350,600),t:G.t,col:['#ffcf40','#ff6a1f','#ff2a00'][(Math.random()*3)|0],sz:rand(5,10),rot:0,vr:0,shape:'fire',drag:.97,add:true});}});});
  if(G.phase==='finish'){const w=P[G.finW];
    if(w.ai&&w.finPlan&&G.t>=w.finPlan.at){const id=w.finPlan.id;w.finPlan=null;if(id){startFatal(id);}else G.pt=G.t-3600;}
    P[1-G.finW].hands.forEach(h=>{h.x=lerp(h.x,0,.2);h.y=lerp(h.y,REST(),.2);});
    if(G.t-G.pt>7000){if(G.practice||G.train){G.pt=G.t;}else{G.phase='over';gameOver(G.finW);}}}
  {const tg=!G.demo&&(G.phase==='finish'||G.phase==='fatal'||(G.phase==='over'&&G.winPose))?1:0;G.cine=(G.cine||0)+(tg-(G.cine||0))*(1-Math.exp(-rdt*0.007));}
  if((G.fatTitle||G.phase==='fatal')&&!G.demo&&Math.random()<rdt/30)parts.push({x:rand(0,W),y:H+10,vx:rand(-.4,.4),vy:-rand(1.2,3),life:rand(1600,2600),t:G.t,col:['#ff3b1f','#ff9f1c','#ffd23f'][(Math.random()*3)|0],sz:rand(2,4.5),rot:0,vr:0,shape:'fire',drag:.995,add:true,sway:true});
  if(G.train)P[0].energy=100;
  if(TEN&&(G.phase!=='armed'||G.demo))tensionStop();
  if(G.cin)updCinema(rdt);else if(G.phase==='fatal'&&G.fatal)updFatal(rdt);
  if(G.phase==='reset'&&G.t-G.pt>450)toArmed();
  else if(G.phase==='armed'){
    for(let j=0;j<d.hands.length;j++){const h=d.hands[j];if(h.touch&&G.t-h.touchT>120&&Math.hypot(h.x,h.y-REST())>FLINCH()){flinch(j);break;}}
    if(G.phase==='armed'&&G.mode!=='tut'&&!G.train){const rem=8000-(G.t-G.armedT);if(rem<2600){if(!TEN)tensionStart(rem);const iv=rem<1000?320:rem<1800?450:600;if(G.t-(G.lastBeat||0)>iv){G.lastBeat=G.t;tensionBeat(rem);}}}
    if(G.phase==='armed'&&G.mode!=='tut'&&G.t-G.armedT>8000)timeout();
  }else if(G.phase==='flinch'&&G.t-G.pt>650){const j=G.flinchHand,h=d.hands[j];h.x=0;h.y=REST();startStrike(opp(j),'normal',true);}
  else if(G.phase==='result'&&G.t-G.pt>1050)endResult();
  P.forEach(p=>p.hands.forEach(h=>{h.flash=Math.max(0,h.flash-rdt/380);h.squash=Math.max(0,h.squash-rdt/260);
    if(h.rv||h.ro){const st=Math.min(dt,40);for(let i=0;i<2;i++){const d2=st/2,acc=-0.0006*(h.ro||0)-0.017*(h.rv||0);h.rv=(h.rv||0)+acc*d2;h.ro=(h.ro||0)+h.rv*d2;}if(Math.abs(h.ro)<.05&&Math.abs(h.rv)<.002){h.ro=0;h.rv=0;}}}));
  G.shake*=Math.pow(0.86,rdt/16);G.flash=Math.max(0,G.flash-rdt/300);
  const now=G.t;
  parts=parts.filter(q=>now-q.t<q.life);
  parts.forEach(q=>{if(now<q.t)return;const f=(G.phase==='over'?rdt:dt)/16;q.x+=q.vx*f;q.y+=q.vy*f;q.vx*=Math.pow(q.drag,f);q.vy*=Math.pow(q.drag,f);if(q.grav)q.vy+=q.grav*f;if(q.sway)q.vx+=Math.sin((now+q.t)/300)*.02;q.rot+=q.vr*rdt/1000;});
  rings=rings.filter(r=>now-r.t<r.life);if(G.banner&&now-G.banner.t>G.banner.life)G.banner=null;if(G.combo&&G.combo.endT&&now-G.combo.endT>500)G.combo=null;
  bursts=bursts.filter(b=>now-b.t<b.life);msgs=msgs.filter(m=>now-m.t<m.life);
}

// ---------- render ----------
function drawHandW(p,k,palmUp,onTop){
  const pl=P[p],h=pl.hands[k],st=G.strike;if(G.fatal&&G.fatal.id==='giant'&&G.fatal.gh&&p===G.fatal.w)return;
  inFrame(p,()=>{
    const isDef=p===def();
    const breath=Math.sin(G.t/700+p*1.7+k)*0.012*L;
    let nerv=0;if(isDef&&G.phase==='armed'&&!G.demo){P[G.att].hands.forEach(o=>nerv=Math.max(nerv,o.feint/(0.22*L)));nerv=Math.max(nerv,clamp((G.t-G.armedT-4000)/4000,0,1)*.7);}
    const jx=nerv?rand(-1,1)*0.012*L*nerv:0,jy=nerv?rand(-1,1)*0.008*L*nerv:0;
    let flipRoll=0,flipLift=0,turn=null;const fu=(G.t-G.flipT)/420;let fs=1,pu=palmUp;if(fu>=0&&fu<1){fs=Math.max(.06,Math.abs(Math.cos(fu*PI)));if(fu<.5)pu=!pu;}
    const striking=G.phase==='slap'&&st&&p===G.att&&st.k===k;
    // the slap turns the hand over: palm-up at rest -> palm-down on the way in, and back again once it returns
    if(st&&p===G.att&&st.k===k&&palmUp){let tu=-1;if(G.phase==='slap')tu=clamp((G.t-st.t0)/(st.tp*0.62),0,1);else if(G.phase==='result'||G.phase==='flinch')tu=1-clamp((G.t-G.pt-140)/260,0,1);
      if(tu>=0){const te=tu<.5?2*tu*tu:1-2*(1-tu)*(1-tu),sw=Math.sin(te*PI);if(te>=.5)pu=!pu;if(te>0.001&&te<0.999)turn=PI*(1-te);flipRoll=-sw*0.12;flipLift=sw;}}
    let lift=0;if(striking){const u=st.impacted?Math.max(0,1-(G.t-st.impT)/200):clamp((G.t-st.t0)/st.tp,0,1);lift=Math.sin(u*PI*0.5)*(st.impacted?u:1)*0.6;}
    // motion trail
    if(striking&&!st.impacted&&st.trail&&turn==null){
      st.trail.forEach((tr,i)=>{ctx.save();ctx.globalAlpha=0.07+0.05*i;ctx.translate(laneX(k)+tr.x,tr.y);drawHandShape(ctx,L,{palmUp:pu,look:pl.look,noSleeve:true,ghost:true,flipS:fs});ctx.restore();});
      const sp=clamp((st.y0-h.y)/L,0,1);ctx.save();ctx.strokeStyle=`rgba(255,255,255,${0.55*sp})`;ctx.lineCap='round';
      for(let i=0;i<6;i++){const xx=laneX(k)+h.x+(-0.25+i*0.1)*L,y1=h.y+0.15*L+(i%2)*0.08*L;ctx.lineWidth=2+(i%3);ctx.beginPath();ctx.moveTo(xx,y1);ctx.lineTo(xx,y1+(0.35+0.25*((i*7)%3)/2)*L*sp);ctx.stroke();}ctx.restore();
    }
    ctx.translate(laneX(k)+h.x+jx,h.y+breath+jy+(h.ro||0));
    const su=(G.t-h.shakeT)/700;const shake=su>0&&su<1?Math.sin(su*28)*0.16*(1-su):0;
    let pose=null;if(G.phase==='over'&&G.winPose&&G.winPose.w===p){pose='victory';pu=false;}
    const lose=G.phase==='over'&&G.winPose&&G.winPose.w!==p;
    let sc=(1+lift*0.2)*(h.sc||1);
    if(striking&&st.special){const sp=SPECIALS.find(x=>x.id===st.special);ctx.save();ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(0,0.55*L,0,0,0.55*L,0.9*L*sc);gg.addColorStop(0,sp.col+'99');gg.addColorStop(1,sp.col+'00');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0.55*L,0.9*L*sc,0,PI*2);ctx.fill();ctx.restore();}
    if(!striking&&p===G.att&&pl.armSp&&(G.phase==='armed'||G.phase==='reset')){const sp=SPECIALS.find(x=>x.id===pl.armSp);const pu2=.75+.25*Math.sin(G.t/110);ctx.save();ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(0,0.55*L,0,0,0.55*L,0.85*L);gg.addColorStop(0,sp.col+'88');gg.addColorStop(1,sp.col+'00');ctx.globalAlpha=pu2;ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0.55*L,0.85*L,0,PI*2);ctx.fill();ctx.restore();
      if(Math.random()<.25){const [wx,wy]=toWorld(p,laneX(k)+h.x+rand(-.3,.3)*L,h.y+rand(.1,.9)*L);parts.push({x:wx,y:wy,vx:rand(-.3,.3),vy:(p===0?-1:1)*rand(.6,1.4),life:450,t:G.t,col:sp.col,sz:rand(4,8),rot:0,vr:0,shape:sp.id==='ice'?'star':'fire',drag:.97,add:true});}}
    if(h.ice>0.3||pl.frozen){ctx.save();ctx.globalCompositeOperation='lighter';const ig=ctx.createRadialGradient(0,0.55*L,0,0,0.55*L,0.7*L);ig.addColorStop(0,'rgba(120,210,255,.25)');ig.addColorStop(1,'rgba(120,210,255,0)');ctx.fillStyle=ig;ctx.beginPath();ctx.arc(0,0.55*L,0.7*L,0,PI*2);ctx.fill();ctx.restore();}
    if(h.lift){ctx.translate(0,h.lift*H*0.6);}
    const stretch=striking&&!st.impacted?Math.sin(clamp((G.t-st.t0)/st.tp,0,1)*PI)*0.9:0;
    drawHandShape(ctx,L,{palmUp:pu,look:pl.look,bruise:MAXHP-pl.hp,red:(MAXHP-pl.hp)/MAXHP*0.22+h.flash*0.45,flash:h.flash,squash:h.squash-stretch,marks:h.marks,shake:shake+(h.spin||0)+(h.ro||0)/L*0.35+flipRoll*0.2,roll:flipRoll,turn,flipS:fs,sleeveLen:H,onTop,t:G.t,scale:sc*(1+0.09*flipLift),lift:Math.max(lift,flipLift*0.55),pose,flatten:h.flat,fx:{ice:Math.max(h.ice,pl.frozen?0.7:0),char:h.char,crack:h.crack}});
    // dizzy stars
    const du=(G.t-h.dizzyT)/1600;
    if(h.dizzyPerm||(du>=0&&du<1)){const al=h.dizzyPerm?1:Math.min(1,(1-du)*3);
      for(let i=0;i<3;i++){const an=G.t/240+i*PI*2/3,x=Math.cos(an)*0.34*L,y=0.5*L+Math.sin(an)*0.1*L,front=Math.sin(an)>0;
        ctx.save();ctx.globalAlpha=al*(front?1:.55);ctx.translate(x,y);ctx.rotate(G.t/200+i);const r=(front?0.075:0.055)*L;
        ctx.fillStyle='#ffd23f';ctx.strokeStyle=OUT;ctx.lineWidth=r*.25;ctx.lineJoin='round';starPath(ctx,r);ctx.fill();ctx.stroke();ctx.restore();}}
  });
}
function hudCapsule(p,x,y,isAtt){const pl=P[p],col=SIDE[p],h=46,hs=17,gap=20,w=h+10+MAXHP*gap+10;
  const path=rrPath(x,y,w,h,h/2);
  ctx.save();ctx.shadowColor='rgba(8,4,30,.35)';ctx.shadowBlur=16;ctx.shadowOffsetY=5;ctx.fillStyle='rgba(18,10,52,.5)';ctx.fill(path);ctx.restore();
  if(isAtt){const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,col.main+'dd');g.addColorStop(1,col.main+'40');ctx.fillStyle=g;ctx.fill(path);}
  const hl=ctx.createLinearGradient(0,y,0,y+h);hl.addColorStop(0,'rgba(255,255,255,.16)');hl.addColorStop(.5,'rgba(255,255,255,0)');ctx.fillStyle=hl;ctx.fill(path);
  ctx.strokeStyle=isAtt?'rgba(255,255,255,.6)':'rgba(255,255,255,.2)';ctx.lineWidth=1.2;ctx.stroke(path);
  drawFace(ctx,x+h/2,y+h/2,16.5,G.t<pl.face.until?pl.face.e:'idle',G.t,(G.t+p*900)%3400<130);
  const flash=Math.max(...pl.hands.map(h=>h.flash)),hx=x+h+6;
  for(let i=0;i<MAXHP;i++){const pulse=(i===pl.hp&&flash>0)?1+flash*.6:1;heartAt(ctx,hx+i*gap+gap/2-2,y+7,hs*pulse,i<pl.hp,col.main);}
  {const ew=MAXHP*gap-6,ey=y+30,eh=7,ef=pl.energy/100;
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.fill(rrPath(hx,ey,ew,eh,eh/2));
  if(ef>0){const eg=ctx.createLinearGradient(hx,0,hx+ew,0);eg.addColorStop(0,'#3bc3ff');eg.addColorStop(1,ef>=1?'#fff36b':'#7dffea');ctx.fillStyle=eg;ctx.fill(rrPath(hx,ey,Math.max(eh,ew*ef),eh,eh/2));}
  SPECIALS.forEach(sp=>{if(!pl.ai&&!spUnlocked(sp))return;ctx.fillStyle='rgba(255,255,255,.65)';ctx.fillRect(hx+ew*sp.cost/100-.75,ey+1.5,1.5,eh-3);});}
  return w;}
function rolePill(txt,xr,y,on,col){ctx.font='700 13.5px -apple-system,system-ui,sans-serif';ctx.direction=LANG==='he'?'rtl':'ltr';const tw=Math.min(ctx.measureText(txt).width+28,W*0.42),path=rrPath(xr-tw,y,tw,30,15);
  ctx.fillStyle=on?col.main:'rgba(18,10,52,.5)';ctx.fill(path);ctx.strokeStyle=on?'rgba(255,255,255,.7)':'rgba(255,255,255,.2)';ctx.lineWidth=1.2;ctx.stroke(path);
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,xr-tw/2,y+15.5,tw-18);}
function drawChips(p){const pl=P[p],rs=chipRects(p);if(!rs.length)return;const b=pl.buf.join('');
  rs.forEach(c=>{const sp=c.sp,seq=sp.seq.concat(['T']),ok=pl.energy>=sp.cost||G.mode==='tut',sb=sp.seq.join(''),prog=b&&sb.startsWith(b)?pl.buf.length:0,ready=pl.armSp===sp.id;
    ctx.save();ctx.translate(c.x+c.w/2,c.y+c.h/2);const pop=ready?1.08+.04*Math.sin(G.t/110):1;ctx.scale(pop,pop);const path=rrPath(-c.w/2,-c.h/2,c.w,c.h,14);
    if(ready){ctx.save();ctx.shadowColor=sp.col;ctx.shadowBlur=20;ctx.fillStyle=sp.col;ctx.fill(path);ctx.restore();}else{ctx.fillStyle=prog?sp.col+'55':'rgba(18,10,52,.55)';ctx.fill(path);}
    if(!ok&&!ready){const f=clamp(pl.energy/sp.cost,0,1);ctx.save();ctx.clip(path);ctx.fillStyle=sp.col+'33';ctx.fillRect(-c.w/2,c.h/2-c.h*f,c.w,c.h*f);ctx.restore();}
    const hl=ctx.createLinearGradient(0,-c.h/2,0,c.h/2);hl.addColorStop(0,'rgba(255,255,255,.2)');hl.addColorStop(.5,'rgba(255,255,255,0)');ctx.fillStyle=hl;ctx.fill(path);
    ctx.strokeStyle=ready?'#fff':ok?sp.col:'rgba(255,255,255,.2)';ctx.lineWidth=ready?2.4:1.3;ctx.stroke(path);
    ctx.globalAlpha=ok?1:.55;ctx.font='17px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sp.ic,-c.w/2+13,-c.h/2+13);
    ctx.font='800 9.5px -apple-system,system-ui,sans-serif';ctx.fillStyle=ready?'#22164f':'#fff';ctx.direction='ltr';ctx.fillText('⚡'+sp.cost,c.w/2-15,-c.h/2+13);
    const n=seq.length,sz=Math.min(15,(c.w-8)/n-2),tw=n*(sz+2)-2;seq.forEach((d,i)=>{const x=-tw/2+i*(sz+2)+sz/2,y=c.h/2-13,done=i<prog,next=prog&&i===prog;
      ctx.fillStyle=done?'#fff':next?'#ffd23f':'rgba(255,255,255,.16)';ctx.fill(rrPath(x-sz/2,y-sz/2,sz,sz,4));
      ctx.fillStyle=done||next?'#22164f':'rgba(255,255,255,.85)';ctx.font=d==='T'?`${sz*.75}px serif`:`900 ${sz*.72}px system-ui`;ctx.fillText(d==='T'?'👆':ARROW[d],x,y+.5);});
    ctx.restore();});}
function drawHUD(p){
  const pl=P[p],isAtt=G.att===p,col=SIDE[p];
  inFrame(p,()=>{const by=H/2-(p===0||G.mode!=='2p'?SAFE.b:SAFE.t),cin=G.cine||0;
    if(cin<.4){ctx.save();ctx.globalAlpha=1-cin*2.5;hudCapsule(p,-W/2+12,by-58,isAtt);
      const nm=G.mode==='2p'?(G.names[p]||col.name()):t('you');rolePill(nm+' · '+(isAtt?t('attacker'):t('defender')),W/2-12,by-50,isAtt,col);ctx.restore();}
    if(!pl.ai&&!pl.remote&&!G.demo&&G.mode!=='tut'&&(G.phase==='armed'||G.phase==='reset')&&!pl.buf.length){
      if(canDouble(p)&&!pl.armSp){const rr=dblRect(),pulse=.5+.5*Math.sin(G.t/160);const path=rrPath(rr.x,rr.y,rr.w,rr.h,20);
        ctx.save();ctx.shadowColor='#ffd23f';ctx.shadowBlur=10+8*pulse;ctx.fillStyle=pl.dbl?'#3ee08f':'#ffd23f';ctx.fill(path);ctx.restore();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.stroke(path);
        ctx.fillStyle='#22164f';ctx.font='800 15px -apple-system,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction=LANG==='he'?'rtl':'ltr';ctx.fillText(pl.dbl?t('dbl_on'):t('dbl_btn'),0,rr.y+rr.h/2+1);}
      else{let hnt='';if(isAtt)hnt=pl.armSp?t('sp_tapnow',SPECIALS.find(x=>x.id===pl.armSp).ic+' '+t('sp_'+pl.armSp)):(pl.energy>=25&&G.mode!=='tut'?t('hint_sp'):t('hint_att3'));else if(!pl.hands.some(h=>h.touch))hnt=nH()>1?t('hint_hold2'):t('hint_hold');else hnt=t('hint_def');
        if(isAtt&&PROF.ach.special&&G.mode!=='tut')hnt='';
        if(hnt){const hs=Math.max(12,Math.min(14,W*0.034));ctx.font=`600 ${hs}px -apple-system,system-ui,sans-serif`;ctx.direction=LANG==='he'?'rtl':'ltr';const hw=Math.min(ctx.measureText(hnt).width+26,W-20);
        const urgent=!isAtt&&!pl.hands.some(h=>h.touch);const yy=by-100;
        ctx.fillStyle=urgent?`rgba(255,210,63,${.8+.2*Math.sin(G.t/150)})`:'rgba(18,10,52,.5)';ctx.fill(rrPath(-hw/2,yy,hw,28,14));
        if(!urgent){ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.stroke(rrPath(-hw/2,yy,hw,28,14));}
        ctx.fillStyle=urgent?'#3a2a00':'#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(hnt,0,yy+14.5,hw-14);}}
    }
    if(!pl.buf.length)msgs.filter(m=>m.p===p).forEach(m=>{const u=(G.t-m.t)/m.life;const pop=u<.15?0.6+u/.15*0.5:u<.25?1.1-(u-.15):1;const al=u>.8?1-(u-.8)/.2:1;
      ctx.save();ctx.globalAlpha=al;ctx.translate(0,by-262-u*14);ctx.scale(pop,pop);outlinedText(ctx,m.text,0,0,Math.min(30,W*0.068)*m.size,m.color);ctx.restore();});
  });
}
function drawInputDisplay(p){const pl=P[p];if(!pl.buf.length)return;const b=pl.buf.join(''),bad=pl.bufBad&&G.t-pl.bufBad<350,y=H/2-215;
  if(bad){ctx.save();ctx.translate(rand(-3,3),0);outlinedText(ctx,'✕',0,y,40,'#ff4d6d');ctx.restore();return;}
  const cand=SPECIALS.filter(x=>x.seq.join('').startsWith(b)&&(pl.ai||spUnlocked(x))).sort((u,v)=>u.seq.length-v.seq.length).slice(0,3);
  cand.forEach((sp,ri)=>{const seq=sp.seq.concat(['T']),sz=26,gap=5,tw=30+seq.length*(sz+gap),yy=y-ri*38,rtl=LANG==='he';
    const path=rrPath(-tw/2-8,yy-sz/2-6,tw+16,sz+12,(sz+12)/2);ctx.fillStyle='rgba(18,10,52,.6)';ctx.fill(path);ctx.strokeStyle=sp.col;ctx.lineWidth=1.5;ctx.stroke(path);
    ctx.font=`${sz*.72}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sp.ic,-tw/2+14,yy+1);
    seq.forEach((d,i)=>{const x=-tw/2+34+i*(sz+gap)+sz/2,done=i<pl.buf.length,next=i===pl.buf.length;const pop=next?1+.12*Math.sin(G.t/90):1;
      ctx.save();ctx.translate(x,yy);ctx.scale(pop,pop);const r=rrPath(-sz/2,-sz/2,sz,sz,9);
      ctx.fillStyle=done?'#ffffff':next?'#ffd23f':'rgba(255,255,255,.14)';ctx.fill(r);
      ctx.fillStyle=done||next?'#2a1d6e':'rgba(255,255,255,.7)';ctx.font=d==='T'?'16px serif':'900 17px system-ui';ctx.fillText(d==='T'?'👆':ARROW[d],0,1);ctx.restore();});});}
function finRects(){const n=FINISHERS.length,gw=Math.min(W-24,430),cw=(gw-10)/2,ch=56,rows=Math.ceil(n/2),y0=H/2-SAFE.b-(G.cine||0)*H*0.085-16-rows*(ch+10),rtl=LANG==='he';
  return FINISHERS.map((f,i)=>{const r=(i/2)|0,c=i%2;let x=-gw/2+(rtl?1-c:c)*(cw+10);if(i===n-1&&n%2)x=-cw/2;return{f,x,y:y0+r*(ch+10),w:cw,h:ch};});}
function drawFinishMenu(){const p=G.finW;if(G.phase!=='finish'||p==null||P[p].ai)return;const pl=P[p],b=pl.buf.join(''),bad=pl.bufBad&&G.t-pl.bufBad<350;
  inFrame(p,()=>{const rs=finRects(),rtl=LANG==='he',e=G.t-G.pt;
    const ty=rs[0].y-26;ctx.save();ctx.globalAlpha=.75+.25*Math.sin(G.t/160);outlinedText(ctx,t('fin_pick'),0,ty,Math.min(21,W*.052),'#fff',OUT,900);ctx.restore();
    rs.forEach((r,i)=>{const {f,x,y,w,h}=r,sb=f.seq.join(''),prog=!bad&&b&&sb.startsWith(b)?pl.buf.length:0,full=prog===f.seq.length,dim=b&&!prog;
      const pop=eoF(clamp((e-i*70)/280,0,1))*(full?1.07+.04*Math.sin(G.t/100):1);ctx.save();ctx.translate(x+w/2,y+h/2);ctx.scale(pop,pop);ctx.globalAlpha=dim?.4:1;
      const path=rrPath(-w/2,-h/2,w,h,18);ctx.save();ctx.shadowColor=full?'#ffd23f':'rgba(255,40,60,.7)';ctx.shadowBlur=full?22:12;ctx.fillStyle=full?'rgba(150,20,30,.92)':'rgba(70,0,12,.82)';ctx.fill(path);ctx.restore();
      ctx.strokeStyle=full?'#ffd23f':'rgba(255,110,120,.85)';ctx.lineWidth=1.6;ctx.stroke(path);
      ctx.font=`${h*.42}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(f.ic,rtl?w/2-20:-w/2+20,-8);
      ctx.direction=rtl?'rtl':'ltr';ctx.fillStyle='#fff';ctx.font='900 13.5px -apple-system,system-ui,sans-serif';ctx.fillText(t('fin_'+f.id),rtl?-6:6,-12,w-56);
      const seq=f.seq.concat(['T']),n=seq.length,sz=Math.min(18,(w-16)/n-3),tw=n*(sz+3)-3;ctx.direction='ltr';
      seq.forEach((d,j)=>{const xx=-tw/2+j*(sz+3)+sz/2,yy=h/2-15,done=j<prog,next=prog===j&&(prog>0||!b);ctx.fillStyle=done?'#fff':next&&prog?'#ffd23f':'rgba(255,255,255,.18)';ctx.fill(rrPath(xx-sz/2,yy-sz/2,sz,sz,5));
        ctx.fillStyle=done||(next&&prog)?'#3a0008':'#fff';ctx.font=d==='T'?`${sz*.72}px serif`:`900 ${sz*.7}px system-ui`;ctx.fillText(d==='T'?'👆':ARROW[d],xx,yy+.5);});ctx.restore();});});}
const eoF=u=>1-Math.pow(1-u,3);
function drawCine(){const c=G.cine||0;if(c<.01)return;const bh=H*0.085*c;ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,W,bh);ctx.fillRect(0,H-bh,W,bh);
  if(G.phase==='finish'){const left=Math.max(0,1-(G.t-G.pt)/7000),bw=W*.5;ctx.fillStyle='#2a0006';ctx.fill(rrPath(cx-bw/2,bh/2-3,bw,6,3));ctx.fillStyle=left<.3?'#ff2a3a':'#ff7a3a';ctx.fill(rrPath(cx-bw/2,bh/2-3,Math.max(6,bw*left),6,3));}
  ctx.restore();}
function bloodText(txt,y,size,e){ctx.save();ctx.font=`900 ${size}px -apple-system,system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction=LANG==='he'?'rtl':'ltr';ctx.lineJoin='round';
  const tw=ctx.measureText(txt).width,r=seeded(77);
  // drips
  for(let i=0;i<9;i++){const dx=(r()-.5)*tw*.9,len=Math.min(1,Math.max(0,(e-250)/1400))*size*(.35+r()*.9),dw=size*(.05+r()*.05);if(len<1)continue;
    ctx.fillStyle='#7a000c';ctx.fill(rrPath(dx-dw/2,y+size*.28,dw,len,dw/2));ctx.beginPath();ctx.arc(dx,y+size*.28+len,dw*.75,0,PI*2);ctx.fill();}
  ctx.lineWidth=size*.2;ctx.strokeStyle='#120002';ctx.strokeText(txt,0,y+size*.05);ctx.strokeText(txt,0,y);
  const g=ctx.createLinearGradient(0,y-size*.5,0,y+size*.5);g.addColorStop(0,'#ff8a8a');g.addColorStop(.45,'#e0101e');g.addColorStop(1,'#5a0008');ctx.fillStyle=g;ctx.fillText(txt,0,y);
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.25;ctx.fillStyle='#fff';ctx.fillText(txt,0,y-size*.04);ctx.restore();}
function drawTitles(){const ft=G.fatTitle,wt=G.winTitle;if(!ft)return;if(!ft.shown){ft.shown=1;showFatCard(ft);}return;
  const fr=viewFrame(ft.w);
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);
  inFrame(fr,()=>{
    if(ft){const e=G.t-ft.t,u=Math.min(1,e/240),s=lerp(2.8,1,1-Math.pow(1-u,3)),sz=Math.min(W*0.17,86),yy=wt?-H*0.2:-H*0.03;
      {const bu=Math.min(1,e/380),bh=sz*1.25;ctx.save();ctx.translate(0,yy);ctx.globalCompositeOperation='lighter';
        for(let i=0;i<14;i++){const an=i/14*PI*2+e/2600,len=W*(.5+.25*Math.sin(i*3.1+e/300));ctx.globalAlpha=.07*bu;ctx.fillStyle='#ff3040';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(an-.07)*len,Math.sin(an-.07)*len);ctx.lineTo(Math.cos(an+.07)*len,Math.sin(an+.07)*len);ctx.closePath();ctx.fill();}
        ctx.globalCompositeOperation='source-over';const bw=W*bu;const bg=ctx.createLinearGradient(-bw/2,0,bw/2,0);bg.addColorStop(0,'rgba(40,0,6,0)');bg.addColorStop(.2,'rgba(40,0,6,.85)');bg.addColorStop(.8,'rgba(40,0,6,.85)');bg.addColorStop(1,'rgba(40,0,6,0)');
        ctx.fillStyle=bg;ctx.fillRect(-bw/2,-bh/2,bw,bh);ctx.fillStyle='rgba(255,40,60,.8)';ctx.fillRect(-bw/2*.85,-bh/2,bw*.85,2);ctx.fillRect(-bw/2*.85,bh/2-2,bw*.85,2);ctx.restore();}
      ctx.save();ctx.translate(0,yy);ctx.scale(s,s);ctx.globalAlpha=u;bloodText(t('fatality'),0,sz,e);ctx.restore();
      if(e>350){const u2=Math.min(1,(e-350)/250);ctx.save();ctx.globalAlpha=u2;metalText(ctx,ft.sub,0,yy+sz*.95,Math.min(W*0.07,32),'steel');if(LANG==='he'){ctx.globalAlpha=u2*.85;metalText(ctx,'FATALITY',0,yy-sz*.78,Math.min(W*0.05,20),'red','ltr');}ctx.restore();}}
    if(false&&wt){const e=G.t-wt.t,u=Math.min(1,e/300),s=lerp(2.2,1,1-Math.pow(1-u,3)),sz=Math.min(W*0.13,62),yy=ft?H*0.06:-H*0.04;
      ctx.save();ctx.translate(0,yy);ctx.scale(s,s);ctx.globalAlpha=u;
      ctx.save();ctx.globalCompositeOperation='lighter';const gl=ctx.createRadialGradient(0,0,0,0,0,sz*2.4);gl.addColorStop(0,'rgba(255,210,63,.35)');gl.addColorStop(1,'rgba(255,210,63,0)');ctx.fillStyle=gl;ctx.fillRect(-sz*2.6,-sz*2.6,sz*5.2,sz*5.2);ctx.restore();
      metalText(ctx,wt.txt,0,0,sz,'gold');ctx.restore();
      if(wt.flawless&&e>450){const u2=Math.min(1,(e-450)/300),s2=lerp(1.6,1,u2);ctx.save();ctx.translate(0,yy+sz*1.05);ctx.scale(s2,s2);ctx.globalAlpha=u2;metalText(ctx,t('flawless'),0,0,Math.min(W*0.075,34),'red');ctx.restore();}}
  });ctx.restore();}
function loserPt(l){let sx=0,sy=0;const hs=P[l].hands;hs.forEach((h,k)=>{const [x,y]=toWorld(l,laneX(k)+h.x,h.y+0.5*L);sx+=x;sy+=y;});return[sx/hs.length,sy/hs.length];}
const colStyle=c=>({'#ffd23f':'gold','#9fe7ff':'ice','#3ee08f':'green','#7dffb0':'green','#ff8fa3':'red','#fff':'steel'})[c]||'steel';
const SIDE=[{main:'#3b7bff',light:'#9cc0ff',dark:'#1d3f9e',name:()=>t('blue')},{main:'#ff4d6d',light:'#ffa3b5',dark:'#9a1a37',name:()=>t('red')}];
function drawAIBadge(){const pl=P[1],cin=G.cine||0;if(cin>=.4)return;ctx.save();ctx.globalAlpha=1-cin*2.5;
  hudCapsule(1,12,16+SAFE.t,G.att===1);
  if(G.mode!=='tut'){const lbl=G.rival?G.rival.name+(G.att===1?' ⚡':' 🛡️'):G.att===1?t('cpu_att'):t('cpu_def');rolePill(lbl,W-12,24+SAFE.t,G.att===1,SIDE[1]);}
  ctx.restore();}
function drawBG(){
  drawArena(ctx,G.demo?PROF.equip.arena:PROF.equip.arena,W,H,G.t);
  if(!G.demo){const a=G.att;[0,1].forEach(p=>{const top=p===1;const gg=ctx.createLinearGradient(0,top?0:H,0,cy);gg.addColorStop(0,SIDE[p].main+(p===a?'44':'1a'));gg.addColorStop(1,SIDE[p].main+'00');ctx.fillStyle=gg;ctx.fillRect(0,top?0:cy,W,H/2);});}
  {const lg=ctx.createLinearGradient(0,0,W,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(.18,'rgba(255,255,255,.42)');lg.addColorStop(.82,'rgba(255,255,255,.42)');lg.addColorStop(1,'rgba(255,255,255,0)');ctx.save();ctx.shadowColor='rgba(190,170,255,.9)';ctx.shadowBlur=10;ctx.fillStyle=lg;ctx.fillRect(0,cy-.75,W,1.5);ctx.restore();}
  if(G.phase==='armed'&&!G.demo&&G.mode!=='tut'){const f=1-(G.t-G.armedT)/8000,w=W*0.62*Math.max(0,f);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fill(rrPath(cx-W*0.31,cy-4,W*0.62,8,4));ctx.fillStyle=f<.3?'#ffd23f':SIDE[G.att].main;ctx.fill(rrPath(cx-w/2,cy-4,w,8,4));}
  if(G.phase==='armed'&&!G.demo&&!P[def()].ai){const d=P[def()];
    inFrame(d.i,()=>d.hands.forEach((h,k)=>{const dist=Math.hypot(h.x,h.y-REST()),warn=clamp(dist/FLINCH(),0,1);
      ctx.save();ctx.setLineDash([6,8]);ctx.lineWidth=3;ctx.strokeStyle=`rgba(255,${Math.round(255-200*warn)},${Math.round(255-180*warn)},${.25+.5*warn})`;
      ctx.beginPath();ctx.arc(laneX(k),REST()+0.62*L,FLINCH()+0.42*L,0,PI*2);ctx.stroke();ctx.restore();}));}
}
function drawFX(){
  const now=G.t;
  bolts=bolts.filter(b=>now-b.t<b.life);bolts.forEach(b=>{const u=(now-b.t)/b.life;ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';
    [[14,'rgba(120,160,255,.25)'],[6,'rgba(200,220,255,.7)'],[2.5,'#ffffff']].forEach(([w,c])=>{ctx.strokeStyle=c;ctx.lineWidth=w*(1-u*.5);ctx.globalAlpha=1-u;ctx.beginPath();b.pts.forEach((pt,i)=>i?ctx.lineTo(pt[0],pt[1]):ctx.moveTo(pt[0],pt[1]));ctx.stroke();});ctx.restore();});
  parts.forEach(q=>{if(now<q.t)return;const u=(now-q.t)/q.life;ctx.save();if(q.add)ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(q.shape==='conf'||q.shape==='emoji'||q.grav)?Math.min(1,(1-u)*3):1-u;ctx.translate(q.x,q.y);ctx.rotate(q.rot);ctx.fillStyle=q.col;
    if(q.shape==='star'){starPath(ctx,q.sz);ctx.fill();}
    else if(q.shape==='heart'){ctx.scale(q.sz/12,q.sz/12);ctx.translate(0,-8);ctx.fill(HEART);}
    else if(q.shape==='fire'){ctx.beginPath();ctx.arc(0,0,q.sz*(1-u*.6),0,PI*2);ctx.fill();}
    else if(q.shape==='coin'){ctx.scale(Math.abs(Math.cos(q.rot*2))+.15,1);ctx.beginPath();ctx.arc(0,0,q.sz/2,0,PI*2);ctx.fill();ctx.strokeStyle='#a07818';ctx.lineWidth=q.sz*.12;ctx.stroke();}
    else if(q.shape==='emoji'){ctx.font=`${q.sz}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(q.em,0,0);}
    else if(q.shape==='dot'){ctx.beginPath();ctx.arc(0,0,q.sz,0,PI*2);ctx.fill();}
    else if(q.shape==='dust'){ctx.globalAlpha=(1-u)*.8;ctx.beginPath();ctx.arc(0,0,q.sz*(1+u*1.6),0,PI*2);ctx.fill();}
    else if(q.shape==='shard'){ctx.beginPath();ctx.moveTo(0,-q.sz);ctx.lineTo(q.sz*.6,q.sz*.5);ctx.lineTo(-q.sz*.5,q.sz*.3);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(34,22,79,.6)';ctx.lineWidth=1.5;ctx.stroke();}
    else ctx.fillRect(-q.sz/2,-q.sz/4,q.sz,q.sz/2);ctx.restore();});
  rings.forEach(r=>{if(now<r.t)return;const u=(now-r.t)/r.life,e=1-Math.pow(1-u,3);ctx.save();ctx.globalAlpha=(1-u);ctx.strokeStyle=r.col;ctx.lineWidth=r.w*(1-u)+1;
    ctx.beginPath();ctx.ellipse(r.x,r.y,r.max*e,r.max*e*0.62,0,0,PI*2);ctx.stroke();ctx.restore();});
  bursts.forEach(b=>{const u0=(now-b.t)/b.life;if(u0<.45){ctx.save();ctx.globalAlpha=1-u0/.45;ctx.strokeStyle='#fff';ctx.lineCap='round';
    for(let i=0;i<14;i++){const an=i*PI/7+b.rot,r1=L*(0.3+u0*0.9),r2=r1+L*(0.25+(i%3)*0.1)*(1-u0);ctx.lineWidth=i%2?1.5:2.5;ctx.globalAlpha=(1-u0/.45)*.55;ctx.beginPath();ctx.moveTo(b.x+Math.cos(an)*r1,b.y+Math.sin(an)*r1);ctx.lineTo(b.x+Math.cos(an)*r2,b.y+Math.sin(an)*r2);ctx.stroke();}ctx.restore();}});
  bursts.forEach(b=>{const u=(now-b.t)/b.life,s=u<.18?lerp(.7,1.08,u/.18):lerp(1.08,1,Math.min(1,(u-.18)/.2)),al=u>.7?1-(u-.7)/.3:1,rgb=hexRgb(b.col);
    ctx.save();ctx.globalAlpha=al;ctx.translate(b.x,b.y-u*14);ctx.rotate(b.rot*.4);ctx.scale(s,s);const fs=Math.min(22,W*.056);ctx.font=`800 ${fs}px -apple-system,system-ui,sans-serif`;
    const tw=ctx.measureText(b.text).width+(b.tag?fs*1.6:0)+28,th=fs*1.75;glassShape(gPath('r',-tw/2,-th/2,tw,th,th/2),rgb,.3,.45);
    glassText(b.text,b.tag?-fs*.75:0,1,fs,rgb);
    if(b.tag){const cw=fs*1.35,ch=fs*1.1,cx2=tw/2-cw/2-6;ctx.fillStyle=`rgba(${rgb},.75)`;ctx.fill(rrPath(cx2-cw/2,-ch/2,cw,ch,ch/2));ctx.fillStyle='#fff';ctx.font=`900 ${fs*.6}px -apple-system,system-ui,sans-serif`;ctx.direction='ltr';ctx.fillText(b.tag,cx2,1);}
    ctx.restore();});
}
function glassShape(path,rgb,a,glow){ctx.save();ctx.shadowColor=`rgba(${rgb},${glow||.35})`;ctx.shadowBlur=18;ctx.fillStyle=`rgba(${rgb},${a})`;ctx.fill(path);ctx.restore();
  const b=path._b;if(b){const hl=ctx.createLinearGradient(0,b[1],0,b[1]+b[3]);hl.addColorStop(0,'rgba(255,255,255,.42)');hl.addColorStop(.5,'rgba(255,255,255,.06)');hl.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=hl;ctx.fill(path);}
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.2;ctx.stroke(path);}
function gPath(kind,x,y,w,h,r){const p=kind==='c'?(()=>{const q=new Path2D();q.arc(x,y,r,0,PI*2);return q;})():rrPath(x,y,w,h,r);p._b=kind==='c'?[x-r,y-r,2*r,2*r]:[x,y,w,h];return p;}
function glassText(txt,x,y,size,rgb,dir){ctx.save();ctx.font=`800 ${size}px -apple-system,system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction=dir||(LANG==='he'?'rtl':'ltr');ctx.shadowColor=`rgba(${rgb},.9)`;ctx.shadowBlur=10;ctx.fillStyle='#fff';ctx.fillText(txt,x,y);ctx.restore();}
function drawCombo(){const c=G.combo;if(!c)return;const f=viewFrame(c.p),[x,y]=comboPos(f,c.p),n=Math.min(5,c.n),col=comboCol(c.n);
  const fade=c.endT?Math.max(0,1-(G.t-c.endT)/(c.broken?200:500)):1;if(fade<=0)return;
  inFrame(f,()=>{ctx.save();ctx.translate(x,y);
    if(n>=5)ctx.translate(rand(-2,2),rand(-2,2));
    const pop=1+0.5*Math.exp(-(G.t-c.t)/110),R=Math.min(36,W*0.09),rgb=hexRgb(col);ctx.scale(pop,pop);ctx.globalAlpha=fade;
    glassShape(gPath('c',0,0,0,0,R),rgb,.32,.6);glassText('x'+c.n,0,-R*.12,R*.78,rgb,'ltr');
    const ic=['','','✋','🔥','⚡','💀'][n];ctx.font=`${R*.42}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ic,0,R*.55);
    ctx.restore();});
  if(n>=3&&!c.endT){ctx.save();const rgb=hexRgb(comboCol(n)),a=(.1+.05*(n-3))+.08*Math.sin(G.t/120);const v=ctx.createRadialGradient(cx,cy,Math.min(W,H)*.35,cx,cy,Math.max(W,H)*.7);v.addColorStop(0,`rgba(${rgb},0)`);v.addColorStop(1,`rgba(${rgb},${a})`);ctx.fillStyle=v;ctx.fillRect(0,0,W,H);ctx.restore();}
}
function drawBanner(){syncBanner();}
function drawCountdown(){if(G.phase!=='countdown')return;const e=G.t-G.pt,n=Math.floor(e/550),u=(e%550)/550;
  const txt=n<3?String(3-n):t('cd_go'),col=n<3?['#ff4d6d','#ffd23f','#3ee08f'][n]:'#fff';
  const frames=G.mode==='2p'?[0,1]:[0];
  frames.forEach(f=>inFrame(f,()=>{ctx.save();ctx.translate(0,G.mode==='2p'?H*0.2:0);const s=n<3?1.6-0.6*Math.min(1,u*3):1+0.3*Math.sin(Math.min(1,u*2)*PI);ctx.scale(s,s);ctx.globalAlpha=n<3?1-Math.max(0,u-.7)/.3:1;
    const rgb=hexRgb(col==='#fff'?'#8a7cff':col);if(n<3){glassShape(gPath('c',0,0,0,0,52),rgb,.3,.6);glassText(txt,0,3,64,rgb,'ltr');}else{ctx.font='800 44px -apple-system,system-ui,sans-serif';const tw=ctx.measureText(txt).width+48;glassShape(gPath('r',-tw/2,-38,tw,76,38),rgb,.3,.6);glassText(txt,0,2,44,rgb);}ctx.restore();}));
}
let lightCache=null;

function drawChargeFx(){const c=G.charge;if(!c||G.phase!=='finish')return;const e=G.t-c.t0;if(e<150)return;const u=Math.min(1,(e-150)/400);const pl=P[c.p],h=pl.hands[0];
  const [x,y]=toWorld(c.p,laneX(0)+h.x,h.y+0.45*L);ctx.save();ctx.globalCompositeOperation='lighter';const R=L*(0.4+0.4*u)*(1+0.05*Math.sin(G.t/40));const g=ctx.createRadialGradient(x,y,0,x,y,R);
  g.addColorStop(0,`rgba(255,220,120,${.5*u})`);g.addColorStop(.5,`rgba(255,110,20,${.35*u})`);g.addColorStop(1,'rgba(255,60,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,PI*2);ctx.fill();ctx.restore();
  if(Math.random()<.5)parts.push({x:x+rand(-.3,.3)*L,y:y+rand(-.2,.3)*L,vx:rand(-.3,.3),vy:-rand(1,2),life:400,t:G.t,col:['#ffcf40','#ff6a1f'][(Math.random()*2)|0],sz:rand(5,9),rot:0,vr:0,shape:'fire',drag:.97,add:true});}
function drawFatalFx(){const f=G.fatal;if(!f)return;const x=f.wx,y=f.wy;
  if(f.cloud){ctx.save();ctx.globalAlpha=f.cloud;const cy2=y+(f.w===0?-1:1)*-0.0*L;for(let i=0;i<6;i++){const cx2=x+(i-2.5)*0.22*L+Math.sin(G.t/400+i)*6;const cyy=y-0.55*L*(f.w===1?-1:1)+Math.cos(G.t/500+i)*4;
      const g=ctx.createRadialGradient(cx2,cyy,0,cx2,cyy,0.3*L);g.addColorStop(0,'rgba(70,70,95,.95)');g.addColorStop(1,'rgba(40,40,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx2,cyy,0.3*L,0,PI*2);ctx.fill();}ctx.restore();}
  if(f.ball){const b=f.ball;ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*1.6);g.addColorStop(0,'rgba(255,255,220,1)');g.addColorStop(.35,'rgba(255,170,40,.9)');g.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.6,0,PI*2);ctx.fill();ctx.restore();}
  if(f.flames){const fl=f.flames;ctx.save();ctx.globalCompositeOperation='lighter';
    const gl=ctx.createRadialGradient(x,y,0,x,y,0.75*L);gl.addColorStop(0,`rgba(255,140,30,${.35*fl})`);gl.addColorStop(1,'rgba(255,60,0,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x,y,0.75*L,0,PI*2);ctx.fill();
    const r=seeded(5);for(let i=0;i<14;i++){const fx=x+(r()-.5)*0.62*L,fy=y+(r()-.5)*0.8*L,ph=r()*6,hgt=(0.18+0.14*Math.sin(G.t/80+ph)+r()*0.1)*L*fl,w2=(0.05+r()*0.04)*L;
      const g=ctx.createLinearGradient(0,fy+w2,0,fy-hgt);g.addColorStop(0,'rgba(255,60,0,0)');g.addColorStop(.25,'rgba(255,90,10,.55)');g.addColorStop(.6,'rgba(255,190,40,.6)');g.addColorStop(1,'rgba(255,250,200,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(fx-w2,fy+w2*.5);ctx.quadraticCurveTo(fx-w2*1.2,fy-hgt*.45,fx+Math.sin(G.t/60+ph)*w2*.6,fy-hgt);ctx.quadraticCurveTo(fx+w2*1.2,fy-hgt*.45,fx+w2,fy+w2*.5);ctx.quadraticCurveTo(fx,fy+w2*1.2,fx-w2,fy+w2*.5);ctx.fill();}
    ctx.restore();
    if(Math.random()<.6)parts.push({x:x+rand(-.3,.3)*L,y:y+rand(-.35,.35)*L,vx:rand(-.3,.3),vy:-rand(1,2.2),life:500,t:G.t,col:['#ffcf40','#ff8a1f'][(Math.random()*2)|0],sz:rand(3,6),rot:0,vr:0,shape:'fire',drag:.97,add:true});}
  if(f.block){const u=f.block,bw=0.95*L,bh=1.2*L;ctx.save();ctx.translate(x,y);ctx.scale(0.8+0.2*u,0.8+0.2*u);ctx.globalAlpha=u;
    const p=rrPath(-bw/2,-bh/2,bw,bh,0.12*L);const g=ctx.createLinearGradient(-bw/2,-bh/2,bw/2,bh/2);g.addColorStop(0,'rgba(220,250,255,.55)');g.addColorStop(.5,'rgba(140,215,255,.35)');g.addColorStop(1,'rgba(90,170,240,.5)');
    ctx.fillStyle=g;ctx.fill(p);ctx.lineWidth=4;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.stroke(p);ctx.lineWidth=2;ctx.strokeStyle='rgba(60,140,220,.7)';ctx.stroke(rrPath(-bw/2+6,-bh/2+6,bw-12,bh-12,0.1*L));
    ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.moveTo(-bw*0.38,-bh*0.42);ctx.lineTo(-bw*0.18,-bh*0.42);ctx.lineTo(-bw*0.38,-bh*0.05);ctx.closePath();ctx.fill();
    const sh=(G.t/900)%1;const sg=ctx.createLinearGradient(-bw/2+sh*bw*2-bw,0,-bw/2+sh*bw*2-bw+60,0);sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,.45)');sg.addColorStop(1,'rgba(255,255,255,0)');ctx.save();ctx.clip(p);ctx.fillStyle=sg;ctx.fillRect(-bw,-bh,bw*2,bh*2);ctx.restore();ctx.restore();}
  if(f.swirl){ctx.save();ctx.translate(x,y);ctx.globalAlpha=.85*f.swirl;ctx.lineCap='round';for(let i=0;i<7;i++){const r=(0.2+i*0.09)*L,a0=G.t/(120-i*8)+i;ctx.strokeStyle=i%2?'rgba(255,255,255,.8)':'rgba(190,230,255,.7)';ctx.lineWidth=5-i*0.4;ctx.beginPath();ctx.ellipse(0,0,r,r*0.45,0,a0,a0+PI*1.1);ctx.stroke();}ctx.restore();
    if(Math.random()<.6)parts.push({x:x+rand(-.6,.6)*L,y:y+rand(-.3,.3)*L,vx:rand(-3,3),vy:rand(-1,1),life:500,t:G.t,col:'rgba(220,235,255,.7)',sz:rand(.03,.05)*L,rot:0,vr:0,shape:'dust',drag:.96});}
  if(f.gh){const w=f.w,gh=f.gh;inFrame(w,()=>{ctx.translate(0,gh.y);drawHandShape(ctx,L,{palmUp:true,look:P[w].look,scale:gh.sc,sleeveLen:H,onTop:true,t:G.t,lift:Math.min(1,(gh.sc-1)/2)});});}
}
function drawLighting(){const key=W+'x'+H;if(!lightCache||lightCache.key!==key){const lc=document.createElement('canvas');lc.width=Math.round(W);lc.height=Math.round(H);const c2=lc.getContext('2d');
  const v=c2.createRadialGradient(cx,cy,Math.min(W,H)*.35,cx,cy,Math.hypot(W,H)*.62);v.addColorStop(0,'rgba(10,0,30,0)');v.addColorStop(1,'rgba(10,0,30,.36)');c2.fillStyle=v;c2.fillRect(0,0,W,H);const l2=c2.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.55);l2.addColorStop(0,'rgba(255,240,220,.12)');l2.addColorStop(1,'rgba(255,240,220,0)');c2.fillStyle=l2;c2.fillRect(0,0,W,H);lightCache={key,lc};}
  ctx.drawImage(lightCache.lc,0,0,W,H);}
function _unusedLightingOld(){ctx.save();
  const v=ctx.createRadialGradient(cx,cy,Math.min(W,H)*.35,cx,cy,Math.hypot(W,H)*.62);v.addColorStop(0,'rgba(5,0,5,0)');v.addColorStop(1,'rgba(5,0,5,.6)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='soft-light';const l=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.6);l.addColorStop(0,'rgba(255,210,160,.45)');l.addColorStop(1,'rgba(255,240,210,0)');ctx.fillStyle=l;ctx.fillRect(0,0,W,H);
  ctx.restore();}
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(G.cin){syncBanner();drawCinema();drawCine();drawTitles();return;}
  if(G.fatal&&G.fatal.cam){const a=0.18*G.fatal.cam;ctx.translate(G.fatal.wx,G.fatal.wy);ctx.scale(1+a,1+a);ctx.translate(-G.fatal.wx,-G.fatal.wy);}
  if(G.zoom){const u=(performance.now()-G.zoom.t0)/1500;if(u>=1)G.zoom=null;else{const a=G.zoom.a*Math.sin(Math.min(1,u*1.3)*PI);ctx.translate(G.zoom.x,G.zoom.y);ctx.scale(1+a,1+a);ctx.translate(-G.zoom.x,-G.zoom.y);}}
  const sh=G.shake>.3?G.shake:0;ctx.translate(rand(-sh,sh),rand(-sh,sh));
  drawBG();
  const a=G.att,d=1-a,s=G.strike;
  const attTop=(G.phase==='slap'&&s&&(s.impacted||(G.t-s.t0)/s.tp>.45))||(G.phase==='result'&&G.t-G.pt<200);
  const drawP=(p,palmUp,top)=>P[p].hands.forEach((h,k)=>drawHandW(p,k,palmUp,top));
  // like the real game: the attacker waits palm-up underneath and turns the hand over as it slaps; the defender's hand is seen from above
  if(G.phase==='over'&&G.winPose){const w=G.winPose.w;drawP(1-w,w!==a,false);drawP(w,false,true);}
  else if(G.phase==='finish'||G.phase==='fatal'){drawP(a,true,false);drawP(d,false,true);}
  else if(attTop){drawP(d,false,false);drawP(a,true,true);}else{drawP(a,true,false);drawP(d,false,true);}
  drawLighting();
  if(G.phase==='armed'&&!G.demo&&G.mode!=='tut'&&!G.train){const rem=8000-(G.t-G.armedT);if(rem<2600){const k=1-rem/2600,beat=Math.exp(-(G.t-(G.lastBeat||0))/160);const v=ctx.createRadialGradient(cx,cy,Math.min(W,H)*.3,cx,cy,Math.max(W,H)*.72);v.addColorStop(0,'rgba(120,0,10,0)');v.addColorStop(1,`rgba(170,0,20,${(.18+.3*beat)*k})`);ctx.fillStyle=v;ctx.fillRect(0,0,W,H);}}
  if(G.mode==='react'&&!G.demo){const g=G.gs[0];outlinedText(ctx,t('rt_hud',Math.min(5,(G.rtRound||0)+1),g.bestReact!=null?Math.round(g.bestReact)+'ms':'—')+(G.challenge?' · 🎯 '+G.challenge+'ms':''),cx,74,15,'#fff',OUT,800);}
  if(G.phase==='finish'||G.phase==='fatal'){const l=1-(G.finW==null?0:G.finW);const [wx,wy]=loserPt(l);const a=G.phase==='fatal'?.78:.5;
    const sg=ctx.createRadialGradient(wx,wy,L*0.5,wx,wy,Math.max(W,H)*0.7);sg.addColorStop(0,'rgba(0,0,0,0)');sg.addColorStop(.35,`rgba(20,0,0,${a*.6})`);sg.addColorStop(1,`rgba(10,0,0,${a})`);ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);}
  if(G.fatTitle&&!G.demo){const u=Math.min(1,(G.t-G.fatTitle.t)/500);const rg=ctx.createLinearGradient(0,0,0,H);rg.addColorStop(0,`rgba(120,0,10,${.38*u})`);rg.addColorStop(.5,`rgba(60,0,8,${.18*u})`);rg.addColorStop(1,`rgba(120,0,10,${.38*u})`);ctx.fillStyle=rg;ctx.fillRect(-50,-50,W+100,H+100);}
  drawFatalFx();drawChargeFx();
  if(G.phase==='over'&&G.winPose&&!G.demo){const w=G.winPose.w;const [sx,sy]=loserPt(w);const u=Math.min(1,(G.t-G.winPose.t)/600);
    const sg=ctx.createRadialGradient(sx,sy,L*0.55,sx,sy,Math.max(W,H)*0.75);sg.addColorStop(0,'rgba(0,0,0,0)');sg.addColorStop(.4,`rgba(10,4,30,${.45*u})`);sg.addColorStop(1,`rgba(5,0,20,${.75*u})`);ctx.fillStyle=sg;ctx.fillRect(-50,-50,W+100,H+100);
    ctx.save();ctx.globalCompositeOperation='lighter';const sp=ctx.createRadialGradient(sx,sy,0,sx,sy,L*1.1);sp.addColorStop(0,`rgba(255,230,160,${.22*u})`);sp.addColorStop(1,'rgba(255,230,160,0)');ctx.fillStyle=sp;ctx.fillRect(sx-L*1.2,sy-L*1.2,L*2.4,L*2.4);ctx.restore();}
  drawFX();drawStrokes();drawCombo();
  if(!G.demo&&G.phase!=='idle'){drawHUD(0);if(!P[1].ai)drawHUD(1);else drawAIBadge();}
  drawCine();drawFinishChalk();drawBanner();drawCountdown();drawTitles();
  if(G.flash>0){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle=`rgba(255,255,255,${G.flash*.55})`;ctx.fillRect(0,0,W,H);}
  if(G.slowT>0){ctx.setTransform(DPR,0,0,DPR,0,0);const v=ctx.createRadialGradient(cx,cy,Math.min(W,H)*.3,cx,cy,Math.max(W,H)*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(20,0,10,.45)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);}
}
let last=performance.now();
function loop(now){const rdt=Math.min(40,now-last);last=now;let gdt=rdt;
  if(G.hitstop>0){G.hitstop-=rdt;gdt=0;}else if(G.slowT>0){G.slowT-=rdt;gdt=rdt*0.22;}
  if(G.phase!=='idle'&&!G.paused)update(gdt,rdt);render();requestAnimationFrame(loop);}

// ---------- combo training (dojo) ----------
function startTrainMode(){startGame('ai',{});G.train={i:0,list:SPECIALS.map(x=>({k:'sp',x})).concat(FINISHERS.map(x=>({k:'fin',x})))};G.att=0;P[0].energy=100;trainUI();}
function trainTarget(){const tr=G.train;return tr&&tr.list[tr.i];}
function trainCheck(kind,id){const tg=trainTarget();if(!tg||tg.k!==kind||tg.x.id!==id)return;G.train.i++;sfxTone([784,988,1319],'triangle',.12,.15,.07);buzz([30,30,60]);msg(0,t('train_ok'),'#22c56e',1.1);trainUI();}
function trainNext(){const tg=trainTarget();P.forEach(p=>{p.hp=MAXHP;p.energy=100;p.buf=[];p.streak=0;p.hands.forEach(h=>{h.marks=[];h.char=0;h.ice=0;h.dizzyPerm=false;h.flat=0;});});G.att=0;
  if(!tg){G.phase='over';G.train=null;onTrainDone();return;}
  if(tg.k==='fin'){P[1].hp=0;toFinish(0);}else toReset();}
function trainUI(){showTrainCard(G.train?trainTarget():null,G.train?G.train.i:0,G.train?G.train.list.length:0);}

// ---------- running-out-of-time tension: heartbeat + rising dark drone ----------
let TEN=null;
function thump(t,f,v){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.5,t+.16);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.0005,t+.24);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.28);}
function tensionBeat(rem){if(!canPlay())return;const t=AC.currentTime,k=1-rem/2600;thump(t,62,.26+.16*k);thump(t+.15,52,.17+.13*k);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;f.type='highpass';f.frequency.value=5000;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05+.06*k,t+.004);g.gain.exponentialRampToValueAtTime(.0005,t+.05);s.connect(f);f.connect(g);g.connect(AC.destination);s.start(t);s.stop(t+.06);buzz(rem<1000?25:12);}
function tensionStart(rem){if(!canPlay()){TEN={};return;}const t=AC.currentTime,d=Math.max(.3,rem/1000),g=AC.createGain(),f=AC.createBiquadFilter(),os=[];
  f.type='lowpass';f.frequency.setValueAtTime(180,t);f.frequency.exponentialRampToValueAtTime(1600,t+d);f.Q.value=6;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+d);
  [[55,'sawtooth'],[58.27,'sawtooth'],[110.5,'square'],[220*1.06,'sine']].forEach(([fr,ty],i)=>{const o=AC.createOscillator();o.type=ty;o.frequency.setValueAtTime(fr,t);o.frequency.linearRampToValueAtTime(fr*(1.12+i*.02),t+d);o.connect(f);o.start(t);os.push(o);});
  const lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=7;lg.gain.value=.03;lfo.connect(lg);lg.connect(g.gain);lfo.start(t);os.push(lfo);
  f.connect(g);g.connect(AC.destination);TEN={g,os};}
function tensionStop(){if(!TEN)return;const T=TEN;TEN=null;if(!T.g||!AC)return;const t=AC.currentTime;try{T.g.gain.cancelScheduledValues(t);T.g.gain.setValueAtTime(T.g.gain.value,t);T.g.gain.exponentialRampToValueAtTime(.0001,t+.12);T.os.forEach(o=>o.stop(t+.15));}catch(e){}}
