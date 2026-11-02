// ===== geometry helpers (taper, shade) + temple arena =====
function taper(x1,y1,x2,y2,w1,w2){
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux,a=Math.atan2(ny,nx);
  const p=new Path2D();
  p.moveTo(x1-nx*w1/2,y1-ny*w1/2);p.lineTo(x2-nx*w2/2,y2-ny*w2/2);
  p.arc(x2,y2,w2/2,a-PI,a,false);
  p.lineTo(x1+nx*w1/2,y1+ny*w1/2);
  p.arc(x1,y1,w1/2,a,a+PI,false);p.closePath();return p;}
function shade(hex,amt){let c=hex.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');const n=parseInt(c,16);let r=n>>16,g=(n>>8)&255,b=n&255;
  const f=v=>Math.max(0,Math.min(255,Math.round(amt<0?v*(1+amt):v+(255-v)*amt)));return'#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
// ===== temple arena (cached) =====
let templeCache=null;
function templeBase(W,H){const key=W+'x'+H;if(templeCache&&templeCache.key===key)return templeCache.cv;
  const d=2,cv=document.createElement('canvas');cv.width=Math.round(W*d);cv.height=Math.round(H*d);const c=cv.getContext('2d');c.scale(d,d);
  c.fillStyle='#16110e';c.fillRect(0,0,W,H);
  const r=seeded(42),rows=8,rh=H/rows;
  for(let i=0;i<rows;i++){let x=-r()*60;while(x<W){const w=W*(0.22+r()*0.25),y=i*rh;
    const base=[44+r()*14,38+r()*10,32+r()*8].map(Math.round);const g=c.createLinearGradient(0,y,0,y+rh);
    g.addColorStop(0,`rgb(${base[0]+14},${base[1]+12},${base[2]+10})`);g.addColorStop(1,`rgb(${base[0]-8},${base[1]-8},${base[2]-6})`);c.fillStyle=g;c.fillRect(x+2,y+2,w-4,rh-4);
    for(let k=0;k<40;k++){c.fillStyle=`rgba(${r()<.5?0:255},${r()<.5?0:255},${r()<.5?0:255},.035)`;c.fillRect(x+r()*w,y+r()*rh,2+r()*5,2+r()*5);}
    c.fillStyle='rgba(255,230,200,.05)';c.fillRect(x+2,y+2,w-4,3);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+2,y+rh-6,w-4,4);
    if(r()<.25){c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1.5;c.beginPath();let cx2=x+r()*w,cy2=y+r()*rh;c.moveTo(cx2,cy2);for(let s=0;s<5;s++){cx2+=(r()-.5)*30;cy2+=(r()-.5)*24;c.lineTo(cx2,cy2);}c.stroke();}
    x+=w;}}
  // center sigil engraving
  const cx=W/2,cy=H/2,R=Math.min(W,H)*0.36;c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=5;c.beginPath();c.arc(cx,cy+2,R,0,PI*2);c.stroke();c.beginPath();c.arc(cx,cy+2,R*0.82,0,PI*2);c.stroke();
  c.strokeStyle='rgba(255,220,180,.07)';c.lineWidth=2;c.beginPath();c.arc(cx,cy,R,0,PI*2);c.stroke();c.beginPath();c.arc(cx,cy,R*0.82,0,PI*2);c.stroke();
  for(let i=0;i<24;i++){const a=i*PI/12;c.save();c.translate(cx+Math.cos(a)*R*0.91,cy+Math.sin(a)*R*0.91);c.rotate(a+PI/2);c.fillStyle='rgba(0,0,0,.5)';c.fillRect(-3,-7,6,14);c.fillStyle='rgba(255,220,180,.06)';c.fillRect(-3,-7,6,2);c.restore();}
  templeCache={key,cv};return cv;}
function drawTemple(c,W,H,t,accent){
  c.drawImage(templeBase(W,H),0,0,W,H);
  const cx=W/2,cy=H/2,R=Math.min(W,H)*0.36;
  // glowing runes
  c.save();c.globalCompositeOperation='lighter';c.translate(cx,cy);c.rotate(t/9000);
  for(let i=0;i<24;i++){const a=i*PI/12;c.save();c.translate(Math.cos(a)*R*0.91,Math.sin(a)*R*0.91);c.rotate(a+PI/2);c.fillStyle=accent||'rgba(255,90,40,.35)';c.globalAlpha=.35+.25*Math.sin(t/400+i);c.fillRect(-2,-5,4,10);c.restore();}
  c.restore();
  // torches
  const torches=[[0.07,0.06],[0.93,0.06],[0.07,0.94],[0.93,0.94]];
  torches.forEach(([tx,ty],i)=>{const x=tx*W,y=ty*H,fl=0.85+0.1*Math.sin(t/70+i*2)+0.07*Math.sin(t/23+i);
    c.save();c.globalCompositeOperation='lighter';const R2=Math.min(W,H)*0.34*fl;const g=c.createRadialGradient(x,y,0,x,y,R2);g.addColorStop(0,'rgba(255,150,60,.42)');g.addColorStop(.35,'rgba(255,90,20,.14)');g.addColorStop(1,'rgba(255,60,0,0)');c.fillStyle=g;c.fillRect(x-R2,y-R2,R2*2,R2*2);c.restore();
    c.fillStyle='#0c0806';c.beginPath();c.arc(x,y,13,0,PI*2);c.fill();c.strokeStyle='#5a4a3a';c.lineWidth=2;c.stroke();
    c.save();c.translate(x,y);c.globalCompositeOperation='lighter';for(let k=0;k<3;k++){const h=(22-k*5)*fl,w=(10-k*2.5);const fg=c.createRadialGradient(0,-h*0.3,0,0,-h*0.3,h);fg.addColorStop(0,k===2?'rgba(255,255,220,.95)':'rgba(255,200,80,.8)');fg.addColorStop(.5,'rgba(255,100,20,.5)');fg.addColorStop(1,'rgba(255,40,0,0)');
      c.fillStyle=fg;c.beginPath();c.moveTo(-w,0);c.quadraticCurveTo(-w*0.8,-h*0.6,Math.sin(t/60+k)*3,-h*1.1);c.quadraticCurveTo(w*0.8,-h*0.6,w,0);c.closePath();c.fill();}c.restore();
    for(let e=0;e<5;e++){const u=((t/1400)+e/5+i*0.13)%1;const ex=x+Math.sin(u*9+e+i)*14,ey=y-u*H*0.22;c.fillStyle=`rgba(255,${150+e*15},60,${(1-u)*.9})`;c.fillRect(ex,ey,2,2);}});
  // fog
  c.save();for(let i=0;i<2;i++){const fx=((t*0.008*(i%2?1:-1)+i*W*0.7)%(W*1.6))-W*0.3,fy=H*(0.3+i*0.4),fr=Math.max(W,H)*0.35;const g=c.createRadialGradient(fx,fy,0,fx,fy,fr);g.addColorStop(0,'rgba(200,190,210,.07)');g.addColorStop(1,'rgba(200,190,210,0)');c.fillStyle=g;c.fillRect(fx-fr,fy-fr,fr*2,fr*2);}c.restore();
}

