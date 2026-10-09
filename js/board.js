/* =========================================================
   board — กระดานสืบสวน (บทที่ ๔ ก่อนเขียนรายงาน)
   แตะการ์ดหลักฐาน → แตะผู้ต้องสงสัย เพื่อโยงด้ายแดง (หรือลากวางด้วยเมาส์)
   ผู้ต้องสงสัยที่มีหลักฐานครบ ๓ ด้าน (📊 สถิติ · 🔎 สิ่งแวดล้อม · 🧪 แล็บ) คือข้อสรุปที่หนักแน่นที่สุด
   OD.board.run(W,S,evs,links) -> Promise · links: Map(evidenceId → siteId)
   ========================================================= */
OD.board = (function(){
  const U = OD.u, M = OD.sim;
  const nm = id => M.SITES[id].name;
  const CAT = {stat:['📊','สถิติ'], env:['🔎','สิ่งแวดล้อม'], lab:['🧪','แล็บ/คลินิก'], talk:['💬','คำบอกเล่า']};
  const KIND = {env:'🔎', lab:'🧪', supply:'📦', rumor:'💬', interview:'🎙️', clinical:'🩺', or:'📊', pc:'📊'};
  const rot = id => { let h = 0; for(const ch of id) h = (h*31 + ch.charCodeAt(0)) | 0; return ((h>>>0) % 7) - 3; };
  /* ขัดแย้งชัดเจน: การ์ดพูดถึงสถานที่หนึ่ง แต่ไปโยงกับสถานที่อื่น (ยกเว้นแหล่งผลิตที่ส่งวัตถุดิบ — ต้องคิดเอง) */
  const clash = (e, sus) => e.target && sus && e.target!==sus && !M.SUPPLIERS.includes(sus);

  function run(W,S,evs,links){
    return new Promise(resolve=>{
      const root = U.$('#scr-board');
      const suspects = Object.keys(M.SITES).filter(id=>S.known.has(id));
      let sel = null;
      const catsOf = id => new Set(evs.filter(e=>links.get(e.id)===id && !clash(e,id)).map(e=>e.cat));
      function susCard(id){
        const n = evs.filter(e=>links.get(e.id)===id).length, cs = catsOf(id), tri = ['stat','env','lab'].every(c=>cs.has(c));
        return `<div class="sus ${n?'has':''} ${sel?'can':''} ${tri?'tri':''}" data-sus="${id}"><i class="pin"></i>
          <div class="si">${M.SITES[id].icon}</div><b>${nm(id)}</b>
          <div class="scats">${Object.entries(CAT).map(([c,[ic,t]])=>`<span class="${cs.has(c)?'on':''}" title="${t}">${ic}</span>`).join('')}</div>
          <small>${n ? `${U.thaiNum(n)} หลักฐาน` : 'ยังไม่มีหลักฐาน'}</small>${tri?'<span class="tri-b">ครบ ๓ ด้าน ✓</span>':''}</div>`;
      }
      function evCard(e){
        const at = links.get(e.id), w = clash(e, at);
        return `<div class="evc ${sel===e.id?'sel':''} ${at?'linked':''} ${w?'warn':''}" data-ev="${e.id}" draggable="true" style="--r:${rot(e.id)}deg">
          <i class="pin"></i><div class="eh"><span class="k">${KIND[e.kind]||'📄'}</span><span class="ct">${CAT[e.cat][1]}</span></div>
          <div class="tx">${e.text}</div>
          ${at ? `<div class="to">📌 ${nm(at)} <button class="x" data-unlink="${e.id}" title="ถอดออก">✕</button></div>` : ''}
          ${w ? '<div class="w">⚠️ การ์ดนี้พูดถึงสถานที่อื่น</div>' : ''}
          ${sel===e.id ? `<div class="quick"><span>ปักกับ:</span>${suspects.map(id=>`<button data-qlink="${id}" class="${at===id?'on':''}">${M.SITES[id].icon} ${nm(id)}</button>`).join('')}</div>` : ''}</div>`;
      }
      function render(){
        const linked = links.size;
        root.innerHTML = `<div class="ch-wrap board-wrap">
          <div class="ch-banner">${OD.art.prajamInline(44)}<div><div class="no">บทที่ ๔</div><h1 class="display gold-text">กระดานสืบสวน</h1></div></div>
          <div class="frame tight board-help"><div class="mentor">${OD.mentorFace()}<div><div class="who">พี่วิ</div><div>
            ${sel ? '<b>เลือกการ์ดแล้ว</b> — แตะผู้ต้องสงสัยที่การ์ดนี้ <b>สนับสนุน</b> (หรือกดปุ่มชื่อสถานที่บนการ์ด) เพื่อโยงด้ายแดง · แตะการ์ดเดิมอีกครั้งเพื่อยกเลิก'
                  : 'แตะ<b>การ์ดหลักฐาน</b> แล้วแตะ<b>ผู้ต้องสงสัย</b> เพื่อโยงด้ายแดง (หรือลากการ์ดไปวางก็ได้) · ปักเฉพาะหลักฐานที่สนับสนุนจริง ที่อ่อนหรือชี้ผิดทางปล่อยไว้ในกองได้ · ข้อสรุปที่หนักแน่นต้องมีหลักฐาน <b>ครบ ๓ ด้าน</b> 📊 🔎 🧪'}</div></div></div></div>
          <div class="board" id="bd"><svg class="strings" id="bdS" aria-hidden="true"></svg>
            <div class="bd-h">ผู้ต้องสงสัย</div>
            <div class="suspects">${suspects.map(susCard).join('')}</div>
            <div class="bd-h">หลักฐานที่รวบรวมได้ <span>(${U.thaiNum(evs.length)} ใบ · ปักแล้ว ${U.thaiNum(linked)})</span></div>
            ${evs.length ? `<div class="evpool">${evs.map(evCard).join('')}</div>` : '<div class="lockbox" style="background:#f3e3c3;color:#5f4a2f">ยังไม่มีหลักฐานเลย — รายงานที่ไม่มีหลักฐานรองรับจะได้คะแนนน้อย</div>'}
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
      const link = (eid, sid) => { links.set(eid, sid); sel = null; OD.sfx && OD.sfx('pin'); render(); };
      root.onclick = async e=>{
        const un = e.target.closest('[data-unlink]');
        if(un){ e.stopPropagation(); links.delete(un.dataset.unlink); OD.sfx && OD.sfx('page'); render(); return; }
        const q = e.target.closest('[data-qlink]');
        if(q && sel){ link(sel, q.dataset.qlink); return; }
        const ev = e.target.closest('[data-ev]');
        if(ev){ sel = sel===ev.dataset.ev ? null : ev.dataset.ev; render(); return; }
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
      // ลากวางด้วยเมาส์
      root.ondragstart = e=>{ const ev = e.target.closest('[data-ev]'); if(ev){ e.dataTransfer.setData('text/plain', ev.dataset.ev); sel = ev.dataset.ev; } };
      root.ondragover = e=>{ if(e.target.closest('[data-sus]')) e.preventDefault(); };
      root.ondrop = e=>{ const su = e.target.closest('[data-sus]'); const id = e.dataTransfer.getData('text/plain'); if(su && id){ e.preventDefault(); link(id, su.dataset.sus); } };
      root.ondragend = ()=>{ if(sel){ sel = null; render(); } };   // ลากแล้วไม่ได้วางบนผู้ต้องสงสัย
      const onResize = () => strings();
      window.addEventListener('resize', onResize);
      // ตำแหน่งการ์ดเลื่อนได้เมื่อฟอนต์โหลดเสร็จหรือเลย์เอาต์เปลี่ยน — วาดด้ายใหม่ทุกครั้ง
      const ro = window.ResizeObserver ? new ResizeObserver(()=>strings()) : null;
      const watch = () => { const bd = U.$('#bd'); if(ro && bd){ ro.disconnect(); ro.observe(bd); } };
      const cleanup = () => { window.removeEventListener('resize', onResize); if(ro) ro.disconnect(); root.onclick = root.ondragstart = root.ondragover = root.ondrop = root.ondragend = null; };
      U.show('scr-board'); OD.music.setMood('calm'); render();
    });
  }
  return {run};
})();
