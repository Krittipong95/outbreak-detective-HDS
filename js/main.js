/* =========================================================
   main  หน้าชื่อเกม ลำดับบท และการตั้งค่า
   ========================================================= */
OD.main = (function(){
  const U = OD.u, M = OD.sim;
  const store = {get(k,d){ try{ const v = localStorage.getItem('od2-'+k); return v==null ? d : v; }catch(e){ return d; } },
                 set(k,v){ try{ localStorage.setItem('od2-'+k, v); }catch(e){} }};
  const savedDiff = store.get('diff', null);
  let pref = {name:store.get('name',''), gender:store.get('gender', store.get('pol','ครับ')==='ค่ะ' ? 'f' : 'm'), diff:savedDiff || 'easy'};
  const GENDER = {m:{t:'ชาย', pol:'ครับ'}, f:{t:'หญิง', pol:'ค่ะ'}};

  /* ภาพหน้าตัวละครของผู้เล่น (วงกลม)  เก็บแคชไว้เพราะถูกวาดซ้ำบ่อย */
  const faceCache = new Map();
  OD.meFace = function(expr='neutral', cls=''){
    const g = (OD.S && OD.S.gender) || pref.gender, nm = (OD.S && OD.S.name) || pref.name, key = [g,nm,expr].join('|');
    if(!faceCache.has(key)) faceCache.set(key, OD.art.portrait('me', expr, {gender:g, tag:nm}));
    return `<span class="avatar ${cls}">${faceCache.get(key)}</span>`;
  };

  OD.toggleTheme = function(){
    const cur = document.documentElement.dataset.theme==='light' ? 'light' : 'dark', nx = cur==='light' ? 'dark' : 'light';
    if(nx==='light') document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
    OD.art.install(nx); store.set('theme', nx);
  };

  function title(){
    const D = M.DIFF, saved = OD.session.status();
    const english = OD.i18n?.lang?.()==='en';
    document.body.classList.add('on-title');
    const desc = {easy:'งบ ฿60,000 · คำใบ้ละเอียด · ความไวแล็บพื้นฐาน ~๙๒%', normal:'งบ ฿45,000 · มีคำใบ้ · ความไวแล็บพื้นฐาน ~๘๒%', hard:'งบ ฿32,000 · ไม่มีคำใบ้ · ความไวแล็บพื้นฐาน ~๗๐% · ชาวบ้านจำคลาดเคลื่อนมากขึ้น'};
    const root = U.$('#scr-title');
    root.innerHTML = `<div class="title-bg">${OD.art.scene('temple')}</div>
      <button class="btn btn-ghost btn-sm" data-t="theme" style="position:absolute;top:14px;right:14px;z-index:2" title="สลับธีม">🌓 ธีม</button>
      <div class="frame title-card title-compact">
        <div class="title-layout"><div class="title-intro">
        <div class="title-sign"><span class="title-emblem" aria-hidden="true">${OD.art.prajamInline(32)}</span><span class="title-eyebrow">แฟ้มคดีบ้านสุขใจ</span></div>
        <h1 class="display gold-text title-main">นักสืบโรคระบาด<span class="title-num">๒</span></h1>
        <div class="title-sub">ปริศนาแห่งบ้านสุขใจ</div>
        <p class="title-story">ตามหาต้นตอโรคระบาดในหมู่บ้านริมคลอง<br>ฟังชาวบ้าน เชื่อมหลักฐาน และหยุดโรคให้ทันเวลา</p>
        <div class="title-postcard" aria-hidden="true">${OD.art.scene('village')}<span>หนึ่งหมู่บ้าน · หกปริศนา</span></div>
        ${saved && !saved.invalid ? `<div class="resume-card"><div><b>แฟ้มของ ${U.esc(saved.name)}</b><small>${saved.label} · ${new Date(saved.at).toLocaleDateString('th-TH')}</small></div><button class="btn btn-gold" data-t="resume">${saved.stage==='result'?'ดูผลคดี':'เล่นต่อ →'}</button></div>` : saved?.invalid ? `<p class="note">อ่านแฟ้มเดิมไม่ได้ คุณยังเริ่มคดีใหม่ได้</p>` : ''}
        <div class="practice-invite"><div><b>เล่นครั้งแรก?</b><small>คดีฝึก 5–10 นาที · พี่วิพาเล่น</small></div><button class="btn" data-t="practice">🌱 ลองคดีฝึก</button></div>
        ${(()=>{const m=OD.meta.summary();return m.cases?`<div class="title-prog"><span>🗂️ ไขได้ ${U.thaiNum(m.solvedTypes)}/๖ ต้นตอ</span><span>🎖️ ${U.thaiNum(m.ach)} เหรียญ</span><span>🏅 สูงสุด ${m.best}</span></div>`:'<div class="title-route"><span>① สัมภาษณ์</span><span>② ตรวจหลักฐาน</span><span>③ สรุปคดี</span></div>';})()}
        </div><div class="title-setup">
        <div class="setup-heading"><b>เปิดแฟ้มคดีใหม่</b><span>ประมาณ 30–45 นาที</span></div>
        <div class="title-form">
          <div class="setup-language" data-no-translate><div><b>${english?'Language':'ภาษา'}</b><small>${english?'Choose once before starting':'เลือกครั้งเดียวก่อนเริ่มเกม'}</small></div><div class="setup-language-buttons" role="group" aria-label="Language"><button type="button" class="${!english?'on':''}" data-ui-lang="th">ไทย</button><button type="button" class="${english?'on':''}" data-ui-lang="en">English</button></div></div>
          <label>ชื่อของคุณ<input type="text" id="tName" maxlength="20" placeholder="เช่น ต้นกล้า" value="${U.esc(pref.name)}"></label>
          <div><div class="setup-label" id="character-label">เลือกตัวละคร</div><div class="who-grid" role="group" aria-labelledby="character-label">${Object.entries(GENDER).map(([g,o])=>`<button class="diff who ${pref.gender===g?'on':''}" data-g="${g}" aria-pressed="${pref.gender===g}">${'<span class="avatar">'+OD.art.portrait('me', pref.gender===g?'smile':'neutral', {gender:g, tag:pref.name})+'</span>'}<span><b>${o.t}</b><small>ใช้คำลงท้าย “${o.pol}”</small></span></button>`).join('')}</div></div>
          <div><div class="setup-label" id="difficulty-label">ระดับความยาก</div><div class="diff-grid" role="group" aria-labelledby="difficulty-label">${Object.keys(D).map(k=>`<button class="diff ${pref.diff===k?'on':''}" data-diff="${k}" aria-pressed="${pref.diff===k}" aria-describedby="difficulty-note" title="${D[k].label}"><b>${{easy:'เริ่มต้น',normal:'มาตรฐาน',hard:'ท้าทาย'}[k]}</b><small>${{easy:'มีคำใบ้ละเอียด',normal:'มีคำใบ้',hard:'ไม่มีคำใบ้'}[k]}</small></button>`).join('')}</div><p id="difficulty-note" class="difficulty-note" aria-live="polite">${desc[pref.diff]}</p></div>
        </div>
        <div class="title-actions title-play"><button class="btn btn-gold btn-lg" data-t="start">เริ่มเรื่อง →</button><button class="btn btn-lg" data-t="quick" title="ข้ามบทนำ บทที่ ๑ และ ๒">ลงพื้นที่ทันที</button></div>
        <nav class="title-shortcuts" aria-label="เมนูเพิ่มเติม"><button class="btn" data-t="howto">🎮 วิธีเล่น</button><button class="btn daily-btn" data-t="daily" title="คดีเดียวกันสำหรับทุกคนวันนี้ · ระดับมาตรฐาน">📅 คดีประจำวัน</button><button class="btn" data-t="stats">🏆 สถิติและเหรียญ</button><button class="btn" data-t="hb">📘 คู่มือนักสืบ</button></nav>
        </div></div>
        <div class="title-foot">บันทึกอัตโนมัติในเบราว์เซอร์นี้ · ตัวละคร สถานที่ และข้อมูลเป็นเรื่องสมมติ</div>
      </div>`;
    root.onclick = async e=>{
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.uiLang) return OD.i18n.setLanguage(b.dataset.uiLang);
      if(b.dataset.g){ pref.gender = b.dataset.g; title(); }
      if(b.dataset.diff){ pref.diff = b.dataset.diff; title(); }
      if(b.dataset.t==='theme') OD.toggleTheme();
      if(b.dataset.t==='practice') return OD.practice.open();
      if(b.dataset.t==='resume'){const stage=OD.session.restore();if(!stage){U.toast('อ่านแฟ้มนี้ไม่ได้ กรุณาเริ่มคดีใหม่');return;}root.onclick=null;return continueCase(stage);}
      if(b.dataset.t==='hb') OD.handbook.open();
      if(b.dataset.t==='howto') OD.handbook.open('howto');
      if(b.dataset.t==='stats') OD.meta.open();
      if(['start','quick','daily'].includes(b.dataset.t)){
        const prior=OD.session.status();
        if(prior && prior.stage!=='result'){const choice=await U.ask('<h2>เริ่มคดีใหม่?</h2><p>คดีใหม่จะบันทึกแทนแฟ้มเดิม ถ้ายังอยากสืบคดีเดิม ให้เลือกเล่นต่อจากหน้าแรก</p>',[['back','กลับ',''],['new','เริ่มคดีใหม่','btn-gold']]);if(choice!=='new')return;}
        pref.name = (U.$('#tName').value || '').trim() || 'นักสืบ';
        store.set('name', pref.name); store.set('gender', pref.gender); store.set('diff', pref.diff);
        root.onclick = null;
        play(b.dataset.t!=='start', b.dataset.t==='daily' ? {daily:true, seed:OD.meta.dailySeed(), diff:'normal'} : {});
      }
    };
    const inp = U.$('#tName'); inp.oninput = ()=>{ pref.name = inp.value; };
    U.show('scr-title');
    OD.music.setMood('calm'); if(OD.sound)OD.sound.setScene('village');
  }

  async function play(skip, opts={}){
    const seed = opts.seed!=null ? opts.seed : (Math.random()*2**31)>>>0;
    const W = OD.W = M.build(seed);
    const S = OD.S = M.newState(W, opts.diff || pref.diff, pref.name);
    S.gender = pref.gender; S.pol = GENDER[pref.gender].pol;
    // สุ่มรูปแบบเรื่องราวต่อคดี (ผูกกับ seed  คดีประจำวันจึงได้เรื่องเดียวกันทุกคน)
    U.seed((seed ^ 0x2545F491)>>>0);
    const closable = ['W1','W2','W3','R1','R2','R3','R4','S'], cul = W.scn.culprit;
    // ข่าวลือในเฟซบุ๊ก/ที่กำนันกดดัน: ส่วนใหญ่ผิด แต่บางครั้ง (๒๐%) ก็ถูก  ต้องดูข้อมูลเสมอ
    S.flags.rumor = closable.includes(cul) && U.r() < .2 ? cul : U.pick(closable.filter(x=>x!==cul));
    S.flags.rumor0 = U.pick(['E','R1','R2','R3','R4','S','W1','W2','W3'].filter(x=>x!==S.flags.rumor));   // ข่าวลือแรกในสายโทรศัพท์
    S.flags.v = {pressure:U.pick(['hall','protest','live']), patient:U.pick(['thongbai','baby','boonsong']),
                 fest:U.pick(['kathin','wedding']), media:U.pick(['radio','tv','influencer'])};
    S.flags.pool = U.shuffle(OD.story.POOL).slice(0,3);
    S.flags.jit = Object.fromEntries(OD.story.POOL.map(id=>[id, Math.floor(U.r()*9)]));   // เลื่อนเวลาเหตุการณ์สุ่ม ๐–๘ ชม.
    U.unseed();
    M.setFest(S.flags.v.fest);
    if(opts.daily) S.flags.daily = true;
    if(skip){ S.acc = {ch1:4, ch1Max:6, ch2:12, ch2Max:16}; S.flags.quick = true; }
    await continueCase(skip?'field':'prologue', true);
  }

  async function continueCase(stage, fresh=false){
    document.body.classList.remove('on-title');
    const W=OD.W, S=OD.S;
    if(stage==='result')return OD.reportSaved();
    if(stage==='prologue'){
      OD.session.save('prologue');
      await OD.vn.play(OD.story.prologue(W,S));
      await OD.vn.play(OD.story.ch1_intro(W,S));stage='ch1';
    }
    if(stage==='ch1'){
      OD.session.save('ch1');OD.music.setMood('calm');await OD.ch1.run();
      await OD.vn.play(OD.story.ch2_intro(W,S));stage='ch2';
    }
    if(stage==='ch2'){
      OD.session.save('ch2');OD.music.setMood('calm');await OD.ch2.run();stage='field';fresh=true;
    }
    if(stage==='field'){
      OD.session.save('field');
      if(fresh)await OD.vn.play(OD.story.field_intro(W,S));
      await OD.field.run();stage='report';
    }
    if(stage==='report'){OD.session.save('report');await OD.report.run();}
  }

  function boot(){
    const th = store.get('theme','dark');
    if(th==='light') document.documentElement.dataset.theme = 'light';
    OD.art.install(th);
    OD.music.arm(); OD.session.init(); OD.guide.init();
    U.$('#hbCtl button').onclick = e=>{ e.stopPropagation(); OD.handbook.open(); };
    title();
  }
  return {boot, title, newCase:title, play};
})();
document.addEventListener('DOMContentLoaded', OD.main.boot);
