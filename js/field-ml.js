/* =========================================================
   field-ml — แท็บ 🤖 ML ในภาคสนาม
   📉 Logistic regression หลายตัวแปร (ปรับตัวแปรกวน) · 🌳 Decision tree + cross-validation
   💻 ดาวน์โหลดข้อมูล (CSV · Jupyter Notebook · R) และ SQL console
   ========================================================= */
OD.mlViews = (function(){
  const U = OD.u, M = OD.sim, ML = OD.ml;
  const SITE_OF = {W1:'W1',W2:'W2',W3:'W3',R1:'R1',R2:'R2',R3:'R3',R4:'R4',S:'S',E:'E',E_kj:'E',E_lb:'E',E_ds:'E'};
  const EXL = k => (M.EXPOSURES.find(e=>e.k===k) || {}).label || k;
  const vShort = v => M.VILLAGES[v-1].short;
  const MAXF = 8;

  /* ---------- ชุดข้อมูล ----------
     หนึ่งแถว = หนึ่งคนที่ตอบแบบสอบถาม (ผู้ป่วยในรายชื่อ + กลุ่มควบคุม)
     ปัญหาข้อมูลจากบทที่ ๒ (นับซ้ำ อายุผิด ผู้ไม่เข้านิยาม) ติดมาด้วย เหมือนงานจริง */
  function rows(W,S){
    const out = [];
    for(const r of M.records(W,S)) if(S.ans[r.p.id]) out.push({p:r.p, y:1, a:S.ans[r.p.id], dup:r.dup});
    for(const id of S.controls) out.push({p:W.byId(id), y:0, a:S.ans[id]});
    return out;
  }
  const ageOf = (S,p) => S.clean.ageBad.has(p.id) ? p.age*10 : p.age;
  const pid = p => 'P' + String((p.id*7919)%9973).padStart(4,'0');   // รหัสแทนตัวตน (คนเดียวกันได้รหัสเดิม จึงหาข้อมูลซ้ำได้)
  const ready = S => S.controls.length>0 && Object.keys(S.ans).length>0;

  /* ตัวแปรเริ่มต้นของโมเดล: สมมติฐานที่ตั้งไว้ + ปัจจัยที่ OR หยาบมีนัยสำคัญ */
  function defaultFeats(W,S){
    const ex = new Set(M.exposures(S).map(e=>e.k)), out = S.hyp.filter(k=>ex.has(k));
    M.analyze(W,S).filter(r=>r.or && r.lo>1).sort((a,b)=>b.or-a.or).forEach(r=>{ if(out.length<5 && !out.includes(r.k)) out.push(r.k); });
    if(!out.length) M.analyze(W,S).filter(r=>r.or).sort((a,b)=>b.or-a.or).slice(0,3).forEach(r=>out.push(r.k));
    return out.slice(0, MAXF);
  }
  function feats(W,S){
    if(!S.ui.mlFeat) S.ui.mlFeat = defaultFeats(W,S);
    const ex = new Set(M.exposures(S).map(e=>e.k));
    return S.ui.mlFeat.filter(k=>ex.has(k));
  }

  /* ---------- กราฟเล็ก ---------- */
  function lineChart(o){
    const w = o.w||340, h = o.h||190, m = {l:38, r:10, t:12, b:34}, iw = w-m.l-m.r, ih = h-m.t-m.b, n = o.x.length;
    const X = i => m.l + (n>1 ? i*iw/(n-1) : iw/2), Y = v => m.t + ih - (v-o.lo)/(o.hi-o.lo)*ih;
    let s = `<svg viewBox="0 0 ${w} ${h}" class="chart lc">`;
    for(let v=o.lo; v<=o.hi+1e-9; v+=o.step) s += `<line class="g" x1="${m.l}" x2="${w-m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="t" x="${m.l-5}" y="${Y(v)+4}" text-anchor="end">${o.fmt?o.fmt(v):v}</text>`;
    o.x.forEach((lb,i)=>{ s += `<text class="t" x="${X(i)}" y="${h-12}" text-anchor="middle">${lb}</text>`; });
    if(o.base!=null) s += `<line class="base" x1="${m.l}" x2="${w-m.r}" y1="${Y(o.base)}" y2="${Y(o.base)}"/>`;
    if(o.mark!=null) s += `<line class="mk" x1="${X(o.mark)}" x2="${X(o.mark)}" y1="${m.t}" y2="${m.t+ih}"/>`;
    o.series.forEach(se=>{
      s += `<polyline class="${se.cls}" points="${se.v.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}"/>`;
      se.v.forEach((v,i)=>{ s += `<circle class="${se.cls}" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${i===o.mark?4.5:3}"><title>${se.name}: ${o.fmt?o.fmt(v):v}</title></circle>`; });
    });
    if(o.xt) s += `<text class="t" x="${m.l+iw/2}" y="${h-1}" text-anchor="middle">${o.xt}</text>`;
    return s + `</svg>`;
  }
  function rocChart(pts, auc){
    const S = 150, p = 22, X = v => p + v*(S-p-6), Y = v => S-p - v*(S-p-6);
    return `<svg viewBox="0 0 ${S} ${S}" class="chart roc"><rect class="frm" x="${p}" y="6" width="${S-p-6}" height="${S-p-6}"/>
      <line class="base" x1="${X(0)}" y1="${Y(0)}" x2="${X(1)}" y2="${Y(1)}"/>
      <polyline class="l1" points="${pts.map(([a,b])=>`${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(' ')}"/>
      <text class="t" x="${p+(S-p)/2}" y="${S-4}" text-anchor="middle">1 − ความจำเพาะ</text>
      <text class="t" x="9" y="${(S-p)/2}" text-anchor="middle" transform="rotate(-90 9 ${(S-p)/2})">ความไว</text>
      <text class="v" x="${X(.62)}" y="${Y(.18)}" text-anchor="middle">AUC ${isNaN(auc)?'—':auc.toFixed(2)}</text></svg>`;
  }
  function forest(r){
    if(!r || !isFinite(r.or) || isNaN(r.lo)) return '';
    const w = 124, X = v => 6+(Math.log10(U.clamp(v,.05,200))+1.3)/3.6*(w-12);
    return `<svg class="forest" viewBox="0 0 ${w} 16"><line class="ax" x1="6" x2="${w-6}" y1="8" y2="8"/><line class="one" x1="${X(1)}" x2="${X(1)}" y1="1" y2="15"/><line class="ci" x1="${X(r.lo)}" x2="${X(r.hi)}" y1="8" y2="8"/><rect class="pt${r.lo>1?' s':''}" x="${X(r.or)-3.5}" y="4.5" width="7" height="7"/></svg>`;
  }
  const pct = v => isNaN(v) ? '—' : Math.round(v*100)+'%';

  /* ---------- 📉 Logistic regression ---------- */
  function lrModel(W,S){
    const F = feats(W,S), R = rows(W,S), cols = F.map(k=>({k, t:'exp', label:EXL(k)}));
    if(S.ui.mlVil) for(const v of M.VILLAGES.slice(1)) cols.push({k:'v'+v.id, t:'vil', v:v.id, label:`อยู่${v.short} (เทียบ${vShort(1)})`});
    if(S.ui.mlChild) cols.push({k:'child', t:'child', label:'อายุ ≤ ๑๕ ปี'});
    const X = [], y = []; let drop = 0;
    for(const r of R){
      if(F.some(k=>r.a[k]==null)){ drop++; continue; }
      X.push(cols.map(c=>c.t==='vil' ? (r.p.v===c.v?1:0) : c.t==='child' ? (ageOf(S,r.p)<=15?1:0) : (r.a[c.k]?1:0)));
      y.push(r.y);
    }
    if(!cols.length || y.length<10 || !y.some(v=>v) || !y.some(v=>!v)) return {cols, X, y, drop, empty:true};
    const fit = ML.logistic(X, y);
    const prob = X.map(x=>fit.predict(x));
    const cvp = ML.cvPredict(X, y, 5, (W.seed^0x5bd1e995)>>>0, (a,b)=>ML.logistic(a,b));
    return {cols, X, y, drop, fit, auc:ML.auc(y, prob), cvAuc:ML.auc(y, cvp), roc:ML.roc(y, cvp)};
  }
  function lrHtml(W,S){
    const F = feats(W,S), crude = Object.fromEntries(M.analyze(W,S).map(r=>[r.k, r]));
    const m = lrModel(W,S);
    let h = `<div class="ml-step"><b>๑. เลือกตัวแปรเข้าโมเดล</b> <span class="faint">(สูงสุด ${U.thaiNum(MAXF)} ตัว · แตะเพื่อเพิ่ม/เอาออก)</span>
      <div class="fchips">${M.exposures(S).map(e=>`<button class="fchip ${F.includes(e.k)?'on':''}" data-mlf="${e.k}" title="${e.g}">${e.label}</button>`).join('')}</div>
      <div class="ml-opts"><label><input type="checkbox" id="mlVil" ${S.ui.mlVil?'checked':''}> ปรับตามหมู่บ้าน (ตัวแปรกวนเชิงพื้นที่)</label>
        <label><input type="checkbox" id="mlChild" ${S.ui.mlChild?'checked':''}> ปรับตามอายุ (เด็ก ≤ ๑๕ ปี)</label></div></div>`;
    if(m.empty) return h + `<div class="lockbox" style="padding:16px">เลือกตัวแปรอย่างน้อย ๑ ตัว และต้องมีข้อมูลครบอย่างน้อย ๑๐ แถว</div>`;
    S.flags.vML = true;
    h += `<div class="ml-step"><b>๒. ผลของโมเดล</b> <span class="faint">— ${U.thaiNum(m.y.length)} แถว (ผู้ป่วย ${m.y.filter(v=>v).length} · กลุ่มควบคุม ${m.y.filter(v=>!v).length})${m.drop?` · ตัดแถวที่ตอบ “ไม่ทราบ” ออก ${m.drop} แถว (complete-case)`:''}</span>
      <div class="atable-wrap"><table class="at ml-t"><thead><tr><th>ตัวแปร</th><th>OR หยาบ</th><th>OR ที่ปรับแล้ว <span class="faint">(95% CI)</span></th><th class="pcol">p</th><th class="fcol">0.1 ─ 1 ─ 10 ─ 100</th></tr></thead><tbody>`;
    const notes = [];
    m.cols.forEach((c,i)=>{
      const a = m.fit.coef[i+1], cr = c.t==='exp' ? crude[c.k] : null, sig = a.lo>1;
      let flag = '';
      if(cr && cr.or && cr.lo>1 && !sig){ flag = ' ⚠️'; notes.push(`<b>${c.label}</b>: OR หยาบมีนัยสำคัญ (${U.fmtOR(cr.or)}) แต่หลังปรับตัวแปรอื่นเหลือ ${U.fmtOR(a.or)} และ CI คร่อม 1 — ความสัมพันธ์เดิมอาจมาจาก <b>ตัวแปรกวน</b>`); }
      else if(c.t==='exp' && sig) flag = ' ✅';
      h += `<tr class="${c.t!=='exp'?'adj':''}"><td class="lbl">${c.label}${flag}</td><td>${cr&&cr.or?U.fmtOR(cr.or):'—'}</td>
        <td class="${sig?'sig':''}">${U.fmtOR(a.or)}${sig?'*':''}<br><span class="faint" style="font-weight:400">${U.fmtOR(a.lo)}–${U.fmtOR(a.hi)}</span></td><td class="pcol">${U.fmtP(a.p)}</td><td class="fcol">${forest(a)}</td></tr>`;
    });
    h += `</tbody></table></div>`;
    if(notes.length) h += `<div class="note red" style="font-size:13.5px">${notes.join('<br>')}</div>`;
    const keep = m.cols.map((c,i)=>({c, a:m.fit.coef[i+1]})).filter(x=>x.c.t==='exp' && x.a.lo>1);
    if(keep.length) h += `<div class="note jade" style="font-size:13.5px">ปัจจัยที่ยังสัมพันธ์กับการป่วยแม้ปรับตัวแปรอื่นในโมเดลแล้ว: ${keep.map(x=>`<b>${x.c.label}</b> (OR ${U.fmtOR(x.a.or)})`).join(' · ')}</div>`;
    h += `<div class="ml-perf"><div>${rocChart(m.roc, m.cvAuc)}</div><div class="ml-kpi">
        <div><span>AUC (ข้อมูลที่ใช้ฝึก)</span><b>${isNaN(m.auc)?'—':m.auc.toFixed(2)}</b></div>
        <div><span>AUC แบบ 5-fold cross-validation</span><b>${isNaN(m.cvAuc)?'—':m.cvAuc.toFixed(2)}</b></div>
        <div class="faint" style="font-size:12.5px">AUC 0.5 = เดาสุ่ม · 1.0 = แยกผู้ป่วยได้สมบูรณ์ — ค่าจาก cross-validation บอกว่าโมเดลจะทำงานกับข้อมูลใหม่ได้ดีแค่ไหน (ต่ำกว่าค่าจากข้อมูลฝึกเสมอ)</div></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-sm btn-gold" data-mlsave="1" ${keep.length?'':'disabled'}>📌 บันทึกปัจจัยที่มีนัยสำคัญเป็นหลักฐาน (${keep.length})</button></div></div>`;
    h += `<details class="howto"><summary>Logistic regression ต่างจากตาราง OR อย่างไร?</summary><ul>
      <li>ตาราง OR ดูทีละปัจจัย (OR หยาบ) ส่วน <b>logistic regression</b> ใส่หลายปัจจัยพร้อมกัน แล้วให้ <b>OR ที่ปรับแล้ว</b> = ผลของปัจจัยนั้นเมื่อปัจจัยอื่นในโมเดลคงที่</li>
      <li>ถ้า OR หยาบสูงแต่ OR ที่ปรับแล้วลดลงใกล้ 1 แปลว่าความสัมพันธ์เดิมถูก “ยืม” มาจากปัจจัยอื่น — นี่คือการควบคุม <b>ตัวแปรกวน</b> แบบเดียวกับ Mantel–Haenszel แต่ทำได้หลายตัวพร้อมกัน</li>
      <li>ใส่ตัวแปรมากเกินไปเมื่อข้อมูลน้อย ช่วงความเชื่อมั่นจะกว้างมาก (กฎคร่าว ๆ: ผู้ป่วยราว ๑๐ รายต่อหนึ่งตัวแปร)</li>
      <li>เกมนี้ใส่ ridge เล็กน้อย (λ = 0.1) กันค่าพุ่งเป็นอนันต์เมื่อทุกคนในกลุ่มหนึ่งป่วยหมด (separation) และตัดแถวที่ตอบ “ไม่ทราบ” ออก</li>
      <li><b>AUC</b> และ <b>cross-validation</b> ใช้ประเมินพลังทำนาย แต่การสอบสวนโรคต้องการรู้ “สาเหตุ” — โมเดลที่ทำนายแม่นไม่ได้แปลว่าทุกตัวแปรเป็นสาเหตุ</li></ul></details>`;
    return h;
  }
  function saveLR(W,S){
    const m = lrModel(W,S); if(m.empty) return;
    const adj = [S.ui.mlVil?'หมู่บ้าน':null, S.ui.mlChild?'อายุ':null].filter(Boolean);
    S.evidence = S.evidence.filter(e=>e.kind!=='ml');
    const keep = m.cols.map((c,i)=>({c, a:m.fit.coef[i+1]})).filter(x=>x.c.t==='exp' && x.a.lo>1).sort((a,b)=>b.a.or-a.a.or).slice(0,3);
    for(const {c, a} of keep) M.addEvidence(S, {id:'ml-'+c.k, kind:'ml', k:c.k, site:SITE_OF[c.k]||null, strength:'strong',
      text:`Logistic regression (${m.cols.filter(x=>x.t==='exp').length} ปัจจัย${adj.length?` + ปรับ${adj.join('/')}`:''}): ${c.label} OR ที่ปรับแล้ว = ${U.fmtOR(a.or)} (95% CI ${U.fmtOR(a.lo)}–${U.fmtOR(a.hi)})`});
    S.flags.mlSaved = true;
    U.toast(`📌 บันทึกผลโมเดล ${keep.length} ปัจจัยไว้บนกระดานหลักฐานแล้ว`, 'ok');
  }

  /* ---------- 🌳 Decision tree ---------- */
  function treeData(W,S){
    const R = rows(W,S), ex = M.exposures(S);
    const cols = ex.map(e=>({k:e.k, label:e.label})).concat(M.VILLAGES.map(v=>({k:'v'+v.id, v:v.id, label:`อยู่${v.short}`})), [{k:'child', label:'อายุ ≤ ๑๕ ปี'}]);
    const X = R.map(r=>cols.map(c=>c.v ? (r.p.v===c.v?1:0) : c.k==='child' ? (ageOf(S,r.p)<=15?1:0) : (r.a[c.k]?1:0)));
    return {cols, X, y:R.map(r=>r.y)};
  }
  const treeCache = {key:null};
  function treeEval(W,S){
    const key = [W.seed, S.ver, S.controls.length, Object.keys(S.ans).length, S.ui.minLeaf].join('|');
    if(treeCache.key===key) return treeCache.v;
    const d = treeData(W,S), seed = (W.seed^0x27d4eb2d)>>>0, curve = [];
    for(let dep=1; dep<=6; dep++){
      const fit = (a,b)=>ML.tree(a, b, {depth:dep, minLeaf:S.ui.minLeaf});
      const full = fit(d.X, d.y), tr = ML.confusion(d.y, d.X.map(x=>full.predict(x))), cv = ML.confusion(d.y, ML.cvPredict(d.X, d.y, 5, seed, fit));
      curve.push({dep, tr, cv});
    }
    const pos = d.y.filter(v=>v).length, base = Math.max(pos, d.y.length-pos)/Math.max(1,d.y.length);
    treeCache.key = key; treeCache.v = {d, curve, base};
    return treeCache.v;
  }
  function treeNode(nd, cols, lab){
    const pc = nd.n ? nd.pos/nd.n : 0, pred = pc>=.5;
    const head = `<div class="tn ${pred?'sick':'well'}">${lab?`<span class="tl">${lab}</span>`:''}<span class="tc">${U.thaiNum(nd.n)} คน · ป่วย ${U.thaiNum(nd.pos)}</span>
      <span class="tbar"><i style="width:${Math.round(pc*100)}%"></i></span><b>${Math.round(pc*100)}%</b>${nd.f==null?`<span class="tp">${pred?'🔴 ทาย: ป่วย':'⚪ ทาย: ไม่ป่วย'}</span>`:''}</div>`;
    if(nd.f==null) return `<li>${head}</li>`;
    const c = cols[nd.f];
    return `<li>${head}<div class="tq">❓ ${c.label}?</div><ul>${treeNode(nd.yes, cols, 'ใช่')}${treeNode(nd.no, cols, 'ไม่')}</ul></li>`;
  }
  function treeHtml(W,S){
    const {d, curve, base} = treeEval(W,S), dep = S.ui.depth, cur = curve[dep-1];
    const tree = ML.tree(d.X, d.y, {depth:dep, minLeaf:S.ui.minLeaf});
    const bestCv = Math.max(...curve.map(c=>c.cv.acc)), bestDep = curve.find(c=>c.cv.acc===bestCv).dep;
    S.flags.vML = true; if(dep===bestDep) S.flags.treeBest = true;
    const gap = cur.tr.acc - cur.cv.acc;
    const imp = d.cols.map((c,i)=>({c, v:tree.imp[i]})).filter(x=>x.v>0.001).sort((a,b)=>b.v-a.v).slice(0,6);
    let h = `<div class="ml-opts" style="margin-top:0"><label>ความลึกสูงสุด <input type="range" id="mlDep" min="1" max="6" value="${dep}"> <b>${U.thaiNum(dep)}</b></label>
      <label>สมาชิกขั้นต่ำต่อใบ <input type="range" id="mlLeaf" min="1" max="10" value="${S.ui.minLeaf}"> <b>${U.thaiNum(S.ui.minLeaf)}</b></label></div>
      <div class="ml-kpis">
        <div><span>ความแม่นยำ (ข้อมูลที่ใช้ฝึก)</span><b>${pct(cur.tr.acc)}</b></div>
        <div><span>ความแม่นยำ (5-fold CV)</span><b class="${gap>.08?'up':''}">${pct(cur.cv.acc)}</b></div>
        <div><span>ความไว / ความจำเพาะ (CV)</span><b>${pct(cur.cv.sens)} / ${pct(cur.cv.spec)}</b></div>
        <div><span>เดาว่า “ไม่ป่วย” ทุกคน</span><b>${pct(base)}</b></div></div>`;
    if(gap>.08) h += `<div class="note red" style="font-size:13.5px">⚠️ <b>Overfitting</b> — ต้นไม้จำข้อมูลฝึกได้ดี (${pct(cur.tr.acc)}) แต่ทายข้อมูลที่ไม่เคยเห็นได้แย่กว่ามาก (${pct(cur.cv.acc)}) กิ่งลึก ๆ มักเป็นการแยกตามความบังเอิญ</div>`;
    else if(dep===bestDep) h += `<div class="note jade" style="font-size:13.5px">✅ ความลึก ${U.thaiNum(dep)} ให้ความแม่นยำแบบ cross-validation สูงสุด — ซับซ้อนพอดีกับข้อมูล</div>`;
    h += `<div class="ml-two"><div><b style="font-size:14px">ความแม่นยำตามความลึกของต้นไม้</b>
        ${lineChart({x:curve.map(c=>U.thaiNum(c.dep)), lo:.5, hi:1, step:.1, fmt:v=>Math.round(v*100)+'%', base, mark:dep-1, xt:'ความลึก',
          series:[{name:'ข้อมูลฝึก', cls:'l2', v:curve.map(c=>c.tr.acc)}, {name:'cross-validation', cls:'l1', v:curve.map(c=>c.cv.acc)}]})}
        <div class="legend"><span><i style="background:var(--red-2)"></i>ข้อมูลที่ใช้ฝึก</span><span><i style="background:var(--gold-2)"></i>5-fold CV</span><span><i style="background:var(--faint)"></i>เดา “ไม่ป่วย” ทุกคน</span></div></div>
      <div><b style="font-size:14px">ตัวแปรที่ต้นไม้ใช้มากที่สุด (feature importance)</b>
        <div class="imps">${imp.map(x=>`<div class="imp"><span>${x.c.label}</span><span class="tbar"><i style="width:${Math.round(x.v*100)}%"></i></span><b>${Math.round(x.v*100)}%</b></div>`).join('') || '<div class="faint">ต้นไม้ยังไม่แยกกิ่ง</div>'}</div></div></div>
      <b style="font-size:14px;display:block;margin-top:10px">ต้นไม้ตัดสินใจ (${U.thaiNum(tree.leaves)} ใบ)</b>
      <ul class="dtree">${treeNode(tree.root, d.cols, '')}</ul>
      <details class="howto"><summary>อ่านต้นไม้ตัดสินใจอย่างไร?</summary><ul>
        <li>ต้นไม้ถามคำถามใช่/ไม่ทีละข้อ เลือกคำถามที่แยกผู้ป่วยออกจากคนไม่ป่วยได้ “บริสุทธิ์” ที่สุด (Gini impurity) — คำถามบนสุดคือปัจจัยที่แยกได้ดีที่สุด</li>
        <li><b>Cross-validation</b>: แบ่งข้อมูล ๕ ส่วน ฝึกด้วย ๔ ส่วนแล้วทดสอบกับส่วนที่เหลือ วนจนครบ — วัดว่าโมเดลใช้กับคนที่ไม่เคยเห็นได้ดีแค่ไหน</li>
        <li>ต้นไม้ลึกเกินไปจะ <b>overfit</b> คือจำข้อมูลฝึกได้หมดแต่ทำนายข้อมูลใหม่แย่ลง ลองเลื่อนความลึกแล้วดูเส้นสีทองกับสีแดงแยกกัน</li>
        <li>ข้อมูลไม่สมดุล (ไม่ป่วยมากกว่าป่วย) ทำให้ “ความแม่นยำ” หลอกตาได้ — เดาว่าไม่ป่วยทุกคนก็ได้ ${pct(base)} แล้ว จึงต้องดูความไวและความจำเพาะด้วย</li>
        <li>ต้นไม้หาความสัมพันธ์ ไม่ได้พิสูจน์สาเหตุ — ใช้ช่วย <b>ตั้งสมมติฐาน</b> แล้วยืนยันด้วยสิ่งแวดล้อมและแล็บ (ค่าที่ตอบ “ไม่ทราบ” ถูกนับเป็น “ไม่สัมผัส”)</li></ul></details>`;
    return h;
  }

  /* ---------- 💻 ข้อมูล โค้ด และ SQL ---------- */
  function surveyTable(W,S){
    const ex = M.exposures(S);
    return rows(W,S).map(r=>{ const o = {id:pid(r.p), is_case:r.y, village:r.p.v, age:ageOf(S,r.p), sex:r.p.sex==='ชาย'?'M':'F', onset_day: r.y && r.p.onsetDay ? r.p.onsetDay : null};
      for(const e of ex) o[e.k] = r.a[e.k]==null ? null : (r.a[e.k]?1:0);
      return o; });
  }
  function linelistTable(W,S){
    return M.records(W,S).map(r=>{ const p = r.p;
      return {id:pid(p), village:p.v, age:ageOf(S,p), sex:p.sex==='ชาย'?'M':'F', onset_date: r.phantom ? '15/08/2569' : M.fmtDateBE(p.onsetDay, S.clean.dateBad.has(p.id)),
        onset_day: r.phantom ? null : p.onsetDay, admitted:p.admit?1:0, confirmed:S.confirmed.has(p.id)?1:0, community_found:p.hidden?1:0, interviewed:S.ans[p.id]?1:0}; });
  }
  function csv(rowsArr){
    if(!rowsArr.length) return '﻿';
    const cols = Object.keys(rowsArr[0]), q = v => v==null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v);
    return '﻿' + [cols.join(',')].concat(rowsArr.map(r=>cols.map(c=>q(r[c])).join(','))).join('\n');
  }
  function download(S, name, text, type){
    const blob = new Blob([text], {type}), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 800);
    if(S && S.flags) S.flags.coder = true;
    U.toast(`⬇️ ดาวน์โหลด ${name}`, 'ok');
  }
  function pyCode(W,S){
    const F = feats(W,S).length ? feats(W,S) : ['W1','W2','W3'], ex = M.exposures(S).map(e=>e.k);
    return [
['md', `# นักสืบโรคระบาด ๒ — วิเคราะห์ข้อมูลคดีที่ ${W.seed%10000} ต่อด้วย Python\nใช้คู่กับไฟล์ **outbreak_survey.csv** (ผู้ป่วยที่สัมภาษณ์แล้ว + กลุ่มควบคุม) และ **outbreak_linelist.csv** (รายชื่อผู้ป่วยทั้งหมด) วางไว้โฟลเดอร์เดียวกับ notebook นี้\n\nคอลัมน์ \`is_case\` = 1 ผู้ป่วย / 0 กลุ่มควบคุม · คอลัมน์ปัจจัยเสี่ยงเป็น 1 สัมผัส / 0 ไม่สัมผัส / ว่าง = ไม่ทราบ`],
['code', `import pandas as pd\nimport numpy as np\n\ndf = pd.read_csv("outbreak_survey.csv")\nll = pd.read_csv("outbreak_linelist.csv")\nprint(df.shape, ll.shape)\ndf.head()`],
['md', `## 1) ตรวจคุณภาพข้อมูล\nคนเดียวกันได้ \`id\` เดิมเสมอ — ถ้าบทที่ ๒ ยังเก็บรายงานซ้ำไว้จะเห็นที่นี่ · ลองหาอายุที่ผิดปกติ และวันที่ที่ปีไม่เป็น พ.ศ. ด้วย`],
['code', `print("id ซ้ำ:", df[df.duplicated("id", keep=False)].id.unique())\nprint(ll.describe())\nll[~ll.onset_date.astype(str).str.endswith("2569")]`],
['md', `## 2) เส้นโค้งการระบาด (ระบาดวิทยาเชิงพรรณนา)`],
['code', `ll.groupby("onset_day").size().plot(kind="bar", title="ผู้ป่วยตามวันเริ่มป่วย");`],
['md', `## 3) Odds Ratio รายปัจจัย (ตาราง 2×2 + 95% CI แบบ Woolf)`],
['code', `exposures = ${JSON.stringify(ex)}\n\ndef odds_ratio(d, col):\n    d = d[[col, "is_case"]].dropna()\n    a = ((d[col]==1)&(d.is_case==1)).sum(); b = ((d[col]==1)&(d.is_case==0)).sum()\n    c = ((d[col]==0)&(d.is_case==1)).sum(); e = ((d[col]==0)&(d.is_case==0)).sum()\n    if 0 in (a, b, c, e):\n        a, b, c, e = a+.5, b+.5, c+.5, e+.5\n    orr = a*e/(b*c); se = np.sqrt(1/a + 1/b + 1/c + 1/e)\n    return pd.Series({"OR": orr, "low": np.exp(np.log(orr)-1.96*se), "high": np.exp(np.log(orr)+1.96*se)})\n\npd.DataFrame({c: odds_ratio(df, c) for c in exposures}).T.sort_values("OR", ascending=False).round(2)`],
['md', `## 4) Logistic regression หลายตัวแปร (ปรับตัวแปรกวนตามหมู่บ้าน)\nตัวแปรด้านล่างคือชุดที่คุณเลือกไว้ในเกม ลองเพิ่ม/ลด แล้วดูว่า OR ที่ปรับแล้วเปลี่ยนไปอย่างไร`],
['code', `import statsmodels.formula.api as smf\n\nfeatures = ${JSON.stringify(F)}\nd = df.dropna(subset=features)\nm = smf.logit("is_case ~ " + " + ".join(features) + " + C(village)", data=d).fit(disp=0)\nprint(m.summary())\nnp.exp(pd.concat([m.params, m.conf_int()], axis=1)).set_axis(["OR", "low", "high"], axis=1).round(2)`],
['md', `## 5) Decision tree + cross-validation (scikit-learn)`],
['code', `from sklearn.tree import DecisionTreeClassifier, export_text\nfrom sklearn.model_selection import cross_val_score\n\nX = df[exposures].fillna(0); y = df.is_case\nfor depth in range(1, 7):\n    clf = DecisionTreeClassifier(max_depth=depth, min_samples_leaf=3, random_state=0)\n    print(depth, "CV accuracy =", cross_val_score(clf, X, y, cv=5).mean().round(3))\n\nclf = DecisionTreeClassifier(max_depth=3, min_samples_leaf=3, random_state=0).fit(X, y)\nprint(export_text(clf, feature_names=list(X.columns)))`],
['md', `## แบบฝึกหัดต่อยอด\n1. ลบข้อมูลซ้ำ แล้วคำนวณ OR ใหม่ — เปลี่ยนไปมากไหม\n2. ลอง \`RandomForestClassifier\` แล้วเทียบ feature importance กับต้นไม้ต้นเดียว\n3. คำนวณ Mantel–Haenszel OR ด้วย \`statsmodels.stats.contingency_tables.StratifiedTable\`\n4. ถ้าข้อมูลน้อยมาก ลอง Firth logistic regression หรือ exact logistic regression`],
    ];
  }
  function notebook(W,S){
    const cell = ([type, src]) => Object.assign({cell_type: type==='md'?'markdown':'code', metadata:{}, source: src.split('\n').map((l,i,a)=>i<a.length-1 ? l+'\n' : l)},
      type==='md' ? {} : {execution_count:null, outputs:[]});
    return JSON.stringify({cells: pyCode(W,S).map(cell), metadata:{kernelspec:{display_name:'Python 3', language:'python', name:'python3'}, language_info:{name:'python'}}, nbformat:4, nbformat_minor:5}, null, 1);
  }
  function rCode(W,S){
    const F = feats(W,S).length ? feats(W,S) : ['W1','W2','W3'];
    return `# นักสืบโรคระบาด ๒ — คดีที่ ${W.seed%10000} วิเคราะห์ต่อด้วย R
df <- read.csv("outbreak_survey.csv", fileEncoding = "UTF-8-BOM")
str(df)

# Odds Ratio รายปัจจัย
for (v in ${'c('+M.exposures(S).map(e=>`"${e.k}"`).join(', ')+')'}) {
  t <- table(factor(df[[v]], levels = c(1, 0)), factor(df$is_case, levels = c(1, 0)))
  if (any(t == 0)) t <- t + 0.5
  or <- t[1,1] * t[2,2] / (t[1,2] * t[2,1]); se <- sqrt(sum(1 / t))
  cat(sprintf("%-6s OR = %6.2f (%5.2f-%6.2f)\\n", v, or, exp(log(or) - 1.96*se), exp(log(or) + 1.96*se)))
}

# Logistic regression หลายตัวแปร ปรับตามหมู่บ้าน
m <- glm(is_case ~ ${F.join(' + ')} + factor(village), family = binomial, data = df)
summary(m)
round(exp(cbind(OR = coef(m), confint.default(m))), 2)

# Decision tree
# install.packages("rpart")
library(rpart)
fit <- rpart(factor(is_case) ~ ${M.exposures(S).map(e=>e.k).join(' + ')}, data = df, method = "class",
             control = rpart.control(maxdepth = 3, minbucket = 3))
print(fit)
`;
  }

  /* SQL console — โหลดตัวประมวลผล SQL (alasql) จาก CDN เมื่อเปิดใช้ครั้งแรกเท่านั้น */
  const SQL_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/alasql/4.19.1/alasql.min.js';
  let sqlLoad = null;
  const loadSql = () => sqlLoad || (sqlLoad = new Promise((res, rej)=>{
    if(window.alasql) return res(window.alasql);
    const s = document.createElement('script'); s.src = SQL_SRC; s.async = true;
    s.onload = () => window.alasql ? res(window.alasql) : rej(new Error('no alasql'));
    s.onerror = () => { sqlLoad = null; rej(new Error('load failed')); };
    document.head.appendChild(s);
  }));
  const SAMPLES = [
    ['ผู้ป่วยตามหมู่บ้าน', 'SELECT village, COUNT(*) AS n\nFROM linelist\nGROUP BY village\nORDER BY n DESC'],
    ['เส้นโค้งการระบาด', 'SELECT onset_day, COUNT(*) AS n\nFROM linelist\nWHERE onset_day IS NOT NULL\nGROUP BY onset_day\nORDER BY onset_day'],
    ['หาข้อมูลซ้ำ', 'SELECT id, COUNT(*) AS n\nFROM linelist\nGROUP BY id\nHAVING COUNT(*) > 1'],
    ['สัดส่วนการสัมผัส ผู้ป่วย vs ควบคุม', 'SELECT is_case, COUNT(*) AS n,\n  ROUND(AVG(W1)*100) AS pct_W1, ROUND(AVG(W2)*100) AS pct_W2,\n  ROUND(AVG(W3)*100) AS pct_W3, ROUND(AVG(R2)*100) AS pct_R2\nFROM survey\nGROUP BY is_case'],
    ['ตาราง 2×2', 'SELECT is_case, W1, COUNT(*) AS n\nFROM survey\nWHERE W1 IS NOT NULL\nGROUP BY is_case, W1\nORDER BY is_case DESC, W1 DESC'],
    ['อายุผิดปกติ', 'SELECT * FROM linelist\nWHERE age > 110 OR age < 0'],
  ];
  function codeHtml(W,S){
    const nS = rows(W,S).length, nL = M.records(W,S).length;
    return `<div class="ml-step"><b>⬇️ ดาวน์โหลดข้อมูลคดีนี้ไปวิเคราะห์ต่อ</b> <span class="faint">— ข้อมูลใช้รหัสแทนชื่อ (PDPA) และมีปัญหาคุณภาพข้อมูลจริงจากบทที่ ๒ ติดไปด้วย</span>
      <div class="dl-row"><button class="btn btn-sm" data-dl="survey">📄 outbreak_survey.csv <small>(${nS} แถว)</small></button>
        <button class="btn btn-sm" data-dl="linelist">📄 outbreak_linelist.csv <small>(${nL} แถว)</small></button>
        <button class="btn btn-sm btn-gold" data-dl="ipynb">📓 Jupyter Notebook (Python)</button>
        <button class="btn btn-sm" data-dl="r">📊 R script</button></div>
      <div class="faint" style="font-size:12.5px">เปิด notebook ฟรีได้ใน Google Colab / Jupyter / VS Code — อัปโหลดไฟล์ CSV ทั้งสองไว้ในโฟลเดอร์เดียวกัน</div></div>
      <div class="ml-step"><b>🗄️ SQL console</b> <span class="faint">— ตาราง <code>linelist</code> (รายชื่อผู้ป่วยทั้งหมด) และ <code>survey</code> (ผู้ตอบแบบสอบถาม)</span>
        <div class="sql-samples">${SAMPLES.map(([t],i)=>`<button class="fchip" data-sqls="${i}">${t}</button>`).join('')}</div>
        <textarea id="sqlIn" class="sql-in" spellcheck="false" rows="5">${U.esc(S.ui.sql || SAMPLES[0][1])}</textarea>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn btn-sm btn-gold" data-sqlrun="1">▶ รันคำสั่ง</button><span class="faint" style="font-size:12.5px">Ctrl+Enter เพื่อรัน · ใช้ alasql (โหลดจากอินเทอร์เน็ตครั้งแรก)</span></div>
        <div id="sqlOut" class="sql-out"></div>
        <details class="howto"><summary>พจนานุกรมข้อมูล (data dictionary)</summary>
          <p style="margin:6px 0"><b>linelist</b>: id · village (หมู่ ๑–๕) · age · sex (M/F) · onset_date (วว/ดด/ปปปป) · onset_day (วันที่ ๑ = ส. ๒๑ พ.ย.) · admitted · confirmed (ผลแล็บยืนยัน) · community_found (พบจากค้นหาเชิงรุก) · interviewed</p>
          <p style="margin:6px 0"><b>survey</b>: id · is_case (1/0) · village · age · sex · onset_day · และปัจจัยเสี่ยง (1/0/NULL):</p>
          <table class="doc" style="font-size:12.5px"><tbody>${M.exposures(S).map(e=>`<tr><td><code>${e.k}</code></td><td class="l">${e.label}</td></tr>`).join('')}</tbody></table></details></div>`;
  }
  async function runSql(W,S){
    const box = U.$('#sqlOut'), q = (U.$('#sqlIn')||{}).value || ''; if(!box) return;
    S.ui.sql = q;
    box.innerHTML = '<span class="faint">กำลังประมวลผล…</span>';
    let A;
    try{ A = await loadSql(); }
    catch(e){ box.innerHTML = '<div class="note red">โหลดตัวประมวลผล SQL ไม่สำเร็จ — ต้องต่ออินเทอร์เน็ตครั้งแรก (ระหว่างนี้ใช้ปุ่มดาวน์โหลด CSV แล้ววิเคราะห์ในโปรแกรมอื่นได้)</div>'; return; }
    try{
      const db = new A.Database();
      db.exec('CREATE TABLE linelist'); db.tables.linelist.data = linelistTable(W,S);
      db.exec('CREATE TABLE survey'); db.tables.survey.data = surveyTable(W,S);
      let r = db.exec(q);
      if(Array.isArray(r) && r.length && Array.isArray(r[r.length-1])) r = r[r.length-1];
      S.flags.coder = true;
      if(!Array.isArray(r)){ box.innerHTML = `<div class="faint">ผลลัพธ์: ${U.esc(JSON.stringify(r))}</div>`; return; }
      if(!r.length){ box.innerHTML = '<div class="faint">ไม่มีแถวที่ตรงเงื่อนไข</div>'; return; }
      const cols = Object.keys(r[0]);
      box.innerHTML = `<div class="faint" style="font-size:12.5px">${r.length} แถว${r.length>200?' (แสดง ๒๐๐ แถวแรก)':''}</div><div class="linelist" style="max-height:260px"><table class="doc"><thead><tr>${cols.map(c=>`<th>${U.esc(c)}</th>`).join('')}</tr></thead><tbody>${
        r.slice(0,200).map(o=>`<tr>${cols.map(c=>`<td>${o[c]==null?'<span class="faint">NULL</span>':U.esc(typeof o[c]==='number' && !Number.isInteger(o[c]) ? o[c].toFixed(3) : o[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }catch(e){ box.innerHTML = `<div class="note red">SQL ผิดพลาด: ${U.esc(e.message||e)}</div>`; }
  }
  function dlClick(W,S,k){
    if(k==='survey') download(S, 'outbreak_survey.csv', csv(surveyTable(W,S)), 'text/csv;charset=utf-8');
    if(k==='linelist') download(S, 'outbreak_linelist.csv', csv(linelistTable(W,S)), 'text/csv;charset=utf-8');
    if(k==='ipynb') download(S, `outbreak_case${W.seed%10000}.ipynb`, notebook(W,S), 'application/x-ipynb+json');
    if(k==='r') download(S, `outbreak_case${W.seed%10000}.R`, rCode(W,S), 'text/plain;charset=utf-8');
  }

  /* ---------- แท็บหลัก ---------- */
  const SUB = [['lr','📉 Logistic regression'],['tree','🌳 Decision tree'],['code','💻 ข้อมูล · โค้ด · SQL']];
  function html(W,S){
    const sub = S.ui.mlTab || 'lr';
    let body;
    if(sub==='code') body = codeHtml(W,S);
    else if(!ready(S)) body = `<div class="lockbox"><div class="big">🤖</div><b>ยังไม่มีข้อมูลสำหรับฝึกโมเดล</b><div>Machine learning แบบมีผู้สอน (supervised) ต้องมี “ป้ายกำกับ” ทั้งผู้ป่วยและคนไม่ป่วย — สัมภาษณ์ผู้ป่วยแล้ว <b>เก็บกลุ่มควบคุม</b> ก่อน</div><div style="margin-top:8px">ระหว่างนี้ลองแท็บ <b>💻 ข้อมูล · โค้ด · SQL</b> ได้</div></div>`;
    else body = sub==='lr' ? lrHtml(W,S) : treeHtml(W,S);
    return `<div class="ml-sub">${SUB.map(([k,t])=>`<button class="mls ${sub===k?'on':''}" data-mls="${k}">${t}</button>`).join('')}</div>${body}`;
  }
  function wire(W,S,rerender){
    const root = U.$('#vBody'); if(!root) return;
    root.onclick = e=>{
      const t = e.target.closest('[data-mls],[data-mlf],[data-mlsave],[data-dl],[data-sqls],[data-sqlrun]'); if(!t) return;
      if(t.dataset.mls){ S.ui.mlTab = t.dataset.mls; rerender(); return; }
      if(t.dataset.mlf){ const k = t.dataset.mlf, f = feats(W,S); const i = f.indexOf(k);
        if(i>=0) f.splice(i,1); else if(f.length<MAXF) f.push(k); else { U.toast(`ใส่ได้ไม่เกิน ${U.thaiNum(MAXF)} ตัวแปร — ข้อมูลน้อยแต่ตัวแปรมาก โมเดลจะไม่เสถียร`); return; }
        S.ui.mlFeat = f; rerender(); return; }
      if(t.dataset.mlsave){ saveLR(W,S); rerender(); return; }
      if(t.dataset.dl){ dlClick(W,S,t.dataset.dl); return; }
      if(t.dataset.sqls){ const ta = U.$('#sqlIn'); if(ta){ ta.value = SAMPLES[+t.dataset.sqls][1]; runSql(W,S); } return; }
      if(t.dataset.sqlrun){ runSql(W,S); return; }
    };
    const on = (id, fn) => { const el = U.$('#'+id); if(el) el.onchange = fn; };
    on('mlVil', e=>{ S.ui.mlVil = e.target.checked; rerender(); });
    on('mlChild', e=>{ S.ui.mlChild = e.target.checked; rerender(); });
    // แถบเลื่อน: ขณะลากแสดงค่าอย่างเดียว ปล่อยเมาส์แล้วจึงคำนวณใหม่ (วาดใหม่ระหว่างลากจะทำให้แถบเลื่อนหลุดมือ)
    const slide = (id, key) => { const el = U.$('#'+id); if(!el) return;
      el.oninput = e=>{ const b = el.parentElement.querySelector('b'); if(b) b.textContent = U.thaiNum(e.target.value); };
      el.onchange = e=>{ S.ui[key] = +e.target.value; rerender(); }; };
    slide('mlDep', 'depth'); slide('mlLeaf', 'minLeaf');
    const ta = U.$('#sqlIn'); if(ta) ta.onkeydown = e=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); runSql(W,S); } };
  }
  /* หน้าต่างดาวน์โหลดข้อมูล (ใช้ในหน้าผลลัพธ์ท้ายเกม) */
  function downloadModal(W,S){
    U.modal(`<h2 class="display gold-text">💻 วิเคราะห์คดีนี้ต่อด้วยโค้ด</h2>
      <p>ดาวน์โหลดข้อมูลคดีที่ ${U.thaiNum(W.seed%10000)} พร้อม notebook ที่เขียนโค้ดไว้ให้แล้ว เปิดได้ฟรีใน Google Colab, Jupyter หรือ RStudio — เหมาะใช้ต่อในห้องเรียน</p>
      <div class="dl-row"><button class="btn btn-sm" data-m="survey">📄 outbreak_survey.csv</button><button class="btn btn-sm" data-m="linelist">📄 outbreak_linelist.csv</button>
        <button class="btn btn-sm btn-gold" data-m="ipynb">📓 Jupyter Notebook</button><button class="btn btn-sm" data-m="r">📊 R script</button></div>
      <div class="m-actions"><button class="btn btn-gold" data-m="x">ปิด</button></div>`,
      k=>{ if(k==='x') U.closeModal(); else dlClick(W,S,k); });
  }
  return {html, wire, rows, surveyTable, linelistTable, downloadModal, SITE_OF};
})();
