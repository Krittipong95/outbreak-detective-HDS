/* Shared investigation clock. Time moves only when the case or travel advances. */
window.OD = window.OD || {};
OD.deadline = (function(){
  const M = OD.sim;
  const seen = new WeakMap();
  const pad = n => String(n).padStart(2, '0');
  function snapshot(S){
    const pending = Math.max(0, Number(S.flags && S.flags.walkAcc) || 0) / 1000;
    const remainingHours = Math.max(0, M.DEADLINE - Number(S.T || 0) - pending);
    const totalMinutes = remainingHours > 0 ? Math.max(1, Math.ceil(remainingHours * 60 - 1e-8)) : 0;
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor(totalMinutes % 1440 / 60);
    const minutes = totalMinutes % 60;
    const ratio = Math.max(0, Math.min(1, remainingHours / (M.DEADLINE - M.T0)));
    const level = remainingHours <= 0 ? 'expired' : remainingHours <= 1 ? 'last' : remainingHours <= 12 ? 'critical' : remainingHours <= 36 ? 'urgent' : 'calm';
    return {remainingHours, totalMinutes, days, hours, minutes, ratio, level};
  }
  function html(S, opts={}){
    const v = snapshot(S);
    return `<div class="od-deadline ${opts.compact?'compact':''}" data-deadline data-level="${v.level}" aria-label="เวลาคดีที่เหลือ">
      <div class="od-deadline-top"><span>⏳ เวลาคดีที่เหลือ</span><strong data-clock>${v.days} วัน ${pad(v.hours)}:${pad(v.minutes)} ชม.</strong></div>
      <div class="od-deadline-track" aria-hidden="true"><i data-clock-bar style="width:${v.ratio*100}%"></i></div>
      <small data-clock-note>${note(v)}</small></div>`;
  }
  function note(v){
    if(v.level==='expired') return 'หมดเวลาแล้ว · เตรียมส่งรายงาน';
    if(v.level==='last') return 'ชั่วโมงสุดท้าย · เลือกทำเฉพาะสิ่งจำเป็น';
    if(v.level==='critical') return 'วิกฤต · รีบสรุปหลักฐานและมาตรการ';
    if(v.level==='urgent') return 'เร่งด่วน · เหลือเวลาไม่มาก';
    return 'เวลาในเกมลดเมื่อเดินทางหรือทำภารกิจ';
  }
  function update(root,S){
    if(!root || !S) return;
    const box = root.matches && root.matches('[data-deadline]') ? root : root.querySelector && root.querySelector('[data-deadline]');
    if(!box) return;
    const v = snapshot(S), mark = `${v.totalMinutes}|${v.level}`;
    if(box.dataset.clockMark===mark) return;
    box.dataset.clockMark = mark;
    box.dataset.level = v.level;
    const clock = box.querySelector('[data-clock]'), bar = box.querySelector('[data-clock-bar]'), msg = box.querySelector('[data-clock-note]');
    if(clock) clock.textContent = `${v.days} วัน ${pad(v.hours)}:${pad(v.minutes)} ชม.`;
    if(bar) bar.style.width = `${v.ratio*100}%`;
    if(msg) msg.textContent = note(v);
  }
  function notify(S){
    if(!S) return;
    const h = snapshot(S).remainingHours;
    const stage = h<=0 ? 0 : h<=1 ? 1 : h<=12 ? 12 : h<=24 ? 24 : h<=36 ? 36 : Infinity;
    if(!seen.has(S)){ seen.set(S,stage); return; }
    const previous = seen.get(S);
    if(stage>=previous) return;
    if(document.hidden || document.getElementById('modal')?.classList.contains('open') || !document.getElementById('vn')?.classList.contains('hidden')) return;
    seen.set(S,stage);
    if(stage===0) return; // Existing field timeout screen handles the deadline.
    const text = stage===1 ? '⏳ เหลือชั่วโมงสุดท้าย!' : `⏳ เหลือเวลาคดี ${stage} ชั่วโมง`;
    OD.u.toast(text + ' ดูหลักฐานที่มีและเตรียมมาตรการ/รายงาน', 'red', 4500);
    if(OD.sfx) OD.sfx('alert');
  }
  return {snapshot, html, update, notify};
})();
