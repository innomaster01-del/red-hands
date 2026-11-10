// ===== career: a ladder of 12 rivals. Beat one to unlock the next; play clean for 3 stars. =====
(()=>{
const $c=id=>document.getElementById(id);
const LK=(sleeve,skin,o={})=>Object.assign({sleeve,skin,tattoo:'tt_none',nails:'nl_none',watch:'wt_none',ring:'rg_none',sound:'sd_classic',words:'wd_classic',sparks:'sp_stars'},o);
// tp = how fast the slap lands (ms) · dodge = how often they escape · flinch = how easily they fall for a fake · tell = warning before they slap (ms) · sp = how often they use specials
const RIVALS=[
 {id:'timmy',name:'Tiny Tim',tag:'First day at the table',ai:{tp:350,aiDodge:.1,aiFlinch:.48,tell:360,aiSp:0,aim:.17},look:LK('sl_green','sk_1')},
 {id:'rose',name:'Grandma Rose',tag:'Slow, but she has seen it all',ai:{tp:325,aiDodge:.17,aiFlinch:.42,tell:310,aiSp:.04,aim:.15},look:LK('sl_candy','sk_2',{ring:'rg_silver',nails:'nl_pink'})},
 {id:'leo',name:'Lazy Leo',tag:'Would rather be napping',ai:{tp:300,aiDodge:.22,aiFlinch:.37,tell:270,aiSp:.1,aim:.13},look:LK('sl_blue','sk_3',{watch:'wt_classic'})},
 {id:'benny',name:'Big Benny',tag:'Boss · hits like a door',boss:1,ai:{tp:285,aiDodge:.27,aiFlinch:.31,tell:235,aiSp:.28,aim:.11},look:LK('sl_camo','sk_4',{tattoo:'tt_anchor',watch:'wt_digital'})},
 {id:'quinn',name:'Quick Quinn',tag:'Blink and you are red',ai:{tp:255,aiDodge:.3,aiFlinch:.28,tell:200,aiSp:.3,aim:.1},look:LK('sl_red','sk_1',{nails:'nl_red'})},
 {id:'sam',name:'Sneaky Sam',tag:'Never falls for a fake',ai:{tp:245,aiDodge:.34,aiFlinch:.16,tell:175,aiSp:.34,aim:.09},look:LK('sl_black','sk_2',{tattoo:'tt_star'})},
 {id:'ivy',name:'Iron Ivy',tag:'Dodges almost everything',ai:{tp:232,aiDodge:.46,aiFlinch:.22,tell:150,aiSp:.4,aim:.085},look:LK('sl_green','sk_3',{ring:'rg_ruby',nails:'nl_black'})},
 {id:'sting',name:'Dr. Sting',tag:'Boss · loves the special moves',boss:1,ai:{tp:215,aiDodge:.4,aiFlinch:.2,tell:125,aiSp:.75,aim:.075},look:LK('sl_flame','sk_4',{tattoo:'tt_bolt',watch:'wt_smart'})},
 {id:'fiona',name:'Flash Fiona',tag:'Gives you no warning',ai:{tp:198,aiDodge:.42,aiFlinch:.17,tell:70,aiSp:.5,aim:.07},look:LK('sl_candy','sk_1',{nails:'nl_rainbow',ring:'rg_gold'})},
 {id:'steve',name:'Stone Steve',tag:'Cold hands, colder heart',ai:{tp:186,aiDodge:.46,aiFlinch:.13,tell:70,aiSp:.55,aim:.065},look:LK('sl_black','sk_3',{tattoo:'tt_skull',watch:'wt_gold'})},
 {id:'mirage',name:'Madame Mirage',tag:'You never know which slap is real',ai:{tp:176,aiDodge:.5,aiFlinch:.1,tell:55,aiSp:.62,aim:.06},look:LK('sl_galaxy','sk_2',{nails:'nl_gold',ring:'rg_diamond'})},
 {id:'king',name:'The Red King',tag:'Final boss · nobody leaves with pale hands',boss:1,ai:{tp:160,aiDodge:.54,aiFlinch:.08,tell:40,aiSp:.72,aim:.055},look:LK('sl_gold','sk_4',{tattoo:'tt_crown',ring:'rg_diamond',watch:'wt_gold',nails:'nl_gold'})}];
window.RIVALS=RIVALS;
const CR=()=>{if(!PROF.career)PROF.career={stars:{}};return PROF.career;};
const unlockedN=()=>{let n=0;while(n<RIVALS.length-1&&CR().stars[RIVALS[n].id])n++;return n;};
const totalStars=()=>RIVALS.reduce((s,r)=>s+(CR().stars[r.id]||0),0);
const reward=i=>(30+i*15)*(RIVALS[i].boss?2:1);
const starHTML=n=>[1,2,3].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('');

function avatar(cv,look){const d=Math.min(2,devicePixelRatio||1),S=60;cv.width=cv.height=S*d;const x=cv.getContext('2d');x.scale(d,d);x.translate(S/2,S*0.02);
  try{drawHandShape(x,S*0.56,{palmUp:false,look,noShadow:true,sleeveLen:S,t:0});}catch(e){}}
function renderCareer(){const un=unlockedN(),list=$c('crList');
  $c('crStars').innerHTML=`<b>${totalStars()}</b> / ${RIVALS.length*3} ★`;
  list.innerHTML=RIVALS.map((r,i)=>{const st=CR().stars[r.id]||0,lock=i>un,cur=i===un&&!st;
    const lvl=Math.round((1-(r.ai.tp-160)/190)*4)+1;
    return `<button class="rv ${lock?'lock':''} ${cur?'cur':''} ${r.boss?'boss':''}" data-i="${i}" ${lock?'disabled':''}>
      <span class="rvn">${i+1}</span><canvas class="rva" data-i="${i}"></canvas>
      <span class="rvt"><b>${r.name}</b><small>${lock?t('cr_locked',RIVALS[i-1].name):r.tag}</small><span class="rvd">${[1,2,3,4,5].map(k=>`<i class="${k<=lvl?'on':''}"></i>`).join('')}</span></span>
      <span class="rvs">${lock?'🔒':starHTML(st)}</span></button>`;}).join('');
  list.querySelectorAll('canvas.rva').forEach(c=>avatar(c,RIVALS[+c.dataset.i].look));
  list.querySelectorAll('.rv:not(.lock)').forEach(b=>b.onclick=()=>fight(+b.dataset.i));
  const cur=list.querySelector('.rv.cur')||list.querySelector('.rv:not(.lock):last-of-type');if(cur)setTimeout(()=>cur.scrollIntoView({block:'center',behavior:'smooth'}),80);}
function openCareer(){initAudio();renderCareer();show('career');}
function fight(i){const r=RIVALS[i];G.career=i;G.rival=r;SPEEDS.career=r.ai;AI_LOOKS.career=r.look;G.speed='career';hide('career');G.namesReal=[!!PROF.name,false];launch('ai');}
// every start: dress the rival; leaving career restores the normal speed
const _sg=startGame;window.startGame=startGame=function(mode,opts){
  if(mode==='ai'&&G.career!=null){const r=RIVALS[G.career];G.rival=r;SPEEDS.career=r.ai;AI_LOOKS.career=r.look;G.speed='career';}
  else if(!(mode==='ai')){if(G.speed==='career')G.speed=PROF.speed||'normal';G.career=null;G.rival=null;}
  _sg(mode,opts);if(G.rival&&mode==='ai'){P[1].look=G.rival.look;G.names=[PROF.name||t('you'),G.rival.name];}};
const _og=onGameOver;window.onGameOver=onGameOver=function(w){_og(w);const box=$c('crRes');box.innerHTML='';
  if(G.mode!=='ai'||G.career==null)return;const i=G.career,r=RIVALS[i],won=w===0;
  if(!won){box.innerHTML=`<div class="crmsg">${t('cr_lost',r.name)}</div>`;return;}
  const stars=P[0].hp>=5?3:P[0].hp>=3?2:1,c=CR(),prev=c.stars[r.id]||0,first=!prev;
  if(stars>prev)c.stars[r.id]=stars;let bonus=0;if(first){bonus=reward(i);PROF.coins+=bonus;}saveProfile();
  const nx=RIVALS[i+1];
  box.innerHTML=`<div class="crstars big">${starHTML(stars)}</div><div class="crmsg">${stars===3?t('cr_perfect'):stars===2?t('cr_good'):t('cr_close')}${bonus?` · +${bonus} 🪙`:''}</div>`+
    (nx?`<button class="btn" id="crNext">${first?t('cr_unlocked',nx.name):t('cr_next',nx.name)}</button>`:`<div class="crmsg">${t('cr_champion')}</div>`);
  box.querySelectorAll('.crstars i.on').forEach((el,k)=>el.style.animationDelay=(.25+k*.22)+'s');
  if(nx)$c('crNext').onclick=()=>{hide('over');G.career=i+1;newAch=[];only(null);inGameUI(true);startGame('ai',{twoHands:false});};};
$c('bai').onclick=openCareer;$c('crClose').onclick=()=>hide('career');
const _al=applyLang;window.applyLang=applyLang=function(){_al();document.querySelectorAll('#career [data-t]').forEach(el=>el.textContent=t(el.dataset.t));};
document.querySelectorAll('#career [data-t]').forEach(el=>el.textContent=t(el.dataset.t));
})();
