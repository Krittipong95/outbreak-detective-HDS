/* =========================================================
   field-core — บทที่ ๓: เวลา งบประมาณ ความเชื่อมั่น การกระทำ
   OD.field.run() -> Promise (resolve เมื่อส่งรายงาน)
   ========================================================= */
OD.field = (function(){
  const U = OD.u, M = OD.sim;
  let W, S, done, fired;
  const F = {};
  const nm = id => M.SITES[id].name;
  const log = (text, kind='', t) => S.log.unshift({t: t==null ? S.T : t, text, kind});

  F.spend = function(h, b, label){
    if(label) log(label);
    const key = r => r.p.id + (r.dup?'d':'');
    const before = new Set(M.records(W,S).map(key)), t0 = S.T;
    S.T = Math.min(S.T + h, M.DEADLINE); S.budget -= b;
    const fresh = M.records(W,S).filter(r=>!before.has(key(r)));
    S.newIds = new Set(fresh.map(r=>r.p.id)); S.lastNew = fresh.length;
    if(fresh.length){ log(`รับรายงานผู้ป่วยใหม่ ${fresh.length} ราย`, 'bad'); U.toast(`📋 รับรายงานผู้ป่วยใหม่ ${fresh.length} ราย`, 'red'); OD.sfx && OD.sfx('blip'); }
    // ผ่านเวลา ๐๘:๐๐ น. ของวันใหม่ → มีรายงานเช้าในรอบถัดไป
    if(Math.floor((S.T-8)/24) > Math.floor((t0-8)/24) && S.T < M.DEADLINE) S.flags.brief = true;
  };
  F.closeSite = function(id, reason){
    if(M.isClosed(S,id)) return;
    if(S.closed[id]!=null){   // เคยเปิดคืนไปแล้ว — สั่งปิดซ้ำได้หนึ่งครั้ง
      if(!M.wasReopened(S,id)) return;
      S.reclosed[id] = S.T; S.ver++; S.trust -= 2;
      log(`มาตรการเร่งด่วน: สั่งปิด${nm(id)}อีกครั้ง${reason?` (${reason})`:''}`, 'good'); return;
    }
    S.closed[id] = S.T; S.ver++; S.trust -= 3;
    log(`มาตรการเร่งด่วน: ปิด/งดใช้${nm(id)}${reason?` (${reason})`:''}`, 'good');
  };
  F.reopenSite = function(id, reason){
    if(!M.isClosed(S,id) || S.reopened[id]!=null) return;
    S.reopened[id] = S.T; S.ver++;
    log(`เปิด${nm(id)}ให้กลับมาใช้งาน${reason?` (${reason})`:''}`, '');
  };
  const nClosed = () => Object.keys(S.closed).filter(id=>M.isClosed(S,id)).length;
  const can = c => S.budget >= c.b && S.T + c.h <= M.DEADLINE;
  const costTxt = c => `${c.h} ชม.${c.b?`<br>${U.baht(c.b)}`:''}`;

  /* ---------- หลังทุกการกระทำ: ผลแล็บ เหตุการณ์ เส้นตาย ---------- */
  /* รายงานเช้า: ยอดผู้ป่วย ๒๔ ชม. ล่าสุด แนวโน้ม และเวลาที่เหลือ — สร้างจังหวะและแรงกดดันแต่ละวัน */
  async function briefing(){
    S.flags.brief = false;
    const recs = M.records(W,S).filter(r=>!r.dup && !r.phantom), rt = r => M.repTime(S,r.p);
    const win = k => recs.filter(r=>{ const t = rt(r); return t>S.T-24*(k+1) && t<=S.T-24*k; }).length;
    const now = win(0), prev = win(1), days = Math.max(1, Math.ceil((S.T-M.T0)/24));
    const series = Array.from({length:Math.min(days,6)}, (_,i)=>win(Math.min(days,6)-1-i));
    const mx = Math.max(1, ...series), left = M.DEADLINE - S.T, labs = S.labs.filter(l=>!l.seen).length;
    const spark = `<svg viewBox="0 0 ${series.length*26} 58" class="spark">${series.map((v,i)=>{ const h = Math.max(1, v/mx*38), y = 56-h;
      return `<rect x="${i*26+4}" y="${y}" width="18" height="${h}" rx="2"/><text x="${i*26+13}" y="${y-3}" text-anchor="middle">${v}</text>`; }).join('')}</svg>`;
    const up = now>prev, msg = now===0 ? 'เมื่อวานไม่มีผู้ป่วยรายใหม่เลย — ถ้ายังเจอต่อเนื่องอีกสองช่วงระยะฟักตัว ก็ประกาศว่าการระบาดสงบได้'
      : up && !nClosed() ? 'ผู้ป่วยยังเพิ่มขึ้นทุกวัน — ถ้าหลักฐานพอแล้วอย่ารอนาน การควบคุมแหล่งโรคเร็วคือการป้องกันผู้ป่วยรายต่อไป'
      : up ? 'ผู้ป่วยยังเพิ่ม แต่บางรายติดเชื้อก่อนเราปิดแหล่งโรค (อยู่ในระยะฟักตัว) — ติดตามต่ออีกสองสามวัน'
      : 'แนวโน้มเริ่มลดลง แต่ยังวางใจไม่ได้ — ผู้ป่วยบางรายอาจยังอยู่ในระยะฟักตัว';
    // ตรวจคำพยากรณ์ของเมื่อวาน แล้วพยากรณ์วันนี้ (เกมพยากรณ์ — เลือกโมเดลที่เชื่อ)
    const lastFc = OD.ai.fcPrepare(S, series, now);
    OD.sfx && OD.sfx('page');
    await new Promise(res=>{
      let first = true;
      const draw = () => { U.modal(`<div class="brief"><div class="title-eyebrow">☀️ รายงานเช้า · ${M.fmtDay(M.dayOf(S.T))}</div>
        <div class="brief-stats"><div><span>ผู้ป่วยรายใหม่ ๒๔ ชม.</span><b class="${up?'up':''}">${now} ${up?'▲':now<prev?'▼':'■'}</b><small>เมื่อวาน ${prev}</small></div>
          <div><span>ในฐานข้อมูลทั้งหมด</span><b>${recs.length}</b><small>ราย</small></div>
          <div><span>เหลือเวลา</span><b class="${left<=48?'up':''}">${left}</b><small>ชั่วโมง</small></div>
          <div><span>ผลแล็บรอออก</span><b>${labs}</b><small>รายการ</small></div></div>
        <div class="brief-chart"><span class="muted">ผู้ป่วยรายใหม่ต่อวัน (ตั้งแต่ลงพื้นที่)</span>${spark}</div>
        ${OD.ai.fcHtml(S, lastFc)}
        <div class="mentor">${OD.mentorFace()}<div><div class="who">พี่วิ</div><div>${msg}</div></div></div></div>
        <div class="m-actions"><button class="btn btn-gold" data-m="ok">ลุยต่อ</button></div>`,
        k=>{
          if(k==='ok'){ U.closeModal(); res(); return; }
          if(k.startsWith('fc:')){ OD.ai.fcPick(S, k.slice(3)); const y = U.$('#modal .m-card').scrollTop; draw(); U.$('#modal .m-card').scrollTop = y; }
        }, {locked:true, cls: first ? '' : 'redraw'}); first = false; };
      draw();
    });
  }
  async function after(){
    S.trust = U.clamp(S.trust, 0, 100);
    F.render();
    if(S.flags.brief) await briefing();
    for(const l of S.labs.filter(l=>!l.seen && l.due<=S.T)){
      OD.sfx && OD.sfx('ding');
      l.seen = true;
      const lines = []; let path = null;
      if(l.kind==='stool'){
        const pos = l.res.filter(Boolean), cnt = {};
        pos.forEach(p=>cnt[p]=(cnt[p]||0)+1);
        const top = Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
        (l.ids||[]).forEach((id,j)=>{ if(top && l.res[j]===top) S.confirmed.add(id); });
        lines.push(`ตัวอย่างอุจจาระผู้ป่วย ${l.n} ราย: ` + (pos.length ? Object.keys(cnt).map(k=>`พบ **${M.PATHOGENS[k].name}** ${cnt[k]} ราย`).join(', ') + `, ไม่พบเชื้อ ${l.n-pos.length} ราย` : 'ไม่พบเชื้อก่อโรคทุกราย'));
        if(top && cnt[top]>=2) path = top;
        M.addEvidence(S, {id:'lab-stool-'+l.id, kind:'lab', strength: path===W.scn.pathogen ? 'strong':'none', pathogen:path, text:`ผลตรวจอุจจาระผู้ป่วย ${l.n} ราย: ${pos.length ? Object.keys(cnt).map(k=>`${M.PATHOGENS[k].short} ${cnt[k]}`).join(', ') : 'ไม่พบเชื้อ'}`});
      } else {
        // ฉลากเลอะและเดาที่มา → ผลอาจสลับกับตัวอย่างอื่น (สุ่ม) และใช้เป็นหลักฐานไม่ได้
        if(l.mixed){ l.pos = Math.random() < .5; l.pathogen = l.pos ? W.scn.pathogen : null; }
        const tn = (M.sampleTypes(W,S,l.site).find(x=>x[0]===l.type)||[0,'ตัวอย่าง'])[1], warn = l.mixed ? '⚠️ (ฉลากเลอะ อาจสลับตัวอย่าง) ' : '';
        lines.push(warn + (l.pos ? `${tn}จาก${nm(l.site)}: **พบ${M.PATHOGENS[l.pathogen].name}**` : `${tn}จาก${nm(l.site)}: ไม่พบเชื้อก่อโรค`));
        if(l.pos && !l.mixed) path = l.pathogen;
        M.addEvidence(S, {id:'lab-env-'+l.id, kind:'lab', site:l.site, strength: l.pos && !l.mixed ? 'strong' : 'none', pos:l.pos, mixed:!!l.mixed,
          text:`${warn}ผลแล็บ${tn}จาก${nm(l.site)}: ${l.pos?'พบ'+M.PATHOGENS[l.pathogen].short:'ไม่พบเชื้อ'}`});
      }
      log('ผลแล็บออก: ' + lines.join(' ').replace(/\*\*/g,''), l.pos||path ? 'bad' : '');
      F.render();
      await OD.vn.play(OD.story.labResult(W,S,lines,path), {mode:'overlay'});
    }
    for(const ev of OD.story.events){
      if(fired.has(ev.id) || (ev.pool && !S.flags.pool.includes(ev.id)) || !ev.when(W,S)) continue;
      fired.add(ev.id); S.flags.seen = [...fired];
      const sc = ev.script(W,S);
      await OD.vn.play(sc, {mode: sc.some(x=>x.bg) ? 'full' : 'overlay'});
      S.trust = U.clamp(S.trust, 0, 100); F.render();
    }
    if(S.T >= M.DEADLINE){
      S.flags.timeout = true;
      await U.ask(`<h2 class="display gold-text">หมดเวลา!</h2><p>ถึงวันอังคาร ๑ ธ.ค. ๐๘:๐๐ น. แล้ว ทีมส่วนกลางกำลังเดินทางมา คุณต้องส่งรายงานเท่าที่มีหลักฐานตอนนี้</p>`, [['ok','เขียนรายงานทันที','btn-gold']]);
      done(); return;
    }
    F.render();
  }

  /* ---------- การกระทำ ---------- */
  const A = {};
  /* ขั้นตอนที่ ๒: ยืนยันการวินิจฉัย */
  A.review = async()=>{
    if(S.reviewed) return;
    F.spend(3, 0, 'ทบทวนเวชระเบียนและซักประวัติผู้ป่วยที่นอนโรงพยาบาล');
    const t = M.reviewRecords(W,S);
    await U.ask(`<h2 class="display gold-text">ยืนยันการวินิจฉัย</h2><div class="paper" style="margin-top:8px">${t}</div>
      <div class="note">อาการเด่นช่วยอนุมานชนิดเชื้อได้ แต่ <b>ผลตรวจอุจจาระ</b> เท่านั้นที่ยืนยันเชื้อได้ — ผู้ป่วยที่ผลตรวจพบเชื้อจะกลายเป็น “ผู้ป่วยยืนยัน”</div>`, [['ok','บันทึกเป็นหลักฐาน','btn-gold']]);
    await after();
  };
  /* ขั้นตอนที่ ๔: ค้นหาผู้ป่วยเชิงรุก */
  A.acf = async()=>{
    if(S.acfAt!=null) return;
    const before = M.records(W,S).length, c = OD.bonds.acfCost(S);
    F.spend(c.h, c.b, c.b ? 'อสม. เคาะประตูค้นหาผู้ป่วยเชิงรุกทุกครัวเรือน และตั้งระบบรายงานรายวัน' : 'ป้าบุญมาพา อสม. เคาะประตูทุกบ้านให้ฟรี (ความสนิท) และตั้งระบบรายงานรายวัน');
    S.acfAt = S.T; S.ver++;
    const found = M.records(W,S).length - before;
    log(`ค้นหาเชิงรุกพบผู้ป่วยที่ไม่ได้ไปสถานพยาบาลเพิ่ม ${found} ราย`, found ? 'bad' : 'good');
    await U.ask(`<h2 class="display gold-text">ค้นหาผู้ป่วยเชิงรุก</h2><p>อสม. พบผู้ป่วยที่เข้านิยามแต่ <b>ไม่ได้ไปสถานพยาบาล</b> เพิ่ม <b>${found} ราย</b> — ข้อมูลเหล่านี้จะหายไปถ้ารอเฉพาะรายงานจากโรงพยาบาล</p>
      <div class="note">จากนี้ อสม. จะรายงานผู้ป่วยรายใหม่ในชุมชนทุกวัน (ระบบเฝ้าระวังเชิงรุก) ผู้ป่วยอาการน้อยจะเข้าสู่ฐานข้อมูลเร็วขึ้น</div>`, [['ok','รับทราบ','btn-gold']]);
    await after();
  };
  /* ขั้นตอนที่ ๖: ตั้งสมมติฐาน */
  A.hyp = ()=>{
    const sel = new Set(S.hyp);
    const draw = ()=>U.modal(`<h2 class="display gold-text">ตั้งสมมติฐาน</h2>
      <p>จากข้อมูลเชิงพรรณนา (เวลา–สถานที่–บุคคล) และคำบอกเล่า เลือกสิ่งที่สงสัยว่าเป็นแหล่งหรือช่องทางการแพร่ <b>๑–๔ ข้อ</b> — แบบสอบถามของกลุ่มควบคุมจะเน้นทดสอบสมมติฐานเหล่านี้ (ปรับใหม่ได้ ไม่เสียเวลา)</p>
      <div class="pick-grid">${M.exposures(S).map(e=>`<button class="pick ${sel.has(e.k)?'sel':''}" data-m="h${e.k}"><small>${e.g}</small><b>${e.label}</b></button>`).join('')}</div>
      <div class="m-actions"><button class="btn" data-m="x">ยกเลิก</button><button class="btn btn-gold" data-m="ok" ${sel.size?'':'disabled'}>บันทึกสมมติฐาน (${sel.size}/๔)</button></div>`,
      async k=>{
        if(k==='x') U.closeModal();
        else if(k[0]==='h'){ const x = k.slice(1); if(sel.has(x)) sel.delete(x); else if(sel.size<4) sel.add(x); else U.toast('เลือกได้ไม่เกิน ๔ ข้อ — สมมติฐานที่ดีต้องเจาะจง'); draw(); }
        else if(k==='ok'){ U.closeModal(); S.hyp = [...sel]; log('ตั้งสมมติฐาน: ' + S.hyp.map(x=>M.EXPOSURES.find(e=>e.k===x).label).join(', '), 'good'); await after(); }
      }, {wide:true});
    draw();
  };
  /* ข้ามเวลา: ๑๒ ชม. / จนผลแล็บออก / เช้าวันถัดไป */
  A.skip = ()=>{
    const left = M.DEADLINE - S.T, pend = S.labs.filter(l=>!l.seen).sort((a,b)=>a.due-b.due)[0];
    const nextMorning = (Math.floor(S.T/24)+1)*24 + 8 - S.T;
    const opts = [['h12', `รอ ${Math.min(12,left)} ชั่วโมง`, Math.min(12,left)]];
    if(pend) opts.push(['lab', `ข้ามไปจนผลแล็บออก (${M.fmtT(pend.due)})`, Math.min(pend.due - S.T, left)]);
    opts.push(['morn', `ข้ามไปเช้าวันถัดไป (${M.fmtT(S.T + Math.min(nextMorning,left))})`, Math.min(nextMorning, left)]);
    U.modal(`<h2 class="display gold-text">⏭️ ข้ามเวลา</h2><p>ระหว่างรอ ผู้ป่วยรายใหม่อาจเพิ่มขึ้น และเหตุการณ์ในพื้นที่จะดำเนินต่อไป</p>
      <div class="pick-grid">${opts.map(([k,t,h])=>`<button class="pick" data-m="${k}" ${h<=0?'disabled':''}><b>${t}</b><small>${h} ชั่วโมง</small></button>`).join('')}</div>
      <div class="m-actions"><button class="btn" data-m="x">ยกเลิก</button></div>`,
      async k=>{ U.closeModal(); const o = opts.find(x=>x[0]===k); if(!o || o[2]<=0) return; F.spend(o[2], 0, `${o[1]}`); await after(); }, {wide:true});
  };
  /* ขั้นตอนที่ ๑: เตรียมอุปกรณ์ภาคสนาม */
  function packKit(){
    return new Promise(res=>{
      const items = U.shuffle(M.KIT), sel = new Set();
      const draw = ()=>U.modal(`<h2 class="display gold-text">ขั้นตอนที่ ๑ · เตรียมการลงพื้นที่</h2>
        <div class="mentor">${OD.mentorFace()}<div><div class="who">พี่วิ</div><div>ก่อนออกจากสำนักงาน เช็คอุปกรณ์ให้ครบนะ ของที่จำเป็นถ้าลืมจะทำให้ตัวอย่างเสียหรือวัดค่าไม่ได้ ส่วนของที่ไม่ควรเอาไปก็อย่าหยิบไป</div></div></div>
        <div class="pick-grid">${items.map(it=>`<button class="pick ${sel.has(it.k)?'sel':''}" data-m="k${it.k}"><b>${sel.has(it.k)?'☑':'☐'} ${it.t}</b></button>`).join('')}</div>
        <div class="m-actions"><button class="btn" data-m="hb">📘 ดูคู่มือบทห้องปฏิบัติการ</button><button class="btn btn-gold" data-m="go">ออกเดินทาง (${sel.size} รายการ)</button></div>`,
        async k=>{
          if(k[0]==='k'){ const x = k.slice(1); sel.has(x) ? sel.delete(x) : sel.add(x); draw(); }
          else if(k==='hb'){ U.closeModal(); OD.handbook.open('lab'); const iv = setInterval(()=>{ if(!U.$('#modal').classList.contains('open')){ clearInterval(iv); draw(); } }, 200); }
          else if(k==='go'){
            S.kit = sel;
            const miss = M.KIT.filter(i=>i.ok && !sel.has(i.k)), bad = M.KIT.filter(i=>!i.ok && sel.has(i.k));
            S.flags.kitScore = (M.KIT.filter(i=>i.ok).length - miss.length - bad.length) / M.KIT.filter(i=>i.ok).length;
            S.flags.kitMiss = miss.map(i=>i.k); S.flags.kitBad = bad.map(i=>i.k);
            await U.ask(`<h2 class="display gold-text">${!miss.length && !bad.length ? 'อุปกรณ์ครบถ้วน!' : 'ตรวจอุปกรณ์'}</h2>
              ${!miss.length && !bad.length ? '<p>เตรียมการได้ตามหลักครบทุกข้อ</p>' : ''}
              ${miss.length ? `<div class="note red"><b>ลืมนำไป:</b><ul style="margin:4px 0 0;padding-left:20px">${miss.map(i=>`<li><b>${i.t}</b> — ${i.why}</li>`).join('')}</ul></div>` : ''}
              ${bad.length ? `<div class="note red"><b>ไม่ควรนำไป:</b><ul style="margin:4px 0 0;padding-left:20px">${bad.map(i=>`<li><b>${i.t}</b> — ${i.why}</li>`).join('')}</ul></div>` : ''}
              ${miss.length ? '<p class="muted">ผลกระทบในเกม: ตัวอย่างที่ต้องใช้อุปกรณ์ที่ขาดจะตรวจพบเชื้อได้น้อยลง หรือวัดค่าบางอย่างไม่ได้</p>' : ''}`, [['ok','ลงพื้นที่','btn-gold']]);
            res();
          }
        }, {wide:true, locked:true});
      draw();
    });
  }
  /* สัมภาษณ์เชิงลึกผู้ป่วยรายสำคัญ (มินิเกม) */
  A.deep = async()=>{
    if(!OD.interview.available(W,S)) return;
    F.spend(2, 0, `สัมภาษณ์เชิงลึก${S.deep.length ? 'ผู้ป่วยที่นอนโรงพยาบาล' : 'ผู้ป่วยรายแรก (index case)'}`);
    const r = await OD.interview.run(W,S);
    if(r) log(`สัมภาษณ์เชิงลึกผู้ป่วย ${r.p.ini||'P'+String(r.p.id).padStart(3,'0')}: ได้บันทึก ${r.notes.length} ข้อ${r.consent?'':' (ไม่ได้ขอความยินยอม)'}`, r.consent ? 'good' : 'bad');
    await after();
  };
  A.interview = async()=>{
    const n0 = M.pendingInterviews(W,S); if(!n0) return;
    const c = interviewCost();
    F.spend(c.h, c.b, `ทีม HDS และ อสม. สัมภาษณ์ผู้ป่วย ${n0} ราย`);
    const n = M.interviewAll(W,S); S.flags.interviewed = true;
    log(`ได้แบบสอบถามผู้ป่วยเพิ่ม ${n} ราย`, 'good');
    if(S.ui.tab==='curve') S.ui.tab = 'ana';
    await after();
  };
  /* ทีมขาดคน (อสม. ป่วย) ทำให้งานภาคสนามช้าลง */
  const slow = () => S.flags.teamSick==='rest' ? 2 : S.flags.teamSick==='work' ? 1 : 0;
  /* นักศึกษาอาสาช่วยงานภาคสนาม — เร็วขึ้น ๓๐% */
  const helpers = h => (S.flags.students==='trained' || S.flags.students==='raw') ? Math.max(1, Math.round(h*.7)) : h;
  function interviewCost(){
    let c = S.flags.interviewed ? M.COST.interview : M.COST.interviewFirst;
    if(!S.flags.interviewed && !M.hasKit(S,'form')) c = {h:c.h+3, b:c.b};
    return {h:helpers(c.h + slow() + OD.bonds.interviewExtra(S)), b:c.b};
  }
  function ccCost(k){
    const nCase = M.records(W,S).filter(r=>S.ans[r.p.id]).length, need = Math.max(0, k*nCase - S.controls.length);
    let c;
    if(S.ccRatio===0) c = {h:M.COST.cc[k].h, b:M.COST.cc[k].b, need};
    else if(k===S.ccRatio) c = {h:2+Math.ceil(need/10), b:need*150, need};
    else c = {h:M.COST.cc[k].h - M.COST.cc[S.ccRatio].h + 2, b:M.COST.cc[k].b - M.COST.cc[S.ccRatio].b, need};
    c.h = helpers(OD.bonds.ccAdjust(S, c.h + slow())); return c;
  }
  A.controls = ()=>{
    const nCase = M.records(W,S).filter(r=>S.ans[r.p.id]).length;
    if(nCase<5){ U.toast('ต้องสัมภาษณ์ผู้ป่วยอย่างน้อย ๕ รายก่อน'); return; }
    if(!S.hyp.length){ U.toast('💡 ต้องตั้งสมมติฐานก่อน (ขั้นตอนที่ ๖) — การศึกษาเชิงวิเคราะห์มีไว้ทดสอบสมมติฐาน'); return; }
    let sel = null;
    const draw = ()=>U.modal(`<h2 class="display gold-text">เก็บกลุ่มควบคุม (Case-control)</h2>
      <p>สุ่มคนในตำบลที่ <b>ไม่ป่วย</b> มาตอบแบบสอบถามชุดเดียวกับผู้ป่วย เพื่อเทียบสัดส่วนการสัมผัส ตอนนี้มีผู้ป่วยที่สัมภาษณ์แล้ว <b>${nCase}</b> ราย กลุ่มควบคุม <b>${S.controls.length}</b> คน</p>
      <div class="pick-grid">${[1,2,4].map(k=>{ const c=ccCost(k), dis = k<S.ccRatio || (k===S.ccRatio && c.need===0) || !can(c);
        return `<button class="pick ${sel===k?'sel':''}" data-m="k${k}" ${dis?'disabled':''}><span class="pi">👥</span><b>อัตราส่วน ๑ : ${U.thaiNum(k)}</b><small>${k===S.ccRatio?`เติมให้ครบ (+${c.need} คน)`:`ประมาณ ${k*nCase} คน`}</small><small>${c.h} ชม. · ${U.baht(c.b)}</small></button>`; }).join('')}</div>
      <div class="note">กลุ่มควบคุมยิ่งมาก ช่วงความเชื่อมั่นยิ่งแคบ แต่ใช้เวลาและงบมากขึ้น — เมื่อมีผู้ป่วยรายใหม่ อาจต้องเติมกลุ่มควบคุมให้ครบอัตราส่วน</div>
      <div class="m-actions"><button class="btn" data-m="x">ยกเลิก</button><button class="btn btn-gold" data-m="ok" ${sel?'':'disabled'}>เริ่มเก็บข้อมูล</button></div>`,
      async k=>{
        if(k==='x') U.closeModal();
        else if(k[0]==='k'){ sel = +k.slice(1); draw(); }
        else if(k==='ok'){ U.closeModal(); const c = ccCost(sel); F.spend(c.h, c.b, `อสม. สุ่มสัมภาษณ์กลุ่มควบคุม (๑:${U.thaiNum(sel)})`); const n = M.addControls(W,S,sel); log(`ได้กลุ่มควบคุมเพิ่ม ${n} คน (รวม ${S.controls.length})`, 'good'); S.ui.tab='ana'; await after(); }
      }, {wide:true});
    draw();
  };
  A.inspect = ()=>{
    let sel = null; const c = M.COST.inspect;
    const sites = Object.keys(M.SITES).filter(id=>S.known.has(id));
    const draw = ()=>U.modal(`<h2 class="display gold-text">ตรวจสอบสิ่งแวดล้อม</h2>
      <p>ลงพื้นที่ตรวจสุขาภิบาล วัดคลอรีนคงเหลือ และสอบถามผู้ประกอบการ — ${c.h} ชม. · ${U.baht(c.b)} ต่อแห่ง</p>
      <div class="pick-grid">${sites.map(id=>`<button class="pick ${sel===id?'sel':''}" data-m="s${id}" ${S.inspected[id]||!can(c)?'disabled':''}><span class="pi">${M.SITES[id].icon}</span><b>${nm(id)}</b>${S.inspected[id]?'<small>ตรวจแล้ว</small>':''}</button>`).join('')}</div>
      <div class="m-actions"><button class="btn" data-m="x">ยกเลิก</button><button class="btn btn-gold" data-m="ok" ${sel?'':'disabled'}>ลงพื้นที่ตรวจ</button></div>`,
      async k=>{
        if(k==='x') U.closeModal();
        else if(k[0]==='s'){ sel = k.slice(1); draw(); }
        else if(k==='ok'){
          U.closeModal(); const knownBefore = new Set(S.known);
          F.spend(c.h, c.b, `ตรวจสิ่งแวดล้อม: ${nm(sel)}`);
          const r = M.inspect(W,S,sel); S.flags.inspectedAny = true;
          const newSites = [...S.known].filter(x=>!knownBefore.has(x));
          if(sel==='E') await OD.vn.play(OD.story.monk(W,S,r.text));
          else if(M.SITES[sel].type==='ice') await OD.vn.play(OD.story.iceFactory(W,S,sel,r.text));
          else await OD.vn.play(OD.story.siteVisit(W,S,sel,r.text));
          newSites.forEach(x=>{ log(`พบแหล่งที่ต้องสงสัยใหม่: ${nm(x)}`, 'bad'); U.toast(`🧊 พบแหล่งใหม่บนแผนที่: ${nm(x)}`); });
          await after();
        }
      }, {wide:true});
    draw();
  };
  A.lab = ()=>{
    let site = null, type = null;
    const stoolOK = M.records(W,S).some(r=>!r.dup && !r.phantom && S.ans[r.p.id] && !S.stoolDone.has(r.p.id));
    const sites = Object.keys(M.SITES).filter(id=>S.known.has(id));
    const draw = ()=>{
      const types = site && site!=='STOOL' ? M.sampleTypes(W,S,site) : [];
      U.modal(`<h2 class="display gold-text">ส่งตรวจทางห้องปฏิบัติการ</h2>
      <p>ผลออกภายใน <b>๒๔ ชั่วโมง</b> หลังส่ง · ระหว่างรอทำอย่างอื่นได้ หรือใช้ ⏭️ ข้ามเวลา · ความไวของการตรวจไม่ถึง ๑๐๐%</p>
      <div class="note" style="font-size:13.5px">หลักการเก็บตัวอย่าง: อุจจาระเก็บ <b>ก่อนให้ยาปฏิชีวนะ</b> ใส่ Cary-Blair · น้ำใช้ขวดปลอดเชื้อที่มีโซเดียมไทโอซัลเฟต · อาหาร/น้ำแข็งแช่เย็น ๔ °C · ติดฉลากทุกตัวอย่าง
      ${['cary','bottle','cold'].filter(k=>!M.hasKit(S,k)).map(k=>`<br>⚠️ ไม่ได้นำ <b>${M.KIT.find(i=>i.k===k).t}</b> มา — ตัวอย่างที่เกี่ยวข้องอาจเสื่อม ความไวลดลง`).join('')}</div>
      <div class="pick-grid"><button class="pick ${site==='STOOL'?'sel':''}" data-m="sSTOOL" ${!stoolOK||!can(M.COST.stool)?'disabled':''}><span class="pi">🧫</span><b>อุจจาระผู้ป่วย ๕ ราย</b><small>บอกว่าเป็น “เชื้ออะไร”</small><small>${M.COST.stool.h} ชม. · ${U.baht(M.COST.stool.b)}</small></button></div>
      <h3 style="font-size:15px;margin:10px 0 0">หรือ ตัวอย่างจากสิ่งแวดล้อม <span class="muted" style="font-weight:400">— บอกว่า “มาจากไหน” · ${M.COST.env.h} ชม. · ${U.baht(M.COST.env.b)}</span></h3>
      <div class="pick-grid">${sites.map(id=>`<button class="pick ${site===id?'sel':''}" data-m="s${id}" ${!M.sampleTypes(W,S,id).length||!can(M.COST.env)?'disabled':''}><span class="pi">${M.SITES[id].icon}</span><b>${nm(id)}</b>${!M.sampleTypes(W,S,id).length?'<small>ไม่มีตัวอย่างเหลือแล้ว</small>':''}</button>`).join('')}</div>
      ${types.length?`<div class="pick-grid">${types.map(([k,t])=>`<button class="pick ${type===k?'sel':''}" data-m="t${k}"><b>${t}</b></button>`).join('')}</div>`:''}
      <div class="m-actions"><button class="btn" data-m="x">ยกเลิก</button><button class="btn btn-gold" data-m="ok" ${(site==='STOOL'||(site&&type))?'':'disabled'}>ส่งตรวจ</button></div>`,
      async k=>{
        if(k==='x') U.closeModal();
        else if(k[0]==='s'){ site = k.slice(1); type = null; const ts = site!=='STOOL' ? M.sampleTypes(W,S,site) : []; if(ts.length===1) type = ts[0][0]; draw(); }
        else if(k[0]==='t'){ type = k.slice(1); draw(); }
        else if(k==='ok'){
          U.closeModal();
          if(!S.flags.fah){ S.flags.fah = true; await OD.vn.play(OD.story.fahIntro(W,S)); }
          const id = S.labs.length+1;
          const wait = OD.bonds.labWait(S);
          // พี่ฟ้าประทับใจเมื่อตัวอย่างเก็บและขนส่งถูกวิธี (มีอุปกรณ์ที่ถูกต้อง)
          const kitOK = M.kitFactor(S, site==='STOOL' ? 'swab' : type) >= 1;
          if(site==='STOOL'){ F.spend(M.COST.stool.h, M.COST.stool.b, 'ส่งตัวอย่างอุจจาระผู้ป่วยตรวจเพาะเชื้อ'); S.labs.push(Object.assign({id, due:S.T+wait}, M.labStool(W,S))); }
          else { const tn = M.sampleTypes(W,S,site).find(x=>x[0]===type)[1]; F.spend(M.COST.env.h, M.COST.env.b, `ส่ง${tn}จาก${nm(site)}ตรวจ`); S.labs.push(Object.assign({id, due:S.T+wait}, M.labEnv(W,S,site,type))); }
          if(wait!==M.COST.LAB_WAIT) log(wait<M.COST.LAB_WAIT ? `พี่ฟ้าเร่งคิวแล็บให้ — ผลออกใน ${wait} ชม.` : `แล็บไม่เร่งคิวให้ — ผลออกใน ${wait} ชม.`, wait<M.COST.LAB_WAIT ? 'good' : 'bad');
          OD.bonds.add(S, 'fah', kitOK ? 5 : -6, kitOK ? 'เก็บตัวอย่างถูกวิธี' : 'ตัวอย่างเก็บ/ขนส่งไม่ถูกวิธี');
          await after();
        }
      }, {wide:true});
    };
    draw();
  };
  /* ฟังเสียงโซเชียล: ติดป้ายโพสต์ → ฝึก Naive Bayes → ดึงชื่อสถานที่จากโพสต์ที่เล่าอาการจริง */
  A.nlp = async()=>{
    if(S.flags.nlpDone) return;
    F.spend(2, 0, 'ดึงโพสต์สาธารณะจากโซเชียลมาจำแนกด้วย NLP');
    await OD.ai.socialListen(W,S);
    log(`วิเคราะห์โพสต์โซเชียลด้วย NLP: ติดป้ายข้อมูลฝึกถูก ${S.flags.nlpAcc}/9 · โมเดลทายชุดทดสอบถูก ${S.flags.nlpTest}/9`, S.flags.nlpAcc>=7 ? 'good' : 'bad');
    await after();
  };
  /* ผู้ช่วย AI ของจังหวัด (หลังเหตุการณ์ระบบ AI) — ถามได้ฟรี แต่ต้องตรวจสอบเอง */
  A.ai = ()=>{ if(S.flags.aiMet) OD.ai.assistant(W,S); };
  A.supply = async()=>{
    if(S.supply) return;
    F.spend(M.COST.supply.h, M.COST.supply.b, 'ขอข้อมูลแหล่งวัตถุดิบและน้ำแข็งจากผู้ประกอบการ');
    const lines = M.supplyChain(W,S);
    log('พบแหล่งที่ต้องสงสัยใหม่: โรงน้ำแข็ง ๒ แห่ง', 'bad');
    await U.ask(`<h2 class="display gold-text">ห่วงโซ่อุปทาน</h2><div class="paper" style="margin-top:8px"><ul style="margin:0;padding-left:20px">${lines.map(l=>`<li>${l}</li>`).join('')}</ul></div>`, [['ok','บันทึกเป็นหลักฐาน','btn-gold']]);
    await after();
  };
  A.measure = ()=>{
    let sel = null;
    const sites = Object.keys(M.SITES).filter(id=>S.known.has(id) && id!=='E');
    const draw = ()=>U.modal(`<h2 class="display gold-text">มาตรการเร่งด่วน</h2>
      <p>สั่งปิด/งดใช้แหล่งที่สงสัยได้ทันทีโดยไม่ต้องรอรายงาน (หลักการป้องกันไว้ก่อน) — แต่ถ้าปิดผิดที่ ผู้ประกอบการเสียรายได้ และความเชื่อมั่นของชุมชนจะลดลง</p>
      <div class="pick-grid">${sites.map(id=>{ const dis = M.isClosed(S,id) || (S.closed[id]!=null && !M.wasReopened(S,id));
        return `<button class="pick ${sel===id?'sel':''}" data-m="s${id}" ${dis?'disabled':''}><span class="pi">${M.SITES[id].icon}</span><b>${M.wasReopened(S,id)?'สั่งปิดอีกครั้ง':'ปิด/งดใช้'}${nm(id)}</b><small>${M.isClosed(S,id)?'ปิดแล้ว':dis?'ปิดไปแล้ว':M.wasReopened(S,id)?'ถูกเปิดคืน · ๑ ชม.':'๑ ชม.'}</small></button>`; }).join('')}
        <button class="pick ${sel==='HYG'?'sel':''}" data-m="sHYG" ${S.hygieneAt!=null||!can(M.COST.hygiene)?'disabled':''}><span class="pi">🧼</span><b>รณรงค์ล้างมือ แยกของใช้ผู้ป่วย</b><small>${S.hygieneAt!=null?'ดำเนินการแล้ว':`${M.COST.hygiene.h} ชม. · ${U.baht(M.COST.hygiene.b)}`}</small></button></div>
      <div class="m-actions"><button class="btn" data-m="x">ยกเลิก</button><button class="btn btn-red" data-m="ok" ${sel?'':'disabled'}>ประกาศมาตรการ</button></div>`,
      async k=>{
        if(k==='x') U.closeModal();
        else if(k[0]==='s'){ sel = k.slice(1); draw(); }
        else if(k==='ok'){
          U.closeModal();
          if(sel==='HYG'){ F.spend(M.COST.hygiene.h, M.COST.hygiene.b, 'รณรงค์ล้างมือและแยกของใช้ผู้ป่วยทุกครัวเรือน'); S.hygieneAt = S.T; S.ver++; S.trust += 4; }
          else { F.spend(M.COST.close.h, 0); F.closeSite(sel); }
          await after();
        }
      }, {wide:true});
    draw();
  };
  A.wait = async()=>{ const h = Math.min(M.COST.wait.h, M.DEADLINE - S.T); if(h<=0) return; F.spend(h, 0, `รอรายงานผู้ป่วยและผลการดำเนินงาน ${h} ชั่วโมง`); await after(); };
  A.report = async()=>{
    const k = await U.ask(`<h2 class="display gold-text">ส่งรายงานสอบสวนโรค?</h2><p>เมื่อส่งรายงาน การสอบสวนจะสิ้นสุดลง และมาตรการตามรายงานจะเริ่มทันที (${M.fmtT(S.T)})</p>
      <div class="note">ตรวจดูว่ามีหลักฐานครบหรือยัง: สถิติ (OR) · สิ่งแวดล้อม · ห้องปฏิบัติการ</div>`, [['no','สืบสวนต่อ',''],['yes','เขียนรายงาน','btn-gold']]);
    if(k==='yes') done();
  };

  /* ---------- render ---------- */
  function hint(){
    const nCase = M.records(W,S).filter(r=>S.ans[r.p.id]).length, pend = M.pendingInterviews(W,S), labsWait = S.labs.filter(l=>!l.seen).length;
    if(!M.DIFF[S.diff].hints) return `สถานะ: ผู้ป่วยรอสัมภาษณ์ ${pend} ราย · สัมภาษณ์แล้ว ${nCase} ราย · กลุ่มควบคุม ${S.controls.length} คน · ผลแล็บรอ ${labsWait} รายการ`;
    if(labsWait && pend===0 && S.controls.length) return `กำลังรอผลแล็บ ${labsWait} รายการ — ใช้ <b>⏭️ ข้ามเวลา</b> เพื่อข้ามไปจนผลออกได้ หรือจะใช้มาตรการเร่งด่วนก่อนถ้าหลักฐานชัดแล้ว`;
    const nx = OD.checklist.next(W,S);
    if(nx && nx.n<=8) return `ขั้นตอนถัดไป: <b>${OD.u.thaiNum(nx.n)}. ${nx.t}</b> — ${nx.d}<br><span class="muted">วิธีทำ: ${nx.how}</span>`;
    if(S.controls.length && !S.flags.vML) return 'มีกลุ่มควบคุมแล้ว ลองแท็บ <b>🤖 ML</b> — ใช้ <b>logistic regression</b> ดูว่าปัจจัยไหนยังเสี่ยงอยู่เมื่อปรับปัจจัยอื่นแล้ว หรือให้ <b>decision tree</b> ช่วยหาคำถามที่แยกผู้ป่วยได้ดีที่สุด';
    if(pend>=5) return `มีผู้ป่วยรายใหม่รอสัมภาษณ์ ${pend} ราย ข้อมูลยิ่งครบ ผลวิเคราะห์ยิ่งแม่น — แต่ก็อย่าลืมว่าเวลาเดินตลอด`;
    if(S.diff==='easy' && !S.supply && !S.known.has('F1') && !S.known.has('F3')) return 'ถ้าผู้ป่วยกระจายไปหลายร้านพร้อมกัน ลองนึกถึง “สิ่งที่ร้านเหล่านั้นใช้ร่วมกัน” — <b>ห่วงโซ่อุปทาน</b> (น้ำแข็ง ผักสด) อาจมีคำตอบ';
    if(OD.interview.available(W,S) && !S.deep.length && S.flags.interviewed) return 'ลอง <b>🎙️ สัมภาษณ์เชิงลึก</b> ผู้ป่วยรายแรกดู — ถามคำถามปลายเปิดจะได้เบาะแสที่แบบสอบถามให้ไม่ได้ แต่ระวังคำถามชี้นำ';
    return 'หลักฐานครบสามด้านหรือยัง: <b>สถิติ</b> · <b>สิ่งแวดล้อม</b> · <b>ห้องปฏิบัติการ</b> — ถ้าชัดแล้ว ใช้มาตรการควบคุมและ <b>เขียนรายงาน</b> ยิ่งเร็ว ยิ่งป้องกันผู้ป่วยได้มาก';
  }
  function actBtn(key, icon, title, sub, c, dis){
    return `<button class="act" data-a="${key}" ${dis?'disabled':''}><span class="i">${icon}</span><span class="t"><b>${title}</b><small>${sub}</small></span><span class="c">${c}</span></button>`;
  }
  F.render = function(){
    const left = M.DEADLINE - S.T, nRec = M.records(W,S).length, pend = M.pendingInterviews(W,S);
    OD.music.setMood(left<=36 ? 'tense' : 'field');
    U.$('#fTop').innerHTML = `<div class="f-brand">${OD.meFace(left<=36?'worried':'neutral','sm')}<span class="f-me"><span class="gold-text">นักสืบโรคระบาด ๒</span><small>${U.esc(S.name)} · ทีม HDS</small></span></div>
      <div class="f-stat"><span class="l">เวลา</span><b>${M.fmtT(S.T)}</b></div>
      <div class="f-stat cases"><span class="l">ผู้ป่วยในฐานข้อมูล</span><b>${nRec} ราย${S.lastNew?`<span class="d">+${S.lastNew}</span>`:''}</b></div>
      <div class="f-stat"><span class="l">งบประมาณคงเหลือ</span><b>${U.baht(S.budget)}</b></div>
      <div class="f-stat"><span class="l">ความเชื่อมั่นชุมชน ${Math.round(S.trust)}</span><div class="meter jade"><i style="width:${S.trust}%"></i></div></div>
      <div class="f-stat"><span class="l">เหลือเวลา ${left} ชม.</span><div class="meter ${left<=36?'red':''}"><i style="width:${left/(M.DEADLINE-M.T0)*100}%"></i></div></div>
      <button class="chip gold ck-chip" id="fCk" data-a="checklist" title="ดูเช็คลิสต์ ๑๐ ขั้นตอน">✅ ขั้นตอน ${U.thaiNum(OD.checklist.progress(W,S))}/๑๐</button>
      <button class="btn btn-ghost btn-sm" data-a="help" title="วิธีเล่น">📖</button><button class="btn btn-ghost btn-sm" data-a="handbook" title="คู่มือนักสืบมือใหม่">📘</button><button class="btn btn-ghost btn-sm" data-a="theme" title="สลับธีม">🌓</button>`;
    U.$('#fAdv').innerHTML = `<div class="adv-row"><div class="mentor">${OD.mentorFace()}<div><div class="who">พี่วิ</div><div>${hint()}</div></div></div>${OD.bonds.html(S)}</div>`;
    const ac = OD.bonds.acfCost(S);
    const icNext = interviewCost();
    const labsWait = S.labs.filter(l=>!l.seen).length, hypOK = S.hyp.length>0;
    U.$('#fActions').innerHTML =
      actBtn('review','🩺','๒ ทบทวนเวชระเบียน', S.reviewed ? 'ยืนยันการวินิจฉัยแล้ว ✓' : 'ยืนยันการวินิจฉัย', '3 ชม.', S.reviewed || S.T+3>M.DEADLINE) +
      actBtn('acf','🏘️','๔ ค้นหาผู้ป่วยเชิงรุก', S.acfAt!=null ? `พบเพิ่ม ${M.hiddenFound(W,S)} ราย ✓` : ac.b ? 'อสม. เคาะประตูทุกบ้าน' : 'ป้าบุญมาช่วยฟรี ❤️', costTxt(ac), S.acfAt!=null || !can(ac)) +
      actBtn('interview','🗣️','๕ สัมภาษณ์ผู้ป่วย', pend ? `รอสัมภาษณ์ ${pend} ราย` : 'สัมภาษณ์ครบแล้ว', costTxt(icNext), !pend || !can(icNext)) +
      actBtn('deep','🎙️','๕ สัมภาษณ์เชิงลึก', S.deep.length>=OD.interview.MAX ? 'สัมภาษณ์ครบแล้ว ✓' : S.deep.length ? 'ผู้ป่วยที่นอนโรงพยาบาล' : 'คุยกับผู้ป่วยรายแรก', '2 ชม.', !OD.interview.available(W,S) || !can({h:2,b:0})) +
      actBtn('hyp','💡','๖ ตั้งสมมติฐาน', hypOK ? `${S.hyp.length} ข้อ (แก้ไขได้)` : 'สงสัยอะไรบ้าง?', 'ฟรี', false) +
      actBtn('controls','👥','๗ เก็บกลุ่มควบคุม', !hypOK ? '🔒 ตั้งสมมติฐานก่อน' : S.controls.length ? `มีแล้ว ${S.controls.length} คน (๑:${U.thaiNum(S.ccRatio)})` : 'case-control → OR', '6–14 ชม.', S.T+3>M.DEADLINE) +
      actBtn('inspect','🔎','๘ ตรวจสิ่งแวดล้อม', `ตรวจแล้ว ${Object.keys(S.inspected).length} แห่ง`, costTxt(M.COST.inspect), !can(M.COST.inspect)) +
      actBtn('lab','🧪','๘ ส่งตรวจแล็บ', labsWait ? `รอผล ${labsWait} รายการ` : 'อุจจาระ / น้ำ / อาหาร', 'ผลใน ๒๔ ชม.', !can(M.COST.env)) +
      actBtn('supply','📦','๘ ห่วงโซ่อุปทาน', S.supply ? 'ได้ข้อมูลแล้ว ✓' : 'น้ำแข็ง วัตถุดิบ มาจากไหน', costTxt(M.COST.supply), S.supply || !can(M.COST.supply)) +
      actBtn('nlp','📱','ฟังเสียงโซเชียล (NLP)', S.flags.nlpDone ? `ติดป้ายถูก ${S.flags.nlpAcc}/9 ✓` : 'สอนโมเดลแยกข่าวลือ', '2 ชม.', S.flags.nlpDone || !can({h:2,b:0})) +
      actBtn('ai','🤖','ผู้ช่วย AI', S.flags.aiMet ? 'ถามได้ แต่ต้องตรวจสอบ' : '🔒 ระบบยังมาไม่ถึง', 'ฟรี', !S.flags.aiMet) +
      actBtn('measure','🛑','๙ มาตรการเร่งด่วน', `ปิดอยู่ ${nClosed()} แห่ง${S.hygieneAt!=null?' · รณรงค์ล้างมือ':''}${S.boilAt!=null?' · ต้มน้ำ':''}`, '๑–๒ ชม.', S.T+1>M.DEADLINE) +
      actBtn('skip','⏭️','ข้ามเวลา', labsWait ? 'ข้ามไปจนผลแล็บออก' : 'รอ ๑๒ ชม. / เช้าวันใหม่', 'เลือกได้', left<=0) +
      `<button class="btn btn-gold report" data-a="report">📝 ๑๐ เขียนรายงาน<br>สอบสวนโรค</button>`;
    OD.fieldViews.render(W,S);
    U.$('#fLog').innerHTML = `<div class="ptitle"><h2>บันทึกการสอบสวน</h2>${S.labs.filter(l=>!l.seen).map(l=>`<span class="pending">🧪 รอผลแล็บ · ออก ${M.fmtT(l.due)}</span>`).join(' ')}</div>
      <ul class="log">${S.log.slice(0,40).map(l=>`<li class="${l.kind}"><span class="lt">${M.fmtT(l.t)}</span><span class="lx">${l.text}</span></li>`).join('')}</ul>`;
  };

  function help(){
    U.modal(`<h2 class="display gold-text">วิธีเล่น</h2>
      <p><b>เป้าหมาย:</b> หาแหล่งโรค ช่องทางการแพร่ และเชื้อก่อโรค พร้อมหลักฐาน แล้วออกมาตรการให้ถูกต้องภายในเวลาที่กำหนด</p>
      <div class="note"><b>ดูข้อมูลฟรี:</b> แผนที่ เส้นโค้งการระบาด ตารางวิเคราะห์ อาการ รายชื่อผู้ป่วย หลักฐาน</div>
      <div class="note red"><b>การกระทำใช้เวลาและงบ:</b> ระหว่างนั้นผู้ป่วยรายใหม่จะเพิ่มขึ้น ผลแล็บออกหลัง ๒๔ ชม.</div>
      <div class="note jade"><b>ความเชื่อมั่นชุมชน:</b> ถ้าต่ำกว่า ๔๐ ชาวบ้านจะตอบแบบสอบถามคลาดเคลื่อนมากขึ้น</div>
      <div class="note"><b>ปุ่มมีเลขขั้นตอนกำกับ</b> ตาม ๑๐ ขั้นตอนการสอบสวนการระบาด — ดูความคืบหน้าที่ ✅ เช็คลิสต์</div>
      <div class="note"><b>เหตุการณ์ระหว่างสอบสวน:</b> ทุกการตัดสินใจมีผลต่อเนื่อง — ชาวบ้านจะไว้ใจหรือไม่ ผู้ป่วยจะเพิ่มหรือลด และตอนจบจะเป็นอย่างไร ท้ายเกมมีสรุปว่าคุณพลาดอะไรบ้าง</div>
      <div class="note jade"><b>เครื่องมือ HDS:</b> แท็บ 🤖 ML (logistic regression · decision tree · SQL · ดาวน์โหลด notebook) · 🧭 วิเคราะห์เชิงพื้นที่บนแผนที่ · 📱 NLP ฟังเสียงโซเชียล · 🤖 ผู้ช่วย AI · 🔮 พยากรณ์ในรายงานเช้า</div>
      <div class="note"><b>ไม่รู้จะทำอะไรต่อ?</b> ดูกล่องคำแนะนำของพี่วิด้านบน หรือทำตามลำดับนี้: ดูกราฟและแผนที่ (ฟรี) → 🩺 ทบทวนเวชระเบียน → 🏘️ ค้นหาเชิงรุก → 🗣️ สัมภาษณ์ → 💡 ตั้งสมมติฐาน → 👥 กลุ่มควบคุม → อ่าน OR → 🔎 ตรวจ + 🧪 แล็บที่แหล่งที่ OR ชี้ → 🛑 ควบคุม → 📝 รายงาน</div>
      <div class="m-actions"><button class="btn" data-m="tour">🧭 ดูทัวร์หน้าจออีกครั้ง</button><button class="btn" data-m="fieldui">🔘 ปุ่มแต่ละปุ่มทำอะไร</button><button class="btn" data-m="tips">💡 เคล็ดลับมือใหม่</button><button class="btn" data-m="hb">📘 เปิดคู่มือ</button><button class="btn btn-gold" data-m="x">เข้าใจแล้ว</button></div>`,
      k=>{ U.closeModal(); if(k==='tour') OD.handbook.tour(); if(k==='hb') OD.handbook.open(); if(k==='fieldui' || k==='tips') OD.handbook.open(k); });
  }

  F.run = function(){
    W = OD.W; S = OD.S; fired = new Set();
    S.ui = {tab:'curve', hl:null, colorBy:'case', showCtl:true, onlyHl:false, sort:'or',
            mlTab:'lr', mlFeat:null, mlVil:false, mlChild:false, depth:3, minLeaf:3, spatial:'', eps:55, sql:null};
    if(!S.flags.pool) S.flags.pool = U.shuffle(OD.story.POOL).slice(0,3);   // เหตุการณ์สุ่ม ๓ ใน ๗ ต่อคดี (ปกติสุ่มไว้แล้วตอนเริ่มคดี)
    S.flags.jit = S.flags.jit || {};
    const root = U.$('#scr-field');
    root.innerHTML = `<header class="f-top" id="fTop"></header>
      <div class="f-wrap">
        <div class="frame tight" id="fAdv"></div>
        <div class="frame tight f-actions" id="fActions"></div>
        <div class="f-grid"><div class="frame tight" id="fMap"></div><div class="frame tight" id="fAna"></div></div>
        <div class="frame tight" id="fLog"></div>
      </div>`;
    root.onclick = e=>{
      const b = e.target.closest('[data-a]'); if(!b || b.disabled) return;
      const a = b.dataset.a;
      if(a==='help') return help();
      if(a==='handbook') return OD.handbook.open();
      if(a==='checklist'){ S.ui.tab = 'ck'; F.render(); U.$('#fAna').scrollIntoView({behavior:'smooth', block:'start'}); return; }
      if(a==='theme') return OD.toggleTheme();
      if(A[a]) A[a]();
    };
    log(`เริ่มลงพื้นที่ — ฐานข้อมูลผู้ป่วย ${M.records(W,S).length} ราย`);
    U.show('scr-field'); F.render();
    (async()=>{
      await packKit(); log(`เตรียมอุปกรณ์ ${S.kit.size} รายการ`, 'good'); F.render();
      let seen = false; try{ seen = localStorage.getItem('od2-tour')==='1'; }catch(e){}
      if(!seen){ try{ localStorage.setItem('od2-tour','1'); }catch(e){} OD.handbook.tour(); }
    })();
    return new Promise(res=>{ done = ()=>{ root.onclick = null; S.flags.reported = true; res(); }; });
  };
  return F;
})();
