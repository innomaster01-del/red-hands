// ===== UI: menus, shop, stats, leaderboard, settings, game over, tutorial =====
const $=id=>document.getElementById(id);
const GAME_URL='https://innomaster01-del.github.io/red-hands/';
const SCREENS=['menu','shop','stats','lb','settings','pre','over','moves','chal','guide'];
function show(id){$(id).classList.remove('hide')}function hide(id){$(id).classList.add('hide')}
const TABS=['menu','moves','shop','stats','settings','lb'];
function only(id){SCREENS.forEach(s=>s===id?show(s):hide(s));const tb=$('tabbar');tb.classList.toggle('hide',!TABS.includes(id));
  const act=id==='lb'?'stats':id;tb.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.tab===act));if(id!=='shop')stopPreview();if(id==='menu')refreshMenu();}
let newAch=[];

function applyLang(){
  LANG=PROF.lang||'he';document.documentElement.lang=LANG;document.documentElement.dir=LANG==='he'?'rtl':'ltr';
  document.title=t('title');
  document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
  $('logo').innerHTML=t('logo_html');
  $('brt').textContent=t('btn_rt');document.querySelectorAll('#swipeSeg button').forEach(b=>b.textContent=t('sw_'+b.dataset.s));
  $('b2p').textContent=t('btn_2p');$('bai').textContent=t('btn_ai');$('bon').innerHTML=t('btn_online')+` <small>${t('soon')}</small>`;
  document.querySelectorAll('#speed button').forEach(b=>b.textContent=t('sp_'+b.dataset.s));document.querySelectorAll('#annSeg button').forEach(b=>b.textContent=t('ann_'+b.dataset.a));
  document.querySelectorAll('#lbTabs button').forEach(b=>b.textContent=t('lb_'+b.dataset.k));
  document.querySelectorAll('#langSeg button').forEach(b=>b.classList.toggle('on',b.dataset.l===LANG));
  refreshMenu();
}
function refreshMenu(){
  const li=levelInfo(PROF.xp);
  $('mLv').textContent=li.lvl;$('mName').textContent=PROF.name||t('set_name_ph');$('mXp').style.width=Math.round(li.cur/li.need*100)+'%';
  $('mCoins').textContent='🪙 '+PROF.coins;
  document.querySelectorAll('#speed button').forEach(b=>b.classList.toggle('on',b.dataset.s===G.speed));
  const ok=hasUnlock('twohands');
  $('thTog').classList.toggle('locked',!ok);$('thTog').classList.toggle('on',ok&&PROF.twoHands);
  $('thTxt').textContent=t('two_hands');
  $('thReq').textContent=ok?t('two_hands_desc'):t('two_hands_req',TH_LVL,TWOHANDS_ACH,li.lvl,Object.keys(PROF.ach).length);
  $('mute').textContent=G.muted?'🔇':'🔊';
}
function toast(ic,txt){if(G.quietToasts)return;const d=document.createElement('div');d.className='toast';d.innerHTML=`<b>${ic}</b><span></span>`;d.querySelector('span').textContent=txt;$('toasts').appendChild(d);setTimeout(()=>{d.style.transition='opacity .4s';d.style.opacity=0;setTimeout(()=>d.remove(),450);},2600);}
function unlockAch(id){if(PROF.ach[id])return;PROF.ach[id]=Date.now();newAch.push(id);saveProfile();const a=ACH.find(a=>a.id===id);toast(a.ic,t('ach_unlocked')+' '+t('ach_'+id));if(G.mode!=='demo'&&!G.demo)sfxTone([784,988,1319],'triangle',.12,.15,.07);}

// ---------- start flows ----------
function inGameUI(on){$('exit').style.display=on?'block':'none';$('mute').style.display=on?'block':'none';$('help').style.display=on?'block':'none';}
const DEMO={tap:'<i class="rp"></i><i class="h">👆</i>',dodge:'<i class="x">👋</i><i class="h">✋</i>',feint:'<i class="h">✋</i>',combo:'<i>x2</i><i>x3</i><i>x4</i><i>x5</i>',
  special:()=>`<span class="drawn">${glyphSVG('zig',46)}</span>`,diag:'<span class="drawn"><svg class="glyph" width="46" height="46" viewBox="0 0 46 46"><path d="M10 36L36 10M36 10H20M36 10V26" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',breaker:'<i>🛡️</i><i class="b2">💥</i>',fatal:()=>`<span class="drawn">${glyphSVG('vee',46)}</span>`};
let guideNext=null;
function showGuide(next){guideNext=next||null;$('gTitle').textContent=t('guide_title');$('gGo').textContent=t('guide_go');
  $('gList').innerHTML=tr('guide').map((g,i)=>`<div class="gc" style="animation-delay:${i*50}ms"><div class="demo d-${g[0]}">${typeof DEMO[g[0]]==='function'?DEMO[g[0]]():DEMO[g[0]]}</div><div><b>${g[1]?g[1]+' ':''}${g[2]}</b><span>${g[3]}</span></div></div>`).join('');
  if(G.phase!=='idle'&&!G.demo)G.paused=true;show('guide');}
$('gGo').onclick=()=>{hide('guide');G.paused=false;PROF.guideSeen=1;saveProfile();const n=guideNext;guideNext=null;if(n)n();};
$('help').onclick=()=>showGuide();
function launch(mode,names){try{fvPreload(0);}catch(e){}
  if(!PROF.tutorialDone){startTutorial(()=>launch(mode,names));return;}
  if(!PROF.guideSeen&&mode!=='react'){showGuide(()=>launch(mode,names));return;}
  newAch=[];only(null);inGameUI(true);
  startGame(mode,{twoHands:PROF.twoHands&&hasUnlock('twohands'),names});
}
$('b2p').onclick=()=>{initAudio();$('n0').value=PROF.name||'';$('n1').value=PROF.lastOpp||'';only('pre');};
$('preGo').onclick=()=>{const a=$('n0').value.trim(),b=$('n1').value.trim();if(b){PROF.lastOpp=b;}if(a&&!PROF.name)PROF.name=a;saveProfile();
  G.namesReal=[!!a,!!b];launch('2p',[a||t('blue'),b||t('red')]);};
$('brt').onclick=()=>{initAudio();launch('react');};
$('bai').onclick=()=>{initAudio();G.namesReal=[!!PROF.name,false];launch('ai');};
$('thTog').onclick=()=>{if(!hasUnlock('twohands')){toast('🔒',t('two_hands_req',TH_LVL,TWOHANDS_ACH,levelInfo(PROF.xp).lvl,Object.keys(PROF.ach).length));return;}PROF.twoHands=!PROF.twoHands;saveProfile();refreshMenu();};
$('speed').onclick=e=>{const b=e.target.closest('button');if(!b)return;G.speed=b.dataset.s;PROF.speed=G.speed;saveProfile();refreshMenu();};
document.querySelectorAll('#tabbar button').forEach(b=>b.onclick=()=>openScreen(b.dataset.tab));
$('toLb').onclick=()=>openScreen('lb');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{stopPreview();const pg=b.closest('.ov').id;if(pg==='lb')openScreen('stats');else{only('menu');refreshMenu();}});
$('profChip').onclick=()=>openScreen('settings');
$('navTut').onclick=()=>startTutorial(()=>{only('menu');});
function practiceFinishers(){initAudio();only(null);inGameUI(true);startGame('ai',{});G.practice=true;G.att=0;P[1].hp=0;P[0].hp=MAXHP;toFinish(0);}
function toMenu(){clearFx();showTrainCard(null);G.train=null;G.practice=false;only('menu');inGameUI(false);hide('tut');G.phase='idle';msgs=[];parts=[];startDemo();refreshMenu();}
$('exit').onclick=toMenu;$('toMenu').onclick=toMenu;
$('again').onclick=()=>{newAch=[];only(null);inGameUI(true);startGame(G.lastMode,{twoHands:G.twoHands,names:G.names});};
$('mute').onclick=()=>{G.muted=!G.muted;PROF.muted=G.muted;saveProfile();refreshMenu();};
function openScreen(id){initAudio();only(id);if(id==='shop')openShop();if(id==='stats')renderStats();if(id==='lb')renderLB();if(id==='settings')openSettings();if(id==='moves')renderMoves();}

// ---------- tutorial ----------
let tutNext=null;
function startTutorial(next){tutNext=next;only(null);inGameUI(true);show('tut');onTutStep(1);startGame('tut');}
function onTutStep(n){if(n===4)P[0].streak=2;$('tutStepTxt').textContent=t('tut_step',n);document.querySelectorAll('.tut .dots i').forEach((d,i)=>d.classList.toggle('on',i<n));
  $('tutTitle').textContent=t('tut'+n+'_t');$('tutText').textContent=t('tut'+n+'_d');}
function onTutorialDone(){hide('tut');const first=!PROF.tutorialDone;PROF.tutorialDone=true;if(first){PROF.coins+=50;toast('🎓',t('tut_done_reward'));}else toast('🎓',t('tut_done'));saveProfile();
  setTimeout(()=>{const n=tutNext;tutNext=null;G.phase='idle';if(n)n();else toMenu();if(!$('menu').classList.contains('hide'))startDemo();},900);}
$('tutSkip').onclick=()=>{G.tutStep=4;G.tutAdvance=true;G.phase='idle';onTutorialDone();};

// ---------- game over ----------
function onGameOver(w){
  const mode=G.mode,gs=G.gs,st=PROF.stats;G.lastMode=mode;G.quietToasts=true;$('toasts').innerHTML='';
  const before=levelInfo(PROF.xp).lvl;let coins=0,xp=0;
  const humans=[0]; // only the profile owner (blue, bottom) feeds personal stats
  humans.forEach(p=>{const g=gs[p];st.hits+=g.hits;st.dodges+=g.dodges;st.attempts+=g.attempts;st.flinches+=g.flinches;st.feintsOk+=g.feintsOk;
    st.breaks+=g.breaks;st.bestCombo=Math.max(st.bestCombo,g.maxCombo);st.bestDodgeRun=Math.max(st.bestDodgeRun,g.maxRun);st.reactSum+=g.reactSum;st.reactN+=g.reactN;
    if(g.bestReact!=null)st.bestReact=st.bestReact==null?g.bestReact:Math.min(st.bestReact,g.bestReact);});
  st.games++;
  const wp=P[w];
  if(mode==='ai'){st.aiGames++;const won=w===0;
    if(won){st.wins++;st.winStreak++;st.bestWinStreak=Math.max(st.bestWinStreak,st.winStreak);unlockAch('first_win');
      if(G.speed==='hard'){st.hardWins++;unlockAch('boss');}if(P[0].hp===MAXHP)unlockAch('no_mercy');if(P[0].hp===1)unlockAch('close_call');if(gs[0].flinches===0)unlockAch('zen');if(st.winStreak>=3)unlockAch('streak3');
      coins=40+5*gs[0].hits+(P[0].hp===MAXHP?30:0)+(G.speed==='hard'?25:G.speed==='normal'?10:0);xp=90+6*gs[0].hits+8*gs[0].dodges;}
    else{st.losses++;st.winStreak=0;coins=10+3*gs[0].hits;xp=40+4*gs[0].hits+6*gs[0].dodges;}
  }else{coins=20+2*(gs[0].hits+gs[1].hits);xp=50+3*(gs[0].hits+gs[1].hits)+4*(gs[0].dodges+gs[1].dodges);
    if(w===0){unlockAch('first_win');if(wp.hp===MAXHP)unlockAch('no_mercy');if(wp.hp===1)unlockAch('close_call');if(gs[0].flinches===0)unlockAch('zen');}}
  coins+=10*humans.reduce((s,p)=>s+gs[p].breaks,0);
  const fatal=G.fatalDone&&w===0;if(fatal){coins+=40;xp+=40;st.fatal=(st.fatal||0)+1;}
  if(G.twoHands){coins=Math.round(coins*1.5);xp=Math.round(xp*1.5);}
  if(st.games>=25)unlockAch('veteran');
  PROF.coins+=coins;PROF.xp+=xp;
  const rec=(name,p,won,real)=>{if(!real)return;const e=hofEntry(name);if(!e)return;e.games++;if(won){e.wins++;if(mode==='ai'&&G.speed==='hard')e.bossWins++;}
    if(gs[p].bestReact!=null)e.bestReact=e.bestReact==null?gs[p].bestReact:Math.min(e.bestReact,gs[p].bestReact);e.bestCombo=Math.max(e.bestCombo,gs[p].maxCombo);};
  if(mode==='ai')rec(PROF.name,0,w===0,!!PROF.name);else[0,1].forEach(p=>rec(G.names[p],p,w===p,G.namesReal&&G.namesReal[p]));
  saveProfile();
  const after=levelInfo(PROF.xp);
  // texts
  const lose=1-w,sc=`${MAXHP-P[lose].hp} : ${MAXHP-P[w].hp}`;
  let title;if(mode==='ai')title=w===0?t('go_win'):t('go_cpu');else title=t('go_2p',G.names[w]);
  $('winTxt').textContent=title;$('winTxt').style.color=w===0?'#7fa8ff':'#ff6a7a';
  $('scoreTxt').textContent=sc;
  $('rew').innerHTML=`<div>🪙 +${coins}</div><div>⭐ +${xp} XP</div>`+(fatal?`<div>${t('fin_bonus')}</div>`:'');
  let lv='';if(after.lvl>before){const un=UNLOCKS.filter(u=>u.lvl>before&&u.lvl<=after.lvl).map(u=>unlockName(u.key));lv=`<div class="lvup">🎉 ${t('lvup',after.lvl)}${un.length?'<br>'+t('unlocked')+' '+un.join(' · '):''}</div>`;}
  $('lvBox').innerHTML=lv;
  $('newAch').innerHTML=newAch.map(id=>{const a=ACH.find(x=>x.id===id);return`<span>${a.ic} ${t('ach_'+id)}</span>`;}).join('');
  // share
  const txt=shareText(w);G.shareTxt=txt;
  $('waBtn').href='https://wa.me/?text='+encodeURIComponent(txt+'\n'+GAME_URL);
  buildShareCard(w,sc).then(url=>{$('shareImg').src=url;});
  setChallengeBtn($('chBtn'),PROF.stats.bestReact);
  only('over');inGameUI(false);G.quietToasts=false;
}
function unlockName(k){if(k==='diag')return t('unl_diag');if(k==='double')return t('unl_double');if(k==='twohands')return t('unl_twohands');const it=item(k);return it?(it.ic+' '+it.n[LANG]):k;}
function shareText(w){const lose=1-w,hits=MAXHP-P[lose].hp,got=MAXHP-P[w].hp;
  if(G.mode==='ai')return w===0?t('sh_ai_win',hits,got,PROF.stats.bestReact):t('sh_ai_lose',got);
  return w===0?t('sh_2p_win',G.names[1],hits,got):t('sh_2p_lose',G.names[1],MAXHP);}
$('copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(G.shareTxt+'\n'+GAME_URL);toast('📋',t('copied'));}catch(e){toast('⚠️',t('copy_fail'));}};
let DL=null;
try{if(window.claude&&claude.use)claude.use('downloads').then(d=>{DL=d;if(d){$('saveBtn').style.display='';$('saveNote').style.display='none';}}).catch(()=>{});}catch(e){}
$('saveBtn').onclick=async()=>{if(!DL)return;try{const blob=await (await fetch($('shareImg').src)).blob();await DL.save({filename:'red-hands.png',data:blob});}catch(e){toast('⚠️',t('save_fail'));}};
function buildShareCard(w,sc){
  const S=1080,c=document.createElement('canvas');c.width=S;c.height=S;const x=c.getContext('2d');
  drawArena(x,PROF.equip.arena,S,S,0);
  x.fillStyle='rgba(20,10,60,.35)';x.fillRect(0,0,S,S);
  const lose=1-w,lp=P[lose];
  const lh=lp.hands[0];x.save();x.translate(S/2,S*0.36);x.rotate(-0.12);drawHandShape(x,330,{palmUp:false,look:lp.look,red:0.25,bruise:MAXHP-lp.hp,marks:lh.marks.slice(-5).map(m=>({...m,_cv:null,_k:null,x:m.x*330/L,y:(m.y||0.45*L)*330/L})),sleeveLen:700,onTop:true,t:0,fx:{ice:lh.ice||0,char:lh.char||0}});x.restore();
  if(G.fatalDone){const f=FINISHERS.find(z=>z.id===G.fatalDone);if(f)outlinedText(x,f.ic+' '+t('fin_'+f.id)+'!',S/2,S*0.66,80,'#ff4d6d');}
  for(let i=0;i<10;i++){x.save();x.translate(S/2+Math.cos(i*.63)*360,S*0.44+Math.sin(i*.63)*240);x.fillStyle=['#ffd23f','#fff','#ff4d6d'][i%3];starPath(x,22);x.fill();x.restore();}
  const head=G.mode==='ai'?(w===0?t('card_win'):t('card_lose')):t('card_2p',G.names[w]);
  outlinedText(x,head,S/2,S*0.08,74,'#fff');
  x.fillStyle='rgba(0,0,0,.35)';x.fill(rrPath(S/2-260,S*0.73,520,150,40));
  outlinedText(x,sc,S/2,S*0.80,120,'#ffd23f',OUT,900,'ltr');
  const br=G.gs.reduce((m,g)=>g.bestReact!=null&&(m==null||g.bestReact<m)?g.bestReact:m,null);
  if(br!=null)outlinedText(x,t('card_react',Math.round(br)),S/2,S*0.92,48,'#9fe7ff');
  outlinedText(x,t('title')+' 🖐️',S/2,S*0.985-20,44,'#fff');
  return Promise.resolve(c.toDataURL('image/png'));
}

// ---------- reaction test & challenge ----------
function chLink(ms){return GAME_URL+'#ch-'+Math.round(ms);}
function setChallengeBtn(el,ms){if(ms==null){el.style.display='none';return;}el.style.display='';el.textContent=t('ch_btn',Math.round(ms));
  el.href='https://wa.me/?text='+encodeURIComponent(t('ch_share',Math.round(ms))+'\n'+chLink(ms));}
function onReactDone(){const g=G.gs[0],st=PROF.stats;G.lastMode='react';G.quietToasts=true;$('toasts').innerHTML='';
  st.dodges+=g.dodges;st.attempts+=g.attempts;st.flinches+=g.flinches;st.reactSum+=g.reactSum;st.reactN+=g.reactN;st.games++;
  const best=g.bestReact;let rec=false;if(best!=null){if(st.bestReact==null||best<st.bestReact){st.bestReact=best;rec=true;}if(best<180)unlockAch('lightning');}
  const e=PROF.name?hofEntry(PROF.name):null;if(e&&best!=null)e.bestReact=e.bestReact==null?best:Math.min(e.bestReact,best);
  const coins=15+5*g.dodges,xp=30+8*g.dodges;PROF.coins+=coins;PROF.xp+=xp;saveProfile();
  $('winTxt').textContent=best!=null?`⚡ ${Math.round(best)}ms`:t('rt_none');$('winTxt').style.color='#3b7bff';
  let sub=t('rt_dodged',g.dodges,5);if(rec)sub+=' · '+t('rt_record');
  if(G.challenge){sub+='\n'+(best!=null&&best<G.challenge?t('ch_won',G.challenge):t('ch_lost',best!=null?Math.round(best-G.challenge):null));}
  $('scoreTxt').textContent=sub;$('scoreTxt').style.whiteSpace='pre-line';
  $('rew').innerHTML=`<div>🪙 +${coins}</div><div>⭐ +${xp} XP</div>`;$('lvBox').innerHTML='';
  $('newAch').innerHTML=newAch.map(id=>{const a=ACH.find(x=>x.id===id);return`<span>${a.ic} ${t('ach_'+id)}</span>`;}).join('');
  const ms=best!=null?best:st.bestReact;G.shareTxt=ms!=null?t('ch_share',Math.round(ms)):t('tagline');
  $('waBtn').href='https://wa.me/?text='+encodeURIComponent(G.shareTxt+'\n'+(ms!=null?chLink(ms):GAME_URL));
  buildReactCard(best).then(u=>$('shareImg').src=u);
  setChallengeBtn($('chBtn'),null);
  only('over');inGameUI(false);G.quietToasts=false;}
function buildReactCard(best){const S=1080,c=document.createElement('canvas');c.width=S;c.height=S;const x=c.getContext('2d');drawArena(x,PROF.equip.arena,S,S,0);
  x.save();x.translate(S/2,S*0.2);drawHandShape(x,300,{palmUp:false,look:PROF.equip,sleeveLen:400,onTop:true,t:0});x.restore();
  outlinedText(x,t('rt_card'),S/2,S*0.1,70,'#fff');x.fillStyle='rgba(20,10,60,.55)';x.fill(rrPath(S/2-300,S*0.62,600,190,50));
  outlinedText(x,best!=null?Math.round(best)+'ms':'—',S/2,S*0.715,150,'#ffd23f',OUT,900,'ltr');outlinedText(x,t('rt_card2'),S/2,S*0.9,52,'#9fe7ff');
  return Promise.resolve(c.toDataURL('image/png'));}
(function(){const m=(location.hash||'').match(/^#ch-(\d{2,4})$/);if(!m)return;G.challenge=+m[1];
  $('chText').textContent=t('ch_text',G.challenge);setTimeout(()=>{only('chal');},300);})();
$('chGo').onclick=()=>{initAudio();launch('react');};$('chNo').onclick=()=>{only('menu');};

// ---------- shop ----------
let shopCat='sleeve',tent=null,pvRAF=0,pvParts=[],pvBurstT=0;
function openShop(){tent=null;renderShop();startPreview();}
function renderShop(){
  $('sCoins').textContent='🪙 '+PROF.coins;
  $('sTabs').innerHTML=CATS.map(c=>`<button data-c="${c.id}" class="${c.id===shopCat?'on':''}">${c.ic} ${t('cat_'+c.id)}</button>`).join('');
  $('sTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{shopCat=b.dataset.c;tent=null;renderShop();});
  const lvl=levelInfo(PROF.xp).lvl;
  $('sGrid').innerHTML=ITEMS.filter(i=>i.cat===shopCat).map(i=>{
    const eq=PROF.equip[i.cat]===i.id,own=owns(i.id),locked=i.cat==='arena'&&lvl<i.lvl;
    let sw;if(i.cat==='sleeve')sw=`background:linear-gradient(135deg,${i.dark},${i.main},${i.light})`;else if(i.cat==='skin')sw=`background:linear-gradient(135deg,${i.c[0]},${i.c[2]})`;
    else if(i.cat==='nails'&&i.col&&i.col!=='rainbow')sw=`background:${i.col}`;else if(i.cat==='ring')sw=`background:radial-gradient(circle,#fff 0 30%,${i.col} 31% 60%,#fff 61%)`;else sw='background:#efecff';
    const ic=(i.cat==='sleeve'||i.cat==='skin'||(i.cat==='nails'&&i.col&&i.col!=='rainbow')||i.cat==='ring')?(i.gem?'💎':''):(i.ic||'');
    const pr=eq?`<span class="pr eq">✓ ${t('equipped')}</span>`:(i.boss&&!own)?`<span class="pr lock">🔒 ${t('boss_item',(window.RIVALS||[]).find(r=>r.id===i.boss).name)}</span>`:locked?`<span class="pr lock">🔒 ${t('lvl')} ${i.lvl}</span>`:own?`<span class="pr own">${t('owned')}</span>`:`<span class="pr">🪙 ${i.price}</span>`;
    return`<button class="it ${tent===i.id?'sel':''}" data-id="${i.id}"><div class="sw" style="${sw}">${ic}</div><div class="nm">${i.n[LANG]}</div>${pr}</button>`;}).join('');
  $('sGrid').querySelectorAll('.it').forEach(b=>b.onclick=()=>pickItem(b.dataset.id));
  renderBuyBar();
}
function pickItem(id){const i=item(id);
  if(i.cat==='sound')previewSound(id);
  if(i.cat==='arena'&&!owns(id)){toast('🔒',t('arena_lock',i.lvl));tent=id;renderShop();return;}
  if(i.boss&&!owns(id)){toast('🔒',t('boss_item',(window.RIVALS||[]).find(r=>r.id===i.boss).name));tent=null;renderShop();return;}
  if(owns(id)){PROF.equip[i.cat]=id;saveProfile();tent=null;sfxUI();}
  else tent=id;
  pvBurstT=0;renderShop();}
function renderBuyBar(){const bb=$('buyBar');if(!tent||owns(tent)){bb.innerHTML='';return;}const i=item(tent);
  if(i.cat==='arena'){bb.innerHTML='';return;}
  const can=PROF.coins>=i.price;
  bb.innerHTML=can?`<button class="btn by" id="buyGo">${t('buy',i.n[LANG],i.price)}</button>`:`<button class="btn b3" disabled>${t('need_more',i.price-PROF.coins)}</button><p class="note">${t('earn_tip')}</p>`;
  if(can)$('buyGo').onclick=()=>{PROF.coins-=i.price;PROF.owned[i.id]=1;PROF.equip[i.cat]=i.id;PROF.stats.bought++;saveProfile();tent=null;
    toast(i.ic||'🛍️',t('bought',i.n[LANG]));if(PROF.stats.bought>=5)unlockAch('fashion');sfxUI(true);renderShop();};}
function sfxUI(big){const d=G.demo;G.demo=false;sfxTone(big?[660,880,1320]:[880],'triangle',.1,.15,.07);G.demo=d;}
function previewSound(id){initAudio();const d=G.demo;G.demo=false;sfxHit(id,1);G.demo=d;}
function startPreview(){stopPreview();const c=$('pv');pvParts=[];pvBurstT=0;let lastT=performance.now();
  const tick=now=>{const dt=Math.min(40,now-lastT);lastT=now;const r=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
    if(c.width!==Math.round(r.width*dpr)){c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);}
    const x=c.getContext('2d'),w=r.width,h=r.height;x.setTransform(dpr,0,0,dpr,0,0);
    const look=Object.assign({},PROF.equip);if(tent){look[item(tent).cat]=tent;}
    drawArena(x,look.arena,w,h,now);
    const hl=Math.min(h*0.62,w*0.3);
    // defender (palm down) at right, attacker (palm up) at left, both pointing up
    x.save();x.translate(w*0.68,h*0.16+Math.sin(now/700)*3);drawHandShape(x,hl,{palmUp:false,look,sleeveLen:h,onTop:true,t:now,marks:[]});x.restore();
    x.save();x.translate(w*0.3,h*0.2+Math.sin(now/700+1)*3);drawHandShape(x,hl,{palmUp:true,look,sleeveLen:h,t:now});x.restore();
    const cat=tent?item(tent).cat:shopCat;
    if(['words','sparks','win','sound'].includes(cat)){pvBurstT-=dt;if(pvBurstT<=0){pvBurstT=1500;
      const sp=look.sparks,cols={sp_stars:['#ffd23f','#fff','#ff4d6d'],sp_hearts:['#ff4d6d','#ff7ac8'],sp_fire:['#ff3b1f','#ff9f1c','#ffd23f'],sp_confetti:['#ffd23f','#3b7bff','#3ee08f'],sp_coins:['#f5c542']}[sp]||['#fff'];
      const shape={sp_stars:'star',sp_hearts:'heart',sp_fire:'fire',sp_confetti:'conf',sp_coins:'coin'}[sp];
      for(let i=0;i<16;i++){const a=rand(0,PI*2),s=rand(1,3);pvParts.push({x:w/2,y:h/2,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:700,t:now,col:cols[i%cols.length],shape,sz:rand(6,10),rot:rand(0,6)});}
      const wl=(item(look.words)||item('wd_classic')).w[LANG];pvParts.push({burst:true,txt:wl[(Math.random()*wl.length)|0],t:now,life:900});}}
    if(cat==='win'){x.font='56px serif';x.textAlign='center';x.textBaseline='middle';x.fillText(item(look.win).ic,w/2,h/2+Math.sin(now/300)*6);}
    pvParts=pvParts.filter(q=>now-q.t<q.life);
    pvParts.forEach(q=>{const u=(now-q.t)/q.life;x.save();
      if(q.burst){const s=u<.2?u/.2*1.1:1.1-(u-.2)*.15;x.globalAlpha=u>.7?1-(u-.7)/.3:1;x.translate(w/2,h/2);x.scale(s,s);const R=48;
        x.beginPath();for(let i=0;i<24;i++){const rr=i%2?R*.62:R,an=i*PI/12;x.lineTo(Math.cos(an)*rr,Math.sin(an)*rr);}x.closePath();x.fillStyle='#ffd23f';x.strokeStyle=OUT;x.lineWidth=4;x.fill();x.stroke();
        outlinedText(x,q.txt,0,2,q.txt.length>5?16:20,'#ff3b5c');}
      else{q.x+=q.vx*dt/16;q.y+=q.vy*dt/16;x.globalAlpha=1-u;x.translate(q.x,q.y);x.fillStyle=q.col;
        if(q.shape==='heart'){x.scale(q.sz/12,q.sz/12);x.translate(0,-8);x.fill(HEART);}else if(q.shape==='star'){starPath(x,q.sz);x.fill();}else{x.beginPath();x.arc(0,0,q.sz/2,0,PI*2);x.fill();}}
      x.restore();});
    pvRAF=requestAnimationFrame(tick);};
  pvRAF=requestAnimationFrame(tick);}
function stopPreview(){cancelAnimationFrame(pvRAF);pvRAF=0;}

// ---------- stats ----------
function renderStats(){const s=PROF.stats,li=levelInfo(PROF.xp);
  const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';
  const tiles=[
    ['big',s.bestReact!=null?Math.round(s.bestReact)+' ms':'—',t('st_best_react')],
    ['',s.reactN?Math.round(s.reactSum/s.reactN)+' ms':'—',t('st_avg_react')],['',pct(s.dodges,s.attempts),t('st_dodge')],
    ['',li.lvl,t('st_level')],['',s.games,t('st_games')],
    ['',s.wins+' / '+s.aiGames,t('st_ai_wins')],['',s.hardWins,t('st_boss')],
    ['',s.bestCombo,t('st_combo')],['',s.bestWinStreak,t('st_streak')],
    ['',s.feintsOk,t('st_feints')],['',s.flinches,t('st_flinches')],
    ['',s.hits,t('st_hits')],['',s.bestDodgeRun,t('st_dodge_run')],['',s.breaks||0,t('st_breaks')],['',s.fatal||0,t('st_fatal')]];
  $('tiles').innerHTML=tiles.map(([c,v,k])=>`<div class="tile ${c}"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');
  const n=Object.keys(PROF.ach).length;$('achHead').textContent=`${t('ach_title')} ${n}/${ACH.length}`;
  setChallengeBtn($('chBtn2'),PROF.stats.bestReact);
  $('achs').innerHTML=ACH.map(a=>`<div class="ach ${PROF.ach[a.id]?'':'lock'}"><div class="ic">${a.ic}</div><div><b>${t('ach_'+a.id)}</b><span>${t('achd_'+a.id)}</span></div></div>`).join('');
}
// ---------- moves ----------
const MOVES=[{id:'tap',ic:'👋'},{id:'feint',ic:'🎭'},{id:'dodge',ic:'🛡️'},{id:'diag',ic:'↗️',unl:'diag'},{id:'two',ic:'✋✋',unl:'twohands'}];
function renderMoves(){const li=levelInfo(PROF.xp),achN=Object.keys(PROF.ach).length;
  const nxt=UNLOCKS.find(u=>!hasUnlock(u.key));
  if(nxt){const need=xpToLevel(nxt.lvl),prev=xpToLevel(li.lvl);const left=Math.max(0,need-PROF.xp);const lvlOk=li.lvl>=nxt.lvl;
    const pct=lvlOk?100:Math.round((PROF.xp-xpToLevel(1))/(need)*100);
    $('mvNext').innerHTML=`<div class="nextbox"><b>${t('mv_next')} ${unlockName(nxt.key)}</b><div style="font-size:13px;opacity:.9;margin-top:3px">${lvlOk?t('two_hands_req',TH_LVL,TWOHANDS_ACH,li.lvl,achN):t('mv_left',left,nxt.lvl)}</div><div class="bar"><i style="width:${Math.min(100,pct)}%"></i></div></div>`;}
  else $('mvNext').innerHTML=`<div class="nextbox"><b>${t('mv_all')}</b></div>`;
  $('mvList').innerHTML=MOVES.map(m=>{const ok=!m.unl||hasUnlock(m.unl);const u=m.unl&&UNLOCKS.find(x=>x.key===m.unl);
    let st=ok?`<span class="st">✓ ${t('mv_open')}</span>`:`<span class="st lk">🔒 ${t('lvl')} ${u.lvl}${m.unl==='twohands'?' + '+TWOHANDS_ACH+' 🏅':''}</span>`;
    return`<div class="ach ${ok?'':'lock'}" style="${ok?'':'filter:none;opacity:.75'}"><div class="ic">${m.ic}</div><div><b>${t('mv_'+m.id)}</b><span>${t('mvd_'+m.id)}</span></div>${st}</div>`;}).join('');
  $('mvSpecials').innerHTML=SPECIALS.map(sp=>`<div class="ach mv"><div class="ic gl-ic">${glyphSVG(sp.shape,40)}</div><div><b>${t('sp_'+sp.id)}</b><span>${t('spd_'+sp.id)}</span></div><span class="cost">⚡${sp.cost}</span></div>`).join('');
  $('mvFins').innerHTML=FINISHERS.map(f=>`<div class="ach mv"><div class="ic gl-ic">${glyphSVG(f.shape,40)}</div><div><b>${t('fin_'+f.id)}</b><span>${t('find_'+f.id)}</span></div></div>`).join('')+`<button class="btn b2 sm" id="pracBtn">${t('practice_btn')}</button><button class="btn b1 sm" id="trainBtn">${t('train_btn')}</button>`;
  $('pracBtn').onclick=practiceFinishers;$('trainBtn').onclick=()=>{initAudio();only(null);inGameUI(true);startTrainMode();};$('mvGuide').textContent=t('guide_btn');$('mvGuide').onclick=()=>showGuide();
  $('mvCombos').innerHTML=[2,3,4,5].map(n=>`<div class="cb" style="background:${COMBO_COLS[n]}"><b>x${n}${n===5?'+':''}</b><span>${t('st_'+n)}</span></div>`).join('');
}
// ---------- leaderboard ----------
let lbKey='react';
$('lbTabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;lbKey=b.dataset.k;document.querySelectorAll('#lbTabs button').forEach(x=>x.classList.toggle('on',x===b));renderLB();};
function renderLB(){let rows=Object.values(PROF.hof);
  if(lbKey==='react')rows=rows.filter(r=>r.bestReact!=null).sort((a,b)=>a.bestReact-b.bestReact);
  else if(lbKey==='boss')rows=rows.filter(r=>r.bossWins>0).sort((a,b)=>b.bossWins-a.bossWins);
  else rows=rows.filter(r=>r.wins>0).sort((a,b)=>b.wins-a.wins);
  const med=['🥇','🥈','🥉'];
  $('lbList').innerHTML=rows.length?rows.slice(0,20).map((r,i)=>`<div class="lbrow"><span class="rk">${med[i]||i+1}</span><span class="n"></span><span class="s">${lbKey==='react'?Math.round(r.bestReact)+' ms':lbKey==='boss'?r.bossWins+' 👑':r.wins+' 🏆'}</span></div>`).join(''):`<p class="note" style="text-align:center;font-size:15px">${t('lb_empty')}</p>`;
  $('lbList').querySelectorAll('.n').forEach((el,i)=>el.textContent=rows[i].name);
}
// ---------- settings ----------
function openSettings(){document.querySelectorAll('#swipeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.s===(PROF.swipe||'normal')));document.querySelectorAll('#annSeg button').forEach(b=>b.classList.toggle('on',b.dataset.a===annMode()));$('nameIn').value=PROF.name||'';$('nameIn').placeholder=t('set_name_ph');$('sndTog').classList.toggle('on',!G.muted);$('vibTog').classList.toggle('on',PROF.vibe);}
$('nameIn').oninput=()=>{PROF.name=$('nameIn').value.trim().slice(0,16);saveProfile();refreshMenu();};
$('langSeg').onclick=e=>{const b=e.target.closest('button');if(!b)return;PROF.lang=b.dataset.l;saveProfile();applyLang();openSettings();};
$('sndTog').onclick=()=>{G.muted=!G.muted;PROF.muted=G.muted;saveProfile();openSettings();refreshMenu();};
$('swipeSeg').onclick=e=>{const b=e.target.closest('button');if(!b)return;PROF.swipe=b.dataset.s;saveProfile();openSettings();};
$('annSeg').onclick=e=>{const b=e.target.closest('button');if(!b)return;PROF.annMode=b.dataset.a;PROF.announcer=b.dataset.a!=='off';saveProfile();openSettings();initAudio();const d=G.demo;G.demo=false;announce(t('st_5'),'combo','legend');G.demo=d;};
$('vibTog').onclick=()=>{PROF.vibe=!PROF.vibe;saveProfile();openSettings();};
let resetArm=0;$('resetBtn').onclick=()=>{if(Date.now()-resetArm<3000){PROF=freshProfile();PROF.tutorialDone=true;saveProfile();G.speed='normal';G.muted=false;applyLang();openSettings();toast('🧹',t('reset_done'));resetArm=0;$('resetBtn').textContent=t('set_reset');}else{resetArm=Date.now();$('resetBtn').textContent=t('set_reset_confirm');}};

// ---------- boot ----------
if(!PROF.enMig){PROF.enMig=1;PROF.lang='en';PROF.annMode='en';saveProfile();}
G.speed=PROF.speed||'normal';G.muted=!!PROF.muted;
applyLang();startDemo();requestAnimationFrame(loop);
window.__G=G;window.__P=P;window.__PROF=()=>PROF;

// ---------- training card ----------
function showTrainCard(tg,i,n){const el=$('trainCard');if(!tg){el.classList.add('hide');return;}
  const name=tg.k==='sp'?t('sp_'+tg.x.id):t('fin_'+tg.x.id);
  el.innerHTML=`<div class="drawn">${glyphSVG(tg.x.shape,56)}</div><div><div class="tst">${t('train_title')} ${i+1} of ${n}</div><div class="tnm">${name}</div><div class="tsq">${tg.k==='sp'?t('train_how_sp'):t('train_how_fin')}</div></div>`;el.classList.remove('hide');el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');}
function onTrainDone(){showTrainCard(null);PROF.coins+=30;saveProfile();toast('🥋',t('train_done'));setTimeout(toMenu,1200);}

$('bTrain').onclick=()=>{initAudio();if(!PROF.tutorialDone){PROF.tutorialDone=true;}only(null);inGameUI(true);startTrainMode();};
