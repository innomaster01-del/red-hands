// Two separate "phones" connect over the real internet (PeerJS cloud + WebRTC) and play.
const {chromium}=require('playwright');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream']});
 const mk=async(name)=>{const ctx=await b.newContext({viewport:{width:393,height:852}});const p=await ctx.newPage();p.on('pageerror',e=>console.log(name,'ERR',e.message));
   await p.addInitScript(n=>{localStorage.setItem('redhands-v1',JSON.stringify({tutorialDone:true,guideSeen:1,xp:2600,enMig:1,lang:'en',annMode:'off',name:n}));},name);
   await p.goto('http://localhost:8080/index.html');await p.waitForTimeout(1000);return p;};
 const A=await mk('Host'),B=await mk('Guest');
 // friend room
 await A.click('#bon');await A.click('#onHost');await A.waitForFunction(()=>document.getElementById('onCode').textContent.length===4,null,{timeout:20000});
 const code=await A.evaluate(()=>document.getElementById('onCode').textContent);console.log('room',code);
 await A.waitForTimeout(2500);
 await B.click('#bon');await B.click('#onJoinBtn');await B.fill('#onCodeIn',code);await B.click('#onJoinGo');
 await A.waitForFunction(()=>G.online&&G.phase==='faceoff',null,{timeout:30000}).catch(()=>{});
 ok(await A.evaluate(()=>G.online&&G.phase==='faceoff'),'friend room: host started the match');
 await B.waitForFunction(()=>G.netGuest&&G.phase==='faceoff',null,{timeout:10000}).catch(()=>{});
 ok(await B.evaluate(()=>G.netGuest&&G.phase==='faceoff'),'friend room: guest receives the live game');
 await A.mouse.move(196,650);await A.mouse.down();await B.mouse.move(196,650);await B.mouse.down();
 await A.waitForFunction(()=>G.phase==='countdown',null,{timeout:8000}).catch(()=>{});ok(await A.evaluate(()=>G.phase!=='faceoff'),'both fingers down starts the countdown');
 await A.mouse.up();await B.mouse.up();await A.waitForFunction(()=>G.phase==='armed',null,{timeout:8000});
 await A.evaluate(()=>{G.att=1;toReset();});await A.waitForFunction(()=>G.phase==='armed');await B.waitForTimeout(400);
 await B.mouse.move(196,650);await B.mouse.down();await B.waitForTimeout(120);for(let i=1;i<=6;i++)await B.mouse.move(196,650-i*35);await B.mouse.up();await A.waitForTimeout(600);ok(await A.evaluate(()=>G.phase!=='armed'),'guest swipe slaps on the host');
 console.log('rtt ms',await A.evaluate(()=>Math.round(ON.rtt)));
 await A.waitForTimeout(1500);await A.evaluate(()=>{P[0].hp=0;gameOver(1,true);});
 await B.waitForFunction(()=>!document.getElementById('onres').classList.contains('hide'),null,{timeout:12000}).catch(()=>{});
 ok(await B.evaluate(()=>PROF.online&&PROF.online.w===1),'guest gets the win and rating');
 await A.click('#orLeave');await B.waitForTimeout(8000);
 ok(await B.evaluate(()=>getComputedStyle(document.getElementById('orAgain')).display==='none'),'guest is told the host left');
 await B.click('#orLeave');
 // quick match
 await A.click('#bon');await A.click('#onQuick');await A.waitForTimeout(3000);await B.click('#bon');await B.click('#onQuick');
 await A.waitForFunction(()=>G.online&&G.phase==='faceoff',null,{timeout:30000}).catch(()=>{});
 const qa=await A.evaluate(()=>G.online),qb=await B.evaluate(()=>G.online);ok(qa&&qb,'quick match pairs two strangers');
 await b.close();})();
