/* =========================================================
   ตัวละคร — ภาพครึ่งตัวเวกเตอร์สไตล์ไทยแบบน่ารัก (viewBox 400x520)
   หัวโตขึ้น คอสั้น ตาโต หน้ากลม — ศีรษะทั้งหมดอยู่ในกลุ่มเดียวที่ขยายจากจุดคาง
   ถ้าตั้ง OD.config.customPortraits = true จะใช้รูปใน img/ แทน (ดู vn.js)
   expr: neutral | smile | worried | serious | surprised
   ========================================================= */
window.OD = window.OD || {};
OD.art = OD.art || {};

OD.CHARS = {
  doctor: {name:'พี่วิ', full:'พี่วิ', title:'นักระบาดวิทยา · หัวหน้าทีม HDS', color:'#4e9a82',
           skin:'#dcab82', hair:'#15100c', face:'hunk', fem:false, hs:true, hairS:'idol', outfit:'epi', acc:['browline']},
  boonma: {name:'ป้าบุญมา', full:'นางบุญมา ใจดี', title:'อสม. หมู่ ๒ บ้านวัด', color:'#5a8fd0',
           skin:'#c99064', hair:'#8f8984', face:'elderF', fem:true, lip:'#a8605a', hairS:'bun', outfit:'lace', acc:['earring','necklace','wrinkle']},
  kamnan: {name:'กำนันเสถียร', full:'นายเสถียร ทองคำ', title:'กำนันตำบลบ้านสุขใจ', color:'#b0904f',
           skin:'#b97c52', hair:'#2a2623', face:'elderM', fem:false, hairS:'short', outfit:'khaki', acc:['mustache','wrinkle']},
  fah:    {name:'ฟ้า', full:'น.ส.ฟ้าใส รุ่งเรือง', title:'นักเทคนิคการแพทย์', color:'#3fa7a3',
           skin:'#efc8a4', hair:'#110b08', face:'young', fem:true, lip:'#d27274', hairS:'long', outfit:'lab', acc:['mask','pin']},
  monk:   {name:'หลวงพ่อทองดี', full:'หลวงพ่อทองดี', title:'เจ้าอาวาสวัดบ้านสุขใจ', color:'#c9781f',
           skin:'#c88d5e', hair:null, face:'monk', fem:false, hairS:'shaved', outfit:'robe', acc:['wrinkle']},
  /* ตัวละครของผู้เล่น — เลือกชาย/หญิงที่หน้าแรก (id 'me' จะเลือกตามเพศที่ผู้เล่นเลือก) */
  me_m:   {name:'คุณ', title:'นักวิทยาศาสตร์ข้อมูลสุขภาพ · ทีม HDS', color:'#2f7f6c',
           skin:'#ebbd96', hair:'#2a1d17', face:'hunk', fem:false, hs:true, glam:true, hairS:'swoop', outfit:'hdsj', acc:[]},
  me_f:   {name:'คุณ', title:'นักวิทยาศาสตร์ข้อมูลสุขภาพ · ทีม HDS', color:'#2f7f6c',
           skin:'#f3cfac', hair:'#3a2219', face:'vF', fem:true, glam:true, lip:'#dc6478', hairS:'wave', outfit:'hdsj', acc:['stud']},
  /* ชาวบ้าน — ชื่อและตำแหน่งกำหนดตามเหตุการณ์ */
  vendorF:{name:'ป้าแดง', title:'เจ้าของร้านส้มตำ', color:'#c0392b',
           skin:'#c98d5f', hair:'#231a14', face:'elderF', fem:true, lip:'#a85f55', hairS:'wrap', outfit:'apron', acc:['earring']},
  vendorM:{name:'ลุงชัย', title:'เจ้าของก๋วยเตี๋ยวเรือ', color:'#7a5a2a',
           skin:'#b67a4e', hair:'#2a2420', face:'elderM', fem:false, hairS:'short', outfit:'pakama', acc:['wrinkle']},
  director:{name:'ผอ.สมศรี', title:'ผู้อำนวยการโรงเรียนบ้านสุขใจ', color:'#2b3a5c',
           skin:'#e0b088', hair:'#1c1410', face:'elderF', fem:true, lip:'#b8606a', hairS:'bob', outfit:'blazer', acc:['glasses']},
  /* ผู้ป่วย/ญาติในการสัมภาษณ์เชิงลึก — ชื่อกำหนดตอนสัมภาษณ์ */
  patientF:{name:'ป้าสมใจ', title:'ผู้ป่วย', color:'#c76b8a',
           skin:'#d9a37a', hair:'#3a2a20', face:'young', fem:true, lip:'#b46a66', hairS:'bob', outfit:'tee', shirt:'#c76b8a', acc:['earring']},
  patientM:{name:'ลุงสมชาย', title:'ผู้ป่วย', color:'#4f7fa8',
           skin:'#c08455', hair:'#24201c', face:'man', fem:false, hairS:'short', outfit:'tee', shirt:'#4f7fa8', acc:[]},
};

(function(A){
  let uid = 0;
  function shade(hex, amt){
    const n = parseInt(hex.slice(1),16); const ch = [n>>16, (n>>8)&255, n&255];
    const f = amt<0 ? x=>Math.round(x*(1+amt)) : x=>Math.round(x+(255-x)*amt);
    return '#'+ch.map(v=>f(v).toString(16).padStart(2,'0')).join('');
  }
  A.shade = shade;

  /* หน้ากลม คางมน (แบบน่ารัก) */
  const FACE = {
    man:    'M200 94 C258 94 284 138 282 200 C281 250 262 286 230 303 C216 311 184 311 170 303 C138 286 119 250 118 200 C116 138 142 94 200 94 Z',
    young:  'M200 96 C254 96 281 138 279 200 C278 250 260 286 228 304 C215 311 207 313 200 313 C193 313 185 311 172 304 C140 286 122 250 121 200 C119 138 146 96 200 96 Z',
    elderF: 'M200 95 C256 95 283 139 281 201 C280 251 261 287 229 304 C215 311 185 311 171 304 C139 287 120 251 119 201 C117 139 144 95 200 95 Z',
    hunk:   'M200 94 C258 94 284 138 282 198 C281 244 264 280 236 299 C222 309 210 313 200 313 C190 313 178 309 164 299 C136 280 119 244 118 198 C116 138 142 94 200 94 Z',
    elderM: 'M200 93 C259 93 286 137 284 201 C283 252 264 288 232 305 C218 312 182 312 168 305 C136 288 117 252 116 201 C114 137 141 93 200 93 Z',
    monk:   'M200 86 C259 86 286 133 284 201 C283 251 264 287 231 304 C217 311 183 311 169 304 C136 287 117 251 116 201 C114 133 141 86 200 86 Z',
    vF:     'M200 97 C254 97 281 138 279 198 C278 240 263 274 238 296 C224 307 211 313 200 313 C189 313 176 307 162 296 C137 274 122 240 121 198 C119 138 146 97 200 97 Z',  // หน้าเรียวรูปไข่ (ผู้เล่นหญิง)
  };
  /* ลำตัวกลมแบบตุ๊กตา — หัวโตวางทับไหล่พอดี ไม่เห็นคอ */
  const BODY_M = 'M58 520 C56 424 108 354 200 352 C292 354 344 424 342 520 Z';
  const BODY_F = 'M70 520 C68 430 114 358 200 356 C286 358 332 430 330 520 Z';
  const EY = 214;            // ระดับดวงตา (ต่ำลงเล็กน้อยให้หน้าดูเด็ก)
  const HEAD = 'translate(200 384) scale(1.3) translate(-200 -313)';   // ขยายศีรษะจากจุดคาง และวางคางลงบนลำตัว

  /* ---------- ดวงตาโต มีประกาย ---------- */
  /* glam = ดวงตาแบบละเอียดของตัวละครผู้เล่น: ตาโตขึ้นเล็กน้อย ชั้นตาสองชั้น ขอบม่านตา ประกายเพิ่ม (ผู้หญิงมีถุงใต้ตาแบบ aegyo-sal) */
  function eye(k, n, cx, cy, side, fem, expr, skDD, hs, glam){
    const w = (fem ? 23 : hs ? 22.5 : 21.5) + (glam ? 1 : 0);
    const h = (expr==='surprised' ? 14 : expr==='smile' ? 6.5 : hs ? 10 : 11.5) + (glam && expr!=='smile' ? (fem ? 2 : 1.2) : 0), lift = fem ? 3.5 : hs ? 4 : 1.5;
    const xi = cx - side*w*.9, yi = cy + 2, xo = cx + side*w, yo = cy - lift;
    const up = `Q${cx+side*3} ${cy-h-6} ${xo} ${yo}`;
    const lo = expr==='smile' ? `Q${cx} ${cy+h*.1} ${xi} ${yi}` : `Q${cx-side*2} ${cy+h*.95} ${xi} ${yi}`;
    const shape = `M${xi} ${yi} ${up} ${lo} Z`, ir = (fem ? 12.5 : 11.5) + (glam ? 1 : 0);
    let s = `<clipPath id="${k}e${n}"><path d="${shape}"/></clipPath><path d="${shape}" fill="#fbf6ef"/>`;
    s += `<g clip-path="url(#${k}e${n})"><circle cx="${cx+side*.5}" cy="${cy+1}" r="${ir}" fill="url(#${k}${glam?'irisG':'iris'})"/>`;
    if(glam) s += `<circle cx="${cx+side*.5}" cy="${cy+1}" r="${ir-.8}" fill="none" stroke="#1a0b05" stroke-width="1.6" opacity=".75"/>`;   // ขอบม่านตา
    s += `<circle cx="${cx+side*.5}" cy="${cy+1}" r="5.2" fill="#0b0604"/>`;
    s += `<circle cx="${cx+4.5}" cy="${cy-3.8}" r="3.9" fill="#fff"/><circle cx="${cx-3.8}" cy="${cy+4.6}" r="1.8" fill="#fff" opacity=".85"/><circle cx="${cx+7}" cy="${cy+2.5}" r="1.1" fill="#fff" opacity=".8"/>`;
    if(glam) s += `<path d="M${cx-side*6} ${cy+8} Q${cx+side*.5} ${cy+11} ${cx+side*7} ${cy+7}" stroke="#ffd9a8" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/><circle cx="${cx-side*1}" cy="${cy-6.5}" r="1.3" fill="#fff"/>`;
    s += `<path d="M${cx-32} ${cy-h-9} H${cx+32} V${cy-h*.2} Q${cx} ${cy-h-5} ${cx-32} ${cy-h*.2} Z" fill="#3a2010" opacity=".14"/></g>`;
    s += `<path d="M${xi} ${yi} ${up}" fill="none" stroke="#160c07" stroke-width="${fem||hs?3.8:3.2}" stroke-linecap="round"/>`;
    if(glam && expr!=='smile') s += `<path d="M${xi+side*3} ${yi-7} Q${cx+side*3} ${cy-h-12.5} ${xo-side*2} ${yo-5.5}" fill="none" stroke="#5a3324" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>`;   // ชั้นตาสองชั้น
    if(glam && fem) s += `<path d="M${xi+side*1} ${yi+5} Q${cx} ${cy+h+(expr==='smile'?9:7)} ${xo-side*4} ${yo+8}" stroke="#fff" stroke-width="3" fill="none" opacity=".22" stroke-linecap="round"/>`;
    if(hs) s += `<path d="M${xo} ${yo} q${side*5} ${-1} ${side*7.5} ${-4.5}" fill="none" stroke="#160c07" stroke-width="2.4" stroke-linecap="round"/>`;
    if(fem){
      s += `<path d="M${xo} ${yo} q${side*7} ${-1.5} ${side*10.5} ${-7.5}" fill="none" stroke="#160c07" stroke-width="2.4" stroke-linecap="round"/>`;
      for(const t of [.55,.72,.88]){ const x = xi+(xo-xi)*t, y = yi+(yo-yi)*t-(h+4)*Math.sin(Math.PI*t)*.95; s += `<path d="M${x} ${y} l${side*2.6} ${-4.2}" stroke="#160c07" stroke-width="1.4" stroke-linecap="round"/>`; }
    }
    if(expr!=='smile' && !glam) s += `<path d="M${xi+side*2} ${yi-9} Q${cx+side*3} ${cy-h-14} ${xo-side*1.5} ${yo-7}" fill="none" stroke="${skDD}" stroke-width="${hs?1.6:1.3}" opacity="${hs?.55:.35}"/>`;
    s += `<path d="M${xi-side*3} ${yi+1} Q${cx} ${cy+h+(expr==='smile'?8:4.5)} ${xo-side*3} ${yo+5}" fill="none" stroke="${skDD}" stroke-width="1.1" opacity="${expr==='smile'?.4:.2}"/>`;
    return s;
  }
  function brow(cx, cy, side, expr, col, fem, mono, hs){
    let inY=0, outY=0, lift=0;
    if(expr==='worried'){inY=-7; outY=3;}
    if(expr==='serious'){inY=5; outY=-2;}
    if(expr==='surprised') lift=-8;
    if(expr==='smile') lift=-2;
    const xin = cx - side*18, xout = cx + side*24;
    const w = mono ? 3 : fem ? 3.6 : hs ? 6.4 : 5.2, op = mono ? .28 : 1;
    return `<path d="M${xin} ${cy+inY+lift} Q${cx+side*5} ${cy-(fem?10:hs?6:7)+lift+(inY+outY)/2} ${xout} ${cy+outY+lift+(fem?4:2)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
  }
  function lips(expr, col, fem, hs){
    const lo = shade(col,.16), ln = shade(col,-.4), sw = fem ? 1 : .8;
    if(hs && expr==='neutral') return `<path d="M188 275 Q200 280 213 272" stroke="${ln}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M190 279 Q200 284 210 279" stroke="${lo}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`;
    switch(expr){
      case 'smile': return `<path d="M178 268 Q200 292 222 268 Q211 271 200 270 Q189 271 178 268 Z" fill="#5a1d18"/><path d="M182 270 Q200 276 218 270 L216 274.5 Q200 280 184 274.5 Z" fill="#f7f1e7"/>`+
        `<path d="M176 267 Q188 262 200 266 Q212 262 224 267" stroke="${col}" stroke-width="${fem?3.4:2.4}" fill="none" stroke-linecap="round"/><path d="M188 288 Q200 293 212 288" stroke="${lo}" stroke-width="${fem?3:2}" fill="none" stroke-linecap="round" opacity=".8"/>`;
      case 'surprised': return `<ellipse cx="200" cy="279" rx="7.5" ry="9.5" fill="#4b1813"/><ellipse cx="200" cy="279" rx="8" ry="10" fill="none" stroke="${col}" stroke-width="${fem?3:2.2}"/>`;
      case 'worried': return `<path d="M186 277 Q200 270 214 277 Q200 279 186 277 Z" fill="${col}" opacity="${sw}"/><path d="M188 278 Q200 284 212 278 Q200 281 188 278 Z" fill="${lo}" opacity="${sw}"/><path d="M185 278 Q200 272 215 278" stroke="${ln}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
      case 'serious': return `<path d="M186 274 Q200 271 214 274 Q200 276 186 274 Z" fill="${col}" opacity="${sw}"/><path d="M188 275 Q200 280 212 275 Q200 278 188 275 Z" fill="${lo}" opacity="${sw}"/><path d="M185 274.5 L215 274.5" stroke="${ln}" stroke-width="1.6" stroke-linecap="round"/>`;
      default: return `<path d="M185 273 Q192 268 197 269.5 Q200 268.5 203 269.5 Q208 268 215 273 Q200 276 185 273 Z" fill="${col}" opacity="${sw}"/><path d="M186 274 Q200 285 214 274 Q200 278.5 186 274 Z" fill="${lo}" opacity="${sw}"/>`+
        `<path d="M185 273.6 Q200 277 215 273.6" stroke="${ln}" stroke-width="1.4" fill="none" stroke-linecap="round"/>${fem?`<ellipse cx="201" cy="279" rx="5" ry="1.5" fill="#fff" opacity=".3"/>`:''}`;
    }
  }

  /* ---------- ผม ---------- */
  function hairBack(c, k){
    const H = `url(#${k}hair)`;
    switch(c.hairS){
      case 'neat':  return `<path d="M112 206 C102 112 150 62 208 62 C268 64 304 112 293 208 Z" fill="${H}"/>`;
      case 'idol':  return `<path d="M114 204 C104 108 152 58 210 58 C270 60 304 108 292 204 Z" fill="${H}"/>`;
      case 'short': return `<path d="M114 210 C106 120 152 74 206 74 C262 74 298 120 290 210 Z" fill="${H}"/>`;
      case 'bun':   return `<circle cx="200" cy="80" r="37" fill="${H}"/><path d="M168 74 Q200 54 232 74 M170 90 Q200 74 230 90" stroke="#c9c4be" stroke-width="2" fill="none" opacity=".5"/><path d="M110 216 C100 120 150 78 200 78 C252 78 302 120 290 216 Z" fill="${H}"/>`;
      case 'long':  return `<path d="M106 226 C94 118 150 58 206 60 C270 62 312 118 298 236 C302 300 298 352 284 392 L116 392 C100 350 98 296 106 226 Z" fill="${H}"/>`;
      case 'pony':  return `<path d="M112 210 C102 114 152 62 208 62 C268 64 306 112 294 210 Z" fill="${H}"/>`+       // หางม้า
        `<path d="M258 82 C318 66 350 140 336 222 C328 270 310 304 300 336 C294 304 302 266 298 226 C294 172 282 124 250 102 Z" fill="${H}"/>`+
        `<path d="M300 140 C312 190 312 240 302 300" stroke="#fff" stroke-width="3" fill="none" opacity=".12" stroke-linecap="round"/>`;
      case 'bob':   return `<path d="M106 232 C96 120 150 60 206 62 C268 64 310 120 296 234 C298 264 290 286 276 298 L124 298 C110 286 104 264 106 232 Z" fill="${H}"/>`;
      case 'wrap':  return `<path d="M116 214 C108 140 150 96 204 96 C258 96 296 140 288 214 Z" fill="${H}"/><ellipse cx="204" cy="92" rx="34" ry="22" fill="${H}"/>`;
      case 'swoop': return `<path d="M112 206 C102 106 152 50 212 50 C276 52 310 106 293 206 Z" fill="${H}"/>`;
      case 'wave':  return `<path d="M104 220 C90 112 150 52 206 54 C272 56 316 112 302 224 C308 276 304 316 314 352 C320 374 310 394 296 404 C286 392 272 398 262 410 L138 410 C128 398 114 392 104 404 C90 394 80 374 86 352 C96 316 92 276 104 220 Z" fill="${H}"/>`+
        `<path d="M98 300 C94 330 100 360 92 384 M306 300 C310 330 304 360 312 384" stroke="#fff" stroke-width="3" fill="none" opacity=".1"/>`;
    }
    return '';
  }
  function hairFront(c, k, hrD){
    const H = `url(#${k}hair)`;
    switch(c.hairS){
      case 'neat': return `<path d="M115 200 C106 118 150 70 207 70 C263 70 299 114 289 200 C285 172 279 154 269 142 C247 128 221 122 198 124 C178 125 158 132 143 144 C130 158 122 176 115 200 Z" fill="${H}"/>`+
        `<path d="M168 76 Q154 104 146 140" stroke="${hrD}" stroke-width="2.6" fill="none" opacity=".7"/><path d="M182 80 Q232 82 262 112" stroke="#fff" stroke-width="5" fill="none" opacity=".1" stroke-linecap="round"/><path d="M190 90 Q236 96 258 124" stroke="#fff" stroke-width="2" fill="none" opacity=".12"/>`+
        `<path d="M118 198 q-2 22 4 36 l6 -4 q-4 -14 -2 -30 Z" fill="${H}"/><path d="M286 198 q2 22 -4 36 l-6 -4 q4 -14 2 -30 Z" fill="${H}"/>`;
      case 'idol': return `<path d="M116 192 C104 104 156 54 214 56 C272 58 306 106 290 192 C287 170 280 154 268 142 C259 152 247 158 233 160 C241 149 243 139 239 128 C223 146 197 156 169 156 C151 156 137 162 127 172 C122 178 118 185 116 192 Z" fill="${H}"/>`+   // หน้าม้าปัดข้างมีวอลลุ่ม
        `<path d="M168 66 Q214 58 256 84 M150 84 Q196 74 238 100" stroke="#fff" stroke-width="5" fill="none" opacity=".13" stroke-linecap="round"/>`+
        `<path d="M239 128 Q228 104 206 88 M233 160 Q252 140 248 112 M169 156 Q196 140 218 124 M140 166 Q156 146 182 132" stroke="${hrD}" stroke-width="2.2" fill="none" opacity=".75"/>`+
        `<path d="M268 142 Q276 120 266 98" stroke="#fff" stroke-width="2" fill="none" opacity=".16"/>`;      case 'short': return `<path d="M117 202 C108 128 150 84 206 82 C260 82 296 126 287 202 C284 180 279 164 270 154 C262 140 252 132 238 128 C222 124 206 128 196 134 C186 128 170 126 156 132 C142 140 132 152 126 168 C122 178 119 188 117 202 Z" fill="${H}"/>`+
        `<path d="M196 134 Q180 104 166 88" stroke="${hrD}" stroke-width="2.4" fill="none" opacity=".7"/>`+
        Array.from({length:7},(_,i)=>`<path d="M${150+i*16} ${120-Math.abs(3-i)*3} q6 -14 16 -20" stroke="#fff" stroke-width="1.6" fill="none" opacity=".12"/>`).join('')+
        `<path d="M122 188 q-4 18 0 34 M282 188 q4 18 0 34" stroke="#a39d97" stroke-width="5" fill="none" opacity=".75" stroke-linecap="round"/><path d="M128 164 q-4 10 -5 22 M272 164 q4 10 5 22" stroke="#a39d97" stroke-width="3" fill="none" opacity=".55"/><path d="M200 92 Q238 94 262 120" stroke="#fff" stroke-width="4" fill="none" opacity=".1" stroke-linecap="round"/>`;
      case 'bun': return `<path d="M118 202 C114 124 154 86 200 86 C246 86 288 124 282 202 C276 168 262 140 230 128 Q214 121 200 124 Q186 121 170 128 C138 140 124 168 118 202 Z" fill="${H}"/>`+
        `<path d="M200 88 L200 123" stroke="${hrD}" stroke-width="2" opacity=".55"/><path d="M152 112 Q172 98 192 96 M208 96 Q230 98 250 112 M140 140 Q160 118 186 108 M214 108 Q240 118 260 140" stroke="#d8d3cd" stroke-width="2.2" fill="none" opacity=".5"/>`+
        Array.from({length:13},(_,i)=>{ const a = Math.PI*(1.08 + i*0.068), x = 200+40*Math.cos(a), y = 82+30*Math.sin(a)*.55+14; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#fbfaf2" stroke="#d8d4c2" stroke-width=".8"/><circle cx="${x.toFixed(1)}" cy="${(y-1).toFixed(1)}" r="1.6" fill="#f2e6a6"/>`; }).join('')+
        `<path d="M234 98 q8 6 6 14" stroke="#4f7a3a" stroke-width="2.4" fill="none"/><circle cx="240" cy="113" r="4" fill="#fbfaf2"/>`;
      case 'long': return `<path d="M118 208 C110 118 160 70 212 72 C266 74 300 120 288 208 C282 172 272 150 256 138 C236 150 202 146 180 126 C168 146 144 160 130 180 C124 188 121 196 118 208 Z" fill="${H}"/>`+
        `<path d="M121 180 C108 238 110 302 121 350 C129 388 135 410 146 430 C151 404 147 368 141 328 C135 284 131 238 132 202 Z" fill="${H}"/>`+
        `<path d="M186 82 Q238 84 266 120" stroke="#fff" stroke-width="5" fill="none" opacity=".11" stroke-linecap="round"/><path d="M132 212 Q126 280 140 372" stroke="#fff" stroke-width="2.5" fill="none" opacity=".1"/>`+
        `<path d="M276 162 q8 34 2 70" stroke="${hrD}" stroke-width="6" fill="none" opacity=".6" stroke-linecap="round"/>`;
      case 'shaved': return `<path d="M124 170 C128 110 162 90 200 90 C238 90 272 110 276 170 C250 148 150 148 124 170 Z" fill="#5d5a66" opacity=".16"/><path d="M158 108 Q200 96 242 108" stroke="#fff" stroke-width="7" opacity=".13" fill="none" stroke-linecap="round"/>`;
      /* ผู้เล่นชาย: ทรงทูบล็อกปัดข้าง หน้าม้าโค้งแบบ comma hair มีวอลลุ่มด้านบน */
      case 'swoop': return `<path d="M117 196 C106 106 160 50 220 54 C280 58 310 112 290 196 C286 172 278 152 266 138 C258 150 244 160 226 164 C236 150 240 136 236 122 C220 146 194 160 166 166 C152 170 142 178 137 190 C133 178 134 166 140 156 C130 164 122 178 117 196 Z" fill="${H}"/>`+
        `<path d="M137 190 C140 200 150 204 158 198 C150 196 144 192 141 184 Z" fill="${H}"/>`+                                              // ปลายหน้าม้าโค้งเข้า
        `<path d="M236 122 C226 104 208 90 184 84 M226 164 C246 148 254 126 250 104 M166 166 C194 152 214 136 228 114 M150 176 C168 156 190 140 210 126 M266 138 C276 120 274 100 262 84" stroke="${hrD}" stroke-width="2.4" fill="none" opacity=".8" stroke-linecap="round"/>`+
        `<path d="M170 72 Q222 58 266 90 M160 92 Q204 76 244 104" stroke="#fff" stroke-width="5" fill="none" opacity=".16" stroke-linecap="round"/>`+
        `<path d="M196 98 Q228 102 248 124" stroke="#fff" stroke-width="2" fill="none" opacity=".22" stroke-linecap="round"/>`+
        `<path d="M121 194 q-3 12 0 22 l5 -2 q-2 -9 -1 -19 Z M285 192 q3 12 0 22 l-5 -2 q2 -9 1 -19 Z" fill="${H}" opacity=".9"/>`;     // จอนสั้น
      /* ผู้เล่นหญิง: ผมยาวลอนปลาย หน้าม้าซีทรู ปอยผมกรอบหน้าบังใบหู และกิ๊บสีเขียวทีม HDS */
      case 'wave': { const lockL = 'M130 146 C112 186 106 228 110 268 C114 306 100 338 104 370 C108 392 122 404 138 412 C130 390 134 366 130 340 C126 312 136 282 134 248 C132 214 140 180 146 156 Z';
        const mirror = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m,x,y)=>`${400-(+x)} ${y}`);
        return `<path d="M118 210 C110 118 160 68 206 70 C258 70 298 116 288 210 C285 184 278 166 268 154`+
          ` Q263 170 253 157 Q246 177 235 159 Q227 171 218 161 Q208 179 197 161 Q190 172 181 159 Q170 177 161 157 Q154 168 145 155 C134 166 124 186 118 210 Z" fill="${H}"/>`+
        `<path d="${lockL}" fill="${H}"/><path d="${mirror(lockL)}" fill="${H}"/>`+
        `<path d="M252 156 Q248 132 236 112 M234 158 Q230 130 218 108 M216 160 Q212 132 202 104 M198 160 Q194 134 184 110 M180 158 Q176 136 168 116 M162 156 Q160 140 154 126" stroke="${hrD}" stroke-width="1.8" fill="none" opacity=".55" stroke-linecap="round"/>`+
        `<path d="M136 200 C126 250 130 300 118 352 M264 200 C274 250 270 300 282 352" stroke="${hrD}" stroke-width="2.2" fill="none" opacity=".6" stroke-linecap="round"/>`+
        `<path d="M164 84 Q206 70 250 90" stroke="#fff" stroke-width="7" fill="none" opacity=".17" stroke-linecap="round"/><path d="M178 98 Q208 88 238 100" stroke="#fff" stroke-width="2.5" fill="none" opacity=".2" stroke-linecap="round"/>`+
        `<path d="M122 230 Q116 290 112 340 M278 230 Q284 290 288 340" stroke="#fff" stroke-width="3" fill="none" opacity=".13" stroke-linecap="round"/>`+
        `<g transform="rotate(-28 264 128)"><rect x="250" y="123" width="30" height="9" rx="4.5" fill="#2f8a6c" stroke="#1f5a4c" stroke-width="1.2"/><circle cx="254" cy="127.5" r="3" fill="#f2e3b0"/><circle cx="262" cy="127.5" r="2" fill="#f2e3b0" opacity=".8"/></g>`; }
      case 'pony': return `<path d="M118 206 C110 118 160 70 210 72 C264 74 298 118 288 206 C284 176 276 156 262 142 C240 150 212 148 190 132 C178 150 152 164 136 182 C128 190 122 198 118 206 Z" fill="${H}"/>`+
        `<path d="M121 186 C114 214 116 242 124 264 C129 244 131 220 133 200 Z" fill="${H}"/>`+
        `<path d="M186 82 Q238 84 266 120" stroke="#fff" stroke-width="5" fill="none" opacity=".11" stroke-linecap="round"/><path d="M190 132 Q214 112 236 104" stroke="${hrD}" stroke-width="2.2" fill="none" opacity=".7"/>`+
        `<circle cx="262" cy="86" r="9" fill="#2f8a6c" stroke="#1f5a4c" stroke-width="2"/>`;   // ยางรัดผมสีเขียวทีม HDS
      case 'bob': return `<path d="M116 210 C108 120 158 70 208 72 C262 74 298 120 288 210 C286 180 280 160 270 148 C246 140 222 136 200 138 C178 136 154 140 132 150 C124 166 119 186 116 210 Z" fill="${H}"/>`+
        `<path d="M118 196 C110 240 114 276 128 298 L146 296 C134 270 130 236 132 204 Z M282 196 C290 240 286 276 272 298 L254 296 C266 270 270 236 268 204 Z" fill="${H}"/>`+
        `<path d="M180 80 Q232 82 262 112" stroke="#fff" stroke-width="5" fill="none" opacity=".1" stroke-linecap="round"/><path d="M200 74 L200 136" stroke="${hrD}" stroke-width="2" opacity=".5"/>`;
      case 'wrap': return `<path d="M114 180 C108 104 156 64 204 64 C256 64 298 104 290 180 C270 152 238 140 202 140 C166 140 134 152 114 180 Z" fill="url(#${k}scarf)"/>`+   // ผ้าโพกผม
        `<path d="M114 180 C134 152 166 140 202 140 C238 140 270 152 290 180" stroke="#7e1f15" stroke-width="3" fill="none"/>`+
        `<ellipse cx="236" cy="70" rx="17" ry="11" fill="url(#${k}scarf)" stroke="#7e1f15" stroke-width="1.5" transform="rotate(-25 236 70)"/><ellipse cx="258" cy="74" rx="15" ry="9" fill="url(#${k}scarf)" stroke="#7e1f15" stroke-width="1.5" transform="rotate(20 258 74)"/>`+
        `<path d="M120 176 q-4 18 0 36 M284 176 q4 18 0 36" stroke="${H}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    }
    return '';
  }

  /* ---------- เครื่องแต่งกาย (ลำตัวกลม) ---------- */
  function outfit(c, k){
    const sh = body => `<path d="${body}" fill="url(#${k}bodysh)"/>`;
    switch(c.outfit){
      case 'doc': return `<path d="${BODY_M}" fill="#f1f1ec"/>`+
        `<path d="M174 370 L200 452 L226 370 Z" fill="url(#${k}khit)"/>`+
        `<path d="M172 372 L186 404 L199 386 Z M228 372 L214 404 L201 386 Z" fill="url(#${k}khit)" stroke="#d6b45a" stroke-width="1"/>`+
        `<path d="M168 374 C152 418 172 468 192 520 L176 520 C154 472 142 422 156 384 Z M232 374 C248 418 228 468 208 520 L224 520 C246 472 258 422 244 384 Z" fill="#fafaf6" stroke="#d4d4ca" stroke-width="1.5"/>`+
        `<rect x="240" y="436" width="46" height="48" rx="3" fill="#e4e4dc"/><rect x="248" y="424" width="5" height="24" rx="2" fill="#2f5fae"/><rect x="257" y="426" width="5" height="22" rx="2" fill="#b8302a"/>`+
        `<rect x="98" y="440" width="64" height="28" rx="3" fill="#2f6a5a"/><text x="130" y="459" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="12" font-weight="700" fill="#fff">พี่วิ</text>` + sh(BODY_M);
      case 'epi': return `<path d="${BODY_M}" fill="#cfe0ef"/>`+                                   // เสื้อเชิ้ตฟ้าอ่อน
        `<path d="M172 370 L186 406 L200 388 L214 406 L228 370 Z" fill="url(#${k}khit)" stroke="#d6b45a" stroke-width="1"/>`+   // ปกผ้าไทยลายขิด
        `<path d="M200 388 V520" stroke="#a9c2d8" stroke-width="2.5"/>`+
        `<path d="M58 520 C56 424 108 356 168 362 C176 400 184 460 190 520 Z M342 520 C344 424 292 356 232 362 C224 400 216 460 210 520 Z" fill="#2c3e5c"/>`+  // เสื้อกั๊กภาคสนาม
        `<path d="M168 362 C176 400 184 460 190 520 M232 362 C224 400 216 460 210 520" stroke="#e5c66b" stroke-width="2.2" fill="none"/>`+
        `<rect x="96" y="452" width="50" height="40" rx="4" fill="#33486a" stroke="#22324c" stroke-width="2"/><path d="M96 462 H146" stroke="#22324c" stroke-width="2"/>`+
        `<rect x="250" y="452" width="50" height="40" rx="4" fill="#33486a" stroke="#22324c" stroke-width="2"/><path d="M250 462 H300" stroke="#22324c" stroke-width="2"/>`+
        `<circle cx="122" cy="420" r="17" fill="#2f8a5a" stroke="#e5c66b" stroke-width="2.5"/><text x="122" y="425" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="11" font-weight="700" fill="#fff">HDS</text>`+
        `<rect x="250" y="412" width="54" height="17" rx="3" fill="#f4f1e8"/><text x="277" y="425" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="11" font-weight="700" fill="#2c3e5c">พี่วิ</text>`+
        `<path d="M184 380 L196 456 M216 380 L204 456" stroke="#2f8a5a" stroke-width="2.6"/><rect x="182" y="454" width="36" height="46" rx="4" fill="#fff" stroke="#2f8a5a" stroke-width="2"/><rect x="188" y="460" width="15" height="17" rx="2" fill="#dbe9ee"/><text x="200" y="494" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="8.5" font-weight="700" fill="#2f6a5a">EPI</text>` + sh(BODY_M);
      case 'lab': return `<path d="${BODY_F}" fill="#f2f2ee"/>`+
        `<path d="M180 372 L200 436 L220 372 Z" fill="#f3c9d2"/>`+
        Array.from({length:6},(_,i)=>{ const t=i/5, x1=180+20*t, y1=372+64*t, x2=220-20*t; return `<circle cx="${x1}" cy="${y1}" r="3.2" fill="#fff"/><circle cx="${x2}" cy="${y1}" r="3.2" fill="#fff"/>`; }).join('')+
        `<path d="M176 376 C160 420 176 470 194 520 L178 520 C158 474 148 424 162 388 Z M224 376 C240 420 224 470 206 520 L222 520 C242 474 252 424 238 388 Z" fill="#fbfbf8" stroke="#d6d6cc" stroke-width="1.5"/>`+
        `<path d="M188 380 L222 452 M212 380 L232 452" stroke="#3f8f9a" stroke-width="2.6"/><rect x="210" y="450" width="40" height="52" rx="4" fill="#fff" stroke="#3f8f9a" stroke-width="2"/><rect x="216" y="457" width="17" height="19" rx="2" fill="#dbe9ee"/><text x="230" y="494" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="10" font-weight="700" fill="#2f5f8a">MT</text>` + sh(BODY_F);
      case 'lace': return `<path d="${BODY_F}" fill="url(#${k}lace)"/>`+
        `<path d="M172 374 Q200 400 228 374" fill="none" stroke="#fff" stroke-width="3"/>`+
        Array.from({length:8},(_,i)=>{ const t=i/7, x=172+56*t, y=374+26*Math.sin(Math.PI*t)*.98; return `<circle cx="${x.toFixed(1)}" cy="${(y+4).toFixed(1)}" r="4" fill="none" stroke="#fff" stroke-width="1.6"/>`; }).join('')+
        `<path d="M180 378 Q200 412 220 378" fill="none" stroke="#e2b443" stroke-width="2.4"/><circle cx="200" cy="408" r="7.5" fill="#e2b443" stroke="#a87a1e" stroke-width="1.5"/><circle cx="200" cy="408" r="3.5" fill="#f6dc8a"/>`+
        `<circle cx="118" cy="452" r="19" fill="#2f8a5a" stroke="#f4f1e8" stroke-width="3"/><text x="118" y="457" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="11.5" font-weight="700" fill="#fff">อสม.</text>`+
        `<path d="M290 396 C272 428 222 470 162 520 L214 520 C258 490 300 454 322 428 Z" fill="url(#${k}pkm)"/><path d="M290 396 C272 428 222 470 162 520" stroke="#6e1c14" stroke-width="1.6" fill="none" opacity=".5"/><path d="M306 410 C284 444 240 482 192 520" stroke="#000" stroke-width="5" fill="none" opacity=".12"/>` + sh(BODY_F);
      case 'khaki': return `<path d="${BODY_M}" fill="#a9956a"/>`+
        `<path d="M174 370 L188 406 L200 388 L212 406 L226 370 Z" fill="#c4af82"/>`+
        `<path d="M200 388 V520" stroke="#86744d" stroke-width="3"/>`+[424,462,500].map(y=>`<circle cx="200" cy="${y}" r="5" fill="#e5c66b" stroke="#9a7c2c"/>`).join('')+
        `<path d="M74 436 L124 400 L136 418 L86 454 Z M326 436 L276 400 L264 418 L314 454 Z" fill="#8c7850"/><path d="M90 432 L128 404 M96 442 L132 414 M310 432 L272 404 M304 442 L268 414" stroke="#e5c66b" stroke-width="2.2"/>`+
        `<rect x="232" y="440" width="58" height="52" rx="4" fill="#9e895e" stroke="#86744d" stroke-width="2"/><path d="M232 452 H290" stroke="#86744d" stroke-width="2"/>`+
        `<rect x="236" y="420" width="52" height="15" rx="2" fill="#151515"/><text x="262" y="431.5" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="10.5" font-weight="700" fill="#fff">เสถียร</text>`+
        `<rect x="112" y="422" width="12" height="7" fill="#a51931"/><rect x="124" y="422" width="12" height="7" fill="#f4f5f8"/><rect x="136" y="422" width="12" height="7" fill="#2d2a4a"/>`+
        `<circle cx="130" cy="454" r="15" fill="#e1b84d" stroke="#9a7c2c" stroke-width="2"/><circle cx="130" cy="454" r="9" fill="#a32a1c"/><circle cx="130" cy="454" r="3.6" fill="#e1b84d"/>` + sh(BODY_M);
      case 'robe': return `<path d="${BODY_M}" fill="url(#${k}skinb)"/>`+
        `<path d="M226 370 C292 380 342 428 342 520 L62 520 C80 470 116 446 148 436 C182 424 208 400 226 370 Z" fill="url(#${k}robe)"/>`+
        `<path d="M220 388 C196 432 152 454 104 478 M252 400 C232 452 198 482 156 520 M290 418 C280 462 262 492 244 520" stroke="#8a4510" stroke-width="3" fill="none" opacity=".45"/>`+
        `<path d="M236 368 C288 380 326 406 338 446 L320 466 C302 430 272 406 228 392 Z" fill="#a95815"/><path d="M234 378 C284 392 314 416 328 452" stroke="#e7a24a" stroke-width="1.6" stroke-dasharray="6 5" fill="none" opacity=".75"/>`;
      case 'hds': { const B = c.fem ? BODY_F : BODY_M, lx = c.fem ? 252 : 262;      // เสื้อโปโลทีม HDS + บัตรประจำตัว
        const tag = OD.u ? OD.u.esc(Array.from(c.tag||'').slice(0,9).join('')) : '';
        return `<path d="${B}" fill="#2f7f6c"/>`+
        `<path d="M166 366 L200 394 L234 366 L242 386 L214 406 L200 396 L186 406 L158 386 Z" fill="#3a9680" stroke="#1f5a4c" stroke-width="1.5"/>`+
        `<path d="M193 394 V448 H207 V394" fill="#2a725f" stroke="#1f5a4c" stroke-width="1.2"/><circle cx="200" cy="410" r="2.6" fill="#e9f3ef"/><circle cx="200" cy="428" r="2.6" fill="#e9f3ef"/>`+
        `<circle cx="${lx}" cy="430" r="14" fill="#e5c66b" stroke="#f4f1e8" stroke-width="2"/><text x="${lx}" y="434" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="9" font-weight="700" fill="#1f5a4c">HDS</text>`+
        `<path d="M174 382 L190 470 M226 382 L210 470" stroke="#e5c66b" stroke-width="3"/>`+
        `<rect x="174" y="466" width="52" height="56" rx="4" fill="#fbf8f0" stroke="#d6b45a" stroke-width="2"/><rect x="180" y="473" width="15" height="18" rx="2" fill="#bfe0d6"/>`+
        `<text x="211" y="485" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="8.5" font-weight="700" fill="#2f7f6c">HDS</text><rect x="180" y="496" width="40" height="3.5" rx="1.5" fill="#2f7f6c"/>`+
        `<text x="200" y="511" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="8.5" font-weight="700" fill="#1f3a33">${tag}</text>` + sh(B); }
      case 'hdsj': { const B = c.fem ? BODY_F : BODY_M, px = c.fem ? 250 : 256;                              // แจ็กเก็ตภาคสนามสีกรมท่า สวมทับโปโลทีม HDS
        const tag = OD.u ? OD.u.esc(Array.from(c.tag||'').slice(0,9).join('')) : '';
        return `<path d="${B}" fill="url(#${k}jacket)"/>`+
        `<path d="M166 364 L200 476 L234 364 Z" fill="#2f8a6c"/>`+                                                        // โปโลด้านใน
        `<path d="M166 364 L200 392 L234 364 L242 382 L214 404 L200 394 L186 404 L158 382 Z" fill="#3fa587" stroke="#1f5a4c" stroke-width="1.3"/>`+
        `<circle cx="200" cy="414" r="2.4" fill="#e9f3ef"/><circle cx="200" cy="432" r="2.4" fill="#e9f3ef"/>`+
        `<path d="M160 366 C148 386 140 410 138 436 L172 446 C176 418 182 392 192 372 Z M240 366 C252 386 260 410 262 436 L228 446 C224 418 218 392 208 372 Z" fill="#33476b" stroke="#1b2740" stroke-width="1.6"/>`+   // ปกแจ็กเก็ต
        `<path d="M192 372 C186 420 190 470 194 520 M208 372 C214 420 210 470 206 520" stroke="#1b2740" stroke-width="2.4" fill="none"/>`+
        `<rect x="${px-24}" y="452" width="48" height="36" rx="5" fill="#2c3e60" stroke="#1b2740" stroke-width="1.5"/><path d="M${px-24} 464 H${px+24}" stroke="#1b2740" stroke-width="1.5"/>`+
        `<circle cx="${400-px}" cy="452" r="14" fill="#e5c66b" stroke="#f4f1e8" stroke-width="2"/><text x="${400-px}" y="456" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="9" font-weight="700" fill="#1b2740">HDS</text>`+
        `<path d="M176 386 L190 474 M224 386 L210 474" stroke="#e5c66b" stroke-width="3"/>`+
        `<rect x="174" y="470" width="52" height="54" rx="4" fill="#fbf8f0" stroke="#d6b45a" stroke-width="2"/><rect x="180" y="477" width="15" height="18" rx="2" fill="#bfe0d6"/>`+
        `<text x="211" y="489" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="8.5" font-weight="700" fill="#2f7f6c">HDS</text><rect x="180" y="500" width="40" height="3.5" rx="1.5" fill="#2f7f6c"/>`+
        `<text x="200" y="515" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="8.5" font-weight="700" fill="#1f3a33">${tag}</text>` + sh(B); }
      case 'apron': return `<path d="${BODY_F}" fill="url(#${k}floral)"/>`+                                   // เสื้อลายดอก + ผ้ากันเปื้อน
        `<path d="M176 372 Q200 392 224 372" fill="none" stroke="#f4e8cf" stroke-width="3"/>`+
        `<path d="M150 404 C162 384 172 374 180 370 M250 404 C238 384 228 374 220 370" stroke="#2c4f7a" stroke-width="5" fill="none" stroke-linecap="round"/>`+
        `<path d="M146 404 Q200 394 254 404 L266 520 L134 520 Z" fill="url(#${k}gingham)" stroke="#2c4f7a" stroke-width="1.8"/>`+
        `<rect x="170" y="452" width="60" height="36" rx="5" fill="#ffffff" opacity=".6" stroke="#2c4f7a" stroke-width="1.4"/><path d="M182 452 v-16" stroke="#b8302a" stroke-width="3.5" stroke-linecap="round"/><path d="M190 452 v-12" stroke="#2f6a8a" stroke-width="3.5" stroke-linecap="round"/>` + sh(BODY_F);
      case 'pakama': return `<path d="${BODY_M}" fill="#e9e4d8"/>`+                                         // เสื้อคอกลม + ผ้าขาวม้าพาดคอ
        `<path d="M170 368 Q200 390 230 368" fill="none" stroke="#cfc8b8" stroke-width="5"/>`+
        `<path d="M156 372 C176 398 224 398 244 372 L256 388 C232 416 168 416 144 388 Z" fill="url(#${k}pkm)"/>`+
        `<path d="M224 400 L248 392 L262 486 L236 494 Z" fill="url(#${k}pkm)"/><path d="M236 494 L262 486 M240 502 l2 -8 M248 500 l1 -9 M256 497 l0 -9" stroke="#7a1f14" stroke-width="2" opacity=".7"/>`+
        `<path d="M120 452 h40 v34 h-40 z" fill="#d8d1c0" opacity=".7"/>` + sh(BODY_M);
      case 'tee': { const B = c.fem ? BODY_F : BODY_M, d = shade(c.shirt,-.25);                         // เสื้อยืดลำลอง + ผ้าขาวม้าคลุมไหล่ (ผู้ป่วยนอนพัก)
        return `<path d="${B}" fill="${c.shirt}"/><path d="M172 368 Q200 394 228 368" fill="none" stroke="${d}" stroke-width="5"/>`+
        `<path d="M${c.fem?72:62} 470 C110 440 150 446 176 470 L170 520 L${c.fem?70:58} 520 Z" fill="url(#${k}pkm)" opacity=".92"/>`+
        `<rect x="236" y="440" width="34" height="44" rx="5" fill="#f4f1e8" opacity=".85"/><text x="253" y="466" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="9" font-weight="700" fill="#2f7f6c">ORS</text>` + sh(B); }
      case 'blazer': return `<path d="${BODY_F}" fill="#2b3a5c"/>`+                                        // สูทผู้อำนวยการ
        `<path d="M178 370 L200 444 L222 370 Z" fill="#f4f1ea"/>`+
        `<path d="M178 370 L158 402 L188 432 L200 444 Z M222 370 L242 402 L212 432 L200 444 Z" fill="#33456b" stroke="#1d2842" stroke-width="1.5"/>`+
        `<circle cx="252" cy="426" r="7" fill="#e5c66b" stroke="#9a7c2c" stroke-width="1.5"/><circle cx="252" cy="426" r="3" fill="#f6dc8a"/>`+
        `<rect x="124" y="418" width="58" height="17" rx="2" fill="#f4f1e8"/><text x="153" y="431" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="10" font-weight="700" fill="#2b3a5c">ผอ.</text>`+
        `<circle cx="200" cy="470" r="3.2" fill="#1d2842"/><circle cx="200" cy="494" r="3.2" fill="#1d2842"/>` + sh(BODY_F);
    }
    return `<path d="${BODY_M}" fill="#777"/>`;
  }

  /* id 'me' = ตัวละครของผู้เล่นตามเพศที่เลือก · opts.tag = ชื่อบนบัตรประจำตัว */
  A.person = function(id, expr='neutral', opts={}){
    if(id==='me') id = 'me_' + (opts.gender || (OD.S && OD.S.gender) || 'm');
    const base = OD.CHARS[id]; if(!base) return '';
    const c = Object.assign({}, base, {tag: opts.tag!=null ? opts.tag : (id.startsWith('me_') && OD.S ? OD.S.name : '')});
    const k = 'pp'+(++uid)+'-', fem = c.fem;
    const sk = c.skin, skD = shade(sk,-.15), skDD = shade(sk,-.32), skL = shade(sk,.17);
    const hr = c.hair || sk, hrL = shade(hr,.24), hrD = shade(hr,-.4);
    const lipC = c.lip || shade(sk,-.3);
    const defs = `<radialGradient id="${k}face" cx=".42" cy=".4" r=".75"><stop offset="0" stop-color="${skL}"/><stop offset=".6" stop-color="${sk}"/><stop offset="1" stop-color="${skD}"/></radialGradient>`+
      `<linearGradient id="${k}neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skDD}"/><stop offset=".6" stop-color="${skD}"/><stop offset="1" stop-color="${sk}"/></linearGradient>`+
      `<linearGradient id="${k}skinb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${skD}"/><stop offset=".5" stop-color="${sk}"/><stop offset="1" stop-color="${skD}"/></linearGradient>`+
      `<linearGradient id="${k}hair" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="${hrL}"/><stop offset=".5" stop-color="${hr}"/><stop offset="1" stop-color="${hrD}"/></linearGradient>`+
      `<radialGradient id="${k}iris" cx=".45" cy=".32" r=".72"><stop offset="0" stop-color="#8a5630"/><stop offset=".5" stop-color="#43260f"/><stop offset="1" stop-color="#140904"/></radialGradient>`+
      `<linearGradient id="${k}robe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3902f"/><stop offset=".6" stop-color="#c76c1b"/><stop offset="1" stop-color="#9a4f12"/></linearGradient>`+
      `<linearGradient id="${k}bodysh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>`+
      `<pattern id="${k}khit" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#35346f"/><path d="M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z" fill="none" stroke="#c9a24a" stroke-width="1.1"/><circle cx="8" cy="8" r="1.7" fill="#e6c66e"/><circle cx="0" cy="0" r="1" fill="#c9a24a"/><circle cx="16" cy="16" r="1" fill="#c9a24a"/></pattern>`+
      `<pattern id="${k}pkm" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><rect width="22" height="22" fill="#b5352b"/><rect width="11" height="22" fill="#2f7a4a" opacity=".8"/><rect width="22" height="7" y="7" fill="#f4e8cf" opacity=".55"/><path d="M0 0 H22 M0 11 H22 M0 0 V22 M11 0 V22" stroke="#4f1610" stroke-width=".7" opacity=".45"/></pattern>`+
      `<pattern id="${k}lace" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#a9cfe8"/><circle cx="9" cy="9" r="3" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/><circle cx="0" cy="0" r="2" fill="#fff" opacity=".5"/><circle cx="18" cy="18" r="2" fill="#fff" opacity=".5"/><circle cx="18" cy="0" r="2" fill="#fff" opacity=".5"/><circle cx="0" cy="18" r="2" fill="#fff" opacity=".5"/></pattern>`+
      `<radialGradient id="${k}irisG" cx=".5" cy=".68" r=".75"><stop offset="0" stop-color="#d4975c"/><stop offset=".45" stop-color="#7b4520"/><stop offset="1" stop-color="#240f05"/></radialGradient>`+
      `<linearGradient id="${k}jacket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4f78"/><stop offset="1" stop-color="#243556"/></linearGradient>`+
      `<pattern id="${k}scarf" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#c0392b"/><circle cx="7" cy="7" r="2.2" fill="#f6dc8a"/><circle cx="0" cy="0" r="1.4" fill="#fbeee0"/><circle cx="14" cy="14" r="1.4" fill="#fbeee0"/></pattern>`+
      `<pattern id="${k}floral" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#e8a33d"/><g fill="#fff3d6" opacity=".9"><circle cx="7" cy="7" r="3"/><circle cx="11" cy="7" r="3"/><circle cx="9" cy="3.5" r="3"/><circle cx="9" cy="10.5" r="3"/></g><circle cx="9" cy="7" r="1.8" fill="#c0392b"/><circle cx="21" cy="20" r="2.6" fill="#2f7a4a" opacity=".7"/></pattern>`+
      `<pattern id="${k}gingham" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#f4f6fa"/><rect width="6" height="12" fill="#8fb0d8" opacity=".55"/><rect width="12" height="6" fill="#8fb0d8" opacity=".55"/></pattern>`+
      `<filter id="${k}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>`;

    // ผมด้านหลัง (อยู่หลังลำตัว)
    let s = `<g transform="${HEAD}">${hairBack(c, k)}</g>`;
    // ลำตัวกลม (หัวจะวางทับส่วนบน จึงไม่เห็นคอ) + เงาใต้คางบนลำตัว
    s += outfit(c, k);
    s += `<ellipse cx="200" cy="388" rx="${fem?52:60}" ry="13" fill="#000" opacity=".22" filter="url(#${k}soft)"/>`;
    if(c.acc.includes('steth')) s += `<path d="M160 386 C148 428 170 472 200 480 C230 472 252 428 240 386" stroke="#25272a" stroke-width="6.5" fill="none" stroke-linecap="round"/><circle cx="200" cy="484" r="11" fill="#c9ced3" stroke="#6d7379" stroke-width="3"/>`;

    // ศีรษะทั้งหมด
    let h = '';
    if(c.acc.includes('mask')) h += `<path d="M174 312 Q200 334 226 312 L230 332 Q200 354 170 332 Z" fill="#a6cde8"/><path d="M176 320 Q200 340 224 320 M174 327 Q200 347 226 327" stroke="#86b3d3" stroke-width="1.5" fill="none"/><path d="M172 315 L131 236 M228 315 L269 236" stroke="#eef3f6" stroke-width="2"/>`;
    h += `<ellipse cx="122" cy="210" rx="14" ry="24" fill="${skD}"/><ellipse cx="278" cy="210" rx="14" ry="24" fill="${skD}"/><path d="M117 201 q7 -6 10 6 q-3 10 -2 16" stroke="${skDD}" stroke-width="2" fill="none" opacity=".6"/><path d="M283 201 q-7 -6 -10 6 q3 10 2 16" stroke="${skDD}" stroke-width="2" fill="none" opacity=".6"/>`;
    if(c.acc.includes('earring')) h += `<path d="M122 233 v8" stroke="#e2b443" stroke-width="2"/><circle cx="122" cy="245" r="4.5" fill="#e2b443"/><path d="M278 233 v8" stroke="#e2b443" stroke-width="2"/><circle cx="278" cy="245" r="4.5" fill="#e2b443"/>`;
    if(c.acc.includes('stud')) h += `<circle cx="121" cy="234" r="4" fill="#fbf6ee" stroke="#d9cbb5" stroke-width="1"/><circle cx="279" cy="234" r="4" fill="#fbf6ee" stroke="#d9cbb5" stroke-width="1"/>`;   // ต่างหูมุก
    const face = FACE[c.face];
    h += `<path d="${face}" fill="url(#${k}face)"/>`;
    h += `<clipPath id="${k}fc"><path d="${face}"/></clipPath><g clip-path="url(#${k}fc)" filter="url(#${k}soft)">`+
      `<path d="M264 124 C292 184 286 262 236 304 L300 320 L300 100 Z" fill="${skDD}" opacity=".3"/>`+
      `<path d="M128 152 C122 202 130 252 150 282" stroke="#fff" stroke-width="10" fill="none" opacity=".1"/>`+
      (c.hairS!=='shaved' ? `<path d="M120 172 Q200 132 282 172" stroke="${skDD}" stroke-width="16" fill="none" opacity=".32"/>` : '')+
      `</g>`;
    h += `<ellipse cx="150" cy="258" rx="21" ry="12" fill="#f08a86" opacity="${fem?.32:.17}"/><ellipse cx="250" cy="258" rx="21" ry="12" fill="#f08a86" opacity="${fem?.32:.17}"/>`;
    if(c.acc.includes('wrinkle')) h += `<path d="M168 150 Q200 143 232 150" stroke="${skDD}" stroke-width="1.4" fill="none" opacity=".3"/><path d="M176 252 Q168 268 177 284 M224 252 Q232 268 223 284" stroke="${skDD}" stroke-width="1.7" fill="none" opacity=".32"/><path d="M134 212 l-7 3 M266 212 l7 3" stroke="${skDD}" stroke-width="1.3" opacity=".35"/>`;
    h += eye(k, 1, 165, EY, -1, fem, expr, skDD, c.hs, c.glam) + eye(k, 2, 235, EY, 1, fem, expr, skDD, c.hs, c.glam);
    const bc = c.hairS==='bun' ? '#4a4440' : c.hairS==='shaved' ? skDD : hrD;
    h += brow(165, 182, -1, expr, bc, fem, c.hairS==='shaved', c.hs) + brow(235, 182, 1, expr, bc, fem, c.hairS==='shaved', c.hs);
    h += `<path d="M197 232 Q195 242 192 248" stroke="${skDD}" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>`+
      `<path d="M191 252 Q196 256.5 200 256 Q204 256.5 209 252" stroke="${skDD}" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/>`+
      `<ellipse cx="194.5" cy="252.5" rx="2.8" ry="1.7" fill="${skDD}" opacity=".45"/><ellipse cx="205.5" cy="252.5" rx="2.8" ry="1.7" fill="${skDD}" opacity=".45"/>`+
      `<ellipse cx="201" cy="246" rx="4" ry="3" fill="#fff" opacity=".18"/>`;
    if(c.acc.includes('mustache')) h += `<path d="M176 263 Q188 255 200 260 Q212 255 224 263 Q213 268 200 264 Q187 268 176 263 Z" fill="#3a3532"/>`;
    h += `<g transform="translate(200 275) scale(.9) translate(-200 -275)">${lips(expr, lipC, fem, c.hs)}</g>`;
    // ลิปกลอส (ผู้เล่นหญิง)
    if(c.glam && fem && expr!=='surprised') h += `<ellipse cx="${expr==='smile'?208:204}" cy="${expr==='smile'?283:279}" rx="5.5" ry="1.6" fill="#fff" opacity=".5"/>`;
    h += hairFront(c, k, hrD);
    if(c.acc.includes('pin')){
      h += `<path d="M236 104 L282 150" stroke="#c99a35" stroke-width="3.2" stroke-linecap="round"/>`;
      h += `<g transform="translate(222 88) scale(.3)">${A.prajam('#e6c35c','#a07a2c','#7a1f14').replace(/<svg[^>]*>|<\/svg>/g,'')}</g>`;
      h += `<circle cx="237" cy="135" r="2.4" fill="#f6dc8a"/><circle cx="245" cy="142" r="2" fill="#f6dc8a"/>`;
    }
    if(c.acc.includes('browline')) h += `<g fill="none" stroke-linecap="round"><path d="M136 200 Q166 192 196 200" stroke="#231d19" stroke-width="4"/><path d="M204 200 Q234 192 264 200" stroke="#231d19" stroke-width="4"/>`+
      `<path d="M137 201 Q136 228 160 231 Q190 233 195 205" stroke="#b8923a" stroke-width="1.6"/><path d="M263 201 Q264 228 240 231 Q210 233 205 205" stroke="#b8923a" stroke-width="1.6"/>`+
      `<path d="M196 203 Q200 199 204 203" stroke="#b8923a" stroke-width="1.6"/><path d="M136 201 L121 197 M264 201 L279 197" stroke="#231d19" stroke-width="2.4"/></g>`+
      `<path d="M146 206 l9 -3" stroke="#fff" stroke-width="2" opacity=".35"/><path d="M214 206 l9 -3" stroke="#fff" stroke-width="2" opacity=".25"/>`;
    if(c.hs) h += `<clipPath id="${k}jc"><path d="${face}"/></clipPath><g clip-path="url(#${k}jc)" filter="url(#${k}soft)"><path d="M126 236 C138 284 172 306 200 308 C228 306 262 284 274 236" stroke="${skDD}" stroke-width="12" fill="none" opacity=".28"/></g>`;
    if(c.acc.includes('glasses')) h += `<g fill="none" stroke="#2b2420" stroke-width="3"><rect x="134" y="194" width="62" height="40" rx="16"/><rect x="204" y="194" width="62" height="40" rx="16"/><path d="M196 208 Q200 203 204 208"/><path d="M134 206 L120 201 M266 206 L280 201"/></g><rect x="136" y="196" width="58" height="36" rx="15" fill="#d8ecf8" opacity=".1"/><rect x="206" y="196" width="58" height="36" rx="15" fill="#d8ecf8" opacity=".1"/><path d="M143 201 l10 -2" stroke="#fff" stroke-width="2" opacity=".35"/>`;
    s += `<g transform="${HEAD}">${h}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" role="img" aria-label="${c.name}"><defs>${defs}</defs>${s}</svg>`;
  };
})(OD.art);
