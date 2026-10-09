/* =========================================================
   บทที่ ๒ — ทำความสะอาดข้อมูล (line list จาก ๓ หน่วยบริการ)
   ทุกการตัดสินใจมีผลต่อข้อมูลที่ใช้วิเคราะห์ในบทที่ ๓
   ========================================================= */
OD.ch2 = (function(){
  const U = OD.u, M = OD.sim;
  const CONS = 'กขคจชดตทนบปพมยรลวสหอ'.split('');
  const sym = p => M.SYMPTOMS.filter(([k])=>p.sym[k]).map(([,t])=>t).join(', ');
  const vstd = v => M.VILLAGES[v-1].name;
  function ini(W,p){ if(!p.ini){ const hh=W.households[p.hh-1]; if(!hh.ln) hh.ln=U.pick(CONS); p.ini=U.pick(CONS)+'.'+hh.ln+'.'; } return p.ini; }
  const rec = (W,p,src) => ({pid:p.id, src, ini:ini(W,p), sex:p.sex, age:String(p.age), vill:vstd(p.v), onset:M.fmtDateBE(p.onsetDay), sym:sym(p), bad:{}});

  function build(W,S){
    const C = S.clean, cs = U.shuffle(M.cases(W,S,M.T0));
    const recs = cs.map(p=>rec(W,p, p.admit ? 'รพ.ชุมชน' : (U.r()<.82 ? 'รพ.สต.' : 'คลินิกเอกชน')));
    const R = pid => recs.find(r=>r.pid===pid && !r.extra);
    const used = new Set(), issues = [];
    const take = f => { const p = cs.find(x=>!used.has(x.id) && f(x)); if(p) used.add(p.id); return p; };
    const opt = (t, ok, fb, eff) => ({t, ok:!!ok, fb, eff});

    for(let i=0;i<3;i++){
      const p = take(x=>x.admit) || (i<2 ? take(()=>true) : null); if(!p) break;
      const a = R(p.id); a.src = 'รพ.ชุมชน';
      const b = Object.assign({}, a, {src:'รพ.สต.', extra:true, bad:{vill:1}, vill:U.pick([`ม.${p.v}`, `หมู่${p.v} ${M.VILLAGES[p.v-1].short}`, `บ.${M.VILLAGES[p.v-1].short}`])});
      recs.push(b);
      issues.push({icon:'👥', title:'รายงานซ้ำ?', desc:'สองรายการนี้มีชื่อย่อ เพศ อายุ และวันเริ่มป่วยตรงกัน แต่มาจากคนละหน่วยบริการ', recs:[a,b], opts:[
        opt('รวมเป็นรายเดียว — คนเดียวกันถูกรายงานซ้ำ', 1, 'ผู้ป่วยที่นอนโรงพยาบาลมักถูกรายงานทั้งจาก รพ.สต. และโรงพยาบาล ถ้าไม่รวมจะนับซ้ำ และทำให้ผู้ป่วยอาการหนักมีน้ำหนักเกินจริง'),
        opt('เก็บไว้ทั้งสองรายการ', 0, 'คนเดียวกันจะถูกนับสองครั้งในทุกการวิเคราะห์ ข้อมูลการสัมผัสของคนนี้จะมีน้ำหนักเป็นสองเท่า', ()=>C.dupKept.add(p.id)),
      ]});
    }
    // คนละคนแต่ชื่อย่อเหมือน
    let pair = null;
    for(const a of cs){ if(used.has(a.id)) continue;
      const b = cs.find(x=>x!==a && !used.has(x.id) && x.hh===a.hh && x.age!==a.age) || null;
      if(b){ pair=[a,b]; break; } }
    if(!pair){ const a = cs.find(x=>!used.has(x.id)); const b = a && cs.find(x=>x!==a && !used.has(x.id) && x.v===a.v && Math.abs(x.age-a.age)>3); if(a&&b) pair=[a,b]; }
    if(pair){
      const [a,b] = pair; used.add(a.id); used.add(b.id);
      const ra = R(a.id), rb = R(b.id); rb.ini = ra.ini; b.ini = ra.ini;
      issues.push({icon:'🧑‍🤝‍🧑', title:'ชื่อย่อซ้ำกัน', desc:'ระบบพบสองรายการที่มีชื่อย่อเหมือนกันและอยู่หมู่บ้านเดียวกัน', recs:[ra,rb], opts:[
        opt('รวมเป็นรายเดียว', 0, `อายุต่างกัน (${a.age} กับ ${b.age} ปี) — เป็นคนละคน น่าจะเป็นคนในบ้านเดียวกัน การรวมทำให้เสียผู้ป่วยจริงไป ๑ ราย`, ()=>C.lost.add(b.id)),
        opt('เก็บไว้ทั้งคู่ — เป็นคนละคน', 1, 'ชื่อย่อซ้ำกันได้บ่อย ต้องดูตัวแปรอื่นประกอบ เช่น อายุ เพศ วันเริ่มป่วย'),
      ]});
    }
    // แต่ละรายการใช้ผู้ป่วยของตัวเอง (const ในบล็อก) — ผลของตัวเลือกจึงไปลงกับผู้ป่วยรายที่ถูกต้องเสมอ
    { const p = take(x=>x.age>=20 && x.age<=99);
    if(p){ const r = R(p.id); r.age = p.age+'0'; r.bad.age=1;
      issues.push({icon:'🔢', title:'อายุผิดปกติ', desc:`อายุ ${r.age} ปี เป็นไปไม่ได้`, recs:[r], opts:[
        opt('ตรวจสอบกับเวชระเบียนต้นทาง แล้วแก้ไขให้ถูก', 1, `เวชระเบียนระบุอายุ ${p.age} ปี — พิมพ์เลข 0 เกินมาหนึ่งตัว แก้เฉพาะช่องที่ผิดก็พอ`),
        opt('ลบผู้ป่วยรายนี้ออก', 0, 'ข้อมูลผิดเพียงช่องเดียว แต่การลบทำให้เสียผู้ป่วยจริงทั้งราย', ()=>C.lost.add(p.id)),
        opt('ปล่อยไว้ตามเดิม', 0, 'อายุหลักร้อยจะทำให้กราฟกลุ่มอายุและค่าเฉลี่ยผิดเพี้ยน', ()=>C.ageBad.add(p.id)),
      ]}); } }
    { const p = take(()=>true);
    if(p){ const r = R(p.id); r.onset = M.fmtDateBE(p.onsetDay, true); r.bad.onset=1;
      issues.push({icon:'📅', title:'ปีของวันเริ่มป่วยผิดรูปแบบ', desc:`รายการอื่นใช้ปี พ.ศ. แต่รายการนี้บันทึกเป็น ${r.onset}`, recs:[r], opts:[
        opt('แปลงเป็น พ.ศ. (๒๐๒๖ + ๕๔๓ = ๒๕๖๙)', 1, 'คลินิกเอกชนใช้ระบบที่บันทึกปี ค.ศ. — การรวมข้อมูลหลายแหล่งต้องแปลงให้เป็นมาตรฐานเดียวกันก่อน'),
        opt('ลบรายนี้ (วันที่ใช้ไม่ได้)', 0, 'วันที่แปลงได้อย่างชัดเจน การลบทำให้เสียผู้ป่วยจริง', ()=>C.lost.add(p.id)),
        opt('ปล่อยไว้ตามเดิม', 0, 'ระบบจะตีความเป็น พ.ศ. ๒๐๒๖ (ก่อนปัจจุบัน ๕๔๓ ปี) ผู้ป่วยรายนี้จะหลุดออกจากเส้นโค้งการระบาด', ()=>C.dateBad.add(p.id)),
      ]}); } }
    { const p = take(()=>true);
    if(p){ const r = R(p.id); const sh = M.VILLAGES[p.v-1].short; r.vill = U.pick([`ม${p.v}`, `บ.${sh}`, `${sh}`]); r.bad.vill=1;
      issues.push({icon:'🏘️', title:'ที่อยู่ไม่เป็นมาตรฐาน', desc:`บันทึกที่อยู่ว่า “${r.vill}”`, recs:[r], opts:[
        opt(`ปรับให้เป็นรูปแบบมาตรฐาน “${vstd(p.v)}”`, 1, 'การจัดรูปแบบข้อมูลให้เหมือนกันทำให้นับและแผนที่ได้ถูกต้อง'),
        opt('ลบรายนี้ (ระบุหมู่บ้านไม่ได้)', 0, 'ข้อมูลระบุได้ชัดว่าเป็นหมู่บ้านใด การลบทำให้เสียผู้ป่วยจริง', ()=>C.lost.add(p.id)),
      ]}); } }
    { const p = take(()=>true);
    if(p){ const r = R(p.id); r.sex = ''; r.bad.sex=1;
      issues.push({icon:'❔', title:'ข้อมูลเพศว่าง', desc:'ช่องเพศไม่ได้บันทึก', recs:[r], opts:[
        opt('คงไว้ และบันทึกเพศว่า “ไม่ระบุ”', 1, 'ข้อมูลขาดหายบางช่องเป็นเรื่องปกติ บันทึกว่าไม่ทราบดีกว่าทิ้งทั้งราย'),
        opt('ลบรายนี้ (ข้อมูลไม่ครบ)', 0, 'การลบรายที่ข้อมูลไม่ครบทำให้เสียผู้ป่วยจริงและอาจเกิดอคติ', ()=>C.lost.add(p.id)),
        opt('เดาเพศจากชื่อย่อ', 0, 'การเดาข้อมูลส่วนบุคคลทำให้ข้อมูลผิดและไม่เคารพตัวตนของผู้ป่วย ช่องว่างควรบันทึกว่า “ไม่ระบุ”'),
      ]}); } }
    const q = U.pick(W.people.filter(x=>x.inf===null));
    if(q){ const r = {pid:q.id, src:'คลินิกเอกชน', ini:U.pick(CONS)+'.'+U.pick(CONS)+'.', sex:q.sex, age:String(q.age), vill:vstd(q.v), onset:'15/08/2569', sym:'ถ่ายเหลวเรื้อรัง ๓ เดือน (ลำไส้แปรปรวน)', bad:{onset:1}, extra:true};
      recs.push(r);
      issues.push({icon:'🩺', title:'เข้านิยามผู้ป่วยหรือไม่?', desc:'ผู้ป่วยรายนี้มีอาการท้องร่วงจริง แต่เริ่มป่วยตั้งแต่เดือนสิงหาคม', recs:[r], opts:[
        opt('คัดออก — ไม่เข้านิยามผู้ป่วย (เริ่มป่วยก่อน ๒๑ พ.ย. และเป็นโรคเรื้อรัง)', 1, 'นิยามผู้ป่วยกำหนดช่วงเวลาไว้ชัด ผู้ป่วยเรื้อรังไม่ได้เกิดจากการระบาดครั้งนี้'),
        opt('เก็บไว้ — มีอาการท้องร่วงเหมือนกัน', 0, 'ผู้ป่วยที่ไม่เกี่ยวข้องจะทำให้สัญญาณในการวิเคราะห์เจือจางลง', ()=>C.phantom.add(q.id)),
      ]}); }
    const vis = {pid:0, src:'คลินิกเอกชน', ini:U.pick(CONS)+'.'+U.pick(CONS)+'.', sex:'หญิง', age:'27', vill:'ต.บางเตย (มาเยี่ยมญาติที่หมู่ ๓)', onset:M.fmtDateBE(3), sym:'ถ่ายเหลว, ปวดท้อง', bad:{vill:1}, extra:true};
    recs.push(vis);
    issues.push({icon:'🧳', title:'ผู้ป่วยอยู่นอกตำบล', desc:'ผู้ป่วยอาศัยอยู่ตำบลอื่น แต่มาเยี่ยมญาติในบ้านสุขใจช่วง ๒๑–๒๓ พ.ย.', recs:[vis], opts:[
      opt('เก็บไว้ — เข้านิยาม (เดินทางมาในพื้นที่ช่วงเกิดโรค)', 1, 'นิยามผู้ป่วยรวม “ผู้ที่เดินทางมาในตำบล” ด้วย ผู้มาเยือนอาจเป็นเบาะแสว่าติดจากที่ใด'),
      opt('คัดออก — ไม่ใช่คนในตำบล', 0, 'อ่านนิยามผู้ป่วยอีกครั้ง — “อาศัยหรือเดินทางมา” ผู้มาเยือนจึงเข้านิยาม'),
    ]});
    const all = U.shuffle(recs); all.forEach((r,i)=>r.no=i+1);
    return {recs:all, issues:U.shuffle(issues)};
  }

  function run(){
    return new Promise(resolve=>{
      const W = OD.W, S = OD.S, {recs, issues} = build(W,S);
      S.acc.ch2 = 0; S.acc.ch2Max = issues.length*2;
      let cur = 0;
      const root = U.$('#scr-ch2');
      const recCard = r => `<div class="rec"><div class="src">${r.src} · ลำดับที่ ${r.no}</div>
        ${[['ชื่อย่อ','ini'],['เพศ','sex'],['อายุ','age'],['ที่อยู่','vill'],['วันเริ่มป่วย','onset'],['อาการ','sym']].map(([l,k])=>`<div class="row"><span>${l}</span><span class="${r.bad[k]?'bad':''}">${r[k]||'—'}</span></div>`).join('')}</div>`;
      function table(){
        const flag = new Set((issues[cur]||{recs:[]}).recs.map(r=>r.no));
        return `<table class="doc"><thead><tr><th>#</th><th>แหล่ง</th><th>ชื่อย่อ</th><th>เพศ</th><th>อายุ</th><th>ที่อยู่</th><th>เริ่มป่วย</th></tr></thead><tbody>${
          recs.map(r=>`<tr class="${flag.has(r.no)?'flag':''}"><td>${r.no}</td><td class="l">${r.src}</td><td>${r.ini}</td><td>${r.sex||'—'}</td><td>${r.age}</td><td class="l">${r.vill}</td><td>${r.onset}</td></tr>`).join('')}</tbody></table>`;
      }
      function render(){
        const done = issues.filter(i=>i.choice!=null).length, it = issues[cur];
        root.innerHTML = `<div class="ch-wrap">
          <div class="ch-banner">${OD.art.prajamInline(44)}<div><div class="no">บทที่ ๒</div><h1 class="display gold-text">ข้อมูลไม่เคยสะอาด</h1></div></div>
          <div class="frame tight clean-head"><div class="clean-prog"><b>ตรวจแล้ว ${done}/${issues.length} รายการ</b><div class="meter" style="margin-top:6px"><i style="width:${done/issues.length*100}%"></i></div></div>
            <span class="chip">รายชื่อทั้งหมด ${recs.length} รายการ</span><span class="chip gold">ความแม่นยำ ${S.acc.ch2}/${S.acc.ch2Max}</span></div>
          <div class="ch-grid">
            <div class="paper"><h3>รายชื่อผู้ป่วย (Line list)</h3><div class="muted" style="font-size:13.5px">รวมจาก รพ.สต. · รพ.ชุมชน · คลินิกเอกชน — แถวสีชมพูคือรายการที่กำลังตรวจ</div>
              <div class="orn-divider"></div><div class="linelist">${table()}</div>
              <div class="faint" style="font-size:12.5px;margin-top:8px">🔐 ใช้ชื่อย่อแทนชื่อจริง ตามหลักการคุ้มครองข้อมูลส่วนบุคคล (PDPA)</div></div>
            <div>
              <div class="frame tight"><div class="issue-list">${issues.map((x,i)=>`<div class="issue-item ${i===cur?'on':''} ${x.choice!=null?'done':''}" data-i="${i}"><span class="ic">${x.icon}</span><span style="flex:1">${x.title}</span>${x.choice!=null?(x.opts[x.choice].ok?'<span class="chip jade">ถูก</span>':'<span class="chip red">พลาด</span>'):''}</div>`).join('')}</div></div>
              <div class="frame" style="margin-top:14px">${it ? `
                <h3>${it.icon} ${it.title}</h3><div class="muted">${it.desc}</div>
                <div class="recs">${it.recs.map(recCard).join('')}</div>
                <div class="qopts">${it.opts.map((o,oi)=>`<button class="qopt ${it.choice===oi?(o.ok?'right':'wrong'):(it.choice!=null&&o.ok?'right':'')}" data-o="${oi}" ${it.choice!=null?'disabled':''}><span class="lt">${'กขค'[oi]}</span>${o.t}</button>`).join('')}</div>
                ${it.choice!=null?`<div class="mentor" style="margin-top:12px">${OD.mentorFace()}<div><div class="who">พี่วิ</div><div>${it.opts[it.choice].ok?'✅':'❌'} ${it.opts[it.choice].fb}${!it.opts[it.choice].ok?`<br><span class="muted">คำตอบที่เหมาะสม: ${it.opts.find(o=>o.ok).t}</span>`:''}</div></div></div>`:''}
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
                  ${done===issues.length ? `<button class="btn btn-gold btn-lg" data-act="finish">บันทึกข้อมูลและลงพื้นที่ →</button>` : it.choice!=null ? `<button class="btn btn-gold" data-act="next">รายการถัดไป →</button>` : ''}
                </div>` : ''}</div>
            </div>
          </div></div>`;
      }
      root.onclick = async e=>{
        const ii = e.target.closest('.issue-item'); if(ii){ cur = +ii.dataset.i; render(); return; }
        const ob = e.target.closest('.qopt'); const it = issues[cur];
        if(ob && !ob.disabled && it.choice==null){
          it.choice = +ob.dataset.o; const o = it.opts[it.choice];
          if(o.ok) S.acc.ch2 += 2;
          else {
            S.mistakes.push({area:'ch2', title:it.title, chosen:o.t, correct:it.opts.find(x=>x.ok).t, why:o.fb});
            try{ if(o.eff) o.eff(); }catch(err){ console.error(err); }
          }
          render(); return;
        }
        const a = e.target.closest('[data-act]'); if(!a) return;
        if(a.dataset.act==='next'){ const n = issues.findIndex(x=>x.choice==null); cur = n<0 ? cur : n; render(); }
        if(a.dataset.act==='finish'){ root.onclick = null; await OD.vn.play(OD.story.ch2_done(W,S), {mode:'overlay'}); resolve(); }
      };
      U.show('scr-ch2'); render();
    });
  }
  return {run};
})();
