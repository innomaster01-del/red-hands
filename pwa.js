// pwa.js — install hint (iPhone), service worker registration, "update ready" flow. Never allowed to break the game.
(function(){
  const remember=(k,v)=>{try{if(v===undefined)return localStorage.getItem('rh-'+k);localStorage.setItem('rh-'+k,v);}catch(e){return null;}};
  const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
  const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isIOSSafari=isIOS&&/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS|GSA/.test(navigator.userAgent);
  const inFrame=(()=>{try{return window.self!==window.top;}catch(e){return true;}})();
  const ios=document.getElementById('iosSheet');
  if(isIOSSafari&&!isStandalone()&&!inFrame&&!remember('iosHint'))setTimeout(()=>{ios.hidden=false;},600);
  document.getElementById('iosLater').addEventListener('click',()=>{ios.hidden=true;remember('iosHint','1');});
  let deferred=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;window.__installApp=()=>{deferred&&deferred.prompt();deferred=null;};});
  (async()=>{let reg=null;
    try{if('serviceWorker' in navigator&&!inFrame)reg=await navigator.serviceWorker.register('sw.js',{scope:'./'});}catch(e){reg=null;}
    if(!reg)return;
    const upd=document.getElementById('updateSheet');let waiting=null,reloading=false;
    const offer=w=>{waiting=w;upd.hidden=false;};
    document.getElementById('updateBtn').addEventListener('click',()=>{upd.hidden=true;waiting&&waiting.postMessage('SKIP_WAITING');});
    if(reg.waiting&&navigator.serviceWorker.controller)offer(reg.waiting);
    reg.addEventListener('updatefound',()=>{const w=reg.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)offer(w);});});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading){reloading=true;location.reload();}});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{});});
    try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
  })();
  window.__pwa={isStandalone,isIOSSafari};
})();
