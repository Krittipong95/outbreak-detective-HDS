/* Versioned checkpoints. Keep the generated world, not just its random seed. */
OD.session = (function(){
  const KEY='od3-case-v1', VERSION=1, stages=['prologue','ch1','ch2','field','report','result'];
  const labels={prologue:'บทนำ',ch1:'บทที่ ๑',ch2:'บทที่ ๒',field:'ภาคสนาม',report:'กระดานและรายงาน',result:'ผลคดี'};
  let stage=null, lastSaved=null, failed=false, warned=false;
  const replacer=(k,v)=>{
    if(k.startsWith('_')||typeof v==='function')return undefined;
    if(v instanceof Set)return {$od:'set',values:[...v]};
    if(v instanceof Map)return {$od:'map',values:[...v]};
    if(typeof v==='number'&&!Number.isFinite(v))return {$od:'number',value:String(v)};
    return v;
  };
  const reviver=(k,v)=>{
    if(v&&v.$od==='set')return new Set(v.values);
    if(v&&v.$od==='map')return new Map(v.values);
    if(v&&v.$od==='number')return {Infinity:Infinity,'-Infinity':-Infinity,NaN:NaN}[v.value];
    return v;
  };
  function decode(raw){
    const p=JSON.parse(raw,reviver), W=p?.world,S=p?.state;
    if(p?.version!==VERSION||!stages.includes(p.stage)||!Number.isFinite(p.at)||!W||!S)throw Error('Unsupported checkpoint');
    if(!OD.sim.SITES[W.scn?.culprit]||!OD.sim.PATHOGENS[W.scn?.pathogen]||!Array.isArray(W.people)||!Array.isArray(W.households)||!Number.isFinite(W.seed))throw Error('Invalid world');
    if(!OD.sim.DIFF[S.diff]||!Number.isFinite(S.T)||S.T<OD.sim.T0||S.T>OD.sim.DEADLINE||!Number.isFinite(S.budget)||!S.flags||!S.acc)throw Error('Invalid state');
    const base=OD.sim.newState(W,S.diff,S.name);
    for(const [key,value] of Object.entries(base)){
      if(value instanceof Set && !(S[key] instanceof Set))throw Error('Invalid set '+key);
      if(Array.isArray(value)&&!Array.isArray(S[key]))throw Error('Invalid array '+key);
      if(value&&typeof value==='object'&&!Array.isArray(value)&&!(value instanceof Set)&&(!S[key]||typeof S[key]!=='object'))throw Error('Invalid object '+key);
    }
    for(const key of Object.keys(base.clean))if(!(S.clean[key] instanceof Set))throw Error('Invalid cleaning state');
    if(S.kit!==null&&!(S.kit instanceof Set))throw Error('Invalid kit');
    if(p.stage==='result'&&(!S.savedResult?.R||!Number.isFinite(S.savedResult.R.total)||!(S.savedResult.sel?.meas instanceof Set)))throw Error('Invalid result');
    if(S.reportDraft&&(!Array.isArray(S.reportDraft.evs)||!(S.reportDraft.links instanceof Map)||!['board','form'].includes(S.reportDraft.screen)))throw Error('Invalid report');
    if(S.chapter1&&(!S.chapter1.data||!Array.isArray(S.chapter1.questions)))throw Error('Invalid first chapter');
    if(S.chapter2&&(!Array.isArray(S.chapter2.recs)||!Array.isArray(S.chapter2.issues)))throw Error('Invalid second chapter');
    const people=new Map(W.people.map(p=>[p.id,p]));
    if(people.size!==W.people.length)throw Error('Duplicate people');
    W.byId=id=>people.get(id);
    return p;
  }
  function read(){try{const raw=localStorage.getItem(KEY);return raw?decode(raw):null;}catch(e){return null;}}
  function status(){try{const raw=localStorage.getItem(KEY);if(!raw)return null;const p=decode(raw);return {stage:p.stage,label:labels[p.stage],name:p.state.name,at:p.at};}catch(e){return {invalid:true};}}
  function paint(){document.querySelectorAll('[data-save-status]').forEach(el=>{el.textContent=failed?'บันทึกไม่ได้ · พื้นที่เก็บข้อมูลอาจเต็ม':lastSaved?'บันทึกแล้ว '+new Date(lastSaved).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):'จะบันทึกเมื่อจบขั้นตอน';el.classList.toggle('save-error',failed);});}
  function save(nextStage=stage){
    if(!stages.includes(nextStage)||!OD.W||!OD.S)return false;
    stage=nextStage;
    try{
      const at=Date.now(), raw=JSON.stringify({version:VERSION,stage,at,world:OD.W,state:OD.S},replacer);
      localStorage.setItem(KEY,raw);lastSaved=at;failed=false;paint();return true;
    }catch(e){failed=true;paint();if(!warned){warned=true;OD.u.toast('ยังบันทึกคดีไม่ได้ ลองตรวจพื้นที่เก็บข้อมูลของเบราว์เซอร์','',8000);}return false;}
  }
  function restore(){const p=read();if(!p)return null;OD.W=p.world;OD.S=p.state;stage=p.stage;lastSaved=p.at;OD.sim.setFest(OD.S.flags.v?.fest||'kathin');return p.stage;}
  function safeSave(){
    if(stage!=='field'||!OD.S?.flags.kitReady||OD.field?.isBusy?.()||document.querySelector('#modal.open')||!document.querySelector('#vn.hidden')||document.querySelector('#scr-field.hidden'))return;
    save();
  }
  function init(){setInterval(safeSave,10000);window.addEventListener('pagehide',safeSave);document.addEventListener('visibilitychange',()=>{if(document.hidden)safeSave();});}
  return {save,read,status,restore,paint,init,decode,encode:p=>JSON.stringify(p,replacer),stage:()=>stage};
})();
