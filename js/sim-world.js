/* =========================================================
   sim-world — โลกจำลอง: หมู่บ้าน ครัวเรือน การสัมผัส เชื้อ และการติดเชื้อ
   เวลาเป็นชั่วโมงนับจาก วันที่ 1 (ส. 21 พ.ย. 2569) 00:00
   ========================================================= */
window.OD = window.OD || {};
OD.sim = OD.sim || {};

(function(M){
  const U = OD.u;
  M.T0 = 104;         // วันที่ 5 (พ. 25 พ.ย.) 08:00 — เริ่มลงพื้นที่
  M.DEADLINE = 248;   // วันที่ 11 (อ. 1 ธ.ค.) 08:00
  M.HORIZON = 384;    // สิ้นวันที่ 16
  M.FEST_T = 179;     // งานทอดกฐินที่วัด ส. 28 พ.ย. (วันที่ 8) 11:00
  // วันที่ 0 = ศ. 20 พ.ย. — แม่ครัวป่วยตั้งแต่ พฤ. 19 พ.ย. เด็กจึงเริ่มติดเชื้อตั้งแต่ศุกร์ก่อนวันที่ ๑
  M.SCHOOL_DAYS = [0,3,4,5,6,7,10,11,12,13,14];
  const DAY0 = new Date(2026, 10, 21); // 21 พ.ย. 2026
  const WD = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
  const MO = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  M.dayOf = t => Math.floor(t/24)+1;
  M.dateOf = day => { const d = new Date(DAY0); d.setDate(d.getDate()+day-1); return d; };
  M.fmtDay = day => { const d = M.dateOf(day); return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`; };
  M.fmtT = t => `${M.fmtDay(M.dayOf(t))} ${String(Math.floor(t%24)).padStart(2,'0')}:00 น.`;
  M.fmtDateBE = (day, ce=false) => { const d = M.dateOf(day); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${ce?d.getFullYear():d.getFullYear()+543}`; };

  M.VILLAGES = [
    {id:1, name:'หมู่ ๑ บ้านทุ่ง',    short:'บ้านทุ่ง',    x:185, y:150, sx:62, sy:48},
    {id:2, name:'หมู่ ๒ บ้านวัด',     short:'บ้านวัด',     x:470, y:140, sx:58, sy:44},
    {id:3, name:'หมู่ ๓ บ้านตลาด',    short:'บ้านตลาด',    x:820, y:262, sx:56, sy:52},
    {id:4, name:'หมู่ ๔ บ้านริมคลอง', short:'บ้านริมคลอง', x:270, y:532, sx:72, sy:48},
    {id:5, name:'หมู่ ๕ บ้านสวน',     short:'บ้านสวน',     x:690, y:470, sx:70, sy:42},
  ];
  M.SITES = {
    W1:{type:'water', icon:'💧', name:'บ่อน้ำวัด',              x:560, y:212},
    W2:{type:'water', icon:'💧', name:'บ่อน้ำตลาด',             x:735, y:345},
    W3:{type:'water', icon:'💧', name:'บ่อน้ำริมคลอง',          x:215, y:425},
    R1:{type:'food',  icon:'🥗', name:'ร้านส้มตำป้าแดง',        x:105, y:262, pop:.10},
    R2:{type:'food',  icon:'🍜', name:'ก๋วยเตี๋ยวเรือลุงชัย',   x:450, y:452, pop:.07},
    R3:{type:'food',  icon:'🍗', name:'ข้าวมันไก่เจ๊หมวย',      x:905, y:160, pop:.05},
    R4:{type:'food',  icon:'🥓', name:'หมูกระทะริมทุ่ง',        x:860, y:478, pop:.07},
    S: {type:'school',icon:'🏫', name:'โรงอาหารโรงเรียน',       x:395, y:292},
    E: {type:'event', icon:'🛕', name:'งานบวชที่วัด',            x:640, y:96},
    F1:{type:'ice',   icon:'🧊', name:'โรงน้ำแข็งเจริญผล',      x:948, y:610, hidden:true},
    F2:{type:'ice',   icon:'🧊', name:'โรงน้ำแข็งสายชล',        x:62,  y:610, hidden:true},
    F3:{type:'farm',  icon:'🥬', name:'สวนผักลุงทอง',           x:470, y:630, hidden:true},
  };
  M.SUPPLIERS = ['F1','F2','F3'];
  M.SCN_TYPES = ['WELL','REST','ICE','SCHOOL','EVENT','FARM'];
  M.SCN_NAME = {WELL:'บ่อน้ำ', REST:'ร้านอาหาร', ICE:'โรงน้ำแข็ง', SCHOOL:'โรงเรียน', EVENT:'งานเลี้ยง', FARM:'สวนผัก'};
  M.DISH = {E_kj:'ขนมจีนน้ำยา', E_lb:'ลาบหมู', E_ds:'ลอดช่องน้ำกะทิ'};
  M.EXPOSURES = [
    {k:'W1', g:'น้ำดื่ม', label:'ดื่มน้ำบ่อวัด'}, {k:'W2', g:'น้ำดื่ม', label:'ดื่มน้ำบ่อตลาด'},
    {k:'W3', g:'น้ำดื่ม', label:'ดื่มน้ำบ่อริมคลอง'}, {k:'BOT', g:'น้ำดื่ม', label:'ดื่มน้ำขวด/น้ำถัง'},
    {k:'R1', g:'ร้านอาหาร', label:'กินร้านส้มตำป้าแดง'}, {k:'R2', g:'ร้านอาหาร', label:'กินก๋วยเตี๋ยวเรือลุงชัย'},
    {k:'R3', g:'ร้านอาหาร', label:'กินข้าวมันไก่เจ๊หมวย'}, {k:'R4', g:'ร้านอาหาร', label:'กินหมูกระทะริมทุ่ง'},
    {k:'S', g:'โรงเรียน', label:'กินอาหารกลางวันที่โรงเรียน'},
    {k:'E', g:'งานบวช', label:'ไปงานบวชที่วัด'}, {k:'E_kj', g:'งานบวช', label:'งานบวช: ขนมจีนน้ำยา'},
    {k:'E_lb', g:'งานบวช', label:'งานบวช: ลาบหมู'}, {k:'E_ds', g:'งานบวช', label:'งานบวช: ลอดช่องน้ำกะทิ'},
    {k:'ICE', g:'อาหารอื่น ๆ', label:'ดื่มเครื่องดื่มใส่น้ำแข็งนอกบ้าน'},
    {k:'SEA', g:'อาหารอื่น ๆ', label:'กินอาหารทะเลดิบ/ปูดอง'}, {k:'VEG', g:'อาหารอื่น ๆ', label:'กินผักสด'},
    {k:'HH', g:'บุคคล', label:'มีคนในบ้านป่วยท้องร่วงก่อนหน้า'},
    {k:'FEST', g:'งานกฐิน', label:'ไปงานกฐินที่วัด (ส. ๒๘ พ.ย.)'},
  ];
  /* งานใหญ่วันเสาร์ที่ ๒๘ พ.ย. — สุ่มชนิดงานต่อคดี (เปลี่ยนชื่อข้อคำถามตามงาน) */
  M.FESTS = {
    kathin: {name:'งานทอดกฐินที่วัด', short:'งานกฐิน', icon:'🎪', place:'โรงทาน', label:'ไปงานกฐินที่วัด (ส. ๒๘ พ.ย.)'},
    wedding:{name:'งานแต่งงานลูกสาวกำนัน', short:'งานแต่ง', icon:'💒', place:'โต๊ะจีน', label:'ไปงานแต่งลูกสาวกำนัน (ส. ๒๘ พ.ย.)'},
  };
  M.FEST = M.FESTS.kathin;
  M.setFest = k => { M.FEST = M.FESTS[k] || M.FESTS.kathin; const x = M.EXPOSURES.find(e=>e.k==='FEST'); x.label = M.FEST.label; x.g = M.FEST.short; };
  /* ข้อคำถามที่ใช้ได้ ณ เวลานั้น — ถามเรื่องงานวันเสาร์ได้หลังงานจัดไปแล้วเท่านั้น */
  M.exposures = S => M.EXPOSURES.filter(x=>x.k!=='FEST' || (S.T>=M.FEST_T+6 && (S.flags||{}).festival!=='cancel'));
  M.PATHOGENS = {
    ETEC: {name:'อีโคไลก่อท้องร่วง (ETEC)', short:'อีโคไล', inc:[30,10,72], sec:.03, admit:.10,
           sym:{diar:.97, watery:.85, vomit:.20, fever:.15, cramp:.65, blood:.02}},
    VC:   {name:'อหิวาตกโรค (Vibrio cholerae O1)', short:'อหิวาต์', inc:[40,12,110], sec:.04, admit:.35,
           sym:{diar:1, watery:.98, vomit:.60, fever:.08, cramp:.40, blood:0}},
    SAL:  {name:'ซาลโมเนลลา (Salmonella spp.)', short:'ซาลโมเนลลา', inc:[24,6,72], sec:.03, admit:.18,
           sym:{diar:.95, watery:.50, vomit:.35, fever:.72, cramp:.75, blood:.10}},
    VP:   {name:'วิบริโอ พาราฮีโมไลติคัส (V. parahaemolyticus)', short:'วิบริโอ', inc:[15,4,30], sec:.01, admit:.12,
           sym:{diar:.96, watery:.70, vomit:.50, fever:.25, cramp:.85, blood:.05}},
    NORO: {name:'โนโรไวรัส (Norovirus)', short:'โนโรไวรัส', inc:[33,12,48], sec:.16, admit:.06,
           sym:{diar:.70, watery:.70, vomit:.88, fever:.35, cramp:.60, blood:0}},
  };
  M.SYMPTOMS = [['diar','ถ่ายเหลว'],['watery','ถ่ายเป็นน้ำ'],['vomit','อาเจียน'],['fever','ไข้'],['cramp','ปวดท้อง'],['blood','ถ่ายมีมูกเลือด']];

  /* ---------- สร้างฉากสถานการณ์ ---------- */
  /* เชื้อสุ่มตามความน่าจะเป็นของแต่ละแหล่ง — คำตอบจึงไม่ตายตัว ต้องดูผลแล็บ อาการ และระยะฟักตัวจริง */
  const P = o => U.wpick(Object.keys(o), Object.values(o));
  function makeScenario(forceType){
    const type = forceType || U.pick(M.SCN_TYPES);
    const s = {type};
    if(type==='WELL'){
      s.culprit = U.pick(['W1','W2','W3']);
      s.pathogen = s.culprit==='W3' ? P({VC:.5, ETEC:.35, NORO:.15}) : P({ETEC:.55, VC:.2, NORO:.25});
      // คดีหักมุม: ร้านอาหารในหมู่บ้านเดียวกับบ่อต้นตอมีคนกินเยอะผิดปกติ → OR สูงจากตัวแปรกวน (ต้องแยกวิเคราะห์ตามหมู่บ้าน)
      if(U.r() < .6) s.confound = U.pick(['R2','R3','R4']);
    }
    if(type==='REST'){
      s.culprit = U.pick(['R1','R2','R3','R4']);
      s.pathogen = {R1:{VP:.6, SAL:.2, NORO:.2}, R2:{ETEC:.5, SAL:.25, NORO:.25}, R3:{SAL:.75, ETEC:.25}, R4:{SAL:.6, ETEC:.2, NORO:.2}}[s.culprit]; s.pathogen = P(s.pathogen);
      s.key = {R1:'SEA', R2:'VEG'}[s.culprit] || null;
    }
    if(type==='ICE'){ s.culprit = 'F1'; s.pathogen = P({VC:.4, ETEC:.4, NORO:.2}); s.iceVenues = U.shuffle(['R1','R2','R3','R4']).slice(0,3); }
    // โรงเรียนมี ๓ แบบ: แม่ครัวป่วย (โนโร แพร่คนสู่คน) · อาหารเก็บผิดอุณหภูมิ · แท็งก์น้ำดื่มปนเปื้อน
    if(type==='SCHOOL'){ s.culprit = 'S'; s.sub = U.pick(['handler','food','tank']); s.pathogen = {handler:'NORO', food:P({SAL:.7, ETEC:.3}), tank:P({ETEC:.6, NORO:.4})}[s.sub]; }
    if(type==='EVENT'){ s.culprit = 'E'; s.dish = U.pick(['E_kj','E_ds','E_lb']); s.pathogen = {E_kj:P({SAL:.7, ETEC:.3}), E_ds:P({ETEC:.5, NORO:.5}), E_lb:'SAL'}[s.dish]; }
    // สวนผักที่ใช้น้ำคลองรดผัก ส่งผักสดให้ ๒ ร้าน + โรงอาหารโรงเรียน (ต้นตอซ่อน แบบเดียวกับโรงน้ำแข็ง)
    if(type==='FARM'){ s.culprit = 'F3'; s.pathogen = P({ETEC:.45, SAL:.35, NORO:.2}); s.vegVenues = U.shuffle(['R1','R2','R3','R4']).slice(0,2).concat(['S']); }
    // ผู้ส่งน้ำแข็ง/ผักสดของแต่ละร้าน (ทุกคดีมีห่วงโซ่อุปทานจริง ใช้เป็นตัวหลอกได้)
    s.iceSupplier = {}; s.vegSupplier = {};
    for(const r of ['R1','R2','R3','R4']) s.iceSupplier[r] = type==='ICE' ? (s.iceVenues.includes(r)?'F1':'F2') : U.pick(['F1','F2']);
    for(const r of ['R1','R2','R3','R4','S']) s.vegSupplier[r] = type==='FARM' ? (s.vegVenues.includes(r)?'F3':'MKT') : (U.r()<.4 ? 'F3' : 'MKT');
    return s;
  }

  // การปนเปื้อนเริ่มหลังพายุฝนคืนวันศุกร์ (ก่อนวันที่ ๑) และแย่ลงเรื่อย ๆ
  function hazard(scn, p, d){
    const ramp = Math.min(.10, .045 + .007*(d-1));
    switch(scn.type){
      case 'WELL': return p.water===scn.culprit ? ramp*(p.boil?.2:1) : 0;
      case 'REST': { if(!p.exp[scn.culprit]) return 0; let h = ramp*1.05; if(scn.key) h *= p.exp[scn.key] ? 1.6 : .35; return h; }
      case 'ICE': { if(!p.iceLover) return 0; const k = scn.iceVenues.filter(v=>p.exp[v]).length; return k ? ramp*(1+.3*(k-1)) : 0; }
      case 'SCHOOL': return p.exp.S && M.SCHOOL_DAYS.includes(d) ? (p.age<=15 ? .2 : .12) : 0;
      case 'FARM': { if(!p.exp.VEG) return 0; const k = scn.vegVenues.filter(v=>p.exp[v] && (v!=='S' || M.SCHOOL_DAYS.includes(d))).length; return k ? ramp*(.9+.3*(k-1)) : 0; }
    }
    return 0;
  }

  function incubation(path){
    const [med, lo, hi] = M.PATHOGENS[path].inc;
    return U.clamp(med*Math.exp(U.gauss()*.42), lo, hi);
  }
  function symptoms(path, bg){
    const pr = bg ? {diar:.9, watery:.5, vomit:.35, fever:.25, cramp:.55, blood:.03} : M.PATHOGENS[path].sym;
    const s = {}; for(const [k] of M.SYMPTOMS) s[k] = U.r() < pr[k];
    if(!s.diar && !s.vomit) s.diar = true;
    if(s.watery) s.diar = true;
    return s;
  }

  M.build = function(seed, forceType){
    U.seed(seed);
    const scn = makeScenario(forceType);
    const people = [], households = [];
    const SITES = M.SITES;
    let pid = 0, hid = 0;
    for(const v of M.VILLAGES){
      const nh = 30 + Math.floor(U.r()*7);
      for(let h=0; h<nh; h++){
        let hx, hy, tries=0;
        do{ hx = v.x+U.gauss()*v.sx; hy = v.y+U.gauss()*v.sy; tries++; } while(tries<60 && (hx<26||hx>974||hy<26||hy>654||OD.sim.distToCanal(hx,hy)<26));
        const hh = {id:++hid, v:v.id, x:hx, y:hy, members:[]};
        const water = U.r()<.11 ? 'BOT' : U.wpick(['W1','W2','W3'], ['W1','W2','W3'].map(w=>Math.exp(-Math.hypot(hx-SITES[w].x, hy-SITES[w].y)/110)));
        const boil = water!=='BOT' && U.r()<.22, eatOut = .6+U.r()*.8, attend = U.r() < (v.id===2?.94:.8);
        const ages = [];
        const nAd = U.r()<.8 ? 2 : 1; for(let i=0;i<nAd;i++) ages.push(24+Math.floor(U.r()*36));
        const nK = U.wpick([0,1,2,3],[.25,.35,.3,.1]); for(let i=0;i<nK;i++) ages.push(Math.floor(U.r()*18));
        if(U.r()<.45) ages.push(61+Math.floor(U.r()*25));
        for(const age of ages){
          const p = {id:++pid, hh:hh.id, v:v.id, x:hx+U.gauss()*7, y:hy+U.gauss()*7, age, sex:U.r()<.5?'ชาย':'หญิง', water, boil, exp:{}};
          p.exp.W1 = water==='W1'; p.exp.W2 = water==='W2'; p.exp.W3 = water==='W3'; p.exp.BOT = water==='BOT' || U.r()<.15;
          for(const r of ['R1','R2','R3','R4']){ const s = SITES[r], d = Math.hypot(hx-s.x, hy-s.y); p.exp[r] = U.r() < Math.min(.8, (.05+s.pop+.42*Math.exp(-d/200))*eatOut*(age<6?.4:1)); }
          p.exp.S = (age>=6 && age<=15) ? U.r()<.96 : (age>=23 && age<=60 ? U.r()<.035 : false);
          p.exp.E = attend ? U.r()<.9 : U.r()<.08;
          p.exp.E_kj = p.exp.E && U.r()<.72; p.exp.E_lb = p.exp.E && U.r()<(age>=18?.5:.15); p.exp.E_ds = p.exp.E && U.r()<(age<18?.75:.5);
          p.iceLover = U.r() < (age<18?.72:.6);
          p.exp.ICE = p.iceLover && ['R1','R2','R3','R4'].some(r=>p.exp[r]);
          p.exp.SEA = p.exp.R1 ? U.r()<.62 : U.r()<.1;
          p.exp.VEG = p.exp.R2 ? U.r()<.8 : U.r()<.45;
          p.inf = null; p.cause = null;
          hh.members.push(p.id); people.push(p);
        }
        households.push(hh);
      }
    }
    // ตัวแปรกวน: หมู่บ้านที่ใช้บ่อต้นตอมากที่สุดก็นิยมกินร้านนี้ — OR หยาบของร้านจะสูง แต่แยกตามหมู่บ้านแล้วใกล้ 1
    if(scn.confound){
      const cnt = M.VILLAGES.map(v=>people.filter(p=>p.v===v.id && p.water===scn.culprit).length);
      scn.confoundV = M.VILLAGES[cnt.indexOf(Math.max(...cnt))].id;
      for(const p of people) if(p.v===scn.confoundV && p.age>=6 && !p.exp[scn.confound] && U.r()<.9){ p.exp[scn.confound] = true; p.exp.ICE = p.iceLover; }
      // คนหมู่บ้านอื่นแทบไม่ไปร้านนี้ (ไกลบ้าน) — ทำให้ความสัมพันธ์กับหมู่บ้านชัดขึ้น
      for(const p of people) if(p.v!==scn.confoundV && p.exp[scn.confound] && U.r()<.6) p.exp[scn.confound] = false;
    }
    // ติดเชื้อจากแหล่งโรค (primary)
    for(const p of people){
      if(scn.type==='EVENT'){
        if(p.exp.E){ const ar = p.exp[scn.dish] ? .2 : .015; if(U.r()<ar){ p.inf = 11.5 + U.r()*2.5; p.cause='src'; p.via='E'; } }
      } else {
        for(let d = scn.type==='SCHOOL' ? 0 : 1; d<=16; d++){
          const h = hazard(scn, p, d);
          if(h>0 && U.r()<h){
            p.inf = scn.type==='SCHOOL' ? (d-1)*24+11+U.r()*2 : (d-1)*24+6+U.r()*16;
            p.cause = 'src';
            p.via = scn.type==='ICE' ? U.pick(scn.iceVenues.filter(v=>p.exp[v])) : scn.type==='FARM' ? U.pick(scn.vegVenues.filter(v=>p.exp[v])) : scn.culprit;
            break;
          }
        }
      }
      if(p.inf!==null){
        p.onset = p.inf + incubation(scn.pathogen);
        if(p.onset < 1) p.onset = 1 + U.r()*6;   // นิยามผู้ป่วยเริ่ม ส. 21 พ.ย.
      }
    }
    // งานทอดกฐิน ส. 28 พ.ย. — ถ้าแหล่งโรคเดิมยังไม่ถูกควบคุม งานใหญ่จะกลายเป็นจุดแพร่เชื้อระลอกใหม่
    // (บ่อวัดใช้ทำน้ำดื่มในงาน · ร้านต้นตอมาออกร้าน · น้ำแข็งจากโรงเดิม · แม่ครัวอาสาชุดเดิม)
    const festVia = {WELL: scn.culprit==='W1' ? 'W1' : null, REST: scn.culprit, ICE:'F1', EVENT:'E', SCHOOL:null, FARM:'F3'}[scn.type];
    for(const p of people){
      p.fest = U.r() < (p.v===2 ? .6 : .42);
      if(!festVia || !p.fest || p.inf!==null) continue;
      const ar = {WELL:.07, REST:.06, ICE: p.iceLover ? .1 : .02, EVENT:.07, FARM: p.exp.VEG ? .09 : .01}[scn.type];
      if(U.r() < ar){ p.inf = M.FEST_T + U.r()*4; p.cause = 'fest'; p.via = festVia; p.onset = p.inf + incubation(scn.pathogen); }
    }
    // ติดต่อคนสู่คนในครัวเรือน (2 รอบ)
    const pSec = M.PATHOGENS[scn.pathogen].sec, byId = id => people[id-1];
    for(let gen=0; gen<2; gen++){
      const idx = people.filter(p=>p.inf!==null).sort((a,b)=>a.onset-b.onset);
      for(const src of idx){
        if(src._spread) continue; src._spread = true;
        for(const mid of households[src.hh-1].members){
          const m = byId(mid); if(m===src) continue;
          if(U.r()<pSec){
            const t = src.onset + 12 + U.r()*48;
            if(m.inf===null || t<m.inf){ m.inf=t; m.cause='sec'; m.index=src.id; m.via=null; m.onset = t+incubation(scn.pathogen); }
          }
        }
      }
    }
    // ท้องร่วงทั่วไป (ไม่เกี่ยวกับการระบาด)
    for(const p of people){
      for(let d=1; d<=16; d++){ if(U.r()<.001){ const t=(d-1)*24+U.r()*24; if(p.inf===null || t<p.inf){ p.inf=t; p.cause='bg'; p.index=null; p.via=null; p.onset=t+10+U.r()*30; } break; } }
    }
    // อาการ ความรุนแรง วันรายงาน ค่าสุ่มสำหรับมาตรการ
    for(const p of people){
      p.u = U.r();
      if(p.inf===null) continue;
      p.sym = symptoms(scn.pathogen, p.cause==='bg');
      const ad = (p.cause==='bg' ? .05 : M.PATHOGENS[scn.pathogen].admit) * ((p.age<5||p.age>65)?1.6:1);
      p.admit = U.r() < ad;
      p.report = p.onset + (p.admit ? 2+U.r()*5 : 4+U.r()*12);
      p.onsetDay = M.dayOf(p.onset);
      // ผู้ป่วยอาการน้อยราว ๑ ใน ๓ ไม่ไปสถานพยาบาล — จะพบได้ด้วยการค้นหาผู้ป่วยเชิงรุกเท่านั้น
      p.hidden = !p.admit && U.r() < .33;
    }
    U.unseed();
    return {seed, scn, people, households, byId};
  };

  /* แผนที่: คลอง ถนน ใช้ทั้งการสร้างโลกและการวาด */
  M.CANAL = [[-20,330],[120,348],[240,370],[340,425],[450,500],[560,556],[700,588],[850,600],[1020,606]];
  M.ROADS = [
    [[-10,238],[200,232],[395,262],[620,250],[820,300],[1010,318]],
    [[470,-10],[470,140],[395,262]], [[185,150],[200,232]],
    [[395,262],[350,400],[270,532],[230,690]], [[620,250],[690,470],[760,690]],
    [[820,262],[905,160],[1010,120]], [[860,478],[948,610]], [[270,532],[62,610]],
  ];
  function distToSeg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}
  M.distToCanal = (x,y) => { let m=Infinity; const P=M.CANAL; for(let i=0;i<P.length-1;i++) m=Math.min(m,distToSeg(x,y,P[i][0],P[i][1],P[i+1][0],P[i+1][1])); return m; };
})(OD.sim);
