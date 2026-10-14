/* =========================================================
   report — รายงานสอบสวนโรค, การให้คะแนน, ตอนจบ, หน้าผลลัพธ์
   ========================================================= */
OD.report = (function(){
  const U = OD.u, M = OD.sim;
  const nm = id => M.SITES[id].name;
  const ROUTES = [['water','น้ำดื่ม/น้ำใช้ที่ปนเปื้อน (บ่อน้ำ แท็งก์น้ำ)'],['food','อาหารปนเปื้อนจากร้านอาหารหรือโรงอาหาร'],['ice','น้ำแข็งปนเปื้อนจากแหล่งผลิต'],
    ['produce','ผักสดปนเปื้อนจากแหล่งปลูก'],['event','อาหารในงานเลี้ยงครั้งเดียว'],['handler','ผู้ประกอบอาหารที่ป่วย (โรงอาหาร)']];
  const PATTERNS = [['point','แหล่งโรคครั้งเดียว (point source)'],['cont','แหล่งโรคร่วมต่อเนื่อง (continuous common source)'],['mixed','แหล่งโรคร่วม ตามด้วยการแพร่คนสู่คน (mixed)']];
  const MEAS = [
    ['close','ปิด/ระงับการใช้แหล่งโรคที่ระบุ จนกว่าจะแก้ไขเสร็จ'], ['chlor','เติมคลอรีนในแหล่งน้ำ และประกาศให้ต้มน้ำก่อนดื่ม'],
    ['recall','เรียกคืนน้ำแข็งที่จำหน่ายแล้ว และตรวจมาตรฐานโรงน้ำแข็ง'], ['vegrecall','งดใช้ผักจากแหล่งที่ปนเปื้อน ตรวจน้ำที่ใช้ปลูก และแนะนำล้างผักด้วยน้ำสะอาดไหลผ่าน'], ['handler','ให้ผู้ประกอบอาหารที่ป่วยหยุดงานจนหายอย่างน้อย ๔๘ ชม. และทำความสะอาดครัวด้วยคลอรีน'],
    ['sanit','ตรวจสุขาภิบาลอาหารและอบรมผู้ประกอบอาหาร'], ['leftover','ทำลายอาหารที่เหลือจากงาน และให้ความรู้การเก็บอาหารปรุงสุก'],
    ['hygiene','รณรงค์ล้างมือ ใช้ช้อนกลาง แยกของใช้ผู้ป่วยในบ้าน'], ['active','ค้นหาผู้ป่วยเพิ่มเติมเชิงรุก และแจกผงเกลือแร่ (ORS)'],
    ['comm','สื่อสารความเสี่ยงต่อชุมชนอย่างโปร่งใสและสม่ำเสมอ'], ['surv','เฝ้าระวังผู้ป่วยต่อเนื่องอย่างน้อยสองเท่าของระยะฟักตัวสูงสุดหลังผู้ป่วยรายสุดท้าย'], ['spray','ฉีดพ่นยากำจัดยุงทั่วตำบล'],
    ['abx','แจกยาปฏิชีวนะป้องกันให้ประชาชนทุกคน'], ['ban','ปิดตลาดสดและห้ามจัดงานบุญทั้งตำบล ๑ เดือน'],
  ];
  /* มาตรการหลักที่ต้องมี — ขึ้นกับต้นตอจริง และเพิ่ม "ล้างมือ" ถ้ามีการแพร่คนสู่คน */
  function essential(W){
    const s = W.scn, b = {WELL:['close','chlor'], REST:['close','sanit'], ICE:['close','recall'], FARM:['close','vegrecall'], EVENT:['leftover','sanit'],
      SCHOOL:{handler:['handler','hygiene'], food:['close','sanit'], tank:['close','chlor']}[s.sub]}[s.type];
    return truth(W).p2p==='yes' && !b.includes('hygiene') ? b.concat('hygiene') : b;
  }
  const BAD = ['spray','abx','ban'];
  const LIMITS = [
    ['recall','อคติจากการระลึกความจำของผู้ตอบแบบสอบถาม', true], ['under','ผู้ป่วยอาการน้อยอาจไม่ถูกรายงานหรือค้นพบครบ', true],
    ['labsens','ความไวของการตรวจทางห้องปฏิบัติการไม่ถึง ๑๐๐% ผลลบจึงไม่ได้ตัดแหล่งนั้นออก', true], ['small','ขนาดตัวอย่างน้อย ช่วงความเชื่อมั่นจึงกว้าง', true],
    ['confound','อาจมีตัวแปรกวนจากการที่คนในหมู่บ้านเดียวกันสัมผัสหลายอย่างร่วมกัน', true],
    ['model','โมเดลสถิติ/ML บอกความสัมพันธ์และพลังทำนาย ไม่ได้พิสูจน์สาเหตุด้วยตัวเอง', true],
    ['proof','ผลการศึกษานี้พิสูจน์ความเป็นเหตุเป็นผลได้ ๑๐๐%', false], ['nolimit','ไม่มีข้อจำกัด เพราะสัมภาษณ์ผู้ป่วยครบทุกราย', false],
    ['aiproof','ระบบ AI ของจังหวัดยืนยันต้นตอแล้ว จึงไม่ต้องอาศัยหลักฐานด้านอื่น', false],
  ];

  /* ความจริงของคดี — คำนวณจากการระบาดที่เกิดขึ้นจริง ไม่ผูกกับประเภทต้นตอ */
  function truth(W){
    const s = W.scn, cs = W.people.filter(p=>p.inf!==null && p.onset<=M.HORIZON);
    const secShare = cs.filter(p=>p.cause==='sec').length / Math.max(1, cs.length), p2p = secShare>=.15 ? 'yes' : 'no';
    const route = {WELL:'water', REST:'food', ICE:'ice', FARM:'produce', EVENT:'event', SCHOOL:{handler:'handler', food:'food', tank:'water'}[s.sub]}[s.type];
    return {site:s.culprit, route, pathogen:s.pathogen, p2p, secShare, pattern: p2p==='yes' ? 'mixed' : s.type==='EVENT' ? 'point' : 'cont'};
  }
  function related(W){
    const s = W.scn, r = {WELL:[s.culprit], REST:[s.culprit, s.key].filter(Boolean), ICE:['ICE'], FARM:['VEG'], SCHOOL:['S'], EVENT:['E', s.dish]}[s.type];
    return truth(W).p2p==='yes' ? r.concat('HH') : r;
  }
  /* ร้าน/โรงอาหารที่เป็น "ทางผ่าน" ของต้นตอซ่อน (โรงน้ำแข็ง/สวนผัก) */
  const isVenue = (W,id) => (W.scn.type==='ICE' && W.scn.iceVenues.includes(id)) || (W.scn.type==='FARM' && W.scn.vegVenues.includes(id));
  /* หลักฐานที่ระบุชื่อสถานที่ (ใช้ตรวจว่าโยงกับผู้ต้องสงสัยถูกที่หรือไม่) */
  const TGT = {W1:'W1',W2:'W2',W3:'W3',R1:'R1',R2:'R2',R3:'R3',R4:'R4',S:'S',E:'E',E_kj:'E',E_lb:'E',E_ds:'E'};
  /* หลักฐานที่พูดถึงสถานที่หนึ่ง ใช้สนับสนุนผู้ต้องสงสัยได้เมื่อเป็นที่เดียวกัน หรือผู้ต้องสงสัยเป็นแหล่งผลิตที่ส่งวัตถุดิบให้ที่นั้น */
  const fits = (W, target, suspect) => !target || target===suspect || M.feeds(W, suspect, target);
  /* รายการหลักฐานทั้งหมด: cat = stat | env | lab | talk (ใช้บนกระดานสืบสวน) */
  function evidenceItems(W,S){
    const s = W.scn, rk = related(W), items = S.evidence.map(e=>{
      let rel = 'none', cat = 'env', target = e.site || null;
      if(e.kind==='env') rel = e.site===s.culprit ? 'strong' : (e.strength==='weak' ? 'weak' : 'none');
      if(e.kind==='lab'){ cat = 'lab'; rel = e.mixed ? 'none' : e.pathogen ? (e.pathogen===s.pathogen ? 'strong':'none') : (e.pos ? 'strong' : 'none'); }
      if(e.kind==='supply') rel = e.strength==='strong' ? 'strong' : 'none';
      if(e.kind==='clinical'){ cat = 'lab'; rel = 'weak'; }
      if(e.kind==='rumor' || e.kind==='interview' || e.kind==='nlp'){ cat = 'talk'; rel = e.truth===false ? 'mis' : 'weak'; }   // คำบอกเล่าที่ไม่ตรงกับข้อมูล = หลักฐานชี้ผิดทาง
      // ผลจากโมเดลหลายตัวแปร (logistic regression) ประเมินแบบเดียวกับ OR
      if(e.kind==='ml'){ cat = 'stat'; target = TGT[e.k] || null; rel = rk.includes(e.k) ? 'strong' : (isVenue(W,e.k) || e.k==='FEST') ? 'weak' : 'mis'; }
      return {id:e.id, kind:e.kind, text:e.text, rel, cat, target};
    });
    const rows = M.analyze(W,S);
    if(S.controls.length){
      rows.filter(r=>r.or && r.lo>1).sort((a,b)=>b.or-a.or).slice(0,6).forEach(r=>items.push({id:'or-'+r.k, kind:'or', cat:'stat', target:TGT[r.k]||null,
        text:`การศึกษา case-control: ${r.label} OR = ${U.fmtOR(r.or)} (95% CI ${U.fmtOR(r.lo)}–${U.fmtOR(r.hi)})`,
        rel: rk.includes(r.k) ? 'strong' : (isVenue(W,r.k) || r.k==='FEST') ? 'weak' : 'mis'}));
    }
    if(Object.keys(S.ans).length){
      rows.filter(r=>r.nCase && r.pCase>=.6 && r.k!=='BOT').sort((a,b)=>b.pCase-a.pCase).slice(0,2).forEach(r=>items.push({id:'pc-'+r.k, kind:'pc', cat:'stat', target:TGT[r.k]||null,
        text:`ผู้ป่วย ${U.pct(r.pCase)} ตอบว่า${r.label} (ไม่มีกลุ่มเปรียบเทียบ)`, rel: rk.includes(r.k) ? 'weak' : 'mis'}));
    }
    return U.shuffle(items);
  }
  /* หลักฐานที่ผู้เล่นปักไว้กับแหล่งโรคที่ระบุในรายงาน และความสัมพันธ์จริงเมื่อเทียบกับแหล่งนั้น */
  function pickedFor(W, evs, links, site){
    return evs.filter(e=>links.get(e.id)===site).map(e=>Object.assign({}, e, {rel: fits(W, e.target, site) ? e.rel : 'mis'}));
  }

  function form(W,S,evs,links,prev){
    return new Promise(resolve=>{
      const sel = prev || {site:null, route:null, p2p:null, path:null, pattern:null, meas:new Set(), lim:new Set()};
      const recsAll = M.records(W,S), nConf = recsAll.filter(r=>S.confirmed.has(r.p.id)).length;
      const sites = Object.keys(M.SITES).filter(id=>S.known.has(id));
      // ค่าเริ่มต้นของแหล่งโรค = ผู้ต้องสงสัยที่ปักหลักฐานไว้มากที่สุดบนกระดาน
      const cnt = {}; for(const v of links.values()) cnt[v] = (cnt[v]||0)+1;
      const top = Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
      if(!sel.site && top) sel.site = top;
      const catIc = {stat:'📊', env:'🔎', lab:'🧪', talk:'💬'};
      const root = U.$('#scr-report');
      const radio = (grp, k, t) => `<label class="ropt ${sel[grp]===k?'on':''}"><input type="radio" name="${grp}" value="${k}" ${sel[grp]===k?'checked':''}> <span>${t}</span></label>`;
      const check = (grp, k, t) => `<label class="ropt ${sel[grp].has(k)?'on':''}"><input type="checkbox" data-g="${grp}" value="${k}" ${sel[grp].has(k)?'checked':''}> <span>${t}</span></label>`;
      function render(){
        const ok = sel.site && sel.route && sel.p2p && sel.path && sel.pattern;
        root.innerHTML = `<div class="ch-wrap"><div class="ch-banner">${OD.art.prajamInline(44)}<div><div class="no">บทที่ ๔</div><h1 class="display gold-text">รายงานสอบสวนโรค</h1></div></div>
          <div class="paper rep">
            <div style="text-align:center"><b style="font-size:19px">รายงานการสอบสวนโรคอุจจาระร่วงเฉียบพลัน ตำบลบ้านสุขใจ</b><div class="muted">ผู้รายงาน: ${U.esc(S.name)} · ทีม HDS · ${M.fmtT(S.T)}</div></div>
            <div class="orn-divider"></div>
            <div class="note"><b>สรุปผู้ป่วยตามนิยาม:</b> ${recsAll.length} ราย — ผู้ป่วยยืนยัน ${nConf} ราย · ผู้ป่วยสงสัย ${recsAll.length-nConf} ราย${S.acfAt!=null?` · พบจากการค้นหาเชิงรุก ${M.hiddenFound(W,S)} ราย`:' · <span style="color:#9a2816">ยังไม่ได้ค้นหาผู้ป่วยเชิงรุก</span>'} · ทำตามขั้นตอนแล้ว ${U.thaiNum(OD.checklist.progress(W,S))}/๑๐</div>
            <div class="rep-sec"><h3><span class="n">๑.</span> แหล่งโรค</h3><div class="ropts">${sites.map(id=>radio('site',id,`${M.SITES[id].icon} ${nm(id)}`)).join('')}</div></div>
            <div class="rep-sec"><h3><span class="n">๒.</span> ช่องทางการแพร่หลัก</h3><div class="ropts">${ROUTES.map(([k,t])=>radio('route',k,t)).join('')}</div></div>
            <div class="rep-sec"><h3><span class="n">๓.</span> มีการแพร่ต่อแบบคนสู่คนในครัวเรือนอย่างชัดเจนหรือไม่</h3><div class="ropts">${radio('p2p','yes','มี — ผู้ป่วยระลอกหลังเป็นคนในบ้านเดียวกับผู้ป่วยรายแรก')}${radio('p2p','no','ไม่เด่นชัด')}</div></div>
            <div class="rep-sec"><h3><span class="n">๔.</span> เชื้อก่อโรคที่น่าจะเป็น</h3><div class="ropts">${Object.entries(M.PATHOGENS).map(([k,p])=>radio('path',k,p.name)).join('')}</div></div>
            <div class="rep-sec"><h3><span class="n">๕.</span> รูปแบบการระบาด</h3><div class="ropts">${PATTERNS.map(([k,t])=>radio('pattern',k,t)).join('')}</div></div>
            <div class="rep-sec"><h3><span class="n">๖.</span> หลักฐานสนับสนุน <span class="muted" style="font-size:13px;font-weight:400">— หลักฐานที่ปักไว้กับแหล่งโรคในข้อ ๑ บนกระดานสืบสวน</span></h3>
              ${(()=>{ const P = sel.site ? evs.filter(e=>links.get(e.id)===sel.site) : [];
                return (P.length ? `<ul class="rep-ev">${P.map(e=>`<li><span>${catIc[e.cat]}</span>${e.text}</li>`).join('')}</ul>`
                  : `<div class="muted">${sel.site ? `ยังไม่ได้ปักหลักฐานไว้กับ${nm(sel.site)}` : 'เลือกแหล่งโรคในข้อ ๑ ก่อน'}</div>`) +
                  `<button class="btn btn-sm" id="repBoard" style="margin-top:8px">📌 กลับไปแก้ไขกระดานสืบสวน</button>`; })()}</div>
            <div class="rep-sec"><h3><span class="n">๗.</span> มาตรการควบคุมและป้องกัน</h3><div class="ropts">${MEAS.map(([k,t])=>check('meas',k,t)).join('')}</div></div>
            <div class="rep-sec"><h3><span class="n">๘.</span> ข้อจำกัดของการสอบสวน <span class="muted" style="font-size:13px;font-weight:400">— รายงานที่ดีต้องยอมรับข้อจำกัดอย่างตรงไปตรงมา</span></h3><div class="ropts">${LIMITS.map(([k,t])=>check('lim',k,t)).join('')}</div></div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:22px;flex-wrap:wrap">
              <span class="muted">${ok?'พร้อมส่งรายงาน':'กรุณาตอบข้อ ๑–๕ ให้ครบ'}</span>
              <button class="btn btn-red btn-lg" id="repSend" ${ok?'':'disabled'}>ลงนามและส่งรายงาน</button></div>
          </div></div>`;
      }
      root.onchange = e=>{
        const t = e.target;
        if(t.type==='radio') sel[t.name] = t.value;
        if(t.type==='checkbox'){ const g = sel[t.dataset.g]; t.checked ? g.add(t.value) : g.delete(t.value); }
        const y = window.scrollY; render(); window.scrollTo(0,y);
      };
      root.onclick = e=>{
        if(e.target.id==='repSend'){ root.onclick = root.onchange = null; OD.sfx && OD.sfx('stamp'); resolve({sel}); }
        if(e.target.id==='repBoard'){ root.onclick = root.onchange = null; resolve({sel, back:true}); }
      };
      U.show('scr-report'); render();
    });
  }

  function score(W,S,sel,evs,links){
    const T = truth(W), Tr = S.T, s = W.scn;
    // ใช้มาตรการตามรายงาน
    const setC = (id) => {
      if(S.closed[id]==null || S.closed[id]>Tr) S.closed[id] = Tr;
      else if(M.wasReopened(S,id)) S.reclosed[id] = Tr;      // ถูกเปิดคืนไปแล้ว → รายงานสั่งปิดอีกครั้ง
    };
    if(sel.meas.has('close')) setC(sel.site);
    if(sel.meas.has('chlor') && (s.type==='WELL' || s.sub==='tank')) setC(s.culprit);
    if(sel.meas.has('recall') && s.type==='ICE') setC('F1');
    if(sel.meas.has('vegrecall') && s.type==='FARM') setC('F3');
    if(sel.meas.has('handler') && s.sub==='handler') setC('S');
    if(sel.meas.has('hygiene') && (S.hygieneAt==null || S.hygieneAt>Tr)) S.hygieneAt = Tr;
    // ส่งรายงานก่อนงานกฐิน: มาตรการสุขาภิบาลอาหารในรายงานครอบคลุมงานบุญที่กำลังจะมาถึง
    if(!S.flags.festival && Tr < M.FEST_T && (sel.meas.has('sanit') || sel.meas.has('leftover'))) S.flags.festival = 'safe';
    S.ver++;
    const oc = M.outcome(W,S);
    const wrongClosed = Object.keys(S.closed).filter(id=>id!==s.culprit && !isVenue(W,id) && !(id===sel.site && sel.site===s.culprit));
    // หมวดคะแนน (รวม ๑,๐๐๐)
    const C = {};
    C.source = sel.site===T.site ? 200 : isVenue(W,sel.site) ? 60 : 0;
    C.route = sel.route===T.route ? 70 : 0;
    C.path = sel.path===T.pathogen ? 70 : 0;
    C.p2p = sel.p2p===T.p2p ? 30 : 0;
    C.pattern = sel.pattern===T.pattern ? 30 : 0;
    // หลักฐาน: เฉพาะที่ปักไว้กับแหล่งโรคที่ระบุ · ครบ ๓ ด้าน (สถิติ + สิ่งแวดล้อม + แล็บ) ได้โบนัส
    let ev = 0; const picked = sel.site ? pickedFor(W, evs, links, sel.site) : [];
    for(const e of picked) ev += {strong:3, weak:1, none:-.5, mis:-2}[e.rel];
    const solid = new Set(picked.filter(e=>e.rel==='strong'||e.rel==='weak').map(e=>e.cat));
    const tri = sel.site===T.site && ['stat','env','lab'].every(c=>solid.has(c));
    C.evidence = Math.round(U.clamp(ev/9, 0, 1)*100) + (tri ? 10 : 0);
    const ess = essential(W), good = ['active','comm','surv'];
    let ms = .15 + .6*ess.filter(k=>sel.meas.has(k)).length/ess.length + .25*good.filter(k=>sel.meas.has(k)).length/3 - .15*BAD.filter(k=>sel.meas.has(k)).length;
    if(sel.meas.has('close') && sel.site!==T.site && !isVenue(W,sel.site)) ms -= .2;
    C.measures = Math.round(U.clamp(ms,0,1)*130);
    C.time = s.type==='EVENT' ? Math.round(130*U.clamp(1-(Tr-M.T0)/(M.DEADLINE-M.T0)*.8, 0, 1)*(C.source?1:.3))
                              : Math.round(130*(oc.maxPrev>0 ? U.clamp(oc.prevented/oc.maxPrev,0,1) : 1));
    C.data = Math.round(70*(.4*S.acc.ch1/Math.max(1,S.acc.ch1Max) + .6*S.acc.ch2/Math.max(1,S.acc.ch2Max)));
    let trust = S.trust - wrongClosed.length*10 - (S.flags.comm==='speculate' && s.pathogen!=='VC' ? 15 : 0);
    C.trust = Math.round(30*U.clamp(trust,0,100)/100);
    // การตัดสินใจในเหตุการณ์ (๔๐): ดี ๑ · พอใช้ .๗๕ · ก้ำกึ่ง .๔ · ผิด ๐
    const decs = S.decisions.map(d=>OD.story.resolve(W,S,d)), wt = {good:1, ok:.75, mixed:.4, bad:0};
    C.decisions = Math.round(40*(decs.length ? decs.reduce((a,d)=>a+(wt[d.verdict]??.75),0)/decs.length : .75));
    C.budget = Math.round(10*U.clamp(S.budget/M.DIFF[S.diff].budget,0,1));
    // การทำตามขั้นตอนการสอบสวน (๘๐ คะแนน)
    const rk = related(W), lim = LIMITS.filter(l=>sel.lim.has(l[0]));
    const P = {
      kit:    Math.round(15*U.clamp(S.flags.kitScore==null ? 1 : S.flags.kitScore, 0, 1)),
      verify: (S.reviewed || S.confirmed.size>0) ? 8 : 0,
      acf:    S.acfAt!=null ? 10 : 0,
      desc:   (S.flags.vTime && S.flags.vPlace && S.flags.vPerson) ? 7 : 0,
      hyp:    (S.hyp.length ? 5 : 0) + (S.hyp.some(x=>rk.includes(x)) ? 10 : 0),
      study:  (Object.keys(S.inspected).length && S.labs.some(l=>l.kind==='env')) ? 8 : 0,
      care:   S.flags.dehyd==null || S.flags.dehyd==='good' ? 8 : 0,
      limits: Math.round(U.clamp(lim.filter(l=>l[2]).length*3 - lim.filter(l=>!l[2]).length*5, 0, 9)),
    };
    C.process = Object.values(P).reduce((a,b)=>a+b,0);
    const total = Object.values(C).reduce((a,b)=>a+b,0);
    const badDec = decs.some(d=>d.verdict==='bad');
    // ระดับ S ต้องไม่มีการตัดสินใจที่ผิดร้ายแรงในเหตุการณ์ใดเลย
    const rank = total>=880 && !badDec ? 'S' : total>=750 ? 'A' : total>=600 ? 'B' : total>=450 ? 'C' : 'D';
    const title = {S:'ปรมาจารย์นักสืบโรคระบาด', A:'นักวิทยาศาสตร์ข้อมูลสุขภาพมือฉมัง', B:'นักสอบสวนโรคฝีมือดี', C:'นักสืบฝึกหัด', D:'ต้องฝึกฝนอีกมาก'}[rank];
    // บทเรียน
    const L = [];
    if(sel.site!==T.site){
      if(s.type==='ICE' && s.iceVenues.includes(sel.site)) L.push(`${nm(sel.site)}เป็นเพียง “ทางผ่าน” — ต้นตอจริงคือ${nm('F1')}ที่ส่งน้ำแข็งให้หลายร้านพร้อมกัน ข้อ “ดื่มเครื่องดื่มใส่น้ำแข็งนอกบ้าน” และห่วงโซ่อุปทานคือกุญแจ`);
      else if(s.type==='FARM' && s.vegVenues.includes(sel.site)) L.push(`${nm(sel.site)}เป็นเพียง “ทางผ่าน” — ต้นตอจริงคือ${nm('F3')}ที่ส่งผักสดให้หลายแห่ง ข้อ “กินผักสด” และห่วงโซ่อุปทานคือกุญแจ`);
      else if(s.confound && sel.site===s.confound) L.push(`${nm(sel.site)}มี OR สูงเพราะเป็น “ตัวแปรกวน” — คนหมู่บ้านเดียวกับผู้ใช้${nm(s.culprit)}นิยมกินร้านนี้ เมื่อแยกวิเคราะห์ตามหมู่บ้าน (Mantel–Haenszel) OR จะลดลงใกล้ 1`);
      else L.push(`ต้นตอที่แท้จริงคือ ${nm(T.site)} — ลองดูว่าปัจจัยใดมี OR สูงสุดและ CI ไม่คร่อม 1 แล้วยืนยันด้วยการตรวจสิ่งแวดล้อมหรือแล็บ`);
    }
    if(!S.controls.length) L.push('ไม่ได้เก็บกลุ่มควบคุม จึงไม่มีตัวเปรียบเทียบ — สัดส่วนการสัมผัสในผู้ป่วยอย่างเดียวบอกความเสี่ยงไม่ได้');
    if(picked.some(e=>e.rel==='mis')) L.push('หลักฐานบางข้อที่เลือกชี้ผิดทาง เช่น ปัจจัยที่สูงเพราะบังเอิญหรือเป็นตัวแปรกวน หรือสัดส่วนในผู้ป่วยที่ไม่มีกลุ่มเปรียบเทียบ');
    if(sel.path!==T.pathogen) L.push(`เชื้อที่ถูกต้องคือ ${M.PATHOGENS[T.pathogen].name} — ผลตรวจอุจจาระ อาการเด่น และระยะฟักตัวช่วยอนุมานได้`);
    if(sel.pattern!==T.pattern) L.push(`รูปแบบการระบาดที่ถูกต้องคือ “${PATTERNS.find(p=>p[0]===T.pattern)[1]}” — อ่านได้จากรูปร่างเส้นโค้งการระบาด`);
    if(sel.p2p!==T.p2p) L.push(T.p2p==='yes' ? 'มีการแพร่ต่อในครัวเรือนชัดเจน (ดูปัจจัย “มีคนในบ้านป่วยก่อนหน้า” และผู้ใหญ่ที่ป่วยตามหลังเด็ก) — จึงต้องรณรงค์ล้างมือร่วมด้วย' : 'การแพร่คนสู่คนไม่ได้เด่นในครั้งนี้ ผู้ป่วยส่วนใหญ่ติดจากแหล่งโรคโดยตรง');
    const missE = ess.filter(k=>!sel.meas.has(k)); if(missE.length) L.push('มาตรการสำคัญที่ขาดไป: ' + missE.map(k=>MEAS.find(m=>m[0]===k)[1]).join(' · '));
    if(BAD.some(k=>sel.meas.has(k))) L.push('บางมาตรการไม่เหมาะสม เช่น ฉีดพ่นยุง (ไม่เกี่ยวกับโรคทางเดินอาหาร) หรือแจกยาปฏิชีวนะทุกคน (ทำให้เชื้อดื้อยา)');
    if(wrongClosed.length) L.push(`ปิดแหล่งที่ไม่ใช่ต้นตอ ${wrongClosed.length} แห่ง (${wrongClosed.map(nm).join(', ')}) — ผู้ประกอบการเสียหายและความเชื่อมั่นของชุมชนลดลง`);
    if(S.clean.dupKept.size || S.clean.lost.size || S.clean.phantom.size) L.push('ข้อมูลจากบทที่ ๒ ยังมีปัญหา (นับซ้ำ/ลบผู้ป่วยจริง/รวมผู้ที่ไม่เข้านิยาม) ทำให้ผลวิเคราะห์คลาดเคลื่อน');
    if(P.kit<15) L.push('เตรียมอุปกรณ์ไม่ครบหรือหยิบของที่ไม่ควรใช้ — อุปกรณ์เก็บตัวอย่างที่ถูกต้องคือเงื่อนไขให้ผลแล็บเชื่อถือได้ (ดูคู่มือบทห้องปฏิบัติการ)');
    if(!P.verify) L.push('ข้ามขั้นตอนยืนยันการวินิจฉัย — ควรทบทวนเวชระเบียนหรือตรวจอุจจาระผู้ป่วยบางรายก่อนสรุปว่าเป็นโรคเดียวกัน');
    if(!P.acf) L.push(`ไม่ได้ค้นหาผู้ป่วยเชิงรุก — มีผู้ป่วยอาการน้อยที่ไม่ไปสถานพยาบาลราว ๑ ใน ๓ ซึ่งไม่อยู่ในข้อมูลของคุณเลย`);
    if(!S.hyp.some(x=>rk.includes(x))) L.push('สมมติฐานที่ตั้งไว้ไม่ครอบคลุมแหล่งโรคจริง — ใช้ข้อมูลเชิงพรรณนา (เวลา–สถานที่–บุคคล) ช่วยตั้งสมมติฐานให้ตรงจุด');
    if(S.flags.dehyd && S.flags.dehyd!=='good') L.push('ผู้ป่วยซึม ตาลึก ดื่มไม่ได้ คือภาวะขาดน้ำรุนแรง ต้องส่งต่อให้สารน้ำทางหลอดเลือด — ไม่ใช้ยาหยุดถ่ายและไม่ให้ยาปฏิชีวนะเป็นประจำ');
    if(lim.some(l=>l[0]==='aiproof')) L.push('ผลของ AI เป็นเพียงเครื่องมือช่วยตั้งสมมติฐาน — ข้อสรุปต้องมาจากหลักฐานที่ตรวจสอบได้ (สถิติ สิ่งแวดล้อม แล็บ)');
    else if(lim.some(l=>!l[2])) L.push('ไม่มีการศึกษาใดไร้ข้อจำกัด และการศึกษาแบบ case-control ไม่ได้พิสูจน์ความเป็นเหตุเป็นผลได้ ๑๐๐%');
    else if(lim.length<2) L.push('ควรระบุข้อจำกัดของการสอบสวน เช่น อคติจากการระลึก การรายงานไม่ครบ และความไวของการตรวจทางห้องปฏิบัติการ');
    if(!L.length) L.push('ยอดเยี่ยม — ตัดสินใจได้ถูกต้องครบถ้วนด้วยหลักฐานหลายด้าน');
    return {C, total, rank, title, oc, T, L, correctSource: sel.site===T.site, wrongClosed, Tr, tri, badDec, picked};
  }

  /* ---------- สรุปสิ่งที่พลาด (debrief) — ๖ ด้าน ---------- */
  function debrief(W,S,R,sel,evs,links){
    const s = W.scn, T = R.T, G = [], th = U.thaiNum, src = s.culprit;
    const lab = (arr,k) => (arr.find(x=>x[0]===k)||[0,'—'])[1];
    const short = t => { const a = Array.from(t); return a.length>80 ? a.slice(0,78).join('')+'…' : t; };
    const kitName = k => M.KIT.find(i=>i.k===k).t;
    const add = (icon, title, items, ok) => G.push({icon, title, items, ok});

    // ๑ รายงาน
    const rep = [];
    if(sel.site!==T.site) rep.push(`<b>แหล่งโรค</b> — คุณตอบ “${nm(sel.site)}” ที่ถูกคือ “${nm(T.site)}”${s.type==='ICE'&&s.iceVenues.includes(sel.site)?' (ร้านที่คุณเลือกเป็นแค่ทางผ่านของน้ำแข็ง)':''}`);
    if(sel.route!==T.route) rep.push(`<b>ช่องทางการแพร่</b> — คุณตอบ “${lab(ROUTES,sel.route)}” ที่ถูกคือ “${lab(ROUTES,T.route)}”`);
    if(sel.path!==T.pathogen) rep.push(`<b>เชื้อก่อโรค</b> — คุณตอบ ${M.PATHOGENS[sel.path].name} ที่ถูกคือ ${M.PATHOGENS[T.pathogen].name}${S.labs.some(l=>l.kind==='stool')?'':' (ไม่ได้ส่งตรวจอุจจาระผู้ป่วยเลย)'}`);
    if(sel.p2p!==T.p2p) rep.push(`<b>การแพร่คนสู่คน</b> — ที่ถูกคือ “${T.p2p==='yes'?'มีชัดเจน':'ไม่เด่นชัด'}” (ผู้ป่วยติดจากคนในบ้าน ${U.pct(T.secShare)})`);
    if(sel.pattern!==T.pattern) rep.push(`<b>รูปแบบการระบาด</b> — คุณตอบ “${lab(PATTERNS,sel.pattern)}” ที่ถูกคือ “${lab(PATTERNS,T.pattern)}”`);
    const picked = R.picked;
    const misE = picked.filter(e=>e.rel==='mis'), noneE = picked.filter(e=>e.rel==='none');
    if(misE.length) rep.push(`<b>ปักหลักฐานที่ชี้ผิดทาง ${th(misE.length)} ข้อ</b>: ${misE.map(e=>`“${short(e.text)}”`).join(' · ')} — ปัจจัยที่สูงเพราะบังเอิญ ตัวแปรกวน ข่าวลือ หรือหลักฐานที่พูดถึงสถานที่อื่น ไม่ควรใช้สนับสนุนข้อสรุป`);
    if(noneE.length) rep.push(`<b>ปักหลักฐานที่ไม่เกี่ยวกับข้อสรุป ${th(noneE.length)} ข้อ</b>: ${noneE.map(e=>`“${short(e.text)}”`).join(' · ')}`);
    const missStrong = evs.filter(e=>e.rel==='strong' && links.get(e.id)!==T.site);
    if(missStrong.length) rep.push(`<b>มีหลักฐานสำคัญแต่ไม่ได้ปักกับต้นตอจริง ${th(missStrong.length)} ข้อ</b>: ${missStrong.map(e=>`“${short(e.text)}”`).join(' · ')}`);
    if(sel.site===T.site && !R.tri) rep.push('<b>หลักฐานยังไม่ครบ ๓ ด้าน</b> — แหล่งโรคที่หนักแน่นควรมีทั้ง 📊 สถิติ (OR) · 🔎 สิ่งแวดล้อม · 🧪 ห้องปฏิบัติการ');
    if(s.confound && links.get('or-'+s.confound)) rep.push(`<b>OR ของ${nm(s.confound)}เป็นตัวแปรกวน</b> — คนหมู่บ้านเดียวกับผู้ใช้${nm(s.culprit)}นิยมกินร้านนี้ ลองแตะแถวในตาราง OR เพื่อแยกวิเคราะห์ตามหมู่บ้าน`);
    const missEss = essential(W).filter(k=>!sel.meas.has(k));
    if(missEss.length) rep.push(`<b>มาตรการสำคัญที่ขาด</b>: ${missEss.map(k=>lab(MEAS,k)).join(' · ')}`);
    const missGood = ['active','comm','surv'].filter(k=>!sel.meas.has(k));
    if(missGood.length) rep.push(`<b>มาตรการที่ควรมีในทุกการระบาด</b>: ${missGood.map(k=>lab(MEAS,k)).join(' · ')}`);
    const badM = BAD.filter(k=>sel.meas.has(k));
    if(badM.length) rep.push(`<b>มาตรการที่ไม่ควรใช้</b>: ${badM.map(k=>lab(MEAS,k)).join(' · ')}`);
    const limBad = LIMITS.filter(l=>sel.lim.has(l[0]) && !l[2]), limOk = LIMITS.filter(l=>sel.lim.has(l[0]) && l[2]);
    if(limBad.length) rep.push(`<b>ข้อจำกัดที่ไม่ถูกต้อง</b>: ${limBad.map(l=>`“${l[1]}”`).join(' · ')}`);
    else if(limOk.length<3) rep.push(`<b>ระบุข้อจำกัดน้อยไป</b> (${th(limOk.length)} ข้อ) — เช่น อคติจากการระลึก การรายงานไม่ครบ ความไวของแล็บ`);
    add('📝', 'รายงานสอบสวนโรค', rep, 'ตอบรายงานถูกครบทุกข้อ');

    // ๒ หลักฐาน
    const ev = [];
    if(S.flags.kitMiss && S.flags.kitMiss.length) ev.push(`<b>ลืมนำอุปกรณ์</b>: ${S.flags.kitMiss.map(kitName).join(' · ')}`);
    if(S.flags.kitBad && S.flags.kitBad.length) ev.push(`<b>หยิบของที่ไม่ควรนำไป</b>: ${S.flags.kitBad.map(kitName).join(' · ')}`);
    if(!S.controls.length) ev.push('<b>ไม่ได้เก็บกลุ่มควบคุม</b> — ไม่มี Odds Ratio ยืนยันทางสถิติว่าสัมผัสอะไรแล้วเสี่ยง');
    if(!S.hyp.some(x=>related(W).includes(x))) ev.push('<b>สมมติฐานไม่ครอบคลุมแหล่งโรคจริง</b> — ใช้ข้อมูลเวลา–สถานที่–บุคคลช่วยตั้งสมมติฐาน');
    if((s.type==='ICE' || s.type==='FARM') && !S.supply && !S.known.has(src)) ev.push(`<b>ไม่ได้ขอข้อมูลห่วงโซ่อุปทาน</b> — ทางเดียวที่จะเห็นว่าหลายแห่งใช้${s.type==='ICE'?'น้ำแข็ง':'ผักสด'}จากแหล่งเดียวกัน`);
    if(!S.inspected[src]) ev.push(`<b>ไม่ได้ตรวจสิ่งแวดล้อมที่${nm(src)}</b> ซึ่งเป็นต้นตอจริง`);
    const envSrc = S.labs.filter(l=>l.kind==='env' && l.site===src);
    const okTypes = M.rightSamples(s), rightType = okTypes && okTypes[0], typeName = {food:'ตัวอย่างอาหาร', swab:'swab มือแม่ครัว', water:'ตัวอย่างน้ำดื่ม', E_kj:'น้ำยาขนมจีน', E_lb:'ลาบหมู', E_ds:'ลอดช่อง'};
    if(!envSrc.length) ev.push(`<b>ไม่ได้ส่งตัวอย่างจาก${nm(src)}ตรวจแล็บ</b>${s.type==='EVENT'?' — อาหารที่เหลือจากงานเก็บได้ถึง พฤ. ๒๖ พ.ย. ๑๔:๐๐ น. เท่านั้น ต้องรีบเก็บตั้งแต่วันแรก':''}`);
    else if(envSrc.every(l=>!l.pos)) ev.push(okTypes && envSrc.every(l=>!okTypes.includes(l.type))
      ? `<b>ส่งตัวอย่างผิดชนิด</b> — จาก${nm(src)}ควรส่ง${typeName[rightType]}`
      : `<b>ตัวอย่างจาก${nm(src)}ให้ผลลบเทียม</b> — ความไวของการตรวจไม่ถึง ๑๐๐%${S.flags.kitMiss&&S.flags.kitMiss.some(k=>['cold','bottle'].includes(k))?' (และไม่ได้นำอุปกรณ์เก็บตัวอย่างที่ถูกต้องมา)':''} ควรส่งซ้ำหรือใช้หลักฐานด้านอื่นประกอบ`);
    if(!S.labs.some(l=>l.kind==='stool')) ev.push('<b>ไม่ได้ส่งตรวจอุจจาระผู้ป่วย</b> — จึงไม่มีผู้ป่วยยืนยัน และไม่รู้เชื้อแน่ชัด');
    if(S.acfAt==null) ev.push('<b>ไม่ได้ค้นหาผู้ป่วยเชิงรุก</b> — พลาดผู้ป่วยอาการน้อยที่ไม่ไปโรงพยาบาลราว ๑ ใน ๓');
    add('🔎', 'การเก็บหลักฐาน', ev, 'เก็บหลักฐานครบทั้งสถิติ สิ่งแวดล้อม และห้องปฏิบัติการ');

    // ๓ ขั้นตอน
    add('✅', 'ขั้นตอนการสอบสวน ๑๐ ขั้น', OD.checklist.STEPS.filter(x=>!x.done(W,S)).map(x=>`<b>ขั้นที่ ${th(x.n)} ${x.t}</b> — ${x.how}`), 'ทำครบทั้ง ๑๐ ขั้นตอน');

    // ๔ การตัดสินใจระหว่างเหตุการณ์
    const decs = S.decisions.map(d=>OD.story.resolve(W,S,d));
    add('🎭', 'การตัดสินใจระหว่างเหตุการณ์', decs.filter(d=>d.verdict==='bad'||d.verdict==='mixed')
      .map(d=>`${d.verdict==='bad'?'❌':'⚠️'} <b>${d.title}</b> — คุณเลือก “${d.choice}”: ${d.why}`), 'ตัดสินใจได้เหมาะสมทุกเหตุการณ์');

    // ๕ ข้อมูล
    const dm = S.mistakes.map(m=>`<b>${m.area==='ch1'?'บทที่ ๑':'บทที่ ๒'} · ${short(m.title)}</b> — คุณเลือก “${short(m.chosen)}” ที่เหมาะสมคือ “${short(m.correct)}”`);
    if(S.flags.quick) dm.unshift({tip:true, t:'<b>ข้ามบทที่ ๑–๒</b> (ลงพื้นที่ทันที) — ลองเล่นแบบ “เริ่มเรื่อง” เพื่อฝึกยืนยันการระบาดด้วยค่ามัธยฐาน และการทำความสะอาดข้อมูล'});
    add('🧹', 'ข้อมูล (บทที่ ๑–๒)', dm, 'ยืนยันการระบาดและทำความสะอาดข้อมูลได้ถูกต้อง');

    // ๖ เวลาและผลกระทบ
    const im = [], fest = OD.story.festCases(W,S), extra = R.oc.actual - R.oc.best;
    // ควบคุมได้เร็วพอแล้ว (คะแนนความรวดเร็ว ≥ ๗๕%) → เป็นข้อสังเกต ไม่นับว่าพลาด
    if(s.type!=='EVENT' && extra>0){ const t = `<b>ผู้ป่วยทั้งหมด ${R.oc.actual} ราย</b> — ถ้าปิดแหล่งโรคตั้งแต่เช้าวันแรกที่ลงพื้นที่ จะเหลือประมาณ ${R.oc.best} ราย (ป้องกันเพิ่มได้อีก ${extra} ราย)`;
      im.push(R.C.time >= 130*.75 ? {tip:true, t} : t); }
    if(fest && S.flags.festival!=='safe') im.push(`<b>${M.FEST.short}ทำให้เกิดผู้ป่วยระลอกใหม่ ${fest} ราย</b> — แหล่งโรคเดิมยังไม่ถูกควบคุมในวันงาน และไม่มีมาตรการสุขาภิบาลอาหารในงาน`);
    if(R.wrongClosed.length) im.push(`<b>ปิดแหล่งที่ไม่ใช่ต้นตอ ${R.wrongClosed.length} แห่ง</b>: ${R.wrongClosed.map(id=>nm(id)+(M.wasReopened(S,id)?' (เปิดคืนภายหลัง)':'')).join(', ')}`);
    if(S.reopened[src]!=null) im.push(`<b>ยอมเปิด${nm(src)}คืนก่อนแก้ไข</b> — เชื้อกลับมาแพร่ต่อ`);
    if(T.p2p==='yes' && S.hygieneAt==null) im.push('<b>ไม่ได้รณรงค์ล้างมือ</b> ทั้งที่มีการแพร่คนสู่คนในครัวเรือนชัดเจน');
    if(S.flags.timeout) im.push('<b>ส่งรายงานไม่ทันเส้นตาย</b> — ทีมส่วนกลางต้องเข้ามารับช่วง');
    if(S.trust<40) im.push(`<b>ความเชื่อมั่นชุมชนเหลือ ${Math.round(S.trust)}</b> — ชาวบ้านตอบแบบสอบถามคลาดเคลื่อนมากขึ้น`);
    add('⏱️', 'เวลาและผลกระทบต่อชุมชน', im, 'ควบคุมการระบาดได้ทันเวลา ชุมชนยังเชื่อมั่นในทีม');

    // ๗ เครื่องมือ HDS — เป็นข้อแนะนำ (💡) ไม่นับเป็นจุดพลาด
    const f = S.flags, hds = [], tip = t => hds.push({tip:true, t});
    if(!f.vML) tip('<b>ยังไม่ได้ใช้แท็บ 🤖 ML</b> — logistic regression ให้ OR ที่ปรับตัวแปรอื่นแล้ว (แยกตัวแปรกวนได้หลายตัวพร้อมกัน) และ decision tree ช่วยหาคำถามที่แยกผู้ป่วยได้ดีที่สุด');
    else if(!f.treeBest) tip('<b>ลองเลื่อนความลึกของ decision tree</b> หาจุดที่ความแม่นยำแบบ cross-validation สูงสุด — ลึกเกินไปจะ overfit');
    if(s.confound && f.vML && !(S.ui && S.ui.mlVil)) tip(`<b>คดีนี้มีตัวแปรกวน</b> — ลองติ๊ก “ปรับตามหมู่บ้าน” ใน logistic regression แล้วดู OR ของ${nm(s.confound)}ลดลง`);
    if(!f.vSpatial) tip('<b>ยังไม่ได้ใช้ 🧭 วิเคราะห์เชิงพื้นที่</b> — DBSCAN หากลุ่มผู้ป่วย และแผนที่อัตราป่วยต่อประชากรแยก “คนเยอะ” ออกจาก “เสี่ยงสูง”');
    if(!f.nlpDone) tip('<b>ยังไม่ได้ใช้ 📱 ฟังเสียงโซเชียล</b> — ข่าวลือถูกแชร์มากกว่าประสบการณ์จริง ต้องจำแนกข้อความก่อนนับ');
    else if(f.nlpAcc<7) tip(`<b>ติดป้ายข้อมูลฝึก NLP ถูก ${th(f.nlpAcc)}/๙</b> — ป้ายที่ผิดสอนให้โมเดลเรียนรู้ผิด (garbage in, garbage out)`);
    if(f.aiMet && !f.aiHallu) tip('<b>ลองถาม 🤖 ผู้ช่วย AI ว่า “มีงานวิจัยยืนยันไหม”</b> แล้วกดตรวจสอบแหล่งอ้างอิง — AI ภาษาอาจแต่งข้อมูลที่ไม่มีจริง (hallucination)');
    const fc = OD.ai.fcScore(S);
    if(fc.n<2) tip('<b>ลองเกม 🔮 พยากรณ์ในรายงานเช้า</b> — เลือกโมเดลแล้ววันรุ่งขึ้นดูว่าแม่นแค่ไหน (backtesting)');
    if(!f.coder) tip('<b>ดาวน์โหลดข้อมูลคดีนี้</b> (CSV · Jupyter Notebook · R) ไปฝึกวิเคราะห์ต่อ หรือลอง SQL console ในแท็บ 🤖 ML');
    add('🤖', 'เครื่องมือ HDS (ML · AI · ข้อมูล)', hds, hds.length ? 'ไม่มีจุดพลาดในส่วนนี้ — ลองเครื่องมือที่ยังไม่ได้ใช้ในคดีหน้า' : 'ใช้เครื่องมือ HDS ครบทุกชิ้น');

    // สิ่งที่ทำได้ดี
    const good = [];
    if(sel.site===T.site) good.push('ระบุแหล่งโรคถูก'); if(sel.path===T.pathogen) good.push('ระบุเชื้อถูก');
    if(S.controls.length) good.push('ทำ case-control'); if(S.acfAt!=null) good.push('ค้นหาผู้ป่วยเชิงรุก');
    if(envSrc.some(l=>l.pos)) good.push('แล็บยืนยันแหล่งโรค'); if(S.confirmed.size) good.push('มีผู้ป่วยยืนยัน');
    decs.filter(d=>d.verdict==='good').forEach(d=>good.push(d.title));
    // แยก "ข้อสังเกต" (💡 ไม่นับเป็นจุดพลาด) ออกจากจุดที่พลาดจริง
    for(const g of G){ g.tips = g.items.filter(i=>i && i.tip).map(i=>i.t); g.items = g.items.filter(i=>!(i && i.tip)); }
    const misses = G.reduce((a,g)=>a+g.items.length,0);
    return {groups:G, good, misses, decisions:decs};
  }

  function result(W,S,R,sel){
    const s = W.scn, T = R.T;
    const days = Array.from({length:16},(_,i)=>i+1);
    const none = days.map(d=>W.people.filter(p=>p.inf!==null && p.onset<=M.HORIZON && p.onsetDay===d).length);
    const real = days.map(d=>W.people.filter(p=>p.inf!==null && p.onset<=M.HORIZON && p.onsetDay===d && M.effective(W,S,p)).length);
    const marks = [{at:R.Tr/24, label:'📝 ส่งรายงาน'}].concat(Object.entries(S.closed).filter(([,t])=>t<R.Tr).map(([id,t],i)=>({at:t/24, label:`ปิด${nm(id)}`, row:i+1})));
    if(S.flags.festival && S.flags.festival!=='cancel') marks.push({at:M.FEST_T/24, label:`${M.FEST.icon} ${M.FEST.short}`, row:marks.length});
    const D = R.debrief, cons = OD.story.consequences(W,S,R);
    const CAT = [['source','แหล่งโรค',200],['route','ช่องทางการแพร่',70],['path','เชื้อก่อโรค',70],['p2p','การแพร่คนสู่คน',30],['pattern','รูปแบบการระบาด',30],
      ['evidence','คุณภาพหลักฐาน',110],['measures','มาตรการควบคุม',130],['time','ความรวดเร็ว/ป้องกันผู้ป่วย',130],['process','ทำตามขั้นตอนการสอบสวน',80],['data','คุณภาพข้อมูล (บทที่ ๑–๒)',70],
      ['decisions','การตัดสินใจในเหตุการณ์',40],['trust','ความเชื่อมั่นชุมชน',30],['budget','การใช้งบประมาณ',10]];
    const SUB = {handler:'แม่ครัวที่ป่วย', food:'อาหารกลางวันเก็บผิดอุณหภูมิ', tank:'แท็งก์น้ำดื่มปนเปื้อน'};
    const story = s.type==='EVENT' ? `${M.SITES.E.name} — ${M.DISH[s.dish]}` : s.type==='SCHOOL' ? `${nm(s.culprit)} — ${SUB[s.sub]}` : nm(s.culprit);
    const MT = R.meta || {fresh:[]};
    U.$('#scr-result').innerHTML = `<div class="res">
      <div class="res-hero"><div class="title-eyebrow">ผลการสอบสวนโรค · คดีที่ ${U.thaiNum(W.seed%10000)}${S.flags.daily?' · 📅 คดีประจำวัน':''}</div>
        <h1 class="display gold-text">${R.correctSource?'ไขคดีสำเร็จ':'คดียังไม่คลี่คลาย'}</h1>
        ${MT.dailyRank ? `<div class="chip gold" style="font-size:14px;padding:3px 14px">🏆 อันดับ ${MT.dailyRank} ของวันนี้</div>` : ''}</div>
      ${MT.fresh.length ? `<div class="frame ach-new"><h3 class="display gold-text" style="font-size:22px;margin:0 0 8px">ได้รับเหรียญใหม่!</h3>
        <div class="ach-grid">${MT.fresh.map((a,i)=>`<div class="ach on pop" style="animation-delay:${.5+i*.1}s"><span class="ai">${a.icon}</span><b>${a.t}</b><small>${a.d}</small></div>`).join('')}</div></div>` : ''}
      <div class="res-top">
        <div class="frame" style="text-align:center">${OD.meFace(R.correctSource?'smile':'worried','lg')}<div class="seal stamp"><div class="r">${R.rank}</div><div class="s">ระดับ</div></div>
          <div class="score" data-to="${R.total}">0</div><div class="muted">คะแนนจาก ๑,๐๐๐</div><div style="margin-top:6px;font-weight:700;color:var(--gold-2)">${R.title}</div>
          <div class="faint" style="font-size:13px;margin-top:4px">${M.DIFF[S.diff].label}${R.badDec && R.total>=880 ? ' · ไม่ได้ระดับ S เพราะมีการตัดสินใจที่ผิดในเหตุการณ์' : ''}</div></div>
        <div class="frame"><h3 class="display gold-text" style="font-size:22px">เฉลยคดี</h3>
          <p style="margin:4px 0"><b>แหล่งโรค:</b> ${story} <span class="chip">${M.SCN_NAME[s.type]}</span> ${sel.site===T.site?'<span class="chip jade">คุณตอบถูก</span>':`<span class="chip red">คุณตอบ: ${nm(sel.site)}</span>`}</p>
          <p style="margin:4px 0"><b>เชื้อ:</b> ${M.PATHOGENS[s.pathogen].name} ${sel.path===s.pathogen?'<span class="chip jade">ถูก</span>':'<span class="chip red">ผิด</span>'}</p>
          <p style="margin:4px 0"><b>รูปแบบ:</b> ${PATTERNS.find(p=>p[0]===T.pattern)[1]} · การแพร่คนสู่คน ${U.pct(T.secShare)} ของผู้ป่วย</p>
          ${s.type==='ICE'?`<p style="margin:4px 0"><b>ที่ใช้น้ำแข็งจากโรงน้ำแข็งเจริญผล:</b> ${s.iceVenues.map(nm).join(', ')}</p>`:''}
          ${s.type==='FARM'?`<p style="margin:4px 0"><b>ที่รับผักจากสวนผักลุงทอง:</b> ${s.vegVenues.map(nm).join(', ')}</p>`:''}
          ${s.confound?`<p style="margin:4px 0"><b>ตัวแปรกวน:</b> ${nm(s.confound)} — คนหมู่บ้านเดียวกับผู้ใช้${nm(s.culprit)}นิยมกินร้านนี้</p>`:''}
          <div class="orn-divider"></div>
          <div class="cats">${CAT.map(([k,l,mx])=>`<div class="cat"><span>${l}</span><div class="meter ${R.C[k]/mx<.4?'red':''}"><i style="width:${R.C[k]/mx*100}%"></i></div><span class="v">${R.C[k]}/${mx}</span></div>`).join('')}</div></div>
      </div>
      <div class="frame" style="margin-top:14px"><h3 class="display gold-text" style="font-size:22px">เส้นโค้งการระบาดถึงวันที่ ๑๖</h3>
        <div class="legend"><span><i style="background:var(--red-2);border-radius:2px"></i>ผู้ป่วยจริง ${R.oc.actual} ราย</span><span><i style="border:1.5px dashed var(--faint);border-radius:2px;background:none"></i>ถ้าไม่ทำอะไรเลย ${R.oc.none} ราย</span><span>ป้องกันได้ <b style="color:var(--ok)">${R.oc.prevented}</b> ราย</span></div>
        ${OD.barChart({labels:days.map(d=>String(M.dateOf(d).getDate())), vals:real, ghost:none, marks, w:900, h:260, xt:'วันที่เริ่มป่วย'})}</div>
      ${cons.length ? `<div class="frame" style="margin-top:14px"><h3 class="display gold-text" style="font-size:22px">เรื่องราวหลังจากนั้น</h3>
        <div class="muted" style="font-size:13.5px;margin-bottom:6px">ผลจากการตัดสินใจของคุณระหว่างการสอบสวน</div>
        <ul class="cons">${cons.map(c=>`<li class="${c.ok?'ok':'bad'}"><span class="ci">${c.ok?'✦':'✧'}</span>${c.text}</li>`).join('')}</ul></div>` : ''}
      <div class="frame debrief" style="margin-top:14px">
        <div class="db-head"><h3 class="display gold-text" style="font-size:24px;margin:0">สรุปว่าคุณพลาดอะไรบ้าง</h3>
          <span class="db-total ${D.misses?'':'zero'}">${D.misses ? `พลาด <b>${D.misses}</b> จุด` : 'ไม่พลาดเลย!'}</span></div>
        <div class="db-grid">${D.groups.map(g=>`<section class="db-g ${g.items.length?'has':'clean'}">
          <h4><span>${g.icon}</span>${g.title}<span class="chip ${g.items.length?'red':'jade'}">${g.items.length?`พลาด ${g.items.length}`:'ผ่าน'}</span></h4>
          ${g.items.length ? `<ul>${g.items.map(i=>`<li>${i}</li>`).join('')}</ul>` : `<p class="db-ok">✅ ${g.ok}</p>`}
          ${g.tips.length ? `<ul class="db-tips">${g.tips.map(i=>`<li>💡 ${i}</li>`).join('')}</ul>` : ''}</section>`).join('')}</div>
        ${D.good.length ? `<div class="db-good"><b>สิ่งที่ทำได้ดี:</b> ${D.good.map(g=>`<span class="chip jade">${g}</span>`).join(' ')}</div>` : ''}
        ${D.decisions.length ? `<details class="howto" style="margin-top:12px"><summary>ไทม์ไลน์การตัดสินใจทั้งหมด (${D.decisions.length})</summary><ul class="db-tl">${D.decisions.map(d=>`<li><span class="lt">${M.fmtT(d.t)}</span><span>${{good:'✅',ok:'➖',mixed:'⚠️',bad:'❌'}[d.verdict]||'➖'} <b>${d.title}</b> — ${d.choice}${d.why?`<br><span class="muted">${d.why}</span>`:''}</span></li>`).join('')}</ul></details>` : ''}
      </div>
      <h2 class="display gold-text" style="margin-top:22px;font-size:26px">ทักษะของนักวิทยาศาสตร์ข้อมูลสุขภาพที่คุณได้ใช้</h2>
      <div class="skills">${(()=>{ const f = S.flags, fc = OD.ai.fcScore(S); return [
        ['📊','ชีวสถิติ','ค่ามัธยฐาน Odds Ratio ช่วงความเชื่อมั่น การแยกวิเคราะห์ Mantel–Haenszel และปัญหาการเปรียบเทียบหลายครั้ง', !!f.vOR],
        ['🦠','ระบาดวิทยาและการแพทย์','นิยามผู้ป่วย case-control เส้นโค้งการระบาด ระยะฟักตัว ตัวแปรกวน เชื้อก่อโรค และความไวของการตรวจทางห้องปฏิบัติการ', S.controls.length>0],
        ['🧹','การจัดการข้อมูล','รวมข้อมูลหลายแหล่ง ตัดข้อมูลซ้ำ แปลงรูปแบบวันที่ จัดการค่าว่างโดยไม่ทิ้งข้อมูลจริง', !f.quick],
        ['🤖','Machine Learning','Logistic regression หลายตัวแปร (OR ที่ปรับแล้ว) · decision tree · cross-validation · AUC · overfitting', !!f.vML],
        ['🚨','เฝ้าระวังอัตโนมัติและพยากรณ์','ตรวจจับความผิดปกติด้วย EARS / CUSUM · ความไวกับการเตือนผิด · พยากรณ์ผู้ป่วยและวัดความคลาดเคลื่อน (MAE)', !!f.alarm || fc.n>0],
        ['📱','NLP และ AI อย่างรับผิดชอบ','ตัดคำภาษาไทย · Naive Bayes · คุณภาพป้ายข้อมูล · model card · hallucination · automation bias', !!(f.nlpDone || f.aiAsked)],
        ['🗺️','ข้อมูลเชิงพื้นที่','แผนที่ผู้ป่วยและกลุ่มควบคุม · DBSCAN จับกลุ่ม · KDE · อัตราป่วยต่อประชากร', !!f.vSpatial],
        ['💻','โปรแกรมและฐานข้อมูล','SQL · ส่งออก CSV · Python (pandas · statsmodels · scikit-learn) · R', !!f.coder],
        ['⚖️','จริยธรรมและการสื่อสาร','PDPA การสื่อสารความเสี่ยง การตัดสินใจภายใต้แรงกดดันโดยยึดหลักฐาน', S.decisions.length>0],
      ]; })().map(([i,t,d,u])=>`<div class="frame tight skill ${u?'used':''}"><div class="ic">${i}</div><h4>${t}${u?' <span class="chip jade">ใช้ในคดีนี้</span>':''}</h4><p>${d}</p></div>`).join('')}</div>
      <div class="frame" style="margin-top:16px;text-align:center"><p style="margin:0">สนใจงานแบบนี้? <b>หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์ข้อมูลสุขภาพ</b><br><span class="muted">ราชวิทยาลัยจุฬาภรณ์</span></p>
        <div class="title-actions"><button class="btn btn-gold btn-lg" id="resAgain">🔄 คดีใหม่</button><button class="btn btn-lg" id="resData">💻 ดาวน์โหลดข้อมูลไปวิเคราะห์ต่อ</button><button class="btn btn-lg" id="resStats">🏆 สถิติและเหรียญ</button><button class="btn btn-lg" id="resHome">กลับหน้าแรก</button></div></div>
    </div>`;
    U.show('scr-result');
    OD.music.setMood(R.correctSource ? 'ending' : 'night');
    U.$('#resData').onclick = ()=>OD.mlViews.downloadModal(W,S);
    U.$('#resAgain').onclick = ()=>OD.main.newCase();
    U.$('#resHome').onclick = ()=>OD.main.title();
    U.$('#resStats').onclick = ()=>OD.meta.open();
    // นับคะแนนขึ้น · ประทับตราระดับ · เสียงเหรียญ
    const sc = U.$('#scr-result .score'), to = +sc.dataset.to, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now-t0)/1100); sc.textContent = Math.round(to*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    setTimeout(()=>OD.sfx && OD.sfx('stamp'), 650);
    if(MT.fresh.length) setTimeout(()=>OD.sfx && OD.sfx('chime'), 950);
  }

  async function run(){
    const W = OD.W, S = OD.S;
    await OD.vn.play(OD.story.reportIntro(W,S));
    // กระดานสืบสวน ↔ แบบฟอร์มรายงาน (กลับไปแก้กระดานได้)
    const evs = evidenceItems(W,S), links = new Map();
    let sel = null;
    for(;;){
      await OD.board.run(W,S,evs,links);
      const r = await form(W,S,evs,links,sel); sel = r.sel;
      if(!r.back) break;
    }
    const R = score(W,S,sel,evs,links);
    R.timeout = !!S.flags.timeout;
    R.lesson = R.L[0];
    R.score = R.total;
    R.debrief = debrief(W,S,R,sel,evs,links);
    R.misses = R.debrief.misses;
    R.meta = OD.meta.record(W,S,R,sel);
    await OD.vn.play(OD.story.ending(W,S,R));
    result(W,S,R,sel);
  }
  return {run, truth, related};
})();
