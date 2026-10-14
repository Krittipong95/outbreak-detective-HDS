/* =========================================================
   ฉากหลัง (3) — สถานที่ในตำบลที่ลงพื้นที่ได้
   บ่อน้ำ ๓ แห่ง · ร้านอาหาร ๔ ร้าน · โรงอาหารโรงเรียน · สวนผัก · รพ.สต. ยามกลางวัน
   ฉากรับ variant ต่อท้ายชื่อ เช่น 'well_temple:bad' = วาดสิ่งผิดปกติที่ตรวจพบ
   (ใช้หลังตรวจสิ่งแวดล้อมแล้วเท่านั้น ฉากปกติจึงไม่เฉลยคดี)
   ========================================================= */
(function(A){
  const {lin, rad, wrap, palm, banana, bush, house, bigTree, ubosot} = A._h;
  const SC = {};
  const FONT = 'Sarabun,Leelawadee UI,sans-serif';
  const txt = (x, y, s, fs, fill, w=700) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="${fs}" font-weight="${w}" fill="${fill}">${s}</text>`;
  const board = (x, y, w, h, s, bg, fg, fs, edge) => `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="4" fill="${bg}"${edge?` stroke="${edge}" stroke-width="4"`:''}/>` + txt(x, y+fs*.36, s, fs, fg);
  const stake = (x, y, s, sc=1) => `<g transform="translate(${x} ${y}) scale(${sc})"><rect x="-5" y="-74" width="10" height="74" fill="#5a3a22"/><rect x="-84" y="-114" width="168" height="44" rx="4" fill="#ecd9ab" stroke="#7a5532" stroke-width="3"/>${txt(0,-84,s,22,'#4a2e18')}</g>`;
  const fig = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="0" cy="-150" r="20"/><path d="M-30 -125 Q0 -135 30 -125 L38 -40 L22 -40 L18 0 H-18 L-22 -40 L-38 -40 Z"/></g>`;
  const seated = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="0" cy="-104" r="18"/><path d="M-26 -82 Q0 -90 26 -82 L32 -30 H-32 Z"/></g>`;
  const stool = (x, y, s, c, top) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-17 -38 H17 L23 0 H14 L10 -28 H-10 L-14 0 H-23 Z" fill="${c}"/><ellipse cy="-38" rx="18" ry="5" fill="${top}"/></g>`;
  const table = (x, y, w, s, top, leg) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M${-w/2+12} -56 V0 M${w/2-12} -56 V0" stroke="${leg}" stroke-width="6"/><rect x="${-w/2}" y="-64" width="${w}" height="10" rx="2" fill="${top}"/></g>`;
  const steam = (x, y, s=1) => `<g fill="none" stroke="#fff" stroke-width="${5*s}" stroke-linecap="round">${[-16,0,16].map((dx,i)=>`<path d="M${x+dx*s} ${y} q${-10*s} ${-18*s} 0 ${-34*s} q${10*s} ${-16*s} 0 ${-34*s}" opacity="${.22+i*.08}"/>`).join('')}</g>`;
  const clouds = (arr, col, o) => arr.map(([x,y,w])=>`<g opacity="${o}" fill="${col}"><ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${w*.11}"/><ellipse cx="${x-w*.16}" cy="${y-w*.07}" rx="${w*.2}" ry="${w*.12}"/><ellipse cx="${x+w*.1}" cy="${y-w*.09}" rx="${w*.24}" ry="${w*.15}"/></g>`).join('');
  const flies = (x, y, n=6) => { let p = ''; for(let i=0;i<n;i++){ const a = i*2.4, r = 14+(i*9)%26; p += `<circle cx="${x+Math.cos(a)*r}" cy="${y+Math.sin(a)*r*.6}" r="2.6" fill="#1a1a1a"/>`; } return p; };
  const paddy = (y0, y1, c1, c2) => { let p = `<rect y="${y0}" width="1600" height="${y1-y0}" fill="${c1}"/>`; for(let i=1;i<10;i++){ const y = y0+(y1-y0)*Math.pow(i/10,1.6); p += `<rect y="${y}" width="1600" height="${1+i*.5}" fill="${c2}" opacity=".5"/>`; } return p; };
  const thaiFlag = (x, y, w=90) => { const h = w/1.5, u = h/6; return `<rect x="${x}" y="${y}" width="${w}" height="${u}" fill="#a51931"/><rect x="${x}" y="${y+u}" width="${w}" height="${u}" fill="#f4f5f8"/><rect x="${x}" y="${y+2*u}" width="${w}" height="${2*u}" fill="#2d2a4a"/><rect x="${x}" y="${y+4*u}" width="${w}" height="${u}" fill="#f4f5f8"/><rect x="${x}" y="${y+5*u}" width="${w}" height="${u}" fill="#a51931"/>`; };
  const moto = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="-40" cy="-16" r="16"/><circle cx="40" cy="-16" r="16"/><path d="M-40 -16 L-10 -46 H24 L40 -16 Z"/><path d="M-6 -50 h34 v-6 h-34 Z"/></g>`;
  const crate = (x, y, c) => { let p = `<rect x="${x}" y="${y}" width="110" height="56" rx="3" fill="${c}"/>`; for(let i=1;i<5;i++) p += `<rect x="${x+i*22-5}" y="${y+10}" width="10" height="36" rx="2" fill="#000" opacity=".2"/>`; return p; };

  /* ---------- บ่อน้ำ (ขอบบ่อ ฝาบ่อ ขาตั้งรอก ถังตักน้ำ) ---------- */
  const WDEF = lin('wl-sh',[[0,'#fff',.16],[.4,'#fff',0],[.65,'#000',0],[1,'#000',.3]],1,0);
  function well(cx, base, s, c, o={}){
    const P = n=>n*s, r = P(80), ry = P(18), top = base-P(86), px = r+P(8), ph = top-P(150);
    const body = `M${cx-r} ${top} V${base} A${r} ${ry} 0 0 0 ${cx+r} ${base} V${top} Z`;
    let p = `<ellipse cx="${cx}" cy="${base+P(8)}" rx="${r+P(40)}" ry="${P(18)}" fill="#000" opacity=".22"/>`;
    if(o.mud) p += `<ellipse cx="${cx+P(20)}" cy="${base+P(10)}" rx="${r+P(110)}" ry="${P(30)}" fill="#5b4a2c" opacity=".6"/>`;
    p += `<path d="${body}" fill="${c.ring}"/>`;
    if(o.brick) for(let i=0;i<4;i++){ const y = top+P(10)+P(19)*i; for(let k=0;k<7;k++){ const x = cx-r+P(12)+k*P(24)+(i%2)*P(12); if(x<cx+r-P(6)) p += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+P(17)}" stroke="${c.line}" stroke-width="${P(1.6)}" opacity=".5"/>`; } }
    for(let i=1;i<4;i++){ const y = top+(base-top)*i/4; p += `<path d="M${cx-r} ${y} A${r} ${ry} 0 0 0 ${cx+r} ${y}" fill="none" stroke="${c.line}" stroke-width="${P(2.4)}" opacity=".55"/>`; }
    if(o.algae) for(const [dx,dy,w] of [[-.7,.62,.3],[-.2,.82,.25],[.35,.7,.35],[.75,.55,.2]]) p += `<ellipse cx="${cx+dx*r}" cy="${top+(base-top)*dy}" rx="${w*r*.5}" ry="${P(9)}" fill="#4f7a3a" opacity=".6"/>`;
    if(o.mud){ const y = top+(base-top)*.5; p += `<path d="M${cx-r} ${y} A${r} ${ry} 0 0 0 ${cx+r} ${y} V${base} A${r} ${ry} 0 0 1 ${cx-r} ${base} Z" fill="#6b5330" opacity=".6"/>`; }
    p += `<path d="${body}" fill="url(#wl-sh)"/>`;
    const water = o.murky ? '#5f4e2c' : '#16232a';
    p += `<ellipse cx="${cx}" cy="${top}" rx="${r}" ry="${ry}" fill="${c.rim}"/><ellipse cx="${cx}" cy="${top+P(1)}" rx="${r-P(10)}" ry="${ry-P(6)}" fill="${water}"/>`;
    if(o.lid){
      const cr = o.lid==='cracked';
      p += `<g transform="rotate(${cr?-7:-2} ${cx} ${top})"><ellipse cx="${cx-P(6)}" cy="${top+P(2)}" rx="${r*.96}" ry="${ry*.95}" fill="${c.lidDark}"/><ellipse cx="${cx-P(6)}" cy="${top-P(6)}" rx="${r*.96}" ry="${ry*.95}" fill="${c.lid}"/>`;
      if(cr) p += `<path d="M${cx-r*.7} ${top-P(9)} l${P(30)} ${P(8)} l${P(18)} ${-P(9)} l${P(26)} ${P(10)} l${P(20)} ${-P(6)}" fill="none" stroke="#3a3530" stroke-width="${P(2.5)}"/><path d="M${cx+r*.25} ${top-P(14)} L${cx+r*.86} ${top-P(6)} L${cx+r*.7} ${top+P(8)} Z" fill="${water}"/>`;
      p += `</g>`;
    }
    p += `<rect x="${cx-px-P(7)}" y="${ph}" width="${P(14)}" height="${base-ph}" fill="${c.post}"/><rect x="${cx+px-P(7)}" y="${ph}" width="${P(14)}" height="${base-ph}" fill="${c.post}"/>`;
    p += `<rect x="${cx-px-P(18)}" y="${ph-P(6)}" width="${2*px+P(36)}" height="${P(13)}" rx="${P(3)}" fill="${c.post}"/>`;
    if(o.roof) p += `<path d="M${cx-px-P(40)} ${ph-P(4)} L${cx} ${ph-P(70)} L${cx+px+P(40)} ${ph-P(4)} Z" fill="${o.roof}"/><path d="M${cx-px-P(40)} ${ph-P(4)} L${cx} ${ph-P(70)} L${cx+px+P(40)} ${ph-P(4)}" fill="none" stroke="#3a2416" stroke-width="${P(5)}" stroke-linejoin="round"/>`;
    const bx = cx+P(14), by = top-P(80);
    p += `<line x1="${cx}" y1="${ph+P(7)}" x2="${cx}" y2="${ph}" stroke="#333" stroke-width="${P(4)}"/><circle cx="${cx}" cy="${ph+P(22)}" r="${P(15)}" fill="#5c6166"/><circle cx="${cx}" cy="${ph+P(22)}" r="${P(5)}" fill="#2a2a2a"/>`;
    p += `<line x1="${bx}" y1="${ph+P(22)}" x2="${bx}" y2="${by}" stroke="#d9c79a" stroke-width="${P(2.5)}"/>`;
    p += `<path d="M${bx-P(17)} ${by} Q${bx} ${by-P(18)} ${bx+P(17)} ${by}" fill="none" stroke="#333" stroke-width="${P(2)}"/><path d="M${bx-P(17)} ${by} H${bx+P(17)} L${bx+P(13)} ${by+P(34)} H${bx-P(13)} Z" fill="${c.bucket}"/>`;
    return p;
  }

  /* ===== บ่อน้ำวัด (W1) ===== */
  SC.well_temple = function(v){
    const bad = v==='bad';
    const d = WDEF + lin('wt-sky',[[0,'#8cb6cf'],[.6,'#dfe6d6'],[1,'#f2e3bf']]) + lin('wt-gr',[[0,'#b7a37c'],[1,'#5e4d36']]);
    let b = `<rect width="1600" height="900" fill="url(#wt-sky)"/>` + clouds([[300,140,360],[1100,90,420],[1450,210,260]], '#fff', .6);
    b += ubosot(1010, 560, .52, {base:'#d9c7a8', baseDark:'#9b7f5c', wall:'#efe3cd', win:'#5b1d14', gold:'#e2b24f', goldDark:'#9a6e1f', shade:'#c9b593',
      door:'#3b120c', col:'#f3e9d6', roof1:'#b8452a', roof2:'#a63c26', tileLine:'#5a1a0e', green:'#2f6a4c', pediment:'#7a1f14'});
    b += bigTree(250, 585, 1.2, '#55694a') + bigTree(1500, 585, .95, '#4c6043');
    // กำแพงแก้ว
    b += `<rect y="508" width="1600" height="70" fill="#eee6d5"/><rect y="568" width="1600" height="10" fill="#cbbd9f"/>`;
    for(let x=6;x<1600;x+=60) b += `<path d="M${x} 509 v-14 q20 -20 40 0 v14 Z" fill="#eee6d5"/>`;
    b += `<rect y="578" width="1600" height="322" fill="url(#wt-gr)"/>`;
    // กุฏิ + ราวตากจีวร
    b += house(1130, 700, 250, 1, {post:'#4a2e18', dark:'#4a2e18', wall:'#9a6a3e', win:'#2a1a0f', roof:'#6a3a22', gable:'#8a5530', trim:'#d9b26a'});
    b += `<path d="M1420 560 V700 M1560 560 V700" stroke="#4a2e18" stroke-width="7"/><path d="M1420 572 Q1490 588 1560 572" stroke="#4a2e18" stroke-width="2" fill="none"/><path d="M1440 578 h44 v62 h-44 Z M1498 582 h42 v54 h-42 Z" fill="#e0861c"/>`;
    for(let i=0;i<6;i++) b += `<ellipse cx="${940+i*44}" cy="${880-i*30}" rx="${46-i*4}" ry="${12-i}" fill="#d3c7aa" opacity=".8"/>`;
    if(bad){ // บ่อเกรอะของกุฏิอยู่ชิดบ่อ น้ำซึมเป็นทาง
      b += `<g transform="translate(930 770)"><ellipse rx="66" ry="16" fill="#7f7a70"/><rect x="-66" y="-36" width="132" height="36" fill="#a29c91"/><ellipse cy="-36" rx="66" ry="16" fill="#bdb7aa"/><ellipse cy="-38" rx="34" ry="8" fill="#7f7a70"/></g>`;
      b += `<path d="M872 784 Q800 800 748 806" stroke="#5a4a2a" stroke-width="12" fill="none" opacity=".5" stroke-linecap="round"/>`;
      for(const [x,y,w] of [[430,840,170],[800,866,130]]) b += `<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="11" fill="#6c5a3a" opacity=".55"/>`;
    }
    b += well(620, 790, 1.3, {ring:'#ad5a3b', line:'#6a301f', rim:'#cbc3b2', lid:'#bfb8aa', lidDark:'#8f897d', post:'#5a3a22', bucket:'#3f7fb4'}, {brick:true, lid:bad?'cracked':'closed', murky:bad, roof:'#8a3a24'});
    b += stake(290, 830, 'บ่อน้ำวัด');
    b += bush(-40, 905, 300, 70, '#3f5236') + bush(1340, 905, 300, 60, '#3f5236');
    return wrap(d, b);
  };

  /* ===== บ่อน้ำตลาด (W2) ===== */
  SC.well_market = function(v){
    const bad = v==='bad';
    const d = WDEF + lin('wm-sky',[[0,'#f0d7a6'],[1,'#e8bd80']]) + lin('wm-gr',[[0,'#a19b8e'],[1,'#57534b']]) + lin('wm-in',[[0,'#2c241c'],[1,'#4a3a2a']]);
    let b = `<rect width="1600" height="900" fill="url(#wm-sky)"/>` + clouds([[260,110,340],[1250,80,400]], '#fff4dc', .55);
    b += palm(120, 290, 200, 20, '#6c7a5c', .7) + palm(1500, 290, 190, -20, '#6c7a5c', .7);
    // โรงตลาด
    b += `<rect y="262" width="1600" height="62" fill="#7d8990"/>`;
    for(let x=10;x<1600;x+=26) b += `<line x1="${x}" y1="262" x2="${x}" y2="324" stroke="#5c676d" stroke-width="2"/>`;
    b += `<rect y="320" width="1600" height="12" fill="#4c555a"/><rect y="332" width="1600" height="268" fill="url(#wm-in)"/>`;
    for(const x of [80,400,720,1040,1360]) b += `<rect x="${x-8}" y="332" width="16" height="268" fill="#3a3a38"/>`;
    b += fig(260, 520, .75, '#1d1610') + fig(900, 525, .8, '#1d1610') + fig(1240, 520, .72, '#1d1610');
    for(let i=0;i<5;i++){ const x = 110+i*320; b += `<rect x="${x}" y="520" width="240" height="18" fill="#8a5a33"/><rect x="${x+10}" y="538" width="220" height="62" fill="#5a3a22"/>`;
      for(let k=0;k<8;k++) b += `<circle cx="${x+22+k*28}" cy="${510-(k%2)*6}" r="12" fill="${['#e2573f','#6aa84f','#f1c232','#e69138'][(i+k)%4]}"/>`; }
    b += board(800, 236, 460, 54, 'ตลาดสดบ้านสุขใจ', '#1f5ea8', '#fff', 32, '#e8e0c8');
    b += `<rect y="600" width="1600" height="300" fill="url(#wm-gr)"/>`;
    // รางระบายน้ำ
    b += `<path d="M0 700 L1600 655 L1600 690 L0 742 Z" fill="#3e4a3c"/><path d="M0 700 L1600 655" stroke="#c9c4b8" stroke-width="5"/><path d="M0 742 L1600 690" stroke="#8a857a" stroke-width="4"/>`;
    for(let i=0;i<8;i++) b += `<rect x="${i*200+40}" y="${714-i*5.6}" width="90" height="3" fill="#7f9a6a" opacity=".5"/>`;
    if(bad){ // ท่อน้ำเสียของตลาดแตก รั่วซึมเข้าหาปากบ่อ
      b += `<path d="M1080 560 V690 Q1080 716 1050 724 L980 742" fill="none" stroke="#6f7478" stroke-width="22"/><path d="M1016 722 l10 -10 l6 14 l9 -12" stroke="#2a2a2a" stroke-width="3" fill="none"/>`;
      b += `<path d="M1000 744 Q960 790 900 812 Q860 832 930 840 Q1010 828 1040 790 Z" fill="#3c4630" opacity=".7"/>` + flies(1010, 760, 7);
    }
    b += well(860, 800, 1.15, {ring:'#a8a59c', line:'#6e6b63', rim:'#cdc9be', lid:'#b5b1a6', lidDark:'#8a867c', post:'#4f4a44', bucket:'#d0453a'}, {lid:'closed', algae:!bad});
    b += crate(120, 790, '#c8372a') + crate(140, 734, '#2c63b5') + crate(250, 800, '#e7a92a');
    b += `<path d="M1300 800 h70 l-8 64 h-54 Z" fill="#2c63b5"/><ellipse cx="1335" cy="800" rx="35" ry="8" fill="#5a8ad0"/>`;
    b += `<g transform="translate(1450 860)"><rect x="-80" y="-60" width="160" height="40" fill="#8a5a33"/><circle cx="-50" cy="-12" r="16" fill="#222"/><circle cx="50" cy="-12" r="16" fill="#222"/><path d="M80 -50 l50 -40" stroke="#5a3a22" stroke-width="8"/></g>`;
    b += stake(560, 840, 'บ่อน้ำตลาด');
    return wrap(d, b);
  };

  /* ===== บ่อน้ำริมคลอง (W3) ===== */
  SC.well_canal = function(v){
    const bad = v==='bad';
    const d = WDEF + lin('wc-sky',[[0,'#9fbfd2'],[.6,'#e7dcc0'],[1,'#f3dcae']]) + lin('wc-water',[[0,'#8fa9a2'],[.4,'#62807b'],[1,'#2f4a47']]) + lin('wc-bank',[[0,'#8a7a4e'],[1,'#4a3e26']]);
    let b = `<rect width="1600" height="900" fill="url(#wc-sky)"/>` + clouds([[420,130,380],[1200,100,440]], '#fff', .55);
    b += `<path d="M0 560 Q200 520 420 548 T860 536 T1300 548 T1600 530 V620 H0 Z" fill="#6f7f62"/>`;
    for(let i=0;i<9;i++) b += palm(80+i*190, 600, 150+(i%3)*30, i%2?16:-18, '#56664c', .7);
    b += `<rect y="596" width="1600" height="304" fill="url(#wc-water)"/>`;
    for(let i=0;i<30;i++){ const y = 620+((i*53)%270), x = (i*197)%900; b += `<rect x="${x}" y="${y}" width="${50+(i%5)*26}" height="2" fill="#e8f0e8" opacity="${.12+(i%4)*.05}"/>`; }
    b += house(60, 700, 220, .95, {post:'#3b2615', dark:'#3b2615', wall:'#8a5a33', win:'#2a1a0f', roof:'#5a3a24', gable:'#7a4e2c', trim:'#c7a066'});
    b += house(320, 690, 170, .8, {post:'#3b2615', dark:'#3b2615', wall:'#7d5130', win:'#2a1a0f', roof:'#4d3220', gable:'#6e4428', trim:'#b48d55'});
    b += `<g transform="translate(470 800)"><path d="M-150 0 Q0 24 170 -6 L190 -18 Q20 6 -160 -10 Z" fill="#3a2414"/>${seated(10,-4,.7,'#2a1a0f')}<path d="M-60 -60 Q-40 -76 -20 -60 Z" fill="#c9a76a"/><line x1="40" y1="-40" x2="120" y2="30" stroke="#2a1a0f" stroke-width="5"/></g>`;
    // ตลิ่งฝั่งขวา
    b += `<path d="M640 900 Q700 720 820 660 Q1000 612 1600 606 V900 Z" fill="url(#wc-bank)"/><path d="M640 900 Q700 720 820 660 Q1000 612 1600 606" fill="none" stroke="#3a3020" stroke-width="5" opacity=".6"/>`;
    for(let i=0;i<14;i++){ const x = 860+i*52, y = 640+(i%3)*8; b += `<path d="M${x} ${y} l-6 -18 M${x} ${y} l2 -22 M${x} ${y} l9 -16" stroke="#5f7a3e" stroke-width="3"/>`; }
    b += palm(1480, 690, 330, -30, '#3c4a33', 1) + banana(1330, 700, 1, '#40553a');
    if(bad){ // น้ำคลองเคยท่วมถึงขอบบ่อ ทิ้งคราบโคลนและเศษใบไม้เป็นแนว
      b += `<path d="M760 760 Q900 712 1080 730 Q1250 744 1400 708" stroke="#4a3a22" stroke-width="16" fill="none" opacity=".45" stroke-linecap="round"/>`;
      for(let i=0;i<10;i++) b += `<path d="M${800+i*60} ${740-(i%3)*6} l18 -4" stroke="#3a2a14" stroke-width="4"/>`;
    }
    b += well(1080, 810, 1.2, {ring:'#9d988b', line:'#66625a', rim:'#c6c1b4', lid:'#b3aea2', lidDark:'#888378', post:'#4a3a28', bucket:'#3f7fb4'}, {lid:bad?false:'closed', mud:bad, murky:bad});
    b += stake(850, 870, 'บ่อน้ำริมคลอง');
    return wrap(d, b);
  };

  /* ===== ร้านส้มตำป้าแดง (R1) ===== */
  SC.somtam = function(v){
    const bad = v==='bad';
    const d = lin('st-sky',[[0,'#7fb3d8'],[.65,'#d9ecf0'],[1,'#f3ecd0']]) + lin('st-gr',[[0,'#b39469'],[1,'#6a5236']]) + lin('st-roof',[[0,'#aab3b8'],[1,'#7d878c']]) +
      lin('st-glass',[[0,'#e6f6fb',.55],[1,'#bfe0ea',.25]],1,1);
    let b = `<rect width="1600" height="900" fill="url(#st-sky)"/>` + clouds([[260,120,380],[980,80,460],[1440,160,280]], '#fff', .7);
    for(let i=0;i<16;i++) b += palm(40+i*104, 562, 90+(i%4)*20, i%2?10:-12, '#6e8a5a', .45);
    b += paddy(556, 690, '#93b356', '#5f7f36');
    b += `<rect y="690" width="1600" height="210" fill="url(#st-gr)"/>`;
    // ผนังไม้ไผ่ เสา หลังคาสังกะสี
    b += `<rect x="350" y="372" width="900" height="200" fill="#c7a46a"/>`;
    for(let x=360;x<1250;x+=18) b += `<line x1="${x}" y1="372" x2="${x}" y2="572" stroke="#a3824e" stroke-width="3"/>`;
    b += board(1100, 440, 220, 92, '', '#2a2a26', '#fff', 1) + txt(1100, 424, 'ส้มตำไทย ๔๐', 20, '#f5f0dc', 500) + txt(1100, 452, 'ส้มตำปู ๔๐', 20, '#f5f0dc', 500) + txt(1100, 478, 'ไก่ย่าง ๘๐', 20, '#f5f0dc', 500);
    for(const x of [340,800,1260]) b += `<rect x="${x-8}" y="330" width="16" height="384" fill="#6b4426"/>`;
    b += `<path d="M300 330 L1300 300 L1320 350 L280 382 Z" fill="url(#st-roof)"/>`;
    for(let i=0;i<34;i++){ const t = i/34, x1 = 300+1000*t, y1 = 330-30*t, x2 = 280+1040*t, y2 = 382-32*t; b += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6f797e" stroke-width="2"/>`; }
    b += `<path d="M640 306 V322 M960 296 V312" stroke="#5a3a22" stroke-width="6"/>` + board(800, 268, 400, 64, 'ส้มตำป้าแดง', '#c8372a', '#fff3d6', 40, '#f2c13d');
    for(const x of [520,1080]) b += `<line x1="${x}" y1="370" x2="${x}" y2="398" stroke="#333" stroke-width="2"/><circle cx="${x}" cy="404" r="8" fill="#fff4cc"/>`;
    // แม่ค้าหลังเคาน์เตอร์
    b += fig(560, 590, 1, '#3a2418') + `<path d="M532 470 h56 v70 h-56 Z" fill="#e9e1cf" opacity=".9"/>`;
    // ตู้กระจก
    b += `<rect x="650" y="402" width="280" height="160" fill="url(#st-glass)" stroke="#cfd4d7" stroke-width="8"/><line x1="654" y1="482" x2="926" y2="482" stroke="#cfd4d7" stroke-width="5"/>`;
    for(let i=0;i<5;i++) b += `<rect x="${672+i*50}" y="${440}" width="36" height="38" rx="4" fill="#f5efe0" opacity=".9"/><rect x="${672+i*50}" y="${452}" width="36" height="8" fill="${['#e2573f','#6aa84f','#e9b54b','#e2573f','#6aa84f'][i]}"/>`;
    const jar = (x, y, lid) => `<rect x="${x-22}" y="${y-50}" width="44" height="50" rx="6" fill="#6b4a22" opacity=".8"/><rect x="${x-22}" y="${y-50}" width="44" height="50" rx="6" fill="none" stroke="#e8f2f4" stroke-width="2"/><path d="M${x-12} ${y-18} q12 -16 24 0 Z" fill="#e0773a"/>${lid?`<rect x="${x-24}" y="${y-58}" width="48" height="10" rx="3" fill="#2c63b5"/>`:''}`;
    if(bad) b += `<rect x="664" y="500" width="240" height="56" fill="#d9e6e2" opacity=".5"/>` + [690,740,790,840,880].map(x=>`<rect x="${x-14}" y="510" width="28" height="44" rx="4" fill="${x%100?'#7a3a1a':'#c8a24a'}" opacity=".85"/>`).join('');
    else b += jar(710, 554, true) + jar(790, 554, true) + jar(870, 554, true);
    // เคาน์เตอร์ ครก
    b += `<rect x="400" y="560" width="560" height="16" fill="#9a6a3e"/><rect x="410" y="576" width="540" height="136" fill="#7a4e2c"/>`;
    for(let x=430;x<950;x+=54) b += `<line x1="${x}" y1="580" x2="${x}" y2="710" stroke="#5a361c" stroke-width="2"/>`;
    b += `<path d="M430 512 h96 q-4 44 -48 48 q-44 -4 -48 -48 Z" fill="#7a3e22"/><ellipse cx="478" cy="512" rx="48" ry="9" fill="#5a2c16"/><rect x="488" y="454" width="12" height="74" rx="5" fill="#b08458" transform="rotate(22 494 490)"/>`;
    if(bad) b += jar(574, 558, false) + jar(624, 558, false) + flies(600, 500, 8);
    // กระจาดมะละกอ มะเขือเทศ ถั่วฝักยาว
    b += `<ellipse cx="520" cy="742" rx="80" ry="22" fill="#a87f42"/><path d="M440 742 q80 40 160 0 v-6 h-160 Z" fill="#8a6430"/>`;
    for(let i=0;i<5;i++) b += `<ellipse cx="${470+i*26}" cy="${728-(i%2)*8}" rx="20" ry="13" fill="#6f9a3e"/>`;
    b += `<ellipse cx="880" cy="742" rx="70" ry="20" fill="#a87f42"/><path d="M810 742 q70 36 140 0 v-6 h-140 Z" fill="#8a6430"/>`;
    for(let i=0;i<6;i++) b += `<circle cx="${838+i*16}" cy="${730-(i%2)*6}" r="10" fill="#d8402e"/>`;
    for(let i=0;i<8;i++) b += `<path d="M${845+i*6} 724 q10 -30 40 -34" stroke="#4f8a3a" stroke-width="3" fill="none"/>`;
    // กระติกน้ำแข็ง
    b += `<rect x="250" y="650" width="110" height="64" rx="6" fill="#2c63b5"/><rect x="246" y="640" width="118" height="16" rx="5" fill="#f3efe2"/>` + txt(305, 692, 'น้ำแข็ง', 18, '#fff');
    // โต๊ะลูกค้า
    for(const x of [1060,1220]){ b += seated(x-50, 712, .9, '#2c1e14') + table(x, 720, 150, 1, '#c9ced1', '#8a9094') + stool(x+70, 722, .9, '#c8372a', '#e35a4c');
      b += `<path d="M${x-14} 650 l14 -26 l14 26 Z" fill="#c9a76a"/><ellipse cx="${x+30}" cy="652" rx="22" ry="6" fill="#f3efe2"/>`; }
    b += moto(1460, 790, 1.1, '#2a2620');
    return wrap(d, b);
  };

  /* ===== ก๋วยเตี๋ยวเรือลุงชัย (R2) ===== */
  SC.noodle_boat = function(v){
    const bad = v==='bad';
    const d = lin('nb-sky',[[0,'#86b4cf'],[.7,'#dfe9e2'],[1,'#efe6c8']]) + lin('nb-water',[[0,'#7f9c94'],[.5,'#56766f'],[1,'#2a403c']]) + lin('nb-wall',[[0,'#b58a58'],[1,'#8a6238']]) + lin('nb-roof',[[0,'#6e3420'],[1,'#9a4b2c']]);
    let b = `<rect width="1600" height="900" fill="url(#nb-sky)"/>` + clouds([[300,90,360],[1300,120,420]], '#fff', .6);
    b += palm(120, 330, 230, 20, '#5d7650', .8) + palm(1500, 330, 250, -20, '#5d7650', .85);
    b += `<rect y="470" width="1600" height="170" fill="#5d7650"/>` + bush(0, 490, 1600, 60, '#5d7650');
    b += `<rect y="630" width="1600" height="270" fill="url(#nb-water)"/>`;
    for(let i=0;i<34;i++){ const y = 660+((i*53)%230), x = (i*197)%1600; b += `<rect x="${x}" y="${y}" width="${50+(i%5)*26}" height="2" fill="#eaf2ea" opacity="${.12+(i%4)*.05}"/>`; }
    // ศาลาร้านริมน้ำ
    for(let x=150;x<1480;x+=100) b += `<rect x="${x}" y="636" width="14" height="90" fill="#3a2616"/><rect x="${x}" y="726" width="14" height="40" fill="#3a2616" opacity=".3"/>`;
    b += `<rect x="170" y="322" width="1260" height="286" fill="url(#nb-wall)"/>`;
    for(let y=344;y<608;y+=22) b += `<line x1="170" y1="${y}" x2="1430" y2="${y}" stroke="#6e4a2a" stroke-width="2" opacity=".6"/>`;
    for(const x of [250,1190]) b += `<rect x="${x}" y="380" width="160" height="96" fill="#6f8a5f" stroke="#5a3a22" stroke-width="6"/>`;
    b += `<path d="M90 324 L1510 324 L1420 232 L180 232 Z" fill="url(#nb-roof)"/>`;
    for(let i=1;i<14;i++) b += `<line x1="${180+i*88}" y1="232" x2="${90+i*101}" y2="324" stroke="#4a2414" stroke-width="2" opacity=".4"/>`;
    b += `<rect x="90" y="318" width="1420" height="18" fill="#4e2e1a"/>`;
    for(const x of [160,600,1000,1440]) b += `<rect x="${x-9}" y="336" width="18" height="272" fill="#5a3a22"/>`;
    b += board(800, 364, 470, 52, 'ก๋วยเตี๋ยวเรือลุงชัย', '#1d3f6a', '#f3d27a', 32, '#c9a050');
    b += `<rect x="120" y="604" width="1360" height="32" fill="#6e4a2c"/><rect x="120" y="630" width="1360" height="8" fill="#3a2616"/>`;
    // ลุงชัยหลังเรือ
    b += fig(800, 566, .9, '#2e2016');
    // เรือก๋วยเตี๋ยว
    b += `<path d="M540 520 q-26 -8 -30 -36 M1060 520 q26 -8 30 -36" stroke="#7a3f1f" stroke-width="14" fill="none" stroke-linecap="round"/>`;
    b += `<path d="M540 520 Q800 552 1060 520 L1020 606 H580 Z" fill="#7a3f1f"/><path d="M552 542 Q800 574 1048 542" stroke="#c8372a" stroke-width="10" fill="none"/><path d="M566 568 Q800 596 1034 568" stroke="#e2b24f" stroke-width="4" fill="none"/>`;
    for(const x of [700,890]) b += `<rect x="${x-58}" y="452" width="116" height="74" fill="#b9c1c6"/><rect x="${x-58}" y="452" width="20" height="74" fill="#fff" opacity=".25"/><ellipse cx="${x}" cy="452" rx="58" ry="12" fill="#dfe5e8"/><ellipse cx="${x}" cy="448" rx="48" ry="9" fill="#7f6a4a"/>` + steam(x, 430);
    for(let i=0;i<4;i++) b += `<path d="M${978-i*2} ${510-i*12} h${44+i*4} l-6 12 h${-32-i*4} Z" fill="#f4f1ea" stroke="#3f6fb4" stroke-width="2"/>`;
    for(let i=0;i<4;i++) b += `<rect x="${596+i*18}" y="490" width="14" height="24" rx="3" fill="${['#c8372a','#e9b54b','#6b3a1a','#f3efe2'][i]}"/>`;
    // ตะกร้าผักสด (ถั่วงอก ผักบุ้ง)
    b += `<path d="M1090 560 h150 l-14 44 h-122 Z" fill="#b08a4a"/><path d="M1090 560 h150" stroke="#8a6430" stroke-width="6"/>`;
    for(let i=0;i<14;i++) b += `<path d="M${1100+i*9} 560 q4 -18 10 -22" stroke="#efe8cf" stroke-width="3" fill="none"/>`;
    for(let i=0;i<6;i++) b += `<ellipse cx="${1180+i*10}" cy="${548-(i%2)*8}" rx="14" ry="7" fill="#4f8a3a" transform="rotate(${-30+i*12} ${1180+i*10} ${548-(i%2)*8})"/>`;
    // โต๊ะลูกค้า
    for(const x of [330,1320]){ b += seated(x-60, 600, .9, '#2c1e14') + table(x, 606, 150, 1, '#d84a3a', '#7a2a20') + stool(x+70, 608, .9, '#2c63b5', '#4f86d6') + `<ellipse cx="${x}" cy="538" rx="22" ry="6" fill="#f4f1ea"/>`; }
    if(bad){ // ล้างผักด้วยน้ำคลองหลังร้าน
      b += `<path d="M1480 606 h30 v26 h28 v26" fill="none" stroke="#6e4a2c" stroke-width="12"/>`;
      b += `<ellipse cx="1530" cy="702" rx="62" ry="14" fill="#9aa3a8"/><ellipse cx="1530" cy="698" rx="54" ry="10" fill="#6f8c7a"/>`;
      for(let i=0;i<6;i++) b += `<ellipse cx="${1496+i*13}" cy="${694-(i%2)*4}" rx="12" ry="6" fill="#4f8a3a"/>`;
      b += `<ellipse cx="1530" cy="716" rx="90" ry="10" fill="none" stroke="#dbe6de" stroke-width="2" opacity=".5"/>`;
    }
    return wrap(d, b);
  };

  /* ===== ข้าวมันไก่เจ๊หมวย (R3) ===== */
  SC.chicken_rice = function(v){
    const bad = v==='bad';
    const d = lin('cr-sky',[[0,'#8bb8d6'],[1,'#e6ecdf']]) + lin('cr-road',[[0,'#6a6864'],[1,'#3e3c39']]) + lin('cr-glass',[[0,'#f3fbff',.45],[1,'#cfe6ee',.2]],1,1) + lin('cr-in',[[0,'#3a2818'],[1,'#5a3e26']]);
    let b = `<rect width="1600" height="900" fill="url(#cr-sky)"/>` + clouds([[220,80,300],[1360,70,360]], '#fff', .6);
    // ตึกแถว ๓ ห้อง
    b += `<rect x="90" y="150" width="1420" height="510" fill="#e3d2b0"/><rect x="80" y="132" width="1440" height="26" fill="#cbb791"/>`;
    for(let u=0;u<3;u++){ const x0 = 90+u*473;
      for(let k=0;k<3;k++){ const wx = x0+60+k*130; b += `<rect x="${wx}" y="190" width="100" height="150" fill="#3a3a38"/><rect x="${wx+4}" y="194" width="44" height="142" fill="#6f8f86"/><rect x="${wx+52}" y="194" width="44" height="142" fill="#6f8f86"/>`; for(let j=0;j<6;j++) b += `<line x1="${wx+4}" y1="${206+j*22}" x2="${wx+96}" y2="${206+j*22}" stroke="#4f6a62" stroke-width="2"/>`; }
      b += `<rect x="${x0+20}" y="356" width="433" height="6" fill="#8a7a5a"/>`; for(let j=0;j<18;j++) b += `<rect x="${x0+26+j*24}" y="362" width="5" height="30" fill="#8a7a5a"/>`;
    }
    b += `<rect x="90" y="392" width="1420" height="22" fill="#cbb791"/>`;
    for(const x of [90,563,1037,1494]) b += `<rect x="${x}" y="150" width="16" height="510" fill="#cdbb96"/>`;
    // ห้องซ้าย: ร้านโชห่วย · ห้องขวา: ปิดประตูเหล็ก
    b += `<rect x="106" y="414" width="457" height="246" fill="#2e2418"/><rect x="106" y="414" width="457" height="82" fill="#9aa1a5"/>`;
    for(let y=420;y<496;y+=9) b += `<line x1="106" y1="${y}" x2="563" y2="${y}" stroke="#7d8488" stroke-width="2"/>`;
    for(let r=0;r<3;r++) for(let i=0;i<11;i++) b += `<rect x="${126+i*38}" y="${514+r*44}" width="28" height="30" fill="${['#e2573f','#f1c232','#4fb3a0','#2c63b5','#e69138'][(i+r)%5]}" opacity=".85"/>`;
    b += `<rect x="1053" y="414" width="441" height="246" fill="#a3aaae"/>`;
    for(let y=420;y<660;y+=9) b += `<line x1="1053" y1="${y}" x2="1494" y2="${y}" stroke="#868d91" stroke-width="2"/>`;
    // ห้องกลาง: ร้านข้าวมันไก่
    b += `<rect x="579" y="414" width="458" height="246" fill="url(#cr-in)"/><rect x="620" y="430" width="160" height="6" rx="3" fill="#f6f6e8"/><rect x="840" y="430" width="160" height="6" rx="3" fill="#f6f6e8"/>`;
    b += `<rect x="900" y="520" width="100" height="70" fill="#8a9094"/><rect x="910" y="490" width="80" height="34" fill="#b9c1c6"/><ellipse cx="950" cy="490" rx="40" ry="8" fill="#dfe5e8"/>` + steam(950, 476, .8);
    b += `<path d="M560 414 L1056 414 L1090 466 L526 466 Z" fill="#c8372a"/>`;
    for(let i=0;i<10;i++){ const x1 = 560+i*49.6, x2 = 526+i*56.4; b += `<path d="M${x1} 414 L${x1+24.8} 414 L${x2+28.2} 466 L${x2} 466 Z" fill="#f4efe4"/>`; }
    b += board(808, 404, 430, 52, 'ข้าวมันไก่เจ๊หมวย', '#b8302a', '#ffe08a', 34, '#f2c13d');
    // เจ๊หมวย + รถเข็นตู้กระจกแขวนไก่
    b += fig(700, 640, 1, '#2a1c12');
    b += `<rect x="640" y="490" width="300" height="114" fill="url(#cr-glass)" stroke="#c9ced1" stroke-width="7"/><rect x="636" y="482" width="308" height="14" fill="#c8372a"/>`;
    b += `<line x1="650" y1="508" x2="930" y2="508" stroke="#8a9094" stroke-width="4"/>`;
    for(const x of [690,760,830,900]) b += `<line x1="${x}" y1="508" x2="${x}" y2="520" stroke="#555" stroke-width="2"/><path d="M${x} 518 q-26 10 -24 42 q4 30 24 34 q20 -4 24 -34 q2 -32 -24 -42 Z" fill="#e2b25a"/><path d="M${x-8} 530 q-10 16 -4 40" stroke="#f6d48a" stroke-width="5" fill="none" opacity=".7"/>`;
    b += `<rect x="636" y="604" width="308" height="70" fill="#b9bfc3"/><rect x="650" y="616" width="130" height="46" fill="#a3aaae"/><rect x="800" y="616" width="130" height="46" fill="#a3aaae"/><circle cx="670" cy="686" r="12" fill="#333"/><circle cx="910" cy="686" r="12" fill="#333"/>`;
    // เขียงข้างรถเข็น
    b += `<rect x="960" y="604" width="90" height="70" fill="#8a9094"/><ellipse cx="1005" cy="600" rx="52" ry="12" fill="#c9a06a"/><ellipse cx="1005" cy="596" rx="52" ry="12" fill="#ddb67e"/>`;
    b += `<path d="M984 592 h26 v-6 h-26 Z" fill="#f2d7a0"/><path d="M1020 588 l22 -4 l2 10 l-22 4 Z" fill="#c9ced1"/>`;
    if(bad) b += `<path d="M1000 596 q-14 -22 6 -30 q22 -4 26 18 q-8 16 -32 12 Z" fill="#f2a89a"/><path d="M1012 574 q6 6 2 14" stroke="#c96a5a" stroke-width="3" fill="none"/>` + flies(1010, 560, 6);
    // ทางเท้า ถนน
    b += `<rect y="660" width="1600" height="42" fill="#b0a998"/>`;
    for(let x=0;x<1600;x+=60) b += `<line x1="${x}" y1="660" x2="${x}" y2="702" stroke="#958f80" stroke-width="2"/>`;
    b += `<rect y="700" width="1600" height="14" fill="#8e887b"/><rect y="714" width="1600" height="186" fill="url(#cr-road)"/>`;
    for(let x=40;x<1600;x+=180) b += `<rect x="${x}" y="830" width="90" height="8" fill="#e8e2cc" opacity=".7"/>`;
    for(const x of [330,1260]){ b += seated(x-58, 700, .9, '#2c1e14') + table(x, 704, 150, 1, '#c9ced1', '#8a9094') + stool(x+66, 706, .9, '#c8372a', '#e35a4c') + `<ellipse cx="${x-10}" cy="634" rx="24" ry="6" fill="#f4f1ea"/>`; }
    // เสาไฟฟ้า สายไฟ
    b += `<rect x="1532" y="60" width="18" height="652" fill="#8a8a86"/><rect x="1490" y="90" width="100" height="10" fill="#6f6f6b"/>`;
    for(const [y0,sag] of [[94,40],[100,60],[94,80]]) b += `<path d="M1541 ${y0} Q800 ${y0+sag*2} -20 ${y0+10}" stroke="#2a2a28" stroke-width="2" fill="none"/>`;
    b += moto(190, 870, 1.25, '#1f1c18');
    return wrap(d, b);
  };

  /* ===== หมูกระทะริมทุ่ง (R4) — ยามพลบค่ำ ===== */
  SC.mookata = function(v){
    const bad = v==='bad';
    const d = lin('mt-sky',[[0,'#1c1838'],[.45,'#4a2c58'],[.78,'#c0566a'],[1,'#f2a066']]) + rad('mt-sun',[[0,'#ffd08a',.9],[1,'#ff8a5a',0]]) +
      lin('mt-gr',[[0,'#2e2620'],[1,'#100c0a']]) + rad('mt-bulb',[[0,'#fff2c2',.85],[1,'#ffc96b',0]]) + rad('mt-coal',[[0,'#ffd27a'],[.5,'#ff7a2a'],[1,'#a8301d',0]]);
    let b = `<rect width="1600" height="900" fill="url(#mt-sky)"/>`;
    for(let i=0;i<40;i++){ const x = (i*173)%1600, y = (i*67)%240; b += `<circle cx="${x}" cy="${y}" r="${(i%3)*.5+.6}" fill="#fff" opacity="${.25+(i%4)*.12}"/>`; }
    b += `<circle cx="1250" cy="610" r="260" fill="url(#mt-sun)"/>`;
    b += `<path d="M0 586 Q300 560 600 580 T1200 570 T1600 576 V660 H0 Z" fill="#2a3326"/>`;
    for(let i=0;i<10;i++) b += palm(60+i*170, 590, 120+(i%3)*30, i%2?12:-14, '#1b2219', .55);
    b += `<rect y="640" width="1600" height="260" fill="url(#mt-gr)"/>`;
    // โรงเรือน
    for(const x of [170,620,980,1430]) b += `<rect x="${x-9}" y="320" width="18" height="400" fill="#221d1a"/>`;
    b += `<path d="M120 300 L1480 280 L1490 322 L110 344 Z" fill="#3d4247"/>`;
    for(let i=0;i<44;i++){ const t = i/44; b += `<line x1="${120+1360*t}" y1="${300-20*t}" x2="${110+1380*t}" y2="${344-22*t}" stroke="#2a2e32" stroke-width="2"/>`; }
    b += `<circle cx="800" cy="232" r="220" fill="url(#mt-bulb)" opacity=".35"/>` + board(800, 232, 460, 64, 'หมูกระทะริมทุ่ง', '#7a1f14', '#ffe08a', 38, '#ffcf5a');
    for(let i=0;i<16;i++) b += `<circle cx="${574+i*30}" cy="198" r="4" fill="#fff4cc"/><circle cx="${574+i*30}" cy="266" r="4" fill="#fff4cc"/>`;
    // ไฟประดับ
    const cols = ['#ffd36b','#ff7a6b','#7ad1ff','#a6ff8a'];
    for(const [y0,y1,sag] of [[346,330,46],[352,340,90]]) { b += `<path d="M170 ${y0} Q800 ${(y0+y1)/2+sag*2} 1430 ${y1}" stroke="#141210" stroke-width="2" fill="none"/>`;
      for(let i=1;i<20;i++){ const t = i/20, x = 170+1260*t, y = y0+(y1-y0)*t+4*sag*t*(1-t); b += `<circle cx="${x}" cy="${y+6}" r="26" fill="url(#mt-bulb)" opacity=".35"/><circle cx="${x}" cy="${y+6}" r="5" fill="${cols[i%4]}"/>`; } }
    // บุฟเฟต์เนื้อสัตว์
    b += `<rect x="190" y="560" width="380" height="18" fill="#6a5a4a"/><rect x="200" y="578" width="360" height="130" fill="#3a302a"/>`;
    for(let i=0;i<6;i++) b += `<rect x="${200+i*60}" y="540" width="52" height="20" rx="3" fill="#c9ced1"/><rect x="${204+i*60}" y="534" width="44" height="12" rx="3" fill="${['#e98a8a','#f2b0a0','#7fbf5a','#e98a8a','#f6d48a','#f2b0a0'][i]}"/>`;
    if(bad) b += `<rect x="1460" y="640" width="110" height="70" fill="#4a3c30"/>` + [0,1,2].map(i=>`<rect x="${1468}" y="${616-i*20}" width="94" height="18" rx="3" fill="#c9ced1"/><rect x="${1474}" y="${610-i*20}" width="82" height="10" rx="3" fill="#e98a8a"/>`).join('') + flies(1515, 560, 8);
    else b += `<rect x="1458" y="460" width="112" height="250" rx="6" fill="#d9eef2" opacity=".9"/><rect x="1466" y="470" width="96" height="230" fill="#9fd0dc" opacity=".6"/>` + [0,1,2,3].map(i=>`<rect x="1474" y="${490+i*52}" width="80" height="14" rx="3" fill="#e98a8a" opacity=".9"/>`).join('');
    // โต๊ะเตาหมูกระทะ
    const grill = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${seated(-110,-14,1,'#140f0c')}${seated(110,-14,1,'#140f0c')}
      <rect x="-90" y="-60" width="180" height="12" fill="#5a4a3a"/><path d="M-78 -48 V0 M78 -48 V0" stroke="#3a302a" stroke-width="6"/>
      <circle cx="0" cy="-74" r="70" fill="url(#mt-coal)" opacity=".55"/><path d="M-40 -60 L-32 -80 H32 L40 -60 Z" fill="#2a2522"/><ellipse cx="0" cy="-82" rx="54" ry="10" fill="#8d9296"/>
      <path d="M-34 -84 Q0 -126 34 -84 Z" fill="#9aa0a5"/><path d="M-20 -88 Q0 -116 20 -88 M-8 -86 Q0 -120 8 -86" stroke="#6d7276" stroke-width="2" fill="none"/>
      <path d="M-10 -126 q-14 -22 2 -40 q12 -18 -4 -36" stroke="#d8d4cc" stroke-width="5" fill="none" opacity=".25"/></g>`;
    b += grill(780, 660, .9) + grill(1100, 660, .9) + grill(650, 800, 1.1) + grill(1020, 800, 1.1) + grill(1360, 820, 1.15);
    b += `<rect x="300" y="770" width="120" height="70" rx="6" fill="#c8372a"/><rect x="296" y="760" width="128" height="16" rx="5" fill="#f3efe2"/>`;
    return wrap(d, b);
  };

  /* ===== โรงอาหารโรงเรียนบ้านสุขใจ (S) — variant: 'tank' แท็งก์น้ำฝาแตก · 'food' อาหารวางทิ้งไว้ ===== */
  SC.school = function(v){
    const d = lin('sc-sky',[[0,'#86b6d6'],[.7,'#dbe9ea'],[1,'#f2ead2']]) + lin('sc-gr',[[0,'#cdbd98'],[1,'#8d7d5c']]) + lin('sc-tank',[[0,'#e6ebee'],[.5,'#c2cacf'],[1,'#8e979d']],1,0);
    let b = `<rect width="1600" height="900" fill="url(#sc-sky)"/>` + clouds([[380,90,380],[1240,70,420]], '#fff', .65);
    b += bigTree(110, 480, .95, '#5a7650') + bigTree(1520, 480, .85, '#56714c');
    // อาคารเรียน ๒ ชั้น
    b += `<rect x="220" y="196" width="1160" height="276" fill="#efe0b4"/><rect x="220" y="326" width="1160" height="16" fill="#c9b385"/>`;
    for(let f=0;f<2;f++) for(let i=0;i<10;i++){ const x = 262+i*110, y = f ? 356 : 216; b += `<rect x="${x}" y="${y}" width="78" height="88" fill="#2f5f9e"/><rect x="${x+5}" y="${y+5}" width="32" height="78" fill="#a9d0e2"/><rect x="${x+41}" y="${y+5}" width="32" height="78" fill="#a9d0e2"/>`; }
    b += `<path d="M190 198 L1410 198 L1350 112 L250 112 Z" fill="#a63c26"/><rect x="190" y="194" width="1220" height="12" fill="#6e2416"/>`;
    for(let i=1;i<16;i++) b += `<line x1="${250+i*69}" y1="112" x2="${190+i*76}" y2="198" stroke="#7a2a18" stroke-width="2" opacity=".4"/>`;
    b += board(800, 160, 380, 46, 'โรงเรียนบ้านสุขใจ', '#1f4aa8', '#fff', 28, '#e8e0c8');
    b += `<rect x="96" y="96" width="6" height="400" fill="#d8d8d0"/><circle cx="99" cy="94" r="7" fill="#e2b24f"/>` + thaiFlag(102, 104, 96);
    b += `<rect y="470" width="1600" height="430" fill="url(#sc-gr)"/>`;
    // โรงอาหาร
    for(const x of [270,590,910,1170]) b += `<rect x="${x-8}" y="530" width="16" height="262" fill="#d8d0bc"/>`;
    b += `<path d="M240 522 L1200 522 L1160 470 L280 470 Z" fill="#2f6a4c"/><rect x="240" y="520" width="960" height="12" fill="#1f4a34"/><rect x="230" y="780" width="980" height="18" fill="#bdb3a0"/>`;
    b += fig(510, 620, .95, '#2a2f3a') + `<path d="M486 520 h48 v70 h-48 Z" fill="#f3f1ea" opacity=".9"/>`;
    b += `<rect x="290" y="600" width="430" height="16" fill="#c9ced1"/><rect x="300" y="616" width="410" height="60" fill="#9aa2a7"/>`;
    for(const x of [360,610]) b += `<rect x="${x-40}" y="548" width="80" height="52" fill="#b9c1c6"/><ellipse cx="${x}" cy="548" rx="40" ry="8" fill="#dfe5e8"/>` + steam(x, 534, .7);
    if(v==='food'){ // ไก่ทอดวางทิ้งไว้บนโต๊ะในอุณหภูมิห้อง
      b += `<rect x="420" y="574" width="120" height="26" rx="3" fill="#c9ced1"/>` + [0,1,2,3,4].map(i=>`<ellipse cx="${436+i*22}" cy="${578-(i%2)*4}" rx="12" ry="8" fill="#c8862e"/>`).join('') + flies(480, 556, 8);
    }
    for(const [y,s] of [[706,1],[790,1.12]]){ b += `<g transform="translate(730 ${y}) scale(${s})"><rect x="-400" y="-62" width="800" height="10" fill="#d9d4c8"/><path d="M-380 -52 V0 M380 -52 V0 M0 -52 V0" stroke="#8a8f94" stroke-width="6"/><rect x="-400" y="-26" width="800" height="8" fill="#3f7fb4"/>`;
      for(let i=0;i<9;i++) b += `<rect x="${-370+i*86}" y="-70" width="46" height="8" rx="2" fill="#c9ced1"/>`; b += `</g>`; }
    for(const [x,y,s] of [[380,722,.55],[560,722,.5],[820,724,.55],[1010,722,.52],[470,812,.62],[880,814,.6]]) b += seated(x, y, s, '#3a2f28');
    // แท็งก์น้ำดื่ม + ก๊อกน้ำ
    b += `<path d="M1316 640 L1330 434 M1454 640 L1440 434 M1350 640 L1356 434 M1420 640 L1414 434" stroke="#6f7478" stroke-width="7"/><path d="M1330 520 L1440 600 M1440 520 L1330 600" stroke="#6f7478" stroke-width="3"/><rect x="1310" y="426" width="150" height="10" fill="#5a6064"/>`;
    b += `<rect x="1312" y="300" width="146" height="128" fill="url(#sc-tank)"/><ellipse cx="1385" cy="428" rx="73" ry="12" fill="#8e979d"/>`;
    for(const y of [330,366,400]) b += `<rect x="1312" y="${y}" width="146" height="4" fill="#7d868c"/>`;
    if(v==='tank') b += `<ellipse cx="1385" cy="300" rx="73" ry="12" fill="#c2cacf"/><path d="M1350 296 L1380 286 L1404 300 L1376 308 Z" fill="#2a2a28"/><path d="M1404 300 l30 -26 l14 10 l-26 24 Z" fill="#aeb6bb"/><path d="M1340 310 v40 M1420 308 v54" stroke="#9a6a3a" stroke-width="4" opacity=".7"/><path d="M1438 268 q10 -10 22 -2 l-8 6 Z" fill="#3a3530"/>`;
    else b += `<ellipse cx="1385" cy="300" rx="73" ry="12" fill="#dfe5e8"/><ellipse cx="1385" cy="294" rx="26" ry="6" fill="#aeb6bb"/>`;
    b += `<path d="M1385 440 V640" stroke="#8e979d" stroke-width="8"/><rect x="1260" y="640" width="250" height="18" fill="#c9ced1"/><rect x="1270" y="658" width="230" height="56" fill="#aab2b7"/>`;
    for(let i=0;i<4;i++) b += `<path d="M${1290+i*56} 640 v-12 h14" stroke="#6f7478" stroke-width="5" fill="none"/>`;
    b += board(1385, 690, 110, 30, 'น้ำดื่ม', '#2c63b5', '#fff', 20);
    b += fig(1300, 800, .55, '#3a2f28') + fig(1350, 806, .5, '#3a2f28') + fig(1470, 802, .56, '#3a2f28');
    return wrap(d, b);
  };

  /* ===== สวนผักลุงทอง (F3) ===== */
  SC.farm = function(v){
    const bad = v==='bad';
    const d = lin('fm-sky',[[0,'#8bbad6'],[.7,'#e1ecd8'],[1,'#f2e6c2']]) + lin('fm-water',[[0,'#8fa9a2'],[1,'#3d5a55']]) + lin('fm-soil',[[0,'#8a6a44'],[1,'#5a4128']]);
    let b = `<rect width="1600" height="900" fill="url(#fm-sky)"/>` + clouds([[320,110,380],[1150,80,440]], '#fff', .6);
    b += `<rect y="440" width="1600" height="90" fill="#6c8458"/>` + bush(0, 470, 1600, 50, '#6c8458');
    for(let i=0;i<8;i++) b += palm(100+i*200, 470, 120+(i%3)*30, i%2?12:-14, '#5a7048', .6);
    // คอกหมูบนตลิ่งไกล ๆ (ปล่อยน้ำทิ้งลงคลอง)
    if(bad) b += `<g transform="translate(1440 520)"><path d="M-90 -40 L0 -80 L90 -40 Z" fill="#7a5a3a"/><rect x="-80" y="-40" width="160" height="50" fill="#a88a62"/>${[-60,-30,0,30,60].map(x=>`<rect x="${x-3}" y="-30" width="6" height="40" fill="#5a3a22"/>`).join('')}<ellipse cx="-40" cy="0" rx="14" ry="9" fill="#e9a9a0"/><ellipse cx="20" cy="2" rx="14" ry="9" fill="#e9a9a0"/><path d="M80 6 Q110 20 120 50" stroke="#6f7478" stroke-width="10" fill="none"/></g>`;
    b += `<rect y="510" width="1600" height="390" fill="url(#fm-soil)"/>`;
    // แปลงผัก (มุมมองลึก)
    const crops = ['#4f8a3a','#9ccf5a','#3f7a4a'];
    for(let i=0;i<10;i++){ const t0 = Math.pow(i/10,1.7), t1 = Math.pow((i+1)/10,1.7), y0 = 520+380*t0, y1 = 520+380*t1, h = y1-y0, xr = 1180+(y0-520)*.62;
      b += `<rect x="-10" y="${y0}" width="${xr+10}" height="${h*.62}" fill="#3f5a2c" opacity=".55"/>`;
      const r = 4+h*.22, n = Math.floor(xr/(r*2.4));
      for(let k=0;k<n;k++) b += `<circle cx="${k*r*2.4+r}" cy="${y0+h*.3}" r="${r}" fill="${crops[i%3]}"/>`; }
    // คลอง
    b += `<path d="M1180 520 L1600 506 V900 H1420 Q1300 720 1180 520 Z" fill="url(#fm-water)"/>`;
    for(let i=0;i<12;i++){ const y = 560+i*28; b += `<rect x="${1260+i*16+(i%3)*30}" y="${y}" width="${60+(i%4)*20}" height="2" fill="#e8f0e8" opacity=".25"/>`; }
    if(bad){ b += `<path d="M1560 576 Q1540 600 1500 610" stroke="#4a4030" stroke-width="20" fill="none" opacity=".35"/>`; }
    // ศาลาเก็บผัก
    b += `<rect x="80" y="430" width="14" height="150" fill="#5a3a22"/><rect x="340" y="430" width="14" height="150" fill="#5a3a22"/><rect x="70" y="560" width="300" height="20" fill="#7a5232"/>`;
    b += `<path d="M40 438 L215 350 L394 438 Z" fill="#b89a5a"/>`;
    for(let i=0;i<14;i++) b += `<line x1="${60+i*24}" y1="438" x2="${215+(i-7)*6}" y2="356" stroke="#8a7040" stroke-width="2"/>`;
    for(const [x,c] of [[120,'#4f8a3a'],[200,'#9ccf5a'],[280,'#4f8a3a']]) b += `<path d="M${x-34} 556 h68 l-8 -38 h-52 Z" fill="#b08a4a"/><ellipse cx="${x}" cy="518" rx="30" ry="12" fill="${c}"/>`;
    // บ่อพักน้ำล้างผัก
    b += `<rect x="400" y="630" width="210" height="64" fill="#a9a397"/><rect x="412" y="636" width="186" height="20" fill="${bad?'#6e7a4a':'#7fa6a8'}"/>`;
    for(let i=0;i<5;i++) b += `<ellipse cx="${430+i*36}" cy="${646}" rx="14" ry="6" fill="#4f8a3a"/>`;
    // ระบบน้ำรดผัก
    if(bad) b += `<g><rect x="1150" y="620" width="70" height="44" rx="4" fill="#2f6a4c"/><circle cx="1166" cy="664" r="14" fill="#333"/><circle cx="1166" cy="664" r="5" fill="#888"/><path d="M1220 640 Q1280 650 1320 700" stroke="#2a2a2a" stroke-width="10" fill="none"/><path d="M1150 650 Q900 690 760 660 Q650 640 610 650" stroke="#2f6aa8" stroke-width="7" fill="none"/></g>`;
    else b += `<g><rect x="660" y="600" width="44" height="60" rx="4" fill="#2f6aa8"/><rect x="672" y="560" width="20" height="40" fill="#6f7478"/><path d="M682 560 V540 H640" stroke="#6f7478" stroke-width="8" fill="none"/><path d="M660 650 Q636 660 610 660" stroke="#2f6aa8" stroke-width="7" fill="none"/>${txt(682, 636, 'บาดาล', 14, '#fff')}</g>`;
    // หุ่นไล่กา ลุงทอง
    b += `<g transform="translate(900 640)"><rect x="-4" y="-120" width="8" height="120" fill="#5a3a22"/><rect x="-60" y="-96" width="120" height="7" fill="#5a3a22"/><path d="M-30 -96 h60 l-8 50 h-44 Z" fill="#c8372a"/><circle cy="-118" r="16" fill="#e2c38a"/><path d="M-36 -124 h72 l-36 -24 Z" fill="#c9a76a"/></g>`;
    b += `<g transform="translate(1030 760)">${fig(0,0,.95,'#2e2016')}<path d="M-40 -164 h80 l-40 -28 Z" fill="#c9a76a"/></g>`;
    b += stake(560, 800, 'สวนผักลุงทอง');
    return wrap(d, b);
  };

  /* ===== รพ.สต. บ้านสุขใจ ยามกลางวัน ===== */
  SC.clinic = function(){
    const d = lin('cl-sky',[[0,'#79acd2'],[.7,'#d6e6ea'],[1,'#efe7cf']]) + lin('cl-gr',[[0,'#b8ae98'],[1,'#6c6454']]);
    let b = `<rect width="1600" height="900" fill="url(#cl-sky)"/>` + clouds([[260,110,360],[1180,80,440]], '#fff', .7);
    b += palm(140, 690, 360, 30, '#4f6a45', 1.15) + palm(1460, 690, 330, -40, '#4f6a45', 1.05) + bush(1180, 690, 260, 70, '#5f7d52') + bush(200, 690, 200, 60, '#5f7d52');
    b += `<rect y="690" width="1600" height="210" fill="url(#cl-gr)"/>`;
    b += `<path d="M330 430 L800 330 L1270 430 Z" fill="#a8452a"/><path d="M300 440 L800 326 L1300 440" fill="none" stroke="#6e2a18" stroke-width="10"/>`;
    b += `<rect x="360" y="430" width="880" height="260" fill="#f1e9d6"/><rect x="360" y="660" width="880" height="30" fill="#2f6a8a"/>`;
    b += `<rect x="520" y="372" width="560" height="54" rx="3" fill="#1d5f58"/><rect x="526" y="378" width="548" height="42" rx="2" fill="none" stroke="#e8e0c8" stroke-width="1.5"/>`;
    b += txt(800, 407, 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านสุขใจ', 24, '#f3eedd');
    for(const wx of [400,530,930,1060,1170]) b += `<rect x="${wx}" y="480" width="90" height="110" fill="#9fc7da"/><path d="M${wx} 535 H${wx+90} M${wx+45} 480 V590" stroke="#5a4a3a" stroke-width="4"/><path d="M${wx+8} 488 l30 0 l-24 40 Z" fill="#fff" opacity=".35"/>`;
    b += `<rect x="700" y="500" width="200" height="190" fill="#3a3028"/><rect x="712" y="512" width="80" height="178" fill="#bfe0ea" opacity=".85"/><rect x="808" y="512" width="80" height="178" fill="#bfe0ea" opacity=".7"/>`;
    b += `<path d="M330 690 H1270 V706 H330 Z" fill="#cfc6b2"/>`;
    for(const x of [670,930]) b += `<path d="M${x-20} 690 h40 l-6 -34 h-28 Z" fill="#a8452a"/><circle cx="${x}" cy="640" r="24" fill="#4f7a45"/>`;
    b += `<rect x="1326" y="440" width="6" height="250" fill="#d8d8d0"/>` + thaiFlag(1332, 448, 90);
    b += `<g transform="translate(1110 790)"><rect x="-140" y="-120" width="250" height="100" rx="8" fill="#f6f6f2"/><path d="M110 -100 h50 l26 40 v40 h-76 Z" fill="#f6f6f2"/><path d="M118 -94 h36 l18 30 h-54 Z" fill="#9fc7da"/>
      <rect x="-140" y="-64" width="326" height="14" fill="#c8372a"/><path d="M-40 -104 h16 v-16 h16 v16 h16 v16 h-16 v16 h-16 v-16 h-16 Z" fill="#c8372a" transform="translate(0 6)"/><rect x="70" y="-130" width="30" height="12" rx="3" fill="#2c63b5"/>
      <circle cx="-90" cy="-16" r="26" fill="#1c1c1c"/><circle cx="140" cy="-16" r="26" fill="#1c1c1c"/><circle cx="-90" cy="-16" r="10" fill="#888"/><circle cx="140" cy="-16" r="10" fill="#888"/></g>`;
    b += moto(430, 780, 1, '#2a2620') + moto(540, 790, 1, '#3a2f28');
    return wrap(d, b);
  };

  A.scenes = Object.assign(A.scenes || {}, SC);
  /* สถานที่บนแผนที่ → ฉากหลัง */
  A.SITE_SCENE = {W1:'well_temple', W2:'well_market', W3:'well_canal', R1:'somtam', R2:'noodle_boat', R3:'chicken_rice', R4:'mookata',
                  S:'school', E:'temple', F1:'ice_factory', F2:'ice_factory', F3:'farm'};
  A.siteScene = (id, variant) => (A.SITE_SCENE[id] || 'village') + (variant ? ':'+variant : '');
})(OD.art);
