window.addEventListener('load',async()=>{
  const errors=[],wait=(ms=120)=>new Promise(r=>setTimeout(r,ms));
  const assert=(ok,msg)=>{if(!ok)errors.push(msg)};
  const thai=/[ก-ฺเ-๙]/;
  const clean=s=>(s||'').replace(/ทดสอบ/g,'');
  const english=(root,label)=>assert(root&&!thai.test(clean(root.textContent)),label+' contains Thai: '+clean(root?.textContent));
  const click=sel=>{const el=document.querySelector(sel);assert(el,'missing '+sel);el?.click();return el;};
  try{
    await wait(500);
    localStorage.removeItem('od3-practice-v1');
    OD.practice.open();await wait();english(document.querySelector('.practice-modal'),'practice step 1');
    click('[data-m="talk:a"]');click('[data-m="talk:b"]');await wait();english(document.querySelector('.practice-modal'),'practice conversations');
    click('[data-m="q:blame"]');await wait();english(document.querySelector('.practice-modal'),'practice wrong feedback 1');
    click('[data-m="q:more"]');await wait();english(document.querySelector('.practice-modal'),'practice correct feedback 1');
    const dock=document.querySelector('.practice-dock'),next=click('[data-m="next"]');assert(dock&&next&&dock.contains(next),'practice next action is not docked');await wait();
    click('[data-m="q:certain"]');await wait();english(document.querySelector('.practice-modal'),'practice wrong feedback 2');click('[data-m="q:investigate"]');await wait();english(document.querySelector('.practice-modal'),'practice correct feedback 2');click('[data-m="next"]');await wait();
    click('[data-m="q:bottle"]');await wait();english(document.querySelector('.practice-modal'),'practice wrong feedback 3');click('[data-m="q:sample"]');await wait();english(document.querySelector('.practice-modal'),'practice correct feedback 3');click('[data-m="next"]');await wait();
    for(const id of ['stat','env','lab']){click('[data-m="card:'+id+'"]');if(id==='stat'){click('[data-m="pin:shop"]');await wait();english(document.querySelector('.practice-modal'),'practice wrong pin feedback');}click('[data-m="pin:well"]');await wait();}
    english(document.querySelector('.practice-modal'),'practice evidence feedback');click('[data-m="next"]');await wait();click('[data-m="q:closeall"]');await wait();english(document.querySelector('.practice-modal'),'practice wrong feedback 5');click('[data-m="q:conclude"]');await wait();english(document.querySelector('.practice-modal'),'practice correct feedback 5');
    OD.u.closeModal();

    OD.W=OD.sim.build(15,'WELL');OD.S=OD.sim.newState(OD.W,'easy','ทดสอบ');OD.S.gender='m';OD.S.pol='ครับ';OD.S.flags.v={fest:'kathin'};OD.ch1.run();await wait();
    english(document.querySelector('#scr-ch1'),'chapter 1 initial question');
    for(let qi=0;qi<OD.S.chapter1.questions.length;qi++){
      const q=OD.S.chapter1.questions[qi],wrong=q.opts.findIndex(o=>!o.ok),right=q.opts.findIndex(o=>o.ok);
      document.querySelectorAll('.qopt')[wrong]?.click();await wait();english(document.querySelector('#ch1q'),'chapter 1 wrong feedback '+(qi+1));
      document.querySelectorAll('.qopt')[right]?.click();await wait();english(document.querySelector('#ch1q'),'chapter 1 correct transition '+(qi+1));
    }
    english(document.querySelector('#ch1q'),'chapter 1 completion');

    OD.field.run();await wait();
    const global=getComputedStyle(document.querySelector('body>.lang-switch')),field=document.querySelector('.f-language');
    assert(global.display==='none','global language switch still overlays field header');
    assert(field&&field.querySelectorAll('button').length===2,'field language switch is missing');
  }catch(e){errors.push(e.stack||String(e));}
  const pre=document.createElement('pre');pre.id='question-locale-audit-output';pre.textContent=JSON.stringify({errors});document.body.append(pre);
});
