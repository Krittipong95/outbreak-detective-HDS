/* =========================================================
   music — เพลงประกอบสำนวนเพลงไทยเดิม เขียนด้วย "โน้ตไทย" (ด ร ม ฟ ซ ล ท)
   วงแบบปี่พาทย์: ระนาดเอก (ตีเก็บ/คู่แปด) · ฆ้องวง (ทำนองหลัก) · ขลุ่ย ·
   ฉิ่ง–ฉับ · ตะโพน/โทน · กลองยาว   — สังเคราะห์เสียงสด ไม่ใช้ไฟล์เพลง
   เพิ่มเพลงเองได้ที่ js/songs-custom.js (เช่น เพลงไทยเดิมที่มีโน้ตอยู่แล้ว)
   ========================================================= */
window.OD = window.OD || {};
OD.music = (function(){
  const store = {get(k,d){ try{ const v = localStorage.getItem('od2-'+k); return v==null ? d : v; }catch(e){ return d; } },
                 set(k,v){ try{ localStorage.setItem('od2-'+k, v); }catch(e){} }};
  let ctx = null, master = null, bus = null, timer = null;
  let enabled = store.get('music','1')==='1', vol = (+store.get('vol','55'))/100;
  let song = 'kangkao', target = 'kangkao', pos = 0, nextT = 0, cur = null;

  /* ---------- โน้ตไทย ---------- */
  // หนึ่งตัว = หนึ่งตำแหน่ง (ห้องละ ๔ ตำแหน่ง)  "-" = ลากเสียง/เว้น  "." = หยุดเสียง
  // เสียงสูงหนึ่งช่วงทบใส่ ํ (หรือ ')  เสียงต่ำใส่ ฺ (หรือ ,)
  const TH = {'ด':0, 'ร':2, 'ม':4, 'ฟ':5, 'ซ':7, 'ล':9, 'ท':11};
  function parseThai(str, root=60){
    const ev = [];
    for(const tok of String(str).replace(/\|/g,' ').trim().split(/\s+/)){
      if(!tok) continue;
      if(tok==='-'){ ev.push({k:'-'}); continue; }
      if(tok==='.' || tok==='x'){ ev.push({k:'.'}); continue; }
      // หนึ่งตำแหน่งอาจมีหลายเสียง (เช่น "รซ" = เขบ็ตสองชั้นสองตัว)
      const ns = [];
      for(const ch of tok){
        if(TH[ch]!=null) ns.push(root + TH[ch]);
        else if(ns.length && (ch==='ํ' || ch==="'")) ns[ns.length-1] += 12;
        else if(ns.length && (ch==='ฺ' || ch===',')) ns[ns.length-1] -= 12;
      }
      if(!ns.length){ ev.push({k:'-'}); continue; }
      ev.push(ns.length===1 ? {n:ns[0]} : {n:ns[ns.length-1], ns});
    }
    while(ev.length % 8) ev.push({k:'-'});
    return ev;
  }

  /* ---------- เพลง (ประพันธ์ใหม่ในสำนวนเพลงไทยเดิม: ลูกตกท้ายห้อง) ---------- */
  const SONGS = {};
  /* แต่ละช่วงของเกมมีรายการเพลง (เล่นวนสลับกันเมื่อจบเพลง) */
  const MOOD = {calm:['kangkao','sanuk'], field:['kangkao_f','field'], tense:['tense'], ending:['kangkao_e','ending'], night:['night']};
  let moodKey = 'calm', moodIdx = 0;
  function addSong(key, o){
    SONGS[key] = {name:o.name||key, bpm:o.bpm||110, lead:o.lead||'ranat', drum:o.drum||'chandiao', ching:o.ching||'chandiao',
                  ev: parseThai(o.notation, o.root||60)};
    if(o.mood) MOOD[o.mood] = [key];
    return SONGS[key];
  }
  /* ค้างคาวกินกล้วย — เพลงไทยเดิม (สาธารณสมบัติ) ถอดจากโน้ตที่ผู้ใช้ให้มา แต่ละท่อนบรรเลงสองเที่ยว */
  const KK1 = `- ล - ซ  ซ ซ - มํ  - - ซํ มํ  - - รํ มํ  - - ซํ มํ  - - รํ มํ  ซํ มํ รํ ดํ  - รํ - มํ
               - ล - ซ  ซ ซ - มํ  - - ซํ มํ  - - รํ มํ  - - ซํ มํ  - - รํ มํ  ซํ มํ รํ ดํ  - รํ - ดํ`;
  const KK2 = `- - - -  - รํ - รํ  - - มํ รํ  ดํ รํ - -  มํ รํ ดํ รํ  มํ รํ ดํ ท  ล ซ ล ท  ล ท ดํ รํ
               - - - -  - รํ - รํ  - - มํ รํ  ดํ รํ - -  มํ รํ ดํ รํ  มํ ดํ รํ มํ  ซํ มํ รํ ดํ  รํ ดํ ท ล`;
  const KK3 = `- - - -  - ล - ล  - - ดํ ล  ซ ม - ซ  - ม - ล  ซ ม - ซ  - ล - ซ  ดํ ล ล ล
               - - - -  - ล - ล  - - ดํ ล  ซ ม - ซ  - ม - ล  ซ ม - ซ  ม - รซ ม  ม ม - -`;
  const KK = [KK1, KK1, KK2, KK2, KK3, KK3].join('\n');
  addSong('kangkao',   {name:'ค้างคาวกินกล้วย', bpm:124, root:55, drum:'chandiao', notation:KK});
  addSong('kangkao_f', {name:'ค้างคาวกินกล้วย (ลงพื้นที่)', bpm:112, root:55, drum:'taphon', notation:KK});
  addSong('kangkao_e', {name:'ค้างคาวกินกล้วย (ฉลองชัย)', bpm:136, root:55, drum:'klongyao', notation:KK});
  addSong('sanuk', {name:'สนุกบ้านสุขใจ', bpm:120, drum:'chandiao', notation:`
    - ม - ซ   - ล - ซ   - ม - ร   - ม - ซ   - ล - ซ   - ม - ร   - ด - ร   - - - ม
    - ม - ซ   - ล - ซ   - ม - ร   - ม - ซ   - ล - ดํ  - ล - ซ   - ม - ร   - - - ด
    ด ร ม ซ   - ม - ร   ม ซ ล ดํ  - ล - ซ   ล ดํ รํ ดํ  ล ซ ม ซ   - ล - ซ   - - - ม
    - ซ - ม   - ร - ด   - ม - ซ   - ล - ซ   - ดํ - ล  - ซ - ม   - ร - ม   - - - ด`});
  addSong('field', {name:'ลงพื้นที่', bpm:112, drum:'taphon', notation:`
    - ล - ดํ  - ล - ซ   - ม - ซ   - - - ล   - ล - ดํ  - รํ - ดํ  - ล - ซ   - - - ล
    - ม - ซ   - ล - ดํ  - ล - ซ   - ม - ร   - ม - ซ   - ล - ซ   - ม - ร   - - - ม
    ล ดํ ล ซ  ม ซ ล ดํ  - รํ - ดํ  - ล - ซ   ม ร ม ซ   ล ซ ม ร   - ม - ซ   - - - ล
    - ดํ - ล  - ซ - ม   - ซ - ล   - ดํ - ล  - ซ - ม   - ร - ม   - ซ - ม   - - - ล`});
  addSong('tense', {name:'นาทีวิกฤต', bpm:136, drum:'rua', notation:`
    ล ล ล ซ   ล ดํ ล ซ  ม ม ม ร   ม ซ ม ร   ล ล ล ซ   ล ดํ รํ ดํ  ล ซ ม ซ   - - - ล
    ดํ ดํ ดํ ล  ดํ รํ ดํ ล  ซ ซ ซ ม   ซ ล ซ ม   ร ม ซ ล   ซ ม ร ม   ซ ล ซ ม   - - - ล`});
  addSong('ending', {name:'ฉลองชัยบ้านสุขใจ', bpm:128, drum:'klongyao', notation:`
    - ซ - ล   - ดํ - รํ  - ดํ - ล  - ซ - ล   - ดํ - ล  - ซ - ม   - ร - ม   - - - ซ
    - ซ - ล   - ดํ - รํ  - มํ - รํ  - ดํ - ล  - ซ - ล   - ดํ - ล  - ซ - ม   - - - ด
    ม ซ ล ดํ  รํ ดํ ล ซ  ม ซ ล ดํ  ล ซ ม ซ   ล ดํ รํ มํ  รํ ดํ ล ซ  - ล - ซ   - - - ม
    - ร - ม   - ซ - ล   - ดํ - ล  - ซ - ม   - ซ - ล   - ซ - ม   - ร - ม   - - - ด`});
  addSong('night', {name:'ค่ำคืนริมคลอง', bpm:76, lead:'khlui', drum:'none', ching:'songchan', notation:`
    - - - ม   - - - ซ   - - - ล   - ซ - ม   - - - ร   - - - ม   - - - ร   - - - ด
    - - - ร   - - - ม   - - - ซ   - ล - ดํ  - - - ล   - ซ - ม   - - - ร   - - - ม`});

  const SCENE = {office_night:'night', lab:'field', ice_factory:'field', hall:'field', market:'field', temple:'calm', village:'calm', office:'calm',
                 well_temple:'field', well_market:'field', well_canal:'field', somtam:'field', noodle_boat:'field', chicken_rice:'field', mookata:'night',
                 school:'calm', farm:'calm', clinic:'field'};
  /* หน้าทับกลอง ๘ ตำแหน่ง (สองห้อง): L = เสียงทุ้ม (ทั่ง/ตุ๊บ)  S = เสียงตบ (ปะ/ป๊ะ) — จังหวะหนักอยู่ท้ายห้อง */
  const DRUM = {chandiao:'.S.L.SSL', taphon:'..SL.S.L', rua:'LS.LLS.L', klongyao:'LS.LSLSL', none:'........'};
  const mtof = m => 440*Math.pow(2,(m-69)/12);

  function init(){
    if(ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false;
    ctx = new AC(); buildGraph();
    document.addEventListener('visibilitychange', ()=>{ if(!ctx) return; if(document.hidden) ctx.suspend(); else if(enabled) ctx.resume(); });
    return true;
  }
  function buildGraph(){
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    bus = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = .85; bus.connect(dry); dry.connect(master);
    const conv = ctx.createConvolver(), wet = ctx.createGain(); conv.buffer = impulse(2.2); wet.gain.value = .26;
    bus.connect(conv); conv.connect(wet); wet.connect(master);
  }
  function impulse(sec){
    const len = Math.floor(ctx.sampleRate*sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let c=0;c<2;c++){ const d = b.getChannelData(c); for(let i=0;i<len;i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/len, 3); }
    return b;
  }

  /* ---------- เครื่องดนตรี ---------- */
  function env(g, t, a, peak, d){ g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak), t+a); g.gain.exponentialRampToValueAtTime(.0001, t+a+d); }
  function tone(type, f, t, a, peak, d){ const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); env(g, t, a, peak, d); o.connect(g); g.connect(bus); o.start(t); o.stop(t+a+d+.05); }
  function noise(t, d, peak, hp){
    const n = Math.max(1, Math.floor(ctx.sampleRate*d)), b = ctx.createBuffer(1, n, ctx.sampleRate), x = b.getChannelData(0);
    for(let i=0;i<n;i++) x[i] = Math.random()*2-1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; env(g, t, .002, peak, d);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t);
  }
  function ranat(t, midi, v){ const f = mtof(midi); tone('sine', f, t, .002, .18*v, .42); tone('triangle', f*2, t, .001, .03*v, .14); tone('sine', f*3.96, t, .001, .04*v, .07); noise(t, .012, .03*v, 4000); }
  function khong(t, midi, v){ const f = mtof(midi); tone('sine', f, t, .004, .13*v, 1.1); tone('sine', f*1.004, t, .004, .07*v, 1.0); tone('sine', f*2.76, t, .002, .035*v, .35); }
  function drum(t, slap, v){
    if(slap){ tone('triangle', 330, t, .002, .15*v, .09); noise(t, .06, .085*v, 900); return; }
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(58, t+.15);
    env(g, t, .003, .48*v, .32); o.connect(g); g.connect(bus); o.start(t); o.stop(t+.38);
  }
  function ching(t, open, v){
    for(const [f,a] of [[2793,.04],[3951,.028],[5274,.016]]) tone('sine', f, t, .001, a*v, open ? 1.1 : .045);
    if(!open) noise(t, .04, .05*v, 6500);
  }
  function khlui(t, midi, dur, v){
    const f = mtof(midi), o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f*.985, t); o.frequency.exponentialRampToValueAtTime(f, t+.12);
    lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f*.008, t+Math.min(.5, dur*.5));
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.09*v, t+.08);
    g.gain.setValueAtTime(.09*v, t+dur*.8); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
    o.connect(g); g.connect(bus); o.start(t); lfo.start(t); o.stop(t+dur+.05); lfo.stop(t+dur+.05);
    noise(t, .08, .015*v, 3500);
  }

  /* ---------- เครื่องเล่นทีละตำแหน่ง ---------- */
  function play(t, S, spb){
    const len = S.ev.length, i = pos % len, step = i % 8, ev = S.ev[i];
    if(ev.ns && S.lead==='ranat'){                                               // หลายเสียงในตำแหน่งเดียว
      ev.ns.forEach((n,j)=>{ const tt = t + j*spb/ev.ns.length; ranat(tt, n+12, .9); ranat(tt, n, .4); });
      khong(t + (ev.ns.length-1)*spb/ev.ns.length, ev.n, step%4===3 ? 1 : .75); cur = ev.n;
    } else if(ev.n!=null){
      cur = ev.n;
      khong(t, ev.n, step%4===3 ? 1 : .75);                                    // ฆ้องวงเดินทำนองหลัก
      if(S.lead==='ranat'){ ranat(t, ev.n+12, step%2 ? 1 : .8); ranat(t, ev.n, .45); }   // ระนาดตีคู่แปด
      else { let d = 1; while(S.ev[(i+d)%len].k==='-' && d<16) d++; khlui(t, ev.n, d*spb*.95, 1); }
    } else if(ev.k==='-' && cur!=null && S.lead==='ranat'){
      ranat(t, step%2 ? cur+12 : cur, .34);                                       // ระนาดตีเก็บระหว่างเสียงยาว
    } else if(ev.k==='.') cur = null;
    const dp = DRUM[S.drum][step];
    if(i >= len-4 && S.drum!=='none') drum(t, i%2===0, .9);                      // ลูกส่งท้ายวรรค
    else if(dp!=='.') drum(t, dp==='S', step%4===3 ? 1 : .8);
    if(S.ching==='chandiao'){ if(step%4===1) ching(t, true, .9); if(step%4===3) ching(t, false, .9); }   // ชั้นเดียว: ฉิ่ง–ฉับ ทุกห้อง
    else { if(step===3) ching(t, true, .7); if(step===7) ching(t, false, .7); }                          // สองชั้น
  }
  function tick(){
    if(!ctx || ctx.state!=='running') return;
    let S = SONGS[song], spb = 60/S.bpm/2;
    if(nextT < ctx.currentTime) nextT = ctx.currentTime + .06;
    while(nextT < ctx.currentTime + .25){
      play(nextT, S, spb);
      nextT += spb; pos++;
      const list = MOOD[moodKey] || [];
      if(pos % S.ev.length === 0 && list.length>1 && target===song){ moodIdx = (moodIdx+1) % list.length; target = list[moodIdx]; }   // จบเพลง → เพลงถัดไปในรายการ
      if(pos%8===0 && target!==song){ song = target; pos = 0; cur = null; S = SONGS[song]; spb = 60/S.bpm/2; ui(); }
    }
  }

  /* ---------- ควบคุม ---------- */
  function fade(to, sec=1){ if(master) master.gain.setTargetAtTime(to, ctx.currentTime, sec/3); }
  function start(){
    if(!enabled || !init()) return;
    if(ctx.state!=='running') ctx.resume();
    if(!timer){ nextT = ctx.currentTime + .1; timer = setInterval(tick, 40); }
    fade(vol*.7);
  }
  function stop(){
    if(!ctx) return; fade(0, .6);
    setTimeout(()=>{ if(!enabled && timer){ clearInterval(timer); timer = null; ctx.suspend(); } }, 900);
  }
  function setMood(m){
    if(MOOD[m]){ if(m===moodKey && MOOD[m].includes(target)) return; moodKey = m; moodIdx = 0; target = MOOD[m][0]; }
    else if(SONGS[m]) target = m; else return;
    if(!timer){ song = target; pos = 0; }
  }
  function sceneMood(bg){ setMood(SCENE[String(bg).split(':')[0]] || 'calm'); }
  function toggle(){ enabled = !enabled; store.set('music', enabled ? '1' : '0'); enabled ? start() : stop(); ui(); }
  function setVolume(v){ vol = v; store.set('vol', Math.round(v*100)); if(enabled) start(); }
  function ui(){
    const box = document.getElementById('musicCtl'); if(!box) return;
    if(!box.dataset.ready){
      box.innerHTML = `<button class="music-btn" type="button"></button><input type="range" min="0" max="100" aria-label="ระดับเสียงเพลง">`;
      box.dataset.ready = '1';
      box.querySelector('button').onclick = e=>{ e.stopPropagation(); toggle(); };
      const r = box.querySelector('input'); r.value = Math.round(vol*100);
      r.oninput = e=>{ setVolume(e.target.value/100); if(!enabled){ enabled = true; store.set('music','1'); start(); ui(); } };
    }
    const b = box.querySelector('button');
    b.textContent = enabled ? '🎵' : '🔇';
    b.title = enabled ? `กำลังเล่น: ${SONGS[song].name} (คลิกเพื่อปิดเพลง)` : 'เปิดเพลงประกอบ';
    box.classList.toggle('off', !enabled);
  }
  function arm(){ ui(); const go = ()=>{ if(enabled) start(); }; document.addEventListener('pointerdown', go, {once:true}); document.addEventListener('keydown', go, {once:true}); }

  /* ---------- เสียงเอฟเฟกต์ (ปิดพร้อมเพลงด้วยปุ่ม 🎵) ---------- */
  let sfxBus = null;
  function sfx(name){
    if(!enabled || !ctx || ctx.state!=='running') return;     // ต้องมีการคลิกครั้งแรกก่อน (นโยบายเบราว์เซอร์)
    if(!sfxBus){ sfxBus = ctx.createGain(); sfxBus.connect(ctx.destination); }
    sfxBus.gain.value = vol*.8;
    const t = ctx.currentTime + .01;
    const T = (type, f, a, peak, d, at=0, f2) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t+at);
      if(f2) o.frequency.exponentialRampToValueAtTime(f2, t+at+a+d); g.gain.setValueAtTime(.0001, t+at); g.gain.exponentialRampToValueAtTime(peak, t+at+a);
      g.gain.exponentialRampToValueAtTime(.0001, t+at+a+d); o.connect(g); g.connect(sfxBus); o.start(t+at); o.stop(t+at+a+d+.05); };
    const N = (d, peak, hp, at=0) => { const n = Math.max(1, Math.floor(ctx.sampleRate*d)), b = ctx.createBuffer(1, n, ctx.sampleRate), x = b.getChannelData(0);
      for(let i=0;i<n;i++) x[i] = (Math.random()*2-1)*(1-i/n); const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = peak; s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t+at); };
    switch(name){
      case 'blip':  T('sine', 880, .005, .14, .12); T('sine', 1320, .005, .1, .14, .08); break;             // รายงานผู้ป่วยใหม่
      case 'ding':  T('sine', 1568, .003, .22, .9); T('sine', 2093, .003, .12, .7, .12); break;             // ผลแล็บออก
      case 'ring':  for(let i=0;i<4;i++){ T('square', 1250, .005, .045, .06, i*.11); T('square', 1550, .005, .035, .06, i*.11+.05); } break;   // โทรศัพท์
      case 'stamp': T('sine', 130, .002, .55, .28, 0, 45); N(.09, .35, 180); break;                        // ประทับตรา
      case 'chime': [1047,1319,1568,2093].forEach((f,i)=>T('triangle', f, .004, .16, .6, i*.09)); break;    // ได้เหรียญ
      case 'pin':   T('triangle', 1800, .002, .1, .06); N(.03, .12, 3000); break;                           // ปักหมุดบนกระดาน
      case 'page':  N(.2, .1, 1200); break;                                                                  // พลิกกระดาษ
      case 'alert': T('sawtooth', 233, .01, .08, .4, 0, 170); T('sawtooth', 220, .01, .07, .4); break;     // ข่าวร้าย
      case 'heart': T('sine', 660, .005, .1, .15); T('sine', 990, .005, .08, .22, .1); break;               // ความสนิทเพิ่ม
      case 'down':  T('sine', 520, .005, .09, .2, 0, 330); break;                                           // ความสนิทลด
    }
  }
  OD.sfx = sfx;

  /* เรนเดอร์ออฟไลน์เพื่อตรวจระดับเสียง (ใช้ตอนทดสอบเท่านั้น) */
  async function renderTest(sec=8, s='sanuk'){
    const keep = {ctx, master, bus, song, target, pos, cur};
    ctx = new OfflineAudioContext(2, Math.floor(44100*sec), 44100);
    song = target = (MOOD[s] ? MOOD[s][0] : s); pos = 0; cur = null; buildGraph(); master.gain.value = vol*.7;
    const S = SONGS[song], spb = 60/S.bpm/2;
    for(let t=.05; t<sec-.6; t+=spb){ play(t, S, spb); pos++; }
    const buf = await ctx.startRendering(), d = buf.getChannelData(0);
    let sum = 0, peak = 0; for(let i=0;i<d.length;i++){ sum += d[i]*d[i]; peak = Math.max(peak, Math.abs(d[i])); }
    ({ctx, master, bus, song, target, pos, cur} = keep);
    return {rms:Math.sqrt(sum/d.length), peak};
  }
  return {arm, start, stop, toggle, setMood, sceneMood, setVolume, renderTest, addSong, parseThai, sfx, songs:()=>Object.keys(SONGS)};
})();
