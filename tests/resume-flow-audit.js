/* Drive the actual quick-game UI through two page reloads and the result screen. */
window.addEventListener('load',()=>{
  const errors=[],KEY='od-flow-test';let state=JSON.parse(sessionStorage.getItem(KEY)||'null')||{phase:'start',ticks:0,reloads:0};
  let awaiting=false;
  const done=()=>{clearInterval(timer);const p=document.createElement('pre');p.id='resume-flow-output';p.textContent=JSON.stringify({phase:state.phase,reloads:state.reloads,errors,diagnostic:errors.length?{screen:document.querySelector('.screen:not(.hidden)')?.id,modal:document.querySelector('#modal')?.innerText.slice(-500),vn:document.querySelector('#vn:not(.hidden)')?.innerText.slice(-500),reportButton:document.querySelector('[data-a="report"]')?.outerHTML,busy:OD.field.isBusy(),reported:OD.S?.flags.reported,draft:OD.S?.reportDraft?.screen}:undefined});document.body.append(p);};
  const click=s=>{const b=document.querySelector(s);if(b&&!b.disabled){b.click();return true;}return false;};
  const change=s=>{const b=document.querySelector(s);if(b){b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));return true;}return false;};
  const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
  const reload=phase=>{state.phase=phase;state.reloads++;state.ticks=0;sessionStorage.setItem(KEY,JSON.stringify(state));awaiting=true;location.reload();};
  localStorage.setItem('od2-tour','1');
  const timer=setInterval(()=>{if(awaiting)return;try{
    if(++state.ticks>1800)throw Error('Flow timed out at '+state.phase);
    const vn=document.querySelector('#vn:not(.hidden)');
    if(vn){if(!click('#vn .vn-choices:not(.hidden) .vn-choice')){const ff=vn.querySelector('[data-vn="ff"]');if(ff&&!ff.classList.contains('btn-gold'))ff.click();vn.querySelector('.vn-box')?.click();vn.querySelector('.vn-card')?.click();}return;}
    if(state.phase==='start'){click('[data-t="quick"]');state.phase='kit';return;}
    if(state.phase==='kit'){
      if(document.querySelector('.kit-modal')){const item=OD.sim.KIT.find(i=>i.ok&&!document.querySelector('[data-m="k'+i.k+'"]')?.classList.contains('selected'));if(item)click('[data-m="k'+item.k+'"]');else click('[data-m="go"]');return;}
      if(click('#modal [data-m="ok"]'))return;
      if(OD.S?.flags.kitReady){state.phase='review';click('[data-a="review"]');}return;
    }
    if(state.phase==='review'){
      if(click('#modal [data-m="ok"]'))return;
      if(OD.S.reviewed&&!OD.field.isBusy()){
        OD.session.save('field');state.time=OD.S.T;state.budget=OD.S.budget;state.seen=OD.S.flags.seen||[];reload('resume-field');}return;
    }
    if(state.phase==='resume-field'){assert(document.querySelector('[data-t="resume"]'),'no resume after reload');click('[data-t="resume"]');state.phase='restored-field';return;}
    if(state.phase==='restored-field'){
      assert(OD.S.T===state.time&&OD.S.budget===state.budget,'time or budget changed after resume');assert(OD.S.reviewed&&OD.S.flags.kitReady,'field progress lost');assert(!document.querySelector('.kit-modal'),'kit repeated');assert(JSON.stringify(OD.S.flags.seen||[])===JSON.stringify(state.seen),'events lost');
      state.phase='interview';click('[data-a="interview"]');return;
    }
    if(state.phase==='interview'){
      if(click('#modal [data-m="ok"]'))return;
      if(Object.keys(OD.S.ans).length&&!OD.field.isBusy()){state.phase='report';click('[data-a="report"]');}return;
    }
    if(state.phase==='report'){
      if(click('#modal [data-m="yes"]')||click('#modal [data-m="go"]'))return;
      if(document.querySelector('#scr-board:not(.hidden)')){const ev=document.querySelector('[data-ev]'),sus=document.querySelector('[data-sus]');if(ev&&sus&&!OD.S.reportDraft.links.size){ev.click();document.querySelector('[data-sus]')?.click();return;}click('#bdGo');return;}
      if(document.querySelector('#scr-report:not(.hidden)')){
        const t=OD.report.truth(OD.W),answers={site:t.site,route:t.route,p2p:t.p2p,path:t.pathogen,pattern:t.pattern};
        for(const [key,val] of Object.entries(answers))if(!document.querySelector('input[name="'+key+'"]:checked')){if(!change('input[name="'+key+'"][value="'+val+'"]'))change('input[name="'+key+'"]');return;}
        for(const key of ['active','comm','surv'])if(!document.querySelector('input[data-g="meas"][value="'+key+'"]:checked')){change('input[data-g="meas"][value="'+key+'"]');return;}
        click('#repSend');state.phase='result';return;
      }
      return;
    }
    if(state.phase==='result'){
      if(!document.querySelector('#scr-result:not(.hidden)'))return;
      assert(OD.session.status().stage==='result','result not saved');state.total=OD.S.savedResult.R.total;state.cases=OD.meta.summary().cases;reload('resume-result');return;
    }
    if(state.phase==='resume-result'){click('[data-t="resume"]');state.phase='verify-result';return;}
    if(state.phase==='verify-result'){
      assert(document.querySelector('#scr-result:not(.hidden)'),'result not restored');assert(OD.S.savedResult.R.total===state.total,'score changed');assert(OD.meta.summary().cases===state.cases,'case recorded twice');state.phase='complete';done();
    }
  }catch(e){errors.push(e.stack);done();}},40);
  window.addEventListener('error',e=>{errors.push(e.message);done();});
  window.addEventListener('unhandledrejection',e=>{errors.push(String(e.reason));done();});
});
