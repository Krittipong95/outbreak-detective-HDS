/* English mode: manual UI glossary + cached on-demand translation for dynamic story text. */
window.OD=window.OD||{};
OD.i18n=(function(){
  const KEY='od3-language',CACHE='od3-en-cache-v1',thai=/[ก-๙]/;
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
    'ยังไม่มีหลักฐาน':'No evidence yet','เลือกอุปกรณ์':'Choose equipment','พร้อมลุย':'Ready','เปิดคู่มือ':'Open handbook','ปิด':'Close','ย้อนกลับ':'Back','ถัดไป':'Next',
    'ผลการสอบสวนโรค':'Investigation results','ไขคดีสำเร็จ':'Case solved','คดียังไม่คลี่คลาย':'Case unresolved','ฉากจบที่ได้รับ':'Ending unlocked','เกรด':'Grade','จาก 1,000 คะแนน':'out of 1,000 points',
    'เฉลยคดี':'Case solution','แหล่งโรค:':'Source:','เชื้อ:':'Pathogen:','รูปแบบ:':'Pattern:','คุณตอบถูก':'Correct','ถูก':'Correct','ผิด':'Incorrect','ลองพัฒนาต่อ':'Focus next on',
    'เรื่องราวหลังจากนั้น':'What happened next','ผลจากการตัดสินใจของคุณระหว่างการสอบสวน':'Consequences of your decisions','สรุปว่าคุณพลาดอะไรบ้าง':'What could be improved','ไม่พลาดเลย!':'Perfect investigation!',
    'คดีใหม่':'New case','ดาวน์โหลดข้อมูลไปวิเคราะห์ต่อ':'Download case data','กลับหน้าแรก':'Home','กำลังเปิดตัวประมวลผล SQL…':'Opening the SQL engine…','ข้อมูลพร้อมแล้ว':'Data ready',
    'ไม่มีแถวที่ตรงเงื่อนไข':'No rows match this query','กำลังประมวลผล…':'Processing…','รายงานสอบสวนโรค':'Outbreak investigation report','ส่งรายงาน':'Submit report','กระดานสืบสวน':'Investigation board',
    'เป้าหมายถัดไป':'Next objective','ทำตอนนี้':'Do it now','เดินสำรวจ':'Explore village','สัมภาษณ์':'Interview','ตรวจสถานที่':'Inspect site','วิเคราะห์':'Analyze','ผลแล็บ':'Lab results','หลักฐาน':'Evidence',
    'ดาวเหนือแห่งบ้านสุขใจ':'North Star of Ban Sukjai','ตำบลต้นแบบ':'A Model Community','ชนะคดี แพ้ใจคน':'Case Won, Trust Lost','ฟ้าหลังฝน':'Clear Skies After the Storm','บทเรียนจากสนาม':'Lessons from the Field','เข็มนาฬิกาหยุดลง':'When the Clock Ran Out','คำตอบที่เฉียดไป':'So Close to the Answer','คืนที่ยาวนาน':'The Long Night'
  };
  let cache={};try{cache=JSON.parse(localStorage.getItem(CACHE)||'{}')||{};}catch(e){}
  const skip=el=>!el||/^(SCRIPT|STYLE|CODE|PRE|TEXTAREA|OPTION)$/i.test(el.nodeName)||el.closest?.('[data-no-translate],.notranslate');
  function save(){try{localStorage.setItem(CACHE,JSON.stringify(cache));}catch(e){}}
  function manual(s){const t=s.trim();if(exact[t])return s.replace(t,exact[t]);for(const k of Object.keys(exact).sort((a,b)=>b.length-a.length))if(t.includes(k))return s.replace(k,exact[k]);return null;}
  const jobs=[],active={n:0};
  function chunks(s){const out=[];while(s.length>450){let i=Math.max(s.lastIndexOf(' ',450),s.lastIndexOf('。',450),s.lastIndexOf('!',450),s.lastIndexOf('?',450));if(i<180)i=450;out.push(s.slice(0,i+1));s=s.slice(i+1);}if(s)out.push(s);return out;}
  function one(q){
    if(window.__OD_I18N_OFFLINE__)return Promise.reject(Error('offline test'));
    const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair=th|en';
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),5000);
    return fetch(url,{signal:ctl.signal}).then(r=>{if(!r.ok)throw Error('translation unavailable');return r.json();}).then(x=>{const out=x?.responseData?.translatedText;if(!out)throw Error('translation empty');return out;}).finally(()=>clearTimeout(timer));
  }
  function remote(text){
    if(cache[text])return Promise.resolve(cache[text]);
    const name=OD.S?.name,token='__PLAYER_NAME__';let q=name&&text.includes(name)?text.split(name).join(token):text;
    return Promise.all(chunks(q).map(one)).then(parts=>{
      let out=parts.join('');if(!out||thai.test(out))throw Error('translation incomplete');
      if(name)out=out.split(token).join(name);cache[text]=out;save();return out;
    });
  }
  function pump(){while(active.n<3&&jobs.length){const j=jobs.shift();active.n++;remote(j.text).then(j.ok).catch(()=>j.fail()).finally(()=>{active.n--;paintStatus();pump();});}paintStatus();}
  function enqueue(text,ok,fail=()=>{}){jobs.push({text,ok,fail});pump();}
  function translateNode(n){
    if(lang!=='en'||n.nodeType!==3||skip(n.parentElement))return;const s=n.nodeValue;if(!s||!thai.test(s))return;
    const m=manual(s);if(m!=null){n.nodeValue=m;return;}const original=s;enqueue(s,out=>{if(n.isConnected&&n.nodeValue===original)n.nodeValue=out;});
  }
  function scan(root=document.body){
    if(lang!=='en'||!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))translateNode(n);
    const els=root.querySelectorAll?.('[title],[placeholder],[aria-label]')||[];for(const el of els)for(const a of ['title','placeholder','aria-label']){const s=el.getAttribute(a);if(!s||!thai.test(s))continue;const m=manual(s);if(m!=null)el.setAttribute(a,m);else enqueue(s,out=>el.isConnected&&el.setAttribute(a,out));}
  }
  let badge;
  function paintStatus(){if(!badge)return;const pending=jobs.length+active.n;badge.textContent=pending?'Translating '+pending+'…':'English';badge.classList.toggle('busy',!!pending);}
  function setLanguage(v){localStorage.setItem(KEY,v);const u=new URL(location.href);if(v==='en')u.searchParams.set('lang','en');else u.searchParams.delete('lang');location.href=u.href;}
  function init(){
    document.documentElement.lang=lang==='en'?'en':'th';document.documentElement.dataset.lang=lang;
    const ctl=document.createElement('div');ctl.className='lang-switch notranslate';ctl.setAttribute('data-no-translate','');ctl.innerHTML=`<button class="${lang==='th'?'on':''}" data-lang="th">ไทย</button><button class="${lang==='en'?'on':''}" data-lang="en">English</button><span class="lang-state"></span>`;document.body.append(ctl);badge=ctl.querySelector('.lang-state');ctl.onclick=e=>{const b=e.target.closest('[data-lang]');if(b&&b.dataset.lang!==lang)setLanguage(b.dataset.lang);};
    if(lang==='en'){scan();new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===3)translateNode(n);else if(n.nodeType===1)scan(n);}))).observe(document.body,{childList:true,subtree:true});}
    paintStatus();
  }
  document.addEventListener('DOMContentLoaded',init);
  return {lang:()=>lang,setLanguage,scan};
})();
