window.addEventListener('load',async()=>{
  const view=new URLSearchParams(location.search).get('view')||'practice',errors=[];
  const assert=(ok,msg)=>{if(!ok)errors.push(msg)},tick=()=>new Promise(r=>setTimeout(r,300));
  try{
    if(view==='practice'){
      localStorage.removeItem('od3-practice-v1');OD.practice.open();const card=document.querySelector('.practice-modal');
      document.querySelector('[data-m="talk:a"]').click();await tick();
      assert(document.querySelector('.practice-modal')===card,'practice modal node was recreated');
    }else if(view==='ch1'){
      OD.W=OD.sim.build(15,'WELL');OD.S=OD.sim.newState(OD.W,'easy','ทดสอบ');OD.S.gender='m';OD.S.pol='ครับ';OD.S.flags.v={fest:'kathin'};OD.ch1.run();await tick();
      assert(document.querySelectorAll('.qcard').length===1,'more than one question card shown');
      assert(document.querySelectorAll('.question-tab').length===3,'question tabs missing');
      const rows=[...document.querySelectorAll('table.doc tbody tr')],bg=rows.map(r=>getComputedStyle(r).backgroundColor);
      assert(new Set(bg).size>1,'table rows do not alternate');
      const svg=document.querySelector('.paper svg'),last=[...svg.querySelectorAll('circle')].at(-1),label=[...svg.querySelectorAll('text')].find(t=>t.textContent.includes('ปี ๒๕๖๙'));
      assert(last&&label&&Math.abs(+last.getAttribute('cx')-(+label.getAttribute('x')))<=1,'year label not aligned to final point');
    }else if(view==='handbook'){
      OD.handbook.open('steps');await tick();const modal=document.querySelector('.hb-modal');
      const scrollable=[modal,...modal.querySelectorAll('*')].filter(el=>{const s=getComputedStyle(el);return /(auto|scroll)/.test(s.overflowY)&&el.scrollHeight>el.clientHeight+2;});
      assert(scrollable.length===1,'handbook has '+scrollable.length+' vertical scroll areas');
    }else if(view==='choices'){
      OD.W=OD.sim.build(15);OD.S=OD.sim.newState(OD.W,'easy','ทดสอบ');OD.S.gender='m';OD.S.pol='ครับ';
      OD.vn.play([{bg:'hall',choice:[{text:'**เก็บข้อมูลเพิ่มก่อนตัดสินใจ**',hint:'ลดโอกาสปิดผิดแหล่ง'},{text:'ปิดทันทีตามข่าวลือ',hint:'ความเชื่อมั่นเพิ่มชั่วคราว'}]}]);await tick();
      assert(!!document.querySelector('.vn-choice b'),'important choice words are not highlighted');
      assert(getComputedStyle(document.querySelector('.vn-choice .hint')).color!==getComputedStyle(document.querySelector('.vn-choice')).color,'impact hint not visually distinct');
    }else if(view==='ending'){
      document.body.innerHTML='<section id="scr-result"><div class="res"><div class="res-hero ending-legend"><img class="ending-team" src="img/ending-team-v2.png" alt="ทีมสอบสวนโรคบ้านสุขใจ"><div class="ending-copy"><div class="title-eyebrow">ผลการสอบสวนโรค</div><h1 class="display gold-text">ไขคดีสำเร็จ</h1><div class="ending-name"><small>ฉากจบที่ได้รับ</small><b>ดาวเหนือแห่งบ้านสุขใจ</b><span>คดีสมบูรณ์แบบ · ชุมชนจดจำชื่อของคุณ</span></div></div></div></div></section>';
      const img=document.querySelector('.ending-team');if(!img.complete)await new Promise(r=>{img.onload=r;img.onerror=r;});
      assert(img.naturalWidth>1000,'ending character art did not load');
      assert(document.querySelector('.res-hero').scrollWidth<=document.querySelector('.res-hero').clientWidth+1,'ending hero overflows');
    }else if(view==='overlay-cleanup'){
      OD.W=OD.sim.build(15);OD.S=OD.sim.newState(OD.W,'easy','ทดสอบ');OD.S.gender='m';OD.S.pol='ครับ';
      const p=OD.vn.play([{narr:'ข้อความทดสอบ'}],{mode:'overlay'});await tick();document.querySelector('.vn-box').click();await p;
      const vn=document.querySelector('#vn');assert(vn.classList.contains('hidden'),'VN did not close');assert(!vn.classList.contains('overlay'),'dark overlay class remained after dialogue');
      OD.u.modal('<h2>ชั้นแรก</h2><button data-m="open">เปิดซ้อน</button>',k=>{if(k==='open')OD.u.modalOverlay(()=>OD.u.modal('<h2>ชั้นสอง</h2><button data-m="close">ปิด</button>',()=>OD.u.closeModal()));});
      document.querySelector('[data-m="open"]').click();document.querySelector('[data-m="close"]').click();OD.u.closeModal();
      assert(!document.querySelector('#modal').classList.contains('open'),'modal backdrop remained after nested close');
    }else if(view==='board-lines'){
      OD.W=OD.sim.build(15);OD.S=OD.sim.newState(OD.W,'easy','ทดสอบ');OD.S.known=new Set(Object.keys(OD.sim.SITES));
      const ev=[{id:'e1',cat:'stat',kind:'or',text:'หลักฐานทดสอบ',target:'W1'}],links=new Map([['e1','W1']]);OD.board.run(OD.W,OD.S,ev,links);await tick();
      assert(!!document.querySelector('[data-manage-lines]'),'manage lines button missing');assert(!document.querySelector('[data-pick-unlink]'),'remove control visible outside manage mode');
      document.querySelector('[data-manage-lines]').click();await tick();assert(!!document.querySelector('[data-pick-unlink]'),'line selector missing in manage mode');
      document.querySelector('[data-pick-unlink]').click();await tick();assert(!!document.querySelector('[data-confirm-unlink]'),'remove confirmation missing');
    }else if(view==='painted-scenes'){
      const keys=['village','temple','school','hall','office','office_night','clinic','lab','market','somtam','noodle_boat','chicken_rice','mookata','well_temple','well_market','well_canal','ice_factory','farm'];
      const host=document.createElement('div');document.body.append(host);for(const key of keys){host.innerHTML=OD.art.scene(key);const img=host.querySelector('image');assert(!!img,key+' is not mapped to painted art');if(img){const src=img.getAttribute('href'),probe=new Image();probe.src=src;await new Promise(r=>{probe.onload=r;probe.onerror=r;});assert(probe.naturalWidth>=1600,key+' painted asset failed to load');}}
    }
  }catch(e){errors.push(e.stack||String(e));}
  const pre=document.createElement('pre');pre.id='ui-feedback-output';pre.textContent=JSON.stringify({view,errors});document.body.append(pre);
});
