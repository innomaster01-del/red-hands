// ===== career: a ladder of 12 rivals. Beat one to unlock the next; play clean for 3 stars. =====
(()=>{
const $c=id=>document.getElementById(id);
const LK=(sleeve,skin,o={})=>Object.assign({sleeve,skin,tattoo:'tt_none',nails:'nl_none',watch:'wt_none',ring:'rg_none',sound:'sd_classic',words:'wd_classic',sparks:'sp_stars'},o);
// tp = how fast the slap lands (ms) · dodge = how often they escape · flinch = how easily they fall for a fake · tell = warning before they slap (ms) · sp = how often they use specials
const RIVALS=[
 {id:'timmy',name:'Tiny Tim',tag:'First day at the table',ai:{tp:340,aiDodge:.14,aiFlinch:.48,tell:330,aiSp:0,aim:.17},look:LK('sl_green','sk_1')},
 {id:'rose',name:'Grandma Rose',tag:'Slow, but she has seen it all',ai:{tp:315,aiDodge:.2,aiFlinch:.42,tell:290,aiSp:.05,aim:.15},look:LK('sl_candy','sk_2',{ring:'rg_silver',nails:'nl_pink'})},
 {id:'leo',name:'Lazy Leo',tag:'Would rather be napping',ai:{tp:295,aiDodge:.25,aiFlinch:.37,tell:240,aiSp:.12,aim:.13},look:LK('sl_blue','sk_3',{watch:'wt_classic'})},
 {id:'benny',name:'Big Benny',tag:'Boss · hits like a door',boss:1,ai:{tp:275,aiDodge:.31,aiFlinch:.31,tell:200,aiSp:.3,aim:.11},look:LK('sl_camo','sk_4',{tattoo:'tt_anchor',watch:'wt_digital'})},
 {id:'quinn',name:'Quick Quinn',tag:'Blink and you are red',ai:{tp:258,aiDodge:.33,aiFlinch:.28,tell:185,aiSp:.3,aim:.1},look:LK('sl_red','sk_1',{nails:'nl_red'})},
 {id:'sam',name:'Sneaky Sam',tag:'Never falls for a fake',ai:{tp:250,aiDodge:.36,aiFlinch:.14,tell:175,aiSp:.34,aim:.09},look:LK('sl_black','sk_2',{tattoo:'tt_star'})},
 {id:'ivy',name:'Iron Ivy',tag:'Dodges almost everything',ai:{tp:246,aiDodge:.43,aiFlinch:.22,tell:170,aiSp:.38,aim:.085},look:LK('sl_green','sk_3',{ring:'rg_ruby',nails:'nl_black'})},
 {id:'sting',name:'Dr. Sting',tag:'Boss · loves the special moves',boss:1,ai:{tp:238,aiDodge:.4,aiFlinch:.2,tell:150,aiSp:.6,aim:.075},look:LK('sl_flame','sk_4',{tattoo:'tt_bolt',watch:'wt_smart'})},
 {id:'fiona',name:'Flash Fiona',tag:'Gives you no warning',ai:{tp:232,aiDodge:.41,aiFlinch:.17,tell:105,aiSp:.45,aim:.07},look:LK('sl_candy','sk_1',{nails:'nl_rainbow',ring:'rg_gold'})},
 {id:'steve',name:'Stone Steve',tag:'Cold hands, colder heart',ai:{tp:226,aiDodge:.44,aiFlinch:.12,tell:110,aiSp:.5,aim:.065},look:LK('sl_black','sk_3',{tattoo:'tt_skull',watch:'wt_gold'})},
 {id:'mirage',name:'Madame Mirage',tag:'You never know which slap is real',ai:{tp:220,aiDodge:.46,aiFlinch:.1,tell:100,aiSp:.55,aim:.06},look:LK('sl_galaxy','sk_2',{nails:'nl_gold',ring:'rg_diamond'})},
 {id:'king',name:'The Red King',tag:'Final boss · nobody leaves with pale hands',boss:1,ai:{tp:212,aiDodge:.49,aiFlinch:.08,tell:90,aiSp:.6,aim:.055},look:LK('sl_gold','sk_4',{tattoo:'tt_crown',ring:'rg_diamond',watch:'wt_gold',nails:'nl_gold'})}];
window.RIVALS=RIVALS;
// what they say: before the fight, when they land one, when they take one, and at the end
const LINES={
 timmy:{intro:"Um… which hand do I use?",hit:["I did it! Did you see?!","Sorry! Was that too hard?"],hurt:["Ow ow ow!","That's allowed?!"],win:"I won?! I WON!",lose:"Can we play again tomorrow?"},
 rose:{intro:"Be gentle with an old lady, dear.",hit:["Sixty years of practice, sweetie.","Back in my day we slapped harder."],hurt:["Oh my!","Cheeky."],win:"Now go wash those red hands.",lose:"Lovely game, dear. Tea?"},
 leo:{intro:"Can we make this quick? I was napping.",hit:["Huh. That worked.","Barely moved for that one."],hurt:["Hey… I was resting that hand.","Ugh. Fine."],win:"Great. Back to bed.",lose:"Too much effort anyway."},
 benny:{intro:"Nobody gets past the door.",hit:["Door's closed.","Felt that? That's oak."],hurt:["Lucky.","You knock too loud."],win:"Come back when you're bigger.",lose:"…The door is open. Go on.",sig:'mega',sigName:'DOOR SLAM'},
 quinn:{intro:"Ready? Too late.",hit:["Blink and you missed it.","Already done."],hurt:["Whoa—okay!","You're quicker than you look."],win:"Faster next time.",lose:"Okay, okay. You're fast."},
 sam:{intro:"I can see what you're thinking.",hit:["You flinched with your eyes.","Saw that coming a mile away."],hurt:["…Didn't see that.","Interesting."],win:"I knew every move.",lose:"You surprised me. Rare."},
 ivy:{intro:"You can't hit what isn't there.",hit:["Too slow.","Try the other hand."],hurt:["A touch. Just one.","Don't get used to it."],win:"Untouched. As usual.",lose:"You actually caught me."},
 sting:{intro:"This will only hurt a lot.",hit:["Hold still for the next one.","Textbook."],hurt:["Fascinating reflexes.","Noted."],win:"The doctor is out.",lose:"Remarkable. I must study you.",sig:'bolt',sigName:'THE NEEDLE'},
 fiona:{intro:"Don't blink.",hit:["Flash!","Did you even see it?"],hurt:["Hey! No fair!","How—?"],win:"Gone in a flash.",lose:"You kept up. Nobody keeps up."},
 steve:{intro:"…",hit:["Cold.","Hm."],hurt:["…","Nothing."],win:"Next.",lose:"…Respect."},
 mirage:{intro:"Which of my slaps is the real one, darling?",hit:["That one was real.","Fooled again."],hurt:["Oh! You guessed.","Clever."],win:"It was all an illusion.",lose:"You saw through me. Bravo."},
 king:{intro:"Kneel, or leave with red hands.",hit:["Bow.","The crown does not miss."],hurt:["Insolence!","You dare?"],win:"Long live the King.",lose:"The crown… is yours.",sig:'tornado',sigName:'ROYAL DECREE'}};
RIVALS.forEach(r=>Object.assign(r,{q:LINES[r.id]}));
let sayT=0;function say(txt,ms){const el=document.getElementById('rvSay');if(!el||!G.rival||!txt)return;clearTimeout(sayT);el.querySelector('b').textContent=G.rival.name;el.querySelector('span').textContent=txt;el.className='';void el.offsetWidth;
  sayT=setTimeout(()=>{el.classList.add('out');sayT=setTimeout(()=>el.classList.add('hide'),320);},ms||2000);}
const hush=()=>{clearTimeout(sayT);const el=document.getElementById('rvSay');if(el)el.className='hide';};
const pick=a=>a[(Math.random()*a.length)|0];
let hp0=[5,5];
const _up=update;window.update=update=function(dt,rdt){_up(dt,rdt);if(!G.rival||G.mode!=='ai'||G.demo)return;
  if(P[0].hp<hp0[0]&&P[0].hp>0&&Math.random()<.7)say(pick(G.rival.q.hit),1700);
  if(P[1].hp<hp0[1]&&P[1].hp>0&&Math.random()<.6)say(pick(G.rival.q.hurt),1500);
  hp0=[P[0].hp,P[1].hp];if(G.phase==='fatal'||G.phase==='finish')hush();};
// bosses own a signature move: one of the specials, under their own name, thrown without warning every so often
const _ss=startStrike;window.startStrike=startStrike=function(k,type,forced,dir,special){const r=G.rival,q=r&&r.q;
  if(q&&q.sig&&G.mode==='ai'&&G.att===1&&!forced&&!special&&G.t-(G.sigT||-1e9)>8000&&Math.random()<.4){G.sigT=G.t;_ss(k,'normal',forced,dir,q.sig);if(G.banner)G.banner.text=q.sigName;say(q.sigName+'!',1300);return;}
  _ss(k,type,forced,dir,special);};
const _gov=gameOver;window.gameOver=gameOver=function(w,q){_gov(w,q);if(G.rival&&G.mode==='ai')setTimeout(()=>{if(G.rival&&G.phase==='over')say(w===1?G.rival.q.win:G.rival.q.lose,2600);},700);};
const _tmn=toMenu;window.toMenu=toMenu=function(){hush();_tmn();};
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
    const lvl=Math.min(5,1+Math.floor(i/2.4));
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
  _sg(mode,opts);hush();if(G.rival&&mode==='ai'){P[1].look=G.rival.look;G.names=[PROF.name||t('you'),G.rival.name];hp0=[5,5];G.sigT=G.t;const r=G.rival;setTimeout(()=>{if(G.rival===r&&G.mode==='ai'&&!G.demo)say(r.q.intro,2300);},500);}};
const _og=onGameOver;window.onGameOver=onGameOver=function(w){_og(w);const box=$c('crRes');box.innerHTML='';
  if(G.mode!=='ai'||G.career==null)return;const i=G.career,r=RIVALS[i],won=w===0;
  if(!won){$c('winTxt').textContent=t('go_2p',r.name);box.innerHTML=`<div class="crmsg">${t('cr_lost',r.name)}</div>`;return;}
  if(r.boss){PROF.stats.hardWins=(PROF.stats.hardWins||0)+1;try{unlockAch('boss');}catch(e){}}
  const stars=P[0].hp>=5?3:P[0].hp>=3?2:1,c=CR(),prev=c.stars[r.id]||0,first=!prev;
  const prizes=first?ITEMS.filter(it=>it.boss===r.id):[];if(stars>prev)c.stars[r.id]=stars;let bonus=0;if(first){bonus=reward(i);PROF.coins+=bonus;}saveProfile();
  const nx=RIVALS[i+1];
  box.innerHTML=`<div class="crstars big">${starHTML(stars)}</div><div class="crmsg">${stars===3?t('cr_perfect'):stars===2?t('cr_good'):t('cr_close')}${bonus?` · +${bonus} 🪙`:''}</div>`+(prizes.length?`<div class="crprize">🎁 ${t('cr_prize',prizes.map(it=>it.n.en).join(' + '))}</div>`:'')+
    (nx?`<button class="btn" id="crNext">${first?t('cr_unlocked',nx.name):t('cr_next',nx.name)}</button>`:`<div class="crmsg">${t('cr_champion')}</div>`);
  box.querySelectorAll('.crstars i.on').forEach((el,k)=>el.style.animationDelay=(.25+k*.22)+'s');
  if(nx)$c('crNext').onclick=()=>{hide('over');G.career=i+1;newAch=[];only(null);inGameUI(true);startGame('ai',{twoHands:false});};};
if(PROF.lang!=='en'){PROF.lang='en';saveProfile();}try{applyLang();}catch(e){}
$c('bai').onclick=openCareer;$c('crClose').onclick=()=>hide('career');
const _al=applyLang;window.applyLang=applyLang=function(){_al();document.querySelectorAll('#career [data-t]').forEach(el=>el.textContent=t(el.dataset.t));};
document.querySelectorAll('#career [data-t]').forEach(el=>el.textContent=t(el.dataset.t));
})();
