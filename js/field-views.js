/* =========================================================
   field-views — แผนที่ เส้นโค้งการระบาด ตาราง OR (forest plot)
   แยกวิเคราะห์ตามหมู่บ้าน อาการ/ระยะฟักตัว รายชื่อ หลักฐาน
   ========================================================= */
OD.fieldViews = (function(){
  const U = OD.u, M = OD.sim;
  let W, S, base = null;
  const nm = id => M.SITES[id].name;
  const EXL = k => (M.EXPOSURES.find(e=>e.k===k) || {}).label;   // ชื่อข้อคำถาม (ชื่องานวันเสาร์เปลี่ยนตามคดี)
  const AGE = [['0–5',0,5],['6–15',6,15],['16–30',16,30],['31–45',31,45],['46–60',46,60],['61+',61,120]];
  const AGEC = ['#e0b13a','#d9772f','#b8402c','#8e3a7c','#4c5bb0','#2f6f8f'];
  const WC = {W1:'#6d4fd8', W2:'#d07118', W3:'#2a8a52', BOT:'#8a7c66'};
  const recs = () => M.records(W,S);
  const ans = p => S.ans[p.id];

  /* ---------- กราฟแท่ง ---------- */
  function niceTop(m){ for(const s of [1,2,5,10,20,25,50,100]) if(Math.ceil(m/s)<=5) return {s, top:Math.max(s,Math.ceil(m/s)*s)}; return {s:100, top:Math.ceil(m/100)*100}; }
  OD.barChart = function(o){
    // ป้ายเส้นเหตุการณ์ (marks) วางไว้ในขอบบนของกราฟ จะได้ไม่ทับตัวเลขบนแท่ง
    const mRows = (o.marks||[]).length ? Math.max(...o.marks.map(x=>x.row||0)) + 1 : 0;
    const w=o.w||560, m={l:34,r:10,t:22+mRows*14,b:o.xt?42:26}, h=(o.h||240)+mRows*14, iw=w-m.l-m.r, ih=h-m.t-m.b, n=o.labels.length;
    const {s:st, top} = niceTop(Math.max(1, ...o.vals, ...(o.ghost||[0])));
    const bw = iw/n, pad = Math.min(8, bw*.15), Y = v => m.t+ih-v/top*ih;
    let g = `<svg viewBox="0 0 ${w} ${h}" class="chart">`;
    for(let v=0; v<=top; v+=st) g += `<line class="g" x1="${m.l}" x2="${w-m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="t" x="${m.l-6}" y="${Y(v)+4}" text-anchor="end">${o.pct?v+'%':v}</text>`;
    o.labels.forEach((lb,i)=>{
      const x = m.l+i*bw+pad, bwid = Math.max(2,bw-2*pad), cx = m.l+i*bw+bw/2, v = o.vals[i], inc = o.inc!=null && i>=o.inc ? ' inc' : '';
      if(o.ghost && o.ghost[i]>0) g += `<rect class="ghost" x="${x}" y="${Y(o.ghost[i])}" width="${bwid}" height="${o.ghost[i]/top*ih}" rx="2"/>`;
      if(v>0) g += `<rect class="${o.sub?'bar2':'bar'}${inc}" x="${x}" y="${Y(v)}" width="${bwid}" height="${v/top*ih}" rx="2"><title>${lb}: ${v}</title></rect>`;
      if(o.sub && o.sub[i]>0) g += `<rect class="bar${inc}" x="${x}" y="${Y(o.sub[i])}" width="${bwid}" height="${o.sub[i]/top*ih}" rx="2"/>`;
      if(v>0) g += `<text class="v" x="${cx}" y="${Y(v)-4}" text-anchor="middle">${o.pct?v.toFixed(0)+'%':v}</text>`;
      if(!o.every || i%o.every===0) g += `<text class="t" x="${cx}" y="${m.t+ih+15}" text-anchor="middle">${lb}</text>`;
    });
    for(const mk of (o.marks||[])){
      const x = m.l+mk.at*bw, y = 14+(mk.row||0)*14, end = x > w-150;   // ป้ายใกล้ขอบขวา ให้ชิดขวาของเส้น
      g += `<line class="mk" x1="${x}" x2="${x}" y1="${y+3}" y2="${m.t+ih}"/><text class="mkt" x="${end?x-4:x+4}" y="${y}" text-anchor="${end?'end':'start'}">${mk.label}</text>`;
    }
    if(o.xt) g += `<text class="t" x="${m.l+iw/2}" y="${h-6}" text-anchor="middle">${o.xt}</text>`;
    return g + `</svg>`;
  };

  /* ---------- แผนที่ ---------- */
  function smooth(pts){ let d=`M${pts[0][0]},${pts[0][1]}`; for(let i=0;i<pts.length-1;i++){ const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2; d+=` C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)},${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)},${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0]},${p2[1]}`; } return d; }
  function mapBase(){
    if(base) return base;
    let s = `<rect width="1000" height="680" class="m-land"/>`;
    for(const [x,y,w,h] of [[30,330,150,60],[560,250,120,70],[40,560,90,70],[880,560,110,80],[260,100,90,60],[640,30,110,40]]) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="m-field"/>`;
    const cd = smooth(M.CANAL); s += `<path d="${cd}" class="m-canal-e"/><path d="${cd}" class="m-canal"/>`;
    for(const r of M.ROADS) s += `<path d="${smooth(r)}" class="m-road-e"/>`;
    for(const r of M.ROADS) s += `<path d="${smooth(r)}" class="m-road"/>`;
    const lp = {1:[150,60],2:[360,40],3:[910,400],4:[130,660],5:[560,410]};
    for(const v of M.VILLAGES) s += `<text class="m-vl" x="${lp[v.id][0]}" y="${lp[v.id][1]}" text-anchor="middle">${v.name}</text>`;
    s += `<g transform="translate(978 30)"><path d="M0 -18 L7 6 L0 0 L-7 6 Z" fill="#7a6440"/><text x="0" y="22" text-anchor="middle" font-size="15" fill="#7a6440" font-weight="700">น</text></g>`;
    return base = s;
  }
  function caseColor(p){
    switch(S.ui.colorBy){
      case 'onset': { const mx = Math.max(2, M.dayOf(S.T)); const t = ((p.onsetDay||1)-1)/(mx-1); return `hsl(${46-44*t} 80% ${62-24*t}%)`; }
      case 'age': { const i = AGE.findIndex(a=>p.age>=a[1]&&p.age<=a[2]); return AGEC[i<0?5:i]; }
      case 'water': { const a = ans(p); if(!a) return '#bbb'; const w = ['W1','W2','W3'].find(k=>a[k]) || 'BOT'; return WC[w]; }
    }
    return '#b8352a';
  }
  /* ตำแหน่งป้ายชื่อสถานที่: ชิดขอบซ้าย/ขวาให้ป้ายไม่หลุดกรอบ · สถานที่แถวล่างสุดวางป้ายไว้ด้านบน */
  function labelPos(st){
    const anchor = st.x<130 ? 'start' : st.x>870 ? 'end' : 'middle';
    return {x: anchor==='start' ? -24 : anchor==='end' ? 24 : 0, y: st.y>590 ? -32 : 44, anchor};
  }
  function mapView(){
    const hl = S.ui.hl, R = recs();
    let s = `<svg viewBox="0 0 1000 680" id="fmapsvg">${mapBase()}`;
    if(S.ui.showCtl) for(const id of S.controls){ const p = W.byId(id), a = S.ans[id]; const cls = hl ? (a[hl]?' hl':' dim') : ''; s += `<rect class="ctl${cls}" x="${p.x-5}" y="${p.y-5}" width="10" height="10"/>`; }
    const sorted = R.slice().sort((a,b)=> hl ? ((ans(a.p)||{})[hl]?1:0)-((ans(b.p)||{})[hl]?1:0) : 0);
    for(const r of sorted){
      const p = r.p, a = ans(p), on = hl && a ? a[hl] : null;
      const cls = (S.newIds.has(p.id)?' new':'') + (hl ? (on?' hl':' dim') : '');
      s += `<circle class="cs${cls}" data-id="${p.id}" cx="${(p.x+(r.dup?6:0)).toFixed(1)}" cy="${p.y.toFixed(1)}" r="${on?10:8}" style="fill:${caseColor(p)}"/>`;
    }
    for(const id of Object.keys(M.SITES).filter(x=>S.known.has(x))){
      const st = M.SITES[id], col = {water:'#2f6a8a', food:'#b8762a', school:'#2f7a63', event:'#9a7424', ice:'#5a7fa8', farm:'#4a8a3a'}[st.type];
      s += `<g class="m-site${hl===id?' hl':''}${M.isClosed(S,id)?' closed':''}" data-site="${id}" transform="translate(${st.x} ${st.y})"><circle class="ring" r="27"/><circle class="b" r="22" style="stroke:${col}"/><text class="e">${st.icon}</text><text class="m-txt" x="${labelPos(st).x}" y="${labelPos(st).y}" text-anchor="${labelPos(st).anchor}">${st.name}</text><path class="x" d="M-15 -15 L15 15 M15 -15 L-15 15"/></g>`;
    }
    // แหล่งผลิตที่ยังไม่ค้นพบ (โรงน้ำแข็ง สวนผัก) — แสดงเป็นจุด ❓ ให้รู้ว่ายังมีที่ที่ต้องสืบต่อ
    for(const id of Object.keys(M.SITES).filter(x=>M.SITES[x].hidden && !S.known.has(x))){
      const st = M.SITES[id];
      const lp = labelPos(st);
      s += `<g class="m-site unknown" data-unknown="${id}" transform="translate(${st.x} ${st.y})"><circle class="b" r="20"/><text class="e">${st.icon}</text><text class="q" x="16" y="-14">?</text><text class="m-txt" x="${lp.x}" y="${lp.y}" text-anchor="${lp.anchor}">${st.type==='farm'?'สวนผัก':'โรงน้ำแข็ง'}ที่ยังไม่รู้จัก</text></g>`;
    }
    return s + `</svg>`;
  }
  function mapTools(){
    const iv = Object.keys(S.ans).length>0;
    return `<div class="map-tools">
      <label>ระบายสี <select id="vColor"><option value="case">ผู้ป่วย</option><option value="onset">วันเริ่มป่วย</option><option value="age">กลุ่มอายุ</option><option value="water" ${iv?'':'disabled'}>น้ำดื่ม (ตามคำตอบ)</option></select></label>
      <label>ไฮไลต์การสัมผัส <select id="vHl" ${iv?'':'disabled'}><option value="">${iv?'— ไม่เลือก —':'🔒 ต้องสัมภาษณ์ก่อน'}</option>${M.exposures(S).map(e=>`<option value="${e.k}">${e.label}</option>`).join('')}</select></label>
      ${S.controls.length?`<label><input type="checkbox" id="vCtl" ${S.ui.showCtl?'checked':''}> แสดงกลุ่มควบคุม (□)</label>`:''}</div>`;
  }
  function legend(){
    let h = '';
    if(S.ui.colorBy==='case') h += `<span><i style="background:#b8352a"></i>บ้านผู้ป่วย (๑ จุด = ๑ ราย)</span>`;
    if(S.ui.colorBy==='age') h += AGE.map((a,i)=>`<span><i style="background:${AGEC[i]}"></i>${a[0]} ปี</span>`).join('');
    if(S.ui.colorBy==='water') h += Object.keys(WC).map(k=>`<span><i style="background:${WC[k]}"></i>${{W1:'บ่อวัด',W2:'บ่อตลาด',W3:'บ่อริมคลอง',BOT:'น้ำขวด/อื่น ๆ'}[k]}</span>`).join('');
    if(S.ui.colorBy==='onset') h += `<span>สีอ่อน = ป่วยก่อน · สีเข้ม = ป่วยล่าสุด</span>`;
    if(S.controls.length && S.ui.showCtl) h += `<span><i style="border:2px solid #2f6a8a;border-radius:0;background:none"></i>กลุ่มควบคุม</span>`;
    if(S.ui.hl) h += `<span>· ไฮไลต์: <b style="color:var(--gold-2)">${EXL(S.ui.hl)}</b> (จุดเข้ม = ตอบว่าสัมผัส)</span>`;
    return `<div class="legend">${h}</div>`;
  }

  /* ---------- เส้นโค้งการระบาด ---------- */
  function curve(){
    S.flags.vTime = true;
    const R = recs().filter(r=>!r.phantom && !S.clean.dateBad.has(r.p.id)), nd = M.dayOf(S.T), hl = S.ui.hl;
    const days = Array.from({length:nd},(_,i)=>i+1);
    const vals = days.map(d=>R.filter(r=>r.p.onsetDay===d).length);
    const sub = hl ? days.map(d=>R.filter(r=>r.p.onsetDay===d && (ans(r.p)||{})[hl]).length) : null;
    const marks = [{at:.5, label:'🛕 งานบวช'}];
    let row = 1;
    for(const [id,t] of Object.entries(S.closed)){
      marks.push({at:t/24, label:`ปิด${M.SITES[id].name}`, row:row++});
      if(S.reopened[id]!=null) marks.push({at:S.reopened[id]/24, label:`เปิด${M.SITES[id].name}คืน`, row:row++});
      if(S.reclosed[id]!=null) marks.push({at:S.reclosed[id]/24, label:`ปิด${M.SITES[id].name}อีกครั้ง`, row:row++});
    }
    if(S.hygieneAt!=null) marks.push({at:S.hygieneAt/24, label:'รณรงค์ล้างมือ', row:row++});
    if(S.boilAt!=null) marks.push({at:S.boilAt/24, label:'ประกาศต้มน้ำ', row:row++});
    if(S.flags.festival && S.flags.festival!=='cancel' && S.T>=M.FEST_T) marks.push({at:M.FEST_T/24, label:`${M.FEST.icon} ${M.FEST.short}`, row:row++});
    marks.push({at:S.T/24, label:'ตอนนี้', row:0});
    return `<h3 style="font-size:15.5px">ผู้ป่วยรายใหม่ตามวันเริ่มป่วย</h3>
      ${OD.barChart({labels:days.map(d=>{const dt=M.dateOf(d);return String(dt.getDate());}), vals, sub, inc:Math.max(0,nd-2), marks, xt:'วันที่เริ่มป่วย (พ.ย.–ธ.ค. ๒๕๖๙)'})}
      <div class="legend">${hl?`<span><i style="background:var(--red-2);border-radius:2px"></i>ตอบว่าสัมผัส “${EXL(hl)}”</span><span><i style="background:var(--faint);border-radius:2px"></i>ไม่สัมผัส/ยังไม่สัมภาษณ์</span>`:''}<span><i style="background:var(--red-2);opacity:.4;border-radius:2px"></i>ยังรายงานไม่ครบ</span></div>
      <details class="howto"><summary>อ่านกราฟนี้อย่างไร?</summary><ul>
        <li><b>แหล่งโรคครั้งเดียว (point source)</b> — ทุกคนสัมผัสพร้อมกัน กราฟพุ่งขึ้นยอดเดียวแล้วลดภายในช่วงระยะฟักตัว</li>
        <li><b>แหล่งโรคร่วมต่อเนื่อง (continuous common source)</b> — แหล่งโรคยังปล่อยเชื้อ กราฟยืดยาวหรือเพิ่มขึ้นเรื่อย ๆ จนกว่าจะปิดแหล่ง</li>
        <li><b>แพร่กระจายคนสู่คน (propagated)</b> — เป็นระลอกห่างกันประมาณหนึ่งช่วงระยะฟักตัว</li>
        <li>สองวันล่าสุดยังไม่ครบ เพราะผู้ป่วยบางรายยังไม่ถูกรายงาน</li></ul></details>`;
  }

  /* ---------- ตารางวิเคราะห์ ---------- */
  function forest(r){
    if(!r.or) return '';
    const w=124, X = v => 6+(Math.log10(U.clamp(v,.05,200))+1.3)/3.6*(w-12);
    return `<svg class="forest" viewBox="0 0 ${w} 16"><line class="ax" x1="6" x2="${w-6}" y1="8" y2="8"/><line class="one" x1="${X(1)}" x2="${X(1)}" y1="1" y2="15"/><line class="ci" x1="${X(r.lo)}" x2="${X(r.hi)}" y1="8" y2="8"/><rect class="pt${r.lo>1?' s':''}" x="${X(r.or)-3.5}" y="4.5" width="7" height="7"/></svg>`;
  }
  function ana(){
    if(!Object.keys(S.ans).length) return `<div class="lockbox"><div class="big">🗣️</div><b>ยังไม่มีข้อมูลการสัมผัส</b><div>สัมภาษณ์ผู้ป่วยก่อน แล้วเก็บกลุ่มควบคุมเพื่อคำนวณ Odds Ratio</div></div>`;
    const rows = M.analyze(W,S), hasC = S.controls.length>0;
    if(hasC) S.flags.vOR = true;
    let list = rows.slice();
    if(S.ui.sort==='or' && hasC) list.sort((a,b)=>(b.or||0)-(a.or||0));
    let h = `<div class="ptitle"><h3 style="font-size:15.5px;margin:0">${hasC?'การศึกษาแบบ case-control':'สัดส่วนการสัมผัสในผู้ป่วย'}</h3>
      ${hasC?`<label class="muted" style="font-size:13px">เรียงตาม <select id="vSort"><option value="grp">กลุ่มคำถาม</option><option value="or">Odds Ratio</option></select></label>`:''}</div>
      ${hasC?'':`<div class="note">มีแต่ข้อมูลผู้ป่วย — สัดส่วนสูงไม่ได้แปลว่าเสี่ยง ถ้าคนทั้งตำบลก็สัมผัสสิ่งนั้นเหมือนกัน ต้อง <b>เก็บกลุ่มควบคุม</b> มาเทียบ</div>`}
      <div class="atable-wrap"><table class="at"><thead><tr><th>ปัจจัย</th><th>ผู้ป่วย</th><th>กลุ่มควบคุม</th><th>OR <span class="faint">(95% CI)</span></th><th class="pcol">p</th><th>0.1 ─ 1 ─ 10 ─ 100</th></tr></thead><tbody>`;
    let g = null;
    for(const r of list){
      if(S.ui.sort!=='or' || !hasC){ if(r.g!==g){ g = r.g; h += `<tr class="grp"><td colspan="6">${g}</td></tr>`; } }
      const sig = r.or && r.lo>1;
      h += `<tr class="${S.ui.hl===r.k?'sel':''}" data-k="${r.k}"><td class="lbl">${r.label}</td><td>${r.a}/${r.nCase}<br><span class="faint">${U.pct(r.pCase)}</span></td>
        <td>${hasC?`${r.b}/${r.nCtrl}<br><span class="faint">${U.pct(r.pCtrl||0)}</span>`:'—'}</td>
        <td class="${sig?'sig':''}" title="${r.or?'p = '+U.fmtP(r.p):''}">${r.or?`${U.fmtOR(r.or)}${sig?'*':''}<br><span class="faint" style="font-weight:400">${U.fmtOR(r.lo)}–${U.fmtOR(r.hi)}</span>`:'—'}</td><td class="pcol">${r.or?U.fmtP(r.p):'—'}</td><td>${forest(r)}</td></tr>`;
    }
    h += `</tbody></table></div>`;
    if(S.ui.hl && hasC && rows.some(x=>x.k===S.ui.hl)){
      const r = rows.find(x=>x.k===S.ui.hl), st = M.stratify(W,S,S.ui.hl);
      h += `<div class="frame tight" style="margin-top:12px"><h3 style="font-size:15px">เจาะลึก: ${r.label}</h3>
        <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">
        <table class="doc" style="width:auto;background:var(--paper)"><thead><tr><th></th><th>ป่วย</th><th>ไม่ป่วย</th></tr></thead><tbody>
          <tr><td class="l">สัมผัส</td><td>${r.a}</td><td>${r.b}</td></tr><tr><td class="l">ไม่สัมผัส</td><td>${r.c}</td><td>${r.d}</td></tr></tbody></table>
        <div style="flex:1;min-width:240px"><b style="font-size:14px">แยกวิเคราะห์ตามหมู่บ้าน (ควบคุมตัวแปรกวนเชิงพื้นที่)</b>
          <table class="at" style="margin-top:4px"><tbody>${st.strata.map(s=>`<tr><td>${s.v.short}</td><td class="faint">${s.t.join(' / ')}</td><td>${s.or?U.fmtOR(s.or.or):'—'}</td><td>${s.or?forest(s.or):''}</td></tr>`).join('')}
          <tr><td><b>Mantel–Haenszel</b></td><td></td><td class="${st.mh.lo>1?'sig':''}"><b>${isFinite(st.mh.or)?U.fmtOR(st.mh.or):'—'}</b></td><td>${isFinite(st.mh.or)&&!isNaN(st.mh.lo)?forest(st.mh):''}</td></tr></tbody></table>
          <div class="faint" style="font-size:12.5px">ตัวเลขในแต่ละหมู่บ้าน: ป่วยสัมผัส / ไม่ป่วยสัมผัส / ป่วยไม่สัมผัส / ไม่ป่วยไม่สัมผัส</div></div></div></div>`;
    }
    h += `<details class="howto"><summary>อ่านตารางนี้อย่างไร?</summary><ul>
      <li><b>Odds Ratio (OR)</b> = (ผู้ป่วยที่สัมผัส × กลุ่มควบคุมที่ไม่สัมผัส) ÷ (ผู้ป่วยที่ไม่สัมผัส × กลุ่มควบคุมที่สัมผัส) — OR &gt; 1 แปลว่าสัมผัสแล้วเสี่ยงขึ้น</li>
      <li><b>95% CI</b> ไม่คร่อม 1 (เส้นประในกราฟ) = มีนัยสำคัญทางสถิติ (ทำเครื่องหมาย *)</li>
      <li>ถาม ${U.thaiNum(M.exposures(S).length)} ข้อ ที่ p &lt; 0.05 อาจเกิดขึ้นโดยบังเอิญได้ราว ๑ ข้อ — ต้องดูขนาดผล ความเป็นไปได้ทางชีววิทยา และหลักฐานอื่น</li>
      <li>ถ้าสองปัจจัยสูงพร้อมกัน แตะแถวเพื่อ <b>แยกวิเคราะห์ตามหมู่บ้าน</b> — ถ้า OR รวม (Mantel–Haenszel) ลดลงมาใกล้ 1 แสดงว่าเป็นตัวแปรกวน</li></ul></details>`;
    return h;
  }

  /* ---------- อาการ / ระยะฟักตัว / อายุ ---------- */
  function sym(){
    S.flags.vPerson = true;
    const R = recs().filter(r=>!r.phantom), n = R.length || 1;
    const pc = M.SYMPTOMS.map(([k,t])=>({t, v:R.filter(r=>r.p.sym[k]).length/n*100}));
    const adm = R.filter(r=>r.p.admit).length;
    let h = `<h3 style="font-size:15.5px">อาการของผู้ป่วย (${R.length} ราย)</h3>` + OD.barChart({labels:pc.map(x=>x.t), vals:pc.map(x=>x.v), pct:true, h:210});
    h += `<div class="legend"><span>นอนโรงพยาบาล ${adm} ราย (${U.pct(adm/n)})</span></div>`;
    const ages = AGE.map(a=>R.filter(r=>!S.clean.ageBad.has(r.p.id) && r.p.age>=a[1] && r.p.age<=a[2]).length);
    const bad = R.filter(r=>S.clean.ageBad.has(r.p.id)).length;
    h += `<h3 style="font-size:15.5px;margin-top:12px">ผู้ป่วยตามกลุ่มอายุ</h3>` + OD.barChart({labels:AGE.map(a=>a[0]).concat(bad?['ผิดปกติ']:[]), vals:ages.concat(bad?[bad]:[]), h:200, xt:'อายุ (ปี)'});
    const ev = R.filter(r=>(ans(r.p)||{}).E && r.p.onset>12 && r.p.onset<12+120);
    if(ev.length>=3){
      const inc = ev.map(r=>r.p.onset-12.5), bins = Array.from({length:10},(_,i)=>inc.filter(x=>x>=i*12&&x<(i+1)*12).length);
      h += `<h3 style="font-size:15.5px;margin-top:12px">ถ้าติดจากงานบวช: ระยะฟักตัว (เวลาเริ่มป่วย − ส. ๒๑ พ.ย. ๑๒:๓๐ น.)</h3>` +
        OD.barChart({labels:bins.map((_,i)=>`${i*12}`), vals:bins, h:190, xt:'ชั่วโมงหลังงานเลี้ยง'}) +
        `<div class="legend"><span>ผู้ป่วยที่ตอบว่าไปงานบวช ${ev.length} ราย · มัธยฐาน <b style="color:var(--gold-2)">${Math.round(U.median(inc))} ชม.</b> — ถ้าการกระจายแคบและสอดคล้องกับเชื้อใดเชื้อหนึ่ง จึงน่าจะเป็นแหล่งโรคครั้งเดียว</span></div>`;
    }
    return h + `<details class="howto"><summary>ใช้อาการช่วยอนุมานเชื้ออย่างไร?</summary><ul><li>อาเจียนเด่นและหายเร็ว → นึกถึงไวรัส (โนโรไวรัส)</li><li>ไข้สูง + ปวดท้อง → นึกถึงซาลโมเนลลา</li><li>ถ่ายเป็นน้ำมากจนขาดน้ำ ไม่มีไข้ → นึกถึงอหิวาตกโรค</li><li>เปิด 📚 คู่มือเชื้อก่อโรค เพื่อเทียบระยะฟักตัว</li></ul></details>`;
  }

  /* ---------- รายชื่อ ---------- */
  function list(){
    const R = recs().slice().sort((a,b)=>(b.p.onset||0)-(a.p.onset||0));
    const nConf = R.filter(r=>S.confirmed.has(r.p.id)).length, nHid = M.hiddenFound(W,S);
    return `<div class="faint" style="font-size:13px;margin-bottom:6px">${R.length} รายการ · ผู้ป่วยยืนยัน ${nConf} · ผู้ป่วยสงสัย ${R.length-nConf}${S.acfAt!=null?` · พบจากการค้นหาเชิงรุก ${nHid}`:' · ยังไม่ได้ค้นหาผู้ป่วยเชิงรุก'} · แถวสีชมพู = รายงานใหม่ · 🔐 ใช้รหัสแทนชื่อ</div>
      <div class="linelist" style="max-height:460px"><table class="doc" style="background:var(--paper)"><thead><tr><th>รหัส</th><th>ประเภท</th><th>อายุ</th><th>เพศ</th><th>หมู่</th><th>เริ่มป่วย</th><th>อาการ</th><th>น้ำดื่ม</th><th>ร้านอาหาร</th><th>ร.ร.</th><th>งานบวช</th></tr></thead><tbody>${
      R.map(r=>{ const p=r.p, a=ans(p);
        const food = a ? ['R1','R2','R3','R4'].filter(k=>a[k]).map(k=>M.SITES[k].icon).join(' ') || '—' : '';
        const wat = a ? ({W1:'บ่อวัด',W2:'บ่อตลาด',W3:'บ่อริมคลอง'}[['W1','W2','W3'].find(k=>a[k])] || 'น้ำขวด') : '';
        const cls = r.phantom ? 'สงสัย' : M.classOf(S,p);
        return `<tr class="${S.newIds.has(p.id)?'flag':''}"><td>${p.ini||('P'+String(p.id).padStart(3,'0'))}${r.dup?' ²':''}</td><td style="${cls==='ยืนยัน'?'color:#8a1f12;font-weight:700':''}">${cls}${p.hidden?' 🏘️':''}</td><td>${S.clean.ageBad.has(p.id)?p.age+'0':p.age}</td><td>${p.sex}</td><td>${p.v}</td>
          <td>${r.phantom?'15/08/2569':S.clean.dateBad.has(p.id)?M.fmtDateBE(p.onsetDay,true):M.fmtDay(p.onsetDay)}</td><td class="l">${r.phantom?'ท้องร่วงเรื้อรัง':M.SYMPTOMS.filter(([k])=>p.sym[k]).map(([,t])=>t).slice(0,3).join(', ')}${p.admit?' 🏥':''}</td>
          <td>${a?wat:'<span class="faint">รอสัมภาษณ์</span>'}</td><td>${food}</td><td>${a?(a.S?'✓':'—'):''}</td><td>${a?(a.E?'✓':'—'):''}</td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function evid(){
    if(!S.evidence.length) return `<div class="lockbox"><div class="big">🗂️</div><b>ยังไม่มีหลักฐานภาคสนาม</b><div>ตรวจสิ่งแวดล้อม ส่งแล็บ หรือขอข้อมูลห่วงโซ่อุปทาน — หลักฐานทั้งหมดจะถูกรวบรวมไว้ที่นี่เพื่อใช้เขียนรายงาน</div></div>`;
    const ic = {env:'🔎', lab:'🧪', supply:'📦', rumor:'💬', clinical:'🩺', interview:'🎙️'};
    return `<div class="evs">${S.evidence.slice().reverse().map(e=>`<div class="ev"><span class="k">${ic[e.kind]||'📄'}</span><div><div>${e.text}</div><div class="tm">${M.fmtT(e.t)}</div></div></div>`).join('')}</div>`;
  }

  const TABS = [['curve','📈 เส้นโค้งการระบาด',curve],['ana','📊 วิเคราะห์ OR',ana],['sym','🩺 อาการ/อายุ',sym],['list','📋 รายชื่อ',list],['ev','🗂️ หลักฐาน',evid],['ck','✅ เช็คลิสต์',()=>OD.checklist.html(W,S)]];
  function render(w, s){
    W = w; S = s;
    U.$('#fMap').innerHTML = `<div class="ptitle"><h2>แผนที่ตำบลบ้านสุขใจ</h2><span class="faint" style="font-size:12.5px">แตะสถานที่เพื่อไฮไลต์ผู้สัมผัส</span></div>${mapTools()}<div class="mapbox">${mapView()}</div>${legend()}`;
    U.$('#fAna').innerHTML = `<div class="tabs">${TABS.map(([k,l])=>`<button class="tab ${S.ui.tab===k?'on':''}" data-tab="${k}">${l}${k==='ev'&&S.evidence.length?` (${S.evidence.length})`:''}</button>`).join('')}</div><div id="vBody">${TABS.find(t=>t[0]===S.ui.tab)[2]()}</div>`;
    wire();
  }
  function rerender(){ OD.field.render(); }
  function wire(){
    const c = U.$('#vColor'); if(c){ c.value = S.ui.colorBy; c.onchange = e=>{ S.ui.colorBy = e.target.value; S.flags.vPlace = true; rerender(); }; }
    const h = U.$('#vHl'); if(h){ h.value = S.ui.hl || ''; h.onchange = e=>{ S.ui.hl = e.target.value || null; S.flags.vPlace = true; rerender(); }; }
    const k = U.$('#vCtl'); if(k) k.onchange = e=>{ S.ui.showCtl = e.target.checked; rerender(); };
    const so = U.$('#vSort'); if(so){ so.value = S.ui.sort; so.onchange = e=>{ S.ui.sort = e.target.value; rerender(); }; }
    U.$('#fAna .tabs').onclick = e=>{ const b = e.target.closest('[data-tab]'); if(b){ S.ui.tab = b.dataset.tab; rerender(); } };
    U.$$('#vBody tr[data-k]').forEach(tr=>tr.onclick = ()=>{ S.ui.hl = S.ui.hl===tr.dataset.k ? null : tr.dataset.k; rerender(); });
    const svg = U.$('#fmapsvg');
    const HIDDEN_TIP = 'ยังไม่รู้ว่าที่นี่ส่งวัตถุดิบให้ใคร — ค้นพบได้จาก 🔎 ตรวจสิ่งแวดล้อมร้านอาหาร/โรงอาหาร (ดูว่าซื้อน้ำแข็ง/ผักจากไหน) หรือ 📦 ห่วงโซ่อุปทาน';
    svg.onclick = e=>{
      if(e.target.closest('[data-unknown]')){ U.toast('❓ ' + HIDDEN_TIP); return; }
      const g = e.target.closest('.m-site'); if(!g) return; const id = g.dataset.site;
      if(!Object.keys(S.ans).length){ U.toast('🗣️ ต้องสัมภาษณ์ผู้ป่วยก่อน จึงจะรู้ว่าใครเคยสัมผัสที่นี่'); return; }
      if(EXL(id)){ S.ui.hl = S.ui.hl===id ? null : id; S.flags.vPlace = true; rerender(); }
      else U.toast(id==='F3' ? 'สวนผักไม่ใช่สิ่งที่ผู้ป่วยสัมผัสโดยตรง ลองดูข้อ “กินผักสด”' : 'โรงน้ำแข็งไม่ใช่สิ่งที่ผู้ป่วยสัมผัสโดยตรง ลองดูข้อ “ดื่มเครื่องดื่มใส่น้ำแข็งนอกบ้าน”'); };
    svg.onmousemove = e=>{
      const c = e.target.closest('circle.cs'), g = e.target.closest('.m-site');
      if(c){ const p = W.byId(+c.dataset.id), a = ans(p);
        if(!S.flags.vPlace){ S.flags.vPlace = true; const ck = U.$('#fCk'); if(ck) ck.textContent = `✅ ขั้นตอน ${U.thaiNum(OD.checklist.progress(W,S))}/๑๐`; }
        U.tip(e, `<div class="tt-h">${p.ini||'ผู้ป่วย'} · ${p.sex} ${p.age} ปี</div>${M.VILLAGES[p.v-1].name}<br>เริ่มป่วย ${p.onsetDay?M.fmtDay(p.onsetDay):'—'}${p.admit?' · 🏥 นอน รพ.':''}${a?`<br>สัมผัส: ${M.EXPOSURES.filter(x=>a[x.k]===true && x.k!=='HH').map(x=>x.label.replace('งานบวช: ','')).slice(0,6).join(', ')}`:'<br><span class="faint">ยังไม่สัมภาษณ์</span>'}`); }
      else if(g && g.dataset.unknown){ const st = M.SITES[g.dataset.unknown]; U.tip(e, `<div class="tt-h">${st.icon} ${st.type==='farm'?'สวนผัก':'โรงน้ำแข็ง'}ที่ยังไม่รู้จัก</div>${HIDDEN_TIP}`); }
      else if(g){ const id = g.dataset.site; U.tip(e, `<div class="tt-h">${M.SITES[id].icon} ${nm(id)}</div>${S.inspected[id]?S.inspected[id]:'<span class="faint">ยังไม่ได้ตรวจสิ่งแวดล้อม</span>'}${M.isClosed(S,id)?'<br><b>ปิด/งดใช้อยู่</b>':M.wasReopened(S,id)?'<br><b>ถูกเปิดคืนแล้ว</b>':''}`); }
      else U.hideTip();
    };
    svg.onmouseleave = U.hideTip;
  }
  return {render};
})();
