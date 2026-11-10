window.addEventListener('load',async()=>{
  const errors=[],assert=(ok,msg)=>{if(!ok)errors.push(msg)};
  try{
    await new Promise(r=>setTimeout(r,900));
    assert(document.documentElement.lang==='en','document language is not English');
    assert(document.documentElement.dataset.lang==='en','English mode marker missing');
    assert(!!document.querySelector('[data-lang="en"]'),'English switch is missing');
    const start=document.querySelector('[data-t="start"]'),practice=document.querySelector('[data-t="practice"]');
    assert(start&&/Start story/i.test(start.textContent),'start action not translated');
    assert(practice&&/tutorial|practice/i.test(practice.textContent),'tutorial action not translated');
    assert(!/[ก-๙]/.test(start.textContent+practice.textContent),'primary English actions contain Thai');
    OD.i18n.setLanguage('th');assert(OD.i18n.lang()==='th'&&/เริ่มเรื่อง/.test(document.querySelector('[data-t="start"]').textContent),'instant Thai selection failed');OD.i18n.setLanguage('en');assert(/Start story/.test(document.querySelector('[data-t="start"]').textContent),'instant English selection failed');assert(!document.querySelector('.lang-state.busy'),'runtime translation queue is still visible');
    OD.W=OD.sim.build(4,'WELL');OD.S=OD.sim.newState(OD.W,'easy','Alex');OD.S.gender='m';OD.S.pol='ครับ';
    const box=document.createElement('div');box.innerHTML='<button title="เปิดคู่มือ">เปิดคู่มือ</button><span>เป้าหมายถัดไป</span>';document.body.append(box);OD.i18n.scan(box);await new Promise(r=>setTimeout(r,100));
    assert(/Open handbook/.test(box.querySelector('button').textContent),'dynamic UI text not translated');
    assert(/Next objective/.test(box.querySelector('span').textContent),'dynamic objective not translated');
    const modal=document.createElement('div');modal.innerHTML='<h2>เริ่มคดีใหม่?</h2><p>คดีใหม่จะบันทึกแทนแฟ้มเดิม ถ้ายังอยากสืบคดีเดิม ให้เลือกเล่นต่อจากหน้าแรก</p><button>กลับ</button><button>เริ่มคดีใหม่</button>';document.body.append(modal);OD.i18n.scan(modal);await new Promise(r=>setTimeout(r,100));
    assert(!/[ก-๙]/.test(modal.textContent),'new-case modal contains mixed Thai and English: '+modal.textContent);
    assert(/Start a new case\?/.test(modal.textContent),'new-case heading is not translated as a complete phrase');
    OD.S.flags.v={fest:'kathin',patient:'baby',pressure:'hall',media:'radio'};OD.field.run();await new Promise(r=>setTimeout(r,100));
    const kit=document.querySelector('.kit-modal');assert(kit,'English field-kit modal did not open');
    assert(!/[ก-๙]/.test(kit.textContent),'field-kit modal contains mixed Thai and English: '+kit.textContent);
    assert(/Pack your field kit/.test(kit.textContent)&&/Check kit and depart/.test(kit.textContent),'field-kit actions are not fully localized');
    const first=kit.querySelector('.kit-item');first.click();await new Promise(r=>setTimeout(r,50));
    const redrawn=document.querySelector('.kit-modal');assert(!/[ก-๙]/.test(redrawn.textContent),'field-kit redraw returned to Thai: '+redrawn.textContent);
    assert(/1 selected/.test(redrawn.textContent),'English selection count did not update');
    for(const it of OD.sim.KIT.filter(x=>x.ok))if(!document.querySelector('[data-m="k'+it.k+'"]').classList.contains('selected'))document.querySelector('[data-m="k'+it.k+'"]').click();
    document.querySelector('[data-m="go"]').click();await new Promise(r=>setTimeout(r,100));
    const check=document.querySelector('.m-card');assert(check&&!/[ก-๙]/.test(check.textContent),'kit-check result contains Thai: '+check?.textContent);
    document.querySelector('[data-m="ok"]')?.click();
    OD.field.render();OD.i18n.scan(document.querySelector('#scr-field'));await new Promise(r=>setTimeout(r,100));
    for(const id of ['fActions','fAdv','fTop','fMap','fAna']){const el=document.getElementById(id);const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;const missing=[];while(node=walker.nextNode())if(/[ก-ฺเ-๙]/.test(node.nodeValue)&&node.parentElement.tagName!=='SCRIPT')missing.push(node.nodeValue.trim());assert(!missing.length,id+' untranslated: '+missing.join(' | '));}
    const chapter=OD.vn.play([{card:{no:'บทที่ ๓',title:'ลงพื้นที่บ้านสุขใจ',sub:'พุธ ๒๕ พฤศจิกายน ๒๕๖๙ · ๐๘:๐๐ น.'}},{narr:'เช้าวันพุธ หมอกยังลอยเรี่ยผิวน้ำในคลองสุขใจ…'}]);
    await new Promise(r=>setTimeout(r,100));const card=document.querySelector('.vn-card');assert(card&&!/[ก-๙]/.test(card.textContent),'English chapter card contains Thai: '+card?.textContent);card.click();
    await new Promise(r=>setTimeout(r,900));const opening=document.querySelector('.vn-text').textContent;assert(/Wednesday morning/.test(opening)&&!/[ก-๙]/.test(opening),'opening narration was not translated before rendering: '+opening);document.querySelector('.vn-box').click();document.querySelector('.vn-box').click();await chapter;
    const direct=await OD.i18n.text('เปิดคู่มือ');assert(direct==='Open handbook','direct dialogue translation API failed');
    const story=OD.vn.play([{narr:'เปิดคู่มือ'}],{mode:'overlay'});await new Promise(r=>setTimeout(r,350));
    assert(/Open handbook/.test(document.querySelector('.vn-text').textContent),'current VN dialogue did not translate before rendering');
    document.querySelector('.vn-box').click();document.querySelector('.vn-box').click();await story;
  }catch(e){errors.push(e.stack||String(e));}
  const pre=document.createElement('pre');pre.id='i18n-audit-output';pre.textContent=JSON.stringify({errors});document.body.append(pre);
});
