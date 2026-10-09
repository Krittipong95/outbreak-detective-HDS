/* =========================================================
   vn — ระบบเล่าเรื่องแบบวิชวลโนเวล
   OD.vn.play(steps, {mode:'full'|'overlay'}) -> Promise
   steps: {bg} {card:{no,title,sub}} {show,expr,pos} {hide} {hideAll}
          {say,expr,text} {me} {narr} {choice:[{text,hint,do,goto}]}
          {label} {goto} {do:fn} {if:fn,then:[],else:[]} {wait:ms}
   ========================================================= */
window.OD = window.OD || {};
OD.config = OD.config || {customPortraits:false};

OD.vn = (function(){
  const U = OD.u;
  let root, E = {}, waiter = null, typing = null, fast = false;
  let auto = false; try{ auto = localStorage.getItem('od2-auto')==='1'; }catch(e){}   // โหมดอ่านอัตโนมัติ (จำค่าไว้)
  const seg = (typeof Intl!=='undefined' && Intl.Segmenter) ? new Intl.Segmenter('th', {granularity:'grapheme'}) : null;
  const graphemes = s => seg ? Array.from(seg.segment(s), x=>x.segment) : Array.from(s);

  function ensure(){
    root = U.$('#vn');
    if(root.dataset.ready) return;
    root.innerHTML = `<div class="vn-bg"></div><div class="vn-fx"></div><div class="vn-chars"></div>
      <div class="vn-tools"><button class="btn btn-sm" data-vn="auto" title="เลื่อนข้อความเองตามความยาว (หยุดที่ตัวเลือก)">▶ อัตโนมัติ</button><button class="btn btn-sm" data-vn="ff" title="เร่งข้อความจนถึงตัวเลือกถัดไป">⏩ เร่ง</button></div>
      <div class="vn-choices hidden"></div>
      <div class="vn-box frame"><div class="vn-face avatar"></div><div class="vn-name"></div><div class="vn-text"></div><div class="vn-next">▼</div></div>`;
    root.dataset.ready = '1';
    E = {bg:U.$('.vn-bg',root), fx:U.$('.vn-fx',root), chars:U.$('.vn-chars',root), choices:U.$('.vn-choices',root), box:U.$('.vn-box',root),
         face:U.$('.vn-face',root), name:U.$('.vn-name',root), text:U.$('.vn-text',root), next:U.$('.vn-next',root), ff:U.$('[data-vn=ff]',root), auto:U.$('[data-vn=auto]',root)};
    E.box.addEventListener('click', advance);
    E.auto.classList.toggle('btn-gold', auto);
    E.auto.addEventListener('click', e=>{ e.stopPropagation(); auto = !auto; E.auto.classList.toggle('btn-gold', auto); try{ localStorage.setItem('od2-auto', auto?'1':'0'); }catch(er){} if(auto) armAuto(); });
    E.ff.addEventListener('click', e=>{ e.stopPropagation(); fast = !fast; E.ff.classList.toggle('btn-gold', fast); if(fast) advance(); });
    document.addEventListener('keydown', e=>{
      if(root.classList.contains('hidden') || !E.choices.classList.contains('hidden') || U.$('#modal').classList.contains('open')) return;
      if(e.key===' ' || e.key==='Enter'){ e.preventDefault(); advance(); }
    });
  }
  function advance(){
    if(typing && !typing.done){ finishTyping(); if(!fast) return; }
    if(waiter){ const w = waiter; waiter = null; w(); }
  }

  /* ---------- ข้อความ ---------- */
  function parseRuns(text){
    const name = U.esc((OD.S && OD.S.name) || 'คุณ');
    const runs = []; let bold = false, pol = (OD.S && OD.S.pol) || 'ครับ';
    for(const part of String(text).replace(/\{name\}/g, name).replace(/\{p\}/g, pol).split('**')){ if(part) runs.push({b:bold, g:graphemes(part)}); bold = !bold; }
    return runs;
  }
  function renderRuns(runs, n){
    let out = '', k = n;
    for(const r of runs){ if(k<=0) break; const piece = r.g.slice(0,k).join(''); k -= r.g.length; out += r.b ? `<b>${piece}</b>` : piece; }
    return out;
  }
  function finishTyping(){ if(!typing) return; clearInterval(typing.timer); typing.done = true; E.text.innerHTML = renderRuns(typing.runs, Infinity); E.next.style.visibility='visible'; }
  function typeText(text){
    if(typing) clearInterval(typing.timer);
    const runs = parseRuns(text), total = runs.reduce((a,r)=>a+r.g.length,0);
    typing = {runs, total, n:0, done:false};
    E.next.style.visibility='hidden';
    if(fast){ finishTyping(); return; }
    typing.timer = setInterval(()=>{ typing.n += 2; if(typing.n>=total) finishTyping(); else E.text.innerHTML = renderRuns(runs, typing.n); }, 22);
  }
  /* โหมดอัตโนมัติ: พิมพ์จบแล้วรอเวลาอ่านตามความยาวข้อความ แล้วไปบรรทัดถัดไปเอง */
  function armAuto(){
    const w = waiter; if(!w) return;
    const chk = setInterval(()=>{
      if(waiter!==w || !auto){ clearInterval(chk); return; }
      if(typing && typing.done){ clearInterval(chk); setTimeout(()=>{ if(waiter===w && auto){ waiter = null; w(); } }, Math.min(4200, 900 + typing.total*30)); }
    }, 100);
  }
  const waitClick = () => new Promise(res=>{ waiter = res;
    if(fast) setTimeout(()=>{ if(waiter===res){ waiter=null; res(); } }, 140);
    else if(auto) armAuto(); });

  /* ---------- ตัวละคร ---------- */
  function portrait(id, expr){
    if(OD.config.customPortraits){ const f = id==='me' ? 'me_'+((OD.S && OD.S.gender) || 'm') : id;
      return `<img src="img/${f}-${expr}.png" alt="" onerror="this.onerror=null;this.src='img/${f}.png'">`; }
    return OD.art.person(id, expr);
  }
  function charEl(id){ return E.chars.querySelector(`[data-id="${id}"]`); }
  function show(id, expr='neutral', pos){
    let el = charEl(id);
    if(!pos){ const used = Array.from(E.chars.children).filter(c=>c.classList.contains('on')).map(c=>c.dataset.pos); pos = el ? el.dataset.pos : (!used.includes('left') ? 'left' : !used.includes('right') ? 'right' : 'center'); }
    if(!el){ el = document.createElement('div'); el.dataset.id = id; E.chars.appendChild(el); }
    clearTimeout(el._rm);   // ถ้าเพิ่งสั่งซ่อน แล้วเรียกกลับมาทันที อย่าลบทิ้ง
    if(el.dataset.expr!==expr){ el.innerHTML = portrait(id, expr); el.dataset.expr = expr; }
    el.dataset.pos = pos; el.className = `vn-char ${pos}`;
    requestAnimationFrame(()=>el.classList.add('on'));
  }
  function hide(id){ const el = charEl(id); if(el){ el.classList.remove('on'); clearTimeout(el._rm); el._rm = setTimeout(()=>{ if(!el.classList.contains('on')) el.remove(); }, 360); } }
  function hideAll(){ Array.from(E.chars.children).forEach(c=>hide(c.dataset.id)); }
  function focus(id){ Array.from(E.chars.children).forEach(c=>c.classList.toggle('dim', !!id ? c.dataset.id!==id : false)); }

  /* ภาพหน้าตัวละครของผู้เล่นข้างกล่องข้อความ (ไม่ต้องยืนแย่งที่กับตัวละครอื่น) */
  let faceKey = '';
  function meFace(expr){
    const key = [OD.S && OD.S.gender, OD.S && OD.S.name, expr].join('|');
    if(key!==faceKey){ E.face.innerHTML = portrait('me', expr); faceKey = key; }
  }
  async function line(s){
    E.text.classList.toggle('narr', s.narr!=null);
    E.box.classList.toggle('me', s.me!=null && !charEl('me'));
    if(s.say!=null){
      const c = OD.CHARS[s.say];
      if(!charEl(s.say) || !charEl(s.say).classList.contains('on') || (s.expr && charEl(s.say).dataset.expr!==s.expr)) show(s.say, s.expr || (charEl(s.say)||{}).dataset?.expr || 'neutral', s.pos);
      E.name.innerHTML = `${c.name}<small>${c.title}</small>`; focus(s.say); typeText(s.text);
    } else if(s.me!=null){
      if(charEl('me')){ if(s.expr && charEl('me').dataset.expr!==s.expr) show('me', s.expr); focus('me'); }
      else { meFace(s.expr || 'neutral'); focus('__none__'); }
      E.name.innerHTML = `${U.esc(OD.S.name)}<small>คุณ · ${OD.CHARS['me_'+(OD.S.gender||'m')].title}</small>`; typeText(s.me);
    } else { E.name.innerHTML = ''; focus(null); typeText(s.narr); }
    await waitClick();
  }

  function choose(s){
    fast = false; E.ff.classList.remove('btn-gold');
    return new Promise(res=>{
      E.choices.innerHTML = (s.prompt?`<div class="frame tight" style="max-width:720px;width:100%;text-align:center">${s.prompt}</div>`:'') +
        s.choice.map((c,i)=>`<button class="vn-choice" data-i="${i}">${renderRuns(parseRuns(c.text), Infinity)}${c.hint?`<span class="hint">${c.hint}</span>`:''}</button>`).join('');
      E.choices.classList.remove('hidden');
      E.choices.onclick = async e=>{
        const b = e.target.closest('.vn-choice'); if(!b) return;
        const c = s.choice[+b.dataset.i];
        E.choices.classList.add('hidden'); E.choices.onclick = null;
        let r = c.do ? await c.do() : null;
        res(c.goto ? {goto:c.goto} : (typeof r==='string' ? {goto:r} : null));
      };
    });
  }
  function card(c){
    return new Promise(res=>{
      const el = document.createElement('div'); el.className = 'vn-card';
      el.innerHTML = `${c.no?`<div class="no gold-text">${c.no}</div>`:''}<div class="orn-divider"></div><div class="tt gold-text">${c.title}</div>${c.sub?`<div class="st">${c.sub}</div>`:''}<div class="orn-divider"></div><div class="muted" style="font-size:13px;margin-top:10px">คลิกเพื่อดำเนินเรื่องต่อ</div>`;
      root.appendChild(el);
      const done = ()=>{ el.remove(); res(); };
      el.addEventListener('click', done);
      if(fast) setTimeout(done, 400); else if(auto) setTimeout(()=>{ if(el.isConnected) done(); }, 2200);
    });
  }

  async function run(steps, top){
    const jump = lbl => top.findIndex(x=>x.label===lbl);
    for(let i=0;i<steps.length;i++){
      const s = steps[i]; let r = null;
      if(s.label) continue;
      if(s.goto) r = {goto:s.goto};
      if(s.bg){ E.bg.innerHTML = OD.art.scene(s.bg); OD.music && OD.music.sceneMood(s.bg); }
      if(s.fx!==undefined) E.fx.className = 'vn-fx' + (s.fx ? ' '+s.fx : '');
      if(s.card) await card(s.card);
      if(s.hideAll) hideAll();
      if(s.hide) hide(s.hide);
      if(s.show) show(s.show, s.expr||'neutral', s.pos);
      if(s.wait) await U.sleep(fast?0:s.wait);
      if(s.say!=null || s.me!=null || s.narr!=null) await line(s);
      if(s.choice) r = await choose(s);
      if(s.do){ const x = await s.do(); if(typeof x==='string') r = {goto:x}; }
      if(s.if){ const sub = s.if() ? (s.then||[]) : (s.else||[]); r = await run(sub, top) || r; }
      if(s.end) return {end:true};
      if(r && r.goto){ if(steps===top){ const j = jump(r.goto); if(j<0) throw new Error('no label '+r.goto); i = j; continue; } return r; }
      if(r && r.end) return r;
    }
    return null;
  }

  async function play(steps, opts={}){
    ensure();
    root.classList.toggle('overlay', opts.mode==='overlay');
    root.classList.remove('hidden');
    E.text.innerHTML = ''; E.name.innerHTML = ''; E.choices.classList.add('hidden'); E.box.classList.remove('me'); E.fx.className = 'vn-fx';
    if(opts.mode!=='overlay' && !steps.some(s=>s.bg) && !opts.stay) E.bg.innerHTML = OD.art.scene('village');
    try { await run(steps, steps); }
    finally {
      fast = false; E.ff.classList.remove('btn-gold');
      if(!opts.keep){ root.classList.add('hidden'); E.chars.innerHTML = ''; }
    }
  }
  return {play, show, hide, hideAll};
})();
