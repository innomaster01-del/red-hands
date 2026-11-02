// ===== fatality cinematics: one short movie per finisher =====
// Runs full screen with its own camera, background and effects. Timeline (ms) per finisher, then FATALITY title, then the win card.
let cinParts=[];
const CIN_TITLE={bolt:2300,fire:2750,ice:2400,tornado:2600,giant:1950};
const eo=u=>1-Math.pow(1-clamp(u,0,1),3);
const eio=u=>{u=clamp(u,0,1);return u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;};
const seg=(e,a,b)=>clamp((e-a)/(b-a),0,1);
function cinStart(id){const w=G.finW,l=1-w,S=Math.min(W*0.47,H*0.25);
  G.cin={id,w,l,t0:G.t,S,fired:{},sh:0,flash:0,flashCol:'255,255,255',xray:0,bolts:[],shards:null,titled:false,hy:H+0.2*S,hx:W/2,
    marks:P[l].hands[0].marks.slice(-4).map(m=>({...m,_cv:null,_k:null,x:m.x*S/L,y:(m.y||.45*L)*S/L})),
    v:{char:0,ice:0,flat:0,burn:0,spin:0,sc:1,dy:0,detached:false,gone:false,block:0,flash:0,squash:0}};
  cinParts=[];
  if(!window.CIN_HQ){const vd=FV[id+'_'+(w===0?0:1)];if(vd&&vd.readyState>=2){try{vd.currentTime=0;const pr=vd.play();G.cin.vid=vd;G.cin.vidWait=G.t;if(pr&&pr.catch)pr.catch(()=>{if(G.cin)G.cin.vid=null;});}catch(e){}}}}
const cinV=()=>[W/2,H*0.5-0.58*G.cin.S];
function cp(o){cinParts.push(Object.assign({t:G.t,life:800,vx:0,vy:0,grav:0,drag:.98,sz:4,col:'#fff',shape:'dot',rot:0,vr:0},o));}
function once(c,k){if(c.fired[k])return false;c.fired[k]=1;return true;}
function zig(x1,y1,x2,y2,n,amp){const p=[];for(let i=0;i<=n;i++){const u=i/n;p.push([lerp(x1,x2,u)+(i&&i<n?rand(-amp,amp):0),lerp(y1,y2,u)+(i&&i<n?rand(-amp,amp)*.4:0)]);}return p;}
function cinHit(pw,col){const c=G.cin;c.sh=Math.max(c.sh,pw);c.flash=1;c.flashCol=col||'255,255,255';c.v.flash=1;c.v.squash=1;buzz([90,40,160]);}
function cinRing(x,y,max,col,w,life=600){cp({x,y,shape:'ring',max,col,sz:w,life,drag:1});}

function updCinema(rdt){const c=G.cin;if(!c)return;
  if(c.vid){const vd=c.vid;if(vd.currentTime<=0.001&&!vd.ended){if(G.t-c.vidWait>700){c.vid=null;}else{c.t0=G.t;return;}}else if(!vd.ended)c.t0=G.t-vidToE(c.id,vd.currentTime*1000);}const e=G.t-c.t0,v=c.v,S=c.S,[vx,vy]=cinV(),T=CIN_TITLE[c.id],S2=S*1.05;
  c.sh*=Math.pow(.86,rdt/16);c.flash=Math.max(0,c.flash-rdt/280);c.xray=Math.max(0,c.xray-rdt/190);v.flash=Math.max(0,v.flash-rdt/320);v.squash=Math.max(0,v.squash-rdt/260);
  const rise=(a,b,to)=>lerp(H+0.25*S,to,eo(seg(e,a,b)));
  if(c.id==='bolt'){
    c.hy=rise(0,650,H*0.64)+(e>2000?eo(seg(e,2000,2600))*0.08*S:0);
    if(e>350&&Math.random()<rdt/90){const x0=c.hx+rand(-.25,.25)*S2,y0=c.hy+rand(0,.15)*S2;c.bolts.push({pts:zig(x0,y0,x0+rand(-.2,.2)*S2,y0+rand(.05,.3)*S2,4,8),t:G.t,small:1});}
    if(e>500&&e<900&&once(c,'charge')&&canPlay()){const t0=AC.currentTime;const f=noise(t0,.5,'bandpass',300,3,.4,.45);f.frequency.exponentialRampToValueAtTime(3000,t0+.4);}
    [900,1300,1650].forEach((tt,i)=>{if(e>=tt&&once(c,'b'+i)){cinHit(22+i*4,'200,220,255');c.xray=1;v.char=Math.min(.92,v.char+.32);
      c.bolts.push({pts:zig(c.hx,c.hy,vx,vy+0.2*S,11,34),t:G.t},{pts:zig(vx+rand(-70,70),-30,vx,vy,12,46),t:G.t+40});
      if(canPlay()){const t0=AC.currentTime;noise(t0,.7,'highpass',2000,.7,1,.6);osc(t0,'sawtooth',110,38,.45,.55);noise(t0+.05,1.2,'lowpass',160,.7,.7,1.1);}
      for(let k=0;k<30;k++){const a=rand(0,PI*2),sp=rand(2,8);cp({x:vx,y:vy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(300,650),col:k%2?'#ffffff':'#9fd0ff',sz:rand(1.5,3.5),add:true,drag:.92});}
      cinRing(vx,vy,S*1.4,'#bfe0ff',8,450);}});
    if(e>1800&&Math.random()<rdt/40)cp({x:vx+rand(-.3,.3)*S,y:vy+rand(-.35,.35)*S,vy:-rand(.5,1.1),vx:rand(-.25,.25),life:1800,col:'rgba(55,55,65,.5)',sz:rand(.07,.11)*S,shape:'smoke',drag:.996});
    if(e>1800&&Math.random()<rdt/260){const a=rand(0,PI*2);c.bolts.push({pts:zig(vx,vy,vx+Math.cos(a)*S*.45,vy+Math.sin(a)*S*.45,5,12),t:G.t,small:1});}
  }else if(c.id==='fire'){
    c.hy=rise(0,550,H*0.64)-(e>1150&&e<1500?Math.sin(seg(e,1150,1500)*PI)*0.18*S:0);
    const px=c.hx,py=c.hy+0.42*S2;
    if(e<1180){c.ball={x:px,y:py,r:0.36*S*eo(seg(e,300,1150))};
      if(e>300&&Math.random()<rdt/14){const a=rand(0,PI*2),r=c.ball.r*2.2+10;cp({x:px+Math.cos(a)*r,y:py+Math.sin(a)*r,vx:-Math.cos(a)*r/22,vy:-Math.sin(a)*r/22,life:380,col:['#ffd23f','#ff8a1c','#ff3b1f'][(Math.random()*3)|0],sz:rand(3,6),add:true,drag:1});}
      if(e>300&&once(c,'chg')&&canPlay()){const t0=AC.currentTime;noise(t0,.9,'lowpass',500,.8,.5,.85);const f=noise(t0,.9,'bandpass',200,2,.3,.85);f.frequency.exponentialRampToValueAtTime(1600,t0+.85);}}
    else if(e<1460){const u=eio(seg(e,1180,1460));c.ball={x:lerp(px,vx,u),y:lerp(py,vy,u),r:0.36*S*(1+u*.35)};if(Math.random()<.7)cp({x:c.ball.x+rand(-8,8),y:c.ball.y+rand(-8,8),vx:rand(-.5,.5),vy:rand(.5,1.5),life:420,col:['#ffd23f','#ff6a1f'][(Math.random()*2)|0],sz:rand(6,12),add:true,drag:.95});
      if(once(c,'throw'))sfxWhoosh();}
    else if(once(c,'boom')){c.ball=null;cinHit(30,'255,190,90');v.burn=1;cinRing(vx,vy,S*1.8,'#ffcf40',14,600);cinRing(vx,vy,S*2.4,'#ff4d1f',7,750);
      if(canPlay()){const t0=AC.currentTime;noise(t0,1.4,'lowpass',700,.8,1,1.3);osc(t0,'sine',90,30,.9,.9);}
      for(let k=0;k<110;k++){const a=rand(0,PI*2),sp=rand(1.5,9);cp({x:vx,y:vy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(500,1100),col:['#fff3b0','#ffcf40','#ff8a1c','#ff3b1f'][k%4],sz:rand(5,14),shape:'fire',add:true,drag:.93});}}
    if(e>1460){v.char=Math.min(.95,v.char+rdt/1400);const fl=1-seg(e,2500,3400);
      if(Math.random()<fl*rdt/6)cp({x:vx+rand(-.42,.42)*S,y:vy+rand(-.5,.5)*S,vx:rand(-.3,.3),vy:-rand(1.2,3),life:rand(380,700),col:['#fff3b0','#ffcf40','#ff8a1c','#ff3b1f'][(Math.random()*4)|0],sz:rand(7,15),shape:'fire',add:true,drag:.97});
      if(e>2300&&Math.random()<rdt/45)cp({x:vx+rand(-.3,.3)*S,y:vy+rand(-.35,.35)*S,vy:-rand(.5,1),vx:rand(-.2,.2),life:2000,col:'rgba(40,36,36,.5)',sz:rand(.07,.11)*S,shape:'smoke',drag:.996});}
  }else if(c.id==='ice'){
    c.hy=e<1250?rise(0,600,H*0.68):e<1520?lerp(H*0.68,H*0.78,eo(seg(e,1250,1520))):e<1690?lerp(H*0.78,H*0.53,eio(seg(e,1520,1690))):lerp(H*0.53,H*0.66,eo(seg(e,1750,2300)));
    v.ice=eo(seg(e,100,900));v.block=c.shards?0:eo(seg(e,850,1200));
    if(e<1200&&Math.random()<rdt/30)cp({x:vx+rand(-.5,.5)*S,y:vy+rand(-.6,.6)*S,life:700,col:'#ffffff',sz:rand(2,4),shape:'star',vr:3,add:true,drag:1});
    if(e>850&&once(c,'freeze')){cinHit(10,'200,240,255');if(canPlay()){const t0=AC.currentTime;noise(t0,.5,'highpass',4500,1,.5,.45);sfxTone([2637,3136,3520,4186],'triangle',.12,.11,.05);}}
    if(e>=1520&&once(c,'wind'))sfxWhoosh();
    if(e>=1700&&once(c,'shatter')){makeShards();v.gone=true;v.detached=true;cinHit(34,'220,245,255');cinRing(vx,vy,S*2,'#dff8ff',12,600);
      if(canPlay()){const t0=AC.currentTime;noise(t0,1,'highpass',2400,.8,1,.9);sfxTone([3520,2637,1976,1568,1319],'triangle',.12,.12,.035);osc(t0,'sine',70,35,.5,.8);}
      for(let k=0;k<60;k++){const a=rand(0,PI*2),sp=rand(2,9);cp({x:vx+rand(-.3,.3)*S,y:vy+rand(-.4,.4)*S,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:rand(900,1600),col:k%3?'rgba(210,245,255,.9)':'#ffffff',sz:rand(4,10),shape:'shard',rot:rand(0,6),vr:rand(-12,12),grav:.22,drag:.97});}}
  }else if(c.id==='tornado'){
    c.hy=rise(0,600,H*0.66);c.hx=W/2+Math.sin(e/160)*0.08*S*seg(e,300,900)*(1-seg(e,2200,2600));
    c.sw=eo(seg(e,0,800))*(1-0.6*seg(e,2400,3000));
    if(e>650){v.detached=true;const u=seg(e,850,2350);v.spin+=rdt*0.018*(0.25+u*1.6);v.sc=1-0.88*eio(u);v.dy=-eio(u)*H*0.28;}
    if(e>650&&once(c,'rip')){cinHit(14,'230,255,240');c.flash=.35;if(canPlay()){const t0=AC.currentTime;const f=noise(t0,2.2,'bandpass',260,2,.7,2.1);f.frequency.exponentialRampToValueAtTime(2400,t0+1.8);}}
    if(Math.random()<c.sw*rdt/8){const a=rand(0,PI*2),r=rand(.4,1.3)*S;cp({x:vx+Math.cos(a)*r,y:vy+Math.sin(a)*r*.6,orb:{a,r,w:rand(.004,.009)},life:rand(700,1300),col:['#c8d8c8','#8fae7a','#e7efe3','#6b8f4f'][(Math.random()*4)|0],sz:rand(3,7),shape:'leaf',vr:rand(-8,8),drag:1});}
    if(e>=2380&&once(c,'ding')){v.gone=true;const tx=vx,ty=vy+v.dy;for(let k=0;k<14;k++){const a=k/14*PI*2;cp({x:tx,y:ty,vx:Math.cos(a)*3,vy:Math.sin(a)*3,life:700,col:'#fff7b0',sz:6,shape:'star',add:true,drag:.92});}
      cp({x:tx,y:ty,life:900,col:'#fffbe0',sz:22,shape:'twinkle',drag:1});if(canPlay())sfxTone([2093,2637,3136],'sine',.25,.14,.07);}
  }else if(c.id==='giant'){
    c.gsc=e<1000?lerp(2.7,1.3,eio(seg(e,0,1000))):e<1180?1.3:lerp(1.3,4,eio(seg(e,1180,1800)));c.ga=e<1000?.88*seg(e,0,450):.88*1-seg(e,1300,1800);
    c.shadow=e<1000?eo(seg(e,0,1000)):1-seg(e,1150,1500);
    if(e>200&&once(c,'drop')&&canPlay()){const t0=AC.currentTime;const f=noise(t0,.85,'lowpass',200,1,.5,.8);f.frequency.exponentialRampToValueAtTime(900,t0+.8);osc(t0,'sine',60,120,.8,.3);}
    if(e>=1000&&once(c,'slam')){cinHit(40,'255,255,255');v.flat=1;cinRing(vx,vy,S*2.2,'#ffffff',16,600);cinRing(vx,vy,S*3,'#ff4d6d',8,800);
      sfxHit('sd_classic',1.8);if(canPlay()){const t0=AC.currentTime;osc(t0,'sine',55,28,1,1);noise(t0,1,'lowpass',300,.8,.9,.9);}
      for(let k=0;k<40;k++){const a=rand(0,PI*2),sp=rand(2,6);cp({x:vx+Math.cos(a)*S*.5,y:vy+Math.sin(a)*S*.35,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.6,life:rand(600,1000),col:'rgba(255,255,255,.55)',sz:rand(.05,.1)*S,shape:'smoke',drag:.95});}
      cp({x:vx,y:vy-S*.15,life:900,txt:LANG==='he'?'טראח!':'SPLAT!',shape:'word',sz:S*.32,drag:1});}
  }
  if(e>=T&&!c.titled){c.titled=true;G.fatTitle={t:G.t,w:c.w,sub:FINISHERS.find(x=>x.id===c.id).ic+' '+t('fin_'+c.id)};c.sh=Math.max(c.sh,14);announce(t('fatality'),'fatal','fatality');G.flash=.25;}
  if(e>=T+1900&&G.phase==='fatal'){
    const ds=P[c.l].hands;
    if(G.train){G.cin=null;G.fatTitle=null;clearFx();resetFinishHand(c.l);trainNext();return;}
    if(G.practice){G.cin=null;G.fatTitle=null;resetFinishHand(c.l);toFinish(c.w);return;}
    ds.forEach(h=>{if(c.id==='bolt'||c.id==='fire')h.char=.85;if(c.id==='ice')h.ice=1;if(c.id==='giant')h.flat=.6;});
    if(!P[c.w].ai&&G.mode!=='tut')unlockAch('finisher');G.fatalDone=c.id;gameOver(c.w,true);}
  const now=G.t;cinParts=cinParts.filter(q=>now-q.t<q.life);
  cinParts.forEach(q=>{if(now<q.t)return;const f=rdt/16;if(q.orb){q.orb.a+=q.orb.w*rdt;q.orb.r*=Math.pow(.997,f);q.y-=.4*f;q.x=W/2+Math.cos(q.orb.a)*q.orb.r;q.y=q.y*0+(cinV()[1]-(now-q.t)*.06)+Math.sin(q.orb.a)*q.orb.r*.45;}
    else{q.x+=q.vx*f;q.y+=q.vy*f;q.vx*=Math.pow(q.drag,f);q.vy*=Math.pow(q.drag,f);q.vy+=q.grav*f;}q.rot+=q.vr*rdt/1000;});
  if(c.shards)c.shards.list.forEach(s=>{const f=rdt/16;s.x+=s.vx*f;s.y+=s.vy*f;s.vy+=.28*f;s.vx*=Math.pow(.985,f);s.r+=s.vr*rdt/1000;});
  c.bolts=c.bolts.filter(b=>now-b.t<(b.small?140:260));
}

// ---------- drawing ----------
function cinBG(id,e){const c=G.cin,[vx,vy]=cinV(),S=c.S;
  const pal={bolt:['#03050c','#10183a','#222c58'],fire:['#0d0200','#3e0800','#8a2200'],ice:['#041a30','#215f8c','#a9dcf5'],tornado:['#0e1510','#2d3c32','#64786a'],giant:['#0d0520','#2a1258','#55298a']}[id];
  ctx.drawImage(cinTable(),-60,-60,W+120,H+120);
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,pal[0]);g.addColorStop(.55,pal[1]);g.addColorStop(1,pal[2]);ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle=g;ctx.fillRect(-60,-60,W+120,H+120);ctx.restore();
  ctx.save();ctx.globalAlpha=.35;ctx.fillStyle=g;ctx.fillRect(-60,-60,W+120,H+120);ctx.restore();
  {const lc={bolt:'150,180,255',fire:'255,140,60',ice:'170,230,255',tornado:'200,230,200',giant:'200,150,255'}[id];const r=seeded(29+id.length);ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<16;i++){const bx=r()*W,by=r()*H*.42+(id==='fire'?H*.5*r():0),br=8+r()*26,fl=.5+.5*Math.sin(e/(500+r()*700)+i);const bg=ctx.createRadialGradient(bx,by,0,bx,by,br);bg.addColorStop(0,`rgba(${lc},${.16*fl})`);bg.addColorStop(.7,`rgba(${lc},${.1*fl})`);bg.addColorStop(1,`rgba(${lc},0)`);ctx.fillStyle=bg;ctx.beginPath();ctx.arc(bx,by,br,0,PI*2);ctx.fill();}
    const kp=ctx.createRadialGradient(vx,vy,0,vx,vy,S*1.6);kp.addColorStop(0,`rgba(${lc},.22)`);kp.addColorStop(1,`rgba(${lc},0)`);ctx.fillStyle=kp;ctx.fillRect(vx-S*1.6,vy-S*1.6,S*3.2,S*3.2);
    const sh=ctx.createLinearGradient(W*.2,-H*.1,W*.55,H*.7);sh.addColorStop(0,`rgba(${lc},.1)`);sh.addColorStop(1,`rgba(${lc},0)`);ctx.fillStyle=sh;ctx.beginPath();ctx.moveTo(W*.25,-60);ctx.lineTo(W*.55,-60);ctx.lineTo(W*.75,H*.8);ctx.lineTo(W*.35,H*.8);ctx.closePath();ctx.fill();ctx.restore();}
  const sp=ctx.createRadialGradient(vx,vy,0,vx,vy,Math.max(W,H)*0.75);sp.addColorStop(0,'rgba(255,255,255,.14)');sp.addColorStop(.5,'rgba(0,0,0,.05)');sp.addColorStop(1,'rgba(0,0,0,.6)');ctx.fillStyle=sp;ctx.fillRect(-60,-60,W+120,H+120);
  ctx.save();
  if(id==='bolt'){const cl=seg(e,0,700);for(let i=0;i<9;i++){const x=(i/8)*W*1.2-W*.1+Math.sin(e/900+i)*14,y=H*0.06+Math.sin(i*1.7)*H*0.04,r=W*0.2;const cg=ctx.createRadialGradient(x,y,0,x,y,r);cg.addColorStop(0,`rgba(40,44,70,${.95*cl})`);cg.addColorStop(1,'rgba(20,22,40,0)');ctx.fillStyle=cg;ctx.fillRect(x-r,y-r,r*2,r*2);}
    ctx.strokeStyle='rgba(170,190,255,.22)';ctx.lineWidth=1.2;for(let i=0;i<70;i++){const x=((i*73.7+e*0.35)%(W+40))-20,y=((i*131.3+e*1.5)%(H+40))-20;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+18);ctx.stroke();}}
  else if(id==='fire'){ctx.globalCompositeOperation='lighter';for(let i=0;i<9;i++){const x=(i+.5)/9*W,h=H*(0.1+0.05*Math.sin(e/120+i*2)),w=W/7;const fg=ctx.createLinearGradient(0,H,0,H-h);fg.addColorStop(0,'rgba(255,90,10,.55)');fg.addColorStop(1,'rgba(255,190,40,0)');ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(x-w,H);ctx.quadraticCurveTo(x-w*.3,H-h*.6,x+Math.sin(e/90+i)*8,H-h);ctx.quadraticCurveTo(x+w*.3,H-h*.6,x+w,H);ctx.fill();}
    for(let i=0;i<30;i++){const u=((e/2600)+i/30)%1,x=(i*97)%W+Math.sin(u*8+i)*16,y=H-u*H;ctx.fillStyle=`rgba(255,${150+(i%5)*20},60,${(1-u)*.8})`;ctx.fillRect(x,y,2.5,2.5);}}
  else if(id==='ice'){ctx.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<80;i++){const x=((i*61.3+Math.sin(e/700+i)*30)%W+W)%W,y=((i*113.1+e*0.07*(1+i%3))%(H+20))-10;ctx.beginPath();ctx.arc(x,y,1+(i%3)*.8,0,PI*2);ctx.fill();}
    const fv=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);fv.addColorStop(0,'rgba(255,255,255,0)');fv.addColorStop(1,`rgba(220,245,255,${.45*seg(e,0,900)})`);ctx.fillStyle=fv;ctx.fillRect(0,0,W,H);
    const sl=eo(seg(e,150,1200));if(sl>0){ctx.translate(vx,vy);for(let i=0;i<14;i++){const a=i/14*PI*2+.2,len=S*(0.55+0.25*((i*37)%5)/5)*sl,r0=S*0.52;ctx.save();ctx.rotate(a);const ig=ctx.createLinearGradient(r0,0,r0+len,0);ig.addColorStop(0,'rgba(200,240,255,.85)');ig.addColorStop(1,'rgba(255,255,255,.2)');ctx.fillStyle=ig;ctx.beginPath();ctx.moveTo(r0,-S*.05);ctx.lineTo(r0+len,0);ctx.lineTo(r0,S*.05);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.stroke();ctx.restore();}}}
  else if(id==='tornado'){ctx.strokeStyle='rgba(230,240,230,.18)';ctx.lineCap='round';for(let i=0;i<26;i++){const y=(i*37.7)%H,x=((e*1.2+i*151)%(W+300))-150;ctx.lineWidth=1+(i%3);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+60+(i%4)*30,y+((i%2)?6:-6));ctx.stroke();}
    const sw=c.sw||0;if(sw>0){ctx.translate(vx,vy);ctx.lineCap='round';for(let i=0;i<9;i++){const r=(0.35+i*0.13)*S,a0=e/(110-i*7)+i*1.3;ctx.strokeStyle=i%2?`rgba(235,245,235,${.55*sw})`:`rgba(170,200,170,${.45*sw})`;ctx.lineWidth=(7-i*.5)*sw+1;ctx.beginPath();ctx.ellipse(0,0,r,r*0.55,0,a0,a0+PI*1.2);ctx.stroke();}}}
  else if(id==='giant'){const sh=c.shadow||0;if(sh>0){const r=S*(0.8+1.8*(1-sh));const sg=ctx.createRadialGradient(vx,vy,0,vx,vy,r);sg.addColorStop(0,`rgba(0,0,0,${.7*sh})`);sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.fillRect(vx-r,vy-r,r*2,r*2);}}
  ctx.restore();}
function iceBlock(o,u){const c=G.cin,S=c.S,x=W/2-0.52*S,y=H*0.5-1.12*S,w=1.04*S,h=1.22*S;o.save();o.globalAlpha=u;const p=rrPath(x,y,w,h,0.12*S);
  const g=o.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'rgba(225,250,255,.6)');g.addColorStop(.5,'rgba(140,215,255,.32)');g.addColorStop(1,'rgba(90,170,240,.55)');o.fillStyle=g;o.fill(p);
  o.lineWidth=4;o.strokeStyle='rgba(255,255,255,.95)';o.stroke(p);o.lineWidth=2;o.strokeStyle='rgba(60,140,220,.7)';o.stroke(rrPath(x+7,y+7,w-14,h-14,0.1*S));
  o.fillStyle='rgba(255,255,255,.7)';o.beginPath();o.moveTo(x+w*.1,y+h*.06);o.lineTo(x+w*.32,y+h*.06);o.lineTo(x+w*.1,y+h*.4);o.closePath();o.fill();o.restore();}
function makeShards(){const c=G.cin,S=c.S;const off=document.createElement('canvas');off.width=Math.round(W*DPR);off.height=Math.round(H*DPR);const o=off.getContext('2d');o.setTransform(DPR,0,0,DPR,0,0);
  o.save();o.translate(W/2,H*0.5);o.rotate(PI);drawHandShape(o,S,{palmUp:false,look:P[c.l].look,noSleeve:true,marks:c.marks,bruise:MAXHP,fx:{ice:1,crack:1},onTop:true,t:G.t});o.restore();iceBlock(o,1);
  const x0=W/2-0.56*S,x1=W/2+0.56*S,y0=H*0.5-1.16*S,y1=H*0.5+0.12*S,nx=5,ny=6,pt=[];
  for(let j=0;j<=ny;j++){pt.push([]);for(let i=0;i<=nx;i++)pt[j].push([lerp(x0,x1,i/nx)+(i>0&&i<nx?rand(-.32,.32)*(x1-x0)/nx:0),lerp(y0,y1,j/ny)+(j>0&&j<ny?rand(-.32,.32)*(y1-y0)/ny:0)]);}
  const list=[],ix=W/2,iy=H*0.54;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=pt[j][i],b=pt[j][i+1],cc=pt[j+1][i+1],d=pt[j+1][i];[[a,b,cc],[a,cc,d]].forEach(tri=>{const cx2=(tri[0][0]+tri[1][0]+tri[2][0])/3,cy2=(tri[0][1]+tri[1][1]+tri[2][1])/3;
    const dx=cx2-ix,dy=cy2-iy,dl=Math.hypot(dx,dy)||1,sp=rand(3,9);list.push({tri,cx:cx2,cy:cy2,x:cx2,y:cy2,vx:dx/dl*sp+rand(-1,1),vy:dy/dl*sp-rand(2,5),r:0,vr:rand(-6,6)});});}
  c.shards={off,list};}
function cinVictim(e){const c=G.cin,v=c.v,S=c.S,pl=P[c.l],look=pl.look,[vx,vy]=cinV();
  const trem=e<900?(1-seg(e,0,900))*2.2:0;
  const opt={palmUp:false,look,marks:c.marks,bruise:MAXHP,red:.16+v.flash*.35,flash:v.flash,squash:v.squash,flatten:v.flat*.82,fx:{char:v.char,ice:v.ice,crack:c.id==='ice'?seg(e,1350,1680):0},onTop:true,t:G.t,sleeveLen:H*1.2};
  if(!v.detached){ctx.save();ctx.translate(W/2+rand(-trem,trem),H*0.5+rand(-trem,trem));ctx.rotate(PI);drawHandShape(ctx,S,opt);
    if(c.xray>0){const g=cartoonGeo(S,null);ctx.save();ctx.globalAlpha=c.xray;ctx.fillStyle='#05060c';g.parts.forEach(p=>ctx.fill(p.path));ctx.fill(g.palm);
      ctx.strokeStyle='#e8f3ff';ctx.lineCap='round';ctx.shadowColor='#9fd0ff';ctx.shadowBlur=10;
      g.parts.forEach(p=>{const n=p.thumb?2:3;for(let k=0;k<n;k++){const u0=k/n+.04,u1=(k+1)/n-.04;ctx.lineWidth=S*(p.thumb?.05:.045)*(1-k*.12);ctx.beginPath();ctx.moveTo(lerp(p.x2,p.x1,u0),lerp(p.y2,p.y1,u0));ctx.lineTo(lerp(p.x2,p.x1,u1),lerp(p.y2,p.y1,u1));ctx.stroke();}
        if(!p.thumb){ctx.lineWidth=S*.04;ctx.beginPath();ctx.moveTo(p.x2,p.y2+S*.03);ctx.lineTo(lerp(p.x2,0,.55),0.9*S);ctx.stroke();}});
      ctx.fillStyle='#e8f3ff';for(let k=0;k<6;k++){ctx.beginPath();ctx.arc((-0.15+k*0.06)*S,0.93*S,S*.03,0,PI*2);ctx.fill();}ctx.restore();}
    ctx.restore();return;}
  // detached: empty sleeve stays, hand does its own thing
  ctx.save();ctx.translate(W/2,H*0.5);ctx.rotate(PI);const sl=item(look.sleeve)||item('sl_blue');drawSleeve(ctx,S,sl,0.5*S,H*1.2);
  ctx.fillStyle='#2a1520';ctx.beginPath();ctx.ellipse(0,0.97*S,0.24*S,0.06*S,0,0,PI*2);ctx.fill();ctx.restore();
  if(v.gone)return;
  ctx.save();ctx.translate(vx,vy+v.dy);ctx.rotate(PI+v.spin);ctx.scale(v.sc,v.sc);ctx.translate(0,-0.58*S);opt.noSleeve=true;drawHandShape(ctx,S,opt);ctx.restore();}
function cinHero(e){const c=G.cin,S2=c.S*1.05,pl=P[c.w];if(c.id==='giant')return;
  ctx.save();ctx.translate(c.hx,c.hy);
  if(c.id==='bolt'&&e>300){ctx.save();ctx.globalCompositeOperation='lighter';const r=S2*(0.75+0.06*Math.sin(e/40));const g=ctx.createRadialGradient(0,0.3*S2,0,0,0.3*S2,r);g.addColorStop(0,'rgba(140,190,255,.55)');g.addColorStop(1,'rgba(80,120,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0.3*S2,r,0,PI*2);ctx.fill();ctx.restore();}
  if(c.id==='ice'&&e<1700){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(0,0.4*S2,0,0,0.4*S2,S2*.7);g.addColorStop(0,'rgba(170,230,255,.4)');g.addColorStop(1,'rgba(170,230,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0.4*S2,S2*.7,0,PI*2);ctx.fill();ctx.restore();}
  const won=c.titled;drawHandShape(ctx,S2,{palmUp:!won,look:pl.look,sleeveLen:H,onTop:true,t:G.t,pose:won?'victory':null});ctx.restore();}
function cinGiant(e){const c=G.cin;if(c.id!=='giant'||!(c.ga>0))return;const S=c.S,[vx,vy]=cinV(),sc=c.gsc;
  ctx.save();ctx.globalAlpha=c.ga;ctx.translate(vx,vy+S*.1);ctx.scale(sc,sc);ctx.translate(0,-0.6*S);drawHandShape(ctx,S,{palmUp:false,look:P[c.w].look,sleeveLen:H,onTop:true,t:G.t,lift:Math.min(1,(sc-1)/3)});ctx.restore();}
function drawCinema(){const c=G.cin,e=G.t-c.t0,S=c.S,[vx,vy]=cinV();
  if(c.vid&&c.vid.readyState>=2&&(c.vid.currentTime>0||c.vid.ended)){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.save();if(viewFrame(c.w)===1){ctx.translate(W,H);ctx.rotate(PI);}
    const vw=c.vid.videoWidth||720,vh=c.vid.videoHeight||1280,k=Math.max(W/vw,H/vh);ctx.drawImage(c.vid,(W-vw*k)/2,(H-vh*k)/2,vw*k,vh*k);ctx.restore();
    if(c.titled){const u=seg(e,CIN_TITLE[c.id],CIN_TITLE[c.id]+500);const rg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.7);rg.addColorStop(0,'rgba(60,0,8,0)');rg.addColorStop(1,`rgba(70,0,10,${.45*u})`);ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);}return;}
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.save();
  if(viewFrame(c.w)===1){ctx.translate(W,H);ctx.rotate(PI);}
  const cam=cinCam(e);ctx.translate(W/2,H/2);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);
  ctx.translate(rand(-c.sh,c.sh),rand(-c.sh,c.sh));
  if(window.CIN_HQ)layerDraw(()=>cinBG(c.id,e),'blur(2.2px) saturate(1.15)');else cinBG(c.id,e);
  if(c.id==='ice'&&!c.shards&&!c.v.detached)iceBlock(ctx,0);
  {const L2={bolt:['190,215,255',.35],fire:['255,150,60',.4],ice:['190,240,255',.35],tornado:['220,240,220',.2],giant:['220,180,255',.25]}[c.id];const lx=c.ball?c.ball.x:(c.id==='bolt'?vx:W*.3),ly=c.ball?c.ball.y:(c.id==='bolt'?-40:H*.2);litDraw(()=>cinVictim(e),lx,ly,L2[0],L2[1]+c.flash*.4);}
  if(c.id==='ice'&&c.v.block>0&&!c.shards)iceBlock(ctx,c.v.block);
  if(c.shards){const sh=c.shards;sh.list.forEach(s=>{ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.r);ctx.translate(-s.cx,-s.cy);const p=new Path2D();p.moveTo(...s.tri[0]);p.lineTo(...s.tri[1]);p.lineTo(...s.tri[2]);p.closePath();ctx.save();ctx.clip(p);ctx.drawImage(sh.off,0,0,W,H);ctx.restore();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.2;ctx.stroke(p);ctx.restore();});}
  if(c.v.burn&&c.id==='fire'){const fl=1-seg(e,2500,3400);if(fl>0){ctx.save();ctx.globalCompositeOperation='lighter';const gl=ctx.createRadialGradient(vx,vy,0,vx,vy,S*.95);gl.addColorStop(0,`rgba(255,140,30,${.5*fl})`);gl.addColorStop(1,'rgba(255,60,0,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(vx,vy,S*.95,0,PI*2);ctx.fill();ctx.restore();}
    if(e>2400){ctx.save();ctx.translate(W/2,H*0.5);ctx.rotate(PI);ctx.strokeStyle=`rgba(255,${120+Math.round(60*Math.sin(e/150))},30,${.7*seg(e,2400,2800)})`;ctx.lineWidth=2;ctx.shadowColor='#ff6a1f';ctx.shadowBlur=8;const r=seeded(17);
      for(let k=0;k<7;k++){let x=(r()-.5)*.4*S,y=(.35+r()*.5)*S;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<4;j++){x+=(r()-.5)*.12*S;y+=(r()-.3)*.1*S;ctx.lineTo(x,y);}ctx.stroke();}ctx.restore();}}
  if(c.id==='giant'&&c.v.flat&&e>1150){for(let i=0;i<4;i++){const an=G.t/260+i*PI/2,x=vx+Math.cos(an)*S*.55,y=vy+Math.sin(an)*S*.18-S*.1;ctx.save();ctx.translate(x,y);ctx.rotate(G.t/200+i);ctx.fillStyle='#ffd23f';ctx.strokeStyle=OUT;ctx.lineWidth=2;starPath(ctx,S*.06);ctx.fill();ctx.stroke();ctx.restore();}}
  if(c.ball){const b=c.ball;ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*1.7);g.addColorStop(0,'rgba(255,255,230,1)');g.addColorStop(.3,'rgba(255,200,60,.95)');g.addColorStop(.65,'rgba(255,90,10,.6)');g.addColorStop(1,'rgba(255,40,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.7,0,PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,230,150,.6)';ctx.lineWidth=2;for(let k=0;k<3;k++){const a0=e/90+k*2.1;ctx.beginPath();ctx.arc(b.x,b.y,b.r*(.75+k*.12),a0,a0+PI*.9);ctx.stroke();}ctx.restore();}
  {const hl={bolt:'150,190,255',fire:'255,170,80',ice:'170,230,255',tornado:'210,235,210',giant:'230,200,255'}[c.id];litDraw(()=>cinHero(e),c.hx,c.hy-0.2*c.S,hl,.32);}cinGiant(e);
  ctx.save();ctx.lineJoin='round';if(window.CIN_HQ)c.bolts.forEach(b=>{if(b.small||b.br)return;b.br=[];for(let k=0;k<4;k++){const i=1+((Math.random()*(b.pts.length-3))|0),p0=b.pts[i];b.br.push(zig(p0[0],p0[1],p0[0]+rand(-70,70),p0[1]+rand(20,90),5,14));}});
  if(window.CIN_HQ){ctx.save();ctx.filter='blur(7px)';ctx.globalCompositeOperation='lighter';c.bolts.forEach(b=>{const u=(G.t-b.t)/(b.small?140:260);if(u<0)return;ctx.globalAlpha=(1-u)*.9;ctx.strokeStyle='rgba(140,180,255,1)';ctx.lineWidth=b.small?6:16;ctx.beginPath();b.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});ctx.restore();
    c.bolts.forEach(b=>{if(!b.br)return;const u=(G.t-b.t)/260;if(u<0)return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-u)*.8;ctx.strokeStyle='#dfe9ff';ctx.lineWidth=1.6;b.br.forEach(br=>{ctx.beginPath();br.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});ctx.restore();});}
  c.bolts.forEach(b=>{const u=(G.t-b.t)/(b.small?140:260);if(u<0)return;ctx.globalCompositeOperation='lighter';
    (b.small?[[5,'rgba(120,170,255,.35)'],[1.5,'#ffffff']]:[[18,'rgba(110,150,255,.28)'],[7,'rgba(190,215,255,.75)'],[3,'#ffffff']]).forEach(([w,col])=>{ctx.strokeStyle=col;ctx.lineWidth=w*(1-u*.5);ctx.globalAlpha=1-u;ctx.beginPath();b.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});});ctx.restore();
  const now=G.t;cinParts.forEach(q=>{if(now<q.t)return;const u=(now-q.t)/q.life;ctx.save();if(q.add)ctx.globalCompositeOperation='lighter';ctx.globalAlpha=q.shape==='shard'?Math.min(1,(1-u)*3):1-u;ctx.translate(q.x,q.y);ctx.rotate(q.rot);ctx.fillStyle=q.col;
    if(q.shape==='fire'){if(window.CIN_HQ){const tx=fxTex('fire',q.col),sz=q.sz*(2.6-u*1.4);ctx.rotate(q.t*.01);ctx.drawImage(tx,-sz,-sz,sz*2,sz*2);}else{ctx.beginPath();ctx.arc(0,0,q.sz*(1-u*.6),0,PI*2);ctx.fill();}}
    else if(q.shape==='smoke'&&window.CIN_HQ){ctx.globalAlpha=(1-u)*.75;const tx=fxTex('smoke',q.col),sz=q.sz*(1.4+u*2.2);ctx.rotate(q.t*.013+u);ctx.drawImage(tx,-sz,-sz,sz*2,sz*2);}
    else if(q.shape==='smoke'){ctx.globalAlpha=(1-u)*.85;ctx.beginPath();ctx.arc(0,0,q.sz*(1+u*1.8),0,PI*2);ctx.fill();}
    else if(q.shape==='shard'){ctx.beginPath();ctx.moveTo(0,-q.sz);ctx.lineTo(q.sz*.6,q.sz*.5);ctx.lineTo(-q.sz*.5,q.sz*.3);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.stroke();}
    else if(q.shape==='star'){starPath(ctx,q.sz);ctx.fill();}
    else if(q.shape==='leaf'){ctx.fillRect(-q.sz,-q.sz*.4,q.sz*2,q.sz*.8);}
    else if(q.shape==='ring'){const r=q.max*eo(u);ctx.rotate(-q.rot);ctx.strokeStyle=q.col;ctx.lineWidth=q.sz*(1-u)+1;ctx.beginPath();ctx.ellipse(0,0,r,r*.62,0,0,PI*2);ctx.stroke();}
    else if(q.shape==='twinkle'){const s=q.sz*(u<.3?u/.3:1)*(1+.2*Math.sin(now/60));ctx.globalCompositeOperation='lighter';ctx.rotate(now/400);starPath(ctx,s,.25,4);ctx.fill();}
    else if(q.shape==='word'){const s=u<.15?lerp(2.2,1,eo(u/.15)):1;ctx.rotate(-.12);ctx.scale(s,s);outlinedText(ctx,q.txt,0,0,q.sz,'#ffd23f');}
    else{if(window.CIN_HQ&&q.add&&(q.vx||q.vy)){ctx.rotate(-q.rot);ctx.strokeStyle=q.col;ctx.lineCap='round';ctx.lineWidth=q.sz*.9;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-q.vx*3.5,-q.vy*3.5);ctx.stroke();}else{ctx.beginPath();ctx.arc(0,0,q.sz,0,PI*2);ctx.fill();}}ctx.restore();});
  ctx.restore();
  if(c.flash>0){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle=`rgba(${c.flashCol},${c.flash*(window.CIN_HQ?.45:.75)})`;ctx.fillRect(0,0,W,H);}
  if(c.titled){ctx.setTransform(DPR,0,0,DPR,0,0);const u=seg(G.t-c.t0,CIN_TITLE[c.id],CIN_TITLE[c.id]+500);const rg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.7);rg.addColorStop(0,'rgba(60,0,8,0)');rg.addColorStop(1,`rgba(70,0,10,${.55*u})`);ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);}
}

// wooden table texture (cached)
let _tbl=null;
function cinTable(){const key=W+'x'+H;if(_tbl&&_tbl.key===key)return _tbl.cv;const d=Math.min(2,DPR||1),cv=document.createElement('canvas');cv.width=Math.round((W+120)*d);cv.height=Math.round((H+120)*d);const c=cv.getContext('2d');c.scale(d,d);
  const w=W+120,h=H+120,n=5,pw=w/n,r=seeded(7);
  for(let i=0;i<n;i++){const x=i*pw,b=[150+r()*30,95+r()*20,60+r()*15];const g=c.createLinearGradient(x,0,x+pw,0);g.addColorStop(0,`rgb(${b[0]-18},${b[1]-14},${b[2]-10})`);g.addColorStop(.5,`rgb(${b[0]},${b[1]},${b[2]})`);g.addColorStop(1,`rgb(${b[0]-22},${b[1]-16},${b[2]-12})`);c.fillStyle=g;c.fillRect(x,0,pw,h);
    for(let k=0;k<26;k++){const gx=x+r()*pw,amp=4+r()*10,ph=r()*6;c.strokeStyle=`rgba(${r()<.5?60:200},${r()<.5?35:140},20,${.08+r()*.12})`;c.lineWidth=.6+r()*1.6;c.beginPath();for(let y=0;y<=h;y+=12){const xx=gx+Math.sin(y/90+ph)*amp+Math.sin(y/23+ph*2)*1.5;y?c.lineTo(xx,y):c.moveTo(xx,y);}c.stroke();}
    if(r()<.8){const kx=x+pw*(.2+r()*.6),ky=r()*h,kr=6+r()*10;const kg=c.createRadialGradient(kx,ky,0,kx,ky,kr*2.4);kg.addColorStop(0,'rgba(60,30,10,.55)');kg.addColorStop(1,'rgba(60,30,10,0)');c.fillStyle=kg;c.beginPath();c.ellipse(kx,ky,kr,kr*2.4,0,0,PI*2);c.fill();}
    c.fillStyle='rgba(20,8,0,.6)';c.fillRect(x-1.5,0,3,h);c.fillStyle='rgba(255,220,180,.12)';c.fillRect(x+1.5,0,1.5,h);}
  _tbl={key,cv};return cv;}
// cinematic camera: shots with cuts; each shot eases toward its target framing
const CIN_SHOTS={bolt:[[0,'H',1.85,1.55],[820,'M',1.0,1.08],[1700,'V',1.6,1.8],[2300,'V',1.2,1.3]],fire:[[0,'H',1.8,1.5],[1180,'M',1.0,1.02],[1460,'V',1.75,1.95],[2250,'V',1.2,1.3]],
  ice:[[0,'V',1.65,1.85],[900,'M',1.0,1.06],[1690,'V',1.35,1.05],[2350,'M',1.05,1.12]],tornado:[[0,'V',1.55,1.25],[700,'M',1.0,1.06],[1600,'V',1.35,1.55],[2380,'M',1.0,1.04]],giant:[[0,'M',1.0,1.12],[960,'V',1.65,1.4],[1220,'V',1.25,1.15],[1800,'M',1.05,1.12]]};
function cinCam(e){const c=G.cin,sh=CIN_SHOTS[c.id];let i=0;while(i<sh.length-1&&e>=sh[i+1][0])i++;const [t0,tg,z0,z1]=sh[i],t1=i<sh.length-1?sh[i+1][0]:t0+2600;const u=eio(seg(e,t0,t1));
  const [vx,vy]=cinV(),hx=c.hx,hy=c.hy+0.5*c.S*1.05;let x,y;if(tg==='H'){x=hx;y=Math.min(hy,H*0.86);}else if(tg==='V'){x=vx;y=vy;}else{x=W/2;y=(vy+Math.min(hy,H*0.9))/2;}
  return{x,y,z:lerp(z0,z1,u)};}
// draw something into an offscreen layer, then light it (colored key light + soft falloff), then composite
let _lit=null;
function litDraw(fn,lx,ly,col,str){if(!_lit||_lit.width!==Math.round(W*DPR)||_lit.height!==Math.round(H*DPR)){_lit=document.createElement('canvas');_lit.width=Math.round(W*DPR);_lit.height=Math.round(H*DPR);}
  const o=_lit.getContext('2d');o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,_lit.width,_lit.height);o.setTransform(ctx.getTransform());const keep=ctx;ctx=o;try{fn();}finally{ctx=keep;}
  o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='source-atop';const p=ctx.getTransform().transformPoint(new DOMPoint(lx,ly)),R=Math.max(_lit.width,_lit.height)*.6;
  const g=o.createRadialGradient(p.x,p.y,0,p.x,p.y,R);g.addColorStop(0,`rgba(${col},${str})`);g.addColorStop(.45,`rgba(${col},${str*.35})`);g.addColorStop(1,'rgba(10,0,30,.32)');o.fillStyle=g;o.fillRect(0,0,_lit.width,_lit.height);o.globalCompositeOperation='source-over';
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(_lit,0,0);ctx.restore();}

// pre-rendered fatality videos (rendered offline with motion blur + bloom); live renderer above is the fallback
const FV={};
function fvPreload(v){FINISHERS.forEach(f=>{const k=f.id+'_'+v;if(FV[k])return;try{const el=document.createElement('video');el.muted=true;el.playsInline=true;el.setAttribute('playsinline','');el.setAttribute('muted','');el.preload='auto';el.src='fv/'+k+'.mp4';el.load();FV[k]=el;}catch(e){}});}

// ----- HQ (offline video) helpers -----
let _lay=null;
function layerDraw(fn,filter){if(!_lay||_lay.width!==Math.round(W*DPR)||_lay.height!==Math.round(H*DPR)){_lay=document.createElement('canvas');_lay.width=Math.round(W*DPR);_lay.height=Math.round(H*DPR);}
  const o=_lay.getContext('2d');o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,_lay.width,_lay.height);o.setTransform(ctx.getTransform());const keep=ctx;ctx=o;try{fn();}finally{ctx=keep;}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.filter=filter;ctx.drawImage(_lay,0,0);ctx.filter='none';ctx.restore();}
const _tex={};
function fxTex(kind,col){const key=kind+col;if(_tex[key])return _tex[key];const N=128,cv=document.createElement('canvas');cv.width=N;cv.height=N;const c=cv.getContext('2d'),r=seeded(kind.length*31+(col||'').length);
  // noisy soft puff: many overlapping soft blobs -> organic texture
  const base=kind==='fire'?col:(col&&col.startsWith('rgba')?col:'rgba(70,70,80,.6)');
  for(let i=0;i<34;i++){const a=r()*PI*2,d=r()*N*.22,x=N/2+Math.cos(a)*d,y=N/2+Math.sin(a)*d,rr=N*(.12+r()*.2);const g=c.createRadialGradient(x,y,0,x,y,rr);
    if(kind==='fire'){g.addColorStop(0,'rgba(255,250,220,.5)');g.addColorStop(.35,base);g.addColorStop(1,'rgba(0,0,0,0)');}else{g.addColorStop(0,base);g.addColorStop(1,'rgba(0,0,0,0)');}
    c.globalAlpha=kind==='fire'?.32:.28;c.fillStyle=g;c.fillRect(0,0,N,N);}
  const m=c.createRadialGradient(N/2,N/2,N*.18,N/2,N/2,N/2);m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=1;c.globalCompositeOperation='destination-in';c.fillStyle=m;c.fillRect(0,0,N,N);
  return _tex[key]=cv;}
// slow-motion schedule (shared by renderer and in-game video sync)
const CIN_SLOW={bolt:[900,1300,1650],fire:[1460],ice:[1700],tornado:[700],giant:[1000]};
function cinRate(id,e){let r=1;(CIN_SLOW[id]||[]).forEach(t0=>{if(e>=t0-60&&e<t0+420)r=Math.min(r,e<t0?.5:lerp(.28,1,eo((e-t0)/420)));});return r;}
// video time (ms) -> cinema time e, by integrating the same rate the renderer used
const _vmap={};
function vidToE(id,vms){let m=_vmap[id];if(!m){m=[0];let e=0;for(let i=0;i<2000;i++){e+=1000/30*cinRate(id,e);m.push(e);}_vmap[id]=m;}const f=vms/(1000/30),i=Math.floor(f);if(i>=m.length-1)return m[m.length-1];return lerp(m[i],m[i+1],f-i);}
