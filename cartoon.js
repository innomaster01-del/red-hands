// ===== polished cartoon hand renderer (v3 style, sharper) =====
const CG={};
function cartoonGeo(L,pose){const key=Math.round(L*10)+'|'+(pose||'');if(CG[key])return CG[key];
  const fw=0.13*L,xs=[-0.2,-0.067,0.067,0.2],tips=[0.07,0,0.035,0.13];
  let segs;
  if(pose==='victory')segs=[{x1:-0.27,y1:0.02,x2:-0.17,y2:0.52,w:0.13},{x1:0.03,y1:-0.02,x2:-0.05,y2:0.52,w:0.13},{x1:0.08,y1:0.36,x2:0.08,y2:0.52,w:0.13},{x1:0.2,y1:0.4,x2:0.2,y2:0.52,w:0.13},{x1:-0.25,y1:0.74,x2:-0.06,y2:0.6,w:0.15,thumb:1}];
  else{segs=xs.map((x,i)=>({x1:x,y1:tips[i]+0.065,x2:x*1.02,y2:0.52,w:0.13}));segs.push({x1:-0.27,y1:0.74,x2:-0.43,y2:0.44,w:0.15,thumb:1});}
  const parts=segs.map(sg=>{const x1=sg.x1*L,y1=sg.y1*L,x2=sg.x2*L,y2=sg.y2*L,w=sg.w*L;return{path:taper(x2,y2,x1,y1,w,w),x1,y1,x2,y2,w,thumb:!!sg.thumb};});
  const palm=rrPath(-0.295*L,0.36*L,0.59*L,0.62*L,0.17*L);
  const sil=new Path2D();parts.forEach(p=>sil.addPath(p.path));sil.addPath(palm);
  return CG[key]={parts,palm,sil,xs,tips,fw};}
let celCv=null;
function imprintGeo(sL,seed){const r=seeded(seed);const fingers=[];const ang=[-0.2,-0.07,0.07,0.2],len=[0.44,0.5,0.47,0.37];
  // palm centre at (0,0.62sL); fingers fan out toward -y
  ang.forEach((a,i)=>{const a2=a+(r()-.5)*0.06,bx=(-0.15+i*0.1)*sL,by=0.4*sL,l=len[i]*sL*(0.95+r()*0.1);const tx=bx+Math.sin(a2)*l,ty=by-Math.cos(a2)*l;
    fingers.push({path:taper(bx,by,tx,ty,0.125*sL,0.105*sL),bx,by,tx,ty,w:0.115*sL});});
  const ta=-1.0,tbx=-0.19*sL,tby=0.66*sL,tl=0.3*sL;fingers.push({path:taper(tbx,tby,tbx+Math.sin(ta)*tl,tby-Math.cos(ta)*tl,0.1*sL,0.08*sL),thumb:1});
  const palm=new Path2D(),Q=(x,y)=>[x*sL,y*sL];palm.moveTo(...Q(-0.19,0.42));palm.quadraticCurveTo(...Q(0,0.34),...Q(0.19,0.42));palm.bezierCurveTo(...Q(0.23,0.56),...Q(0.21,0.74),...Q(0.12,0.84));palm.quadraticCurveTo(...Q(0,0.89),...Q(-0.12,0.84));palm.bezierCurveTo(...Q(-0.22,0.74),...Q(-0.23,0.56),...Q(-0.19,0.42));palm.closePath();
  return{fingers,palm};}
function imprintShape(x,s,seed){const ig=imprintGeo(s,seed);ig.fingers.forEach(f=>x.fill(f.path));x.fill(ig.palm);return ig;}
function softLayer(px,sL,mi,col,drawExtra){const sc=px/(1.3*sL);const a=document.createElement('canvas');a.width=px;a.height=px;const x=a.getContext('2d');
  x.setTransform(sc,0,0,sc,0.65*sL*sc,0.18*sL*sc);x.fillStyle=col(1);imprintShape(x,sL,11+mi*7);if(drawExtra)drawExtra(x);return a;}
function imprint(m,sL,b,mi,col,lite){const key=Math.round(sL)+'|'+b.toFixed(2);if(m._k===key&&m._cv)return m._cv;
  // realistic slap flush: a soft, blurred hand-shaped redness (no outlines/stripes), mottled like real skin
  const dp=Math.min(3,Math.max(2,window.devicePixelRatio||1)),N=Math.ceil(1.3*sL*dp),sc=N/(1.3*sL);
  const cv=m._cv||document.createElement('canvas');cv.width=N;cv.height=N;const y=cv.getContext('2d');y.clearRect(0,0,N,N);
  const ig=imprintGeo(sL,11+mi*7),fing=ig.fingers.filter(f=>!f.thumb);
  const mk=(blur)=>{const a=document.createElement('canvas');a.width=N;a.height=N;const x=a.getContext('2d');const OFF=N*3;x.setTransform(sc,0,0,sc,0.65*sL*sc-OFF,0.18*sL*sc);x.shadowOffsetX=OFF;x.shadowBlur=blur;return[a,x];};
  // 1) wide diffuse flush around the whole print
  const [mA,xa]=mk(0.13*sL*sc);xa.shadowColor=col(1);xa.fillStyle=col(1);xa.globalAlpha=.55;xa.fill(ig.palm);fing.forEach(f=>xa.fill(f.path));
  y.globalAlpha=.75;y.drawImage(mA,0,0);
  // 2) the print itself, soft-edged, fingers a bit stronger than palm
  const [mB,xb]=mk(0.045*sL*sc);xb.shadowColor=col(1);xb.fillStyle=col(1);xb.globalAlpha=.4;xb.fill(ig.palm);xb.globalAlpha=.85;fing.forEach(f=>xb.fill(f.path));
  y.globalAlpha=.55;y.drawImage(mB,0,0);
  // 3) mottled skin: lighter and darker soft blotches inside the flush
  const r=seeded(51+mi*13);y.globalAlpha=1;
  y.globalCompositeOperation='destination-out';
  for(let k=0;k<40;k++){const bx=r()*N,by=r()*N,br=N*(0.015+r()*0.04);const g=y.createRadialGradient(bx,by,0,bx,by,br);g.addColorStop(0,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');y.fillStyle=g;y.fillRect(bx-br,by-br,br*2,br*2);}
  y.globalCompositeOperation='source-atop';
  for(let k=0;k<26;k++){const bx=r()*N,by=r()*N,br=N*(0.01+r()*0.03);const g=y.createRadialGradient(bx,by,0,bx,by,br);g.addColorStop(0,col(.35));g.addColorStop(1,col(0));y.fillStyle=g;y.fillRect(bx-br,by-br,br*2,br*2);}
  // 4) faint capillary speckle along where the fingers hit hardest
  for(let k=0;k<40;k++){const f=fing[(r()*fing.length)|0],u=.15+r()*.75;const px=lerp(f.bx,f.tx,u)+(r()-.5)*f.w,py=lerp(f.by,f.ty,u)+(r()-.5)*f.w*.6;
    y.fillStyle=col(.18+r()*.2);y.beginPath();y.arc((px+0.65*sL)*sc,(py+0.18*sL)*sc,(0.003+r()*0.003)*sL*sc,0,PI*2);y.fill();}
  y.globalCompositeOperation='source-over';y.globalAlpha=1;
  // blanch layer: the instant after impact the skin goes pale where the fingers pressed (white, same soft shape)
  const wc=document.createElement('canvas');wc.width=N;wc.height=N;const w=wc.getContext('2d');w.drawImage(mB,0,0);w.globalCompositeOperation='source-in';w.fillStyle='rgb(95,45,165)';w.fillRect(0,0,N,N);m._wcv=wc;
  // swelling sheen: soft glossy light on the raised part (light comes from the top-left on screen; mark is drawn rotated 180°)
  const hc=document.createElement('canvas');hc.width=N;hc.height=N;const h=hc.getContext('2d');h.drawImage(mB,0,0);h.globalCompositeOperation='source-in';
  const hg=h.createLinearGradient(N*.85,N*.75,N*.35,N*.25);hg.addColorStop(0,'rgba(255,255,255,.9)');hg.addColorStop(.45,'rgba(255,255,255,.25)');hg.addColorStop(.75,'rgba(255,255,255,0)');h.fillStyle=hg;h.fillRect(0,0,N,N);m._scv=hc;
  m._k=key;m._cv=cv;return cv;}
function celShade(c,g,L,col,dx,dy){const d=Math.min(2,window.devicePixelRatio||1),bx=-0.62*L,by=-0.12*L,bw=1.2*L,bh=1.22*L;
  const w=Math.ceil(bw*d),h=Math.ceil(bh*d);if(!celCv){celCv=document.createElement('canvas');}if(celCv.width<w||celCv.height<h){celCv.width=Math.max(w,celCv.width);celCv.height=Math.max(h,celCv.height);}
  const o=celCv.getContext('2d');o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,celCv.width,celCv.height);o.setTransform(d,0,0,d,-bx*d,-by*d);
  o.globalCompositeOperation='source-over';fillAll(o,g,col);o.globalCompositeOperation='destination-out';o.translate(dx*L,dy*L);fillAll(o,g,'#000');o.globalCompositeOperation='source-over';
  c.drawImage(celCv,0,0,w,h,bx,by,w/d,h/d);}
function fillAll(c,g,style){c.fillStyle=style;g.parts.forEach(p=>c.fill(p.path));c.fill(g.palm);}
function strokeAll(c,g,style,w){c.strokeStyle=style;c.lineWidth=w;c.lineJoin='round';g.parts.forEach(p=>c.stroke(p.path));c.stroke(g.palm);}

function drawSleeve(c,L,sl,sw,len){
  const y0=0.95*L;
  c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-sw/2+0.05*L,y0+0.05*L,sw,len);
  const sg=c.createLinearGradient(-sw/2,0,sw/2,0);
  if(sl.pat==='gold'){sg.addColorStop(0,sl.dark);sg.addColorStop(.25,sl.main);sg.addColorStop(.45,sl.light);sg.addColorStop(.6,sl.main);sg.addColorStop(1,sl.dark);}
  else{sg.addColorStop(0,sl.dark);sg.addColorStop(.3,sl.main);sg.addColorStop(.42,shade(sl.main,0.18));sg.addColorStop(.7,sl.main);sg.addColorStop(1,sl.dark);}
  c.save();c.beginPath();c.rect(-sw/2,y0,sw,len);c.fillStyle=sg;c.fill();c.clip();
  const r=seeded(7);
  if(sl.pat==='bands'){c.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<8;i++)c.fillRect(-sw/2,1.25*L+i*0.32*L,sw,0.06*L);}
  else if(sl.pat==='diag'){c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=0.06*L;for(let i=-4;i<14;i++){c.beginPath();c.moveTo(-sw,y0+i*0.2*L);c.lineTo(sw,y0+i*0.2*L+sw*1.2);c.stroke();}}
  else if(sl.pat==='camo'){for(let i=0;i<26;i++){c.fillStyle=[sl.dark,sl.light,'#4e3a1e'][i%3];c.globalAlpha=.75;c.beginPath();c.ellipse((r()-.5)*sw*1.2,y0+r()*Math.min(len,4*L),0.07*L+r()*0.07*L,0.04*L+r()*0.05*L,r()*3,0,PI*2);c.fill();}c.globalAlpha=1;}
  else if(sl.pat==='flame'){[['#ff3b1f',.75],['#ff9f1c',.55],['#ffd23f',.35]].forEach(([col,h])=>{c.fillStyle=col;c.beginPath();c.moveTo(-sw/2,y0);
      for(let i=0;i<=5;i++){const x=-sw/2+i*sw/5;const tip=y0+L*h*(0.7+0.5*((i*37)%5)/5);c.quadraticCurveTo(x-sw/10,tip*0.5+y0*0.5,x,tip);c.quadraticCurveTo(x+sw/12,y0+(tip-y0)*0.4,x+sw/10,y0+(tip-y0)*0.25);}
      c.lineTo(sw/2,y0);c.closePath();c.fill();});}
  else if(sl.pat==='gold'){c.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<6;i++){c.beginPath();c.moveTo(-sw/2,y0+0.3*L+i*0.55*L);c.lineTo(sw/2,y0+0.1*L+i*0.55*L);c.lineTo(sw/2,y0+0.16*L+i*0.55*L);c.lineTo(-sw/2,y0+0.36*L+i*0.55*L);c.fill();}}
  else if(sl.pat==='galaxy'){[['rgba(255,80,200,.35)',-.1,1.5],['rgba(80,200,255,.3)',.12,2.4],['rgba(180,120,255,.35)',-.05,3.3]].forEach(([col,x,y])=>{const g=c.createRadialGradient(x*L,y*L,0,x*L,y*L,0.45*L);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(-sw/2,y0,sw,len);});
    c.fillStyle='#fff';for(let i=0;i<40;i++){const s=r()*0.018*L+0.004*L;c.globalAlpha=.5+r()*.5;c.beginPath();c.arc((r()-.5)*sw,y0+r()*Math.min(len,4.5*L),s,0,PI*2);c.fill();}c.globalAlpha=1;}
  // glossy highlight stripe
  c.fillStyle='rgba(255,255,255,.16)';c.fillRect(-sw*0.3,y0,sw*0.12,len);
  c.restore();
  c.strokeStyle=OUT;c.lineWidth=0.035*L;c.strokeRect(-sw/2,y0,sw,len);
}
function drawHandShape(c,L,o){
  const look=o.look,sl=item(look.sleeve)||item('sl_blue'),sk=item(look.skin)||item('sk_1');
  const sw=0.5*L,len=o.sleeveLen||L*3,fs=o.flipS==null?1:o.flipS,palmUp=!!o.palmUp,t=o.t||0,pose=o.pose||null,vic=pose==='victory';
  c.save();
  if(o.scale&&o.scale!==1){c.translate(0,0.6*L);c.scale(o.scale,o.scale);c.translate(0,-0.6*L);}
  if(o.shake){c.translate(0,1.2*L);c.rotate(o.shake);c.translate(0,-1.2*L);}
  if(!o.noSleeve){c.save();c.scale(fs,1);drawSleeve(c,L,sl,sw,len);c.restore();}
  c.save();const sq=o.squash||0,fl=o.flatten||0;c.translate(0,0.55*L);c.scale(fs*(1+0.1*sq+0.5*fl),1-0.08*sq-0.7*fl);c.translate(0,-0.55*L);if(palmUp)c.scale(-1,1);
  const g=cartoonGeo(L,pose);
  // drop shadow
  if(!o.ghost){c.save();const so=(o.onTop?0.09*L:0.045*L)*(1+(o.lift||0)*3);c.translate(so*.6*(palmUp?-1:1),so);c.globalAlpha=.22*(1-(o.lift||0)*.5);fillAll(c,g,'#120a36');strokeAll(c,g,'#120a36',0.06*L);c.restore();}
  // white sticker rim + thick outline
  if(!o.ghost)strokeAll(c,g,'rgba(255,255,255,.3)',0.11*L);
  strokeAll(c,g,OUT,0.065*L);
  // base fill
  const gr=c.createLinearGradient(-0.4*L,0,0.35*L,L);gr.addColorStop(0,sk.c[0]);gr.addColorStop(.55,sk.c[1]);gr.addColorStop(1,sk.c[2]);fillAll(c,g,gr);
  // cel shading: inner shadow (bottom-right) + rim light (top-left)
  c.save();c.clip(g.sil);
  if(!o.ghost){
    // volume: soft inner rim shade, key light from top-left, cool shade bottom-right, finger highlights
    const rim=c.createRadialGradient(0.02*L,0.6*L,0.25*L,0.02*L,0.6*L,0.62*L);rim.addColorStop(0,'rgba(120,40,40,0)');rim.addColorStop(1,sk.robot||sk.glove?'rgba(30,30,60,.16)':'rgba(130,45,40,.16)');c.fillStyle=rim;c.fillRect(-L,-L,2*L,2.5*L);
    const kl=c.createRadialGradient(-0.12*L,0.4*L,0,-0.12*L,0.4*L,0.6*L);kl.addColorStop(0,'rgba(255,250,240,.26)');kl.addColorStop(1,'rgba(255,250,240,0)');c.fillStyle=kl;c.fillRect(-L,-L,2*L,2.5*L);
    const bs=c.createLinearGradient(-0.1*L,0.45*L,0.35*L,1.0*L);bs.addColorStop(0,'rgba(60,20,50,0)');bs.addColorStop(1,'rgba(60,20,50,.16)');c.fillStyle=bs;c.fillRect(-L,-L,2*L,2.5*L);
    c.fillStyle='rgba(255,255,255,.2)';g.parts.forEach(pt=>{if(pt.thumb)return;const mx=(pt.x1+pt.x2)/2-0.028*L,my=pt.y1+(pt.y2-pt.y1)*0.38,ang=Math.atan2(pt.y2-pt.y1,pt.x2-pt.x1)-PI/2;c.beginPath();c.ellipse(mx,my,0.014*L,Math.abs(pt.y2-pt.y1)*0.3,ang,0,PI*2);c.fill();});}
  const red=o.red||0,bz=clamp(((o.bruise||0)-2)/2,0,1);if(red>0.01){const rc=`${Math.round(255-60*bz)},${Math.round(60-40*(o.flash||0))},${Math.round(70+50*bz)}`;const rg2=c.createRadialGradient(0,0.5*L,0.05*L,0,0.5*L,0.8*L);rg2.addColorStop(0,`rgba(${rc},${Math.min(.7,red*.9)})`);rg2.addColorStop(1,`rgba(${rc},${red*.2})`);c.fillStyle=rg2;c.fillRect(-L,-L,2*L,2.5*L);}
  const fx=o.fx||{};if(fx.char){c.fillStyle=`rgba(50,35,35,${fx.char*.75})`;c.fillRect(-L,-L,2*L,2.5*L);}
  // persistent slap marks (back of hand)
  if(!palmUp&&o.marks&&o.marks.length){o.marks.filter(m=>m.kind==='tip').forEach(m=>{g.xs.forEach((fx,i)=>{const d=Math.abs(fx*L-m.x);if(d>0.16*L)return;const a=0.65*(1-d/(0.22*L));
      const ty=(g.tips[i]+0.1)*L,tg=c.createRadialGradient(fx*L,ty,0.01*L,fx*L,ty,0.075*L);tg.addColorStop(0,`rgba(255,140,150,${a*.5})`);tg.addColorStop(.6,`rgba(220,30,60,${a*.55})`);tg.addColorStop(1,'rgba(220,30,60,0)');c.fillStyle=tg;c.beginPath();c.ellipse(fx*L,ty,0.06*L,0.09*L,0,0,PI*2);c.fill();});});}
  if(!palmUp&&o.marks&&o.marks.some(m=>m.kind!=='tip')){
    const pm=o.marks.filter(m=>m.kind!=='tip'),nM=pm.length,b=clamp((nM-2)/2,0,1);const col=a=>`rgba(${Math.round(lerp(230,185,b))},${Math.round(lerp(30,8,b))},${Math.round(lerp(50,32,b))},${a})`;const lite=a=>`rgba(${Math.round(lerp(245,215,b))},${Math.round(lerp(105,45,b))},${Math.round(lerp(115,60,b))},${a})`;
    o.marks.filter(m=>m.kind!=='tip').forEach((m,mi)=>{const sL=0.7*L*(m.s||1),im=imprint(m,sL,b,mi,col,lite);c.save();
      c.translate(m.x,(m.y||0.45*L)+0.32*L);c.rotate(PI+m.r);
      const age=(o.t||0)-(m.t||-1e9),dev=age<0?1:Math.min(1,age/2600),grow=1-Math.pow(1-dev,3);
      // develops: starts smaller & lighter, spreads and darkens over ~2.5s
      const gs=0.9+0.12*grow;c.translate(0,0.47*sL);c.scale(gs,gs);c.translate(0,-0.47*sL);
      const base=Math.min(1,(0.95/(1+0.4*(nM-1)))*(0.75+0.25*(mi+1)/nM))*(nM===1?0.6:1);
      c.globalCompositeOperation='multiply';c.globalAlpha=base*(0.45+0.55*grow);c.drawImage(im,-0.65*sL,-0.18*sL,1.3*sL,1.3*sL);
      c.globalCompositeOperation='source-over';
      const pu=nM>=5?Math.min(.63,(nM-1-mi)*0.16):0,pe=pu*pu*(3-2*pu);if(pe>0&&m._wcv){c.globalCompositeOperation='multiply';c.globalAlpha=pe*.95*base;c.drawImage(m._wcv,-0.65*sL,-0.18*sL,1.3*sL,1.3*sL);c.globalCompositeOperation='source-over';}
      if(m._scv){c.globalAlpha=(0.12+0.18*grow)*(1-pe*.6);c.drawImage(m._scv,-0.65*sL,-0.18*sL,1.3*sL,1.3*sL);}
      c.globalAlpha=1;c.restore();});
    if(nM>=5){const bg=c.createRadialGradient(0,0.4*L,0,0,0.4*L,0.4*L);bg.addColorStop(0,`rgba(130,50,140,${0.13})`);bg.addColorStop(1,'rgba(110,30,120,0)');c.fillStyle=bg;c.fillRect(-L,-0.2*L,2*L,1.4*L);}
  }
  c.restore();
  // finger separation hints where fingers meet palm
  c.strokeStyle='rgba(60,25,30,.35)';c.lineWidth=0.016*L;c.lineCap='round';
  const xs=g.xs,tips=g.tips;
  if(!palmUp){
    if(!sk.glove&&!vic){const nl=item(look.nails);
      xs.forEach((x,i)=>{const ny=tips[i]*L+0.025*L;const p=rrPath(x*L-0.042*L,ny,0.084*L,0.088*L,0.037*L);
        let col='#ffeee8';if(nl&&nl.col)col=nl.col==='rainbow'?['#ff4d6d','#ffd23f','#3ee08f','#3b7bff'][i]:nl.col;
        const ng=c.createLinearGradient(0,ny,0,ny+0.088*L);ng.addColorStop(0,shade(col,0.25));ng.addColorStop(1,shade(col,-0.12));c.fillStyle=ng;c.fill(p);c.lineWidth=0.012*L;c.strokeStyle='rgba(60,25,30,.45)';c.stroke(p);
        c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(x*L-0.016*L,ny+0.03*L,0.009*L,0.02*L,0,0,PI*2);c.fill();});
      c.save();c.translate(-0.43*L,0.44*L);c.rotate(-0.5);c.fillStyle='#ffeee8';c.fill(rrPath(-0.045*L,-0.02*L,0.09*L,0.09*L,0.04*L));c.restore();}
    c.lineWidth=0.016*L;c.strokeStyle='rgba(60,25,30,.32)';
    if(sk.robot&&!vic){c.strokeStyle='rgba(40,50,70,.5)';xs.forEach((x,i)=>{for(const k of[0.17,0.3]){c.beginPath();c.moveTo(x*L-0.05*L,(tips[i]+k)*L);c.lineTo(x*L+0.05*L,(tips[i]+k)*L);c.stroke();}});
      c.fillStyle='#7d8ea3';[[-0.2,0.48],[0.2,0.48],[-0.2,0.9],[0.2,0.9]].forEach(([x,y])=>{c.beginPath();c.arc(x*L,y*L,0.022*L,0,PI*2);c.fill();});
      c.fillStyle='#3bc3ff';c.globalAlpha=.6+.4*Math.sin(t/200);c.beginPath();c.arc(0,0.68*L,0.06*L,0,PI*2);c.fill();c.globalAlpha=1;}
    else if(sk.glove){c.strokeStyle='rgba(30,20,60,.35)';[-0.1,0,0.1].forEach(x=>{c.beginPath();c.moveTo(x*L,0.55*L);c.lineTo(x*L,0.8*L);c.stroke();});}
    else{
      if(!vic){c.strokeStyle='rgba(60,25,30,.18)';c.lineWidth=0.012*L;xs.forEach((x,i)=>{c.beginPath();c.moveTo(x*L-0.025*L,(tips[i]+0.22)*L);c.quadraticCurveTo(x*L,(tips[i]+0.235)*L,x*L+0.025*L,(tips[i]+0.22)*L);c.stroke();});}
      const tt=item(look.tattoo);if(tt&&tt.shape)drawTattoo(c,L,tt.shape);
      if(sk.zombie){c.strokeStyle='rgba(60,30,40,.6)';c.beginPath();c.moveTo(-0.2*L,0.86*L);c.lineTo(0.15*L,0.56*L);c.stroke();for(let i=0;i<5;i++){const u=i/4,x=lerp(-0.2,0.15,u)*L,y=lerp(0.86,0.56,u)*L;c.beginPath();c.moveTo(x-0.03*L,y-0.035*L);c.lineTo(x+0.03*L,y+0.035*L);c.stroke();}}
    }
  }else{
    if(sk.robot){c.strokeStyle='rgba(40,50,70,.45)';c.strokeRect(-0.2*L,0.5*L,0.4*L,0.35*L);c.fillStyle='rgba(59,195,255,.5)';c.beginPath();c.arc(0,0.68*L,0.07*L,0,PI*2);c.fill();}
    else if(!sk.glove){
      c.beginPath();c.moveTo(0.27*L,0.5*L);c.quadraticCurveTo(0.02*L,0.47*L,-0.16*L,0.56*L);c.stroke();
      c.beginPath();c.moveTo(0.27*L,0.6*L);c.quadraticCurveTo(0.05*L,0.58*L,-0.1*L,0.66*L);c.stroke();
      c.beginPath();c.moveTo(-0.17*L,0.5*L);c.quadraticCurveTo(-0.12*L,0.75*L,-0.02*L,0.92*L);c.stroke();
      c.fillStyle='rgba(255,170,150,.28)';c.beginPath();c.ellipse(0,0.68*L,0.16*L,0.14*L,0,0,PI*2);c.fill();
    }
    if(!sk.robot&&!vic)xs.forEach((x,i)=>{for(const k of[0.17,0.3]){c.beginPath();c.moveTo(x*L-0.035*L,(tips[i]+k)*L);c.lineTo(x*L+0.035*L,(tips[i]+k)*L);c.stroke();}});
  }
  // ring
  const rg=item(look.ring);if(rg&&rg.col&&!vic){const x=xs[2]*L*1.01,y=0.3*L;const p=rrPath(x-0.075*L,y,0.15*L,0.045*L,0.02*L);const rgr=c.createLinearGradient(x-0.075*L,0,x+0.075*L,0);rgr.addColorStop(0,shade(rg.col,-0.3));rgr.addColorStop(.4,'#ffffff');rgr.addColorStop(1,rg.col);c.fillStyle=rgr;c.fill(p);c.lineWidth=0.012*L;c.strokeStyle=OUT;c.stroke(p);
    if(rg.gem&&!palmUp){c.fillStyle=rg.gem;c.save();c.translate(x,y+0.022*L);c.rotate(PI/4);c.fillRect(-0.03*L,-0.03*L,0.06*L,0.06*L);c.strokeRect(-0.03*L,-0.03*L,0.06*L,0.06*L);c.restore();
      c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(x-0.01*L,y+0.012*L,0.009*L,0,PI*2);c.fill();}}
  // glossy highlight
  c.fillStyle='rgba(255,255,255,.16)';c.beginPath();c.ellipse(-0.13*L,0.55*L,0.05*L,0.1*L,-0.3,0,PI*2);c.fill();
  const wt=item(look.watch);if(wt&&wt.band)drawWatch(c,L,wt,palmUp);
  if(fx.ice){c.save();c.clip(g.sil);c.fillStyle=`rgba(160,225,255,${fx.ice*.6})`;c.fillRect(-L,-L,2*L,2.5*L);c.strokeStyle=`rgba(255,255,255,${fx.ice*.85})`;c.lineWidth=0.012*L;const r=seeded(3);
    for(let i=0;i<10;i++){const x=(r()-.5)*0.6*L,y=r()*L,s=0.04*L;c.beginPath();for(let k=0;k<3;k++){const a=k*PI/3;c.moveTo(x-Math.cos(a)*s,y-Math.sin(a)*s);c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}c.stroke();}
    if(fx.crack){c.strokeStyle=`rgba(255,255,255,${fx.crack})`;c.lineWidth=0.015*L;c.beginPath();let x=-0.25*L,y=0.3*L;c.moveTo(x,y);for(let i=0;i<8;i++){x+=0.07*L;y+=(r()-.3)*0.15*L;c.lineTo(x,y);}c.stroke();}
    c.restore();}
  if((o.flash||0)>.55){c.globalAlpha=Math.min(1,(o.flash-.55)*1.8);fillAll(c,g,'#fff');c.globalAlpha=1;}
  c.restore();
  if(o.noSleeve){c.restore();return;}
  // cuff
  c.save();c.scale(fs,1);c.fillStyle='#fff';c.strokeStyle=OUT;c.lineWidth=0.035*L;
  const cuff=rrPath(-sw/2-0.03*L,0.9*L,sw+0.06*L,0.14*L,0.05*L);const cg=c.createLinearGradient(0,0.9*L,0,1.04*L);cg.addColorStop(0,'#ffffff');cg.addColorStop(1,'#d9d4ee');c.fillStyle=cg;c.fill(cuff);c.stroke(cuff);
  c.fillStyle=sl.light;c.fillRect(-sw/2-0.01*L,0.955*L,sw+0.02*L,0.03*L);c.restore();
  c.restore();
}
// cartoon "metal" text: bright fill, thick navy outline, highlight
const TXT={gold:['#fff7c2','#ffd23f'],steel:['#ffffff','#e6e2ff'],red:['#ffd0d6','#ff4d6d'],ice:['#ffffff','#9fe7ff'],green:['#d8ffe8','#3ee08f'],fire:['#fff0b0','#ff9f1c'],purple:['#f3e2ff','#c86bff']};
function metalText(c,s,x,y,size,style='gold',dir,glow){const pal=TXT[style]||TXT.gold;c.save();c.font=`900 ${size}px -apple-system,system-ui,sans-serif,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.direction=dir||(LANG==='he'?'rtl':'ltr');c.lineJoin='round';
  c.lineWidth=size*0.24;c.strokeStyle=OUT;c.strokeText(s,x,y+size*0.04);c.strokeText(s,x,y);
  const g=c.createLinearGradient(0,y-size*0.5,0,y+size*0.5);g.addColorStop(0,pal[0]);g.addColorStop(.55,pal[1]);g.addColorStop(1,pal[1]);c.fillStyle=g;c.fillText(s,x,y);c.restore();}
