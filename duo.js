// ===== two players, one phone: face-off start, series score, a result screen for each side, rematch by consent =====
(()=>{
const $d=id=>document.getElementById(id);
let SER={key:'',s:[0,0]};window.DUO_SER_GET=()=>SER;window.DUO_SER_SET=v=>{SER=v;};
const serKey=()=>(G.names||[]).join('|');

// ---- face-off: the countdown waits until both players have a finger on their hand ----
const _start=startGame;window.startGame=startGame=function(mode,opts){_start(mode,opts);
  if(mode==='2p'){if(SER.key!==serKey())SER={key:serKey(),s:[0,0],last:null};G.phase='faceoff';G.fo={t:G.t,ready:[false,false],both:0};}};
const _upd=update;window.update=update=function(dt,rdt){_upd(dt,rdt);
  if(G.phase!=='faceoff'||!G.fo)return;const f=G.fo;
  [0,1].forEach(p=>{const r=P[p].hands.some(h=>h.ptr!=null);if(r!==f.ready[p]){f.ready[p]=r;if(r){sfxTone([p?587:523,p?880:784],'sine',.07,.09,.05);buzz(15);}}});
  if(f.ready[0]&&f.ready[1]){f.both=f.both||G.t;if(G.t-f.both>450){G.phase='countdown';G.pt=G.t;G.cdN=-1;G.fo=null;}}else f.both=0;};
const _ren=render;window.render=render=function(){_ren();if(G.phase==='faceoff'&&G.fo&&!G.demo)drawFaceoff();};
const spring=u=>u<=0?0:u>=1?1:1-Math.exp(-6*u)*Math.cos(9*u);
const eo=u=>1-Math.pow(1-clamp(u,0,1),3);
function drawFaceoff(){const f=G.fo,e=G.t-f.t;ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle=`rgba(14,6,44,${.35*eo(e/400)})`;ctx.fillRect(0,0,W,H);ctx.restore();
  [0,1].forEach(p=>inFrame(p,()=>{const r=f.ready[p],other=G.names[1-p],hx=laneX(0)+P[p].hands[0].x,hy=P[p].hands[0].y+0.68*L,R=0.46*L,u=(G.t%1600)/1600;
    // a small pad on your own hand — never reaches the middle of the table
    ctx.save();ctx.lineWidth=2.5;
    if(r){const k=f.both?Math.min(1,(G.t-f.both)/450):1;ctx.fillStyle='rgba(255,77,99,.12)';ctx.beginPath();ctx.arc(hx,hy,R,0,PI*2);ctx.fill();
      ctx.strokeStyle='#ff4d63';ctx.lineWidth=4;ctx.shadowColor='#ff4d63';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(hx,hy,R,-PI/2,-PI/2+PI*2*k);ctx.stroke();}
    else{ctx.strokeStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(hx,hy,R,0,PI*2);ctx.stroke();ctx.globalAlpha=(1-u)*.8;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(hx,hy,R*(1+u*.35),0,PI*2);ctx.stroke();}
    ctx.restore();
    const ty=hy+R+26,txt=r?(f.ready[1-p]?t('duo_go'):t('duo_wait',other)):t('duo_hold');
    ctx.save();ctx.globalAlpha=eo((e-250)/400);ctx.font='600 15px -apple-system,system-ui,sans-serif';ctx.direction='ltr';const tw=ctx.measureText(txt).width+30,pth=rrPath(-tw/2,ty-16,tw,32,16);
    ctx.fillStyle='rgba(22,14,58,.55)';ctx.fill(pth);ctx.strokeStyle=r?'rgba(255,90,110,.5)':'rgba(255,255,255,.14)';ctx.lineWidth=1;ctx.stroke(pth);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,0,ty+1);ctx.restore();
    drawScoreboard(p,Math.max(ty+58,H/2-SAFE.b-122),e);}));}
// the series scoreboard: names slide in, the numbers drop in on a spring, the last winner's point lands with a +1
function drawScoreboard(p,y,e){const me=G.names[p],other=G.names[1-p],last=SER.last,a=SER.s[p],b=SER.s[1-p];
  ctx.save();ctx.direction='ltr';ctx.textBaseline='middle';
  const nIn=eo((e-80)/520),gap=36;ctx.globalAlpha=nIn;
  ctx.font='600 17px -apple-system,system-ui,sans-serif';ctx.fillStyle='rgba(235,235,245,.75)';
  ctx.textAlign='right';ctx.fillText(me,-gap-46-(1-nIn)*W*.4,y,W/2-80);ctx.textAlign='left';ctx.fillText(other,gap+46+(1-nIn)*W*.4,y,W/2-80);
  ctx.globalAlpha=1;
  const digit=(val,prev,x,delay,hot)=>{const u=(e-delay)/520;if(u<=0)return;const sp=spring(u);ctx.save();ctx.translate(x,y);
    const flip=hot&&prev!==val,fu=clamp((e-delay-650)/380,0,1),shown=flip&&fu<.5?prev:val,sc=flip?Math.abs(Math.cos(fu*PI)):1;
    ctx.scale(sp,sp*Math.max(.02,sc));ctx.font='800 40px -apple-system,system-ui,sans-serif';ctx.textAlign='center';
    const g=ctx.createLinearGradient(0,-20,0,20);g.addColorStop(0,hot?'#ff9aa8':'#ffffff');g.addColorStop(1,hot?'#d91e3d':'#c9c3ff');ctx.fillStyle=g;
    if(hot&&fu>=.5){ctx.shadowColor='rgba(255,77,99,.8)';ctx.shadowBlur=18*(1-clamp((e-delay-1100)/900,0,1))+4;}
    ctx.fillText(String(shown),0,2);ctx.restore();
    if(hot&&flip&&fu>=.5){const v=clamp((e-delay-1000)/900,0,1);if(v<1){ctx.save();ctx.globalAlpha=1-v;ctx.font='800 16px -apple-system,system-ui,sans-serif';ctx.fillStyle='#ff6a7d';ctx.textAlign='center';ctx.fillText('+1',x,y-30-v*26);ctx.restore();}}};
  const won=last==null?null:last===p;
  digit(a,won?a-1:a,-gap*1.25,220,won===true);
  ctx.globalAlpha=eo((e-300)/400);ctx.font='700 30px -apple-system,system-ui,sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(235,235,245,.45)';ctx.fillText('–',0,y);ctx.globalAlpha=1;
  digit(b,won===false?b-1:b,gap*1.25,320,won===false);
  ctx.globalAlpha=eo((e-500)/400)*.6;ctx.font='500 12.5px -apple-system,system-ui,sans-serif';ctx.fillStyle='#ebebf5';ctx.textAlign='center';ctx.fillText(a+b?t('duo_series'):t('duo_first'),0,y+32);
  ctx.restore();}

// ---- result: one card per player, each the right way up, rematch when both agree ----
const _go=gameOver;window.gameOver=gameOver=function(w,q){if(G.mode==='2p'&&!G.demo){if(SER.key!==serKey())SER={key:serKey(),s:[0,0]};SER.s[w]++;SER.last=w;}_go(w,q);};
const _over=onGameOver;window.onGameOver=onGameOver=function(w){_over(w);if(G.mode!=='2p')return;hide('over');showDuo(w);};
let duoReady=[false,false];
function half(p,w){const won=p===w,lose=1-w,sc=won?`${MAXHP-P[lose].hp} : ${MAXHP-P[w].hp}`:`${MAXHP-P[w].hp} : ${MAXHP-P[lose].hp}`;
  return `<div class="dh ${p?'top':''} ${won?'won':''}" data-p="${p}">
    <div class="dname">${esc(G.names[p])}</div><div class="dres">${won?t('duo_win'):t('duo_lose')}</div>
    <div class="dsc">${sc}</div><div class="dser">${t('duo_series')} ${SER.s[p]} – ${SER.s[1-p]}</div>
    <button class="dbtn" data-p="${p}">${t('duo_rematch')}</button></div>`;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function showDuo(w){duoReady=[false,false];const el=$d('duo');
  el.innerHTML=half(1,w)+`<div class="dmid"><button id="duoMenu">${t('menu')}</button><button id="duoShare">${t('duo_share')}</button></div>`+half(0,w);
  el.classList.remove('hide');
  el.querySelectorAll('.dbtn').forEach(b=>b.onclick=()=>{const p=+b.dataset.p;duoReady[p]=!duoReady[p];b.classList.toggle('on',duoReady[p]);
    b.textContent=duoReady[p]?(duoReady[1-p]?t('duo_go'):t('duo_wait',G.names[1-p])):t('duo_rematch');try{buzz(12);}catch(_){}
    if(duoReady[0]&&duoReady[1]){setTimeout(()=>{el.classList.add('hide');launch('2p',G.names.slice());},350);}});
  $d('duoMenu').onclick=()=>{el.classList.add('hide');toMenu();};
  $d('duoShare').onclick=()=>{el.classList.add('hide');show('over');};}
const _toMenu=toMenu;window.toMenu=toMenu=function(){$d('duo').classList.add('hide');_toMenu();};
$d('again').addEventListener('click',()=>$d('duo').classList.add('hide'));
})();
