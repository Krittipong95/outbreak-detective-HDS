/* Bundled English catalogue: synchronous rendering, no online translation. */
window.OD=window.OD||{};
OD.i18n=(function(){
  const KEY='od3-language',thai=/[ก-ฺเ-๙]/;
  const query=new URLSearchParams(location.search).get('lang');
  let lang=query==='en'||query==='th'?query:(localStorage.getItem(KEY)||'th');
  const exact={
    'แฟ้มคดีบ้านสุขใจ':'Ban Sukjai Case File','นักสืบโรคระบาด ๒':'Outbreak Detective II','นักสืบโรคระบาด':'Outbreak Detective','ปริศนาแห่งบ้านสุขใจ':'The Ban Sukjai Mystery',
    'ตามหาต้นตอโรคระบาดในหมู่บ้านริมคลอง ผ่านฐานข้อมูล หลักฐาน และหยุดโรคให้ทันเวลา':'Trace an outbreak in a canal-side village through data and evidence—and stop it in time.',
    'ตามหาต้นตอโรคระบาดในหมู่บ้านริมคลอง':'Trace the outbreak source in a canal-side village','ฟังชาวบ้าน เชื่อมหลักฐาน และหยุดโรคให้ทันเวลา':'Listen to residents, connect the evidence, and stop the outbreak in time.',
    'หนึ่งหมู่บ้าน · หกปริศนา':'One village · Six mysteries','เล่นครั้งแรก?':'First time here?','คดีฝึก 5–10 นาที · มีตัวช่วย · ไม่กระทบคดีที่บันทึก':'A 5–10 minute guided case · Hints included · Your saved case is safe','คดีฝึก 5–10 นาที · พี่วิพาเล่น':'A 5–10 minute guided case with Vi',
    'ลองคดีฝึก':'Play tutorial','เปิดแฟ้มคดีใหม่':'Open a new case','ประมาณ 30–45 นาที':'About 30–45 minutes','ชื่อของคุณ':'Your name','เช่น ต้นกล้า':'e.g. Alex',
    'เลือกตัวละคร':'Choose your character','ชาย':'Male','หญิง':'Female','ใช้คำลงท้าย “ครับ”':'Uses masculine Thai speech','ใช้คำลงท้าย “ค่ะ”':'Uses feminine Thai speech',
    'ระดับความยาก':'Difficulty','เริ่มต้น':'Beginner','มีคำใบ้ละเอียด':'Detailed hints','มาตรฐาน':'Standard','มีคำใบ้':'Some hints','ท้าทาย':'Expert','ไม่มีคำใบ้':'No hints',
    'เริ่มเรื่อง →':'Start story →','ลงพื้นที่ทันที':'Jump to fieldwork','วิธีเล่น':'How to play','คดีประจำวัน':'Daily case','สถิติและเหรียญ':'Stats & medals','คู่มือนักสืบ':'Detective handbook',
    '① สัมภาษณ์　② ตรวจหลักฐาน　③ สรุปคดี':'① Interview　② Examine evidence　③ Solve the case','① สัมภาษณ์':'① Interview','② ตรวจหลักฐาน':'② Examine evidence','③ สรุปคดี':'③ Solve the case','ธีม':'Theme','สลับธีม':'Switch theme','สว่าง':'Light','มืด':'Dark',
    'งบ ฿60,000 · คำใบ้ละเอียด · ความไวแล็บพื้นฐาน ~๙๒%':'Budget ฿60,000 · Detailed hints · Base lab sensitivity ~92%','งบ ฿45,000 · มีคำใบ้ · ความไวแล็บพื้นฐาน ~๘๒%':'Budget ฿45,000 · Some hints · Base lab sensitivity ~82%','งบ ฿32,000 · ไม่มีคำใบ้ · ความไวแล็บพื้นฐาน ~๗๐% · ชาวบ้านจำคลาดเคลื่อนมากขึ้น':'Budget ฿32,000 · No hints · Base lab sensitivity ~70% · More recall error',
    'บันทึกอัตโนมัติในเบราว์เซอร์นี้ · ตัวละคร สถานที่ และข้อมูลเป็นเรื่องสมมติ':'Autosaved in this browser · Characters, places, and data are fictional',
    'คลิกที่กล่องข้อความ หรือกด Space / Enter เพื่ออ่านต่อ':'Click the dialogue box or press Space / Enter to continue','อัตโนมัติ':'Auto','เร่ง':'Fast-forward',
    'บทนำ':'Prologue','บทที่ ๑':'Chapter 1','บทที่ ๒':'Chapter 2','บทที่ ๓':'Chapter 3','บทส่งท้าย':'Epilogue','ฉากจบ':'Ending','ฉากจบพิเศษ':'Special ending',
    'เสียงโทรศัพท์ยามดึก':'A Late-Night Call','ระบาดจริง หรือแค่ฤดูกาล?':'An Outbreak—or Just the Season?','ข้อมูลไม่เคยสะอาด':'Data Is Never Clean','ลงพื้นที่บ้านสุขใจ':'Fieldwork in Ban Sukjai',
    'อังคาร ๒๔ พฤศจิกายน ๒๕๖๙ · ๒๑:๑๐ น.':'Tuesday, 24 November 2026 · 9:10 p.m.','การเฝ้าระวังทางระบาดวิทยา · รายงาน ๕๐๖':'Epidemiological surveillance · Report 506','รวมรายชื่อผู้ป่วยจาก ๓ หน่วยบริการ · ๐๑:๓๐ น.':'Merging patient lists from three health facilities · 1:30 a.m.','พุธ ๒๕ พฤศจิกายน ๒๕๖๙ · ๐๘:๐๐ น.':'Wednesday, 25 November 2026 · 8:00 a.m.','พุธ ๒๕ พฤศจิกายน ๒๕๖๘ · ๐๘:๐๐ น.':'Wednesday, 25 November 2025 · 8:00 a.m.',
    'เช้าวันพุธ หมอกยังลอยเรี่ยผิวน้ำในคลองสุขใจ…':'Wednesday morning. Mist still drifts over the surface of the Ban Sukjai canal…','คลิกเพื่อดำเนินเรื่องต่อ':'Click to continue',
    'ยังไม่มีหลักฐาน':'No evidence yet','เลือกอุปกรณ์':'Choose equipment','พร้อมลุย':'Ready','เปิดคู่มือ':'Open handbook','ปิด':'Close','ย้อนกลับ':'Back','ถัดไป':'Next',
    'ผลการสอบสวนโรค':'Investigation results','ไขคดีสำเร็จ':'Case solved','คดียังไม่คลี่คลาย':'Case unresolved','ฉากจบที่ได้รับ':'Ending unlocked','เกรด':'Grade','จาก 1,000 คะแนน':'out of 1,000 points',
    'เฉลยคดี':'Case solution','แหล่งโรค:':'Source:','เชื้อ:':'Pathogen:','รูปแบบ:':'Pattern:','คุณตอบถูก':'Correct','ถูก':'Correct','ผิด':'Incorrect','ลองพัฒนาต่อ':'Focus next on',
    'เรื่องราวหลังจากนั้น':'What happened next','ผลจากการตัดสินใจของคุณระหว่างการสอบสวน':'Consequences of your decisions','สรุปว่าคุณพลาดอะไรบ้าง':'What could be improved','ไม่พลาดเลย!':'Perfect investigation!',
    'คดีใหม่':'New case','เริ่มคดีใหม่?':'Start a new case?','เริ่มคดีใหม่':'Start new case','กลับ':'Return',
    'คดีใหม่จะบันทึกแทนแฟ้มเดิม ถ้ายังอยากสืบคดีเดิม ให้เลือกเล่นต่อจากหน้าแรก':'Starting a new case will overwrite your current case. To keep investigating it, choose Continue from the home screen.',
    'ดาวน์โหลดข้อมูลไปวิเคราะห์ต่อ':'Download case data','กลับหน้าแรก':'Home','กำลังเปิดตัวประมวลผล SQL…':'Opening the SQL engine…','ข้อมูลพร้อมแล้ว':'Data ready',
    'ไม่มีแถวที่ตรงเงื่อนไข':'No rows match this query','กำลังประมวลผล…':'Processing…','รายงานสอบสวนโรค':'Outbreak investigation report','ส่งรายงาน':'Submit report','กระดานสืบสวน':'Investigation board',
    'เป้าหมายถัดไป':'Next objective','ทำตอนนี้':'Do it now','เดินสำรวจ':'Explore village','สัมภาษณ์':'Interview','ตรวจสถานที่':'Inspect site','วิเคราะห์':'Analyze','ผลแล็บ':'Lab results','หลักฐาน':'Evidence',
    'ดาวเหนือแห่งบ้านสุขใจ':'North Star of Ban Sukjai','ตำบลต้นแบบ':'A Model Community','ชนะคดี แพ้ใจคน':'Case Won, Trust Lost','ฟ้าหลังฝน':'Clear Skies After the Storm','บทเรียนจากสนาม':'Lessons from the Field','เข็มนาฬิกาหยุดลง':'When the Clock Ran Out','คำตอบที่เฉียดไป':'So Close to the Answer','คืนที่ยาวนาน':'The Long Night',
    'วิเคราะห์อัตราส่วนออดส์ (OR)':'Odds Ratio (OR) analysis','อัตราส่วนออดส์ (OR)':'Odds Ratio (OR)','อัตราส่วนออดส์ (Odds Ratio; OR)':'Odds Ratio (OR)','ช่วงความเชื่อมั่น 95% (95% CI)':'95% Confidence Interval (95% CI)','อ่านค่า OR':'Interpret the Odds Ratio (OR)'
  };
  // Authored terminology wins over the prebuilt catalogue.
  const authored=Object.assign({},exact,window.OD_FIELD_EN||{});
  Object.assign(exact,window.OD_EN_CATALOGUE||{},authored);
  Object.assign(exact,window.OD_FIELD_EN||{});
  const skip=el=>!el||/^(SCRIPT|STYLE|CODE|PRE|TEXTAREA)$/i.test(el.nodeName)||el.closest?.('[data-no-translate],.notranslate');
  const digits=v=>v.replace(/[๐-๙]/g,c=>String(c.charCodeAt(0)-3664));
  const phrases=Object.keys(exact).filter(k=>k.length>1&&!/ZXQ\d+XZ/.test(k)).sort((a,b)=>b.length-a.length).map(k=>[digits(k),exact[k]]);
  const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const templates=Object.keys(exact).filter(k=>/ZXQ\d+XZ/.test(k)).sort((a,b)=>b.length-a.length).map(k=>{
    const ids=[...k.matchAll(/ZXQ(\d+)XZ/g)].map(m=>m[1]);
    return {source:k,re:new RegExp('^'+digits(k).split(/ZXQ\d+XZ/).map(escapeRE).join('([\\s\\S]*?)')+'$'),ids,out:exact[k]};
  });
  const missing=new Set();
  const localized=s=>!thai.test(OD.S?.name?s.split(OD.S.name).join(''):s);
  function manual(s){
    const t=s.trim();if(Object.prototype.hasOwnProperty.call(exact,t))return s.replace(t,exact[t]);
    for(const p of templates){const m=digits(t).match(p.re);if(m){let out=p.out;p.ids.forEach((id,i)=>{out=out.split('ZXQ'+id+'XZ').join(local(m[i+1],1));});if(localized(out))return s.replace(t,out);}}
    /* แทนได้หลายวลี แต่ห้ามยอมรับผลครึ่งไทยครึ่งอังกฤษ */
    let out=digits(s),changed=out!==s;for(const [key,value] of phrases)if(out.includes(key)){out=out.split(key).join(value);changed=true;}
    return changed&&localized(out)?out:null;
  }
  function local(value){
    const s=String(value??'');if(lang!=='en'||!thai.test(s)||s===OD.S?.name)return s;
    if(/<\/?[a-z][^>]*>/i.test(s)){
      const template=document.createElement('template');template.innerHTML=s;const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){const out=local(node.nodeValue);if(out!==node.nodeValue)node.nodeValue=out;}return template.innerHTML;
    }
    const result=manual(s);if(result!=null)return result.replace(/\{p\}/g,'').replace(/Ban Suk Jai/gi,'Ban Sukjai').replace(/Plague Detective/gi,'Outbreak Detective').replace(/\bOdds\b(?!\s+(?:Ratio|of))/gi,'Odds Ratio (OR)');
    if(s!==OD.S?.name)missing.add(s);return s;
  }
  /* ข้อความสำคัญ เช่นบทสนทนา ขอคำแปลโดยตรงก่อนวาด ไม่รอ MutationObserver */
  function text(value){
    return Promise.resolve(local(value));
  }
  const originals=new WeakMap(),attributeOriginals=new WeakMap();
  function restore(root){
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=w.nextNode()){const old=originals.get(node);if(old&&node.nodeValue===old.en)node.nodeValue=old.th;}
    for(const el of root.querySelectorAll('[title],[placeholder],[aria-label]')){const attrs=attributeOriginals.get(el);if(attrs)for(const [key,old] of Object.entries(attrs))if(el.getAttribute(key)===old.en)el.setAttribute(key,old.th);}
  }
  function translateNode(n){
    if(lang!=='en'||n.nodeType!==3||skip(n.parentElement))return;const s=n.nodeValue;if(!s||!thai.test(s))return;
    const out=local(s);if(out!==s){originals.set(n,{th:s,en:out});n.nodeValue=out;}
  }
  function scan(root=document.body){
    if(lang!=='en'||!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))translateNode(n);
    const els=[...(root.matches?.('[title],[placeholder],[aria-label]')?[root]:[]),...(root.querySelectorAll?.('[title],[placeholder],[aria-label]')||[])];for(const el of els)for(const a of ['title','placeholder','aria-label']){const s=el.getAttribute(a);if(s&&thai.test(s)){const out=local(s);const attrs=attributeOriginals.get(el)||{};attrs[a]={th:s,en:out};attributeOriginals.set(el,attrs);el.setAttribute(a,out);}}
  }
  let badge;
  function paintStatus(){if(badge){badge.textContent='';badge.classList.remove('busy');}}
  function setLanguage(v){
    localStorage.setItem(KEY,v);const u=new URL(location.href);if(v==='en')u.searchParams.set('lang','en');else u.searchParams.delete('lang');
    if(document.body.classList.contains('on-title')){lang=v;if(v==='th')restore(document.body);document.documentElement.lang=v;document.documentElement.dataset.lang=v;history.replaceState(null,'',u.href);OD.main.title();scan(document.body);document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('on',b.dataset.lang===v));return;}
    location.href=u.href;
  }
  function init(){
    document.documentElement.lang=lang==='en'?'en':'th';document.documentElement.dataset.lang=lang;
    const ctl=document.createElement('div');ctl.className='lang-switch notranslate';ctl.setAttribute('data-no-translate','');ctl.innerHTML=`<button class="${lang==='th'?'on':''}" data-lang="th">ไทย</button><button class="${lang==='en'?'on':''}" data-lang="en">English</button><span class="lang-state"></span>`;document.body.append(ctl);badge=ctl.querySelector('.lang-state');ctl.onclick=e=>{const b=e.target.closest('[data-lang]');if(b&&b.dataset.lang!==lang)setLanguage(b.dataset.lang);};
    scan();new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===3)translateNode(n);else if(n.nodeType===1)scan(n);}))).observe(document.body,{childList:true,subtree:true});
    paintStatus();
  }
  document.addEventListener('DOMContentLoaded',init);
  return {lang:()=>lang,setLanguage,scan,text,t:local,missing:()=>[...missing]};
})();
