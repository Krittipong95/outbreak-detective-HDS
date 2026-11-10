/* =========================================================
   vn  ระบบเล่าเรื่องแบบวิชวลโนเวล
   OD.vn.play(steps, {mode:'full'|'overlay'}) -> Promise
   steps: {bg} {card:{no,title,sub}} {show,expr,pos} {hide} {hideAll}
          {say,expr,text} {me} {narr} {choice:[{text,hint,do,goto}]}
          {label} {goto} {do:fn} {if:fn,then:[],else:[]} {wait:ms}
   ========================================================= */
window.OD = window.OD || {};
OD.config = OD.config || {customPortraits:true};

OD.vn = (function(){
  const U = OD.u;
  let root, E = {}, waiter = null, typing = null, fast = false;
  let previousSoundScene = null;
  let auto = false; try{ auto = localStorage.getItem('od2-auto')==='1'; }catch(e){}   // โหมดอ่านอัตโนมัติ (จำค่าไว้)
  const seg = (typeof Intl!=='undefined' && Intl.Segmenter) ? new Intl.Segmenter('th', {granularity:'grapheme'}) : null;
  const graphemes = s => seg ? Array.from(seg.segment(s), x=>x.segment) : Array.from(s);

  function ensure(){
    root = U.$('#vn');
    if(root.dataset.ready) return;
    root.innerHTML = `<div class="vn-bg"></div><div class="vn-atmosphere" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><div class="vn-fx"></div><div class="vn-chars"></div>
      <div class="vn-tools"><button class="btn btn-sm" data-vn="auto" title="เลื่อนข้อความเองตามความยาว (หยุดที่ตัวเลือก)">▶ อัตโนมัติ</button><button class="btn btn-sm" data-vn="ff" title="เร่งข้อความจนถึงตัวเลือกถัดไป">⏩ เร่ง</button></div>
      <div class="vn-choices hidden" data-no-translate></div>
      <div class="vn-box frame"><div class="vn-face avatar"></div><div class="vn-name" data-no-translate></div><div class="vn-text" data-no-translate></div><div class="vn-next">▼</div></div>`;
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
  async function typeText(text){
    if(typing) clearInterval(typing.timer);
    if(OD.i18n?.lang()==='en'){
      E.text.textContent='Translating dialogue…';E.next.style.visibility='hidden';
      text=await OD.i18n.text(text);
    }
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
      if(typing && typing.done){ clearInterval(chk); setTimeout(()=>{ if(waiter===w && auto){ if(document.hidden || U.$('#modal').classList.contains('open')){armAuto();return;} waiter = null; w(); } }, Math.min(4200, 900 + typing.total*30)); }
    }, 100);
  }
  const waitClick = () => new Promise(res=>{ waiter = res;
    if(fast){const go=()=>{if(waiter!==res)return;if(document.hidden||U.$('#modal').classList.contains('open')){setTimeout(go,140);return;}waiter=null;res();};setTimeout(go,140);}
    else if(auto) armAuto(); });

  /* ---------- ตัวละคร ---------- */
  function portrait(id, expr){
    return OD.art.portrait(id,expr,{gender:(OD.S&&OD.S.gender)||'m'});
  }
  function charEl(id){ return E.chars.querySelector(`[data-id="${id}"]`); }
  function show(id, expr='neutral', pos){
    let el = charEl(id);
    if(!pos){ const used = Array.from(E.chars.children).filter(c=>c.classList.contains('on')).map(c=>c.dataset.pos); pos = el ? el.dataset.pos : (!used.includes('left') ? 'left' : !used.includes('right') ? 'right' : 'center'); }
    if(!el){ el = document.createElement('div'); el.dataset.id = id; E.chars.appendChild(el); }
    clearTimeout(el._rm);   // ถ้าเพิ่งสั่งซ่อน แล้วเรียกกลับมาทันที อย่าลบทิ้ง
    if(el.dataset.expr!==expr){ el.innerHTML = portrait(id, expr); el.dataset.expr = expr; }
    el.dataset.pos = pos; el.className = `vn-char ${pos} expr-${expr}`;
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
      const [name,title]=await Promise.all([OD.i18n?.text(c.name)||c.name,OD.i18n?.text(c.title)||c.title]);
      E.name.innerHTML = `${name}<small>${title}</small>`; focus(s.say); await typeText(s.text);
    } else if(s.me!=null){
      if(charEl('me')){ if(s.expr && charEl('me').dataset.expr!==s.expr) show('me', s.expr); focus('me'); }
      else { meFace(s.expr || 'neutral'); focus('__none__'); }
      const role=await (OD.i18n?.text('คุณ · '+OD.CHARS['me_'+(OD.S.gender||'m')].title)||('คุณ · '+OD.CHARS['me_'+(OD.S.gender||'m')].title));
      E.name.innerHTML = `${U.esc(OD.S.name)}<small>${role}</small>`; await typeText(s.me);
    } else { E.name.innerHTML = ''; focus(null); await typeText(s.narr); }
    await waitClick();
  }

  async function choose(s){
    fast = false; E.ff.classList.remove('btn-gold');
    let prompt=s.prompt||'';let choices=s.choice;
    if(OD.i18n?.lang()==='en'){
      E.choices.innerHTML='<div class="frame tight">Translating choices…</div>';E.choices.classList.remove('hidden');
      const translated=await Promise.all([OD.i18n.text(prompt),...s.choice.flatMap(c=>[OD.i18n.text(c.text),OD.i18n.text(c.hint||'')])]);
      prompt=translated[0];let k=1;choices=s.choice.map(c=>Object.assign({},c,{text:translated[k++],hint:translated[k++]}));
    }
    return new Promise(res=>{
      E.choices.innerHTML = (prompt?`<div class="frame tight" style="max-width:720px;width:100%;text-align:center">${prompt}</div>`:'') +
        choices.map((c,i)=>`<button class="vn-choice" data-i="${i}">${renderRuns(parseRuns(c.text), Infinity)}${c.hint?`<span class="hint">${c.hint}</span>`:''}</button>`).join('');
      E.choices.classList.remove('hidden');
      E.choices.onclick = async e=>{
        const b = e.target.closest('.vn-choice'); if(!b) return;
        OD.sfx && OD.sfx('choose'); const c = s.choice[+b.dataset.i];
        E.choices.classList.add('hidden'); E.choices.onclick = null;
        let r = c.do ? await c.do() : null;
        res(c.goto ? {goto:c.goto} : (typeof r==='string' ? {goto:r} : null));
      };
    });
  }
  async function card(c){
    let no=c.no||'',title=c.title||'',sub=c.sub||'',next='คลิกเพื่อดำเนินเรื่องต่อ';
    if(OD.i18n?.lang()==='en') [no,title,sub,next]=await Promise.all([OD.i18n.text(no),OD.i18n.text(title),OD.i18n.text(sub),OD.i18n.text(next)]);
    return new Promise(res=>{
      const el = document.createElement('div'); el.className = 'vn-card';
      el.innerHTML = `${no?`<div class="no gold-text">${no}</div>`:''}<div class="orn-divider"></div><div class="tt gold-text">${title}</div>${sub?`<div class="st">${sub}</div>`:''}<div class="orn-divider"></div><div class="muted" style="font-size:13px;margin-top:10px">${next}</div>`;
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
      if(s.bg){
        const scene=String(s.bg).split(':')[0];
        root.dataset.atmosphere=/village|well_|farm/.test(scene)?'water':/market|somtam|noodle|chicken|mookata/.test(scene)?'steam':/office|clinic|lab|hall/.test(scene)?'light':'leaves';
        const hr=OD.S?OD.S.T%24:12, time=hr<5?'night':hr<8?'dawn':hr<17?'day':hr<19?'dusk':'night';
        E.bg.classList.remove('scene-enter');void E.bg.offsetWidth;E.bg.innerHTML=OD.art.scene(s.bg);E.bg.dataset.scene=String(s.bg).split(':')[0];E.bg.dataset.time=String(s.bg).includes('night')?'night':time;E.bg.classList.add('scene-enter');
        OD.music && OD.music.sceneMood(s.bg);if(OD.sound)OD.sound.setScene(s.bg,{night:E.bg.dataset.time==='night'});
      }
      if(s.fx!==undefined){ E.fx.className='vn-fx'+(s.fx?' '+s.fx:'');E.bg.classList.toggle('weather-rain',s.fx==='rain');if(OD.sound)OD.sound.setRain(s.fx==='rain'); }
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
    if(root.classList.contains('hidden') && OD.sound) previousSoundScene=OD.sound.scene();
    root.classList.toggle('overlay', opts.mode==='overlay');
    root.classList.remove('hidden');
    E.text.innerHTML='';E.name.innerHTML='';E.choices.classList.add('hidden');E.box.classList.remove('me');E.fx.className='vn-fx';E.bg.classList.remove('weather-rain');
    if(opts.mode!=='overlay' && !steps.some(s=>s.bg) && !opts.stay) E.bg.innerHTML = OD.art.scene('village');
    // ผู้เล่นใหม่: บอกวิธีอ่านต่อครั้งเดียว
    let hinted = false; try{ hinted = localStorage.getItem('od2-vnhint')==='1'; }catch(e){}
    if(!hinted){ try{ localStorage.setItem('od2-vnhint','1'); }catch(e){} U.toast('💡 คลิกที่กล่องข้อความ หรือกด Space / Enter เพื่ออ่านต่อ · ▶ อัตโนมัติ = เลื่อนข้อความเอง · ⏩ เร่ง = ข้ามไปถึงตัวเลือก', '', 8000); }
    try { await run(steps, steps); }
    finally {
      fast = false; E.ff.classList.remove('btn-gold');
      if(!opts.keep){
        root.classList.add('hidden');
        root.classList.remove('overlay');
        E.fx.className='vn-fx'; E.bg.classList.remove('weather-rain'); E.chars.innerHTML='';
        if(OD.sound && previousSoundScene)OD.sound.setScene(previousSoundScene.place,previousSoundScene);
        previousSoundScene=null;
      }
    }
  }
  return {play, show, hide, hideAll};
})();
