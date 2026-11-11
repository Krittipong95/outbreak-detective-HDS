/* Browser check for music, effects and ambience; speech must remain silent. */
(function(){
  const errors=[], stats={noiseSources:0,oscillators:0,utterances:0,musicRenders:{},sceneImages:[]};
  const fakeSpeech={getVoices:()=>[{lang:'th-TH',localService:true,name:'เสียงไทยทดสอบ'}],addEventListener:()=>{},cancel:()=>{},speak:()=>{stats.utterances++;},speaking:false};
  try{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:fakeSpeech});window.SpeechSynthesisUtterance=function(t){this.text=t;};}catch(e){errors.push('cannot mock speech: '+e.message);}
  const AC=window.AudioContext||window.webkitAudioContext;
  if(AC){const b=AC.prototype.createBufferSource,o=AC.prototype.createOscillator;AC.prototype.createBufferSource=function(){stats.noiseSources++;return b.call(this);};AC.prototype.createOscillator=function(){stats.oscillators++;return o.call(this);};}
  const check=(ok,msg)=>{if(!ok)errors.push(msg);};
  window.addEventListener('load',async()=>{const keepAlive=setInterval(()=>{},100);try{
    OD.W=OD.sim.build(42);OD.S=OD.sim.newState(OD.W,'easy','ต้นกล้า');OD.S.gender='m';OD.S.pol='ครับ';
    const soundtrack=OD.music.soundtrack(),moods=['calm','field','night','tense','ending'];
    check(moods.every(m=>Array.isArray(soundtrack[m])&&soundtrack[m].length),'missing Lanna playlist');
    const tracks=moods.flatMap(m=>soundtrack[m]);
    check(tracks.length===7&&new Set(tracks.map(t=>t.key)).size===7,'soundtrack does not contain seven distinct tracks');
    check(tracks.every(t=>t.style==='lanna'),'non-Lanna track remains in active playlist');
    check(Math.max(...tracks.map(t=>t.bpm))<=86,'soundtrack is too fast for relaxed listening');
    stats.musicRenders=Object.fromEntries(moods.map(m=>[m,soundtrack[m].map(t=>t.key)]));
    check(typeof OD.music.renderTest==='function','offline music renderer missing');
    const sceneKeys=['well_temple','well_market','well_canal','somtam','noodle_boat','chicken_rice','mookata'];
    stats.sceneImages=sceneKeys.map(key=>({key,src:(OD.art.scene(key).match(/<image href="([^"]+)/)||[])[1]||''}));
    check(stats.sceneImages.every(x=>x.src),'missing location background');
    check(new Set(stats.sceneImages.map(x=>x.src)).size===sceneKeys.length,'shops or wells still share the same background');
    const box=document.querySelector('#musicCtl');check(!!box.querySelector('[data-audio=menu]'),'no audio menu');
    for(const id of ['music','sfx','ambient'])check(!!box.querySelector('[data-audio="'+id+'-vol"]'),'missing control '+id);
    check(!box.querySelector('[data-audio=voice]')&&!box.querySelector('.voice-settings'),'voice controls remain');
    box.querySelector('[data-audio=menu]').click();check(!box.querySelector('.audio-panel').hidden,'panel did not open');
    document.dispatchEvent(new Event('pointerdown',{bubbles:true}));await new Promise(r=>setTimeout(r,100));check(!AC||stats.noiseSources>0,'Lanna plucked-string source did not start');check(!AC||stats.oscillators>0,'Lanna flute source did not start');
    const effectsBefore=stats.oscillators;OD.sfx('correct');if(AC)check(stats.oscillators>effectsBefore,'answer effect did not play');
    box.querySelector('[data-audio=music]').click();check(OD.sound.status().ambientOn,'muting music also muted ambience');box.querySelector('[data-audio=music]').click();
    const before=stats.noiseSources;OD.sound.setScene('village',{night:false});OD.sound.setRain(true);check(OD.sound.scene().rain,'rain state');
    OD.sound.setRain(false);OD.sound.setScene('village',{night:true});check(OD.sound.scene().night,'night state');if(AC)check(stats.noiseSources>before,'ambient sound sources not created');
    box.querySelector('[data-audio=ambient]').click();check(!OD.sound.status().ambientOn,'ambient mute');const mutedSources=stats.noiseSources;OD.sound.setScene('well_canal',{rain:true});check(stats.noiseSources===mutedSources,'sound sources created while muted');box.querySelector('[data-audio=ambient]').click();check(OD.sound.status().ambientOn,'ambient enable');
    OD.sound.setScene('office');const play=OD.vn.play([{bg:'well_canal',fx:'rain'},{say:'doctor',text:'สวัสดีครับ'},{narr:'เสียงฝนค่อย ๆ เบาลง'},{fx:null}]);await new Promise(r=>setTimeout(r,100));check(OD.sound.scene().rain,'VN rain');check(document.querySelector('#vn').dataset.foliage==='false','foreground foliage still appears at every outdoor location');
    const vn=document.querySelector('#vn .vn-box');vn.click();vn.click();await new Promise(r=>setTimeout(r,80));vn.click();vn.click();await play;check(OD.sound.scene().place==='office'&&!OD.sound.scene().rain,'VN scene restoration');check(stats.utterances===0,'dialogue unexpectedly spoke');
    document.body.dataset.soundAudit=errors.length?'fail':'pass';
  }catch(e){errors.push(e.stack||e.message);document.body.dataset.soundAudit='fail';}
    const pre=document.createElement('pre');pre.id='sound-audit-output';pre.textContent=JSON.stringify({stats,errors},null,2);document.body.append(pre);clearInterval(keepAlive);
  });
})();
