// ===== finger-drawn moves: hold your hand, draw a shape, let go =====
const DISP="-apple-system,system-ui,sans-serif";
// One shape = one element everywhere: the zigzag is always lightning, the loop is always a tornado.
const SHAPES={
  zig:{pts:[[-1,-1],[1,-1],[-1,1],[1,1]]},                      // Z — lightning
  peak:{pts:[[-1,1],[0,-1],[1,1]]},                               // Λ — flame tip
  vee:{pts:[[-1,-1],[0,1],[1,-1]]},                               // V — icicle
  loop:{closed:true,pts:Array.from({length:33},(_,i)=>{const a=-PI/2+i/32*PI*2;return[Math.cos(a),Math.sin(a)];})}, // O — tornado
  tri:{closed:true,pts:[[0,-1],[1,1],[-1,1],[0,-1]]},             // △ — the big one
  wave:{pts:[[-1,-1],[-.5,1],[0,-.2],[.5,1],[1,-1]]},             // W — thunderstorm (finisher)
  mtn:{pts:[[-1,1],[-.5,-1],[0,.2],[.5,-1],[1,1]]},               // M — volcano (finisher)
  inf:{pts:Array.from({length:41},(_,i)=>{const a=i/40*PI*2;return[Math.sin(a),Math.sin(a)*Math.cos(a)*1.6];})}, // ∞ — double whirl (finisher)
  star:{closed:true,pts:[[0,-1],[.59,.81],[-.95,-.31],[.95,-.31],[-.59,.81],[0,-1]]}}; // ☆ — the giant (finisher)
const GN=48;
function gResample(pts,n){const len=pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]):0,0);if(len<=0)return Array(n).fill(pts[0]);
  const I=len/(n-1),out=[pts[0].slice()];let D=0;const q=pts.map(p=>p.slice());
  for(let i=1;i<q.length;i++){const d=Math.hypot(q[i][0]-q[i-1][0],q[i][1]-q[i-1][1]);
    if(D+d>=I&&d>0){const t=(I-D)/d,nx=q[i-1][0]+t*(q[i][0]-q[i-1][0]),ny=q[i-1][1]+t*(q[i][1]-q[i-1][1]);out.push([nx,ny]);q.splice(i,0,[nx,ny]);D=0;}else D+=d;}
  while(out.length<n)out.push(q[q.length-1].slice());return out.slice(0,n);}
function gNorm(pts){const r=gResample(pts,GN);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;r.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);});
  const w=x1-x0,h=y1-y0,m=Math.max(w,h)||1,sx=Math.max(w,m*.35),sy=Math.max(h,m*.35);let cx=0,cy=0;r.forEach(([x,y])=>{cx+=x;cy+=y;});cx/=GN;cy/=GN;
  return r.map(([x,y])=>[(x-cx)/sx,(y-cy)/sy]);}
// every template in both drawing directions; closed shapes from every starting point
const GTPL=[];(()=>{Object.entries(SHAPES).forEach(([id,s])=>{let vars=[s.pts];
  if(s.closed){const base=s.pts.slice(0,-1),n=base.length,steps=id==='loop'?8:n;vars=[];for(let k=0;k<steps;k++){const o=Math.round(k*n/steps),rot=base.slice(o).concat(base.slice(0,o));rot.push(rot[0]);vars.push(rot);}}
  vars.concat(vars.map(v=>v.slice().reverse())).forEach(v=>GTPL.push({id,p:gNorm(v)}));});})();
function gDist(a,b){let d=0;for(let i=0;i<GN;i++)d+=Math.hypot(a[i][0]-b[i][0],a[i][1]-b[i][1]);return d/GN;}
function gRot(p,an){const c=Math.cos(an),s=Math.sin(an);return p.map(([x,y])=>[x*c-y*s,x*s+y*c]);}
// returns {id,score} or null. Straight lines and scribbles are rejected.
function recognize(path,minSize){if(!path||path.length<6)return null;
  let len=0;for(let i=1;i<path.length;i++)len+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;path.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);});
  if(Math.max(x1-x0,y1-y0)<minSize)return null;
  const a=path[0],b=path[path.length-1];if(Math.hypot(b[0]-a[0],b[1]-a[1])/len>.93)return null;
  const p=gNorm(path);let best=null,bd=1e9,second=1e9;
  GTPL.forEach(t=>{const d=Math.min(gDist(p,t.p),gDist(gRot(p,.18),t.p),gDist(gRot(p,-.18),t.p));
    if(d<bd){if(!best||best.id!==t.id)second=bd;bd=d;best=t;}else if(t.id!==best.id&&d<second)second=d;});
  const score=1-bd/0.9;if(!best||score<.8||(second-bd)<.035)return null;return{id:best.id,score,margin:second-bd};}

// ---------- chalk ----------
let CHALK=null;
function chalkPattern(c){if(CHALK)return CHALK;const n=document.createElement('canvas');n.width=n.height=96;const x=n.getContext('2d'),r=seeded(41);
  for(let i=0;i<2600;i++){x.fillStyle=`rgba(255,253,246,${.25+r()*.75})`;x.fillRect(r()*96,r()*96,r()*1.6+.4,r()*1.6+.4);}CHALK=c.createPattern(n,'repeat');return CHALK;}
// a stroke the way chalk looks: dusty core, grainy body, broken edges
// a glowing light trail (the finger "writes with light")
function chalkStroke(c,pts,w,alpha,tint){if(pts.length<2)return;c.save();c.lineCap='round';c.lineJoin='round';const col=tint||'#9d8cff';
  const tr=()=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));};
  c.globalAlpha=alpha*.35;c.strokeStyle=col;c.lineWidth=w*2.6;c.shadowColor=col;c.shadowBlur=18;tr();c.stroke();c.shadowBlur=0;
  c.globalAlpha=alpha*.9;c.strokeStyle=col;c.lineWidth=w*1.15;tr();c.stroke();
  c.globalAlpha=alpha;c.strokeStyle='#fff';c.lineWidth=w*.45;tr();c.stroke();c.restore();}
// a move's glyph drawn in chalk; prog 0..1 draws it on progressively (used for demos)
function glyphPts(id,x,y,s){return SHAPES[id].pts.map(([a,b])=>[x+a*s,y+b*s]);}
function drawGlyph(c,id,x,y,s,alpha,tint,prog){let pts=glyphPts(id,x,y,s);
  if(prog!=null&&prog<1){const r=gResample(pts,40);pts=r.slice(0,Math.max(2,Math.round(40*prog)));}
  chalkStroke(c,pts,Math.max(2.5,s*.2),alpha,tint);
  if(prog==null){const p0=pts[0];c.save();c.globalAlpha=alpha;c.fillStyle='#fff';c.shadowColor=tint||'#9d8cff';c.shadowBlur=8;c.beginPath();c.arc(p0[0],p0[1],Math.max(2.2,s*.16),0,PI*2);c.fill();c.restore();}}
// inline SVG of a glyph for menus, with a dot where the finger starts
function glyphSVG(id,size=34,col='currentColor'){const s=SHAPES[id],p=s.pts.map(([a,b])=>[(a*.78+1)*size/2,(b*.78+1)*size/2]);
  const d='M'+p.map(q=>q.map(v=>v.toFixed(1)).join(' ')).join('L');
  return `<svg class="glyph" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><path d="${d}" fill="none" stroke="${col}" stroke-width="${(size*.09).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${p[0][0].toFixed(1)}" cy="${p[0][1].toFixed(1)}" r="${(size*.08).toFixed(1)}" fill="${col}"/></svg>`;}

// ---------- the drawing state on each hand ----------
const HOLD_MS=240,HOLD_TOL=18;
let strokes=[];  // finished strokes fading out: {p,pts,t,ok,col}
function gestureTick(){return; // specials now start with a double-tap (see pointerdown); holding still is just holding
}
function gestureTickOld(){P.forEach(pl=>{if(pl.ai)return;pl.hands.forEach(h=>{
  if(h.ptr==null||h.touch||h.draw)return;
  const canDraw=(G.phase==='armed'&&pl.i===G.att)||(G.phase==='finish'&&pl.i===G.finW);
  if(canDraw&&h.downT>=(G.phase==='armed'?G.armedT:G.pt)&&performance.now()-h.t0>HOLD_MS&&Math.hypot(h.fx-h.sx,h.fy-h.sy)<HOLD_TOL){h.draw=true;h.drawT=G.t;h.path=[[h.fx,h.fy]];h.feint=0;buzz(12);sfxTone([330,495],'triangle',.05,.08,.04);}});});}
function finishDraw(pl,h){const path=h.path||[];h.draw=false;h.path=null;
  const fin=G.phase==='finish',r=recognize(path,0.38*L);
  if(!fin&&path.length<5)return;
  if(!r){if(path.length>4){strokes.push({p:pl.i,pts:path,t:G.t,ok:false});sfxTone([196],'triangle',.06,.12);}return;}
  if(fin){const f=FINISHERS.find(x=>x.shape===r.id);strokes.push({p:pl.i,pts:path,t:G.t,ok:!!f,col:f?'#ffd9a0':null});if(f){buzz(40);startFatal(f.id);}else{sfxTone([196],'triangle',.06,.12);}return;}
  const sp=SPECIALS.find(x=>x.shape===r.id);
  if(!sp||(!pl.ai&&!spUnlocked(sp)&&G.mode!=='tut')){strokes.push({p:pl.i,pts:path,t:G.t,ok:false});if(sp)msg(pl.i,t('locked_lvl',sp.lvl),'#ff8fa3',.9);else sfxTone([196],'triangle',.06,.12);return;}
  if(G.mode!=='tut'&&pl.energy<sp.cost){strokes.push({p:pl.i,pts:path,t:G.t,ok:false});msg(pl.i,t('no_energy'),'#9fe7ff',.9);return;}
  if(G.mode==='tut'&&G.tutStep!==4){strokes.push({p:pl.i,pts:path,t:G.t,ok:false});return;}
  if(G.mode!=='tut')pl.energy-=sp.cost;
  strokes.push({p:pl.i,pts:path,t:G.t,ok:true,col:sp.col});startStrike(h.k,'normal',false,1,sp.id);}
function drawStrokes(){strokes=strokes.filter(s=>G.t-s.t<(s.ok?520:380));
  strokes.forEach(s=>{const u=(G.t-s.t)/(s.ok?520:380);inFrame(s.p,()=>{ctx.save();if(!s.ok)ctx.translate(Math.sin(u*40)*4*(1-u),0);
    chalkStroke(ctx,s.pts,6+(s.ok?u*8:0),(1-u)*(s.ok?1:.6),s.ok?s.col:'#ff4d6d');ctx.restore();});});
  P.forEach(pl=>{if(pl.ai||pl.remote||!pl.tapT||G.phase!=='armed')return;const u=(G.t-pl.tapT)/430;if(u<0||u>1)return;inFrame(pl.i,()=>{ctx.save();ctx.globalAlpha=(1-u)*.8;ctx.strokeStyle='#fff';ctx.shadowColor='#9d8cff';ctx.shadowBlur=12;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(pl.tapXY[0],pl.tapXY[1],34-14*u,0,PI*2);ctx.stroke();ctx.restore();});});
  P.forEach(pl=>{if(pl.ai)return;pl.hands.forEach(h=>{if(!h.draw)return;inFrame(pl.i,()=>{
    const e=G.t-h.drawT,u=Math.min(1,e/180);
    // the finger's chalk ring says "you're drawing now"
    ctx.save();ctx.globalAlpha=.8*u*(h.path.length<4?1:.4);ctx.strokeStyle='#fff';ctx.shadowColor='#9d8cff';ctx.shadowBlur=14;ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.path[0][0],h.path[0][1],22+8*(1-u),0,PI*2);ctx.stroke();ctx.restore();
    if(h.path.length<6)drawShapeHints(pl,h.path[0][0],h.path[0][1],u);
    chalkStroke(ctx,h.path,6,.95);});});});}
// what can I draw right now? only shown while the finger is down and still — then it gets out of the way
function drawShapeHints(pl,x,y,u){if(pl.remote)return;const fin=G.phase==='finish',list=fin?FINISHERS:SPECIALS.filter(sp=>G.mode==='tut'||spUnlocked(sp));if(!list.length)return;
  const s=Math.min(16,W*.04),gap=Math.min(W/4.6,88),n=list.length,yy=Math.max(122,y-0.8*L),x0=clamp(x,-W/2+gap*n/2,W/2-gap*n/2);
  list.forEach((m,i)=>{const gx=x0+(i-(n-1)/2)*gap,ok=fin||G.mode==='tut'||pl.energy>=m.cost;
    {const pth=rrPath(gx-gap*.46,yy-s*1.55,gap*.92,s*3.55,16);ctx.save();ctx.globalAlpha=u;ctx.fillStyle=ok?'rgba(30,18,90,.32)':'rgba(30,18,90,.2)';ctx.fill(pth);ctx.globalAlpha=u*.45;ctx.strokeStyle=ok?m.col||'rgba(255,255,255,.5)':'rgba(255,255,255,.15)';ctx.lineWidth=1;ctx.stroke(pth);ctx.restore();}
    drawGlyph(ctx,m.shape,gx,yy,s*.85,(ok?.7:.25)*u,ok?(m.col||'#ff6a6a'):'#8a84b0');
    ctx.save();ctx.globalAlpha=(ok?.65:.3)*u;ctx.font=`800 ${Math.round(s*.72)}px ${DISP}`;ctx.textAlign='center';ctx.textBaseline='top';ctx.direction='ltr';ctx.fillStyle='#fff';
    ctx.fillText(fin?t('fin_'+m.id):t('sps_'+m.id)+' ⚡'+m.cost,gx,yy+s*1.3,gap*.84);ctx.restore();});}
// "FINISH THEM": the finishers chalked onto the table, nothing more
function drawFinishChalk(){const p=G.finW;if(G.phase!=='finish'||p==null||P[p].ai||P[p].remote)return;const pl=P[p];if(pl.hands.some(h=>h.draw))return;
  inFrame(p,()=>{const e=G.t-G.pt,n=FINISHERS.length,gw=Math.min(W-16,440),tw=gw/n-6,th=tw*1.25,s=tw*.24,y=H/2-SAFE.b-(G.cine||0)*H*.085-th/2-14;
    ctx.save();ctx.globalAlpha=(.75+.25*Math.sin(G.t/160))*Math.min(1,e/400);outlinedText(ctx,t('fin_pick'),0,y-th/2-20,Math.min(20,W*.05),'#fff',OUT,900,'ltr');ctx.restore();
    FINISHERS.forEach((f,i)=>{const gx=(i-(n-1)/2)*(tw+6),pr=clamp((e-200-i*120)/380,0,1);if(pr<=0)return;const pop=1-Math.pow(1-pr,3);
      ctx.save();ctx.translate(gx,y);ctx.scale(pop,pop);const pth=rrPath(-tw/2,-th/2,tw,th,14);
      ctx.save();ctx.shadowColor='rgba(255,40,60,.7)';ctx.shadowBlur=12;ctx.fillStyle='rgba(70,0,12,.8)';ctx.fill(pth);ctx.restore();
      const hl=ctx.createLinearGradient(0,-th/2,0,th/2);hl.addColorStop(0,'rgba(255,255,255,.2)');hl.addColorStop(.5,'rgba(255,255,255,0)');ctx.fillStyle=hl;ctx.fill(pth);
      ctx.strokeStyle='rgba(255,110,120,.85)';ctx.lineWidth=1.4;ctx.stroke(pth);
      drawGlyph(ctx,f.shape,0,-th*.1,s,1,'#ff5a6a',(G.t-G.pt-200-i*120)%2600<1400?Math.min(1,((G.t-G.pt-200-i*120)%2600)/900):null);
      ctx.font=`800 ${Math.round(Math.min(11.5,tw*.15))}px ${DISP}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='ltr';ctx.fillStyle='#fff';ctx.fillText(t('fin_'+f.id),0,th/2-13,tw-6);
      ctx.restore();});});}
