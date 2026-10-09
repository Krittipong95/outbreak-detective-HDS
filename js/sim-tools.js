/* =========================================================
   sim-tools — กลไกการสืบสวน: ผู้ป่วยที่เห็น, สัมภาษณ์, case-control,
   ตารางวิเคราะห์, ตรวจสิ่งแวดล้อม, แล็บ, ห่วงโซ่อุปทาน, ผลลัพธ์
   ========================================================= */
(function(M){
  const U = OD.u;
  M.DIFF = {
    easy:   {label:'นักศึกษาฝึกงาน',       budget:60000, recall:.04, sens:.92, hints:true},
    normal: {label:'นักวิทยาศาสตร์ข้อมูล',  budget:45000, recall:.08, sens:.82, hints:true},
    hard:   {label:'ผู้เชี่ยวชาญ',          budget:32000, recall:.12, sens:.70, hints:false},
  };
  M.COST = {
    interviewFirst:{h:6,b:0}, interview:{h:3,b:0},
    cc:{1:{h:6,b:4000}, 2:{h:9,b:7000}, 4:{h:14,b:12000}},
    inspect:{h:4,b:500}, stool:{h:2,b:3000}, env:{h:2,b:2000}, supply:{h:3,b:0}, wait:{h:12,b:0},
    close:{h:1,b:0}, hygiene:{h:2,b:3000}, LAB_WAIT:24,
  };

  M.newState = (W, diff, name) => ({
    name, diff, T:M.T0, budget:M.DIFF[diff].budget, trust:60, ver:0,
    acc:{ch1:0, ch1Max:0, ch2:0, ch2Max:0},
    clean:{dupKept:new Set(), lost:new Set(), ageBad:new Set(), dateBad:new Set(), phantom:new Set()},
    ans:{}, controls:[], ccRatio:0, inspected:{}, labs:[], stoolDone:new Set(), supply:false,
    known:new Set(['W1','W2','W3','R1','R2','R3','R4','S','E']),
    closed:{}, reopened:{}, reclosed:{}, hygieneAt:null, boilAt:null, wrongClosures:0, evidence:[], flags:{}, log:[], newIds:new Set(),
    kit:null, acfAt:null, hyp:[], confirmed:new Set(), reviewed:false,
    decisions:[], mistakes:[], bonds:{kamnan:50, boonma:50, fah:50}, deep:[],
  });
  /* อุปกรณ์ภาคสนาม (ขั้นตอนที่ ๑ เตรียมการ) */
  M.KIT = [
    {k:'cary',   ok:true,  t:'ไม้ swab + อาหารเลี้ยงเชื้อขนส่ง Cary-Blair', why:'เก็บอุจจาระ/rectal swab ส่งเพาะเชื้อ ถ้าไม่มี ตัวอย่างจะแห้งและเชื้อตาย'},
    {k:'bottle', ok:true,  t:'ขวดเก็บน้ำปลอดเชื้อ (มีโซเดียมไทโอซัลเฟต)', why:'เก็บน้ำตรวจแบคทีเรีย สารนี้หยุดฤทธิ์คลอรีนไม่ให้ฆ่าเชื้อในขวดระหว่างขนส่ง'},
    {k:'chlor',  ok:true,  t:'ชุดทดสอบคลอรีนอิสระคงเหลือ', why:'วัดได้ทันทีในพื้นที่ว่าน้ำได้รับการฆ่าเชื้อเพียงพอหรือไม่ (เกณฑ์ ๐.๒–๐.๕ มก./ล.)'},
    {k:'cold',   ok:true,  t:'กล่องเย็นและไอซ์แพ็ก (๔ °C)', why:'รักษาอุณหภูมิตัวอย่างอาหาร น้ำ และน้ำแข็งระหว่างขนส่ง'},
    {k:'form',   ok:true,  t:'แบบสอบสวนโรคและใบยินยอม', why:'ถามทุกคนด้วยคำถามชุดเดียวกัน และขอความยินยอมก่อนเก็บข้อมูล'},
    {k:'ppe',    ok:true,  t:'ถุงมือ หน้ากาก สบู่/เจลล้างมือ', why:'ป้องกันทีมสอบสวนไม่ให้ติดเชื้อหรือพาเชื้อไปแพร่ต่อ'},
    {k:'abx',    ok:false, t:'ยาปฏิชีวนะไว้แจกชาวบ้าน', why:'ไม่ควรแจกยาปฏิชีวนะโดยไม่มีข้อบ่งชี้ ทำให้เชื้อดื้อยาและบดบังผลเพาะเชื้อ'},
    {k:'lope',   ok:false, t:'ยาหยุดถ่ายไว้แจก', why:'ยาหยุดถ่ายไม่ช่วยรักษาภาวะขาดน้ำ และห้ามใช้ในเด็กหรือผู้ที่ถ่ายเป็นมูกเลือด/มีไข้'},
    {k:'fog',    ok:false, t:'เครื่องพ่นหมอกควันกำจัดยุง', why:'โรคอุจจาระร่วงไม่ได้ติดต่อทางยุง'},
  ];
  M.hasKit = (S,k) => !S.kit || S.kit.has(k);

  /* ---------- ผู้ป่วยหลังมาตรการ ---------- */
  /* สถานที่ปิดอยู่ ณ เวลา t หรือไม่ (ปิด → อาจถูกเปิดคืน → อาจถูกสั่งปิดซ้ำในรายงาน) */
  M.isClosed = function(S, id, t=S.T){
    const c = S.closed[id]; if(c==null || c>t) return false;
    const o = (S.reopened||{})[id], r = (S.reclosed||{})[id];
    return !(o!=null && o<=t && !(r!=null && r<=t));
  };
  M.wasReopened = (S,id) => (S.reopened||{})[id]!=null && !((S.reclosed||{})[id]!=null);
  function blocked(W,S,p){ return M.isClosed(S,p.via,p.inf) || (W.scn.type==='ICE' && M.isClosed(S,'F1',p.inf)) || (W.scn.type==='FARM' && M.isClosed(S,'F3',p.inf)); }
  M.effective = function(W,S,p){
    if(p.inf===null) return false;
    if(S._memoV!==S.ver){ S._memo = new Map(); S._memoV = S.ver; }
    if(S._memo.has(p.id)) return S._memo.get(p.id);
    let r = true;
    if(p.cause==='src' || p.cause==='fest'){
      r = !blocked(W,S,p);
      // ประกาศต้มน้ำ/เติมคลอรีนทุกบ่อ ป้องกันได้ราว ๗๐% ของการติดเชื้อทางน้ำหลังประกาศ
      if(r && W.scn.type==='WELL' && S.boilAt!=null && S.boilAt<=p.inf && p.u<.7) r = false;
      if(r && p.cause==='fest'){ const f = (S.flags||{}).festival; if(f==='cancel' || (f==='safe' && p.u>=.15)) r = false; }
    }
    else if(p.cause==='sec'){
      r = M.effective(W,S,W.byId(p.index));
      if(r && S.hygieneAt!=null && S.hygieneAt<=p.inf && p.u<.65) r = false;
    }
    S._memo.set(p.id, r); return r;
  };
  // เวลาที่ผู้ป่วยปรากฏในฐานข้อมูล: ผู้ป่วยที่ไม่ไปสถานพยาบาลจะพบหลังเริ่มค้นหาเชิงรุก
  M.repTime = (S,p) => p.hidden ? (S.acfAt==null ? Infinity : Math.max(S.acfAt, p.onset+12)) : p.report;
  M.isCase = (W,S,p,t=S.T) => p.inf!==null && M.repTime(S,p)<=t && M.effective(W,S,p);
  M.hiddenFound = (W,S,t=S.T) => W.people.filter(p=>p.hidden && p.inf!==null && M.repTime(S,p)<=t && M.effective(W,S,p)).length;
  M.classOf = (S,p) => S.confirmed.has(p.id) ? 'ยืนยัน' : 'สงสัย';
  M.cases = (W,S,t=S.T) => W.people.filter(p=>M.isCase(W,S,p,t));

  /* เรคคอร์ดผู้ป่วยในฐานข้อมูล (สะท้อนผลการทำความสะอาดข้อมูลในบทที่ ๒) */
  M.records = function(W,S,t=S.T){
    const C = S.clean, out = [];
    for(const p of M.cases(W,S,t)) if(!C.lost.has(p.id)) out.push({p, dup:false});
    for(const pid of C.dupKept){ const p=W.byId(pid); if(M.isCase(W,S,p,t)) out.push({p, dup:true}); }
    for(const pid of C.phantom) out.push({p:W.byId(pid), dup:false, phantom:true});
    return out;
  };

  /* ---------- สัมภาษณ์ / ตอบแบบสอบถาม ---------- */
  function hhTruth(W,S,p,ref){
    return W.households[p.hh-1].members.some(id=>{ if(id===p.id) return false; const q=W.byId(id);
      return M.effective(W,S,q) && q.onset<ref && ref-q.onset<7*24 && q.report<=Math.max(ref,S.T); });
  }
  // ชาวบ้านตอบคลาดเคลื่อนมากขึ้นเมื่อไม่ไว้ใจทีม ถูกตีตรา หรือถูกสัมภาษณ์แบบเร่งรีบ
  M.recallRate = S => M.DIFF[S.diff].recall + (S.trust<40 ? .08 : 0) + (S.flags.stigma ? .05 : 0) + (S.flags.teamSick==='work' ? .04 : 0) + (S.flags.students==='raw' ? .05 : 0);
  M.answer = function(W,S,p,isCase){
    const e = M.recallRate(S), a = {};
    let water = p.water;
    if(U.r()<e) water = U.pick(['W1','W2','W3','BOT'].filter(w=>w!==p.water));
    for(const w of ['W1','W2','W3']) a[w] = water===w;
    const festDone = S.T>=M.FEST_T+6 && S.flags.festival!=='cancel';
    for(const x of M.EXPOSURES){
      if(['W1','W2','W3'].includes(x.k)) continue;
      let v = x.k==='HH' ? hhTruth(W,S,p, isCase ? p.onset : S.T) : x.k==='FEST' ? (festDone && p.fest && (!isCase || p.onset>M.FEST_T)) : !!p.exp[x.k];
      if(x.k==='BOT' && water==='BOT') v = true;
      const r = U.r();
      a[x.k] = r<e/2 ? null : r<e*1.5 ? !v : v;
    }
    if(!a.E){ a.E_kj = a.E===null?null:false; a.E_lb = a.E===null?null:false; a.E_ds = a.E===null?null:false; }
    return a;
  };
  M.interviewAll = function(W,S){
    let n = 0;
    for(const r of M.records(W,S)) if(!S.ans[r.p.id]){ S.ans[r.p.id] = M.answer(W,S,r.p,true); n++; }
    return n;
  };
  M.pendingInterviews = (W,S) => M.records(W,S).filter(r=>!S.ans[r.p.id]).length;

  M.addControls = function(W,S,ratio){
    const nCases = M.records(W,S).filter(r=>S.ans[r.p.id]).length;
    const want = Math.max(0, ratio*nCases - S.controls.length);
    const pool = U.shuffle(W.people.filter(p=>!M.isCase(W,S,p) && !S.ans[p.id] && !S.clean.phantom.has(p.id) && !(p.inf!==null && p.onset<=S.T)));
    const add = pool.slice(0, want);
    for(const p of add){ S.ans[p.id] = M.answer(W,S,p,false); S.controls.push(p.id); }
    S.ccRatio = Math.max(S.ccRatio, ratio);
    return add.length;
  };

  /* ---------- ตารางวิเคราะห์ ---------- */
  M.analyze = function(W,S){
    const cases = M.records(W,S).filter(r=>S.ans[r.p.id]);
    const ctrls = S.controls.map(id=>W.byId(id));
    return M.exposures(S).map(x=>{
      let a=0,c=0,b=0,d=0;
      for(const r of cases){ const v=S.ans[r.p.id][x.k]; if(v===true)a++; else if(v===false)c++; }
      for(const p of ctrls){ const v=S.ans[p.id][x.k]; if(v===true)b++; else if(v===false)d++; }
      const row = {k:x.k, label:x.label, g:x.g, a,b,c,d, nCase:a+c, nCtrl:b+d, pCase:(a+c)?a/(a+c):0, pCtrl:(b+d)?b/(b+d):null};
      if(b+d>0 && a+c>0) Object.assign(row, U.or2x2(a,b,c,d));
      return row;
    });
  };
  M.stratify = function(W,S,k){
    const cases = M.records(W,S).filter(r=>S.ans[r.p.id]).map(r=>r.p);
    const ctrls = S.controls.map(id=>W.byId(id));
    const strata = M.VILLAGES.map(v=>{
      let a=0,b=0,c=0,d=0;
      for(const p of cases) if(p.v===v.id){ const x=S.ans[p.id][k]; if(x===true)a++; else if(x===false)c++; }
      for(const p of ctrls) if(p.v===v.id){ const x=S.ans[p.id][k]; if(x===true)b++; else if(x===false)d++; }
      return {v, t:[a,b,c,d], or: (a+c&&b+d) ? U.or2x2(a,b,c,d) : null};
    });
    return {strata, mh:U.mh(strata.map(s=>s.t))};
  };

  /* ---------- หลักฐานภาคสนาม ---------- */
  const F = id => M.SITES[id].name;
  M.addEvidence = (S, ev) => { if(!S.evidence.some(e=>e.id===ev.id)) S.evidence.push(Object.assign({t:S.T}, ev)); };

  M.inspect = function(W,S,site){
    const s = W.scn, T = M.SITES[site].type, culprit = s.culprit===site;
    let text, strength='none';
    const chl = M.hasKit(S,'chlor'), NOKIT = ' (ไม่ได้นำชุดทดสอบคลอรีนมา จึงวัดคลอรีนคงเหลือไม่ได้)';
    if(T==='water'){
      if(culprit){ const b = {
        W1:'ฝาบ่อแตก อยู่ห่างบ่อเกรอะของกุฏิเพียง ๘ เมตร (ควรห่างอย่างน้อยราว ๓๐ เมตร) หลังฝนตกน้ำในบ่อขุ่นและมีกลิ่น',
        W2:'ท่อระบายน้ำเสียของตลาดแตกใกล้ปากบ่อ น้ำเสียซึมลงบ่อ',
        W3:'น้ำคลองเอ่อล้นข้ามขอบบ่อเมื่อคืนวันที่ ๑ ขอบบ่อมีคราบโคลน'}[site];
        text = b + (chl ? ' · คลอรีนอิสระคงเหลือ 0 มก./ล. (ต่ำกว่าเกณฑ์ ๐.๒)' : NOKIT); strength = chl ? 'strong' : 'weak'; }
      else { const b = site==='W3' ? 'บ่ออยู่ใกล้คลองแต่ขอบบ่อยกสูง ไม่พบร่องรอยน้ำท่วมถึง' : site==='W2' ? 'มีตะไคร่น้ำขึ้นรอบขอบบ่อ แต่ฝาปิดมิดชิด' : 'ฝาบ่อปิดมิดชิด อสม. เติมคลอรีนทุกสัปดาห์';
        text = b + (chl ? ` · คลอรีนอิสระคงเหลือ ${site==='W2'?'0.3':site==='W3'?'0.4':'0.5'} มก./ล. (ผ่านเกณฑ์)` : NOKIT); }
    }
    const sickHandler = ' · ผู้ประกอบอาหาร ๑ คนเพิ่งหายจากอาเจียน-ท้องเสียเมื่อสองวันก่อน แต่ยังทำอาหารด้วยมือเปล่า';
    const vegNote = id => { const v = s.vegSupplier[id]; if(v!=='F3') return ' · ผักสดซื้อจากตลาดสดอำเภอ'; S.known.add('F3');
      return ` · ผักสดรับจาก${F('F3')}` + (s.type==='FARM' ? ' (ผักบุ้ง ถั่วงอก ยังมีดินโคลนติด กลิ่นน้ำคลอง)' : ''); };
    if(T==='food'){
      if(culprit){ strength='strong'; text = {
        R1:'ปูดองเก็บในโหลไม่มีฝาที่อุณหภูมิห้องหลายวัน แม่ค้าใช้มือเปล่าหยิบปูและผัก',
        R2:'ล้างผักสด (ถั่วงอก ผักบุ้ง) ด้วยน้ำคลองหลังร้านโดยไม่ผ่านการฆ่าเชื้อ',
        R3:'ไก่ต้มสุกไม่ทั่ว เนื้อติดกระดูกยังแดง ใช้เขียงเดียวกับไก่ดิบ และไม่มีตู้แช่เย็น',
        R4:'หมูและไก่หมักวางนอกตู้เย็นทั้งวัน ใช้ถาดเดียวกันใส่ของดิบและของสุก'}[site] + (s.pathogen==='NORO' ? sickHandler : ''); }
      else text = {R1:'มีปูดองขาย แต่เก็บในตู้เย็นมีฝาปิด ผู้ขายสวมถุงมือ', R2:'ครัวค่อนข้างสะอาด ลวกผักก่อนเสิร์ฟ',
        R3:'ต้มไก่สุกทั่ว แยกเขียงดิบ-สุก มีตู้แช่', R4:'ถังขยะไม่มีฝา สุขาภิบาลทั่วไปพอใช้ แต่เนื้อสัตว์แช่ตู้เย็น'}[site];
      const sup = s.iceSupplier[site];
      text += ` · ใช้น้ำแข็งจาก${F(sup)}`;
      if(s.type==='ICE' && sup==='F1'){ text += ' (ก้อนน้ำแข็งขุ่น มีตะกอน)'; if(strength==='none') strength='weak'; }
      text += vegNote(site);
      if(s.type==='FARM' && s.vegSupplier[site]==='F3' && strength==='none') strength = 'weak';
      S.known.add(sup);
    }
    if(T==='school'){
      if(culprit){ strength='strong'; text = {
        handler:'แม่ครัว ๑ ใน ๓ คนมีอาการอาเจียน-ท้องเสียตั้งแต่ พฤ. ๑๙ พ.ย. แต่ยังมาทำอาหารทุกวัน และในครัวไม่มีอ่างล้างมือ',
        food:'ไก่ทอดสำหรับอาหารกลางวันทอดตั้งแต่ตีสี่ วางทิ้งไว้ในอุณหภูมิห้องจนเที่ยง ใช้เขียงเดียวกับไก่ดิบ และตู้เย็นเล็กเกินกว่าจะแช่อาหารได้หมด',
        tank:'แท็งก์น้ำดื่มของโรงเรียนฝาแตก มีซากนกและตะกอนก้นถัง ไม่ได้ล้างมาเกือบปี ตู้กดน้ำต่อจากแท็งก์นี้โดยตรง' + (chl ? ' · คลอรีนอิสระคงเหลือ 0 มก./ล.' : NOKIT)}[s.sub]; }
      else text='ครัวสะอาด แม่ครัวทั้ง ๓ คนไม่มีอาการป่วย มีอ่างล้างมือและสบู่ · แท็งก์น้ำดื่มมีฝาปิด ล้างทุกเทอม';
      text += vegNote('S');
      if(s.type==='FARM' && s.vegSupplier.S==='F3' && strength==='none') strength = 'weak';
    }
    if(T==='event'){
      if(culprit){ strength='strong'; text = {
        E_kj:'แม่ครัวอาสาทำน้ำยาขนมจีนตั้งแต่คืนก่อนงาน ตั้งทิ้งไว้ที่อุณหภูมิห้องกว่า ๑๒ ชั่วโมง ยังมีน้ำยาเหลือแช่ตู้เย็นที่กุฏิ',
        E_ds:'ลอดช่องน้ำกะทิใช้น้ำแข็งทุบที่แช่ในกระสอบวางกับพื้น และผสมน้ำกะทิด้วยน้ำบ่อที่ไม่ได้ต้ม ยังมีลอดช่องเหลือแช่ตู้เย็น',
        E_lb:'ลาบหมูทำแบบ “ลาบดิบ” จากหมูสับผสมเลือดสด หมูซื้อมาตั้งแต่เช้ามืดและวางนอกตู้เย็นหลายชั่วโมง ยังมีลาบเหลือแช่ตู้เย็นที่กุฏิ'}[s.dish] + (s.pathogen==='NORO' ? ' · แม่ครัวอาสาคนหนึ่งอาเจียนตั้งแต่คืนก่อนงาน' : ''); }
      else text='อาหารในงานปรุงสุกใหม่และเสิร์ฟร้อน แม่ครัวอาสาไม่มีใครป่วย อาหารเหลือถูกทิ้งไปหมดแล้ว';
    }
    if(T==='ice'){
      if(culprit){ strength = chl ? 'strong' : 'weak'; text='ระบบกรองและเติมคลอรีนชำรุดมา ๒ สัปดาห์ ใช้น้ำบาดาลโดยตรง คนงานจับน้ำแข็งด้วยมือเปล่า' + (s.pathogen==='NORO' ? ' · คนงาน ๑ คนเพิ่งป่วยอาเจียนแต่ยังมาทำงาน' : '') + (chl ? ' · คลอรีนอิสระคงเหลือในน้ำผลิต 0 มก./ล.' : NOKIT); }
      else text='มีระบบกรอง RO และเติมคลอรีนตามมาตรฐาน มีใบอนุญาต อย. ผลตรวจน้ำล่าสุดผ่านเกณฑ์' + (chl ? ' · คลอรีนอิสระคงเหลือ 0.4 มก./ล.' : '');
    }
    if(T==='farm'){
      if(culprit){ strength='strong'; text='สูบน้ำคลองช่วงท้ายน้ำของหมู่บ้านมารดผักโดยตรง ใกล้ท่อน้ำทิ้งของคอกหมู ล้างผักในบ่อพักน้ำเดียวกันก่อนส่ง และไม่มีการฆ่าเชื้อ'; }
      else text='ใช้น้ำบาดาลรดผัก มีบ่อพักน้ำแยก ล้างผักด้วยน้ำประปาก่อนส่ง';
    }
    S.inspected[site] = text;
    M.addEvidence(S, {id:'env-'+site, kind:'env', site, strength, text:`ตรวจสิ่งแวดล้อม ${F(site)}: ${text}`});
    return {text, strength};
  };

  M.sampleTypes = function(W,S,site){
    const T = M.SITES[site].type;
    if(T==='water') return [['water','ตัวอย่างน้ำ']];
    if(T==='food') return [['food','ตัวอย่างอาหาร'],['ice','ตัวอย่างน้ำแข็งของร้าน'],['veg','ตัวอย่างผักสดของร้าน']];
    if(T==='school') return [['food','ตัวอย่างอาหารกลางวัน'],['swab','swab มือแม่ครัว'],['water','น้ำดื่มจากแท็งก์'],['veg','ผักสดในโรงอาหาร']];
    if(T==='event') return S.T <= M.T0+30 ? [['E_kj','น้ำยาขนมจีนที่เหลือ'],['E_lb','ลาบหมูที่เหลือ'],['E_ds','ลอดช่องที่เหลือ']] : [];
    if(T==='ice') return [['ice','ตัวอย่างน้ำแข็ง'],['water','น้ำที่ใช้ผลิต']];
    if(T==='farm') return [['veg','ตัวอย่างผักสด'],['water','น้ำที่ใช้รดผัก']];
    return [];
  };
  /* ชนิดตัวอย่างที่ตรวจพบเชื้อได้จากต้นตอ (ตัวแรก = ชนิดที่แนะนำ · null = ได้ทุกชนิด) */
  M.rightSamples = s => ({REST: s.culprit==='R2' ? ['food','veg'] : ['food'], EVENT:[s.dish],
    SCHOOL:{handler:['swab','food'], food:['food'], tank:['water']}[s.sub]})[s.type] || null;
  M.rightSample = s => (M.rightSamples(s) || [null])[0];
  function envTruth(W, site, type){
    const s = W.scn;
    if(s.culprit===site){
      if(s.type==='EVENT') return type===s.dish;
      if(s.type==='REST') return type==='food' || (type==='veg' && s.culprit==='R2');
      if(s.type==='SCHOOL') return {handler:['swab','food'], food:['food'], tank:['water']}[s.sub].includes(type);
      return true;
    }
    if(s.type==='ICE' && type==='ice' && M.SITES[site].type==='food') return s.iceSupplier[site]==='F1';
    if(s.type==='FARM' && type==='veg') return s.vegSupplier[site]==='F3';
    return false;
  }
  // ความไวของการตรวจขึ้นกับชนิดตัวอย่าง และการเก็บ/ขนส่งที่ถูกวิธี (อุปกรณ์ที่เตรียมมา)
  M.kitFactor = (S,type) => type==='water' ? (M.hasKit(S,'bottle')?1:.5) : type==='swab' ? (M.hasKit(S,'cary')?1:.5)
    : ['food','ice','veg','E_kj','E_lb','E_ds'].includes(type) ? (M.hasKit(S,'cold')?1:.6) : 1;
  M.labEnv = function(W,S,site,type){
    const sens = M.DIFF[S.diff].sens * ({water:1, food:.9, ice:.95, swab:.85, veg:.88}[type] || 1) * M.kitFactor(S,type);
    const pos = envTruth(W,site,type) && U.r()<sens;
    return {kind:'env', site, type, pos, pathogen: pos ? W.scn.pathogen : null};
  };
  M.labStool = function(W,S){
    const pool = U.shuffle(M.records(W,S).filter(r=>!r.dup && !r.phantom && S.ans[r.p.id] && !S.stoolDone.has(r.p.id)).map(r=>r.p)).slice(0,5);
    const others = Object.keys(M.PATHOGENS).filter(k=>k!==W.scn.pathogen), kf = M.hasKit(S,'cary') ? 1 : .5;
    const ids = [], res = pool.map(p=>{
      S.stoolDone.add(p.id); ids.push(p.id);
      if(p.cause==='bg') return U.r()<.25 ? U.pick(others) : null;
      return U.r() < M.DIFF[S.diff].sens*.9*kf ? W.scn.pathogen : null;
    });
    return {kind:'stool', n:pool.length, res, ids};
  };
  /* ขั้นตอนที่ ๒ ยืนยันการวินิจฉัย: ทบทวนเวชระเบียนผู้ป่วยที่นอนโรงพยาบาล */
  M.reviewRecords = function(W,S){
    const R = M.records(W,S).filter(r=>!r.dup && !r.phantom).map(r=>r.p), n = R.length || 1;
    const pc = k => Math.round(R.filter(p=>p.sym[k]).length/n*100);
    const adm = R.filter(p=>p.admit).length;
    const text = `ทบทวนเวชระเบียน ${R.length} ราย (นอนโรงพยาบาล ${adm} ราย): ถ่ายเหลว ${pc('diar')}% · ถ่ายเป็นน้ำ ${pc('watery')}% · อาเจียน ${pc('vomit')}% · มีไข้ ${pc('fever')}% · ปวดท้อง ${pc('cramp')}% · มูกเลือด ${pc('blood')}% — ไม่พบอาการทางระบบประสาทหรือประวัติสัมผัสสารเคมี เข้าได้กับโรคติดเชื้อทางเดินอาหารเฉียบพลัน`;
    S.reviewed = true;
    M.addEvidence(S, {id:'clinical', kind:'clinical', strength:'weak', text});
    return text;
  };

  M.supplyChain = function(W,S){
    const s = W.scn, lines = [], veg = id => s.vegSupplier[id]==='F3' ? F('F3') : 'ตลาดสดอำเภอ';
    for(const r of ['R1','R2','R3','R4']) lines.push(`${F(r)} ← น้ำแข็งจาก${F(s.iceSupplier[r])} · ผักสดจาก${veg(r)}`);
    lines.push('งานบวชที่วัด ← อาหารทำโดยแม่ครัวอาสาของวัด, น้ำแข็งซื้อจากร้านค้าในตลาด');
    lines.push(`โรงอาหารโรงเรียน ← แม่ครัวของโรงเรียน ๓ คน ปรุงเองทุกวัน · ผักสดจาก${veg('S')} · น้ำดื่มจากแท็งก์ของโรงเรียน`);
    S.supply = true; ['F1','F2','F3'].forEach(x=>S.known.add(x));
    const iceShare = ['R1','R2','R3','R4'].filter(r=>s.iceSupplier[r]==='F1').map(r=>F(r));
    const vegShare = ['R1','R2','R3','R4','S'].filter(r=>s.vegSupplier[r]==='F3').map(r=>F(r));
    M.addEvidence(S, {id:'supply', kind:'supply', site:'F1', strength: s.type==='ICE' ? 'strong' : 'none',
      text:`ห่วงโซ่อุปทาน: ที่ใช้น้ำแข็งจากโรงน้ำแข็งเจริญผล ได้แก่ ${iceShare.join(', ') || '—'}`});
    M.addEvidence(S, {id:'supply-veg', kind:'supply', site:'F3', strength: s.type==='FARM' ? 'strong' : 'none',
      text:`ห่วงโซ่อุปทาน: ที่รับผักสดจากสวนผักลุงทอง ได้แก่ ${vegShare.join(', ') || '—'}`});
    return lines;
  };
  /* แหล่งผลิตที่ส่งวัตถุดิบให้สถานที่นั้น (ใช้ตัดสินว่าหลักฐานของร้านเชื่อมกับโรงน้ำแข็ง/สวนผักได้) */
  M.feeds = (W, supplier, site) => supplier==='F3' ? W.scn.vegSupplier[site]==='F3' : (supplier==='F1'||supplier==='F2') ? W.scn.iceSupplier[site]===supplier : false;

  /* ---------- ผลลัพธ์ปลายทาง ---------- */
  M.totalCases = function(W,S){ return W.people.filter(p=>p.inf!==null && p.onset<=M.HORIZON && M.effective(W,S,p)).length; };
  M.outcome = function(W,S){
    const actual = M.totalCases(W,S);
    const none = M.totalCases(W, {closed:{}, hygieneAt:null, flags:{}, ver:-1});
    const bestS = {closed:{[W.scn.culprit]:M.T0}, hygieneAt:M.T0, flags:{festival:'safe'}, ver:-2};
    const best = M.totalCases(W, bestS);
    return {actual, none, best, prevented:none-actual, maxPrev:Math.max(0,none-best)};
  };
})(OD.sim);
