/* =========================================================
   ai-tools — เครื่องมือ AI ในภาคสนาม
   📱 ฟังเสียงโซเชียล: ติดป้ายข้อมูล → ฝึก Naive Bayes → ดึงชื่อสถานที่จากโพสต์ (NLP / event-based surveillance)
   🤖 ผู้ช่วย AI ของจังหวัด: มั่นใจเกินจริง บางครั้งแต่งข้อมูล — ฝึกใช้ AI อย่างรับผิดชอบ (model card · XAI · ตรวจสอบก่อนเชื่อ)
   🔮 พยากรณ์ผู้ป่วยในรายงานเช้า (naive · ค่าเฉลี่ยเคลื่อนที่ · แนวโน้มเอ็กซ์โพเนนเชียล)
   ========================================================= */
OD.ai = (function(){
  const U = OD.u, M = OD.sim, ML = OD.ml;
  const nm = id => M.SITES[id].name;
  const D = (S, d) => OD.story.decide(S, d);

  /* เจ้าหน้าที่ไอทีของ สสจ. ผู้นำระบบ AI มาทดลอง */
  OD.CHARS.itofficer = {name:'พี่ต้น', full:'นายต้นกล้า ศรีสุข', title:'นักวิชาการคอมพิวเตอร์ สสจ.', color:'#3b5ba8',
    skin:'#d9a57c', hair:'#1a1410', face:'man', fem:false, hairS:'neat', outfit:'tee', shirt:'#3b5ba8', acc:['glasses']};

  /* ---------- 📱 ฟังเสียงโซเชียล (NLP) ---------- */
  const ALIAS = {W1:['บ่อวัด','บ่อน้ำวัด'], W2:['บ่อตลาด','บ่อน้ำตลาด'], W3:['บ่อริมคลอง','บ่อน้ำริมคลอง'],
    R1:['ส้มตำป้าแดง','ร้านป้าแดง'], R2:['ก๋วยเตี๋ยวเรือลุงชัย','ร้านลุงชัย'], R3:['ข้าวมันไก่เจ๊หมวย','ร้านเจ๊หมวย'], R4:['หมูกระทะริมทุ่ง','ร้านหมูกระทะ'],
    S:['โรงเรียน'], E:['งานบวช'], ICE:['น้ำแข็ง'], VEG:['ผักสด'], SEA:['ปูดอง']};
  const ENT = Object.keys(ALIAS);
  const ENT_NAME = k => ({ICE:'🧊 น้ำแข็ง', VEG:'🥬 ผักสด', SEA:'🦀 ปูดอง/อาหารทะเลดิบ'})[k] || `${M.SITES[k].icon} ${nm(k)}`;
  const entities = text => ENT.filter(k=>ALIAS[k].some(a=>text.includes(a)));
  const DO = {W1:'ดื่มน้ำบ่อวัด', W2:'ดื่มน้ำบ่อตลาด', W3:'ใช้น้ำบ่อริมคลองหุงข้าวกับดื่ม', R1:'กินส้มตำป้าแดง', R2:'กินก๋วยเตี๋ยวเรือลุงชัย',
    R3:'กินข้าวมันไก่เจ๊หมวย', R4:'ไปกินหมูกระทะริมทุ่ง', S:'กินข้าวกลางวันที่โรงอาหารโรงเรียน', E:'ไปงานบวชที่วัด'};
  const VENUE = {R1:'ร้านป้าแดง', R2:'ร้านลุงชัย', R3:'ร้านเจ๊หมวย', R4:'ร้านหมูกระทะ', S:'โรงอาหารโรงเรียน'};
  /* สิ่งที่ผู้ป่วยรายนั้นน่าจะพูดถึง: ๖๕% เป็นช่องทางที่ติดจริง อีก ๓๕% เป็นสิ่งอื่นที่เขาเคยสัมผัส (สัญญาณรบกวนตามธรรมชาติ) */
  function actOf(W, p, r){
    const s = W.scn, other = () => { const ks = ['W1','W2','W3','R1','R2','R3','R4','S','E'].filter(k=>p.exp[k]); return ks.length ? DO[ks[Math.floor(r()*ks.length)]] : 'กินข้าวนอกบ้าน'; };
    if(p.cause==='sec') return r()<.5 ? 'คนในบ้านป่วยท้องเสียก่อนหน้านี้' : other();
    if(p.cause!=='src' && p.cause!=='fest') return other();
    if(r()>=.65) return other();
    switch(s.type){
      case 'WELL': return DO[s.culprit];
      case 'REST': return DO[s.culprit] + (s.key==='SEA' ? ' สั่งปูดองมาด้วย' : s.key==='VEG' ? ' ใส่ผักสดเยอะ ๆ' : '');
      case 'ICE': return `กินชาเย็นใส่น้ำแข็งที่${VENUE[p.via]||'ร้านในตลาด'}`;
      case 'FARM': return `กินผักสดแกล้มที่${VENUE[p.via]||'ร้านในตำบล'}`;
      case 'SCHOOL': return {handler:'กินข้าวกลางวันที่โรงอาหารโรงเรียน', food:'กินไก่ทอดของโรงอาหารโรงเรียน', tank:'ดื่มน้ำตู้กดที่โรงเรียน'}[s.sub];
      case 'EVENT': return `ไปงานบวชที่วัด กิน${M.DISH[s.dish]}`;
    }
    return other();
  }
  const SIG = [
    (rel,sym,act)=>`${rel}${sym}ทั้งคืนเลย 😢 เมื่อวาน${act}มา ใครป่วยแบบนี้บ้าง`,
    (rel,sym,act)=>`ป่วยกันทั้งบ้าน ${sym} ต้องพาไปหาหมอที่ รพ.สต. ล่าสุด${act}`,
    (rel,sym,act)=>`ตอนนี้${rel}นอนให้น้ำเกลืออยู่โรงพยาบาล ${sym}หนักมาก ช่วงนี้${act}ทุกวัน`,
    (rel,sym,act)=>`${rel}เริ่ม${sym}ตั้งแต่เมื่อวาน หมอให้กินเกลือแร่เยอะ ๆ ก่อนป่วย${act}`,
    (rel,sym,act)=>`ใครป่วยเหมือนกันบ้างคะ ${rel}${sym} ไปหาหมอมาแล้ว เมื่อวันก่อน${act}`,
    (rel,sym,act)=>`มีอาการ${sym}มาสองวันแล้ว ป่วยจนต้องลางาน ปกติ${act}เป็นประจำ`,
  ];
  const RUM = [
    r=>`แชร์ด่วน!! ได้ยินมาว่า${r}มีเชื้ออหิวาต์ ห้ามไปเด็ดขาด 🚫`,
    r=>`เขาว่ากันว่า${r}เป็นต้นเหตุ คนป่วยเป็นร้อยแล้ว ทางการปิดข่าว!!`,
    r=>`ข่าววงในบอกว่า${r}โดนวางยา จริงไหมคะ แชร์ต่อกันด้วย`,
    ()=>'ได้ยินมาว่าอหิวาต์ระบาดทั้งตำบลแล้ว หมอไม่ยอมบอก ข่าวนี้ต้องแชร์ให้รู้กันเยอะ ๆ',
    ()=>'น้ำสมุนไพรหยุดถ่าย ๓ วันหายขาด ไม่ต้องกินเกลือแร่ ข่าวดีต้องแชร์!! 🌿',
    r=>`ลือกันทั้งหมู่บ้านว่า${r}ไม่สะอาด ข่าวนี้จริงไหม แชร์เตือนกันหน่อย`,
  ];
  const NOI = [
    x=>`${x.resto}วันนี้ลดราคา ๒๐% ใครว่างแวะมาอุดหนุนกันได้จ้า 🎉`,
    x=>`ขอเชิญร่วมทำบุญ${x.fest}วันเสาร์นี้ ที่วัดบ้านสุขใจ อนุโมทนาบุญ 🙏`,
    x=>`รีวิว${x.resto} อร่อยมาก น้ำจิ้มเด็ด บรรยากาศดี ราคาไม่แพง`,
    ()=>'ขายเสื้อผ้ามือสอง ราคาถูก สภาพดี สนใจทักแชทได้เลยจ้า',
    x=>`ประกาศหาแมวหาย สีส้ม ตัวอ้วน หายแถว${x.place} ใครเห็นช่วยบอกด้วยนะคะ`,
    x=>`ฝนตกทั้งวัน ถนนหน้า${x.place}น้ำท่วมขัง ขับรถระวังด้วยนะ`,
  ];
  const SRC = ['📘 กลุ่ม “คนบ้านสุขใจ”', '💬 ไลน์กลุ่มหมู่บ้าน', '🎵 คอมเมนต์ TikTok', '📘 เพจ “ตลาดนัดบ้านสุขใจ”', '💬 ไลน์ครอบครัว', '📘 กลุ่มผู้ปกครองโรงเรียน'];
  const CLS = {sig:['🤒','อาการจริง / ประสบการณ์ตรง'], rum:['📢','ข่าวลือ / ข้อมูลผิด'], noi:['🛍️','ไม่เกี่ยวข้อง']};
  const CLASSES = ['sig','rum','noi'];

  function relOf(p){ return p.age<=15 ? (p.sex==='ชาย'?'ลูกชาย':'ลูกสาว') : p.age>=60 ? (p.sex==='ชาย'?'ตา':'ยาย') : (p.sex==='ชาย'?'พ่อบ้าน':'แม่'); }
  function symOf(p){ const s = []; if(p.sym.watery) s.push('ถ่ายเป็นน้ำ'); else if(p.sym.diar) s.push('ท้องเสีย'); if(p.sym.vomit) s.push('อาเจียน'); if(p.sym.fever) s.push('มีไข้'); if(p.sym.cramp && s.length<2) s.push('ปวดท้อง'); return s.slice(0,2).join('กับ') || 'ท้องเสีย'; }

  function makePosts(W,S){
    const r = ML.rng((W.seed ^ (M.dayOf(S.T)*2654435761))>>>0);
    const sick = ML.shuffle(W.people.filter(p=>p.inf!==null && p.onset<=S.T && p.cause!=='bg' && M.effective(W,S,p)), r);
    const sigP = sick.slice(0,8);
    while(sigP.length<8) sigP.push(W.people.find(p=>p.inf!==null) || W.people[0]);
    const rumorSites = [S.flags.rumor, S.flags.rumor, S.flags.rumor0 || S.flags.rumor].filter(Boolean);
    const fest = (M.FEST && M.FEST.name) || 'งานทอดกฐินที่วัด';
    const restos = ['R1','R2','R3','R4'], places = ['W1','W2','W3','R1','R2','R3','R4','S'];
    const pick = a => a[Math.floor(r()*a.length)];
    const st = ML.shuffle(SIG.map((_,i)=>i), r), rt = ML.shuffle(RUM.map((_,i)=>i), r), nt = ML.shuffle(NOI.map((_,i)=>i), r);
    const sig = sigP.map((p,i)=>({t:SIG[st[i%st.length]](relOf(p), symOf(p), actOf(W,p,r)), c:'sig'}));
    const rum = Array.from({length:5}, (_,i)=>({t:RUM[rt[i]](ALIAS[rumorSites[i%rumorSites.length]] ? pick(ALIAS[rumorSites[i%rumorSites.length]]) : 'ตลาด'), c:'rum'}));
    const noi = Array.from({length:5}, (_,i)=>({t:NOI[nt[i]]({resto:ALIAS[pick(restos)][0], fest, place:pick(ALIAS[pick(places)])}), c:'noi'}));
    // ชุดฝึก ๙ โพสต์ (กลุ่มละ ๓) · ชุดทดสอบ ๙ โพสต์ (อาการจริง ๕ · ข่าวลือ ๒ · ไม่เกี่ยว ๒)
    const train = ML.shuffle(sig.slice(0,3).concat(rum.slice(0,3), noi.slice(0,3)), r);
    const test = ML.shuffle(sig.slice(3,8).concat(rum.slice(3,5), noi.slice(3,5)), r);
    const decorate = (x,i) => Object.assign(x, {src:pick(SRC), ago:`${1+Math.floor(r()*20)} ชม.`, likes:Math.floor((x.c==='rum'?300:x.c==='noi'?20:15)*(1+r()*3)), shares:x.c==='rum'?Math.floor(80+r()*400):Math.floor(r()*12), id:i});
    train.forEach(decorate); test.forEach((x,i)=>decorate(x, i+100));
    return {train, test};
  }
  const related = W => (OD.report && OD.report.related) ? OD.report.related(W) : [W.scn.culprit];
  const isVenue = (W,id) => (W.scn.type==='ICE' && W.scn.iceVenues.includes(id)) || (W.scn.type==='FARM' && W.scn.vegVenues.includes(id));

  function socialListen(W,S){
    return new Promise(resolve=>{
      const P = makePosts(W,S), lab = {};
      let model = null, res = null;
      const post = (x, mode) => {
        const L = lab[x.id], pr = res && res.pred[x.id];
        let tail = '';
        if(mode==='train') tail = `<div class="pl">${CLASSES.map(c=>`<button class="plb ${L===c?'on':''}" data-m="l:${x.id}:${c}" ${res?'disabled':''}>${CLS[c][0]} ${CLS[c][1]}</button>`).join('')}</div>`
          + (res ? `<div class="pv ${L===x.c?'ok':'bad'}">${L===x.c?'✓ ติดป้ายถูก':`✗ ที่ถูกคือ ${CLS[x.c][0]} ${CLS[x.c][1]}`}</div>` : '');
        else if(pr) tail = `<div class="pv ${pr.c===x.c?'ok':'bad'}">🤖 โมเดลทาย: <b>${CLS[pr.c][0]} ${CLS[pr.c][1]}</b> (${Math.round(pr.p*100)}%) ${pr.c===x.c?'✓':`✗ ที่ถูกคือ ${CLS[x.c][1]}`}</div>`;
        return `<div class="post"><div class="ph"><span>${x.src}</span><span class="faint">${x.ago}ที่แล้ว</span></div><div class="pt">${U.esc(x.t)}</div><div class="pm faint">👍 ${x.likes} · ↗️ แชร์ ${x.shares}</div>${tail}</div>`;
      };
      function train(){
        const docs = P.train.map(x=>x.t), labels = P.train.map(x=>lab[x.id]);
        model = ML.nbTrain(docs, labels, CLASSES);
        const pred = {}; P.test.forEach(x=>{ pred[x.id] = model.predict(x.t); });
        const lblOK = P.train.filter(x=>lab[x.id]===x.c).length, testOK = P.test.filter(x=>pred[x.id].c===x.c).length;
        const conf = Object.fromEntries(CLASSES.map(a=>[a, Object.fromEntries(CLASSES.map(b=>[b, P.test.filter(x=>x.c===a && pred[x.id].c===b).length]))]));
        // ดึงชื่อสถานที่/อาหาร (entity extraction) — เทียบนับจากทุกโพสต์ กับนับเฉพาะโพสต์ที่เป็นอาการจริง
        // ปริมาณการพูดถึงแบบดิบนับยอดแชร์ด้วย (เหมือนเครื่องมือ social listening ทั่วไป) — ข่าวลือที่ถูกแชร์ซ้ำจึงดูดังกว่าความจริง
        const all = P.train.concat(P.test), isSig = x => (x.id<100 ? lab[x.id] : pred[x.id].c)==='sig';
        const count = (list, w) => { const c = {}; list.forEach(x=>entities(x.t).forEach(k=>{ c[k] = (c[k]||0) + w(x); })); return c; };
        const raw = count(all, x=>1+x.shares), sig = count(all.filter(isSig), ()=>1);
        const top = Object.keys(sig).sort((a,b)=>sig[b]-sig[a] || (raw[a]||0)-(raw[b]||0))[0] || null;
        const rawTop = Object.keys(raw).sort((a,b)=>raw[b]-raw[a])[0] || null;
        res = {pred, lblOK, testOK, conf, raw, sig, top, rawTop, nSig:all.filter(isSig).length};
        S.flags.nlpAcc = lblOK; S.flags.nlpTest = testOK;
      }
      function results(){
        const ents = [...new Set(Object.keys(res.raw).concat(Object.keys(res.sig)))].sort((a,b)=>(res.sig[b]||0)-(res.sig[a]||0) || (res.raw[b]||0)-(res.raw[a]||0)).slice(0,7);
        const mxR = Math.max(1, ...ents.map(k=>res.raw[k]||0)), mxS = Math.max(1, ...ents.map(k=>res.sig[k]||0));
        const words = CLASSES.map(c=>`<div><b>${CLS[c][0]} ${CLS[c][1]}</b><div class="kw">${model.topWords(c,6).map(w=>`<span class="chip">${U.esc(w.w)}</span>`).join(' ') || '<span class="faint">—</span>'}</div></div>`).join('');
        return `<div class="frame tight" style="margin-top:12px"><h3 style="margin:0 0 6px">ผลของโมเดล</h3>
          <div class="ml-kpis"><div><span>ป้ายข้อมูลฝึกที่ถูกต้อง</span><b class="${res.lblOK<7?'up':''}">${U.thaiNum(res.lblOK)}/๙</b></div>
            <div><span>โมเดลทายชุดทดสอบถูก</span><b>${U.thaiNum(res.testOK)}/๙</b></div>
            <div><span>โพสต์ที่เป็นอาการจริง</span><b>${U.thaiNum(res.nSig)}</b></div>
            <div><span>ตัวตัดคำ</span><b style="font-size:14px">${ML.hasSegmenter?'Intl.Segmenter (พจนานุกรม)':'ตัวอักษรคู่ (bigram)'}</b></div></div>
          <table class="doc conf"><thead><tr><th>จริง \\ ทาย</th>${CLASSES.map(c=>`<th>${CLS[c][0]}</th>`).join('')}</tr></thead><tbody>${CLASSES.map(a=>`<tr><td class="l">${CLS[a][0]} ${CLS[a][1]}</td>${CLASSES.map(b=>`<td class="${a===b?'hl2':''}">${res.conf[a][b]}</td>`).join('')}</tr>`).join('')}</tbody></table>
          <h4 style="margin:10px 0 4px">คำที่โมเดลเรียนรู้ว่าเป็นตัวแทนของแต่ละกลุ่ม</h4><div class="kws">${words}</div>
          <h4 style="margin:12px 0 4px">สถานที่/อาหารที่ถูกพูดถึง (entity extraction)</h4>
          <div class="ent">${ents.map(k=>`<div class="er"><span>${ENT_NAME(k)}</span><div class="eb"><i class="raw" style="width:${(res.raw[k]||0)/mxR*100}%"></i><i class="sg" style="width:${(res.sig[k]||0)/mxS*100}%"></i></div><span class="faint">${(res.raw[k]||0).toLocaleString('th-TH')} / <b style="color:var(--text)">${res.sig[k]||0}</b></span></div>`).join('') || '<div class="faint">ไม่พบชื่อสถานที่ในโพสต์</div>'}</div>
          <div class="legend"><span><i style="background:var(--faint)"></i>ปริมาณการพูดถึงทั้งหมด (รวมยอดแชร์)</span><span><i style="background:var(--red-2)"></i>จำนวนโพสต์ที่เล่าอาการจริง</span></div>
          <div class="mentor" style="margin-top:10px">${OD.mentorFace()}<div><div class="who">พี่วิ</div><div>${
            res.rawTop && res.top && res.rawTop!==res.top ? `ถ้าดูแค่ปริมาณการพูดถึง จะเห็น <b>${ENT_NAME(res.rawTop)}</b> ดังที่สุด เพราะข่าวลือถูกแชร์ซ้ำเป็นร้อยครั้ง แต่พอกรองเหลือเฉพาะโพสต์ที่เล่าอาการจริง กลับชี้ไปที่ <b>${ENT_NAME(res.top)}</b> — กระแสบนโซเชียลไม่ใช่ข้อมูลทางระบาดวิทยา ต้องจำแนกข้อความก่อนนับ`
            : res.top ? `โพสต์ที่เล่าอาการจริงพูดถึง <b>${ENT_NAME(res.top)}</b> บ่อยที่สุด — ใช้เป็นเบาะแสตั้งสมมติฐานได้ แต่คำบอกเล่าบนโซเชียลยังเป็นหลักฐานอ่อน ต้องทดสอบด้วย case-control`
            : 'โพสต์ที่เล่าอาการจริงยังไม่ได้พูดถึงสถานที่ชัดเจน — ข้อมูลโซเชียลมีสัญญาณรบกวนสูง'}
            ${res.lblOK<7 ? '<br>⚠️ ป้ายข้อมูลฝึกผิดหลายโพสต์ โมเดลจึงเรียนรู้ผิดตามไปด้วย — <b>garbage in, garbage out</b>' : ''}</div></div></div>`;
      }
      let first = true;
      function draw(){
        const n = Object.keys(lab).length, cls = 'nlp-modal' + (first ? '' : ' redraw'); first = false;
        U.modal(`<h2 class="display gold-text">📱 ฟังเสียงโซเชียลด้วย NLP</h2>
          <p style="margin-top:0">ดึงโพสต์สาธารณะที่พูดถึงอาการท้องร่วงในตำบลมา ๑๘ โพสต์ — ข่าวลือมักถูกแชร์มากกว่าประสบการณ์จริงหลายเท่า เราจะสอนโมเดลให้แยกโพสต์ก่อนนำไปนับ</p>
          <h3 style="font-size:16px">๑. ติดป้ายข้อมูลฝึก (labeling) <span class="faint" style="font-weight:400">— ${U.thaiNum(n)}/๙ โพสต์</span></h3>
          <div class="posts">${P.train.map(x=>post(x,'train')).join('')}</div>
          <div class="m-actions" style="justify-content:flex-start"><button class="btn btn-gold" data-m="train" ${n<9||res?'disabled':''}>🧠 ฝึกโมเดล Naive Bayes แล้วทายชุดทดสอบ</button></div>
          ${res ? `<h3 style="font-size:16px;margin-top:14px">๒. โมเดลทายโพสต์ที่ไม่เคยเห็น (ชุดทดสอบ)</h3><div class="posts">${P.test.map(x=>post(x,'test')).join('')}</div>${results()}` : ''}
          <div class="m-actions">${res ? `<button class="btn btn-gold" data-m="done">${res.top?'📌 บันทึกเป็นหลักฐานแล้วกลับภาคสนาม':'กลับภาคสนาม'}</button>` : `<span class="faint" style="margin-right:auto;font-size:13px">ติดป้ายครบ ๙ โพสต์ก่อนฝึกโมเดล</span>`}</div>`,
          k=>{
            if(k.startsWith('l:')){ const [, id, c] = k.split(':'); lab[+id] = c; const y = U.$('#modal .m-card').scrollTop; draw(); U.$('#modal .m-card').scrollTop = y; return; }
            if(k==='train'){ train(); OD.sfx && OD.sfx('ding'); const y = U.$('#modal .m-card').scrollTop; draw(); U.$('#modal .m-card').scrollTop = y; return; }
            if(k==='done'){
              U.closeModal();
              const acc = res.lblOK;
              D(S, {id:'nlp', title:'ติดป้ายข้อมูลฝึกโมเดล NLP', choice:`ติดป้ายถูก ${acc}/9 โพสต์`, verdict: acc>=8 ? 'good' : acc>=6 ? 'ok' : 'mixed',
                why: acc>=8 ? 'ข้อมูลฝึกมีคุณภาพ โมเดลจึงแยกโพสต์ได้ดี' : 'ป้ายข้อมูลที่ผิดสอนให้โมเดลเรียนรู้ผิด — คุณภาพของ label สำคัญพอ ๆ กับอัลกอริทึม'});
              if(res.top){
                const t = res.top, truth = related(W).includes(t) || t===W.scn.culprit || isVenue(W,t);
                M.addEvidence(S, {id:'nlp', kind:'nlp', truth, strength:'weak', site: M.SITES[t] ? t : null,
                  text:`วิเคราะห์โพสต์โซเชียลด้วย NLP: โพสต์ที่เล่าอาการจริง ${res.nSig} โพสต์ พูดถึง${ENT_NAME(t).replace(/^\S+\s/,'')}มากที่สุด (${res.sig[t]} ครั้ง)`});
              }
              S.flags.nlpDone = true;
              resolve();
            }
          }, {wide:true, locked:true, cls});
      }
      draw();
    });
  }

  /* ---------- 🤖 ผู้ช่วย AI ของจังหวัด ---------- */
  /* AI แบบง่ายเกินไป: ดูแค่ "สัดส่วนผู้ป่วยที่สัมผัส" ไม่มีกลุ่มควบคุม — ถ้ายังไม่มีแบบสอบถาม ใช้กระแสโซเชียลแทน */
  const AI_CAND = ['W1','W2','W3','R1','R2','R3','R4','S','E'];
  function aiPick(W,S){
    const cs = M.records(W,S).filter(r=>S.ans[r.p.id]);
    if(cs.length>=3){
      const sc = AI_CAND.map(k=>({k, v:cs.filter(r=>S.ans[r.p.id][k]).length/cs.length})).sort((a,b)=>b.v-a.v);
      return {k:sc[0].k, conf:Math.min(99, Math.round(84+14*sc[0].v)), basis:'prop', sc, n:cs.length};
    }
    return {k:S.flags.rumor || 'R1', conf:91, basis:'social', sc:[], n:0};
  }
  const verb = k => k==='E' ? `ประกาศว่าต้นเหตุคือ${nm(k)}` : `สั่งปิด/งดใช้${nm(k)}`;
  function aiEventScript(W,S){
    const a = aiPick(W,S), right = a.k===W.scn.culprit;
    S.flags.aiFirst = a.k;
    const card = `<b>🤖 HDS-Assist v2.1</b> — ต้นตอที่น่าจะเป็นที่สุดคือ <b>${M.SITES[a.k].icon} ${nm(a.k)}</b> · ความมั่นใจ <b>${a.conf}%</b> · แนะนำ: ${verb(a.k)}ทันที`;
    return [
      {bg:'office'},
      {narr:'ช่วงพักเที่ยงที่ รพ.สต. — เจ้าหน้าที่ไอทีจาก สสจ. เปิดโน้ตบุ๊กวางบนโต๊ะ หน้าจอเต็มไปด้วยกราฟสีสดใส'},
      {say:'itofficer', expr:'smile', pos:'right', text:'สวัสดีครับ จังหวัดเพิ่งได้ระบบ **AI ทำนายต้นตอการระบาด** มาทดลองใช้ ใส่ข้อมูลผู้ป่วยปุ๊บ ได้คำตอบปั๊บ ไม่ต้องเก็บกลุ่มควบคุมให้เสียเวลาเลย'},
      {say:'itofficer', expr:'neutral', text: a.basis==='prop' ? `ผมใส่แบบสอบถามผู้ป่วย ${a.n} รายที่ทีมเก็บไว้ลงไปแล้ว ผลออกมาแบบนี้ครับ` : 'ยังไม่มีแบบสอบถาม ผมเลยให้มันอ่านกระแสโพสต์ในโซเชียลแทน ผลออกมาแบบนี้ครับ'},
      {narr:`🤖 HDS-Assist: ต้นตอที่น่าจะเป็นที่สุดคือ **${nm(a.k)}** · ความมั่นใจ **${a.conf}%** · แนะนำให้${verb(a.k)}ทันที`},
      {say:'doctor', expr:'serious', pos:'left', text:'ความมั่นใจเก้าสิบกว่าเปอร์เซ็นต์… ฟังดูน่าเชื่อนะ {name} จะใช้ผลนี้อย่างไร'},
      {prompt:card, choice:[
        {text:`“เชื่อ AI เลย{p} ${verb(a.k)}ทันที”`, hint:'เร็วที่สุด', do:()=>{
          if(a.k!=='E') OD.field.closeSite(a.k, 'ตามคำแนะนำของระบบ AI'); else { S.trust -= 5; S.flags.aiBlame = 'E'; }
          S.flags.aiUse = 'blind';
          D(S,{id:'aiTool', title:'ระบบ AI ทำนายต้นตอ', choice:`เชื่อ AI และ${verb(a.k)}`, verdict: right ? 'mixed' : 'bad', why: right
            ? 'บังเอิญถูก แต่ตัดสินใจโดยไม่รู้ว่า AI คิดอย่างไร (automation bias) — ครั้งหน้าถ้า AI ผิด เราจะไม่รู้ตัว'
            : `AI ดูแค่สัดส่วนผู้ป่วยที่สัมผัส โดยไม่เทียบกับคนไม่ป่วย — ${nm(a.k)}ไม่ใช่ต้นตอ การเชื่อโดยไม่ตรวจสอบ (automation bias) ทำให้ลงมือผิดที่`}); }},
        {text:'“ขอดู model card ก่อน{p} — AI เรียนรู้จากข้อมูลอะไร ดูจากอะไร มีข้อจำกัดอะไร”', hint:'ตรวจสอบก่อนเชื่อ', do:()=>{ S.flags.aiUse = 'card'; }},
        {text:'“ไม่ต้องใช้{p} AI พวกนี้เชื่อไม่ได้”', hint:'ไม่เสียเวลา', do:()=>{ S.flags.aiUse = 'ignore';
          D(S,{id:'aiTool', title:'ระบบ AI ทำนายต้นตอ', choice:'ปฏิเสธการใช้ AI ทั้งหมด', verdict:'ok', why:'ไม่ผิด แต่ AI ช่วยงานบางอย่างได้จริง เช่น ร่างข้อความสื่อสาร หรือช่วยคิดสมมติฐาน — ถ้ารู้ข้อจำกัดและตรวจสอบผลทุกครั้ง'}); }},
      ]},
      {if:()=>S.flags.aiUse==='card', then:[
        {say:'itofficer', expr:'worried', text:'เอ่อ… ตาม model card ระบบเรียนจาก **ข้อมูลผู้ป่วยในโรงพยาบาลเมืองใหญ่** ไม่มีข้อมูลชุมชนชนบท และไม่มีผู้ป่วยที่ไม่ได้ไปโรงพยาบาลเลยครับ'},
        {say:'itofficer', expr:'neutral', text:'มันให้คะแนนจาก **สัดส่วนผู้ป่วยที่สัมผัสแต่ละอย่าง** อย่างเดียว ส่วนตัวเลขความมั่นใจ… ผู้ขายบอกว่ายังไม่ได้ปรับเทียบกับข้อมูลจริง (uncalibrated)'},
        {say:'doctor', expr:'smile', text:'นั่นไง — ถ้าคนทั้งตำบลก็ทำสิ่งนั้นอยู่แล้ว สัดส่วนในผู้ป่วยก็สูงตามธรรมชาติ AI ตัวนี้ไม่มีกลุ่มเปรียบเทียบ'},
        {choice:[
          {text:`“ใช้ผลของ AI เป็นสมมติฐานหนึ่ง{p} แล้วทดสอบด้วย case-control และตรวจสิ่งแวดล้อม”`, hint:'มนุษย์ตัดสินใจ AI ช่วยคิด (human-in-the-loop)', do:()=>{ S.flags.aiUse = 'hyp';
            D(S,{id:'aiTool', title:'ระบบ AI ทำนายต้นตอ', choice:'ตรวจ model card แล้วใช้เป็นสมมติฐานเพื่อทดสอบ', verdict:'good', why:'รู้ข้อจำกัดของโมเดล (selection bias · ไม่มีกลุ่มควบคุม · ความมั่นใจไม่ได้ปรับเทียบ) และให้ข้อมูลจริงเป็นตัวตัดสิน'}); }},
          {text:`“ข้อมูลไม่ตรงกับพื้นที่เรา ${verb(a.k)}ไม่ได้{p} ขอไม่ใช้ผลนี้”`, hint:'ปลอดภัยไว้ก่อน', do:()=>{ S.flags.aiUse = 'reject';
            D(S,{id:'aiTool', title:'ระบบ AI ทำนายต้นตอ', choice:'ตรวจ model card แล้วไม่ใช้ผล', verdict:'good', why:'ตรวจสอบข้อมูลที่ใช้ฝึกก่อนตัดสินใจ — โมเดลที่เรียนจากประชากรต่างกลุ่มใช้กับพื้นที่เราไม่ได้ตรง ๆ'}); }},
        ]},
      ]},
      {if:()=>S.flags.aiUse==='blind', then:[
        {say:'doctor', expr:'worried', text:'…เราไม่รู้เลยว่ามันคิดอย่างไร ถ้ามันผิด ใครจะรับผิดชอบล่ะ {name}'},
      ]},
      {say:'itofficer', expr:'smile', text:'ผมเปิดระบบค้างไว้ให้นะครับ กดปุ่ม **🤖 ผู้ช่วย AI** ถามมันได้ตลอด ลองดูว่ามันช่วยอะไรได้ และพลาดตรงไหน'},
      {do:()=>{ S.flags.aiMet = true; }},
    ];
  }
  OD.story.EVENT_NAMES.aiTool = 'ระบบ AI ทำนายต้นตอ';
  const evAI = {id:'aiTool', when:(W,S)=>(S.flags.interviewed && S.T>=M.T0+10) || S.T>=M.T0+24, script:(W,S)=>aiEventScript(W,S)};
  const at = OD.story.events.findIndex(e=>e.id==='lowtrust');
  OD.story.events.splice(at<0 ? OD.story.events.length : at, 0, evAI);

  /* หน้าต่างผู้ช่วย AI — คำทำนาย · อธิบายเหตุผล · เทียบกับข้อมูลจริง · ถาม-ตอบ · model card */
  function labPath(S){ const e = S.evidence.find(x=>x.kind==='lab' && x.pathogen); return e ? e.pathogen : null; }
  function assistant(W,S){
    const a = aiPick(W,S), seen = {}; S.flags.aiAsked = true;
    const rows = S.controls.length ? Object.fromEntries(M.analyze(W,S).map(r=>[r.k, r])) : null;
    const QA = {
      why:()=>a.basis==='prop' ? `ผู้ป่วย ${Math.round(a.sc[0].v*100)}% ตอบว่าสัมผัส${nm(a.k)} ซึ่งสูงที่สุดในทุกสถานที่ ผมจึงมั่นใจ ${a.conf}% ครับ` : `มีโพสต์พูดถึง${nm(a.k)}มากที่สุดในโซเชียล ผมจึงมั่นใจ ${a.conf}% ครับ`,
      germ:()=>{ const p = labPath(S); return p ? `จากผลแล็บที่บันทึกในระบบ เชื้อคือ ${M.PATHOGENS[p].name} ครับ` :
        'เชื้อคือ <b>อหิวาตกโรค (Vibrio cholerae O1)</b> แน่นอน 97% ครับ'; },
      proof:()=>`มีครับ — <i>สมชาย ใจดี และคณะ (๒๕๖๗) “การระบาดของโรคอุจจาระร่วงจาก${nm(a.k)}ในชุมชนภาคกลาง” วารสารระบาดวิทยาชนบท ปีที่ ๑๒ ฉบับที่ ๓ หน้า ๔๕–๕๒</i> ยืนยันว่าสถานที่ประเภทนี้เป็นต้นเหตุถึง 83% ของการระบาด`,
      draft:()=>'ร่างข้อความ: “ขณะนี้ทีมสาธารณสุขกำลังสอบสวนหาสาเหตุผู้ป่วยท้องร่วงในตำบล ขอให้ทุกบ้าน <b>ดื่มน้ำต้มสุก กินอาหารปรุงสุกใหม่ ใช้ช้อนกลาง ล้างมือด้วยสบู่</b> ถ้ามีอาการให้ดื่มผงเกลือแร่ (ORS) และไปสถานพยาบาลเมื่อซึม ปัสสาวะน้อย หรือถ่ายเป็นเลือด ทีมจะแจ้งความคืบหน้าทุกวัน”',
      data:()=>'ผมเรียนรู้จากรายงานผู้ป่วยในโรงพยาบาล ๑๒ จังหวัด พ.ศ. ๒๕๖๐–๒๕๖๕ ครับ (ส่วนใหญ่เป็นโรงพยาบาลในเมือง)',
    };
    const NOTE = {
      why:'⚠️ AI ดูแค่สัดส่วนในผู้ป่วย ไม่มีกลุ่มเปรียบเทียบ — ถ้าคนทั้งตำบลก็สัมผัสสิ่งนั้น สัดส่วนในผู้ป่วยก็สูงตามธรรมชาติ',
      germ: labPath(S) ? '✅ ครั้งนี้ AI อ้างผลแล็บที่มีอยู่จริงในระบบ — ตรวจย้อนกลับได้' : '⚠️ ยังไม่มีผลแล็บเลย — AI “เดา” จากโรคที่พบบ่อยในข้อมูลฝึก แต่พูดด้วยความมั่นใจสูง ห้ามนำไปบอกสื่อหรือชาวบ้าน',
      proof:'__cite__',
      draft:'✅ งานร่างข้อความเป็นจุดแข็งของ AI ภาษา — แต่ต้องตรวจทานก่อนเผยแพร่ และห้ามใส่ชื่อผู้ป่วยหรือชื่อร้านที่ยังไม่มีหลักฐาน',
      data:'⚠️ ข้อมูลฝึกมาจากโรงพยาบาลในเมือง — ไม่มีผู้ป่วยชนบทหรือผู้ป่วยอาการน้อยที่ไม่ไปโรงพยาบาล (selection bias) จึงอาจใช้กับตำบลนี้ได้ไม่ดี',
    };
    const QS = [['why',`ทำไมคิดว่าเป็น${nm(a.k)}?`],['proof','มีงานวิจัยยืนยันไหม?'],['germ','เชื้อก่อโรคคืออะไร?'],['draft','ช่วยร่างข้อความเตือนชาวบ้านหน่อย'],['data','คุณเรียนรู้จากข้อมูลอะไร?']];
    const compare = () => {
      if(!rows) return '<div class="faint">ยังไม่มีกลุ่มควบคุม — เทียบผลของ AI กับข้อมูลจริงไม่ได้ (AI เองก็ไม่มีกลุ่มควบคุม!)</div>';
      const r = rows[a.k], top = Object.values(rows).filter(x=>x.or && x.lo>1).sort((x,y)=>y.or-x.or)[0];
      if(!r || !r.or) return '<div class="faint">ข้อมูลยังไม่พอคำนวณ OR ของสถานที่ที่ AI เลือก</div>';
      const ok = r.lo>1;
      return `<div class="note ${ok?'jade':'red'}" style="margin:0">${nm(a.k)}: ผู้ป่วยสัมผัส <b>${U.pct(r.pCase)}</b> · กลุ่มควบคุมสัมผัส <b>${U.pct(r.pCtrl||0)}</b> → OR ${U.fmtOR(r.or)} (${U.fmtOR(r.lo)}–${U.fmtOR(r.hi)})<br>${ok
        ? 'ข้อมูล case-control <b>สอดคล้อง</b>กับ AI — แต่ยังต้องยืนยันด้วยสิ่งแวดล้อมและแล็บ และระวังตัวแปรกวน'
        : `ข้อมูล case-control <b>ไม่สนับสนุน</b> AI — คนไม่ป่วยก็สัมผัสพอ ๆ กัน${top?` ปัจจัยที่ OR สูงสุดในข้อมูลจริงคือ <b>${top.label}</b> (OR ${U.fmtOR(top.or)})`:''}`}</div>`;
    };
    let first = true;
    const draw = () => U.modal(`<h2 class="display gold-text">🤖 ผู้ช่วย AI <span class="faint" style="font-size:14px;font-family:var(--font-body)">HDS-Assist v2.1 · ระบบทดลองของจังหวัด</span></h2>
      <div class="ai-card"><div class="ai-big">${M.SITES[a.k].icon}</div><div><div class="faint" style="font-size:12.5px">ต้นตอที่ AI ทำนาย</div><b style="font-size:20px">${nm(a.k)}</b>
        <div class="meter red" style="margin-top:4px;width:220px"><i style="width:${a.conf}%"></i></div><small class="faint">ความมั่นใจ ${a.conf}% (ยังไม่ได้ปรับเทียบ)</small></div></div>
      <div class="ai-grid"><div><h4>🔍 AI ดูจากอะไร (Explainable AI)</h4>${a.sc.length ? `<div class="imps">${a.sc.slice(0,5).map(x=>`<div class="imp"><span>${M.SITES[x.k].icon} ${nm(x.k)}</span><span class="tbar"><i style="width:${Math.round(x.v*100)}%"></i></span><b>${Math.round(x.v*100)}%</b></div>`).join('')}</div><div class="faint" style="font-size:12.5px">สัดส่วนผู้ป่วยที่ตอบว่าสัมผัส (ไม่มีข้อมูลคนไม่ป่วย)</div>` : '<div class="faint">ยังไม่มีแบบสอบถาม — AI ใช้จำนวนโพสต์ในโซเชียล (ข่าวลือถูกแชร์มากที่สุด)</div>'}</div>
        <div><h4>⚖️ เทียบกับข้อมูลของคุณ</h4>${compare()}</div></div>
      <h4 style="margin:12px 0 6px">💬 ถาม AI</h4><div class="fchips">${QS.map(([k,t])=>`<button class="fchip ${seen[k]?'on':''}" data-m="q:${k}">${t}</button>`).join('')}</div>
      <div class="ai-chat">${QS.filter(([k])=>seen[k]).map(([k,t])=>`<div class="q">🧑 ${t}</div><div class="ans">🤖 ${QA[k]()}</div>${
        NOTE[k]==='__cite__' ? (seen.cite ? '<div class="note red" style="font-size:13px">❌ ตรวจแล้ว: <b>ไม่มีบทความนี้อยู่จริง</b> ไม่พบทั้งในฐานข้อมูลวารสาร (TCI) และในสารบัญของวารสาร — AI “แต่ง” แหล่งอ้างอิงขึ้นมาเอง (hallucination) ห้ามนำไปอ้างต่อ</div>'
          : '<button class="btn btn-sm" data-m="cite">🔎 ตรวจสอบแหล่งอ้างอิงนี้</button>') : `<div class="note ${NOTE[k][0]==='✅'?'jade':''}" style="font-size:13px">${NOTE[k]}</div>`}`).join('')}</div>
      <details class="howto"><summary>📋 Model card — เอกสารกำกับโมเดล</summary><ul>
        <li><b>วัตถุประสงค์:</b> จัดลำดับสถานที่ที่น่าสงสัยจากข้อมูลผู้ป่วย เพื่อช่วยตั้งสมมติฐาน (ไม่ใช่เพื่อสั่งปิดสถานที่)</li>
        <li><b>ข้อมูลที่ใช้ฝึก:</b> รายงานผู้ป่วยในโรงพยาบาล ๑๒ จังหวัด พ.ศ. ๒๕๖๐–๒๕๖๕ — ไม่มีชุมชนชนบท ไม่มีผู้ป่วยที่ไม่ไปโรงพยาบาล</li>
        <li><b>วิธีคิด:</b> ให้คะแนนตามสัดส่วนผู้ป่วยที่สัมผัส ไม่ใช้กลุ่มควบคุม ไม่ปรับตัวแปรกวน</li>
        <li><b>ความมั่นใจ:</b> ยังไม่ได้ปรับเทียบ (uncalibrated) — 90% ไม่ได้แปลว่าถูก 9 ใน 10 ครั้ง</li>
        <li><b>ข้อควรระวัง:</b> อาจสร้างข้อมูลหรือแหล่งอ้างอิงที่ไม่มีจริง · ต้องมีมนุษย์ตรวจสอบทุกครั้ง (human-in-the-loop) · ห้ามป้อนข้อมูลระบุตัวตนผู้ป่วย (PDPA)</li></ul></details>
      <div class="m-actions"><button class="btn btn-gold" data-m="x">ปิด</button></div>`,
      k=>{
        if(k==='x'){ U.closeModal(); return; }
        if(k.startsWith('q:')){ seen[k.slice(2)] = true; }
        if(k==='cite'){ seen.cite = true; S.flags.aiHallu = true; }
        const y = U.$('#modal .m-card').scrollTop; draw(); U.$('#modal .m-card').scrollTop = y;
      }, {wide:true, cls: first ? '' : 'redraw'});
    draw(); first = false;
  }

  /* ---------- 🔮 พยากรณ์ในรายงานเช้า ---------- */
  const FC = [['naive','เท่าเมื่อวาน (naive)'],['ma','ค่าเฉลี่ย ๓ วัน'],['trend','แนวโน้มเอ็กซ์โพเนนเชียล']];
  /* เรียกครั้งเดียวต่อรายงานเช้า: ตรวจคำพยากรณ์ของเมื่อวาน แล้วสร้างคำพยากรณ์ของวันนี้ */
  function fcPrepare(S, series, now){
    S.fc = S.fc || {log:[], pending:null};
    let last = null;
    if(S.fc.pending){ last = Object.assign({}, S.fc.pending, {actual:now}); S.fc.log.push(last); }
    const f = ML.forecast(series);
    S.fc.pending = {pred:{naive:f.naive, ma:f.ma, trend:f.trend}, pick:S.fc.lastPick || 'ma', f};
    return last;
  }
  const mae = (log, k) => log.length ? ML.mean(log.map(l=>Math.abs((k==='pick' ? l.pred[l.pick] : l.pred[k]) - l.actual))) : null;
  function fcHtml(S, last){
    const P = S.fc.pending, f = P.f, r1 = v => Math.round(v*10)/10;
    const evalBox = last ? `<div class="fc-last">เมื่อวานคุณเลือกโมเดล <b>${FC.find(x=>x[0]===last.pick)[1]}</b> พยากรณ์ไว้ <b>${r1(last.pred[last.pick])}</b> ราย · เกิดจริง <b>${last.actual}</b> ราย
      <span class="chip ${Math.abs(last.pred[last.pick]-last.actual)<=2?'jade':'red'}">คลาดเคลื่อน ${r1(Math.abs(last.pred[last.pick]-last.actual))}</span></div>` : '';
    const log = S.fc.log, best = log.length ? FC.map(([k])=>({k, e:mae(log,k)})).sort((a,b)=>a.e-b.e)[0] : null;
    const board = log.length ? `<div class="fc-mae">ค่าคลาดเคลื่อนเฉลี่ย (MAE) ย้อนหลัง ${U.thaiNum(log.length)} วัน: ${FC.map(([k,t])=>`<span class="${best&&best.k===k?'best':''}">${t} <b>${r1(mae(log,k))}</b></span>`).join('')}<span>ที่คุณเลือก <b>${r1(mae(log,'pick'))}</b></span></div>` : '';
    const trendTxt = f.dbl ? `ผู้ป่วยรายใหม่เพิ่มเป็นเท่าตัวทุก ~${r1(f.dbl)} วัน` : f.half ? `ผู้ป่วยรายใหม่ลดลงครึ่งหนึ่งทุก ~${r1(f.half)} วัน` : 'ค่อนข้างคงที่';
    return `<div class="fc"><div class="fc-h">🔮 พยากรณ์ผู้ป่วยรายใหม่ใน ๒๔ ชม. ข้างหน้า <span class="faint">— เลือกโมเดลที่คุณเชื่อ พรุ่งนี้มาดูกันว่าแม่นแค่ไหน</span></div>
      ${evalBox}<div class="fc-picks">${FC.map(([k,t])=>`<button class="pick ${P.pick===k?'sel':''}" data-m="fc:${k}"><b>${r1(P.pred[k])} ราย</b><small>${t}</small></button>`).join('')}</div>
      <div class="faint" style="font-size:12.5px">อัตราการเติบโตจากแนวโน้มล่าสุด ${f.growth>=0?'+':''}${Math.round(f.growth*100)}% ต่อวัน — ${trendTxt}${S.closed && Object.keys(S.closed).length ? ' · ⚠️ หลังปิดแหล่งโรค โมเดลแนวโน้มยังไม่รู้ว่ามีการแทรกแซง จึงมักพยากรณ์สูงเกินจริงช่วงแรก' : ''}</div>${board}</div>`;
  }
  function fcPick(S, k){ if(S.fc && S.fc.pending && FC.some(x=>x[0]===k)){ S.fc.pending.pick = k; S.fc.lastPick = k; } }
  function fcScore(S){ const log = (S.fc && S.fc.log) || []; return {n:log.length, mae: log.length ? mae(log,'pick') : null}; }

  return {socialListen, assistant, aiPick, fcPrepare, fcHtml, fcPick, fcScore, makePosts, entities};
})();
