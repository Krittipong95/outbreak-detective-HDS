/* =========================================================
   ฉากหลัง (2) — ศาลาประชาคม, ห้องปฏิบัติการ, ตลาดสด, โรงน้ำแข็ง
   ========================================================= */
(function(A){
  const {lin, rad, wrap, palm, bush, bigTree} = A._h;
  const SC = {};

  /* ===== ศาลาประชาคม ===== */
  SC.hall = function(){
    const d = lin('hl-sky',[[0,'#9cc3d6'],[1,'#e8e2c8']]) + lin('hl-floor',[[0,'#b59c78'],[1,'#6e5a40']]) + lin('hl-roof',[[0,'#7a2e1c'],[1,'#a8442a']]) + lin('hl-shade',[[0,'#000',.35],[1,'#000',0]]);
    let b = `<rect width="1600" height="900" fill="url(#hl-sky)"/>`;
    b += bush(0, 560, 520, 120, '#5f7d52') + bush(1080, 560, 520, 130, '#5a774d') + palm(220, 560, 260, 20, '#4a6342', .9) + palm(1400, 560, 280, -30, '#4a6342', .95);
    b += `<rect y="560" width="1600" height="340" fill="#8a7a5a"/>`;
    // หลังคาศาลา
    b += `<path d="M120 250 L800 60 L1480 250 L1420 270 L800 110 L180 270 Z" fill="#c9a050"/>`;
    b += `<path d="M180 270 L800 110 L1420 270 L1420 300 H180 Z" fill="url(#hl-roof)"/>`;
    for(let i=0;i<18;i++){ const x = 200+i*68; b += `<line x1="${x}" y1="300" x2="${800+(x-800)*.35}" y2="${150}" stroke="#5a1f12" stroke-width="2" opacity=".35"/>`; }
    b += `<path d="M800 60 q-8 -30 14 -52" stroke="#c9a050" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    b += `<rect x="160" y="296" width="1280" height="26" fill="#5a3a22"/><rect y="322" width="1600" height="300" fill="url(#hl-shade)" opacity=".7"/>`;
    // เพดาน พัดลม ป้าย
    b += `<rect x="180" y="322" width="1240" height="40" fill="#e9dcc0"/>`;
    for(const fx of [480,800,1120]) b += `<g transform="translate(${fx} 362)"><rect x="-2" y="0" width="4" height="40" fill="#555"/><ellipse cx="0" cy="44" rx="80" ry="8" fill="#6c6c66" opacity=".8"/><circle cy="44" r="10" fill="#444"/></g>`;
    b += `<rect x="470" y="420" width="660" height="70" fill="#1f5ea8"/><rect x="478" y="428" width="644" height="54" fill="none" stroke="#fff" stroke-width="2"/>`;
    b += `<text x="800" y="466" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="30" font-weight="700" fill="#fff">ประชุมประชาคม หมู่ที่ ๒ บ้านวัด</text>`;
    // ธงชาติ
    b += `<g transform="translate(1180 410)"><rect x="0" y="0" width="5" height="160" fill="#888"/><rect x="5" y="4" width="90" height="12" fill="#a51931"/><rect x="5" y="16" width="90" height="12" fill="#f4f5f8"/><rect x="5" y="28" width="90" height="24" fill="#2d2a4a"/><rect x="5" y="52" width="90" height="12" fill="#f4f5f8"/><rect x="5" y="64" width="90" height="12" fill="#a51931"/></g>`;
    // เสาศาลา
    for(const cx of [200,520,1080,1400]) b += `<rect x="${cx-14}" y="322" width="28" height="330" fill="#6b4426"/><rect x="${cx-20}" y="640" width="40" height="18" fill="#4a2e18"/>`;
    b += `<rect x="140" y="650" width="1320" height="26" fill="#9d8866"/><rect y="676" width="1600" height="224" fill="url(#hl-floor)"/>`;
    // เก้าอี้พลาสติก
    for(let r=0;r<3;r++) for(let i=0;i<11;i++){
      const x = 260+i*100+(r%2)*30, y = 700+r*70, s = 1+r*.18, c = (i+r)%3===0?'#2c63b5':'#c8372a';
      b += `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-26" y="-58" width="52" height="40" rx="8" fill="${c}"/><rect x="-28" y="-20" width="56" height="12" rx="4" fill="${c}"/><path d="M-24 -8 l-6 42 M24 -8 l6 42" stroke="${c}" stroke-width="6"/></g>`;
    }
    b += `<g transform="translate(330 540)"><rect x="-4" y="0" width="8" height="140" fill="#333"/><path d="M-40 -10 h80 l-10 30 h-60 Z" fill="#555"/></g>`;
    return wrap(d, b);
  };

  /* ===== ห้องปฏิบัติการ ===== */
  SC.lab = function(){
    const d = lin('lb-wall',[[0,'#dfe8ee'],[1,'#b9c7d1']]) + lin('lb-floor',[[0,'#9fb0bb'],[1,'#56656f']]) + lin('lb-bench',[[0,'#2b3a46'],[1,'#17212a']]) +
      rad('lb-glow',[[0,'#c7f0ff',.55],[1,'#c7f0ff',0]]) + lin('lb-hood',[[0,'#e9eef1'],[1,'#c4ced5']]);
    let b = `<rect width="1600" height="900" fill="url(#lb-wall)"/><rect y="660" width="1600" height="240" fill="url(#lb-floor)"/>`;
    for(let i=0;i<10;i++) b += `<rect x="${i*170}" y="40" width="120" height="14" rx="4" fill="#fbffff"/>`;
    b += `<circle cx="800" cy="60" r="700" fill="url(#lb-glow)" opacity=".5"/>`;
    // ตู้ชีวนิรภัย
    b += `<rect x="90" y="170" width="460" height="470" fill="url(#lb-hood)" stroke="#8a99a3" stroke-width="6"/><rect x="120" y="240" width="400" height="230" fill="#a8d8e8" opacity=".55" stroke="#7a8c96" stroke-width="4"/>`;
    b += `<text x="320" y="215" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="#3c4b55">BIOSAFETY CABINET</text>`;
    b += `<path d="M160 470 h320 v20 h-320 Z" fill="#9fb0bb"/><circle cx="460" cy="205" r="9" fill="#e2573f"/>`;
    b += `<g transform="translate(250 470)"><rect x="-12" y="-80" width="24" height="70" fill="#f4f4f4" stroke="#aaa"/><rect x="-12" y="-36" width="24" height="26" fill="#e2b04f" opacity=".8"/></g>`;
    // โต๊ะแล็บ
    b += `<rect x="600" y="500" width="1000" height="26" fill="#3a4b58"/><rect x="620" y="526" width="980" height="150" fill="url(#lb-bench)"/>`;
    for(let i=0;i<5;i++) b += `<rect x="${640+i*190}" y="545" width="170" height="110" rx="4" fill="#24313b" stroke="#3d4e5b" stroke-width="2"/><circle cx="${725+i*190}" cy="600" r="5" fill="#8fa3b1"/>`;
    // กล้องจุลทรรศน์
    b += `<g transform="translate(760 500)" fill="#20262c"><rect x="-70" y="-14" width="140" height="14" rx="4"/><path d="M30 -14 C40 -70 30 -120 -10 -150 L4 -160 C50 -128 58 -70 50 -14 Z"/><rect x="-36" y="-80" width="70" height="10" rx="3"/><rect x="-30" y="-190" width="22" height="70" rx="4" transform="rotate(-25 -20 -150)"/><circle cx="-6" cy="-60" r="7" fill="#c8d4dc"/></g>`;
    // หลอดทดลอง
    b += `<g transform="translate(980 500)"><rect x="-60" y="-34" width="160" height="10" fill="#d8dee3"/><rect x="-60" y="-10" width="160" height="10" fill="#d8dee3"/>`;
    for(let i=0;i<7;i++){ const c = ['#e2573f','#e9b54b','#4fb3a0','#e2573f','#8ab4e8','#e9b54b','#4fb3a0'][i]; b += `<rect x="${-52+i*22}" y="-70" width="12" height="66" rx="6" fill="#f5fbff" stroke="#9fb0bb" stroke-width="1.5"/><rect x="${-52+i*22}" y="-34" width="12" height="30" rx="6" fill="${c}" opacity=".85"/>`; }
    b += `</g>`;
    // ตู้บ่มเชื้อ + จานเพาะเชื้อ
    b += `<rect x="1240" y="240" width="300" height="250" fill="#e6ecef" stroke="#8a99a3" stroke-width="6"/><rect x="1262" y="262" width="256" height="190" fill="#c9e6ef" opacity=".7"/>`;
    for(let r=0;r<3;r++) for(let i=0;i<4;i++) b += `<ellipse cx="${1300+i*60}" cy="${300+r*60}" rx="24" ry="8" fill="#f1e1a6" stroke="#b9a35a"/>`;
    b += `<text x="1390" y="478" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="18" font-weight="700" fill="#3c4b55">INCUBATOR 37°C</text>`;
    b += `<g transform="translate(1180 500)"><ellipse cx="0" cy="-6" rx="34" ry="10" fill="#f1e1a6" stroke="#b9a35a" stroke-width="2"/><circle cx="-8" cy="-7" r="3" fill="#c94f3a"/><circle cx="6" cy="-5" r="2.4" fill="#c94f3a"/></g>`;
    return wrap(d, b);
  };

  /* ===== ตลาดสดยามเช้า ===== */
  SC.market = function(){
    const d = lin('mk-sky',[[0,'#f2d7a2'],[1,'#e7b778']]) + lin('mk-ground',[[0,'#6b5844'],[1,'#2e241a']]) + rad('mk-bulb',[[0,'#fff2c2',.9],[1,'#ffc96b',0]]);
    let b = `<rect width="1600" height="900" fill="url(#mk-sky)"/>`;
    b += `<rect x="0" y="180" width="1600" height="300" fill="#8f6d4a"/><rect x="0" y="180" width="1600" height="40" fill="#5a3f28"/>`;
    for(let i=0;i<9;i++) b += `<rect x="${30+i*180}" y="240" width="120" height="160" fill="#3a2a1c" opacity=".6"/>`;
    b += `<text x="800" y="210" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="#f6e2b0">ตลาดสดบ้านสุขใจ</text>`;
    b += `<rect y="600" width="1600" height="300" fill="url(#mk-ground)"/>`;
    // ร่มแม่ค้า
    const umb = (x,y,w,c1,c2) => { let s = `<rect x="${x-3}" y="${y}" width="6" height="${620-y}" fill="#3a2a1c"/>`; const n=8; for(let i=0;i<n;i++){ const x1=x-w/2+w*i/n, x2=x-w/2+w*(i+1)/n; s += `<path d="M${x} ${y-50} L${x1} ${y} Q${(x1+x2)/2} ${y+12} ${x2} ${y} Z" fill="${i%2?c1:c2}"/>`; } return s; };
    b += umb(230,420,320,'#c8372a','#f4efe4') + umb(620,400,340,'#2c63b5','#f4efe4') + umb(1000,415,330,'#e7a92a','#c8372a') + umb(1390,405,340,'#2f8a5a','#f4efe4');
    // แผงขายของ
    for(const [x,w] of [[90,290],[460,320],[850,300],[1230,320]]){
      b += `<rect x="${x}" y="560" width="${w}" height="24" fill="#8a5a33"/><rect x="${x+10}" y="584" width="${w-20}" height="80" fill="#5a3a22"/>`;
      for(let i=0;i<5;i++){ const cx=x+30+i*(w-60)/4, col=['#e2573f','#6aa84f','#f1c232','#e69138','#8fce00'][(i+x)%5]; b += `<ellipse cx="${cx}" cy="556" rx="30" ry="14" fill="#c9a26b"/>`; for(let k=0;k<6;k++) b += `<circle cx="${cx-16+k*6}" cy="${548-(k%2)*6}" r="7" fill="${col}"/>`; }
    }
    // หลอดไฟ
    for(let i=0;i<12;i++){ const x = 80+i*130, y = 470+(i%3)*12; b += `<line x1="${x}" y1="430" x2="${x}" y2="${y}" stroke="#2a1d12" stroke-width="2"/><circle cx="${x}" cy="${y+8}" r="60" fill="url(#mk-bulb)" opacity=".5"/><circle cx="${x}" cy="${y+8}" r="8" fill="#fff4cc"/>`; }
    // ผู้คน (เงา)
    const person = (x,y,s,c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="0" cy="-150" r="20"/><path d="M-30 -125 Q0 -135 30 -125 L38 -40 L22 -40 L18 0 H-18 L-22 -40 L-38 -40 Z"/></g>`;
    b += person(330,760,1.1,'#2a1f16') + person(560,780,1.25,'#1f1710') + person(1110,770,1.15,'#2a1f16') + person(1320,800,1.35,'#1a130d') + person(820,740,.95,'#3a2c20');
    b += `<g transform="translate(560 638)"><path d="M-34 -18 Q0 -42 34 -18 Z" fill="#c9a76a"/></g>`;
    return wrap(d, b);
  };

  /* ===== โรงน้ำแข็ง ===== */
  SC.ice_factory = function(){
    const d = lin('if-sky',[[0,'#a9c4d4'],[1,'#e2e6dc']]) + lin('if-shed',[[0,'#7d8a92'],[1,'#4f5a61']]) + lin('if-in',[[0,'#1d2a33'],[1,'#0e161c']]) +
      lin('if-ice',[[0,'#eaf8ff'],[1,'#a9d6ea']]) + lin('if-ground',[[0,'#6f6a5e'],[1,'#3a372f']]);
    let b = `<rect width="1600" height="900" fill="url(#if-sky)"/>`;
    b += palm(100, 540, 300, 20, '#5b6f57', 1) + palm(1500, 540, 280, -20, '#5b6f57', .95) + bush(1300, 540, 300, 70, '#6d8762');
    b += `<rect y="540" width="1600" height="360" fill="url(#if-ground)"/>`;
    // โรงเรือนสังกะสี
    b += `<path d="M180 230 L800 120 L1420 230 V560 H180 Z" fill="url(#if-shed)"/>`;
    for(let i=0;i<40;i++){ const x = 190+i*31; b += `<line x1="${x}" y1="${230-(800-Math.abs(x-800))*.0}" x2="${x}" y2="560" stroke="#3a454c" stroke-width="2" opacity=".45"/>`; }
    b += `<path d="M160 236 L800 110 L1440 236" fill="none" stroke="#3a454c" stroke-width="14"/>`;
    b += `<rect x="560" y="170" width="480" height="64" fill="#1f5ea8"/><text x="800" y="214" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="34" font-weight="700" fill="#fff">โรงน้ำแข็ง</text>`;
    b += `<rect x="420" y="290" width="760" height="270" fill="url(#if-in)"/>`;
    // สายพาน + ก้อนน้ำแข็ง
    b += `<rect x="440" y="470" width="720" height="16" fill="#555f66"/>`;
    for(let i=0;i<5;i++) b += `<rect x="${470+i*140}" y="380" width="110" height="90" fill="url(#if-ice)" stroke="#d8f2ff" stroke-width="2" opacity=".95"/><path d="M${480+i*140} 395 l90 60" stroke="#fff" stroke-width="2" opacity=".6"/>`;
    b += `<rect x="440" y="486" width="720" height="74" fill="#2b3640"/>`;
    for(let i=0;i<12;i++) b += `<circle cx="${470+i*60}" cy="478" r="8" fill="#9aa5ad"/>`;
    // รถกระบะ + กระสอบน้ำแข็ง
    b += `<g transform="translate(1240 700)"><rect x="-200" y="-90" width="250" height="70" fill="#e7e2d4"/><path d="M50 -90 h80 l40 40 v30 h-120 Z" fill="#d9d3c3"/><path d="M62 -84 h56 l28 30 h-84 Z" fill="#9fc3d6"/><circle cx="-140" cy="-14" r="30" fill="#1c1c1c"/><circle cx="110" cy="-14" r="30" fill="#1c1c1c"/><circle cx="-140" cy="-14" r="12" fill="#888"/><circle cx="110" cy="-14" r="12" fill="#888"/>`;
    for(let i=0;i<5;i++) b += `<ellipse cx="${-170+i*46}" cy="-104" rx="26" ry="18" fill="#f2f2ea" stroke="#c9c9bd"/>`;
    b += `</g>`;
    // แอ่งน้ำ
    for(const [x,y,w] of [[520,640,160],[760,700,240],[980,650,120]]) b += `<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="12" fill="#9fb7c4" opacity=".45"/>`;
    b += `<g transform="translate(330 560)"><rect x="-60" y="0" width="120" height="90" fill="#3d7a9b"/><text x="0" y="55" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="22" font-weight="700" fill="#fff">ถังน้ำ</text></g>`;
    return wrap(d, b);
  };

  A.scenes = Object.assign(A.scenes || {}, SC);
})(OD.art);
