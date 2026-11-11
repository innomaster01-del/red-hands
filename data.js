// ===== items, achievements, levels, profile =====
const ITEMS=[
 // sleeves
 {id:'sl_blue',cat:'sleeve',price:0,main:'#3b7bff',dark:'#1d3f9e',light:'#8fb4ff',pat:'bands',n:{he:'כחול קלאסי',en:'Classic Blue'}},
 {id:'sl_red',cat:'sleeve',price:0,main:'#ff4d6d',dark:'#9a1a37',light:'#ffa3b5',pat:'bands',n:{he:'אדום קלאסי',en:'Classic Red'}},
 {id:'sl_green',cat:'sleeve',price:80,main:'#2fc67a',dark:'#167045',light:'#9df0c4',pat:'bands',n:{he:'ירוק דשא',en:'Grass Green'}},
 {id:'sl_black',cat:'sleeve',price:120,main:'#34344a',dark:'#15151f',light:'#8a8aa8',pat:'bands',n:{he:'שחור מסוכן',en:'Danger Black'}},
 {id:'sl_candy',cat:'sleeve',price:150,main:'#ff7ac8',dark:'#a8357a',light:'#ffd1ec',pat:'diag',n:{he:'סוכריה',en:'Candy'}},
 {id:'sl_benny',cat:'sleeve',price:0,boss:'benny',main:'#7a8597',dark:'#3b4350',light:'#cfd6e2',pat:'bands',n:{he:'Door Guard',en:'Door Guard'}},
 {id:'sl_sting',cat:'sleeve',price:0,boss:'sting',main:'#8a3ff0',dark:'#3d1680',light:'#7dffb0',pat:'diag',n:{he:'Venom',en:'Venom'}},
 {id:'sl_king',cat:'sleeve',price:0,boss:'king',main:'#c4122f',dark:'#5e0616',light:'#ffd66b',pat:'gold',n:{he:'Royal Red',en:'Royal Red'}},
 {id:'sl_camo',cat:'sleeve',price:200,main:'#6b7d3a',dark:'#3a4520',light:'#b4c27a',pat:'camo',n:{he:'קומנדו',en:'Commando'}},
 {id:'sl_flame',cat:'sleeve',price:300,main:'#2a2a38',dark:'#111118',light:'#ffb03b',pat:'flame',n:{he:'להבות',en:'Flames'}},
 {id:'sl_gold',cat:'sleeve',price:500,main:'#f5c542',dark:'#a07818',light:'#fff1b8',pat:'gold',n:{he:'זהב',en:'Gold'}},
 {id:'sl_galaxy',cat:'sleeve',price:600,main:'#3a1d7a',dark:'#170a3a',light:'#b99cff',pat:'galaxy',n:{he:'גלקסיה',en:'Galaxy'}},
 // skins / gloves
 {id:'sk_1',cat:'skin',price:0,c:['#ffe0c4','#f6c39d','#e8a77f'],n:{he:'עור בהיר',en:'Light skin'}},
 {id:'sk_2',cat:'skin',price:0,c:['#f3c79c','#dfa774','#c98a55'],n:{he:'עור שזוף',en:'Tan skin'}},
 {id:'sk_3',cat:'skin',price:0,c:['#c98d5e','#a86f45','#8a5533'],n:{he:'עור חום',en:'Brown skin'}},
 {id:'sk_4',cat:'skin',price:0,c:['#8a5a3c','#6d4329','#55321e'],n:{he:'עור כהה',en:'Dark skin'}},
 {id:'gl_white',cat:'skin',price:200,glove:true,c:['#ffffff','#f1f1f7','#d4d4e6'],n:{he:'כפפה מצוירת',en:'Cartoon glove'}},
 {id:'gl_zombie',cat:'skin',price:250,zombie:true,c:['#c2e69a','#8fc25e','#6b9a42'],n:{he:'יד זומבי',en:'Zombie hand'}},
 {id:'gl_leather',cat:'skin',price:250,glove:true,c:['#5a5a6a','#36364a','#20202c'],n:{he:'כפפת עור',en:'Leather glove'}},
 {id:'gl_king',cat:'skin',price:0,boss:'king',glove:true,c:['#fff3c4','#f5c542','#b8860b'],n:{he:'Golden Glove',en:'Golden Glove'}},
 {id:'gl_robot',cat:'skin',price:400,glove:true,robot:true,c:['#eef3f8','#b4c2d2','#7d8ea3'],n:{he:'יד רובוט',en:'Robot hand'}},
 {id:'gl_gold',cat:'skin',price:700,glove:true,c:['#fff4c4','#f5c542','#c48f12'],n:{he:'יד זהב',en:'Golden hand'}},
 // tattoos
 {id:'tt_none',cat:'tattoo',price:0,shape:null,ic:'🚫',n:{he:'בלי קעקוע',en:'No tattoo'}},
 {id:'tt_heart',cat:'tattoo',price:100,shape:'heart',ic:'❤️',n:{he:'לב',en:'Heart'}},
 {id:'tt_star',cat:'tattoo',price:100,shape:'star',ic:'⭐',n:{he:'כוכב',en:'Star'}},
 {id:'tt_bolt',cat:'tattoo',price:150,shape:'bolt',ic:'⚡',n:{he:'ברק',en:'Lightning'}},
 {id:'tt_anchor',cat:'tattoo',price:150,shape:'anchor',ic:'⚓',n:{he:'עוגן',en:'Anchor'}},
 {id:'tt_skull',cat:'tattoo',price:200,shape:'skull',ic:'💀',n:{he:'גולגולת',en:'Skull'}},
 {id:'tt_crown',cat:'tattoo',price:250,shape:'crown',ic:'👑',n:{he:'כתר',en:'Crown'}},
 // nails
 {id:'nl_none',cat:'nails',price:0,col:null,ic:'🚫',n:{he:'טבעי',en:'Natural'}},
 {id:'nl_red',cat:'nails',price:60,col:'#e3123a',n:{he:'אדום',en:'Red'}},
 {id:'nl_pink',cat:'nails',price:60,col:'#ff7ac8',n:{he:'ורוד',en:'Pink'}},
 {id:'nl_black',cat:'nails',price:80,col:'#1a1a22',n:{he:'שחור',en:'Black'}},
 {id:'nl_blue',cat:'nails',price:80,col:'#3b7bff',n:{he:'כחול',en:'Blue'}},
 {id:'nl_gold',cat:'nails',price:150,col:'#f5c542',n:{he:'זהב',en:'Gold'}},
 {id:'nl_rainbow',cat:'nails',price:200,col:'rainbow',ic:'🌈',n:{he:'קשת',en:'Rainbow'}},
 // watches
 {id:'wt_none',cat:'watch',price:0,ic:'🚫',n:{he:'בלי שעון',en:'No watch'}},
 {id:'wt_classic',cat:'watch',price:150,band:'#7a4a2a',face:'#ffffff',rim:'#c9c9d6',ic:'⌚',n:{he:'קלאסי',en:'Classic'}},
 {id:'wt_digital',cat:'watch',price:200,band:'#1a1a22',face:'#1f3a24',rim:'#55556a',digital:true,ic:'📟',n:{he:'דיגיטלי',en:'Digital'}},
 {id:'wt_smart',cat:'watch',price:300,band:'#ff4d6d',face:'#111118',rim:'#2a2a38',smart:true,ic:'📱',n:{he:'חכם',en:'Smartwatch'}},
 {id:'wt_gold',cat:'watch',price:400,band:'#f5c542',face:'#fff7d6',rim:'#c48f12',ic:'🏅',n:{he:'זהב',en:'Gold'}},
 // rings
 {id:'rg_none',cat:'ring',price:0,ic:'🚫',n:{he:'בלי טבעת',en:'No ring'}},
 {id:'rg_silver',cat:'ring',price:100,col:'#dfe4ee',n:{he:'כסף',en:'Silver'}},
 {id:'rg_gold',cat:'ring',price:200,col:'#f5c542',n:{he:'זהב',en:'Gold'}},
 {id:'rg_ruby',cat:'ring',price:300,col:'#f5c542',gem:'#ff2a55',n:{he:'אודם',en:'Ruby'}},
 {id:'rg_diamond',cat:'ring',price:400,col:'#dfe4ee',gem:'#9ff3ff',n:{he:'יהלום',en:'Diamond'}},
 // arenas (unlocked by level)
 {id:'ar_temple',cat:'arena',price:0,lvl:1,ic:'🏯',n:{he:'מקדש',en:'Temple'}},
 {id:'ar_purple',cat:'arena',price:0,lvl:1,ic:'💜',n:{he:'סגול קלאסי',en:'Classic Purple'}},
 {id:'ar_kitchen',cat:'arena',price:0,lvl:3,ic:'🍳',n:{he:'מטבח',en:'Kitchen'}},
 {id:'ar_restaurant',cat:'arena',price:0,lvl:5,ic:'🍷',n:{he:'מסעדה',en:'Restaurant'}},
 {id:'ar_space',cat:'arena',price:0,lvl:7,ic:'🚀',n:{he:'חלל',en:'Space'}},
 {id:'ar_neon',cat:'arena',price:0,lvl:10,ic:'🌃',n:{he:'ניאון',en:'Neon'}},
 // slap sounds
 {id:'sd_classic',cat:'sound',price:0,ic:'👋',n:{he:'סטירה קלאסית',en:'Classic slap'}},
 {id:'sd_duck',cat:'sound',price:150,ic:'🦆',n:{he:'ברווז',en:'Duck'}},
 {id:'sd_drum',cat:'sound',price:150,ic:'🥁',n:{he:'תוף',en:'Drum'}},
 {id:'sd_boom',cat:'sound',price:250,ic:'💣',n:{he:'פיצוץ',en:'Explosion'}},
 {id:'sd_laser',cat:'sound',price:250,ic:'🔫',n:{he:'לייזר',en:'Laser'}},
 // comic words
 {id:'wd_classic',cat:'words',price:0,ic:'💬',n:{he:'קלאסי',en:'Classic'},w:{he:['טראח!','בּוּם!','פַּאק!','סְלאפּ!','אאוץ׳!','פּצַ׳!'],en:['SLAP!','WHACK!','OUCH!','SMACK!','THWACK!']}},
 {id:'wd_comic',cat:'words',price:100,ic:'🗯️',n:{he:'קומיקס',en:'Comic'},w:{he:['POW!','BAM!','WHAM!','KAPOW!','BOOM!'],en:['POW!','BAM!','WHAM!','KAPOW!','BOOM!']}},
 {id:'wd_food',cat:'words',price:150,ic:'🥙',n:{he:'אוכל',en:'Food'},w:{he:['שקשוקה!','פלאפל!','חומוס!','במבה!','פיתה!','בורקס!'],en:['PIZZA!','TACO!','WAFFLE!','NACHO!','DONUT!']}},
 {id:'wd_emoji',cat:'words',price:150,ic:'😵',n:{he:'אימוג׳י',en:'Emoji'},w:{he:['💥','🔥','⚡','😵','🤚','💫'],en:['💥','🔥','⚡','😵','🤚','💫']}},
 // sparks
 {id:'sp_stars',cat:'sparks',price:0,ic:'⭐',n:{he:'כוכבים',en:'Stars'}},
 {id:'sp_hearts',cat:'sparks',price:120,ic:'💖',n:{he:'לבבות',en:'Hearts'}},
 {id:'sp_fire',cat:'sparks',price:150,ic:'🔥',n:{he:'אש',en:'Fire'}},
 {id:'sp_confetti',cat:'sparks',price:150,ic:'🎊',n:{he:'קונפטי',en:'Confetti'}},
 {id:'sp_coins',cat:'sparks',price:200,ic:'🪙',n:{he:'מטבעות',en:'Coins'}},
 // win animation
 {id:'wn_confetti',cat:'win',price:0,ic:'🎉',n:{he:'קונפטי',en:'Confetti'}},
 {id:'wn_fireworks',cat:'win',price:200,ic:'🎆',n:{he:'זיקוקים',en:'Fireworks'}},
 {id:'wn_emoji',cat:'win',price:200,ic:'🖐️',n:{he:'גשם ידיים',en:'Hand rain'}},
 {id:'wn_gold',cat:'win',price:300,ic:'💰',n:{he:'גשם זהב',en:'Gold rain'}},
];
const ITEM={};ITEMS.forEach(i=>ITEM[i.id]=i);
const item=id=>ITEM[id]||null;
const CATS=[
 {id:'sleeve',ic:'👕'},{id:'skin',ic:'✋'},{id:'tattoo',ic:'🖋️'},{id:'nails',ic:'💅'},{id:'watch',ic:'⌚'},{id:'ring',ic:'💍'},
 {id:'arena',ic:'🏟️'},{id:'sound',ic:'🔊'},{id:'words',ic:'💬'},{id:'sparks',ic:'✨'},{id:'win',ic:'🎉'}];
const DEFAULT_EQUIP={sleeve:'sl_blue',skin:'sk_1',tattoo:'tt_none',nails:'nl_none',watch:'wt_none',ring:'rg_none',arena:'ar_purple',sound:'sd_classic',words:'wd_classic',sparks:'sp_stars',win:'wn_confetti'};
const P2_LOOK={sleeve:'sl_red',skin:'sk_1',tattoo:'tt_none',nails:'nl_none',watch:'wt_none',ring:'rg_none',sound:'sd_classic',words:'wd_classic',sparks:'sp_stars'};
const AI_LOOKS={
 easy:{sleeve:'sl_red',skin:'sk_2',tattoo:'tt_none',nails:'nl_none',watch:'wt_classic',ring:'rg_none',sound:'sd_classic',words:'wd_classic',sparks:'sp_stars'},
 normal:{sleeve:'sl_red',skin:'sk_3',tattoo:'tt_anchor',nails:'nl_none',watch:'wt_digital',ring:'rg_silver',sound:'sd_drum',words:'wd_classic',sparks:'sp_stars'},
 hard:{sleeve:'sl_black',skin:'gl_robot',tattoo:'tt_none',nails:'nl_none',watch:'wt_smart',ring:'rg_none',sound:'sd_laser',words:'wd_comic',sparks:'sp_fire'}};

// ===== achievements =====
const ACH=[
 {id:'first_win',ic:'🏅'},{id:'ninja',ic:'🥷'},{id:'no_mercy',ic:'💀'},{id:'lightning',ic:'⚡'},{id:'combo5',ic:'🔥'},
 {id:'trickster',ic:'🎭'},{id:'close_call',ic:'😅'},{id:'boss',ic:'👑'},{id:'streak3',ic:'🏆'},{id:'veteran',ic:'🎖️'},
 {id:'fashion',ic:'👗'},{id:'diagonal',ic:'↗️'},{id:'double',ic:'✌️'},{id:'zen',ic:'🧘'},{id:'breaker',ic:'💥'},{id:'special',ic:'🔥'},{id:'finisher',ic:'☠️'}];
const SPECIALS=[
 {id:'fire',shape:'peak',cost:25,lvl:1,ic:'🔥',style:'fire',col:'#ff6a1f'},
 {id:'bolt',shape:'zig',cost:35,lvl:1,ic:'⚡',style:'gold',col:'#ffe95c'},
 {id:'tornado',shape:'loop',cost:50,lvl:1,ic:'🌪️',style:'green',col:'#7dffb0'},
 {id:'mega',shape:'tri',cost:70,lvl:1,ic:'👊',style:'red',col:'#ff2a4a'}];
// finishers: draw the shape during "FINISH THEM" — same shape language as the specials
const FINISHERS=[{id:'bolt',shape:'wave',ic:'⚡'},{id:'fire',shape:'mtn',ic:'🔥'},{id:'ice',shape:'vee',ic:'🧊'},{id:'tornado',shape:'inf',ic:'🌪️'},{id:'giant',shape:'star',ic:'👋'}];
const COMBO_SP={2:'fire',3:'bolt',4:'tornado',5:'mega'};
const comboSp=n=>n>=5?'mega':(COMBO_SP[n]||null);
const ARROW={U:'⬆',D:'⬇',S:'⬌',L:'⬅',R:'➡'};

// ===== levels =====
const needFor=n=>Math.round(150+60*Math.pow(n-1,1.25));
function levelInfo(xp){let lvl=1,acc=0,need=needFor(1);while(xp>=acc+need&&lvl<99){acc+=need;lvl++;need=needFor(lvl);}return{lvl,cur:xp-acc,need};}
const UNLOCKS=[{lvl:2,key:'diag'},{lvl:3,key:'ar_kitchen'},{lvl:5,key:'ar_restaurant'},{lvl:7,key:'ar_space'},{lvl:8,key:'twohands'},{lvl:10,key:'ar_neon'}];
const TWOHANDS_ACH=6;
const TH_LVL=UNLOCKS.find(u=>u.key==='twohands').lvl;

// ===== profile =====
function freshProfile(){return{v:1,name:'',lang:'en',annMode:'en',coins:0,xp:0,owned:{},equip:Object.assign({},DEFAULT_EQUIP),
 stats:{games:0,aiGames:0,wins:0,losses:0,bestReact:null,reactN:0,reactSum:0,dodges:0,attempts:0,flinches:0,hits:0,bestCombo:0,winStreak:0,bestWinStreak:0,feintsOk:0,hardWins:0,dodgeRun:0,bestDodgeRun:0,bought:0,breaks:0},
 ach:{},tutorialDone:false,speed:'normal',muted:false,vibe:true,announcer:true,twoHands:false,hof:{},lastOpp:''};}
let PROF=freshProfile();
function loadProfile(){try{const s=localStorage.getItem('redhands-v1');if(s){const p=JSON.parse(s);const f=freshProfile();PROF=Object.assign(f,p);PROF.stats=Object.assign(f.stats,p.stats||{});PROF.equip=Object.assign({},DEFAULT_EQUIP,p.equip||{});if(!PROF.v5){PROF.v5=1;if(PROF.v4&&PROF.equip.arena==='ar_temple')PROF.equip.arena='ar_purple';}}}catch(e){}}
function saveProfile(){try{localStorage.setItem('redhands-v1',JSON.stringify(PROF));}catch(e){}}
function xpToLevel(n){let a=0;for(let i=1;i<n;i++)a+=needFor(i);return a;}
function owns(id){const it=item(id);if(!it)return false;if(it.boss)return !!(PROF.career&&PROF.career.stars&&PROF.career.stars[it.boss]);if(it.cat==='arena')return levelInfo(PROF.xp).lvl>=(it.lvl||1);return it.price===0||!!PROF.owned[id];}
function hasUnlock(key){const u=UNLOCKS.find(u=>u.key===key);if(!u)return true;const lvl=levelInfo(PROF.xp).lvl;if(key==='twohands')return lvl>=u.lvl&&Object.keys(PROF.ach).length>=TWOHANDS_ACH;return lvl>=u.lvl;}
function hofEntry(name){const k=(name||'').trim().toLowerCase();if(!k)return null;if(!PROF.hof[k])PROF.hof[k]={name:name.trim(),games:0,wins:0,bossWins:0,bestReact:null,bestCombo:0};return PROF.hof[k];}
loadProfile();
