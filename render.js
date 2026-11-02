// ===== drawing helpers (context-agnostic) =====
const PI=Math.PI;
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, rand=(a,b)=>a+Math.random()*(b-a);
function rrPath(x,y,w,h,r){const p=new Path2D();r=Math.max(0,Math.min(r,w/2,h/2));p.moveTo(x+r,y);p.arcTo(x+w,y,x+w,y+h,r);p.arcTo(x+w,y+h,x,y+h,r);p.arcTo(x,y+h,x,y,r);p.arcTo(x,y,x+w,y,r);p.closePath();return p;}
function seeded(s){return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;}}
const OUT='#22164f';
function heartPath(){return new Path2D('M0 6 C0 -2 -10 -4 -10 3 C-10 9 -3 13 0 17 C3 13 10 9 10 3 C10 -4 0 -2 0 6Z');}
const HEART=heartPath();
function starPath(c,r,inner=.45,n=5){c.beginPath();for(let i=0;i<n*2;i++){const rr=i%2?r*inner:r;const a=i*PI/n-PI/2;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();}

function drawTattoo(c,L,shape){
  c.save();c.translate(0,0.68*L);const s=0.11*L;c.fillStyle='rgba(28,40,96,.72)';c.strokeStyle='rgba(28,40,96,.72)';c.lineWidth=0.018*L;c.lineCap='round';
  if(shape==='heart'){c.scale(s/11,s/11);c.translate(0,-8);c.fill(HEART);}
  else if(shape==='star'){starPath(c,s);c.fill();}
  else if(shape==='bolt'){c.beginPath();c.moveTo(.2*s,-s);c.lineTo(-.55*s,.1*s);c.lineTo(-.05*s,.1*s);c.lineTo(-.25*s,s);c.lineTo(.55*s,-.15*s);c.lineTo(.05*s,-.15*s);c.closePath();c.fill();}
  else if(shape==='anchor'){c.beginPath();c.moveTo(0,-s);c.lineTo(0,s*.9);c.moveTo(-.45*s,-.45*s);c.lineTo(.45*s,-.45*s);c.stroke();c.beginPath();c.arc(0,.2*s,.7*s,.15*PI,.85*PI);c.stroke();c.beginPath();c.arc(0,-s,.18*s,0,PI*2);c.stroke();}
  else if(shape==='skull'){c.beginPath();c.arc(0,-.15*s,.75*s,0,PI*2);c.fill();c.fillRect(-.42*s,.3*s,.84*s,.5*s);c.fillStyle='rgba(255,230,210,.95)';c.beginPath();c.arc(-.3*s,-.15*s,.2*s,0,PI*2);c.arc(.3*s,-.15*s,.2*s,0,PI*2);c.fill();c.fillRect(-.06*s,.15*s,.12*s,.15*s);}
  else if(shape==='crown'){c.beginPath();c.moveTo(-s,.5*s);c.lineTo(-s,-.4*s);c.lineTo(-.5*s,.05*s);c.lineTo(0,-.7*s);c.lineTo(.5*s,.05*s);c.lineTo(s,-.4*s);c.lineTo(s,.5*s);c.closePath();c.fill();}
  c.restore();
}
function drawWatch(c,L,w,palmUp){
  const y=0.86*L;c.save();
  c.fillStyle=w.band;c.strokeStyle=OUT;c.lineWidth=0.02*L;
  const band=rrPath(-0.31*L,y-0.05*L,0.62*L,0.1*L,0.03*L);c.fill(band);c.stroke(band);
  if(!palmUp){
    if(w.digital||w.smart){const f=rrPath(-0.1*L,y-0.085*L,0.2*L,0.17*L,0.04*L);c.fillStyle=w.rim;c.fill(f);c.stroke(f);const f2=rrPath(-0.08*L,y-0.065*L,0.16*L,0.13*L,0.03*L);c.fillStyle=w.face;c.fill(f2);
      if(w.digital){c.fillStyle='#7dff9a';c.font=`700 ${0.055*L}px monospace`;c.textAlign='center';c.textBaseline='middle';c.direction='ltr';c.fillText('12:00',0,y);}
      else{['#ff4d6d','#3ee08f','#3bc3ff'].forEach((col,i)=>{c.strokeStyle=col;c.lineWidth=0.012*L;c.beginPath();c.arc(0,y,(0.045-i*0.014)*L,-PI/2,-PI/2+PI*(1.5-i*0.3));c.stroke();});}}
    else{c.fillStyle=w.rim;c.beginPath();c.arc(0,y,0.09*L,0,PI*2);c.fill();c.stroke();c.fillStyle=w.face;c.beginPath();c.arc(0,y,0.07*L,0,PI*2);c.fill();
      c.strokeStyle='#22164f';c.lineWidth=0.012*L;c.beginPath();c.moveTo(0,y);c.lineTo(0,y-0.05*L);c.moveTo(0,y);c.lineTo(0.035*L,y+0.01*L);c.stroke();}
  }else{const b=rrPath(-0.05*L,y-0.06*L,0.1*L,0.12*L,0.02*L);c.fillStyle='#c9c9d6';c.fill(b);c.stroke(b);}
  c.restore();
}
// ===== arenas =====
function drawArena(c,id,W,H,t){drawArenaBase(c,id,W,H,t);arenaLife(c,id,W,H,t);}
function drawArenaBase(c,id,W,H,t){
  if(id==='ar_temple'){drawTemple(c,W,H,t);return;}
  const cx=W/2,cy=H/2;
  if(id==='ar_kitchen'){
    c.fillStyle='#f4ead8';c.fillRect(-50,-50,W+100,H+100);
    const s=Math.max(W,H)/9;c.fillStyle='#4fb3a9';
    for(let y=-1;y<H/s+2;y++)for(let x=-1;x<W/s+2;x++){if((x+y)%2===0)c.fillRect(x*s,y*s,s,s);}
    c.fillStyle='rgba(255,255,255,.18)';for(let y=-1;y<H/s+2;y++)c.fillRect(0,y*s-1,W,2);
    const g=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.7);g.addColorStop(0,'rgba(255,240,200,.25)');g.addColorStop(1,'rgba(60,30,10,.35)');c.fillStyle=g;c.fillRect(0,0,W,H);
    c.font=`${Math.min(W,H)*0.09}px serif`;c.textAlign='center';c.textBaseline='middle';c.globalAlpha=.9;c.fillText('🍳',W*0.12,H*0.62);c.fillText('🥄',W*0.88,H*0.38);c.globalAlpha=1;
  }else if(id==='ar_restaurant'){
    const g=c.createLinearGradient(0,0,W,0);g.addColorStop(0,'#5a3418');g.addColorStop(.5,'#8a5326');g.addColorStop(1,'#5a3418');c.fillStyle=g;c.fillRect(-50,-50,W+100,H+100);
    const pw=W/5;c.strokeStyle='rgba(40,20,5,.5)';c.lineWidth=3;for(let i=1;i<5;i++){c.beginPath();c.moveTo(i*pw,0);c.lineTo(i*pw,H);c.stroke();}
    c.strokeStyle='rgba(255,220,170,.08)';c.lineWidth=2;const r=seeded(3);for(let i=0;i<40;i++){const x=r()*W,y=r()*H;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+10,y+40,x-10,y+80,x+5,y+130);c.stroke();}
    // napkin + glass (like the photo)
    const R=Math.min(W,H)*0.11;c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.arc(W*0.94+6,H*0.1+8,R,0,PI*2);c.fill();
    c.fillStyle='#fdfdf8';c.beginPath();for(let i=0;i<40;i++){const a=i*PI/20,rr=R*(i%2?0.93:1);c.lineTo(W*0.94+Math.cos(a)*rr,H*0.1+Math.sin(a)*rr);}c.fill();
    c.fillStyle='rgba(230,240,255,.7)';c.beginPath();c.arc(W*0.94,H*0.1,R*0.5,0,PI*2);c.fill();c.fillStyle='rgba(255,230,140,.75)';c.beginPath();c.arc(W*0.94,H*0.1,R*0.38,0,PI*2);c.fill();
    c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.arc(W*0.94-R*0.15,H*0.1-R*0.15,R*0.1,0,PI*2);c.fill();
    c.fillStyle='rgba(0,0,0,.18)';c.fillRect(0,0,W,H*0.04);c.fillRect(0,H*0.96,W,H*0.04);
  }else if(id==='ar_space'){
    const g=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.8);g.addColorStop(0,'#1d1a4a');g.addColorStop(1,'#05040f');c.fillStyle=g;c.fillRect(-50,-50,W+100,H+100);
    const r=seeded(11);for(let i=0;i<140;i++){const x=r()*W,y=r()*H,s=r()*1.8+0.4;c.globalAlpha=.4+.6*Math.abs(Math.sin(t/900+i));c.fillStyle='#fff';c.fillRect(x,y,s,s);}c.globalAlpha=1;
    const neb=c.createRadialGradient(W*0.2,H*0.25,0,W*0.2,H*0.25,W*0.5);neb.addColorStop(0,'rgba(255,80,200,.25)');neb.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=neb;c.fillRect(0,0,W,H);
    const pr=Math.min(W,H)*0.12,px=W*0.85,py=H*0.72;const pg=c.createRadialGradient(px-pr*.4,py-pr*.4,pr*.1,px,py,pr);pg.addColorStop(0,'#ffb36b');pg.addColorStop(1,'#a8402a');c.fillStyle=pg;c.beginPath();c.arc(px,py,pr,0,PI*2);c.fill();
    c.strokeStyle='rgba(255,220,180,.6)';c.lineWidth=4;c.beginPath();c.ellipse(px,py,pr*1.6,pr*0.35,-0.3,0,PI*2);c.stroke();
  }else if(id==='ar_neon'){
    c.fillStyle='#0b0620';c.fillRect(-50,-50,W+100,H+100);
    c.save();c.shadowBlur=12;const s=Math.max(W,H)/10;c.lineWidth=1.5;
    c.strokeStyle='rgba(255,60,200,.45)';c.shadowColor='#ff3cc8';for(let x=((t*0.02)%s);x<W;x+=s){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
    c.strokeStyle='rgba(60,220,255,.45)';c.shadowColor='#3cdcff';for(let y=0;y<H;y+=s){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}c.restore();
  }else{
    const g=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.75);g.addColorStop(0,'#8a7cff');g.addColorStop(.6,'#6252e6');g.addColorStop(1,'#3a2a9a');
    c.fillStyle=g;c.fillRect(-50,-50,W+100,H+100);
    c.save();c.globalAlpha=.06;c.strokeStyle='#fff';c.lineWidth=14;const step=46,off=(t*0.012)%step;
    for(let x=-H-step;x<W+H;x+=step){c.beginPath();c.moveTo(x+off,0);c.lineTo(x+off+H,H);c.stroke();}c.restore();
    // soft play mat in the centre + floor glow for depth
    const mw=Math.min(W*0.92,520),mh=Math.min(H*0.78,760);c.save();c.shadowColor='rgba(20,8,70,.45)';c.shadowBlur=40;c.fillStyle='rgba(70,52,200,.35)';c.fill(rrPath(cx-mw/2,cy-mh/2,mw,mh,48));c.restore();
    const mg=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(mw,mh)*.6);mg.addColorStop(0,'rgba(255,255,255,.12)');mg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=mg;c.fill(rrPath(cx-mw/2,cy-mh/2,mw,mh,48));
    c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1.5;c.stroke(rrPath(cx-mw/2,cy-mh/2,mw,mh,48));
  }
}
// the default table: billiard-green felt under one warm lamp, worn chalk marks
let FELT=null;
function feltTex(c){if(FELT)return FELT;const n=document.createElement('canvas');n.width=n.height=128;const x=n.getContext('2d'),r=seeded(9);
  for(let i=0;i<5200;i++){const v=r();x.fillStyle=v<.5?`rgba(0,0,0,${.05+r()*.07})`:`rgba(255,255,255,${.025+r()*.04})`;x.fillRect(r()*128,r()*128,1+r()*1.5,1);}FELT=c.createPattern(n,'repeat');return FELT;}
function drawFelt(c,W,H){const cx=W/2,cy=H/2,M=Math.max(W,H);
  c.fillStyle='#1d5641';c.fillRect(-50,-50,W+100,H+100);c.fillStyle=feltTex(c);c.fillRect(-50,-50,W+100,H+100);
  const g=c.createRadialGradient(cx,cy*.96,0,cx,cy,M*.72);g.addColorStop(0,'rgba(255,236,190,.16)');g.addColorStop(.45,'rgba(255,236,190,.03)');g.addColorStop(1,'rgba(4,20,14,.62)');c.fillStyle=g;c.fillRect(-50,-50,W+100,H+100);
  // old chalk ghosts: last night's games, mostly rubbed out
  c.save();c.globalAlpha=.05;c.strokeStyle='#f3efe4';c.lineWidth=10;c.lineCap='round';const r=seeded(17);
  for(let i=0;i<3;i++){const x=r()*W,y=r()*H;c.beginPath();c.arc(x,y,M*(.08+r()*.08),r()*6,r()*6+3);c.stroke();}
  c.lineWidth=4;c.globalAlpha=.06;for(let k=0;k<2;k++){const x0=W*(.1+r()*.7),y0=H*(.15+r()*.7);for(let i=0;i<4;i++){c.beginPath();c.moveTo(x0+i*9,y0);c.lineTo(x0+i*9+2,y0+26);c.stroke();}c.beginPath();c.moveTo(x0-4,y0+20);c.lineTo(x0+34,y0+6);c.stroke();}
  c.restore();}
function heartAt(c,x,y,s,full,col){c.save();c.translate(x,y);c.scale(s/20,s/20);c.lineWidth=3;c.strokeStyle=OUT;c.stroke(HEART);c.fillStyle=full?col:'rgba(255,255,255,.2)';c.fill(HEART);
  if(full){c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(-5,3,2,3,-.5,0,PI*2);c.fill();}c.restore();}
function outlinedText(c,s,x,y,size,fill,stroke,weight=900,dir){c.font=`${weight} ${size}px -apple-system,system-ui,sans-serif,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.direction=dir||(LANG==='he'?'rtl':'ltr');
  c.lineJoin='round';c.lineWidth=size*0.22;c.strokeStyle=stroke||OUT;c.strokeText(s,x,y);c.fillStyle=fill;c.fillText(s,x,y);}

// living arena details
function arenaLife(c,id,W,H,t){
  c.save();
  if(id==='ar_kitchen'){const x0=W*0.12,y0=H*0.62-Math.min(W,H)*0.05;
    for(let i=0;i<5;i++){const u=((t/2200)+i/5)%1;const x=x0+Math.sin(u*7+i)*12,y=y0-u*H*0.18,r=8+u*22;c.globalAlpha=(1-u)*0.35;c.fillStyle='#fff';c.beginPath();c.arc(x,y,r,0,PI*2);c.fill();}}
  else if(id==='ar_restaurant'){const x=W*0.07,y=H*0.9;const fl=0.85+0.15*Math.sin(t/90)+0.08*Math.sin(t/37);
    const g=c.createRadialGradient(x,y,0,x,y,Math.min(W,H)*0.45*fl);g.addColorStop(0,'rgba(255,200,110,.32)');g.addColorStop(1,'rgba(255,160,60,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
    c.font=`${Math.min(W,H)*0.07}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('🕯️',x,y);}
  else if(id==='ar_space'){const per=3200,u=(t%per)/per,k=Math.floor(t/per);const r=seeded(k+5);const sx=r()*W,sy=r()*H*0.5;
    if(u<0.25){const v=u/0.25;const x=sx+v*W*0.5,y=sy+v*H*0.25;const g=c.createLinearGradient(x-80,y-40,x,y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,.9)');
      c.strokeStyle=g;c.lineWidth=2.5;c.beginPath();c.moveTo(x-80,y-40);c.lineTo(x,y);c.stroke();}}
  else if(id==='ar_neon'){const y=(t*0.15)%(H+200)-100;const g=c.createLinearGradient(0,y-60,0,y+60);g.addColorStop(0,'rgba(60,220,255,0)');g.addColorStop(.5,'rgba(60,220,255,.12)');g.addColorStop(1,'rgba(60,220,255,0)');c.fillStyle=g;c.fillRect(0,y-60,W,120);
    if(Math.sin(t/53)*Math.sin(t/171)>0.93){c.fillStyle='rgba(255,60,200,.06)';c.fillRect(0,0,W,H);}}
  else if(id==='ar_purple'||!id){for(let i=0;i<14;i++){const r=seeded(i+20);const sp=0.012+r()*0.02,x=r()*W+Math.sin(t/1500+i)*14,y=H+30-((t*sp+r()*H*2)%(H+60)),rad=4+r()*10;
    c.globalAlpha=.16;c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(x,y,rad,0,PI*2);c.stroke();c.globalAlpha=.25;c.fillStyle='#fff';c.beginPath();c.arc(x-rad*.35,y-rad*.35,rad*.2,0,PI*2);c.fill();}}
  c.restore();
}
// cartoon face with expressions
function drawFace(c,x,y,r,e,t,blink){
  c.save();c.translate(x,y);
  const g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r);g.addColorStop(0,'#ffe680');g.addColorStop(1,'#f5b921');
  c.fillStyle=g;c.strokeStyle=OUT;c.lineWidth=r*.12;c.beginPath();c.arc(0,0,r,0,PI*2);c.fill();c.stroke();
  c.lineCap='round';c.lineJoin='round';c.strokeStyle=OUT;c.fillStyle=OUT;c.lineWidth=r*.11;
  const ex=r*.36,ey=-r*.15;
  const cheeks=(a)=>{c.fillStyle=`rgba(255,90,90,${a})`;c.beginPath();c.ellipse(-r*.55,r*.18,r*.16,r*.1,0,0,PI*2);c.ellipse(r*.55,r*.18,r*.16,r*.1,0,0,PI*2);c.fill();c.fillStyle=OUT;};
  if(e==='happy'){[-1,1].forEach(s=>{c.beginPath();c.arc(s*ex,ey+r*.05,r*.14,PI*1.1,PI*1.9);c.stroke();});
    c.beginPath();c.moveTo(-r*.42,r*.15);c.quadraticCurveTo(0,r*.75,r*.42,r*.15);c.closePath();c.fill();c.fillStyle='#ff6b8a';c.beginPath();c.ellipse(0,r*.42,r*.18,r*.1,0,0,PI*2);c.fill();cheeks(.5);}
  else if(e==='ouch'){[-1,1].forEach(s=>{const cx2=s*ex;c.beginPath();for(let i=0;i<14;i++){const a=i*0.9+t/120*s,rr=r*.02+i*r*.013;c.lineTo(cx2+Math.cos(a)*rr,ey+Math.sin(a)*rr);}c.stroke();});
    c.beginPath();for(let i=0;i<=6;i++){c.lineTo(-r*.35+i*r*.117,r*.42+(i%2?-1:1)*r*.08);}c.stroke();cheeks(.7);}
  else if(e==='scared'){[-1,1].forEach(s=>{c.fillStyle='#fff';c.beginPath();c.arc(s*ex,ey,r*.2,0,PI*2);c.fill();c.stroke();c.fillStyle=OUT;c.beginPath();c.arc(s*ex,ey,r*.06,0,PI*2);c.fill();});
    c.beginPath();c.ellipse(0,r*.45,r*.14,r*.18,0,0,PI*2);c.fill();
    c.fillStyle='#7fd3ff';c.beginPath();c.moveTo(r*.8,-r*.5);c.quadraticCurveTo(r*.98,-r*.15,r*.8,-r*.1);c.quadraticCurveTo(r*.62,-r*.15,r*.8,-r*.5);c.fill();}
  else if(e==='cool'){c.fillStyle='#1a1030';c.beginPath();c.moveTo(-r*.75,ey-r*.12);c.lineTo(r*.75,ey-r*.12);c.lineTo(r*.62,ey+r*.18);c.quadraticCurveTo(r*.3,ey+r*.3,r*.08,ey+r*.05);c.lineTo(-r*.08,ey+r*.05);c.quadraticCurveTo(-r*.3,ey+r*.3,-r*.62,ey+r*.18);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.6)';c.fillRect(-r*.55,ey-r*.05,r*.15,r*.05);c.beginPath();c.moveTo(-r*.3,r*.42);c.quadraticCurveTo(r*.1,r*.55,r*.38,r*.3);c.stroke();}
  else if(e==='angry'){[-1,1].forEach(s=>{c.beginPath();c.moveTo(s*r*.6,ey-r*.3);c.lineTo(s*r*.15,ey-r*.12);c.stroke();c.beginPath();c.arc(s*ex,ey+r*.08,r*.08,0,PI*2);c.fill();});
    c.beginPath();c.moveTo(-r*.32,r*.52);c.quadraticCurveTo(0,r*.25,r*.32,r*.52);c.stroke();c.fillStyle='rgba(255,60,60,.3)';c.beginPath();c.arc(0,0,r*.95,0,PI*2);c.fill();}
  else if(e==='smug'){[-1,1].forEach(s=>{c.beginPath();c.moveTo(s*ex-r*.14,ey);c.lineTo(s*ex+r*.14,ey);c.stroke();c.beginPath();c.arc(s*ex,ey,r*.14,0,PI);c.fill();});
    c.beginPath();c.moveTo(-r*.3,r*.38);c.quadraticCurveTo(r*.15,r*.55,r*.4,r*.25);c.stroke();cheeks(.35);}
  else{[-1,1].forEach(s=>{if(blink){c.beginPath();c.moveTo(s*ex-r*.1,ey);c.lineTo(s*ex+r*.1,ey);c.stroke();}else{c.beginPath();c.ellipse(s*ex,ey,r*.09,r*.13,0,0,PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(s*ex+r*.03,ey-r*.05,r*.035,0,PI*2);c.fill();c.fillStyle=OUT;}});
    c.beginPath();c.arc(0,r*.18,r*.3,PI*.15,PI*.85);c.stroke();cheeks(.3);}
  c.restore();
}
