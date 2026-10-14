/* =========================================================
   main — หน้าชื่อเกม ลำดับบท และการตั้งค่า
   ========================================================= */
OD.main = (function(){
  const U = OD.u, M = OD.sim;
  const store = {get(k,d){ try{ const v = localStorage.getItem('od2-'+k); return v==null ? d : v; }catch(e){ return d; } },
                 set(k,v){ try{ localStorage.setItem('od2-'+k, v); }catch(e){} }};
  let pref = {name:store.get('name',''), gender:store.get('gender', store.get('pol','ครับ')==='ค่ะ' ? 'f' : 'm'), diff:store.get('diff','normal')};
  const GENDER = {m:{t:'ชาย', pol:'ครับ'}, f:{t:'หญิง', pol:'ค่ะ'}};

  /* ภาพหน้าตัวละครของผู้เล่น (วงกลม) — เก็บแคชไว้เพราะถูกวาดซ้ำบ่อย */
  const faceCache = new Map();
  OD.meFace = function(expr='neutral', cls=''){
    const g = (OD.S && OD.S.gender) || pref.gender, nm = (OD.S && OD.S.name) || pref.name, key = [g,nm,expr].join('|');
    if(!faceCache.has(key)) faceCache.set(key, OD.art.person('me', expr, {gender:g, tag:nm}));
    return `<span class="avatar ${cls}">${faceCache.get(key)}</span>`;
  };

  OD.toggleTheme = function(){
    const cur = document.documentElement.dataset.theme==='light' ? 'light' : 'dark', nx = cur==='light' ? 'dark' : 'light';
    if(nx==='light') document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
    OD.art.install(nx); store.set('theme', nx);
  };

  function title(){
    const D = M.DIFF;
    const desc = {easy:'งบ ฿60,000 · คำใบ้ละเอียด · แล็บแม่นยำ ~๙๒%', normal:'งบ ฿45,000 · มีคำใบ้ · แล็บแม่นยำ ~๘๒%', hard:'งบ ฿32,000 · ไม่มีคำใบ้ · แล็บ ~๗๐% · ชาวบ้านจำคลาดเคลื่อนมากขึ้น'};
    const root = U.$('#scr-title');
    root.innerHTML = `<div class="title-bg">${OD.art.scene('temple')}</div>
      <button class="btn btn-ghost btn-sm" data-t="theme" style="position:absolute;top:14px;right:14px;z-index:2" title="สลับธีม">🌓 ธีม</button>
      <div class="frame title-card">
        <div class="krajang-band"></div>
        <div class="title-eyebrow" style="margin-top:10px">เกมจำลองการสอบสวนโรค · HEALTH DATA SCIENCE</div>
        <h1 class="display gold-text title-main">นักสืบโรคระบาด<span class="title-num">๒</span></h1>
        <div class="title-sub">ปริศนาแห่งบ้านสุขใจ</div>
        <div class="orn-divider"></div>
        <p style="max-width:620px;margin:0 auto;color:var(--muted)">ผู้ป่วยท้องร่วงเพิ่มขึ้นผิดปกติในตำบลริมคลอง ข่าวลือแพร่เร็วกว่าเชื้อโรค — คุณคือนักวิทยาศาสตร์ข้อมูลสุขภาพที่ต้องใช้สถิติ ระบาดวิทยา และหลักฐานภาคสนาม ไขปริศนาให้ทันก่อนส่วนกลางจะมาถึง</p>
        <div class="title-form">
          <label>ชื่อของคุณ<input type="text" id="tName" maxlength="20" placeholder="เช่น ต้นกล้า" value="${U.esc(pref.name)}"></label>
          <div><label>ตัวละครของคุณ</label><div class="who-grid">${Object.entries(GENDER).map(([g,o])=>`<button class="diff who ${pref.gender===g?'on':''}" data-g="${g}">${'<span class="avatar">'+OD.art.person('me', pref.gender===g?'smile':'neutral', {gender:g, tag:pref.name})+'</span>'}<span><b>${o.t}</b><small>นักวิทยาศาสตร์ข้อมูลสุขภาพจบใหม่ · ใช้คำลงท้าย “${o.pol}”</small></span></button>`).join('')}</div></div>
          <div><label>ระดับความยาก</label><div class="diff-grid">${Object.keys(D).map(k=>`<button class="diff ${pref.diff===k?'on':''}" data-diff="${k}"><b>${D[k].label}</b><small>${desc[k]}</small></button>`).join('')}</div></div>
        </div>
        <div class="title-actions"><button class="btn btn-gold btn-lg" data-t="start">เริ่มเรื่อง</button><button class="btn btn-lg" data-t="quick" title="ข้ามบทนำ บทที่ ๑ และ ๒">ลงพื้นที่ทันที</button></div>
        <div class="title-actions" style="margin-top:10px"><button class="btn" data-t="howto">🎮 วิธีเล่น</button><button class="btn daily-btn" data-t="daily" title="ทุกคนเล่นคดีเดียวกันในวันนี้ · ระดับนักวิทยาศาสตร์ข้อมูล · ลงพื้นที่ทันที">📅 คดีประจำวัน</button><button class="btn" data-t="stats">🏆 สถิติและเหรียญ</button><button class="btn" data-t="hb">📘 คู่มือนักสืบมือใหม่</button></div>
        ${(()=>{ const m = OD.meta.summary(); return m.cases ? `<div class="title-prog"><span>🗂️ ไขได้ ${U.thaiNum(m.solvedTypes)}/๖ ต้นตอ</span><span>🎖️ เหรียญ ${U.thaiNum(m.ach)}/${U.thaiNum(m.achMax)}</span><span>📜 เหตุการณ์ ${U.thaiNum(m.seen)}/${U.thaiNum(m.seenMax)}</span><span>🏅 คะแนนสูงสุด ${m.best}</span></div>`
          : `<div class="title-new">เล่นครั้งแรก? กด <b>🎮 วิธีเล่น</b> (อ่าน ๓ นาที) แล้วเลือก <b>เริ่มเรื่อง</b> ระดับ <b>${D.normal.label}</b></div>`; })()}
        <div class="title-tools"><span>🚨 ระบบเตือนภัย</span><span>🤖 ML</span><span>🧭 เชิงพื้นที่</span><span>📱 NLP</span><span>⚖️ AI รับผิดชอบ</span><span>🔮 พยากรณ์</span><span>💻 SQL · Python · R</span></div>
        <div class="title-foot">สุ่มต้นตอใหม่ทุกคดีจาก ๖ รูปแบบ พร้อมคดีหักมุม · ใช้เวลาเล่นประมาณ ๓๐–๔๕ นาที · ตัวละคร สถานที่ และข้อมูลทั้งหมดเป็นเรื่องสมมติ</div>
        <div class="krajang-band down" style="margin-top:12px"></div>
      </div>`;
    root.onclick = e=>{
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.g){ pref.gender = b.dataset.g; title(); }
      if(b.dataset.diff){ pref.diff = b.dataset.diff; title(); }
      if(b.dataset.t==='theme') OD.toggleTheme();
      if(b.dataset.t==='hb') OD.handbook.open();
      if(b.dataset.t==='howto') OD.handbook.open('howto');
      if(b.dataset.t==='stats') OD.meta.open();
      if(['start','quick','daily'].includes(b.dataset.t)){
        pref.name = (U.$('#tName').value || '').trim() || 'นักสืบ';
        store.set('name', pref.name); store.set('gender', pref.gender); store.set('diff', pref.diff);
        root.onclick = null;
        play(b.dataset.t!=='start', b.dataset.t==='daily' ? {daily:true, seed:OD.meta.dailySeed(), diff:'normal'} : {});
      }
    };
    const inp = U.$('#tName'); inp.oninput = ()=>{ pref.name = inp.value; };
    U.show('scr-title');
    OD.music.setMood('calm');
  }

  async function play(skip, opts={}){
    const seed = opts.seed!=null ? opts.seed : (Math.random()*2**31)>>>0;
    const W = OD.W = M.build(seed);
    const S = OD.S = M.newState(W, opts.diff || pref.diff, pref.name);
    S.gender = pref.gender; S.pol = GENDER[pref.gender].pol;
    // สุ่มรูปแบบเรื่องราวต่อคดี (ผูกกับ seed — คดีประจำวันจึงได้เรื่องเดียวกันทุกคน)
    U.seed((seed ^ 0x2545F491)>>>0);
    const closable = ['W1','W2','W3','R1','R2','R3','R4','S'], cul = W.scn.culprit;
    // ข่าวลือในเฟซบุ๊ก/ที่กำนันกดดัน: ส่วนใหญ่ผิด แต่บางครั้ง (๒๐%) ก็ถูก — ต้องดูข้อมูลเสมอ
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
    else {
      await OD.vn.play(OD.story.prologue(W,S));
      await OD.vn.play(OD.story.ch1_intro(W,S));
      OD.music.setMood('calm');
      await OD.ch1.run();
      await OD.vn.play(OD.story.ch2_intro(W,S));
      OD.music.setMood('calm');
      await OD.ch2.run();
    }
    await OD.vn.play(OD.story.field_intro(W,S));
    await OD.field.run();
    await OD.report.run();
  }

  function boot(){
    const th = store.get('theme','dark');
    if(th==='light') document.documentElement.dataset.theme = 'light';
    OD.art.install(th);
    OD.music.arm();
    U.$('#hbCtl button').onclick = e=>{ e.stopPropagation(); OD.handbook.open(); };
    title();
  }
  return {boot, title, newCase:title, play};
})();
document.addEventListener('DOMContentLoaded', OD.main.boot);
