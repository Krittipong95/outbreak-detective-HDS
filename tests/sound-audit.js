/* Browser audio integration check. Loaded only by the test runner. */
(function(){
  const errors=[], stats={noiseSources:0,oscillators:0,utterances:0};
  const spoken=[];let speaking=false, mockVoices=[{lang:'th-TH',localService:true,name:'เสียงไทยทดสอบ'}], voiceChange=null;
  const fakeSpeech={getVoices:()=>mockVoices,addEventListener:(type,fn)=>{if(type==='voiceschanged')voiceChange=fn;},cancel:()=>{speaking=false;},speak:u=>{spoken.push(u);stats.utterances++;speaking=false;},get speaking(){return speaking;}};
  try{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:fakeSpeech});window.SpeechSynthesisUtterance=function(t){this.text=t;};}catch(e){errors.push('cannot mock speech: '+e.message);}
  const AC=window.AudioContext||window.webkitAudioContext;
  if(AC){const b=AC.prototype.createBufferSource,o=AC.prototype.createOscillator;AC.prototype.createBufferSource=function(){stats.noiseSources++;return b.call(this);};AC.prototype.createOscillator=function(){stats.oscillators++;return o.call(this);};}
  const check=(ok,msg)=>{if(!ok)errors.push(msg);};
  window.addEventListener('load',async()=>{try{
    OD.W=OD.sim.build(42);OD.S=OD.sim.newState(OD.W,'easy','ต้นกล้า');OD.S.gender='m';OD.S.pol='ครับ';
    const box=document.querySelector('#musicCtl');check(!!box.querySelector('[data-audio=menu]'),'no audio menu');
    for(const id of ['music','sfx','ambient','voice'])check(!!box.querySelector('[data-audio="'+id+'-vol"]'),'missing control '+id);
    box.querySelector('[data-audio=menu]').click();check(!box.querySelector('.audio-panel').hidden,'panel did not open');
    document.dispatchEvent(new Event('pointerdown',{bubbles:true}));await new Promise(r=>setTimeout(r,100));
    const effectsBefore=stats.oscillators;OD.sfx('correct');if(AC)check(stats.oscillators>effectsBefore,'answer effect did not play');
    box.querySelector('[data-audio=music]').click();check(OD.sound.status().ambientOn,'muting music also muted ambience');box.querySelector('[data-audio=music]').click();
    const before=stats.noiseSources;OD.sound.setScene('village',{night:false});OD.sound.setRain(true);check(OD.sound.scene().rain,'rain state');
    OD.sound.setRain(false);OD.sound.setScene('village',{night:true});check(OD.sound.scene().night,'night state');
    if(AC)check(stats.noiseSources>before,'ambient sound sources not created');
    const v=box.querySelector('[data-audio=voice-vol]');v.value='40';v.dispatchEvent(new Event('input',{bubbles:true}));check(OD.sound.status().voiceVol===.4,'voice volume');
    OD.sound.speak('สวัสดี **{name}** {p}','doctor');check(spoken.length===1&&spoken[0].text==='สวัสดี ต้นกล้า ครับ','voice text or Thai voice');check(spoken[0].volume===.4,'voice volume not applied');
    box.querySelector('[data-audio=voice]').click();OD.sound.speak('ไม่ควรพูด','doctor');check(spoken.length===1,'muted voice spoke');box.querySelector('[data-audio=voice]').click();
    box.querySelector('[data-audio=ambient]').click();check(!OD.sound.status().ambientOn,'ambient mute');const mutedSources=stats.noiseSources;OD.sound.setScene('well_canal',{rain:true});check(stats.noiseSources===mutedSources,'sound sources created while muted');box.querySelector('[data-audio=ambient]').click();check(OD.sound.status().ambientOn,'ambient enable');
    OD.sound.setScene('office');const play=OD.vn.play([{bg:'village',fx:'rain'},{say:'doctor',text:'สวัสดีครับ'},{fx:null}]);await new Promise(r=>setTimeout(r,100));check(OD.sound.scene().rain,'VN rain');
    const vn=document.querySelector('#vn .vn-box');vn.click();vn.click();await play;check(OD.sound.scene().place==='office'&&!OD.sound.scene().rain,'VN scene restoration');check(spoken.length>=2,'VN dialogue not voiced');
    const last=spoken.length;mockVoices=[];if(voiceChange)voiceChange();OD.sound.speak('ทดสอบ','doctor');check(spoken.length===last&&!OD.sound.status().voiceAvailable,'missing Thai voice fallback');check(box.querySelector('[data-audio=voice-note]').textContent.includes('ไม่พบ'),'missing voice message');
    document.body.dataset.soundAudit=errors.length?'fail':'pass';
  }catch(e){errors.push(e.stack||e.message);document.body.dataset.soundAudit='fail';}
    const pre=document.createElement('pre');pre.id='sound-audit-output';pre.textContent=JSON.stringify({stats,errors},null,2);document.body.append(pre);
  });
})();
