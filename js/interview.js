/* =========================================================
   interview — สัมภาษณ์เชิงลึกผู้ป่วยรายสำคัญ (มินิเกม)
   ๑) ขอความยินยอม หรือไม่ (มีผลต่อจำนวนคำถามและความร่วมมือ)
   ๒) เลือกคำถาม ๓ ข้อ: ปลายเปิด · ไทม์ไลน์ · อาการ · คนในบ้าน · น้ำดื่ม · คำถามชี้นำ
   ๓) ได้ "บันทึกสัมภาษณ์" เป็นหลักฐาน — คำถามชี้นำให้คำตอบที่เอนเอียง (หลักฐานชี้ผิดทาง)
   ========================================================= */
OD.interview = (function(){
  const U = OD.u, M = OD.sim;
  const nm = id => M.SITES[id].name;
  const NAME = {F:['สมใจ','บุญเรือน','มาลี','สุดา','ประไพ','ลำดวน','วันเพ็ญ','จันทร์แรม'], M:['สมชาย','บุญมี','ประเสริฐ','สมศักดิ์','ทองดี','วิชัย','สุรชัย','เฉลิม'],
                K:['ต้นข้าว','มะปราง','ภูมิ','ใบเตย','ข้าวหอม','ปลื้ม','ตะวัน','น้ำใส']};
  const FOOD = {R1:'ส้มตำปูดอง', R2:'ก๋วยเตี๋ยวเรือ', R3:'ข้าวมันไก่', R4:'หมูกระทะ'};
  const code = p => p.ini || ('P'+String(p.id).padStart(3,'0'));
  const MAX = 2;

  /* เลือกผู้ป่วย: ครั้งแรก = ผู้ป่วยรายแรก (index case) · ครั้งที่สอง = ผู้ป่วยที่นอนโรงพยาบาลล่าสุด */
  function candidate(W,S){
    const R = M.records(W,S).filter(r=>!r.dup && !r.phantom && !S.deep.includes(r.p.id)).map(r=>r.p);
    if(!R.length) return null;
    if(!S.deep.length) return R.slice().sort((a,b)=>a.onset-b.onset)[0];
    const adm = R.filter(p=>p.admit).sort((a,b)=>b.onset-a.onset);
    return adm[0] || R[Math.floor(Math.random()*R.length)];
  }
  const available = (W,S) => S.deep.length < MAX && !!candidate(W,S);

  /* ---------- คำตอบจากข้อมูลจริงของผู้ป่วย ---------- */
  function exposures(W,S,p){
    const it = [], via = p.cause==='src' || p.cause==='fest' ? p.via : null;
    const water = p.water==='BOT' ? 'ดื่มน้ำขวด' : `ดื่มน้ำ${nm(p.water)}${p.boil?' (ต้มก่อนดื่ม)':' ไม่ได้ต้ม'}`;
    const add = (key, t) => it.push({key, t});
    if(p.cause==='fest') add('FEST', `ไป${M.FEST.name} กินที่${M.FEST.place}หลายอย่าง`);
    for(const r of ['R1','R2','R3','R4']) if(p.exp[r]) add(r, `กิน${FOOD[r]}ที่${nm(r)}${p.iceLover?' สั่งชาเย็นใส่น้ำแข็งด้วย':''}${p.exp.VEG?' กินผักสดแกล้มเยอะ':''}`);
    if(p.exp.S) add('S', p.age<=15 ? 'กินข้าวกลางวันที่โรงเรียนทุกวัน ดื่มน้ำจากตู้กดของโรงเรียน' : 'กินข้าวที่โรงอาหารโรงเรียน');
    if(p.exp.E) add('E', `ไปงานบวชที่วัด กิน${['E_kj','E_lb','E_ds'].filter(d=>p.exp[d]).map(d=>M.DISH[d]).join(' ')||'อาหารในงาน'}`);
    add(p.water, water);
    // ผู้ป่วยมักจำมื้อที่สงสัยได้ดีที่สุด — เรียงสิ่งที่เกี่ยวกับต้นตอขึ้นก่อน
    const first = p.cause==='fest' ? it.find(x=>x.key==='FEST') : via && it.find(x=>x.key===via || (via==='E' && x.key==='E'));
    const out = (first?[first]:[]).concat(U.shuffle(it.filter(x=>x!==first)));
    if(out.length>2 && Math.random() < M.recallRate(S)*2) out.splice(1 + Math.floor(Math.random()*(out.length-1)), 1);   // ลืมไปบางอย่าง
    return out.slice(0,4).map(x=>x.t);
  }
  function household(W,S,p){
    const hh = W.households[p.hh-1].members.map(id=>W.byId(id)).filter(q=>q!==p && q.inf!==null && M.effective(W,S,q) && Math.abs(q.onset-p.onset) < 7*24);
    const before = hh.filter(q=>q.onset<p.onset), after = hh.filter(q=>q.onset>p.onset);
    const who = q => q.age<15 ? 'ลูก' : q.age>60 ? (q.sex==='หญิง'?'ยาย':'ตา') : (q.sex==='หญิง'?'แม่บ้าน':'พ่อบ้าน');
    if(before.length) return `${before.map(who).join(' ')}ในบ้านป่วยก่อนประมาณ ${Math.max(1, Math.round((p.onset-before[0].onset)/24))} วัน${after.length?` แล้ว${after.map(who).join(' ')}ก็ป่วยตามมา`:''}`;
    if(after.length) return `ไม่มีใครป่วยก่อน แต่หลังจากนั้น${after.map(who).join(' ')}ในบ้านก็ป่วยตาม`;
    return 'ในบ้านไม่มีใครป่วยเลย';
  }
  function symptoms(p){
    const s = M.SYMPTOMS.filter(([k])=>p.sym[k]).map(([,t])=>t);
    return `${s.join(' ')}${p.sym.watery?' ถ่ายเป็นน้ำวันละเกือบสิบครั้ง':''}${p.sym.fever?' ไข้สูงหนาวสั่น':' ไม่มีไข้'}${p.admit?' จนต้องนอนโรงพยาบาลให้น้ำเกลือ':''}`;
  }
  function timeline(W,p){
    const on = `เริ่มป่วย${M.fmtT(Math.floor(p.onset))}`;
    if(p.cause==='src' || p.cause==='fest'){
      const h = Math.round(p.onset - p.inf), drink = p.cause!=='fest' && p.via===p.water;
      const src = p.cause==='fest' ? `อาหารที่${M.FEST.place}${M.FEST.short}` : drink ? `น้ำ${nm(p.water)}` : p.via==='E' ? 'อาหารในงานบวช'
        : p.via==='S' ? 'อาหารกลางวันที่โรงเรียน' : M.SITES[p.via] ? `อาหารจาก${nm(p.via)}` : 'มื้อที่สงสัย';
      return {say:`${on} — ก่อนหน้านั้นประมาณ ${U.thaiNum(h)} ชั่วโมง ${drink?'ดื่ม':'กิน'}${src}`, note:`ระยะจาก${src}ถึงเริ่มป่วย ~${h} ชม.`};
    }
    if(p.cause==='sec'){ const q = W.byId(p.index); return {say:`${on} — ไม่ได้กินอะไรแปลก ๆ เลย แต่ดูแลคนในบ้านที่ป่วยก่อนหน้า ${U.thaiNum(Math.max(1, Math.round((p.onset-q.onset)/24)))} วัน`, note:'ป่วยหลังดูแลคนในบ้านที่ป่วยก่อน (อาจแพร่คนสู่คน)'}; }
    return {say:`${on} — จำไม่ได้ว่ากินอะไรผิดสำแดง ท้องเสียแบบนี้เป็น ๆ หาย ๆ`, note:'ไม่มีมื้อที่สงสัยชัดเจน'};
  }

  /* ---------- มินิเกม ---------- */
  async function run(W,S){
    const p = candidate(W,S); if(!p) return null;
    S.deep.push(p.id);
    const kid = p.age<=15, fem = kid ? true : p.sex==='หญิง';
    const c = fem ? 'patientF' : 'patientM', pre = kid ? 'แม่ของน้อง' : p.age>=50 ? (fem?'ป้า':'ลุง') : (fem?'พี่':'พี่');
    const first = NAME[kid?'K':fem?'F':'M'][p.id % 8];
    const who = kid ? `แม่ของน้อง${first}` : `${pre}${first}`;
    Object.assign(OD.CHARS[c], {name: who, title: kid ? `ผู้ปกครองของผู้ป่วย ${code(p)} (${p.age} ปี)` : `ผู้ป่วย ${code(p)} · ${p.age} ปี`});
    const me = kid ? `น้อง${first}` : (p.age>=50 ? (fem?'ป้า':'ลุง') : 'พี่');
    let consent = null;
    await OD.vn.play([
      {bg:'village'},
      {narr:`บ้านผู้ป่วย ${code(p)} หมู่ ${U.thaiNum(p.v)} — ${kid?`${who}นั่งเฝ้าลูกที่นอนซมอยู่`:`${who}นอนพักอยู่ ข้างตัวมีซองผงเกลือแร่`}`},
      {say:'boonma', pos:'left', expr:'neutral', text:`${who}จ๊ะ นี่น้อง{name} ทีมสอบสวนโรคจากอำเภอ อยากขอคุยด้วยหน่อย`},
      {say:c, pos:'right', expr:'worried', text: kid ? 'มีอะไรหรือคะ ลูกยังไม่ค่อยดีขึ้นเลย…' : 'อือ… มีอะไรหรือ ยังเพลีย ๆ อยู่เลย'},
      {choice:[
        {text:`“สวัสดี{p} ขออนุญาตแนะนำตัว เรามาหาสาเหตุที่คนในตำบลป่วย ข้อมูลจะเก็บเป็นความลับ ขอความยินยอมคุยสัก ๑๐ นาทีได้ไหม{p}”`, hint:'ขอความยินยอมตามหลักจริยธรรม', do:()=>{ consent = true;
          OD.story.decide(S,{id:'consent', title:'สัมภาษณ์เชิงลึก: ขอความยินยอม', choice:'แนะนำตัวและขอความยินยอมก่อน', verdict:'good', why:'เคารพสิทธิ์ผู้ให้ข้อมูล ผู้ป่วยจึงเต็มใจตอบและตอบละเอียด'}); }},
        {text:'“ขอถามเลยนะ{p} รีบมาก”', hint:'ประหยัดเวลา', do:()=>{ consent = false;
          OD.story.decide(S,{id:'consent', title:'สัมภาษณ์เชิงลึก: ขอความยินยอม', choice:'ข้ามการขอความยินยอม', verdict:'bad', why:'ไม่แนะนำตัวและไม่ขอความยินยอม — ผิดหลักจริยธรรม ผู้ป่วยระแวงจึงตอบสั้นและได้ข้อมูลน้อย'}); }},
      ]},
      {if:()=>consent, then:[{say:c, expr:'smile', text:'ได้จ้ะ ถามมาเถอะ อยากรู้เหมือนกันว่าเป็นเพราะอะไร'}],
        else:[{say:c, expr:'serious', text:'…จะถามอะไรล่ะ เหนื่อยจะแย่อยู่แล้ว ถามสั้น ๆ นะ ตอบได้สองข้อพอ'}]},
    ], {keep:true});
    if(consent) S.flags.deepConsent = true;

    const notes = [], tl = timeline(W,p), rumor = nm(S.flags.rumor);
    const Q = [
      {q:'“ช่วงสามวันก่อนป่วย กินหรือดื่มอะไรนอกบ้านบ้าง เล่าให้ฟังหน่อย”', hint:'คำถามปลายเปิด', run:()=>{ const ex = exposures(W,S,p); notes.push('เล่าว่า ' + ex.join(' · '));
        return [{say:c, expr:'neutral', text: ex.length ? `ขอนึกก่อนนะ… ${ex.join(' แล้วก็')}` : 'นึกไม่ออกเลย กินแต่ที่บ้าน'}]; }},
      {q:'“เริ่มป่วยตอนไหน ก่อนหน้านั้นกินอะไรครั้งสุดท้ายที่น่าสงสัย”', hint:'ไทม์ไลน์ → ระยะฟักตัว', run:()=>{ notes.push(tl.note); return [{say:c, expr:'neutral', text:tl.say}]; }},
      {q:'“อาการเป็นอย่างไรบ้าง ถ่ายกี่ครั้ง มีไข้ อาเจียนไหม”', hint:'อาการเด่น → อนุมานเชื้อ', run:()=>{ const t = symptoms(p); notes.push('อาการ: ' + t); return [{say:c, expr:'worried', text:t}]; }},
      {q:'“ในบ้านมีใครป่วยก่อนหรือหลังบ้างไหม”', hint:'การแพร่คนสู่คน', run:()=>{ const t = household(W,S,p); notes.push(t); return [{say:c, expr:'neutral', text:t}]; }},
      {q:'“ที่บ้านดื่มน้ำอะไร ต้มก่อนไหม น้ำแข็งซื้อจากไหน”', hint:'แหล่งน้ำ', run:()=>{ const t = p.water==='BOT' ? 'ซื้อน้ำถังมากิน น้ำแข็งซื้อจากร้านในตลาด' : `ตักน้ำ${nm(p.water)}มากิน${p.boil?' ต้มทุกครั้ง':' ไม่ได้ต้มหรอก น้ำใสดี'} น้ำแข็งซื้อจากร้านในตลาด`;
        notes.push(t); return [{say:c, expr:'neutral', text:t}]; }},
      {q:`“${me}กินที่${rumor}มาใช่ไหม ใคร ๆ ก็ว่าที่นั่นแหละ”`, hint:'ถามตรงประเด็น ประหยัดเวลา', lead:true, run:()=>{ S.flags.leading = true;
        M.addEvidence(S,{id:'deep-lead-'+p.id, kind:'interview', truth:false, strength:'weak', site:S.flags.rumor, text:`สัมภาษณ์ ${code(p)}: ตอบว่า “น่าจะใช่” เมื่อถูกถามว่ากินที่${rumor}หรือไม่ (คำถามชี้นำ)`});
        OD.story.decide(S,{id:'lead', title:'สัมภาษณ์เชิงลึก: ใช้คำถามชี้นำ', choice:`ถามว่ากินที่${rumor}ใช่ไหม`, verdict:'mixed', why:'คำถามชี้นำทำให้ผู้ตอบคล้อยตาม ได้คำตอบที่เอนเอียง — ควรใช้คำถามปลายเปิด'});
        return [{say:c, expr:'neutral', text:`เอ่อ… ก็คงใช่มั้ง ใคร ๆ เขาก็ว่า${rumor}กัน`}, {say:'boonma', expr:'worried', text:'…น้อง{name} ถามแบบนี้เขาก็ตอบตามที่เราถามน่ะสิจ๊ะ'}]; }},
    ];
    const qMax = consent ? 3 : 2;
    for(let i=0;i<qMax;i++){
      let pick = null;
      await OD.vn.play([{prompt:`🎙️ เลือกคำถามข้อที่ ${U.thaiNum(i+1)} จาก ${U.thaiNum(qMax)}`, choice:Q.filter(q=>!q.used).map(q=>({text:q.q, hint:q.hint, do:()=>{ pick = q; }}))}], {keep:true, stay:true});
      pick.used = true;
      await OD.vn.play(pick.run(), {keep:true, stay:true});
    }
    await OD.vn.play([
      {say:c, expr: consent?'smile':'neutral', text: consent ? 'หวังว่าจะช่วยได้นะ ขอให้หาสาเหตุเจอเร็ว ๆ' : 'พอแล้วใช่ไหม จะนอนพักแล้ว'},
      {me:'ขอบคุณมาก{p} ขอให้หายเร็ว ๆ นะ{p}', expr:'smile'},
    ], {stay:true});
    if(notes.length) M.addEvidence(S,{id:'deep-'+p.id, kind:'interview', truth:true, strength:'weak', text:`สัมภาษณ์เชิงลึก ${code(p)} (${p.sex} ${p.age} ปี): ${notes.join(' · ')}`});
    return {p, notes, consent};
  }
  return {run, available, MAX};
})();
