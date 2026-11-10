window.addEventListener('load',async()=>{
  const errors=[],checks=[],view=new URLSearchParams(location.search).get('view')||'locale';
  const assert=(value,message)=>{if(!value)errors.push(message)},tick=()=>new Promise(r=>setTimeout(r,100));
  const setup=()=>{const M=OD.sim;OD.W=M.build(15,'WELL');OD.S=M.newState(OD.W,'easy','Alex');Object.assign(OD.S,{gender:'m',pol:'ครับ'});Object.assign(OD.S.flags,{v:{fest:'kathin',patient:'baby',pressure:'hall',media:'radio'},kitReady:true,seen:['pdpa']});OD.S.kit=new Set(M.KIT.filter(x=>x.ok).map(x=>x.k));localStorage.setItem('od2-tour','1');localStorage.setItem('od2-vnhint','1');};
  const thai=/[ก-ฺเ-๙]/;
  const leftovers=el=>{const values=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){if(!n.parentElement.closest('script,style,code,pre,textarea,.notranslate,[data-no-translate]')&&thai.test(n.nodeValue))values.push(n.nodeValue.trim());}return [...new Set(values)];};
  try{
    setup();
    if(view==='title'){
      OD.main.title();OD.i18n.scan(document.querySelector('#scr-title'));const left=leftovers(document.querySelector('#scr-title'));assert(!left.length,'Title: '+left.join(' | '));assert(document.documentElement.scrollWidth<=innerWidth+1,'English title overflows horizontally');checks.push('English title translated and fits viewport');
    }else if(view==='locale'){
      assert(OD.i18n.lang()==='en','English not selected');
      assert(!/fetch\(|XMLHttpRequest/.test(OD.i18n.text.toString()),'runtime translation performs a network request');
      const inspect=steps=>steps.forEach(s=>{for(const key of ['text','narr','me','prompt'])if(s[key]){const out=OD.i18n.t(s[key]);assert(!thai.test(out),'Story '+key+': '+out);}for(const c of s.choice||[]){assert(!thai.test(OD.i18n.t(c.text)),'Choice: '+c.text);if(c.hint)assert(!thai.test(OD.i18n.t(c.hint)),'Hint: '+c.hint);}for(const sub of ['then','else'])if(s[sub])inspect(s[sub]);});
      for(const key of ['prologue','ch1_intro','ch1_done','ch2_intro','ch2_done','field_intro']){
        OD.S.flags.rumor='W1';OD.S.flags.rumor0='E';inspect(OD.story[key](OD.W,OD.S));
      }
      const savedActions={spend:OD.field.spend,closeSite:OD.field.closeSite,reopenSite:OD.field.reopenSite};OD.field.spend=()=>{};OD.field.closeSite=()=>{};OD.field.reopenSite=()=>{};
      for(const variant of [{pressure:'hall',patient:'thongbai',fest:'kathin',media:'radio'},{pressure:'protest',patient:'baby',fest:'wedding',media:'tv'},{pressure:'live',patient:'boonsong',fest:'kathin',media:'influencer'}]){
        OD.S.T=OD.sim.T0+70;OD.S.closed.R1=OD.sim.T0;OD.S.labs=[{id:1,kind:'env',site:'R1',type:'food',due:OD.S.T+2,seen:false,pos:false}];OD.S.decisions=[{id:'labform',verdict:'mixed'}];OD.S.flags.v=variant;OD.sim.setFest(variant.fest);OD.S.flags.pool=OD.story.POOL.slice();OD.S.flags.jit={};OD.S.flags.festival='safe';OD.S.flags.explained=true;OD.S.flags.promise=OD.sim.T0;OD.S.flags.comm='good';
        for(const event of OD.story.events)inspect(event.script(OD.W,OD.S));
      }
      Object.assign(OD.field,savedActions);
      OD.field.run();await tick();OD.u.clearModals();
      for(const tab of ['curve','ana','sym','list','ev','ck','ml']){OD.S.ui.tab=tab;OD.field.render();OD.i18n.scan(document.querySelector('#scr-field'));const left=leftovers(document.querySelector('#scr-field'));assert(!left.length,'Tab '+tab+': '+left.join(' | '));}
      checks.push('offline story, choices and all seven field tabs');
    }else{
      OD.vn.play([{bg:'village'},{show:'doctor',pos:'left'},{show:'boonma',pos:'right'},{say:'doctor',text:OD.i18n.lang()==='en'?'Follow the evidence. Every decision changes the village’s future.':'ทุกหลักฐานมีความหมาย ทุกการตัดสินใจเปลี่ยนอนาคตของหมู่บ้าน'}]);await tick();
      const root=document.querySelector('#vn'),motion=root.querySelector('[data-vn="motion"]');
      assert(root.querySelector('.cinema-lantern'),'lantern layer missing');assert(root.querySelectorAll('.cinema-foliage').length===2,'foliage layers missing');
      assert(root.dataset.water==='true','water layer not enabled');
      const water=root.querySelector('.cinema-water'),anim=water.getAnimations()[0];assert(anim&&anim.playState==='running','water animation is not running');if(anim){anim.pause();anim.currentTime=0;const before=getComputedStyle(water).transform;anim.currentTime=2500;assert(before!==getComputedStyle(water).transform,'water animation frames do not move');anim.play();}
      motion.click();assert(document.documentElement.dataset.motion==='off','motion control did not disable animation');assert(getComputedStyle(water).animationName==='none','animation kept running after disabling');motion.click();
      const box=root.querySelector('.vn-box').getBoundingClientRect();assert(box.left>=0&&box.right<=innerWidth+1,'dialogue overflows screen');
      assert(root.querySelector('.vn-tools').getBoundingClientRect().left>=0,'tools overflow screen');checks.push('layer motion, pause setting and dialogue framing');
    }
  }catch(e){errors.push(e.stack||String(e));}
  const pre=document.createElement('pre');pre.id='polish-output';pre.textContent=JSON.stringify({view,checks,errors});document.body.append(pre);
});
