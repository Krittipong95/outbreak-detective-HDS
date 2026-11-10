window.addEventListener('load',async()=>{
  const errors=[],assert=(ok,msg)=>{if(!ok)errors.push(msg)};
  try{
    const M=OD.sim,W=M.build(31415,'WELL'),S=M.newState(W,'easy','ทดสอบข้อมูล');
    OD.W=W;OD.S=S;S.gender='m';S.pol='ครับ';S.flags.v={pressure:'hall',patient:'thongbai',fest:'kathin',media:'radio'};
    M.reviewRecords(W,S);M.interviewAll(W,S);M.addControls(W,S,1);M.interviewAll(W,S);S.ui=S.ui||{};S.ui.mlTab='code';
    const host=document.createElement('div');host.id='vBody';document.body.append(host);
    host.innerHTML=OD.mlViews.html(W,S);OD.mlViews.wire(W,S,()=>{});
    const line=OD.mlViews.linelistTable(W,S),survey=OD.mlViews.surveyTable(W,S);
    assert(line.length>0,'linelist empty');assert(survey.length>0,'survey empty');
    host.querySelector('[data-sqlrun]').click();
    const end=Date.now()+23000;while(Date.now()<end&&!host.querySelector('#sqlOut table'))await new Promise(r=>setTimeout(r,250));
    assert(!!host.querySelector('#sqlOut table'),'SQL did not render a result table: '+host.querySelector('#sqlOut')?.textContent.trim());
    assert(!/ไม่มีข้อมูลคดี/.test(host.querySelector('#sqlOut')?.textContent||''),'data incorrectly reported empty');
    const early=M.newState(W,'easy','ยังไม่สำรวจ');early.ui=early.ui||{};early.ui.mlTab='code';host.innerHTML=OD.mlViews.html(W,early);OD.mlViews.wire(W,early,()=>{});host.querySelector('[data-sqlrun]').click();
    const endEarly=Date.now()+3000;while(Date.now()<endEarly&&!host.querySelector('#sqlOut table'))await new Promise(r=>setTimeout(r,100));
    assert(OD.mlViews.linelistTable(W,early).length>0,'early linelist should contain reported cases');
    assert(OD.mlViews.surveyTable(W,early).length===0,'early survey should be empty');
    assert(!!host.querySelector('#sqlOut table'),'linelist query should work before survey collection');
  }catch(e){errors.push(e.stack||e.message||String(e));}
  const pre=document.createElement('pre');pre.id='sql-data-audit-output';pre.textContent=JSON.stringify({errors});document.body.append(pre);
});
