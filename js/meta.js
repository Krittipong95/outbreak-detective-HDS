/* =========================================================
   meta — สถิติข้ามคดี: ตารางคะแนน · คดีประจำวัน · เหรียญ · แฟ้มคดี
   เก็บในเครื่องนี้ (localStorage) — เหมาะกับบูธที่ใช้เครื่องเดียวหลายคน
   ========================================================= */
OD.meta = (function(){
  const U = OD.u, M = OD.sim, KEY = 'od2-meta';
  function load(){ try{ const m = JSON.parse(localStorage.getItem(KEY) || 'null'); if(m && Array.isArray(m.cases)) return Object.assign({ach:{}}, m); }catch(e){} return {cases:[], ach:{}}; }
  function save(m){ try{ localStorage.setItem(KEY, JSON.stringify(m)); }catch(e){} }
  const pad = n => String(n).padStart(2,'0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
  const fmtDate = k => { const [y,m,d] = k.split('-').map(Number); return `${U.thaiNum(d)}/${U.thaiNum(m)}/${U.thaiNum(y+543)}`; };
  /* คดีประจำวัน: ทุกคนในวันเดียวกันได้โลกจำลองเดียวกัน */
  function dailySeed(){ let h = 2166136261; for(const ch of 'od2-daily-'+today()){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h>>>0; }

  const ACH = [
    {id:'first',  icon:'📁', t:'คดีแรก',              d:'สอบสวนจนส่งรายงานได้ ๑ คดี',                                  ok:()=>true},
    {id:'solved', icon:'🔍', t:'ไขคดีสำเร็จ',          d:'ระบุแหล่งโรคได้ถูกต้อง',                                      ok:c=>c.solved},
    {id:'rankS',  icon:'🏅', t:'ปรมาจารย์',            d:'ได้ระดับ S',                                                  ok:c=>c.rank==='S'},
    {id:'hardS',  icon:'🎖️', t:'ผู้เชี่ยวชาญตัวจริง',     d:'ได้ระดับ S ในระดับความยาก “ผู้เชี่ยวชาญ”',                    ok:c=>c.rank==='S' && c.diff==='hard'},
    {id:'fast',   icon:'⚡', t:'สายฟ้าแลบ',            d:'ไขคดีถูกภายใน ๔๘ ชั่วโมงหลังลงพื้นที่',                         ok:c=>c.solved && c.hours<=48},
    {id:'clean',  icon:'🤝', t:'ไม่ปิดผิดสักแห่ง',       d:'ไขคดีถูกโดยไม่สั่งปิดสถานที่ที่ไม่ใช่ต้นตอ',                     ok:c=>c.solved && c.wrong===0},
    {id:'tri',    icon:'🧩', t:'ครบสามด้าน',           d:'ปักหลักฐาน 📊 สถิติ 🔎 สิ่งแวดล้อม 🧪 แล็บ กับต้นตอจริงบนกระดาน', ok:c=>c.tri},
    {id:'wise',   icon:'🕊️', t:'ใจเย็นและเด็ดขาด',      d:'ทุกการตัดสินใจในเหตุการณ์ (อย่างน้อย ๕ ครั้ง) ไม่มี ⚠️ หรือ ❌', ok:c=>c.decN>=5 && !c.decBad && !c.decMixed},
    {id:'zero',   icon:'🎯', t:'ไร้ที่ติ',               d:'จบคดีโดยไม่พลาดเลยสักจุด',                                    ok:c=>c.misses===0},
    {id:'data',   icon:'🧹', t:'ข้อมูลไร้ที่ติ',          d:'บทที่ ๑–๒ ตอบถูกทุกข้อตั้งแต่ครั้งแรก',                         ok:c=>!c.quick && c.dataPerfect},
    {id:'ice',    icon:'🧊', t:'นักล่าโรงน้ำแข็ง',       d:'ไขคดีโรงน้ำแข็งได้',                                           ok:c=>c.solved && c.type==='ICE'},
    {id:'farm',   icon:'🥬', t:'ตามรอยผักสด',          d:'ไขคดีสวนผักได้',                                               ok:c=>c.solved && c.type==='FARM'},
    {id:'conf',   icon:'🧮', t:'จับตัวแปรกวน',          d:'ไขคดีที่มีตัวแปรกวนได้ โดยไม่หลงปักหลักฐานของตัวแปรกวน',          ok:c=>c.solved && c.confound && !c.confPicked},
    {id:'all',    icon:'🗂️', t:'ครบทุกต้นตอ',          d:'ไขคดีได้ครบทั้ง ๖ แบบ',                                        ok:(c,m)=>M.SCN_TYPES.every(t=>m.cases.some(x=>x.solved && x.type===t))},
    {id:'bond',   icon:'❤️', t:'คนของชุมชน',           d:'สนิทกับกำนัน ป้าบุญมา และพี่ฟ้า ตั้งแต่ ๗๐ ขึ้นไปทั้งสามคน',        ok:c=>c.bondsMin>=70},
    {id:'pdpa',   icon:'🔐', t:'ผู้พิทักษ์ข้อมูล',        d:'ปกป้องรายชื่อผู้ป่วยตามหลัก PDPA',                               ok:c=>c.pdpa==='good'},
    {id:'fest',   icon:'🎪', t:'งานใหญ่ปลอดภัย',       d:'งานวันเสาร์ (งานกฐิน/งานแต่ง) จัดได้พร้อมมาตรการ และไม่มีผู้ป่วยจากงาน', ok:c=>c.festival==='safe' && c.festCases===0},
    {id:'events', icon:'📜', t:'ผ่านมาทุกสถานการณ์',    d:'เจอเหตุการณ์สุ่มครบทั้ง ๗ แบบ (ดูได้ใน “เหตุการณ์ที่เคยเจอ”)',      ok:(c,m)=>OD.story.POOL.every(id=>(m.seen||[]).includes(id))},
    {id:'rumorRight', icon:'🗞️', t:'ข่าวลือก็ถูกได้',    d:'ไขคดีที่ข่าวลือบังเอิญชี้ถูก โดยไม่สั่งปิดตามข่าวลือ',             ok:c=>c.solved && c.rumorRight && !c.yielded},
    {id:'ear',    icon:'🎙️', t:'นักสัมภาษณ์',          d:'สัมภาษณ์เชิงลึกโดยขอความยินยอม และไม่ใช้คำถามชี้นำ',              ok:c=>c.deepGood},
    {id:'daily',  icon:'📅', t:'คดีประจำวัน',          d:'เล่นคดีประจำวันจนจบ',                                          ok:c=>c.daily},
    /* ---------- เครื่องมือ HDS ---------- */
    {id:'alarm',  icon:'🚨', t:'ระบบเตือนภัยแม่นยำ',     d:'ตั้งระบบเตือนภัยการระบาด (บทที่ ๑) ได้ตามเป้าตั้งแต่ครั้งแรก',       ok:c=>c.alarmFirst},
    {id:'model',  icon:'🤖', t:'นักสร้างโมเดล',          d:'ปักผล logistic regression ที่ชี้ต้นตอจริงไว้บนกระดานสืบสวน',       ok:c=>c.mlRight},
    {id:'overfit',icon:'🌳', t:'รู้ทันโอเวอร์ฟิต',         d:'ตั้งความลึกของ decision tree ตรงจุดที่ cross-validation ดีที่สุด',  ok:c=>c.treeBest},
    {id:'nlp',    icon:'📱', t:'นักฟังโซเชียล',          d:'ติดป้ายข้อมูลฝึกโมเดล NLP ถูกอย่างน้อย ๘ ใน ๙ โพสต์',             ok:c=>c.nlpAcc!=null && c.nlpAcc>=8},
    {id:'xai',    icon:'🧠', t:'ไม่เชื่อ AI ง่าย ๆ',       d:'ตรวจ model card ก่อนตัดสินใจ และจับได้ว่า AI แต่งแหล่งอ้างอิง',     ok:c=>c.aiGood && c.aiHallu},
    {id:'forecast',icon:'🔮', t:'นักพยากรณ์',            d:'พยากรณ์ในรายงานเช้าอย่างน้อย ๓ วัน คลาดเคลื่อนเฉลี่ยไม่เกิน ๒ ราย', ok:c=>c.fcN>=3 && c.fcMAE!=null && c.fcMAE<=2},
    {id:'coder',  icon:'💻', t:'สายโค้ด',               d:'รัน SQL หรือดาวน์โหลดข้อมูลไปวิเคราะห์ต่อ',                       ok:c=>c.coder},
    {id:'hds',    icon:'🎓', t:'นักวิทยาศาสตร์ข้อมูลสุขภาพตัวจริง', d:'ไขคดีถูก โดยใช้ ML · วิเคราะห์เชิงพื้นที่ · NLP และใช้ AI อย่างรับผิดชอบในคดีเดียว', ok:c=>c.solved && c.mlUsed && c.spatial && c.nlpAcc!=null && c.nlpAcc>=7 && c.aiGood},
    {id:'five',   icon:'🏛️', t:'นักสืบมากประสบการณ์',   d:'ไขคดีสำเร็จครบ ๕ คดี',                                          ok:(c,m)=>m.cases.filter(x=>x.solved).length>=5},
  ];

  function record(W,S,R){
    const m = load(), dec = R.debrief.decisions;
    const c = {at:Date.now(), date:today(), name:S.name, gender:S.gender, diff:S.diff, type:W.scn.type, seed:W.seed, score:R.total, rank:R.rank,
      solved:R.correctSource, hours:Math.round(S.T-M.T0), wrong:R.wrongClosed.length, tri:!!R.tri, misses:R.misses, quick:!!S.flags.quick, daily:!!S.flags.daily,
      dataPerfect: S.acc.ch1===S.acc.ch1Max && S.acc.ch2===S.acc.ch2Max, confound:!!W.scn.confound, confPicked:R.picked.some(e=>e.id==='or-'+W.scn.confound),
      decN:dec.length, decBad:dec.filter(d=>d.verdict==='bad').length, decMixed:dec.filter(d=>d.verdict==='mixed').length,
      bondsMin:Math.min(...Object.values(S.bonds)), pdpa:S.flags.pdpa||null, festival:S.flags.festival||null, festCases:OD.story.festCases(W,S),
      deepGood:!!S.flags.deepConsent && !S.flags.leading, rumorRight:S.flags.rumor===W.scn.culprit, yielded:!!S.flags.yield};
    // เครื่องมือ HDS
    const fc = OD.ai.fcScore(S);
    Object.assign(c, {mlUsed:!!S.flags.vML, mlRight:R.picked.some(e=>e.kind==='ml' && e.rel==='strong'), treeBest:!!S.flags.treeBest, spatial:!!S.flags.vSpatial,
      nlpAcc: S.flags.nlpAcc==null ? null : S.flags.nlpAcc, aiGood:S.decisions.some(d=>d.id==='aiTool' && d.verdict==='good'), aiHallu:!!S.flags.aiHallu,
      alarmFirst:!!S.flags.alarmFirst, fcN:fc.n, fcMAE:fc.mae, coder:!!S.flags.coder});
    m.cases.push(c); if(m.cases.length>300) m.cases = m.cases.slice(-300);
    // เหตุการณ์ที่เคยเจอ + รูปแบบเรื่องที่เคยเจอ (สะสมข้ามคดี)
    const v = S.flags.v || {};
    m.seen = [...new Set((m.seen||[]).concat(S.flags.seen||[], v.patient?['pt:'+v.patient]:[], v.fest?['fe:'+v.fest]:[], v.pressure?['pr:'+v.pressure]:[]))];
    const fresh = [];
    for(const a of ACH) if(!m.ach[a.id] && a.ok(c,m)){ m.ach[a.id] = c.date; fresh.push(a); }
    save(m);
    let dailyRank = null;
    if(c.daily){ const L = m.cases.filter(x=>x.daily && x.date===c.date).sort((a,b)=>b.score-a.score); dailyRank = L.findIndex(x=>x.at===c.at)+1; }
    return {fresh, dailyRank, record:c};
  }

  /* รายการเหตุการณ์/รูปแบบเรื่องทั้งหมดที่สะสมได้ */
  const SEEN_ALL = [
    ...['pdpa','storm','sheriff','herbal','schoolClose','neighbor','students','labMix','teamSick','tipoff','misinfo','vendor','promise','backlash','aiTool'].map(id=>[id, (OD.story.EVENT_NAMES||{})[id]||id]),
    ['pt:thongbai','ยายทองใบขาดน้ำ'], ['pt:baby','น้องใบบัวขาดน้ำ'], ['pt:boonsong','ตาบุญส่งขาดน้ำ'],
    ['fe:kathin','งานทอดกฐิน'], ['fe:wedding','งานแต่งลูกสาวกำนัน'],
    ['pr:hall','ประชาคมที่ศาลา'], ['pr:protest','ชาวบ้านประท้วงหน้า รพ.สต.'], ['pr:live','กำนันไลฟ์สด'],
  ];
  const seenCount = m => SEEN_ALL.filter(([k])=>(m.seen||[]).includes(k)).length;
  function summary(){
    const m = load(), solvedTypes = M.SCN_TYPES.filter(t=>m.cases.some(x=>x.solved && x.type===t)).length;
    return {cases:m.cases.length, ach:Object.keys(m.ach).length, achMax:ACH.length, solvedTypes, best:m.cases.reduce((a,c)=>Math.max(a,c.score),0), seen:seenCount(m), seenMax:SEEN_ALL.length};
  }
  const rankChip = r => `<span class="rk rk-${r}">${r}</span>`;
  const row = (c,i) => `<tr><td>${U.thaiNum(i+1)}</td><td class="l">${U.esc(c.name)}</td><td>${rankChip(c.rank)}</td><td><b>${c.score}</b></td><td class="l">${M.SCN_NAME[c.type]||c.type}${c.solved?'':' ✗'}</td><td class="l faint">${M.DIFF[c.diff]?M.DIFF[c.diff].label:''}</td></tr>`;
  function html(){
    const m = load(), td = today(), su = summary();
    const daily = m.cases.filter(c=>c.daily && c.date===td).sort((a,b)=>b.score-a.score).slice(0,10);
    const best = m.cases.slice().sort((a,b)=>b.score-a.score).slice(0,10);
    const table = L => L.length ? `<table class="lb"><thead><tr><th>#</th><th class="l">ชื่อ</th><th>ระดับ</th><th>คะแนน</th><th class="l">ต้นตอ</th><th class="l">ความยาก</th></tr></thead><tbody>${L.map(row).join('')}</tbody></table>` : '<div class="muted" style="padding:8px 0">ยังไม่มีข้อมูล</div>';
    return `<h2 class="display gold-text">🏆 สถิตินักสืบ</h2>
      <div class="meta-sum"><span class="chip gold">คดีทั้งหมด ${U.thaiNum(su.cases)}</span><span class="chip">คะแนนสูงสุด ${su.best}</span><span class="chip">เหรียญ ${U.thaiNum(su.ach)}/${U.thaiNum(su.achMax)}</span><span class="chip">ไขได้ ${U.thaiNum(su.solvedTypes)}/๖ ต้นตอ</span></div>
      <h3 class="meta-h">📅 คดีประจำวัน · ${fmtDate(td)}</h3>${table(daily)}
      <h3 class="meta-h">🏅 คะแนนสูงสุดตลอดกาล</h3>${table(best)}
      <h3 class="meta-h">🗂️ แฟ้มคดี — ต้นตอที่เคยไขได้</h3>
      <div class="files">${M.SCN_TYPES.map(t=>{ const n = m.cases.filter(c=>c.type===t).length, s = m.cases.filter(c=>c.type===t && c.solved).length;
        return `<div class="file ${s?'on':''}"><span class="fi">${{WELL:'💧',REST:'🍜',ICE:'🧊',SCHOOL:'🏫',EVENT:'🛕',FARM:'🥬'}[t]}</span><b>${M.SCN_NAME[t]}</b><small>${s?`ไขได้ ${U.thaiNum(s)}/${U.thaiNum(n)} คดี`:n?`ยังไม่เคยไขได้ (${U.thaiNum(n)} คดี)`:'🔒 ยังไม่เคยเจอ'}</small></div>`; }).join('')}</div>
      <h3 class="meta-h">📜 เหตุการณ์ที่เคยเจอ (${U.thaiNum(seenCount(m))}/${U.thaiNum(SEEN_ALL.length)})</h3>
      <div class="seen">${SEEN_ALL.map(([k,t])=>{ const got = (m.seen||[]).includes(k); return `<span class="chip ${got?'gold':''}">${got?t:'🔒 ???'}</span>`; }).join(' ')}</div>
      <h3 class="meta-h">🎖️ เหรียญ (${U.thaiNum(su.ach)}/${U.thaiNum(su.achMax)})</h3>
      <div class="ach-grid">${ACH.map(a=>{ const got = m.ach[a.id]; return `<div class="ach ${got?'on':''}"><span class="ai">${got?a.icon:'🔒'}</span><b>${a.t}</b><small>${a.d}${got?`<br><span class="faint">ได้เมื่อ ${fmtDate(got)}</span>`:''}</small></div>`; }).join('')}</div>
      ${m.cases.length ? `<h3 class="meta-h">🕘 คดีล่าสุด</h3><table class="lb"><tbody>${m.cases.slice(-6).reverse().map(c=>`<tr><td class="l faint">${fmtDate(c.date)}</td><td class="l">${U.esc(c.name)}${c.daily?' 📅':''}</td><td>${rankChip(c.rank)}</td><td><b>${c.score}</b></td><td class="l">${M.SCN_NAME[c.type]||c.type}${c.solved?' ✓':' ✗'}</td></tr>`).join('')}</tbody></table>` : ''}
      <div class="m-actions"><button class="btn btn-sm" data-m="reset">ล้างสถิติทั้งหมด</button><button class="btn btn-gold" data-m="x">ปิด</button></div>`;
  }
  function open(){
    U.modal(html(), async k=>{
      if(k==='x') U.closeModal();
      if(k==='reset'){
        const a = await U.ask('<h2>ล้างสถิติทั้งหมด?</h2><p>ตารางคะแนน เหรียญ และแฟ้มคดีในเครื่องนี้จะหายไปทั้งหมด</p>', [['no','ยกเลิก',''],['yes','ล้างข้อมูล','btn-red']]);
        if(a==='yes'){ save({cases:[], ach:{}, seen:[]}); }
        open();
      }
    }, {wide:true, cls:'meta-modal'});
  }
  return {record, open, summary, dailySeed, today, ACH};
})();
