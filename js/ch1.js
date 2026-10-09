/* =========================================================
   บทที่ ๑ — ยืนยันการระบาด (ค่ามัธยฐาน ๕ ปี) และนิยามผู้ป่วย
   ========================================================= */
window.OD = window.OD || {};
OD.mentorFace = () => `<div class="face">${OD.art.person('doctor','neutral')}</div>`;

OD.ch1 = (function(){
  const U = OD.u, M = OD.sim;

  function data(W){
    const tNow = 93; // อ. 24 พ.ย. 21:00
    const rep = W.people.filter(p=>p.inf!==null && !p.hidden && p.report<=tNow);
    const cur48 = rep.filter(p=>p.onsetDay>=2 && p.onsetDay<=4).length;
    const cur47 = 3 + Math.floor(Math.random()*3) + rep.filter(p=>p.onsetDay===1).length;
    // ค่าย้อนหลังต้องต่ำกว่าปีนี้อย่างชัดเจนเสมอ (คำตอบที่ถูกของข้อ ๒ คือ "สูงกว่าค่ามัธยฐานชัดเจน")
    const base = Math.max(1, Math.round(cur48*.28)), spread = Math.max(3, Math.round(cur48*.32));
    const gap = Math.max(2, cur48*.35), draw = () => base + Math.floor(Math.random()*spread);
    let hist, best = null;
    for(let k=0;k<80;k++){
      hist = [2564,2565,2566,2567,2568].map(y=>({y, w:[44,45,46,47,48].map(draw)}));
      const v = hist.map(h=>h.w[4]), med = U.median(v), mean = v.reduce((a,b)=>a+b,0)/5;
      const clear = med <= cur48 - gap;
      if(clear && !best) best = hist;
      if(clear && Math.abs(med-mean)>=.6 && Math.max(...v)!==med && v[4]!==med) { best = hist; break; }
    }
    if(!best){ // ข้อมูลปีนี้น้อยมาก — กดค่าย้อนหลังให้ต่ำ
      best = [2564,2565,2566,2567,2568].map(y=>({y, w:[44,45,46,47,48].map(()=>Math.floor(Math.random()*2))}));
    }
    hist = best;
    const v48 = hist.map(h=>h.w[4]);
    return {hist, cur:[draw(), draw(), draw(), cur47, cur48],
            med:U.median(v48), mean:v48.reduce((a,b)=>a+b,0)/5, max:Math.max(...v48), last:v48[4], cur48};
  }

  function chart(d){
    const w=520, h=230, m={l:36,r:34,t:16,b:30}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    const top = Math.max(...d.cur, ...d.hist.flatMap(x=>x.w)) + 4;
    const X = i => m.l + i*iw/4, Y = v => m.t + ih - v/top*ih;
    const meds = [0,1,2,3,4].map(i=>U.median(d.hist.map(x=>x.w[i])));
    let s = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">`;
    for(let v=0; v<=top; v+=5) s += `<line x1="${m.l}" x2="${w-m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d2bd8d"/><text x="${m.l-6}" y="${Y(v)+4}" font-size="11" text-anchor="end" fill="#6b5537">${v}</text>`;
    for(const x of d.hist) s += `<polyline points="${x.w.map((v,i)=>X(i)+','+Y(v)).join(' ')}" fill="none" stroke="#a89470" stroke-width="1.2" opacity=".55"/>`;
    s += `<polyline points="${meds.map((v,i)=>X(i)+','+Y(v)).join(' ')}" fill="none" stroke="#9a7424" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    s += `<polyline points="${d.cur.map((v,i)=>X(i)+','+Y(v)).join(' ')}" fill="none" stroke="#a8301d" stroke-width="3.2"/>`;
    d.cur.forEach((v,i)=>{ s += `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="#a8301d"/>`; });
    [44,45,46,47,48].forEach((wk,i)=>{ s += `<text x="${X(i)}" y="${h-10}" font-size="11.5" text-anchor="middle" fill="#6b5537">สัปดาห์ ${U.thaiNum(wk)}</text>`; });
    s += `<text x="${X(4)-6}" y="${Y(d.cur[4])-10}" font-size="12" font-weight="700" text-anchor="end" fill="#a8301d">๒๕๖๙ (๓ วัน)</text>`;
    return s + `</svg><div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;margin-top:4px;color:#5f4a2f">
      <span><i style="display:inline-block;width:18px;height:3px;background:#a8301d;vertical-align:3px"></i> ปี ๒๕๖๙</span>
      <span><i style="display:inline-block;width:18px;border-top:3px dashed #9a7424;vertical-align:3px"></i> ค่ามัธยฐาน ๕ ปี</span>
      <span><i style="display:inline-block;width:18px;height:2px;background:#a89470;vertical-align:3px"></i> ปี ๒๕๖๔–๒๕๖๘</span></div>`;
  }

  function questions(d){
    const f1 = x => Number.isInteger(x) ? String(x) : x.toFixed(1);
    return [
      {q:`ค่ามัธยฐาน ๕ ปีย้อนหลัง (๒๕๖๔–๒๕๖๘) ของ **สัปดาห์ที่ ๔๘** คือเท่าใด?`,
       opts:[
         {t:`${f1(d.med)} ราย`, ok:true, fb:'ถูกต้อง — เรียงค่าจากน้อยไปมากแล้วเลือกค่ากลาง ค่ามัธยฐานไม่ถูกดึงด้วยปีที่สูงผิดปกติ จึงเหมาะเป็นค่าคาดหมาย'},
         {t:`${f1(d.mean)} ราย`, fb:'นั่นคือค่าเฉลี่ย — ถ้ามีปีใดสูงผิดปกติ ค่าเฉลี่ยจะถูกดึงขึ้น เกณฑ์เฝ้าระวังของไทยจึงใช้ค่ามัธยฐาน'},
         {t:`${d.max} ราย`, fb:'นั่นคือค่าสูงสุด ถ้าใช้ค่าสูงสุดเป็นเกณฑ์ เราจะตรวจจับการระบาดได้ช้าเกินไป'},
         {t:`${d.last} ราย`, fb:'นั่นคือค่าของปี ๒๕๖๘ ปีเดียว ซึ่งอาจบังเอิญสูงหรือต่ำก็ได้'},
       ].filter((o,i,a)=>a.findIndex(x=>x.t===o.t)===i)},
      {q:`สัปดาห์นี้ผ่านไปเพียง ๓ วัน มีผู้ป่วยแล้ว **${d.cur48} ราย** ควรสรุปว่าอย่างไร?`,
       opts:[
         {t:'สูงกว่าค่ามัธยฐานชัดเจนทั้งที่ยังไม่ครบสัปดาห์ → มีแนวโน้มการระบาด ควรสอบสวนโรคทันที', ok:true, fb:'ใช่ — การรอให้ครบสัปดาห์อาจทำให้มีผู้ป่วยเพิ่มโดยไม่จำเป็น'},
         {t:'ต้องรอให้ครบสัปดาห์ก่อน จึงจะเปรียบเทียบได้อย่างยุติธรรม', fb:'แม้ข้อมูลยังไม่ครบ แต่ตัวเลขแค่ ๓ วันก็เกินค่าคาดหมายของทั้งสัปดาห์แล้ว การรอจะทำให้เสียเวลาสำคัญ'},
         {t:'ช่วงนี้ท้องร่วงเพิ่มทุกปีอยู่แล้ว เป็นเรื่องปกติตามฤดูกาล', fb:'เราเทียบกับค่ามัธยฐานของสัปดาห์เดียวกันในอดีตแล้ว ซึ่งรวมผลของฤดูกาลไว้แล้ว ตัวเลขปีนี้จึงผิดปกติจริง'},
         {t:'ยังไม่ถือว่าระบาด จนกว่าจะมีผู้เสียชีวิต', fb:'การระบาดนิยามจากจำนวนผู้ป่วยที่มากกว่าที่คาดหมาย ไม่จำเป็นต้องมีผู้เสียชีวิต'},
       ]},
      {q:'เลือก **นิยามผู้ป่วย (case definition)** ที่เหมาะที่สุดสำหรับการสอบสวนครั้งนี้',
       opts:[
         {t:'ผู้ที่อาศัยหรือเดินทางมาในตำบลบ้านสุขใจ มีอาการถ่ายเหลว ≥๓ ครั้งใน ๒๔ ชม. หรืออาเจียน ร่วมกับปวดท้องหรือไข้ ตั้งแต่ ๒๑ พ.ย. ๒๕๖๙ เป็นต้นมา', ok:true,
          fb:'ครบทั้ง บุคคล–สถานที่–เวลา–อาการ และรวม “อาเจียน” ไว้ด้วย เพราะเชื้อบางชนิดทำให้อาเจียนเด่นกว่าท้องเสีย'},
         {t:'ผู้ที่มีอาการท้องร่วง', fb:'กว้างเกินไป — ไม่ระบุสถานที่และเวลา จะเก็บผู้ป่วยท้องร่วงเรื้อรังหรือคนนอกพื้นที่มาปน ทำให้สัญญาณเจือจาง'},
         {t:'ผู้ที่ตรวจพบเชื้อก่อโรคทางห้องปฏิบัติการเท่านั้น', fb:'แคบเกินไปในระยะแรก — ผู้ป่วยส่วนใหญ่ไม่ได้ถูกเก็บตัวอย่าง จะพลาดผู้ป่วยจริงจำนวนมาก'},
         {t:'ผู้ที่ไปร่วมงานบวชที่วัด และมีอาการท้องร่วง', fb:'นิยามแบบนี้ผูกไว้กับสมมติฐานตั้งแต่ต้น (อคติ) — ถ้าต้นตอไม่ใช่งานบวช เราจะมองไม่เห็นผู้ป่วยกลุ่มอื่นเลย'},
       ]},
    ];
  }

  function run(){
    return new Promise(resolve=>{
      const W = OD.W, S = OD.S, d = data(W), Q = questions(d);
      Q.forEach(q=>{ q.opts = U.shuffle(q.opts); q.tries = 0; q.done = false; });
      S.acc.ch1 = 0; S.acc.ch1Max = Q.length*2;
      const yrs = d.hist.map(x=>`<tr><td>${U.thaiNum(x.y)}</td>${x.w.map((v,i)=>`<td>${v}</td>`).join('')}</tr>`).join('');
      const root = U.$('#scr-ch1');
      root.innerHTML = `<div class="ch-wrap">
        <div class="ch-banner">${OD.art.prajamInline(44)}<div><div class="no">บทที่ ๑</div><h1 class="display gold-text">ระบาดจริง หรือแค่ฤดูกาล?</h1></div></div>
        <div class="ch-grid">
          <div class="paper">
            <h3 style="margin-bottom:2px">รายงานผู้ป่วยโรคอุจจาระร่วงเฉียบพลัน (รง.๕๐๖)</h3>
            <div class="muted" style="font-size:13.5px">ตำบลบ้านสุขใจ · จำนวนผู้ป่วยรายสัปดาห์ ตามวันเริ่มป่วย</div>
            <div class="orn-divider"></div>
            <table class="doc"><thead><tr><th>ปี พ.ศ.</th><th>สัปดาห์ ๔๔</th><th>๔๕</th><th>๔๖</th><th>๔๗</th><th>๔๘</th></tr></thead>
            <tbody>${yrs}<tr><td><b>๒๕๖๙</b></td>${d.cur.map((v,i)=>`<td class="${i===4?'hl':''}">${v}${i===4?'*':''}</td>`).join('')}</tr></tbody></table>
            <div class="faint" style="font-size:12.5px;margin:6px 0 10px">* สัปดาห์ที่ ๔๘ (๒๒–๒๘ พ.ย.) ข้อมูลถึง อ. ๒๔ พ.ย. ๒๑:๐๐ น. เท่านั้น</div>
            ${chart(d)}
          </div>
          <div id="ch1q"></div>
        </div></div>`;
      U.show('scr-ch1');
      const box = U.$('#ch1q');
      const md = t => t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
      function render(){
        const cur = Q.findIndex(q=>!q.done);
        box.innerHTML = Q.map((q,qi)=>{
          if(qi>cur && cur>=0) return '';
          return `<div class="frame tight qcard" data-q="${qi}"><h3>ข้อ ${U.thaiNum(qi+1)}. ${md(q.q)}</h3><div class="qopts">${
            q.opts.map((o,oi)=>`<button class="qopt ${o.state||''}" data-o="${oi}" ${q.done||o.state?'disabled':''}><span class="lt">${'กขคง'[oi]}</span>${o.t}</button>`).join('')}</div>
            ${q.fb?`<div class="mentor" style="margin-top:12px">${OD.mentorFace()}<div><div class="who">พี่วิ</div><div>${q.fb}</div></div></div>`:''}</div>`;
        }).join('') + (cur<0 ? `<div style="text-align:right;margin-top:14px"><button class="btn btn-gold btn-lg" id="ch1next">ไปต่อ: ทำความสะอาดข้อมูล →</button></div>` : '');
        box.onclick = async e=>{
          const nb = e.target.closest('#ch1next');
          if(nb){ box.onclick = null; await OD.vn.play(OD.story.ch1_done(W,S), {mode:'overlay'}); resolve(); return; }
          const b = e.target.closest('.qopt'); if(!b || b.disabled) return;
          const q = Q[+b.closest('[data-q]').dataset.q], o = q.opts[+b.dataset.o];
          q.tries++; o.state = o.ok ? 'right' : 'wrong'; q.fb = (o.ok?'✅ ':'❌ ') + o.fb;
          if(o.ok){ q.done = true; S.acc.ch1 += q.tries===1 ? 2 : q.tries===2 ? 1 : 0; }
          else S.mistakes.push({area:'ch1', title:q.q.replace(/\*\*/g,''), chosen:o.t, correct:q.opts.find(x=>x.ok).t, why:o.fb});
          render();
        };
      }
      render();
    });
  }
  return {run};
})();
