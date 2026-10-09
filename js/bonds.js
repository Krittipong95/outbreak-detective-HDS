/* =========================================================
   bonds — ความสนิทกับตัวละคร (กำนันเสถียร · ป้าบุญมา · พี่ฟ้า)
   ค่า 0–100 เริ่มที่ 50 เปลี่ยนตามการตัดสินใจ
   ≥ 70 ปลดล็อกความช่วยเหลือพิเศษ · ≤ 25 ทำให้งานยากขึ้น
   ========================================================= */
OD.bonds = (function(){
  const U = OD.u;
  const WHO = {
    kamnan:{name:'กำนันเสถียร', perk:'ประกาศเสียงตามสายช่วยหาคน — เก็บกลุ่มควบคุมเร็วขึ้น ๓๐%', low:'ไม่ช่วยประสาน — เก็บกลุ่มควบคุมช้าลง ๒ ชม.'},
    boonma:{name:'ป้าบุญมา',    perk:'พา อสม. เคาะประตูให้ — ค้นหาผู้ป่วยเชิงรุกฟรี ใช้เวลา ๔ ชม.', low:'อสม. ไม่เต็มใจช่วย — สัมภาษณ์ช้าลง ๑ ชม.'},
    fah:   {name:'พี่ฟ้า',       perk:'เร่งคิวแล็บให้ — ผลออกใน ๑๖ ชม.', low:'ไม่เร่งคิวให้ — ผลแล็บออกใน ๓๐ ชม.'},
  };
  const HI = 70, LO = 25;
  /* การตัดสินใจ → ผลต่อความสนิท [ดี, พอใช้, ก้ำกึ่ง, ผิด] */
  const MAP = {
    kamnan:  {kamnan:[15,-3,0,6], boonma:[8,0,0,-6]},     // ยอมปิดตามข่าวลือ: กำนันพอใจ แต่ป้าบุญมาผิดหวัง
    promise: {kamnan:[0,0,0,-15]},
    teamSick:{boonma:[12,0,0,-15]},
    tipoff:  {kamnan:[8,0,-8,0]},
    misinfo: {kamnan:[0,0,0,4], boonma:[5,0,0,-5]},
    pdpa:    {boonma:[12,0,0,-12]},
    vendor:  {kamnan:[6,0,-4,-6]},
    dehyd:   {boonma:[15,0,0,-10]},
    clue:    {boonma:[8,0,-8,0]},
    storm:   {kamnan:[8,0,-6,-6]},
    festival:{kamnan:[5,0,-6,0], boonma:[5,0,0,0]},
    consent: {boonma:[6,0,0,-8]},
    labform: {fah:[12,0,-10,-10]},
    festivalW:{kamnan:[10,0,-12,0], boonma:[4,0,0,0]},   // งานแต่งลูกสาวกำนัน — ให้เลื่อนงาน กำนันเสียใจมาก
    herbal:  {boonma:[8,0,-4,-6]},
    neighbor:{kamnan:[4,0,-2,-4]},
    students:{kamnan:[3,0,0,0], boonma:[4,0,-3,0]},
    labMix:  {fah:[8,0,0,-10]},
  };
  const IDX = {good:0, ok:1, mixed:2, bad:3};

  function add(S, who, d, why){
    if(!S.bonds || !d) return;
    const before = S.bonds[who];
    S.bonds[who] = U.clamp(before + d, 0, 100);
    const real = S.bonds[who] - before; if(!real) return;
    U.toast(`${real>0?'❤️':'💔'} ${WHO[who].name} ${real>0?'+':''}${real}${why?` · ${why}`:''}`, real>0 ? 'ok' : 'red');
    OD.sfx && OD.sfx(real>0 ? 'heart' : 'down');
    if(before<HI && S.bonds[who]>=HI) setTimeout(()=>U.toast(`✨ ${WHO[who].name}สนิทใจแล้ว: ${WHO[who].perk}`, 'ok'), 400);
    if(before>LO && S.bonds[who]<=LO) setTimeout(()=>U.toast(`⚠️ ${WHO[who].name}เริ่มห่างเหิน: ${WHO[who].low}`, 'red'), 400);
  }
  function onDecision(S, d){
    const m = MAP[d.id], i = IDX[d.verdict]; if(!m || i==null) return;
    for(const [who, arr] of Object.entries(m)) add(S, who, arr[i]);
  }
  const hi = (S,w) => (S.bonds||{})[w] >= HI, lo = (S,w) => (S.bonds||{})[w] <= LO;

  /* ---------- ผลต่อกลไกเกม ---------- */
  const labWait = S => hi(S,'fah') ? 16 : lo(S,'fah') ? 30 : 24;
  const acfCost = S => hi(S,'boonma') ? {h:4, b:0} : {h:6, b:1500};
  const interviewExtra = S => lo(S,'boonma') ? 1 : 0;
  const ccAdjust = (S,h) => hi(S,'kamnan') ? Math.max(1, Math.round(h*.7)) : lo(S,'kamnan') ? h+2 : h;

  /* ---------- แผงแสดงผล ---------- */
  const faces = new Map();
  const face = id => { if(!faces.has(id)) faces.set(id, OD.art.person(id, 'smile')); return faces.get(id); };
  function html(S){
    return `<div class="bonds">${Object.entries(WHO).map(([id,w])=>{ const v = S.bonds[id], st = v>=HI ? 'hi' : v<=LO ? 'lo' : '';
      return `<div class="bond ${st}" title="${w.name} ${v}/100 — ${v>=HI ? 'สนิทใจ: '+w.perk : v<=LO ? 'ห่างเหิน: '+w.low : 'ถึง ๗๐ จะปลดล็อก: '+w.perk}">
        <span class="avatar sm">${face(id)}</span><span class="bt"><b>${w.name}</b><span class="meter ${st==='lo'?'red':'jade'}"><i style="width:${v}%"></i></span></span>${st==='hi'?'<span class="bs">✨</span>':st==='lo'?'<span class="bs">⚠️</span>':''}</div>`; }).join('')}</div>`;
  }
  /* ---------- ผลต่อเรื่องราว (ใช้ในตอนจบ) ---------- */
  function epilogue(S){
    const out = [], b = S.bonds || {}, name = U.esc(S.name);
    if(b.kamnan>=75) out.push({ok:true, text:`กำนันเสถียรเสนอชื่อ ${name} รับรางวัลคนดีของตำบล`});
    else if(b.kamnan<=LO) out.push({ok:false, text:'กำนันเสถียรยังไม่ค่อยไว้ใจทีมสาธารณสุข คราวหน้าคงต้องเริ่มสร้างความเชื่อใจใหม่'});
    if(b.boonma>=75) out.push({ok:true, text:`ป้าบุญมาส่งปิ่นโตมาให้ทีมทุกวันศุกร์ และขอให้ ${name} มาสอน อสม. เรื่องการเก็บข้อมูล`});
    else if(b.boonma<=LO) out.push({ok:false, text:'ป้าบุญมาบอกว่าคราวหน้าคงไม่อาสาช่วยงานแบบนี้อีก'});
    if(b.fah>=75) out.push({ok:true, text:`พี่ฟ้าชวน ${name} ไปทำวิจัยเรื่องเชื้อดื้อยาด้วยกัน`});
    else if(b.fah<=LO) out.push({ok:false, text:'พี่ฟ้าบ่นว่าตัวอย่างที่ส่งมาเก็บไม่ถูกวิธีจนตรวจแทบไม่ได้'});
    return out;
  }
  return {WHO, HI, LO, add, onDecision, labWait, acfCost, interviewExtra, ccAdjust, html, epilogue};
})();
