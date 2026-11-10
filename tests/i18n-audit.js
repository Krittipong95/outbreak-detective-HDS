window.addEventListener('load',async()=>{
  const errors=[],assert=(ok,msg)=>{if(!ok)errors.push(msg)};
  try{
    await new Promise(r=>setTimeout(r,900));
    assert(document.documentElement.lang==='en','document language is not English');
    assert(document.documentElement.dataset.lang==='en','English mode marker missing');
    assert(!!document.querySelector('[data-lang="en"]'),'English switch is missing');
    const start=document.querySelector('[data-t="start"]'),practice=document.querySelector('[data-t="practice"]');
    assert(start&&/Start story/i.test(start.textContent),'start action not translated');
    assert(practice&&/tutorial/i.test(practice.textContent),'tutorial action not translated');
    assert(!/[ก-๙]/.test(start.textContent+practice.textContent),'primary English actions contain Thai');
    OD.W=OD.sim.build(4,'WELL');OD.S=OD.sim.newState(OD.W,'easy','Alex');OD.S.gender='m';OD.S.pol='ครับ';
    const box=document.createElement('div');box.innerHTML='<button title="เปิดคู่มือ">เปิดคู่มือ</button><span>เป้าหมายถัดไป</span>';document.body.append(box);OD.i18n.scan(box);await new Promise(r=>setTimeout(r,100));
    assert(/Open handbook/.test(box.querySelector('button').textContent),'dynamic UI text not translated');
    assert(/Next objective/.test(box.querySelector('span').textContent),'dynamic objective not translated');
    const direct=await OD.i18n.text('เปิดคู่มือ');assert(direct==='Open handbook','direct dialogue translation API failed');
    const story=OD.vn.play([{narr:'เปิดคู่มือ'}],{mode:'overlay'});await new Promise(r=>setTimeout(r,350));
    assert(/Open handbook/.test(document.querySelector('.vn-text').textContent),'current VN dialogue did not translate before rendering');
    document.querySelector('.vn-box').click();document.querySelector('.vn-box').click();await story;
  }catch(e){errors.push(e.stack||String(e));}
  const pre=document.createElement('pre');pre.id='i18n-audit-output';pre.textContent=JSON.stringify({errors});document.body.append(pre);
});
