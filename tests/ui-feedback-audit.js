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
    }
  }catch(e){errors.push(e.stack||String(e));}
  const pre=document.createElement('pre');pre.id='ui-feedback-output';pre.textContent=JSON.stringify({view,errors});document.body.append(pre);
});
