/* Short explanations and a separate, replayable training case. */
OD.guide = (function(){
  const terms={
    or:['อัตราส่วนออดส์ (Odds Ratio; OR) คืออะไร','อัตราส่วนของ odds การสัมผัสในผู้ป่วยต่อ odds การสัมผัสในกลุ่มควบคุม ค่ามากกว่า 1 ชี้ความสัมพันธ์เชิงบวก แต่ยังไม่ยืนยันว่าเป็นสาเหตุ','ในคดีฝึก OR = 8 จึงควรตรวจแหล่งนั้นต่อ ไม่ควรอ่านว่า “ความเสี่ยงป่วยเพิ่ม 8 เท่า” โดยตรง'],
    ci:['ช่วงความเชื่อมั่น 95%','ช่วยแสดงความไม่แน่นอนของค่าประมาณ ช่วงกว้างแปลว่าค่ายังไม่แม่นยำ สำหรับ OR ค่า 1 หมายถึงไม่พบความสัมพันธ์ในเชิงอัตราส่วน','ถ้าช่วงของ OR คร่อม 1 ข้อมูลยังไม่ชัดพอจะสรุปว่าต่างกัน ไม่ได้แปลว่าแหล่งนั้นปลอดภัย'],
    control:['กลุ่มควบคุม','คนที่ไม่ป่วยตามนิยามและมาจากประชากรต้นทางเดียวกับผู้ป่วย ใช้เป็นกลุ่มเปรียบเทียบการสัมผัส','ผู้ป่วยส่วนใหญ่ไปตลาด ก็ยังสรุปไม่ได้ว่าตลาดเป็นต้นตอ ถ้าคนไม่ป่วยส่วนใหญ่ไปตลาดเช่นกัน'],
    confound:['ตัวแปรกวน','ปัจจัยอื่นที่เกี่ยวข้องกับทั้งการสัมผัสและการป่วย อาจทำให้ความสัมพันธ์ที่เห็นคลาดเคลื่อน','ลองแยกวิเคราะห์ตามหมู่บ้าน แล้วเทียบกับค่าเดิม การเปลี่ยนของ OR เป็นเบาะแสให้ตรวจต่อ'],
    lab:['ผลแล็บลบ','ตัวอย่างนี้ตรวจไม่พบเชื้อด้วยวิธีที่ใช้ ผลขึ้นกับเวลาเก็บ ชนิดตัวอย่าง การขนส่ง และความไวของการตรวจ','ในเกมควรดูสถิติและสิ่งแวดล้อมร่วมด้วย อย่าตัดสถานที่ออกจากผลลบเพียงครั้งเดียว'],
    auc:['AUC','สรุปความสามารถของโมเดลในการแยกสองกลุ่ม ค่าสูงขึ้นหมายถึงแยกได้ดีขึ้นในข้อมูลที่ประเมิน','ดูผลกับข้อมูลที่ไม่ได้ใช้ฝึกด้วย โมเดลทำนายเก่งยังไม่ได้พิสูจน์ต้นตอของโรค']
  };
  function button(key,label){return `<button type="button" class="term-help" data-term="${key}" aria-label="อธิบาย ${label}">${label} <span aria-hidden="true">?</span></button>`;}
  function html(){return `<div class="term-bar"><span>ศัพท์ที่ใช้หน้านี้</span>${button('or','OR')}${button('ci','95% CI')}${button('control','กลุ่มควบคุม')}${button('confound','ตัวแปรกวน')}${button('lab','ผลแล็บลบ')}${button('auc','AUC')}</div>`;}
  function open(key){
    const t=terms[key];if(!t)return;
    OD.u.modalOverlay(()=>OD.u.modal(`<div class="title-eyebrow">พี่วิอธิบายแบบสั้น ๆ</div><h2>${t[0]}</h2><p>${t[1]}</p><div class="note">${t[2]}</div><div class="m-actions"><button class="btn btn-gold" data-m="close">เข้าใจแล้ว กลับไปเล่น</button></div>`,()=>OD.u.closeModal(),{cls:'term-modal'}));
  }
  function init(){document.addEventListener('click',e=>{const b=e.target.closest('[data-term]');if(b){e.preventDefault();e.stopPropagation();open(b.dataset.term);}},true);}
  return {html,button,open,init};
})();

OD.practice = (function(){
  const U=OD.u, KEY='od3-practice-v1';
  const titles=['ฟัง','เทียบ','ตรวจ','ปัก','สรุป'];
  const fresh=()=>({step:0,done:[],heard:[],pins:{},selected:null,feedback:''});
  let P=fresh();
  function load(){try{const p=JSON.parse(localStorage.getItem(KEY));if(p&&Number.isInteger(p.step)&&p.step>=0&&p.step<=5&&Array.isArray(p.done)&&Array.isArray(p.heard)&&p.pins)P=p;else P=fresh();}catch(e){P=fresh();}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(P));}catch(e){}}
  const choice=(id,label)=>`<button class="practice-choice" data-m="${id}">${label}</button>`;
  function complete(text){P.done[P.step]=true;P.feedback=text;OD.sfx?.('correct');save();draw();}
  function retry(text){P.feedback=text;OD.sfx?.('page');save();draw();}
  function body(){
    if(P.step===0)return `<h3>ขออนุญาตถาม ก่อนตามหาเบาะแส</h3><p>มีคนท้องร่วงในหมู่บ้าน พี่วิชวนคุณคุยกับชาวบ้านสองคน แตะเพื่อฟังทั้งคู่</p><div class="practice-people">${choice('talk:a','👩 ป้าอิ่ม · ผู้ป่วย')}${choice('talk:b','👨 ลุงชื่น · ไม่ป่วย')}</div>${P.heard.includes('a')?'<blockquote>“เริ่มถ่ายเมื่อคืน เมื่อวานตักน้ำจากบ่อกลางหมู่บ้านมาดื่ม ไม่ได้แวะร้านอาหารจ้ะ”</blockquote>':''}${P.heard.includes('b')?'<blockquote>“ผมก็ไปตลาด แต่ดื่มน้ำขวด ยังไม่มีอาการครับ”</blockquote>':''}${P.heard.length===2?`<p><b>จากคำบอกเล่า เราควรทำอะไรต่อ?</b></p>${choice('q:more','ถามคนเพิ่มและเปรียบเทียบการดื่มน้ำ')}${choice('q:blame','ประกาศทันทีว่าร้านในตลาดเป็นต้นตอ')}`:''}`;
    if(P.step===1){const r=U.or2x2(20,10,5,20);return `<h3>มีตัวเปรียบเทียบ จึงมองเห็นเบาะแส</h3><p>ข้อมูลฝึกสมมติ: สัมภาษณ์ผู้ป่วย 25 คน และคนไม่ป่วย 30 คนจากชุมชนเดียวกัน</p><div class="practice-table"><table class="doc"><thead><tr><th>การสัมผัส</th><th>ผู้ป่วย</th><th>ไม่ป่วย</th></tr></thead><tbody><tr><td>ดื่มน้ำจากบ่อ</td><td>20</td><td>10</td></tr><tr><td>ไม่ได้ดื่ม</td><td>5</td><td>20</td></tr></tbody></table></div><p class="practice-number"><span>อัตราส่วนออดส์ (OR)</span> <b>${r.or}</b><small>ช่วงความเชื่อมั่น 95% (95% CI) ${r.lo.toFixed(2)} ถึง ${r.hi.toFixed(2)}</small></p>${OD.guide.button('or','อ่านค่า OR')}${OD.guide.button('ci','อ่านช่วงความเชื่อมั่น')}<p><b>ควรสรุปอย่างไร?</b></p>${choice('q:investigate','การดื่มน้ำจากบ่อสัมพันธ์กับการป่วย ควรตรวจบ่อต่อ')}${choice('q:certain','OR สูง ยืนยันต้นตอได้แล้ว ไม่ต้องเก็บหลักฐานอื่น')}`;}
    if(P.step===2)return `<h3>จากเบาะแส ไปตรวจสถานที่จริง</h3><div class="practice-scene">${OD.art.scene('well_temple')}</div><p>คุณพบฝาบ่อชำรุดและร่องรอยน้ำสกปรกไหลเข้าบ่อ พี่วิประสานห้องแล็บให้ตรวจตัวอย่างน้ำกับตัวอย่างผู้ป่วย</p><p><b>เลือกวิธีจัดการตัวอย่างน้ำ</b></p>${choice('q:sample','ใช้ขวดปลอดเชื้อตามที่แล็บกำหนด ติดฉลากและขนส่งตามคำแนะนำ')}${choice('q:bottle','ใช้ขวดน้ำที่ดื่มหมดแล้ว ไม่ต้องระบุจุดเก็บ')}${P.done[2]?'<div class="note jade"><b>ผลแล็บในคดีฝึกออกแล้ว</b><p>ตัวอย่างน้ำจากบ่อและตัวอย่างผู้ป่วยพบเชื้อชนิดเดียวกัน เก็บผลนี้ไปเทียบกับหลักฐานอื่นได้</p></div>':''}`;
    if(P.step===3){const cards=[['stat','📊 สถิติ','การดื่มน้ำจากบ่อสัมพันธ์กับการป่วย'],['env','🔎 สิ่งแวดล้อม','ฝาบ่อชำรุด มีร่องรอยน้ำสกปรกไหลเข้า'],['lab','🧪 แล็บ','น้ำจากบ่อและผู้ป่วยพบเชื้อชนิดเดียวกัน']];return `<h3>ต่อหลักฐานให้เป็นเรื่องเดียวกัน</h3><p>แตะการ์ดหนึ่งใบ แล้วแตะสถานที่ที่หลักฐานนั้นสนับสนุน ทำให้ครบ 3 ใบ</p><div class="practice-evidence">${cards.map(([id,label,copy])=>`<button class="practice-pin ${P.selected===id?'selected':''}" data-m="card:${id}" aria-pressed="${P.selected===id}"><b>${label}</b><span>${copy}</span><small>${P.pins[id]==='well'?'✓ ปักที่บ่อแล้ว':'แตะเพื่อเลือก'}</small></button>`).join('')}</div><div class="practice-places">${choice('pin:well','💧 บ่อน้ำกลางหมู่บ้าน')}${choice('pin:shop','🍜 ร้านอาหารในตลาด')}</div><p class="muted">ปักแล้ว ${Object.keys(P.pins).length}/3 ใบ</p>`;}
    if(P.step===4)return `<h3>เลือกข้อสรุปที่มีหลักฐานรองรับ</h3><p>ทั้งข้อมูลเปรียบเทียบ สภาพบ่อ และผลแล็บชี้ไปทางเดียวกัน คุณจะเสนออะไรในรายงานฝึก?</p>${choice('q:conclude','บ่อน้ำเป็นแหล่งที่หลักฐานสนับสนุนมากที่สุด งดใช้และจัดหาน้ำปลอดภัย พร้อมแก้ไขและติดตามผู้ป่วย')}${choice('q:closeall','ปิดทุกร้านในตลาด เพราะมีคนไปตลาดหลายคน')}${choice('q:wait','รอจนมีผู้ป่วยทุกบ้าน แล้วจึงเริ่มดำเนินการ')}`;
    return `<div class="practice-finish"><div class="practice-seal" aria-hidden="true">🌱</div><h3>คุณปิดคดีฝึกได้แล้ว</h3><p>ฟังโดยไม่ด่วนตัดสิน เทียบข้อมูล ตรวจสถานที่ และเชื่อมหลักฐานก่อนสรุป</p><div class="note"><b>คดีจริงจะท้าทายขึ้น</b><p>ต้นตอสุ่มใหม่ ผลแล็บอาจไม่พบเชื้อ และบางปัจจัยเกี่ยวข้องกัน ต้องพิจารณาหลักฐานหลายด้าน</p></div><p>พร้อมแล้ว เลือก “ลงพื้นที่ทันที” หรือ “เริ่มเรื่อง” ที่หน้าแรกได้เลย</p></div>`;
  }
  let renderedStep=-1;
  function draw(){
    const old=document.querySelector('.practice-modal'),oldScroller=old?.querySelector('.practice-scroll'),scroll=oldScroller&&renderedStep===P.step?oldScroller.scrollTop:0;
    const focus=old?.contains(document.activeElement)?document.activeElement.dataset.m:null;
    renderedStep=P.step;
    const html=`<div class="practice-head"><div><div class="title-eyebrow">แฟ้มฝึกของพี่วิ · ข้อมูลสมมติ</div><h2>คดีน้ำในบ่อกลางหมู่บ้าน</h2></div><button class="btn btn-sm" data-m="exit">พักไว้ก่อน</button></div><ol class="practice-progress" aria-label="ขั้นตอนคดีฝึก">${titles.map((t,i)=>`<li class="${i===P.step?'active':P.done[i]?'done':''}" ${i===P.step?'aria-current="step"':''}><span>${P.done[i]?'✓':i+1}</span>${t}</li>`).join('')}</ol><div class="practice-scroll"><div class="practice-body">${body()}</div>${P.feedback?`<div class="practice-feedback" role="status"><b>พี่วิ</b><p>${P.feedback}</p></div>`:''}</div><div class="practice-dock"><div class="m-actions">${P.step>0?'<button class="btn" data-m="back">← ทบทวนขั้นก่อน</button>':''}${P.step<5&&P.done[P.step]?'<button class="btn btn-gold" data-m="next">ขั้นต่อไป →</button>':''}${P.step===5?'<button class="btn" data-m="reset">ฝึกอีกรอบ</button><button class="btn btn-gold" data-m="exit">กลับหน้าเกม</button>':''}</div><small class="practice-foot">ฝึกได้ตามสบาย ไม่มีการจับเวลา · บันทึกแยกจากคดีจริง</small></div>`;
    // Do not recreate the modal on every choice: that replayed the entrance animation.
    if(old) old.innerHTML=html;
    else U.modal(html,act,{wide:true,locked:true,cls:'practice-modal'});
    const card=document.querySelector('.practice-modal'),scroller=card.querySelector('.practice-scroll');scroller.scrollTop=scroll;
    if(focus){const b=[...card.querySelectorAll('[data-m]')].find(b=>b.dataset.m===focus);b?.focus({preventScroll:true});}
  }
  function act(k){
    if(k==='exit'){save();U.closeModal();return;}
    if(k==='reset'){P=fresh();save();draw();return;}
    if(k==='back'){P.step=Math.max(0,P.step-1);P.feedback='';save();draw();return;}
    if(k==='next'&&P.done[P.step]){P.step++;P.feedback='';save();draw();return;}
    if(k.startsWith('talk:')&&P.step===0){if(!P.heard.includes(k.slice(5)))P.heard.push(k.slice(5));save();draw();return;}
    if(k.startsWith('card:')&&P.step===3){P.selected=k.slice(5);save();draw();document.querySelector('.practice-places').scrollIntoView({block:'nearest'});return;}
    if(k.startsWith('pin:')&&P.step===3){
      if(!P.selected)return retry('เลือกการ์ดหลักฐานก่อน แล้วค่อยเลือกสถานที่นะ');
      if(k!=='pin:well')return retry('การ์ดนี้กล่าวถึงบ่อน้ำ ยังไม่มีหลักฐานรองรับร้านอาหาร ลองอ่านการ์ดอีกครั้ง');
      P.pins[P.selected]='well';P.selected=null;OD.sfx?.('pin');
      if(Object.keys(P.pins).length===3)return complete('ครบทั้งสถิติ สิ่งแวดล้อม และแล็บ โดยหลักฐานทั้งสามเกี่ยวข้องกับบ่อเดียวกัน');
      P.feedback='ปักแล้ว เลือกหลักฐานใบต่อไปได้เลย';save();draw();return;
    }
    const good={0:'q:more',1:'q:investigate',2:'q:sample',4:'q:conclude'};
    const feedback={0:'ดีแล้ว คำบอกเล่าช่วยตั้งข้อสงสัย แต่ต้องหาข้อมูลเปรียบเทียบเพิ่ม',1:'ใช่ ตัวเลขช่วยชี้จุดที่ควรตรวจต่อ ยังต้องดูหลักฐานอื่นร่วมด้วย',2:'พร้อมส่งแล็บแล้ว ในคดีฝึกเราข้ามเวลารอให้ ส่วนคดีจริงต้องวางแผนระหว่างรอผล',4:'คุณเชื่อมหลักฐานและเลือกมาตรการตรงจุดแล้ว อย่าลืมสื่อสารสิ่งที่รู้และติดตามผลต่อ'};
    if(k===good[P.step])return complete(feedback[P.step]);
    if(k.startsWith('q:'))retry('ลองอีกครั้งนะ เลือกการกระทำที่เก็บข้อมูลน่าเชื่อถือและใช้หลักฐานให้ตรงกับแหล่งที่สงสัย');
  }
  function open(){load();U.modalOverlay(draw);}
  return {open};
})();
