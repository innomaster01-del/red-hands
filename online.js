// ===== online: play a friend (room code) or a stranger (quick match) over a direct phone-to-phone link =====
// The host runs the real game; the guest sends its touches and draws the host's state, upside down so the guest sits at the bottom.
(()=>{
const $o=id=>document.getElementById(id);
const VER=1,SNAP_MS=50,PEER_PREFIX='redhands-v1-';
const ON={role:null,conn:null,peer:null,open:false,rtt:120,lastRx:0,opp:null,inGame:false,rematch:[false,false],snapN:0};
window.ON=ON;

// ---------- rating ----------
function OR(){if(!PROF.online)PROF.online={r:1000,w:0,l:0,games:0,best:1000,streak:0};return PROF.online;}
const RANKS=[[0,'Rookie','#b9b3d9'],[900,'Bronze','#d89a63'],[1080,'Silver','#d7dbe6'],[1220,'Gold','#ffd23f'],[1380,'Platinum','#7de3ff'],[1550,'Diamond','#b98cff'],[1750,'Legend','#ff4d63']];
const rankOf=r=>{let x=RANKS[0];RANKS.forEach(k=>{if(r>=k[0])x=k;});return{name:x[1],col:x[2],next:(RANKS[RANKS.indexOf(x)+1]||[null])[0]};};
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const elo=(me,op,won)=>Math.round(32*((won?1:0)-1/(1+Math.pow(10,(op-me)/400))));

// ---------- transport: PeerJS (WebRTC) in the app, BroadcastChannel for local tests ----------
const TEST=/[?&]nettest/.test(location.search);
function loadPeer(){return new Promise((res,rej)=>{if(window.Peer)return res();const s=document.createElement('script');s.src='peerjs.min.js';s.onload=()=>res();
  s.onerror=()=>{const c=document.createElement('script');c.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';c.onload=()=>res();c.onerror=()=>rej(new Error('net'));document.head.appendChild(c);};document.head.appendChild(s);});}
// tiny fake of the PeerJS API on top of BroadcastChannel (same browser, two tabs) — used by the automated tests
function FakePeer(id){const me=id||('anon-'+Math.random().toString(36).slice(2,8)),bc=new BroadcastChannel('rh-net'),ev={},conns={};let claimed=true;const self={id:me,_ev:ev};
  const emit=(n,...a)=>(ev[n]||[]).forEach(f=>f(...a));self.on=(n,f)=>((ev[n]=ev[n]||[]).push(f),self);
  bc.onmessage=({data:d})=>{if(d.claim&&d.claim===me&&d.from!==self.nonce){bc.postMessage({taken:me,to:d.from});}
    if(d.taken===me&&d.to===self.nonce){claimed=false;}
    if(d.to!==me)return;
    if(d.op==='connect'){const c=mkConn(d.from);conns[d.from]=c;emit('connection',c);bc.postMessage({to:d.from,from:me,op:'accept'});setTimeout(()=>c._emit('open'),10);}
    else if(d.op==='accept'&&conns[d.from]){conns[d.from]._emit('open');}
    else if(d.op==='data'&&conns[d.from])conns[d.from]._emit('data',d.data);
    else if(d.op==='close'&&conns[d.from])conns[d.from]._emit('close');};
  function mkConn(peerId){const cev={};const c={peer:peerId,open:false,on:(n,f)=>((cev[n]=cev[n]||[]).push(f),c),_emit:(n,...a)=>{if(n==='open')c.open=true;if(n==='close')c.open=false;(cev[n]||[]).forEach(f=>f(...a));},
    send:x=>bc.postMessage({to:peerId,from:me,op:'data',data:x}),close:()=>{bc.postMessage({to:peerId,from:me,op:'close'});c._emit('close');}};return c;}
  self.nonce=Math.random();self.connect=pid=>{const c=mkConn(pid);conns[pid]=c;bc.postMessage({to:pid,from:me,op:'connect'});setTimeout(()=>{if(!c.open)c._emit('error',new Error('timeout'));},2500);return c;};
  self.destroy=()=>{bc.close();};
  if(id){bc.postMessage({claim:me,from:self.nonce});setTimeout(()=>{if(claimed)emit('open',me);else{const e=new Error('taken');e.type='unavailable-id';emit('error',e);}},250);}else setTimeout(()=>emit('open',me),20);
  return self;}
const mkPeer=id=>TEST?FakePeer(id):new window.Peer(id,{debug:0});

function teardown(){const c=ON.conn,p=ON.peer;ON.conn=null;ON.peer=null;ON.open=false;try{c&&c.close();}catch(e){}try{p&&p.destroy();}catch(e){}clearInterval(ON.hb);clearInterval(ON.snapT);}
function useConn(c){ON.conn=c;c.on('open',()=>{ON.open=true;ON.lastRx=performance.now();send({k:'hello',v:VER,name:PROF.name||t('you'),r:OR().r,W,H});startHeartbeat();});
  c.on('data',d=>{ON.lastRx=performance.now();try{onMsg(typeof d==='string'?JSON.parse(d):d);}catch(e){console.warn(e);}});
  c.on('close',()=>lost());c.on('error',()=>{});}
function send(o){if(ON.conn&&ON.open)try{ON.conn.send(JSON.stringify(o));}catch(e){}}
function startHeartbeat(){clearInterval(ON.hb);ON.hb=setInterval(()=>{send({k:'ping',t:performance.now()});if(ON.open&&performance.now()-ON.lastRx>6000)lost();},1000);}

// ---------- lobby ----------
const CODE_CH='ABCDEFGHJKMNPQRSTUVWXYZ';
const newCode=()=>Array.from({length:4},()=>CODE_CH[(Math.random()*CODE_CH.length)|0]).join('');
function status(txt,busy){const s=$o('onStatus');s.textContent=txt||'';s.classList.toggle('busy',!!busy);}
function lobbyView(v){['onHome','onRoom','onJoin'].forEach(id=>$o(id).classList.toggle('hide',id!==v));}
async function ready(){if(TEST)return true;try{await loadPeer();return true;}catch(e){status(t('on_nonet'));return false;}}
async function hostRoom(){if(!await ready())return;teardown();const code=newCode();ON.role='host';ON.code=code;lobbyView('onRoom');$o('onCode').textContent=code;status(t('on_waiting'),true);
  const p=mkPeer(PEER_PREFIX+code);ON.peer=p;p.on('error',e=>{if(e.type==='unavailable-id'){hostRoom();}else status(t('on_nonet'));});
  p.on('connection',c=>{if(ON.conn&&ON.open){c.on('open',()=>c.close());return;}useConn(c);});}
async function joinRoom(code){code=(code||'').toUpperCase().replace(/[^A-Z]/g,'');if(code.length!==4){status(t('on_badcode'));return;}if(!await ready())return;teardown();ON.role='guest';status(t('on_connecting'),true);
  const p=mkPeer();ON.peer=p;p.on('open',()=>{const c=p.connect(PEER_PREFIX+code,{reliable:true,serialization:'json'});useConn(c);setTimeout(()=>{if(!ON.open&&ON.role==='guest'&&ON.peer===p)status(t('on_nocode'));},7000);});
  p.on('error',e=>{if(e.type==='peer-unavailable')status(t('on_nocode'));else if(e.type!=='unavailable-id')status(t('on_nonet'));});}
// quick match: numbered waiting slots — take a free one and wait, or connect to whoever is waiting in a taken one
async function quick(){if(!await ready())return;teardown();lobbyView('onRoom');$o('onCode').textContent='';status(t('on_searching'),true);ON.quickT=performance.now();trySlot(1);}
function trySlot(n){if(n>6){status(t('on_busy'));return;}const id=PEER_PREFIX+'q'+n,p=mkPeer(id);ON.peer=p;let done=false;
  p.on('open',()=>{if(done)return;done=true;ON.role='host';status(t('on_searching'),true);
    p.on('connection',c=>{if(ON.conn&&ON.open){c.on('open',()=>c.close());return;}useConn(c);});
    ON.slotTimer=setTimeout(()=>{if(!ON.open&&ON.peer===p)status(t('on_nobody'));},30000);});
  p.on('error',e=>{if(done&&e.type!=='unavailable-id')return;if(e.type==='unavailable-id'){done=true;try{p.destroy();}catch(_){}
      const g=mkPeer();ON.peer=g;ON.role='guest';g.on('open',()=>{const c=g.connect(id,{reliable:true,serialization:'json'});useConn(c);setTimeout(()=>{if(!ON.open&&ON.peer===g){try{g.destroy();}catch(_){}trySlot(n+1);}},4000);});
      g.on('error',()=>{if(!ON.open&&ON.peer===g){try{g.destroy();}catch(_){}trySlot(n+1);}});}
    else if(!done){done=true;status(t('on_nonet'));}});}

// ---------- messages ----------
function onMsg(m){
  if(m.k==='ping'){send({k:'pong',t:m.t});return;}
  if(m.k==='pong'){ON.rtt=ON.rtt*.7+(performance.now()-m.t)*.3;return;}
  if(m.k==='hello'){if(m.v!==VER){status(t('on_version'));return;}ON.opp={name:String(m.name||'Player').slice(0,16),r:+m.r||1000};clearTimeout(ON.slotTimer);
    status(t('on_found',ON.opp.name));buzz([20,40,20]);sfxTone([523,784,1047],'sine',.08,.1,.06);
    if(ON.role==='host')setTimeout(()=>{hostStart();send({k:'start',W,H,names:G.names});},700);return;}
  if(ON.role==='guest'){if(m.k==='start')guestStart(m);else if(m.k==='s')applySnap(m.s);else if(m.k==='ev')guestEvent(m);else if(m.k==='over')showResult(m.w===1,m);else if(m.k==='rm')rematchState(m.rm);}
  else{if(m.k==='in')hostInput(m);else if(m.k==='rm'){ON.rematch[1]=!!m.on;rematchState(ON.rematch);maybeRematch();}}
  if(m.k==='em')showEmote(m.e,false);
  if(m.k==='ch')showChat(m.i,false);
  if(m.k==='bye')lost(true);}

// ---------- host ----------
function hostStart(){hide('online');ON.inGame=true;ON.rematch=[false,false];G.online=true;G.netGuest=false;
  only(null);inGameUI(true);startGame('2p',{names:[PROF.name||t('you'),ON.opp.name]});P[1].remote=true;P[0].remote=false;
  clearInterval(ON.snapT);ON.snapT=setInterval(sendSnap,SNAP_MS);}
const SKIP=new Set(['ptr','vid','plan','dodge','prevDodge','fa','t0x']);
const rep=(k,v)=>k[0]==='_'||SKIP.has(k)||typeof v==='function'||(typeof HTMLElement!=='undefined'&&v instanceof HTMLElement)?undefined:typeof v==='number'?Math.round(v*100)/100:v;
function sendSnap(){if(!ON.open||!ON.inGame)return;ON.snapN++;
  const s={G,P:P.map(p=>({hp:p.hp,energy:p.energy,face:p.face,streak:p.streak,look:p.look,frozen:p.frozen,dbl:p.dbl,hands:p.hands})),parts:ON.snapN%2?parts:null,bursts,rings,bolts,
    cin:G.cin?cinParts:null,strokes,ser:window.DUO_SER_GET?DUO_SER_GET():null};
  try{ON.conn.send(JSON.stringify({k:'s',s},rep));}catch(e){}}
function hostInput(m){const type={d:'pointerdown',m:'pointermove',u:'pointerup'}[m.e];if(!type)return;
  cv.dispatchEvent(new PointerEvent(type,{pointerId:7000+(m.id%100),clientX:m.x,clientY:m.y,bubbles:true,cancelable:true,pointerType:'touch'}));}
// forward the opponent's own words and the sounds to the guest
const FWD=['sfxHit','sfxWhoosh','sfxTone','sfxBoing','sfxSpecial','playVO','stinger','tensionStart','tensionBeat','tensionStop','noise','osc','thump'];let depth=0;
FWD.forEach(n=>{const f=window[n];if(typeof f!=='function')return;window[n]=function(...a){
  if(G.online&&!G.netGuest&&ON.open&&depth===0){const b=a.slice();if((n==='noise'||n==='osc'||n==='thump')&&AC)b[0]=b[0]-AC.currentTime;send({k:'ev',n,a:b});}
  depth++;try{return f.apply(this,a);}finally{depth--;}};});
const _msg=msg;window.msg=msg=function(p,...a){if(G.online&&!G.netGuest){if(P[p]&&P[p].remote){send({k:'ev',n:'msg',a});return;}}return _msg(p,...a);};
const _fx=fxWrap;window.fxWrap=fxWrap=function(f){return _fx(G.online?(G.netGuest?1:0):f);};
const _bs=beginStage;window.beginStage=beginStage=function(){_bs();if(G.online&&!G.netGuest&&G.strike&&P[def()].remote)G.strike.tp+=Math.min(150,ON.rtt*.6);};
const _go=gameOver;window.gameOver=gameOver=function(w,q){_go(w,q);if(G.online&&!G.netGuest){const sc=[MAXHP-P[1].hp,MAXHP-P[0].hp];setTimeout(()=>{send({k:'over',w,sc,r:OR().r});showResult(w===0,{sc,r:ON.opp.r});},3000);}};
const _ogo=onGameOver;window.onGameOver=onGameOver=function(w){if(G.online)return;_ogo(w);};

// ---------- guest ----------
function guestStart(m){hide('online');ON.inGame=true;G.online=true;G.netGuest=true;
  only(null);inGameUI(true);startGame('2p',{names:m.names});G.paused=true;ON.hostW=m.W;ON.hostH=m.H;guestLayout();ON.snap=null;}
function guestLayout(){if(!G.netGuest)return;W=ON.hostW;H=ON.hostH;cx=W/2;cy=H/2;computeL();
  const s=Math.min(innerWidth/W,innerHeight/H);ON.scale=s;DPR=Math.min(2.5,(devicePixelRatio||1)*s);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  [cv,FXL].forEach(el=>{el.style.cssText+=`;left:${(innerWidth-W)/2}px;top:${(innerHeight-H)/2}px;width:${W}px;height:${H}px;right:auto;bottom:auto;inset:auto;transform:scale(${s}) rotate(180deg);transform-origin:50% 50%`;
    el.style.left=(innerWidth-W)/2+'px';el.style.top=(innerHeight-H)/2+'px';});}
function guestRestore(){[cv,FXL].forEach(el=>{el.style.cssText=el===cv?'':'';});resize();}
addEventListener('resize',()=>{if(G.netGuest)guestLayout();});
const keepBy=(oldA,newA,key)=>{if(!newA)return oldA;if(!oldA)return newA;return newA.map(n=>{const o=oldA.find(x=>x[key]===n[key]);return o?Object.assign(o,n):n;});};
function applySnap(s){const g=s.G,lt=G.t;
  const keep={banner:G.banner,fatTitle:G.fatTitle,winTitle:G.winTitle,cin:G.cin,fo:G.fo};
  Object.keys(g).forEach(k=>{G[k]=g[k];});
  ['banner','fatTitle','winTitle'].forEach(k=>{if(keep[k]&&G[k]&&keep[k].t===G[k].t)G[k]=Object.assign(keep[k],G[k],{shown:keep[k].shown});});
  if(G.cin&&keep.cin&&keep.cin.t0===G.cin.t0){G.cin.vid=keep.cin.vid;}else if(G.cin&&!G.cin.vid){const vd=FV[G.cin.id+'_'+(G.cin.w===0?0:1)];if(vd&&vd.readyState>=2){try{vd.currentTime=0;vd.play();G.cin.vid=vd;}catch(e){}}}
  if(G.cin&&G.cin.vid&&!keep.cin)try{G.cin.vid.currentTime=0;}catch(e){}
  G.demo=false;G.paused=true;G.online=true;G.netGuest=true;
  s.P.forEach((sp,i)=>{const pl=P[i];['hp','energy','face','streak','look','frozen','dbl'].forEach(k=>pl[k]=sp[k]);
    sp.hands.forEach((sh,k)=>{const h=pl.hands[k]||(pl.hands[k]=mkHand(k));const marks=keepBy(h.marks,sh.marks,'t');Object.keys(sh).forEach(kk=>{if(kk!=='marks'&&!(i===1&&GP.down&&(kk==='x'||kk==='y')))h[kk]=sh[kk];});h.marks=marks;});
    pl.remote=i===0;pl.ai=false;});
  if(s.parts)parts=s.parts;bursts=s.bursts||[];rings=s.rings||[];bolts=s.bolts||[];if(s.cin)cinParts=s.cin;strokes=s.strokes||[];
  if(s.ser&&window.DUO_SER_SET)DUO_SER_SET(s.ser);
  if(G.winTitle&&!G.winTitle.shown&&G.phase==='over'){G.winTitle.shown=1;setTimeout(()=>showWinCard(G.winTitle),400);}
  ON.snapAt=performance.now();}
function guestEvent(m){if(m.n==='msg'){_msg(1,...m.a);return;}const f=window[m.n];if(typeof f!=='function')return;const a=m.a.slice();
  if((m.n==='noise'||m.n==='osc'||m.n==='thump')){if(!AC)return;a[0]=AC.currentTime+a[0];}depth++;try{f.apply(null,a);}catch(e){}finally{depth--;}}
// the guest's own hand follows the finger at once (no waiting for the round trip)
const GP={down:false,id:null,x:0,y:0,offx:0,offy:0};
function toHost(e){const s=ON.scale||1;return[W/2-(e.clientX-innerWidth/2)/s,H/2-(e.clientY-innerHeight/2)/s];}
['pointerdown','pointermove','pointerup','pointercancel'].forEach(type=>addEventListener(type,e=>{if(!G.netGuest||!ON.inGame||e.target!==cv)return;e.stopImmediatePropagation();e.preventDefault();
  let [x,y]=toHost(e);if(type==='pointerdown')y=Math.min(y,cy-2);const ev=type==='pointerdown'?'d':type==='pointermove'?'m':'u';send({k:'in',e:ev,id:e.pointerId,x:Math.round(x),y:Math.round(y)});
  if(ev==='d'){initAudio();const [lx,ly]=toLocal(1,x,y),h=P[1].hands[0];GP.down=G.att===0;GP.id=e.pointerId;GP.offx=h.x-lx;GP.offy=h.y-ly;GP.x=x;GP.y=y;}
  else if(e.pointerId===GP.id){GP.x=x;GP.y=y;if(ev==='u')GP.down=false;}},true));
function guestPredict(){if(!GP.down||G.att!==0)return;const lock=G.phase==='flinch'||G.phase==='finish'||G.phase==='fatal'||G.phase==='over';if(lock)return;
  const h=P[1].hands[0],[lx,ly]=toLocal(1,GP.x,GP.y);h.x=clamp(lx+GP.offx,-W/2+0.3*L,W/2-0.3*L);h.y=clamp(ly+GP.offy,-0.05*L,H/2-0.55*L);}
const _loop=loop;window.loop=loop=function(now){if(!G.netGuest)return _loop(now);
  const rdt=Math.min(40,now-(ON.lastFrame||now));ON.lastFrame=now;G.t+=rdt;
  parts.forEach(q=>{if(G.t<q.t)return;const f=rdt/16;q.x+=q.vx*f;q.y+=q.vy*f;q.vx*=Math.pow(q.drag||1,f);q.vy*=Math.pow(q.drag||1,f);if(q.grav)q.vy+=q.grav*f;});
  parts=parts.filter(q=>G.t-q.t<q.life);guestPredict();
  try{render();}catch(e){}requestAnimationFrame(loop);};

// ---------- result, rematch, disconnects ----------
function showResult(won,m){if(!ON.inGame&&!m)return;const o=OR(),before=o.r,d=elo(before,ON.opp?ON.opp.r:1000,won);o.r=Math.max(100,o.r+d);o.games++;if(won){o.w++;o.streak++;}else{o.l++;o.streak=0;}o.best=Math.max(o.best,o.r);
  (o.hist=o.hist||[]).unshift({n:ON.opp?ON.opp.name:'Player',r:ON.opp?ON.opp.r:1000,won:!!won,d,t:Date.now()});o.hist=o.hist.slice(0,12);
  PROF.coins+=won?50:15;PROF.xp+=won?100:45;saveProfile();
  const rk=rankOf(o.r),sc=m&&m.sc?(G.netGuest?`${m.sc[1]} : ${m.sc[0]}`:`${m.sc[0]} : ${m.sc[1]}`):'';
  const el=$o('onres');el.innerHTML=`<div class="orw ${won?'won':''}">${won?t('duo_win'):t('duo_lose')}</div><div class="ors">${sc}</div>${ON.opp?`<div class="orvs">vs ${esc(ON.opp.name)} <span class="orb" style="--rc:${rankOf(ON.opp.r).col}">${rankOf(ON.opp.r).name} ${ON.opp.r}</span></div>`:''}
    <div class="orr"><span class="orb" style="--rc:${rk.col}">${rk.name}</span><b id="orNum">${before}</b><i class="${d>=0?'up':'dn'}">${d>=0?'+':''}${d}</i></div>
    <div class="orc">+${won?50:15} 🪙 · +${won?100:45} XP</div>
    <button class="btn" id="orAgain">${t('duo_rematch')}</button><button class="btn" id="orLeave">${t('on_leave')}</button><p class="orst" id="orSt"></p>`;
  show('onres');
  const t0=performance.now(),step=n=>{const u=Math.min(1,(n-t0-500)/900);if(u>0)$o('orNum').textContent=Math.round(before+d*(1-Math.pow(1-u,3)));if(u<1&&$o('orNum'))requestAnimationFrame(step);};requestAnimationFrame(step);
  ON.rematch=[false,false];
  $o('orAgain').onclick=()=>{const me=G.netGuest?1:0;ON.rematch[me]=!ON.rematch[me];if(G.netGuest)send({k:'rm',on:ON.rematch[1]});else send({k:'rm',rm:ON.rematch});rematchState(ON.rematch);maybeRematch();};
  $o('orLeave').onclick=()=>leave();}
function rematchState(rm){ON.rematch=rm;const me=G.netGuest?1:0,b=$o('orAgain');if(!b)return;b.classList.toggle('on',!!rm[me]);
  b.textContent=rm[me]?(rm[1-me]?t('duo_go'):t('duo_wait',ON.opp?ON.opp.name:'')):t('duo_rematch');$o('orSt').textContent=rm[1-me]&&!rm[me]?t('on_wants',ON.opp?ON.opp.name:''):'';}
function maybeRematch(){if(G.netGuest)return;send({k:'rm',rm:ON.rematch});if(ON.rematch[0]&&ON.rematch[1]){hide('onres');setTimeout(()=>{hostStart();send({k:'start',W,H,names:G.names});},300);}}
function leave(){send({k:'bye'});endOnline();}
function endOnline(){ON.inGame=false;teardown();G.online=false;const wasGuest=G.netGuest;G.netGuest=false;G.paused=false;P.forEach(p=>p.remote=false);
  if(wasGuest)guestRestore();hide('onres');hide('online');toMenu();}
function lost(){if(!ON.conn&&!ON.peer)return;const wasOpen=ON.open;teardown();if(!ON.inGame){if(wasOpen||ON.role)status(t('on_lost'));return;}
  toast('📡',t('on_left',ON.opp?ON.opp.name:''));const resShown=!$o('onres').classList.contains('hide');
  if(!resShown&&G.phase!=='idle')showResult(true,{sc:null});const b=$o('orAgain');if(b)b.style.display='none';const st=$o('orSt');if(st)st.textContent=t('on_left',ON.opp?ON.opp.name:'');}
const _tm=toMenu;window.toMenu=toMenu=function(){if(G.online){send({k:'bye'});ON.inGame=false;teardown();G.online=false;if(G.netGuest){G.netGuest=false;G.paused=false;guestRestore();}P.forEach(p=>p.remote=false);}hide('onres');_tm();};

// ---------- emotes: four quick reactions, shown big on the other side ----------
const EMO=['👋','😂','😮','🔥'];let emoT=0;
function emoBar(on){const b=$o('onEmo');b.classList.toggle('hide',!on);if(on&&!b.childElementCount){b.innerHTML=EMO.map(e=>`<button>${e}</button>`).join('');b.querySelectorAll('button').forEach(x=>x.onclick=()=>{if(performance.now()-emoT<900)return;emoT=performance.now();send({k:'em',e:x.textContent});showEmote(x.textContent,true);try{buzz(10);}catch(_){}});}}
function showEmote(e,mine){if(!EMO.includes(e))return;const el=document.createElement('div');el.className='onpop '+(mine?'mine':'theirs');el.textContent=e;document.body.appendChild(el);setTimeout(()=>el.remove(),1700);if(!mine){try{sfxTone([660,880],'sine',.06,.08,.05);}catch(_){}}}
// quick chat: fixed, friendly phrases (no free typing, so nothing rude can be sent)
const CHAT=['Good luck!','Nice one!','Ouch!','Too slow 😎','Wow!','So close!','Good game','Rematch?'];let chT=0;
function showChat(i,mine){const txt=CHAT[i];if(!txt)return;document.querySelectorAll('.onsay.'+(mine?'mine':'theirs')).forEach(e=>e.remove());const el=document.createElement('div');el.className='onsay '+(mine?'mine':'theirs');
  el.innerHTML=`<b>${esc(mine?(PROF.name||'You'):(ON.opp?ON.opp.name:''))}</b>${esc(txt)}`;document.body.appendChild(el);setTimeout(()=>el.remove(),2600);if(!mine){try{sfxTone([587,784],'sine',.06,.08,.06);buzz(10);}catch(_){}}}
$o('onChatBtn').onclick=()=>{const c=$o('onChat');if(!c.childElementCount){c.innerHTML=CHAT.map((x,i)=>`<button data-i="${i}">${x}</button>`).join('');c.querySelectorAll('button').forEach(b=>b.onclick=()=>{c.classList.add('hide');if(performance.now()-chT<1200)return;chT=performance.now();send({k:'ch',i:+b.dataset.i});showChat(+b.dataset.i,true);});}c.classList.toggle('hide');};
setInterval(()=>{const on=!!(ON.inGame&&ON.open&&G.online&&G.phase!=='fatal');$o('onChatBtn').classList.toggle('hide',!on);if(!on)$o('onChat').classList.add('hide');},300);
setInterval(()=>emoBar(!!(ON.inGame&&ON.open&&G.online&&$o('onres').classList.contains('hide')&&G.phase!=='fatal'&&G.phase!=='over')),300);

// ---------- UI wiring ----------
function openOnline(){initAudio();const o=OR(),rk=rankOf(o.r);
  $o('onRank').innerHTML=`<span class="orb" style="--rc:${rk.col}">${rk.name}</span><b>${o.r}</b><small>${o.w} ${t('on_wins')} · ${o.l} ${t('on_losses')}</small>`+(rk.next?`<div class="onbar"><i style="width:${Math.round(clamp((o.r-RANKS.find(k=>k[1]===rk.name)[0])/(rk.next-RANKS.find(k=>k[1]===rk.name)[0]),0,1)*100)}%"></i></div><small class="onnext">${rk.next-o.r} ${t('on_tonext')}</small>`:'');
  const h=(o.hist||[]).slice(0,5);$o('onHist').innerHTML=h.length?`<div class="onhh">${t('on_recent')}</div>`+h.map(x=>`<div class="onh"><i class="${x.won?'w':'l'}">${x.won?'W':'L'}</i><span>${esc(x.n)}</span><b class="${x.d>=0?'up':'dn'}">${x.d>=0?'+':''}${x.d}</b></div>`).join(''):'';
  lobbyView('onHome');status('');show('online');}
$o('bon').disabled=false;$o('bon').onclick=openOnline;
$o('onQuick').onclick=quick;$o('onHost').onclick=hostRoom;$o('onJoinBtn').onclick=()=>{lobbyView('onJoin');status('');setTimeout(()=>$o('onCodeIn').focus(),50);};
$o('onJoinGo').onclick=()=>joinRoom($o('onCodeIn').value);$o('onCodeIn').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom($o('onCodeIn').value);});
$o('onCancel').onclick=()=>{teardown();lobbyView('onHome');status('');};
$o('onClose').onclick=()=>{teardown();hide('online');};
$o('onShare').onclick=()=>{const txt=t('on_invite',ON.code);if(navigator.share)navigator.share({text:txt}).catch(()=>{});else location.href='https://wa.me/?text='+encodeURIComponent(txt);};
const _al=applyLang;window.applyLang=applyLang=function(){_al();$o('bon').innerHTML=t('btn_online');document.querySelectorAll('#online [data-t]').forEach(el=>el.textContent=t(el.dataset.t));};
$o('bon').innerHTML=t('btn_online');document.querySelectorAll('#online [data-t]').forEach(el=>el.textContent=t(el.dataset.t));
})();
