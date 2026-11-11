// ===== light menu music: a soft plucked loop, synthesized (no audio file). Plays only on the menu, never during a match. =====
(()=>{
let master=null,lp=null,timer=0,nextT=0,step=0,on=false;
const BPM=92,S8=60/BPM/2;                                  // eighth-note length
const N=n=>440*Math.pow(2,(n-69)/12);                      // midi -> Hz
// four bars: C  Am  F  G — a rising arpeggio with a little answer phrase on top
const BARS=[{b:36,ch:[60,64,67,72]},{b:33,ch:[57,60,64,69]},{b:41,ch:[53,57,60,65]},{b:43,ch:[55,59,62,67]}];
const ARP=[0,1,2,3,2,1,2,1],TOP=[[76,0],[79,3],[77,6],null,[72,0],[74,3],[76,5],null,[72,0],[69,2],[72,5],null,[74,0],[71,3],[67,6],null];
function pluck(t,f,vol,dur,type){const o=AC.createOscillator(),g=AC.createGain();o.type=type||'triangle';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(lp);o.start(t);o.stop(t+dur+.05);}
function tick(t,noiseBufRef){const s=AC.createBufferSource();s.buffer=noiseBufRef;const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=7000;const g=AC.createGain();g.gain.setValueAtTime(0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.05);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+0.07);}
function schedule(){if(!AC||!on)return;while(nextT<AC.currentTime+0.35){const bar=BARS[((step/8)|0)%4],i=step%8,t=nextT;
    pluck(t,N(bar.ch[ARP[i]]),0.16,0.5);
    if(i===0)pluck(t,N(bar.b),0.3,1.1,'sine');if(i===4)pluck(t,N(bar.b+7),0.16,0.6,'sine');
    const loop=((step/32)|0)%2,ti=((step/8)|0)%4;if(loop===1)TOP.slice(ti*4,ti*4+4).forEach(n=>{if(n&&n[1]===i)pluck(t,N(n[0]),0.1,0.7,'sine');});
    if(i%2===1&&typeof noiseBuf!=='undefined'&&noiseBuf)tick(t,noiseBuf);
    nextT+=S8*(i%2?0.94:1.06);step++;}}   // a touch of swing
function want(){return !!(window.AC||typeof AC!=='undefined'&&AC)&&G.demo&&!G.muted&&PROF.music!==false&&!document.hidden&&G.mode==='demo';}
function sync(){if(typeof AC==='undefined'||!AC)return;
  if(!master){master=AC.createGain();master.gain.value=0;lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;lp.Q.value=.4;lp.connect(master);master.connect(AC.destination);}
  const w=want();if(w&&!on){on=true;nextT=AC.currentTime+0.08;step=0;master.gain.cancelScheduledValues(AC.currentTime);master.gain.setTargetAtTime(0.07,AC.currentTime,0.6);}
  else if(!w&&on){on=false;master.gain.cancelScheduledValues(AC.currentTime);master.gain.setTargetAtTime(0,AC.currentTime,0.12);}
  schedule();}
timer=setInterval(sync,110);
// browsers only allow sound after a touch: the first touch anywhere wakes the audio
addEventListener('pointerdown',()=>{try{initAudio();}catch(e){}},{once:true,capture:true});
window.MUSIC={get on(){return on;}};
})();
