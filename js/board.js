/* =========================================================
   board  กระดานสืบสวน (บทที่ ๔ ก่อนเขียนรายงาน)
   แตะการ์ดหลักฐาน → แตะผู้ต้องสงสัย เพื่อโยงด้ายแดง (หรือลากวางด้วยเมาส์)
   ผู้ต้องสงสัยที่มีหลักฐานครบ ๓ ด้าน (📊 สถิติ · 🔎 สิ่งแวดล้อม · 🧪 แล็บ) คือข้อสรุปที่หนักแน่นที่สุด
   OD.board.run(W,S,evs,links) -> Promise · links: Map(evidenceId → siteId)
   ========================================================= */
OD.board = (function(){
  const U = OD.u, M = OD.sim;
  const nm = id => M.SITES[id].name;
  const CAT = {stat:['📊','สถิติ'], env:['🔎','สิ่งแวดล้อม'], lab:['🧪','แล็บ/คลินิก'], talk:['💬','คำบอกเล่า']};
  const KIND = {env:'🔎', lab:'🧪', supply:'📦', rumor:'💬', interview:'🎙️', clinical:'🩺', or:'📊', pc:'📊', ml:'🤖', nlp:'📱'};
  const rot = id => { let h = 0; for(const ch of id) h = (h*31 + ch.charCodeAt(0)) | 0; return ((h>>>0) % 7) - 3; };
  /* ขัดแย้งชัดเจน: การ์ดพูดถึงสถานที่หนึ่ง แต่ไปโยงกับสถานที่อื่น (ยกเว้นแหล่งผลิตที่ส่งวัตถุดิบ  ต้องคิดเอง) */
  const clash = (e, sus) => e.target && sus && e.target!==sus && !M.SUPPLIERS.includes(sus);

  function run(W,S,evs,links){
    return new Promise(resolve=>{
      const root = U.$('#scr-board');
      const suspects = Object.keys(M.SITES).filter(id=>S.known.has(id));
      let sel = null;
      const catsOf = id => new Set(evs.filter(e=>links.get(e.id)===id && !clash(e,id)).map(e=>e.cat));
      function susCard(id){
        const n = evs.filter(e=>links.get(e.id)===id).length, cs = catsOf(id), tri = ['stat','env','lab'].every(c=>cs.has(c));
        return `<button type="button" class="sus ${n?'has':''} ${sel?'can':''} ${tri?'tri':''}" data-sus="${id}" aria-label="${nm(id)} มีหลักฐาน ${n} รายการ"><i class="pin"></i>
          <div class="si">${M.SITES[id].icon}</div><b>${nm(id)}</b>
          <div class="scats">${['stat','env','lab'].map(c=>`<span class="${cs.has(c)?'on':''}">${cs.has(c)?'✓':'○'} ${CAT[c][1]}</span>`).join('')}</div>
          <small>${n ? `${U.thaiNum(n)} หลักฐาน` : 'ยังไม่มีหลักฐาน'}</small>${tri?'<span class="tri-b">ครบ ๓ ด้าน ✓</span>':''}</button>`;
      }
      function evCard(e){
        const at = links.get(e.id), w = clash(e, at);
        return `<div class="evc ${sel===e.id?'sel':''} ${at?'linked':''} ${w?'warn':''}" data-ev="${e.id}" role="button" tabindex="0" aria-pressed="${sel===e.id}" draggable="true" style="--r:${rot(e.id)}deg">
          <i class="pin"></i><div class="eh"><span class="k">${KIND[e.kind]||'📄'}</span><span class="ct">${CAT[e.cat][1]}</span></div>
          <div class="tx">${e.text}</div><div class="ev-hint">${sel===e.id ? 'เลือกแล้ว ไปเลือกสถานที่ด้านล่าง ↓' : at ? 'แตะเพื่อเปลี่ยนสถานที่' : 'แตะเพื่อเลือกหลักฐานนี้'}</div>
          ${at ? `<div class="to">📌 ${nm(at)} <button class="x" data-unlink="${e.id}" title="ถอดออก">✕</button></div>` : ''}
          ${w ? '<div class="w">⚠️ การ์ดนี้พูดถึงสถานที่อื่น</div>' : ''}
          </div>`;;
      }
      function render(){
        const linked = links.size;
        root.innerHTML = `<div class="ch-wrap board-wrap">
          <div class="ch-banner">${OD.art.prajamInline(44)}<div><div class="no">บทที่ ๔</div><h1 class="display gold-text">กระดานสืบสวน</h1></div></div>
          <div class="frame tight board-help"><div class="board-guide"><div class="mentor">${OD.mentorFace()}<div><div class="who">พี่วิ</div><div>${sel ? 'เลือกหลักฐานแล้ว ต่อไปเลือกสถานที่ที่หลักฐานนี้สนับสนุน' : 'เริ่มจากอ่านหลักฐาน แล้วเลือกสถานที่ที่เกี่ยวข้องทีละใบ'}</div></div></div><div class="board-steps"><span class="${sel?'done':'active'}"><b>๑</b> เลือกหลักฐาน</span><span class="${sel?'active':''}"><b>๒</b> เลือกสถานที่</span><span><b>๓</b> เขียนรายงาน</span></div></div></div>
          <div class="board" id="bd"><svg class="strings" id="bdS" aria-hidden="true"></svg>
            <div id="bdEvidence" class="board-section"><div class="bd-h"><span class="bd-step">๑</span><div><b>เลือกหลักฐาน</b><small>แตะการ์ดที่สนับสนุนสถานที่ต้องสงสัย หลักฐานที่ไม่เกี่ยวข้องไม่ต้องปัก</small></div><span class="bd-count">ปักแล้ว ${U.thaiNum(linked)} / ${U.thaiNum(evs.length)} ใบ</span></div>
            ${evs.length ? `<div class="evpool">${evs.map(evCard).join('')}</div>` : '<div class="lockbox" style="background:#f3e3c3;color:#5f4a2f">ยังไม่มีหลักฐาน กลับไปเก็บข้อมูลก่อนเขียนรายงานได้</div>'}</div>
            <div id="bdSuspects" class="board-section"><div class="bd-h"><span class="bd-step">๒</span><div><b>เลือกสถานที่</b><small>${sel ? 'เลือกสถานที่ที่หลักฐานใบนี้สนับสนุน' : 'เลือกหลักฐานก่อน แล้วจึงเลือกสถานที่ที่เกี่ยวข้อง'}</small></div></div>
            ${sel ? `<div class="board-selection"><b>หลักฐานที่เลือก</b><span>${evs.find(e=>e.id===sel).text}</span><button type="button" data-cancel-selection>ยกเลิก</button></div>` : ''}
            <div class="board-legend">หลักฐานที่ช่วยให้ข้อสรุปหนักแน่น: <b>สถิติ · สิ่งแวดล้อม · แล็บ</b> คำบอกเล่าช่วยเป็นเบาะแสเพิ่มเติม</div>
            <div class="suspects">${suspects.map(susCard).join('')}</div></div>
          </div>
          <div class="board-foot"><span class="muted">${linked ? 'โยงเสร็จแล้วไปเขียนรายงานได้เลย กลับมาแก้กระดานได้จากหน้ารายงาน' : 'ยังไม่ได้ปักหลักฐาน'}</span>
            <button class="btn btn-gold btn-lg" id="bdGo">เขียนรายงาน →</button></div></div>`;
        requestAnimationFrame(()=>{ strings(); watch(); });
      }
      /* ด้ายแดงจากหมุดของการ์ดถึงหมุดของผู้ต้องสงสัย */
      function strings(){
        const bd = U.$('#bd'), svg = U.$('#bdS'); if(!bd || !svg) return;
        const B = bd.getBoundingClientRect(); svg.setAttribute('viewBox', `0 0 ${B.width} ${B.height}`); svg.style.width = B.width+'px'; svg.style.height = B.height+'px';
        let d = '';
        for(const [eid, sid] of links){
          const c = bd.querySelector(`[data-ev="${eid}"] .pin`), s = bd.querySelector(`[data-sus="${sid}"] .pin`); if(!c || !s) continue;
          const a = c.getBoundingClientRect(), b = s.getBoundingClientRect();
          const x1 = a.left+a.width/2-B.left, y1 = a.top+a.height/2-B.top, x2 = b.left+b.width/2-B.left, y2 = b.top+b.height/2-B.top;
          const w = clash(evs.find(e=>e.id===eid), sid);
          d += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${((x1+x2)/2).toFixed(1)} ${(Math.max(y1,y2)+28).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" class="${w?'warn':''}"/>`;
        }
        svg.innerHTML = d;
      }
      const link = (eid, sid) => { links.set(eid, sid); sel = null; OD.sfx && OD.sfx('pin'); render(); U.toast('ปักหลักฐานกับ '+nm(sid)+' แล้ว', 'good'); };
      root.onclick = async e=>{
        if(e.target.closest('[data-cancel-selection]')){ sel = null; render(); return; }
        const un = e.target.closest('[data-unlink]');
        if(un){ e.stopPropagation(); links.delete(un.dataset.unlink); OD.sfx && OD.sfx('page'); render(); return; }
        const q = e.target.closest('[data-qlink]');
        if(q && sel){ link(sel, q.dataset.qlink); return; }
        const ev = e.target.closest('[data-ev]');
        if(ev){ sel = sel===ev.dataset.ev ? null : ev.dataset.ev; render(); if(sel) U.$('#bdSuspects').scrollIntoView({behavior:'smooth',block:'start'}); return; }
        const su = e.target.closest('[data-sus]');
        if(su){ if(sel) link(sel, su.dataset.sus); else U.toast('แตะการ์ดหลักฐานก่อน แล้วค่อยแตะผู้ต้องสงสัย'); return; }
        if(e.target.id==='bdGo'){
          if(!links.size){
            const k = await U.ask('<h2 class="display gold-text">ยังไม่ได้ปักหลักฐานเลย</h2><p>รายงานที่ไม่มีหลักฐานรองรับจะได้คะแนนด้านหลักฐานน้อยมาก ต้องการเขียนรายงานเลยหรือไม่</p>', [['back','กลับไปปักหลักฐาน',''],['go','เขียนรายงานเลย','btn-gold']]);
            if(k!=='go') return;
          }
          cleanup(); resolve(); return;
        }
        if(sel && !e.target.closest('.evc')){ sel = null; render(); }
      };
      root.onkeydown = e=>{ const ev = e.target.closest('[data-ev]'); if(ev && e.target===ev && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); ev.click(); } };
      // ลากวางด้วยเมาส์
      root.ondragstart = e=>{ const ev = e.target.closest('[data-ev]'); if(ev){ e.dataTransfer.setData('text/plain', ev.dataset.ev); sel = ev.dataset.ev; } };
      root.ondragover = e=>{ if(e.target.closest('[data-sus]')) e.preventDefault(); };
      root.ondrop = e=>{ const su = e.target.closest('[data-sus]'); const id = e.dataTransfer.getData('text/plain'); if(su && id){ e.preventDefault(); link(id, su.dataset.sus); } };
      root.ondragend = ()=>{ if(sel){ sel = null; render(); } };   // ลากแล้วไม่ได้วางบนผู้ต้องสงสัย
      const onResize = () => strings();
      window.addEventListener('resize', onResize);
      // ตำแหน่งการ์ดเลื่อนได้เมื่อฟอนต์โหลดเสร็จหรือเลย์เอาต์เปลี่ยน  วาดด้ายใหม่ทุกครั้ง
      const ro = window.ResizeObserver ? new ResizeObserver(()=>strings()) : null;
      const watch = () => { const bd = U.$('#bd'); if(ro && bd){ ro.disconnect(); ro.observe(bd); } };
      const cleanup = () => { window.removeEventListener('resize', onResize); if(ro) ro.disconnect(); root.onkeydown = root.onclick = root.ondragstart = root.ondragover = root.ondrop = root.ondragend = null; };
      U.show('scr-board'); OD.music.setMood('calm'); render();
    });
  }
  return {run};
})();
