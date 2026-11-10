/* Run in a browser after the game scripts; see VALIDATION.md. */
(async function(){
  const M=OD.sim, R=OD.report, errors=[], stats={worlds:0, states:0, eventScripts:0, eventChoices:0, reconciled:0};
  const assert=(ok,msg)=>{if(!ok) throw Error(msg)};
  const test=(label,fn)=>{try{fn()}catch(e){errors.push(label+': '+(e.stack||e.message||e))}};
  const modes=['easy','normal','hard'], types=M.SCN_TYPES;
  const gradeCases=[[0,'F'],[299,'F'],[300,'D'],[449,'D'],[450,'C'],[599,'C'],[600,'B'],[749,'B'],[750,'A'],[879,'A'],[880,'S'],[1000,'S']];
  test('grade boundaries',()=>{ for(const [n,g] of gradeCases) assert(R.gradeFor(n,false)===g,'boundary '+n);assert(R.gradeFor(880,true)==='A','S decision rule'); });
  test('eight distinct endings',()=>{
    const P=OD.story.endingProfile,W={},s=trust=>({trust}),r=(o)=>Object.assign({correctSource:false,rank:'F',misses:4,total:200,badDec:false,timeout:false},o);
    const ids=[P(W,s(80),r({correctSource:true,rank:'S',misses:0,total:950})),P(W,s(80),r({correctSource:true,rank:'A',total:830})),P(W,s(20),r({correctSource:true,rank:'A',total:820})),P(W,s(50),r({correctSource:true,rank:'B',total:720})),P(W,s(50),r({correctSource:true,rank:'C',total:520})),P(W,s(50),r({timeout:true,total:420})),P(W,s(50),r({total:600})),P(W,s(50),r({total:250}))].map(x=>x.id);
    assert(new Set(ids).size===8,'ending profiles overlap: '+ids.join(','));
  });
  test('statistical calculations',()=>{
    const U=OD.u, L=OD.ml, near=(a,b,t=1e-6)=>Math.abs(a-b)<t;
    assert(near(U.fisherP(1,9,11,3),0.002759456185,1e-8),'Fisher reference table');
    const or=U.or2x2(10,5,5,10);assert(near(or.or,4),'odds ratio');assert(or.lo<or.or&&or.hi>or.or,'confidence interval');
    assert(near(L.auc([0,0,1,1],[0.1,0.2,0.8,0.9]),1),'AUC perfect');assert(near(L.auc([0,1],[0.5,0.5]),0.5),'AUC tie');
    const tree=L.tree([[0],[0],[0],[1],[1],[1]],[0,0,0,1,1,1],{depth:2,minLeaf:1});assert(tree.predict([0])===0&&tree.predict([1])===1,'tree');
    const logit=L.logistic([[0],[0],[0],[1],[1],[1]],[0,0,0,1,1,1]);assert(logit.predict([1])>logit.predict([0]),'logistic direction');
    for(const k of [2,3,5]){const y=[0,0,0,0,0,1,1,1,1,1];const folds=L.folds(y,k,42);assert(folds.length===y.length&&folds.every(i=>i>=0&&i<k),'fold assignment');}
  });
  test('readable table and text in both themes',()=>{
    const parse=s=>s.match(/[\d.]+/g).slice(0,3).map(Number), lum=c=>{const v=parse(c).map(n=>{n/=255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]}, ratio=(a,b)=>{a=lum(a);b=lum(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    const probe=document.createElement('div');probe.innerHTML='<div class="frame"><span class="faint">ข้อมูลรอง</span><table class="doc conf"><tbody><tr><td>ข้อมูล</td><td class="hl2">ผล</td></tr></tbody></table></div><div class="paper"><span class="faint">คำอธิบาย</span></div>';document.body.append(probe);
    const prev=document.documentElement.dataset.theme;
    for(const theme of ['dark','light']){if(theme==='dark')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=theme;
      const table=probe.querySelector('table'),cells=table.querySelectorAll('td'),paper=probe.querySelector('.paper'),frame=probe.querySelector('.frame');
      assert(ratio(getComputedStyle(cells[0]).color,getComputedStyle(table).backgroundColor)>=4.5,theme+' table');
      assert(ratio(getComputedStyle(cells[1]).color,getComputedStyle(cells[1]).backgroundColor)>=4.5,theme+' highlighted table');
      assert(ratio(getComputedStyle(frame.querySelector('.faint')).color,getComputedStyle(frame).backgroundColor)>=4.5,theme+' secondary text');
      assert(ratio(getComputedStyle(paper.querySelector('.faint')).color,getComputedStyle(paper).backgroundColor)>=4.5,theme+' paper text');
    }
    if(prev)document.documentElement.dataset.theme=prev;else delete document.documentElement.dataset.theme;probe.remove();
  });
  for(const type of types) for(let seed=1;seed<=20;seed++){
    let W; test(type+' seed '+seed+' build',()=>{
      W=M.build(seed,type); stats.worlds++;
      assert(W.scn.type===type,'wrong scenario'); assert(M.SITES[W.scn.culprit],'unknown culprit');assert(M.PATHOGENS[W.scn.pathogen],'unknown pathogen');
      assert(new Set(W.people.map(p=>p.id)).size===W.people.length,'duplicate person ids');
      for(const p of W.people){assert(W.byId(p.id)===p,'byId mismatch');if(p.inf!==null)assert(p.onset>=p.inf,'onset before infection');}
    }); if(!W)continue;
    for(const diff of modes) test(type+' seed '+seed+' '+diff,()=>{
      const S=M.newState(W,diff,'ทดสอบ');S.gender='m';S.pol='ครับ';S.flags.v={pressure:'hall',patient:'thongbai',fest:'kathin',media:'radio'};
      S.kit=new Set(M.KIT.filter(x=>x.ok).map(x=>x.k)); S.acc={ch1:6,ch1Max:6,ch2:16,ch2Max:16};
      const initial=M.records(W,S);M.reviewRecords(W,S);M.interviewAll(W,S);M.addControls(W,S,1);
      const rows=M.analyze(W,S);assert(rows.length>0,'no analytical rows');
      for(const row of rows){assert(row.pCase>=0&&row.pCase<=1,'case proportion');assert(row.pCtrl===null||(row.pCtrl>=0&&row.pCtrl<=1),'control proportion');}
      const stool=M.labStool(W,S);assert(stool.n===stool.ids.length&&stool.n===stool.res.length&&stool.n<=5,'stool result');
      for(const site of Object.keys(M.SITES)){const result=M.inspect(W,S,site);assert(result&&typeof result.text==='string','inspect '+site);const samples=M.sampleTypes(W,S,site);for(const [k] of samples){const lab=M.labEnv(W,S,site,k);assert(lab.kind==='env'&&typeof lab.pos==='boolean','environment lab '+site+'/'+k);}}
      M.supplyChain(W,S);assert(['F1','F2','F3'].every(x=>S.known.has(x)),'supply sites missing');
      S.T=M.DEADLINE; S.acfAt=M.T0; S.ver++;
      const casesBefore=new Set(M.records(W,S).map(r=>r.p.id)); const before=S.controls.filter(id=>casesBefore.has(id));
      const moved=M.reconcileControls(W,S); stats.reconciled+=moved.length;
      assert(moved.length===before.length,'reconciliation count');assert(S.controls.every(id=>!casesBefore.has(id)),'case retained as control');assert(moved.every(id=>!S.ans[id]),'old control answer retained');
      M.interviewAll(W,S);assert(moved.every(id=>S.ans[id]),'case cannot be interviewed again');
      const T=R.truth(W), sel={site:T.site,route:T.route,p2p:T.p2p,path:T.pathogen,pattern:T.pattern,meas:new Set(['close','chlor','recall','vegrecall','handler','sanit','leftover','hygiene','active','comm','surv']),lim:new Set(['recall','under','labsens'])};
      const result=R.score(W,S,sel,[],new Map());assert(Number.isFinite(result.total)&&result.total>=0&&result.total<=1000,'score out of range '+result.total);assert(['S','A','B','C','D','F'].includes(result.rank),'invalid grade');assert(M.records(W,S).length>=0&&initial.length>=0,'records error');stats.states++;
    });
  }
  // Probe every event and its directly presented choices in a fresh state per choice.
  const oldSpend=OD.field.spend, oldClose=OD.field.closeSite, oldReopen=OD.field.reopenSite;
  let current;
  OD.field.spend=(h,b)=>{current.T=Math.min(M.DEADLINE,current.T+h);current.budget-=b||0;};
  OD.field.closeSite=(id)=>{current.closed[id]=current.T;current.ver++;};
  OD.field.reopenSite=(id)=>{current.reopened[id]=current.T;current.ver++;};
  function fixture(W,variant){
    const S=M.newState(W,'easy','ทดสอบ');current=S;S.T=M.T0+70;S.gender='m';S.pol='ครับ';S.flags.v=variant;
    S.flags.rumor=W.scn.culprit;S.flags.rumor0='R1';S.flags.jit={};S.flags.pool=OD.story.POOL.slice();S.flags.festival='safe';S.flags.explained=true;
    S.flags.promise=M.T0;S.flags.comm='good';S.kit=new Set(M.KIT.filter(x=>x.ok).map(x=>x.k));
    S.closed.R1=M.T0;S.labs.push({id:1,kind:'env',site:'R1',type:'food',due:S.T+2,seen:false,pos:false});
    S.decisions.push({id:'labform',verdict:'mixed'});return S;
  }
  const variants=[{pressure:'hall',patient:'thongbai',fest:'kathin',media:'radio'},{pressure:'protest',patient:'baby',fest:'wedding',media:'tv'},{pressure:'live',patient:'boonsong',fest:'kathin',media:'influencer'}];
  for(const type of types) for(let seed=1;seed<=6;seed++){const W=M.build(seed,type);for(const variant of variants){M.setFest(variant.fest);for(const ev of OD.story.events){
    let nodes=[];test('event '+type+'/'+seed+'/'+variant.pressure+'/'+ev.id,()=>{const S=fixture(W,variant);Boolean(ev.when(W,S));nodes=ev.script(W,S);assert(Array.isArray(nodes),'script not array'); const visit=list=>{for(const node of list){for(const key of ['text','narr']) if(typeof node[key]==='string') assert(!/\b(?:undefined|NaN)\b/.test(node[key]),'invalid rendered '+key); if(node.then)visit(node.then); if(node.else)visit(node.else);}}; visit(nodes);stats.eventScripts++;});
    const indices=nodes.map((x,i)=>x.choice?i:-1).filter(i=>i>=0);
    for(const idx of indices) for(let choice=0;choice<nodes[idx].choice.length;choice++) test('choice '+type+'/'+seed+'/'+variant.pressure+'/'+ev.id+'/'+idx+'/'+choice,()=>{
      const S=fixture(W,variant), step=ev.script(W,S)[idx], option=step.choice[choice];assert(option&&typeof option.text==='string','choice text');if(option.do)option.do();for(const d of S.decisions)OD.story.resolve(W,S,d);stats.eventChoices++;
    });
  }}}
  OD.field.spend=oldSpend;OD.field.closeSite=oldClose;OD.field.reopenSite=oldReopen;
  test('live field reconciliation',()=>{
    const W=OD.W=M.build(11,'WELL'), S=OD.S=M.newState(W,'easy','ทดสอบ');S.gender='m';S.pol='ครับ';
    S.flags.v={pressure:'hall',patient:'baby',fest:'kathin',media:'radio'}; OD.field.run();
    const p=W.people.find(p=>!p.hidden&&p.inf!==null&&p.report>M.T0+2&&p.report<M.DEADLINE-2);assert(p,'no future reported case');
    S.T=p.report-1;S.controls=[p.id];S.ans[p.id]={W1:true};OD.field.spend(2,0,'ทดสอบ');
    assert(!S.controls.includes(p.id),'still control after time advances');assert(!S.ans[p.id],'old answer retained');
    M.interviewAll(W,S);assert(!!S.ans[p.id],'new patient interview missing');
  });
  document.body.dataset.audit=errors.length?'fail':'pass';document.body.dataset.auditStats=JSON.stringify(stats);
  const pre=document.createElement('pre');pre.id='audit-output';pre.textContent=JSON.stringify({stats,errors},null,2);document.body.appendChild(pre);
})();
