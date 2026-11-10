/* Integration checks in a disposable browser profile; never use a player's storage. */
window.addEventListener('load',async()=>{
  const errors=[],checks=[],M=OD.sim,U=OD.u,KEY='od3-case-v1';
  const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
  const test=async(name,fn)=>{try{await fn();checks.push(name);}catch(e){errors.push(name+': '+e.stack)}};
  const click=s=>{const b=document.querySelector(s);assert(b,'Missing '+s);b.click();};
  const tick=()=>new Promise(r=>setTimeout(r,0));
  const setup=(type='WELL')=>{OD.W=M.build(15,type);OD.S=M.newState(OD.W,'easy','ทดสอบ');OD.S.gender='m';OD.S.pol='ครับ';OD.S.flags.v={fest:'kathin',patient:'baby',pressure:'hall',media:'radio'};return OD.S;};
  localStorage.setItem('od2-tour','1');
  await test('round-trip all six worlds and three difficulties',()=>{
    for(const type of M.SCN_TYPES)for(const diff of ['easy','normal','hard']){
      const S=setup(type);S.diff=diff;S.kit=new Set(M.KIT.filter(i=>i.ok).map(i=>i.k));S.flags.kitReady=true;S.flags.seen=['pdpa'];S.flags.walkAcc=375;
      M.reviewRecords(OD.W,S);M.interviewAll(OD.W,S);M.addControls(OD.W,S,1);S.reportDraft={links:new Map([['ev1','W1']]),evs:[],sel:{meas:new Set(['close']),lim:new Set()},screen:'board'};
      S._memo=new Map([['not-saved',1]]);const before=M.analyze(OD.W,S).map(r=>[r.k,r.or,r.nCase]);
      assert(OD.session.save('field'),'save failed');OD.W=null;OD.S=null;assert(OD.session.restore()==='field','stage');
      assert(OD.S.kit instanceof Set&&OD.S.clean.lost instanceof Set,'sets lost');assert(OD.S.reportDraft.links.get('ev1')==='W1','map lost');assert(!OD.S._memo,'cache persisted');
      assert(OD.W.byId(OD.W.people[0].id)===OD.W.people[0],'byId identity');assert(OD.S.flags.walkAcc===375,'walking time lost');
      assert(JSON.stringify(M.analyze(OD.W,OD.S).map(r=>[r.k,r.or,r.nCase]))===JSON.stringify(before),'analysis changed');
    }
  });
  await test('corrupt and unsupported saves do not crash',()=>{
    const good=localStorage.getItem(KEY);for(const raw of ['{broken','{}',JSON.stringify({version:99})]){localStorage.setItem(KEY,raw);assert(OD.session.read()===null,'invalid accepted');assert(OD.session.status().invalid,'no invalid status');}localStorage.setItem(KEY,good);
  });
  await test('storage failure preserves previous checkpoint',()=>{
    const old=localStorage.getItem(KEY),set=Storage.prototype.setItem;try{Storage.prototype.setItem=function(){throw Error('QuotaExceededError')};assert(!OD.session.save(),'failure not reported');}finally{Storage.prototype.setItem=set;}assert(localStorage.getItem(KEY)===old,'old save damaged');
  });
  await test('global and local handbook preserve kit selection and focus',async()=>{
    setup();OD.session.save('field');OD.field.run();click('[data-m="kcold"]');const original=document.querySelector('.kit-modal'),selected=document.querySelector('[data-m="kcold"]');
    document.querySelector('#hbCtl button').click();assert(document.querySelector('.hb-modal'),'no handbook');click('[data-m="next"]');click('[data-m="x"]');
    assert(document.querySelector('.kit-modal')===original,'kit nodes replaced');assert(selected.getAttribute('aria-pressed')==='true','selection lost');assert(document.activeElement===selected,'focus not restored');
    click('[data-m="hb"]');document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(document.querySelector('.kit-modal')===original,'escape lost kit');
    assert(OD.session.read().state.flags.kitDraft.includes('cold'),'draft not saved');
    for(const it of M.KIT.filter(x=>x.ok&&x.k!=='cold'))click('[data-m="k'+it.k+'"]');click('[data-m="go"]');click('[data-m="ok"]');await tick();
    assert(OD.S.flags.kitReady,'kit incomplete');assert(OD.session.read().state.flags.kitReady,'completed kit not saved');
  });
  await test('pending choice survives help and resolves exactly once',async()=>{
    let calls=0;const p=U.ask('<h2>คำถามทดสอบ</h2>',[['ok','ตกลง','']]).then(()=>calls++);
    OD.handbook.open();click('[data-m="x"]');click('[data-m="ok"]');await p;assert(calls===1,'choice unresolved or duplicated');
  });
  await test('fast dialogue pauses while handbook is open',async()=>{
    let finished=false;const p=OD.vn.play([{narr:'ข้อความแรก'},{narr:'ข้อความที่สอง'},{do:()=>{finished=true;}}]);
    click('[data-vn="ff"]');await tick();OD.handbook.open();
    await new Promise(r=>setTimeout(r,450));assert(!finished,'dialogue advanced behind handbook');click('[data-m="x"]');await p;assert(finished,'dialogue did not resume');
  });
  await test('chapter one resumes the same questions and score',()=>{
    setup();OD.ch1.run();click('#ch1q .qopt');const before=JSON.stringify(OD.S.chapter1),score=OD.S.acc.ch1;
    OD.session.restore();OD.ch1.run();assert(JSON.stringify(OD.S.chapter1)===before,'question order or progress changed');assert(OD.S.acc.ch1===score,'score changed');
  });
  await test('chapter two preserves wrong-answer effects without duplication',()=>{
    setup();OD.ch2.run();const issue=OD.S.chapter2.issues[0],index=issue.opts.findIndex(o=>o.eff);
    if(index>=0){click('#scr-ch2 [data-o="'+index+'"]');const eff=issue.opts[index].eff;assert(OD.S.clean[eff.key].has(eff.id),'cleaning effect failed');}
    else click('#scr-ch2 [data-o="0"]');
    const before=JSON.stringify(OD.S.chapter2),mistakes=OD.S.mistakes.length,score=OD.S.acc.ch2;
    OD.session.restore();OD.ch2.run();assert(JSON.stringify(OD.S.chapter2)===before,'chapter changed');assert(OD.S.mistakes.length===mistakes&&OD.S.acc.ch2===score,'duplicate answer');
  });
  await test('report board and form resume with selected evidence',async()=>{
    setup();OD.S.kit=new Set();OD.S.flags.kitReady=true;OD.S.flags.reported=true;
    OD.S.reportDraft={evs:[{id:'e1',kind:'env',cat:'env',text:'หลักฐานทดสอบ',rel:'weak',target:'W1'}],links:new Map(),sel:null,screen:'board'};
    const oldVN=OD.vn.play;OD.vn.play=async()=>{};
    OD.report.run();click('[data-ev="e1"]');click('[data-sus="W1"]');assert(OD.session.read().state.reportDraft.links.get('e1')==='W1','pin not saved');
    click('#bdGo');await tick();const radio=document.querySelector('input[name="route"]');radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));
    assert(OD.session.read().state.reportDraft.sel.route===radio.value,'form not saved');OD.session.restore();OD.report.run();await tick();
    assert(document.querySelector('#scr-report:not(.hidden)'),'resumed wrong report screen');assert(document.querySelector('input[name="route"]:checked').value===radio.value,'radio lost');OD.vn.play=oldVN;
  });
  await test('practice completes with retries and leaves case untouched',()=>{
    const before=localStorage.getItem(KEY),world=OD.W,state=OD.S;localStorage.removeItem('od3-practice-v1');OD.practice.open();
    const practiceCard=document.querySelector('.practice-modal');
    click('[data-m="talk:a"]');assert(document.querySelector('.practice-modal')===practiceCard,'practice modal recreated and flashed');
    click('[data-m="talk:b"]');assert(document.querySelector('.practice-modal')===practiceCard,'practice modal recreated after second choice');
    click('[data-m="q:blame"]');assert(document.querySelector('.practice-modal')===practiceCard,'practice modal recreated after feedback');assert(!document.querySelector('[data-m="next"]'),'wrong answer advanced');
    click('[data-m="q:more"]');click('[data-m="next"]');click('[data-term="or"]');assert(document.querySelector('.term-modal'),'no definition');click('[data-m="close"]');assert(document.querySelector('.practice-modal'),'practice lost');
    click('[data-m="q:investigate"]');click('[data-m="next"]');click('[data-m="q:sample"]');click('[data-m="next"]');
    for(const id of ['stat','env','lab']){click('[data-m="card:'+id+'"]');if(id==='stat')click('[data-m="pin:shop"]');click('[data-m="pin:well"]');}
    click('[data-m="next"]');click('[data-m="q:conclude"]');click('[data-m="next"]');assert(document.querySelector('.practice-finish'),'practice not finished');click('[data-m="exit"]');
    OD.practice.open();assert(document.querySelector('.practice-finish'),'training not saved');click('[data-m="exit"]');
    assert(before===localStorage.getItem(KEY)&&world===OD.W&&state===OD.S,'practice modified real case');
  });
  await test('title offers resume and protects unfinished case',async()=>{
    OD.main.title();assert(document.querySelector('[data-t="resume"]'),'no resume');click('[data-t="quick"]');assert(document.querySelector('#modal.open'),'new case replaced without choice');click('[data-m="back"]');await tick();assert(OD.session.status().stage==='report','save replaced');
  });
  const pre=document.createElement('pre');pre.id='onboarding-audit-output';pre.textContent=JSON.stringify({checks,errors});document.body.append(pre);
});
