/* เสียงบรรยากาศและเสียงพูดของเกม แยกจากเพลงและเอฟเฟกต์ */
window.OD = window.OD || {};
OD.sound = (function(){
  const read=(k,d)=>{try{const v=localStorage.getItem('od2-'+k);return v===null?d:v;}catch(e){return d;}};
  const save=(k,v)=>{try{localStorage.setItem('od2-'+k,String(v));}catch(e){}};
  const amount=(k,d)=>{const n=Number(read(k,d));return Number.isFinite(n)?Math.max(0,Math.min(100,n))/100:d/100;};
  let ambientOn=read('ambient','1')==='1', ambientVol=amount('ambientVol',35);
  let voiceOn=read('voice','1')==='1', voiceVol=amount('voiceVol',80);
  let ctx=null, gain=null, unlocked=false, sources=[], birdTimer=null, voices=[], voiceTicket=0;
  let state={place:'village',night:false,rain:false}, signature='';
  const speech=()=>window.speechSynthesis;
  const voiceAvailable=()=>voices.some(v=>/^th(?:-|_|$)/i.test(v.lang) && v.localService!==false);
  function refreshVoices(){try{voices=speech()?speech().getVoices():[];}catch(e){voices=[];} if(OD.music)OD.music.ui();}
  function resume(){try{if(ctx && ctx.state!=='running'){const p=ctx.resume();if(p&&p.catch)p.catch(()=>{});}}catch(e){}}
  function init(){
    if(ctx)return true; const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    try{ctx=new AC();gain=ctx.createGain();gain.gain.value=ambientOn?ambientVol*.28:0;gain.connect(ctx.destination);return true;}catch(e){ctx=null;gain=null;return false;}
  }
  function stopSources(){
    if(birdTimer){clearTimeout(birdTimer);birdTimer=null;}
    for(const s of sources){try{s.stop(ctx.currentTime+.3);}catch(e){}} sources=[];
  }
  function noiseLayer(frequency,kind,level,ripple=false){
    const n=Math.floor(ctx.sampleRate*3), b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const src=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), g=ctx.createGain();
    src.buffer=b;src.loop=true;filter.type=kind;filter.frequency.value=frequency;g.gain.value=level;
    src.connect(filter);filter.connect(g);g.connect(gain);src.start();sources.push(src);
    if(ripple){const lfo=ctx.createOscillator(), depth=ctx.createGain();lfo.type='sine';lfo.frequency.value=.32;depth.gain.value=level*.4;lfo.connect(depth);depth.connect(g.gain);lfo.start();sources.push(lfo);}
  }
  function bird(){
    birdTimer=null;if(!ctx||!ambientOn||document.hidden||!outdoors()||state.rain)return;
    if(ctx.state==='running'){
      const t=ctx.currentTime+.05, night=state.night, f=night?2100:1650+Math.random()*600;
      for(let i=0;i<(night?2:3);i++){
        const o=ctx.createOscillator(),g=ctx.createGain(),at=t+i*.13;o.type='sine';o.frequency.setValueAtTime(f+i*90,at);o.frequency.exponentialRampToValueAtTime(f*.78,at+.09);
        g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(night?.018:.045,at+.015);g.gain.exponentialRampToValueAtTime(.0001,at+.11);o.connect(g);g.connect(gain);o.start(at);o.stop(at+.13);
      }
    }
    birdTimer=setTimeout(bird,state.night?12000+Math.random()*9000:5500+Math.random()*9000);
  }
  function outdoors(){return /^(village|temple|market|well_|farm|ice_factory|somtam|noodle_boat|chicken_rice|mookata|school)/.test(state.place);}
  function rebuild(){
    if(!unlocked||!ambientOn||!init())return;resume();stopSources();
    gain.gain.setTargetAtTime(ambientVol*.28,ctx.currentTime,.08);
    try{
      if(state.rain)noiseLayer(1800,'lowpass',.13);
      else if(outdoors()){
        noiseLayer(420,'lowpass',.055);
        if(/village|well_|farm/.test(state.place))noiseLayer(1100,'lowpass',.035,true);
        birdTimer=setTimeout(bird,state.night?7000:2500);
      }else noiseLayer(250,'lowpass',.018);
    }catch(e){stopSources();}
  }
  function setScene(place,opts={}){
    const next={place:String(place||'village').split(':')[0],night:!!opts.night,rain:!!opts.rain};
    const sig=JSON.stringify(next);state=next;if(sig===signature)return;signature=sig;rebuild();
  }
  function setRain(rain){setScene(state.place,{night:state.night,rain});}
  function setAmbient(v){ambientVol=Math.max(0,Math.min(1,Number(v)||0));save('ambientVol',Math.round(ambientVol*100));if(gain&&ctx)gain.gain.setTargetAtTime(ambientOn?ambientVol*.28:0,ctx.currentTime,.06);}
  function toggleAmbient(){ambientOn=!ambientOn;save('ambient',ambientOn?'1':'0');if(ambientOn){unlocked=true;rebuild();}else{if(gain&&ctx)gain.gain.setTargetAtTime(0,ctx.currentTime,.04);stopSources();}if(OD.music)OD.music.ui();}
  function stopVoice(){voiceTicket++;try{if(speech())speech().cancel();}catch(e){} if(OD.music)OD.music.setVoiceDucking(false);}
  function toggleVoice(){voiceOn=!voiceOn;save('voice',voiceOn?'1':'0');if(!voiceOn)stopVoice();if(OD.music)OD.music.ui();}
  function setVoice(v){voiceVol=Math.max(0,Math.min(1,Number(v)||0));save('voiceVol',Math.round(voiceVol*100));}
  function speak(text,who){
    stopVoice();if(!voiceOn||!voiceVol||!voiceAvailable()||!speech()||!window.SpeechSynthesisUtterance||document.hidden)return;
    const clean=String(text||'').replace(/\*\*/g,'').replace(/\{name\}/g,(OD.S&&OD.S.name)||'คุณ').replace(/\{p\}/g,(OD.S&&OD.S.pol)||'ครับ').replace(/<[^>]*>/g,'').trim();
    if(!clean)return;
    const ticket=voiceTicket;
    try{const u=new SpeechSynthesisUtterance(clean);u.lang='th-TH';u.voice=voices.find(v=>/^th(?:-|_|$)/i.test(v.lang)&&v.localService!==false);u.volume=voiceVol;u.rate=.95;
      const pitches={doctor:.95,boonma:1.02,kamnan:.86,fah:1.12,monk:.88,vendorF:1.05,vendorM:.88,director:1,patientF:1.05,patientM:.9,me:1};u.pitch=pitches[who]||1;u.onend=u.onerror=()=>{if(ticket===voiceTicket&&OD.music)OD.music.setVoiceDucking(false);};if(OD.music)OD.music.setVoiceDucking(true);speech().speak(u);}catch(e){if(OD.music)OD.music.setVoiceDucking(false);}
  }
  function arm(){
    refreshVoices();const synth=speech();if(synth&&synth.addEventListener)synth.addEventListener('voiceschanged',refreshVoices);
    const go=()=>{if(unlocked)return;unlocked=true;rebuild();};document.addEventListener('pointerdown',go,{once:true});document.addEventListener('keydown',go,{once:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoice();if(birdTimer){clearTimeout(birdTimer);birdTimer=null;}if(ctx)try{ctx.suspend();}catch(e){}}else if(ambientOn&&unlocked){rebuild();}});
  }
  return {arm,setScene,setRain,scene:()=>Object.assign({},state),toggleAmbient,setAmbient,toggleVoice,setVoice,speak,stopVoice,
    speaking:()=>{try{return !!(voiceOn&&speech()&&speech().speaking);}catch(e){return false;}},
    status:()=>({ambientOn,ambientVol,voiceOn,voiceVol,voiceAvailable:voiceAvailable()})};
})();
