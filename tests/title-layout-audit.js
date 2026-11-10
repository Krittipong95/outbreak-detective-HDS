window.addEventListener('load',()=>setTimeout(()=>{
  const errors=[],assert=(ok,msg)=>{if(!ok)errors.push(msg)};
  const root=document.querySelector('#scr-title'),card=root.querySelector('.title-card');
  const visible=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
  const actions=[...root.querySelectorAll('button')].filter(visible);
  assert(document.documentElement.scrollWidth<=innerWidth,'horizontal overflow');
  if(innerWidth>=1000){
    assert(document.documentElement.scrollHeight<=innerHeight+1,'desktop title requires scrolling: '+document.documentElement.scrollHeight+' > '+innerHeight);
    for(const b of actions)assert(b.getBoundingClientRect().bottom<=innerHeight+1,'button below viewport: '+(b.dataset.t||b.dataset.diff||b.dataset.g));
  }
  assert(card.getBoundingClientRect().width<=innerWidth,'card wider than viewport');
  assert(root.querySelectorAll('[data-t="start"],[data-t="quick"],[data-t="practice"]').length===3,'primary actions missing');
  const pre=document.createElement('pre');pre.id='title-layout-output';pre.textContent=JSON.stringify({viewport:[innerWidth,innerHeight],pageHeight:document.documentElement.scrollHeight,card:Math.round(card.getBoundingClientRect().height),errors});document.body.append(pre);
},300));
