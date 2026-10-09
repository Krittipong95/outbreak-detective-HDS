/* =========================================================
   checklist — ๑๐ ขั้นตอนการสอบสวนการระบาด (ตามแนวทางสากลและกรมควบคุมโรค)
   และ "สิ่งที่ต้องรู้ให้ได้" — สถานะคำนวณจากสิ่งที่ผู้เล่นทำ ไม่เฉลยคำตอบ
   ========================================================= */
window.OD = window.OD || {};
OD.checklist = (function(){
  const STEPS = [
    {n:1,  t:'เตรียมการลงพื้นที่', d:'จัดทีม เตรียมอุปกรณ์เก็บตัวอย่าง แบบสอบสวน และประสานหน่วยงาน', how:'เลือกอุปกรณ์ตอนเริ่มบทที่ ๓',
      done:(W,S)=>!!S.kit},
    {n:2,  t:'ยืนยันการวินิจฉัย', d:'ตรวจสอบว่าผู้ป่วยเป็นโรคเดียวกันจริง จากอาการทางคลินิกและผลห้องปฏิบัติการ', how:'🩺 ทบทวนเวชระเบียน หรือ 🧪 ตรวจอุจจาระผู้ป่วย',
      done:(W,S)=>S.reviewed || S.confirmed.size>0},
    {n:3,  t:'ยืนยันการระบาด', d:'เทียบจำนวนผู้ป่วยกับค่าคาดหมาย (ค่ามัธยฐาน ๕ ปี)', how:'บทที่ ๑',
      done:(W,S)=>S.acc.ch1Max>0},
    {n:4,  t:'นิยามผู้ป่วยและค้นหาผู้ป่วยเพิ่มเติม', d:'ใช้นิยามเดียวกันทุกแหล่ง และค้นหาผู้ป่วยที่ไม่ได้ไปสถานพยาบาล', how:'บทที่ ๑–๒ และ 🏘️ ค้นหาผู้ป่วยเชิงรุก',
      done:(W,S)=>S.acc.ch1Max>0 && S.acfAt!=null},
    {n:5,  t:'ระบาดวิทยาเชิงพรรณนา', d:'อธิบายการระบาดตาม เวลา–สถานที่–บุคคล', how:'ดูเส้นโค้งการระบาด · ชี้/ไฮไลต์บนแผนที่ · ดูอาการและอายุ',
      done:(W,S)=>!!(S.flags.vTime && S.flags.vPlace && S.flags.vPerson)},
    {n:6,  t:'ตั้งสมมติฐาน', d:'ระบุแหล่งโรคและช่องทางที่น่าสงสัยจากข้อมูลเชิงพรรณนา', how:'💡 ตั้งสมมติฐาน (ก่อนเก็บกลุ่มควบคุม)',
      done:(W,S)=>S.hyp.length>0},
    {n:7,  t:'ทดสอบสมมติฐาน', d:'การศึกษาเชิงวิเคราะห์ เช่น case-control แล้วคำนวณ OR และ 95% CI', how:'👥 เก็บกลุ่มควบคุม แล้วดูแท็บวิเคราะห์ OR',
      done:(W,S)=>S.controls.length>0 && !!S.flags.vOR},
    {n:8,  t:'ศึกษาสิ่งแวดล้อมและห้องปฏิบัติการ', d:'หาหลักฐานยืนยันแหล่งโรคจากสถานที่จริงและตัวอย่าง', how:'🔎 ตรวจสิ่งแวดล้อม และ 🧪 ส่งตัวอย่างจากแหล่งที่สงสัย',
      done:(W,S)=>Object.keys(S.inspected).length>0 && S.labs.some(l=>l.kind==='env')},
    {n:9,  t:'มาตรการควบคุมและป้องกัน', d:'ดำเนินการได้ทันทีเมื่อมีหลักฐานเพียงพอ ไม่ต้องรอผลครบ', how:'🛑 มาตรการเร่งด่วน หรือในรายงาน',
      done:(W,S)=>Object.keys(S.closed).length>0 || S.hygieneAt!=null || !!S.flags.reported},
    {n:10, t:'สื่อสารความเสี่ยงและเขียนรายงาน', d:'บอกสิ่งที่รู้ สิ่งที่ยังไม่รู้ และสิ่งที่ประชาชนควรทำ แล้วสรุปเป็นรายงาน', how:'ตอบสื่ออย่างโปร่งใส และ 📝 เขียนรายงาน',
      done:(W,S)=>S.flags.comm==='good' || !!S.flags.reported},
  ];
  const KNOW = [
    {t:'ใครป่วยบ้าง (อายุ เพศ อาการ)', how:'แท็บอาการ/อายุ', ok:(W,S)=>!!S.flags.vPerson},
    {t:'ป่วยที่ไหน (การกระจายตัวเชิงพื้นที่)', how:'แผนที่', ok:(W,S)=>!!S.flags.vPlace},
    {t:'ป่วยเมื่อไร และรูปแบบการระบาด', how:'เส้นโค้งการระบาด', ok:(W,S)=>!!S.flags.vTime},
    {t:'เป็นโรคติดเชื้อทางเดินอาหารจริงหรือไม่', how:'ทบทวนเวชระเบียน', ok:(W,S)=>S.reviewed},
    {t:'เชื้อก่อโรคคืออะไร', how:'ตรวจอุจจาระผู้ป่วย + ระยะฟักตัว + อาการเด่น', ok:(W,S)=>S.evidence.some(e=>e.kind==='lab' && e.pathogen)},
    {t:'สัมผัสอะไรแล้วเสี่ยงป่วย', how:'case-control: OR และ 95% CI', ok:(W,S)=>S.controls.length>0 && !!S.flags.vOR},
    {t:'แหล่งโรคอยู่ที่ไหน มีหลักฐานยืนยันไหม', how:'ตรวจสิ่งแวดล้อม + แล็บจากแหล่งที่สงสัย', ok:(W,S)=>S.evidence.some(e=>e.kind==='env') && S.evidence.some(e=>e.kind==='lab' && e.site)},
    {t:'มีการแพร่คนสู่คนในบ้านหรือไม่', how:'ปัจจัย “มีคนในบ้านป่วยก่อนหน้า” + รูปร่างเส้นโค้ง', ok:(W,S)=>S.controls.length>0 && !!S.flags.vOR},
    {t:'ควรควบคุมอย่างไร และบอกชาวบ้านว่าอะไร', how:'คู่มือบทมาตรการควบคุม', ok:(W,S)=>Object.keys(S.closed).length>0 || S.hygieneAt!=null || S.flags.comm==='good'},
  ];
  function progress(W,S){ return STEPS.filter(s=>s.done(W,S)).length; }
  function next(W,S){ return STEPS.find(s=>!s.done(W,S)); }
  function html(W,S){
    const n = progress(W,S), U = OD.u;
    return `<div class="ck-head"><b>ขั้นตอนการสอบสวนการระบาด</b><span class="chip gold">ทำแล้ว ${U.thaiNum(n)}/๑๐</span></div>
      <div class="meter" style="margin:6px 0 10px"><i style="width:${n*10}%"></i></div>
      <ol class="ck">${STEPS.map(s=>{ const d = s.done(W,S); return `<li class="${d?'done':''}"><span class="ck-box">${d?'✓':U.thaiNum(s.n)}</span><div><b>${s.t}</b><div class="muted">${s.d}</div>${d?'':`<div class="ck-how">วิธีทำในเกม: ${s.how}</div>`}</div></li>`; }).join('')}</ol>
      <div class="ck-head" style="margin-top:14px"><b>สิ่งที่ต้องรู้ให้ได้ก่อนเขียนรายงาน</b></div>
      <ul class="ck-know">${KNOW.map(q=>{ const d = q.ok(W,S); return `<li class="${d?'done':''}"><span class="ck-box">${d?'✓':'?'}</span><span>${q.t}<br><small class="muted">${d?'มีข้อมูลแล้ว — ตีความเองให้ถูก':'ดูได้จาก: '+q.how}</small></span></li>`; }).join('')}</ul>
      <div class="note" style="font-size:13.5px">ขั้นตอนไม่จำเป็นต้องเรียงตายตัว และ <b>มาตรการควบคุม (ขั้นที่ ๙) เริ่มได้ทันที</b> ที่มีหลักฐานพอ ไม่ต้องรอให้ทุกอย่างครบ — แต่การข้ามขั้นสำคัญจะทำให้ข้อสรุปอ่อนลง</div>`;
  }
  return {STEPS, KNOW, progress, next, html};
})();
