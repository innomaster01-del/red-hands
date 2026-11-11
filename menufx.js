// ===== main menu: alive but calm — entrance, light that follows the finger, tilt, sliding segments, a slappable logo =====
(()=>{
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const card=document.querySelector('#menu .card'),logo=document.getElementById('logo');
const sound=f=>{try{initAudio();const d=G.demo;G.demo=false;f();G.demo=d;}catch(e){}};

// 1. one orchestrated entrance each time you come home
function menuEnter(){if(RM)return;const items=[logo,...card.querySelectorAll(':scope > .sub, :scope > .btn, :scope > .row2, :scope > .opts')];
  card.classList.remove('mx-in');void card.offsetWidth;items.forEach((el,i)=>el.style.setProperty('--i',i));card.classList.add('mx-in');
  countUp();}
const _only=only;window.only=only=function(id){_only(id);if(id==='menu')menuEnter();};

// 2. coins count up, xp bar fills
function countUp(){const el=document.getElementById('mCoins'),to=PROF.coins,t0=performance.now(),from=Math.max(0,to-Math.min(to,60));
  const step=n=>{const u=Math.min(1,(n-t0)/700),v=Math.round(from+(to-from)*(1-Math.pow(1-u,3)));el.textContent='🪙 '+v;if(u<1)requestAnimationFrame(step);};requestAnimationFrame(step);
  const xp=document.getElementById('mXp'),w=xp.style.width;xp.style.transition='none';xp.style.width='0';void xp.offsetWidth;xp.style.transition='width .9s cubic-bezier(.2,.8,.2,1) .25s';xp.style.width=w;}

// 3. specular light that follows the finger across glass buttons
document.querySelectorAll('#menu .btn').forEach(b=>{
  const mv=e=>{const r=b.getBoundingClientRect();b.style.setProperty('--mx',(e.clientX-r.left)+'px');b.style.setProperty('--my',(e.clientY-r.top)+'px');};
  b.addEventListener('pointermove',mv);b.addEventListener('pointerdown',e=>{mv(e);b.classList.add('mx-lit');try{buzz(8);}catch(_){}sound(()=>sfxTone([660],'sine',.04,.05));});
  ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>b.classList.remove('mx-lit')));});

// 4. the card tilts a little toward your finger / the phone's tilt
let tx=0,ty=0,cx=0,cy=0,raf=0;
function tick(){cx+=(tx-cx)*.12;cy+=(ty-cy)*.12;card.style.setProperty('--rx',Math.round(-cy*1.5)+'px');card.style.setProperty('--ry',Math.round(cx*1.5)+'px');
  raf=(Math.abs(tx-cx)+Math.abs(ty-cy)>.01)?requestAnimationFrame(tick):0;}
function aim(x,y){tx=x;ty=y;if(!raf)raf=requestAnimationFrame(tick);}
if(!RM){document.getElementById('menu').addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();aim(((e.clientX-r.left)/r.width-.5)*5,-((e.clientY-r.top)/r.height-.5)*4);});
  document.getElementById('menu').addEventListener('pointerleave',()=>aim(0,0));
  addEventListener('deviceorientation',e=>{if(e.gamma==null||document.getElementById('menu').classList.contains('hide'))return;aim(clamp(e.gamma/6,-4,4),clamp(-(e.beta-45)/8,-3,3));});}

// 5. segmented control with a sliding pill
function segPill(seg){let p=seg.querySelector('.mx-pill');if(!p){p=document.createElement('i');p.className='mx-pill';seg.prepend(p);}
  const on=seg.querySelector('button.on');if(!on){p.style.opacity=0;return;}p.style.opacity=1;p.style.width=on.offsetWidth+'px';p.style.transform=`translateX(${on.offsetLeft-2}px)`;}
const sp=document.getElementById('speed');new MutationObserver(()=>segPill(sp)).observe(sp,{subtree:true,attributes:true,attributeFilter:['class']});
addEventListener('resize',()=>segPill(sp));setTimeout(()=>segPill(sp),50);


sp.addEventListener('click',()=>sound(()=>sfxTone([520,780],'sine',.05,.05,.04)));

// 6. slap the logo
logo.addEventListener('pointerdown',e=>{e.preventDefault();sound(()=>sfxHit(PROF.equip.sound,.7));try{buzz(25);}catch(_){}
  logo.classList.remove('mx-slap');void logo.offsetWidth;logo.classList.add('mx-slap');card.classList.remove('mx-shake');void card.offsetWidth;card.classList.add('mx-shake');
  const r=logo.getBoundingClientRect(),m=document.createElement('i');m.className='mx-mark';m.style.left=(e.clientX-r.left)+'px';m.style.top=(e.clientY-r.top)+'px';m.style.rotate=(Math.random()*40-20)+'deg';logo.appendChild(m);setTimeout(()=>m.remove(),1400);});

menuEnter();
})();
