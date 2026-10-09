/* =========================================================
   ฉากหลัง (1) — โบสถ์ยามเย็น, หมู่บ้านริมคลอง, รพ.สต. ยามค่ำ, ห้องทำงาน
   ทุกฉาก viewBox 1600x900 (slice)
   ========================================================= */
window.OD = window.OD || {};
OD.art = OD.art || {};

(function(A){
  const lin = (id, stops, x2=0, y2=1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o,c,op])=>`<stop offset="${o}" stop-color="${c}"${op!=null?` stop-opacity="${op}"`:''}/>`).join('')}</linearGradient>`;
  const rad = (id, stops, cx=.5, cy=.5, r=.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o,c,op])=>`<stop offset="${o}" stop-color="${c}"${op!=null?` stop-opacity="${op}"`:''}/>`).join('')}</radialGradient>`;
  const wrap = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
  A._h = {lin, rad, wrap};

  /* ---------- ต้นมะพร้าว ---------- */
  function palm(x, y, h, lean, col, s=1){
    const tx = x+lean, ty = y-h;
    let p = `<path d="M${x-8*s} ${y} Q${x+lean*.35} ${y-h*.55} ${tx-3*s} ${ty} L${tx+3*s} ${ty} Q${x+lean*.35+12*s} ${y-h*.55} ${x+8*s} ${y} Z" fill="${col}"/>`;
    for(const a of [-178,-155,-132,-108,-84,-60,-36,-12,8]){
      const r = a*Math.PI/180, L = (100+((a*7)%23))*s;
      const ex = tx+Math.cos(r)*L, ey = ty+Math.sin(r)*L*.55+48*s;
      const cx = tx+Math.cos(r)*L*.55, cy = ty+Math.sin(r)*L*.7-18*s;
      p += `<path d="M${tx} ${ty} Q${cx} ${cy} ${ex} ${ey} Q${cx+4*s} ${cy+13*s} ${tx} ${ty+5*s} Z" fill="${col}"/>`;
    }
    p += `<circle cx="${tx-4*s}" cy="${ty+8*s}" r="${6*s}" fill="${col}"/><circle cx="${tx+6*s}" cy="${ty+9*s}" r="${5.5*s}" fill="${col}"/>`;
    return p;
  }
  /* ---------- กอกล้วย ---------- */
  function banana(x, y, s, col){
    let p = `<path d="M${x-5*s} ${y} L${x-3*s} ${y-70*s} L${x+3*s} ${y-70*s} L${x+5*s} ${y} Z" fill="${col}"/>`;
    for(const [a,l] of [[-150,70],[-115,80],[-70,78],[-35,68],[-95,60]]){
      const r = a*Math.PI/180, ex = x+Math.cos(r)*l*s, ey = y-70*s+Math.sin(r)*l*s*.8;
      p += `<path d="M${x} ${y-66*s} Q${(x+ex)/2+8*s} ${(y-70*s+ey)/2-14*s} ${ex} ${ey} Q${(x+ex)/2-6*s} ${(y-70*s+ey)/2+10*s} ${x} ${y-60*s} Z" fill="${col}"/>`;
    }
    return p;
  }
  /* ---------- พุ่มไม้ ---------- */
  function bush(x, y, w, h, col){
    let p = '';
    for(let i=0;i<6;i++){ const cx = x+w*(i+.5)/6, r = h*(.55+.3*Math.sin(i*2.1)); p += `<circle cx="${cx}" cy="${y-r*.6}" r="${r}" fill="${col}"/>`; }
    return p + `<rect x="${x}" y="${y-h*.4}" width="${w}" height="${h*.4}" fill="${col}"/>`;
  }
  /* ---------- เรือนไทยใต้ถุนสูง (มองด้านหน้าจั่ว) ---------- */
  function house(x, base, w, s, c){
    const floor = base-62*s, top = floor-92*s, apex = top-118*s, ov = 22*s, cx = x+w/2;
    let p = '';
    for(const px of [x+6*s, x+w*.35, x+w*.65, x+w-6*s]) p += `<rect x="${px-4*s}" y="${floor}" width="${8*s}" height="${base-floor}" fill="${c.post}"/>`;
    p += `<rect x="${x-10*s}" y="${floor-8*s}" width="${w+20*s}" height="${10*s}" fill="${c.dark}"/>`;
    p += `<rect x="${x}" y="${top}" width="${w}" height="${floor-top-6*s}" fill="${c.wall}"/>`;
    for(let i=1;i<6;i++) p += `<line x1="${x+w*i/6}" y1="${top}" x2="${x+w*i/6}" y2="${floor-6*s}" stroke="${c.dark}" stroke-width="${2*s}" opacity=".55"/>`;
    p += `<line x1="${x}" y1="${top+(floor-top)*.48}" x2="${x+w}" y2="${top+(floor-top)*.48}" stroke="${c.dark}" stroke-width="${2*s}" opacity=".5"/>`;
    p += `<rect x="${cx-15*s}" y="${top+28*s}" width="${30*s}" height="${46*s}" fill="${c.win}"/>`;
    p += `<rect x="${cx-31*s}" y="${top+28*s}" width="${15*s}" height="${46*s}" fill="${c.wall}" stroke="${c.dark}" stroke-width="${1.5*s}"/><rect x="${cx+16*s}" y="${top+28*s}" width="${15*s}" height="${46*s}" fill="${c.wall}" stroke="${c.dark}" stroke-width="${1.5*s}"/>`;
    p += `<path d="M${x-ov} ${top+6*s} L${cx} ${apex} L${x+w+ov} ${top+6*s} Z" fill="${c.roof}"/>`;
    p += `<path d="M${x+8*s} ${top} L${cx} ${apex+26*s} L${x+w-8*s} ${top} Z" fill="${c.gable}"/>`;
    for(let i=1;i<7;i++){ const yy = apex+26*s+(top-apex-26*s)*i/7; const hw = (w/2-8*s)*i/7; p += `<line x1="${cx-hw}" y1="${yy}" x2="${cx+hw}" y2="${yy}" stroke="${c.dark}" stroke-width="${1.2*s}" opacity=".4"/>`; }
    p += `<path d="M${x-ov-6*s} ${top+10*s} L${cx} ${apex-6*s} L${x+w+ov+6*s} ${top+10*s}" fill="none" stroke="${c.trim}" stroke-width="${5*s}" stroke-linejoin="round"/>`;
    p += `<path d="M${x-ov-6*s} ${top+10*s} q${-10*s} ${-4*s} ${-8*s} ${-16*s} q${2*s} ${-6*s} ${7*s} ${-2*s}" fill="none" stroke="${c.trim}" stroke-width="${4*s}" stroke-linecap="round"/>`;
    p += `<path d="M${x+w+ov+6*s} ${top+10*s} q${10*s} ${-4*s} ${8*s} ${-16*s} q${-2*s} ${-6*s} ${-7*s} ${-2*s}" fill="none" stroke="${c.trim}" stroke-width="${4*s}" stroke-linecap="round"/>`;
    p += `<path d="M${cx} ${apex-6*s} q${-3*s} ${-16*s} ${6*s} ${-26*s}" fill="none" stroke="${c.trim}" stroke-width="${4*s}" stroke-linecap="round"/>`;
    return p;
  }
  A._h.palm = palm; A._h.banana = banana; A._h.bush = bush; A._h.house = house;

  /* ---------- โบสถ์ (มองด้านหน้า) ---------- */
  function teeth(x1,y1,x2,y2,n,sz,col){ // ใบระกา
    let p = ''; const dx=(x2-x1)/n, dy=(y2-y1)/n, L=Math.hypot(dx,dy), nx=-dy/L, ny=dx/L;
    for(let i=0;i<n;i++){ const ax=x1+dx*i, ay=y1+dy*i, bx=ax+dx, by=ay+dy, mx=(ax+bx)/2+nx*sz, my=(ay+by)/2+ny*sz;
      p += `<path d="M${ax} ${ay} Q${mx-dx*.15} ${my-dy*.15} ${mx+dx*.2} ${my+dy*.2} L${bx} ${by} Z" fill="${col}"/>`; }
    return p;
  }
  function chofa(x,y,s,col,flip=1){ return `<path transform="translate(${x} ${y}) scale(${s*flip} ${s})" d="M-4 2 C-6 -18 2 -40 18 -50 C27 -55 34 -50 29 -45 C22 -40 16 -32 14 -18 C13 -8 8 0 -4 2 Z" fill="${col}"/>`; }
  function hanghong(x,y,s,col,flip=1){ return `<path transform="translate(${x} ${y}) scale(${s*flip} ${s})" d="M0 0 C12 -3 19 -15 16 -30 C14 -38 6 -38 7 -31 C9 -21 5 -11 -4 -6 Z" fill="${col}"/>`; }
  function ubosot(cx, base, s, c){
    const P = n => n*s;
    let p = '';
    // ฐาน
    p += `<rect x="${cx-P(330)}" y="${base-P(52)}" width="${P(660)}" height="${P(52)}" fill="${c.base}"/>`;
    p += `<rect x="${cx-P(345)}" y="${base-P(14)}" width="${P(690)}" height="${P(14)}" fill="${c.baseDark}"/>`;
    p += `<rect x="${cx-P(70)}" y="${base-P(52)}" width="${P(140)}" height="${P(52)}" fill="${c.baseDark}" opacity=".35"/>`;
    for(let i=0;i<5;i++) p += `<rect x="${cx-P(70)}" y="${base-P(52)+P(10)*i}" width="${P(140)}" height="${P(3)}" fill="${c.base}"/>`;
    // ผนัง
    const wt = base-P(190);
    p += `<rect x="${cx-P(285)}" y="${wt}" width="${P(570)}" height="${P(138)}" fill="${c.wall}"/>`;
    for(const wx of [-225,-150,150,225]){
      p += `<rect x="${cx+P(wx)-P(18)}" y="${wt+P(36)}" width="${P(36)}" height="${P(66)}" fill="${c.win}"/>`;
      p += `<path d="M${cx+P(wx)-P(24)} ${wt+P(36)} L${cx+P(wx)} ${wt+P(14)} L${cx+P(wx)+P(24)} ${wt+P(36)} Z" fill="${c.gold}"/>`;
    }
    // ระเบียงเสา
    p += `<rect x="${cx-P(120)}" y="${wt-P(6)}" width="${P(240)}" height="${P(144)}" fill="${c.shade}"/>`;
    p += `<path d="M${cx-P(38)} ${base-P(52)} V${wt+P(42)} Q${cx} ${wt+P(10)} ${cx+P(38)} ${wt+P(42)} V${base-P(52)} Z" fill="${c.door}" stroke="${c.gold}" stroke-width="${P(4)}"/>`;
    for(const k of [-108,-62,62,108]){
      p += `<rect x="${cx+P(k)-P(9)}" y="${wt}" width="${P(18)}" height="${P(138)}" fill="${c.col}"/>`;
      p += `<path d="M${cx+P(k)-P(13)} ${wt+P(4)} q${P(13)} ${-P(16)} ${P(26)} 0 Z" fill="${c.gold}"/>`;
    }
    // หลังคาชั้นหลัง (กว้าง)
    const a1 = wt-P(250);
    p += `<path d="M${cx} ${a1} L${cx-P(330)} ${wt+P(4)} L${cx+P(330)} ${wt+P(4)} Z" fill="${c.roof2}"/>`;
    for(let i=1;i<9;i++){ const t=i/9; p += `<path d="M${cx} ${a1} L${cx-P(330)+P(14)*t} ${wt+P(4)}" stroke="${c.tileLine}" stroke-width="${P(2)}" opacity=".35" transform="rotate(${(t-.5)*0} ${cx} ${a1})"/>`; }
    p += `<path d="M${cx-P(330)} ${wt+P(4)} L${cx} ${a1} L${cx+P(330)} ${wt+P(4)}" fill="none" stroke="${c.green}" stroke-width="${P(9)}"/>`;
    p += teeth(cx-P(330), wt-P(2), cx-P(8), a1+P(4), 16, P(13), c.gold) + teeth(cx+P(8), a1+P(4), cx+P(330), wt-P(2), 16, P(13), c.gold);
    p += chofa(cx, a1, P(1.05), c.gold) + hanghong(cx-P(336), wt+P(4), P(1), c.gold, -1) + hanghong(cx+P(336), wt+P(4), P(1), c.gold);
    // หน้าบันชั้นหน้า
    const a2 = wt-P(150), hw = P(175);
    p += `<path d="M${cx} ${a2} L${cx-hw} ${wt} L${cx+hw} ${wt} Z" fill="${c.roof1}"/>`;
    p += `<path d="M${cx} ${a2+P(26)} L${cx-hw+P(30)} ${wt-P(6)} L${cx+hw-P(30)} ${wt-P(6)} Z" fill="${c.pediment}"/>`;
    p += `<g transform="translate(${cx-P(34)} ${wt-P(84)}) scale(${P(.68)})">${A.prajam(c.gold,c.goldDark,c.pediment).replace(/<svg[^>]*>|<\/svg>/g,'')}</g>`;
    for(const k of [-1,1]) p += `<g transform="translate(${cx+k*P(78)-P(17)} ${wt-P(48)}) scale(${P(.34)})">${A.prajam(c.gold,c.goldDark,c.pediment).replace(/<svg[^>]*>|<\/svg>/g,'')}</g>`;
    p += `<path d="M${cx-hw-P(6)} ${wt+P(4)} L${cx} ${a2-P(6)} L${cx+hw+P(6)} ${wt+P(4)}" fill="none" stroke="${c.gold}" stroke-width="${P(9)}" stroke-linejoin="round"/>`;
    p += teeth(cx-hw-P(4), wt-P(4), cx-P(6), a2-P(2), 11, P(11), c.gold) + teeth(cx+P(6), a2-P(2), cx+hw+P(4), wt-P(4), 11, P(11), c.gold);
    p += chofa(cx, a2-P(4), P(.85), c.gold) + hanghong(cx-hw-P(10), wt+P(4), P(.85), c.gold, -1) + hanghong(cx+hw+P(10), wt+P(4), P(.85), c.gold);
    return p;
  }
  A._h.ubosot = ubosot;

  /* ---------- ต้นโพธิ์ / ต้นไม้ใหญ่ ---------- */
  function bigTree(x, base, s, col){
    let p = `<path d="M${x-14*s} ${base} C${x-10*s} ${base-80*s} ${x-24*s} ${base-150*s} ${x-6*s} ${base-210*s} L${x+8*s} ${base-210*s} C${x+20*s} ${base-150*s} ${x+12*s} ${base-80*s} ${x+18*s} ${base} Z" fill="${col}"/>`;
    const blobs = [[0,-260,95],[-90,-230,75],[90,-235,80],[-150,-190,55],[150,-195,60],[-50,-300,70],[60,-305,70],[0,-340,55],[-110,-280,55],[115,-280,55]];
    for(const [dx,dy,r] of blobs) p += `<circle cx="${x+dx*s}" cy="${base+dy*s}" r="${r*s}" fill="${col}"/>`;
    return p;
  }
  A._h.bigTree = bigTree;

  const SC = {};

  /* ===== โบสถ์ยามเย็น ===== */
  SC.temple = function(){
    const d = lin('tp-sky',[[0,'#24183a'],[.38,'#6d2c45'],[.66,'#d8693a'],[.86,'#f4b562'],[1,'#f9d58c']]) +
      rad('tp-sun',[[0,'#fff1c4'],[.25,'#ffd27a',.9],[1,'#ff9a3c',0]]) +
      lin('tp-ground',[[0,'#3a2016'],[1,'#120a07']]) + lin('tp-pave',[[0,'#7a5236'],[1,'#2a170e']]);
    let b = `<rect width="1600" height="900" fill="url(#tp-sky)"/>`;
    b += `<circle cx="1210" cy="560" r="260" fill="url(#tp-sun)"/><circle cx="1210" cy="560" r="62" fill="#fff0c0" opacity=".95"/>`;
    for(const [x,y,w,o] of [[200,200,520,.18],[900,150,600,.14],[1150,330,520,.22],[300,380,420,.16]]) b += `<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="16" fill="#ffd9b0" opacity="${o}"/>`;
    b += `<path d="M0 640 Q120 600 240 628 T480 615 T760 630 T1040 612 T1300 628 T1600 610 V700 H0 Z" fill="#4a2420" opacity=".85"/>`;
    b += `<rect y="680" width="1600" height="220" fill="url(#tp-ground)"/>`;
    b += `<path d="M380 900 L640 690 H960 L1220 900 Z" fill="url(#tp-pave)" opacity=".55"/>`;
    b += bigTree(1380, 700, 1.25, '#24130d') + bigTree(150, 700, .95, '#2b1710');
    b += ubosot(800, 700, 1, {base:'#d9c7a8', baseDark:'#9b7f5c', wall:'#efe3cd', win:'#5b1d14', gold:'#e2b24f', goldDark:'#9a6e1f', shade:'#c9b593',
      door:'#3b120c', col:'#f3e9d6', roof1:'#b8452a', roof2:'#a63c26', tileLine:'#5a1a0e', green:'#2f6a4c', pediment:'#7a1f14'});
    for(const fx of [430,520,1080,1170]){ b += `<rect x="${fx}" y="560" width="4" height="140" fill="#2a170e"/><path d="M${fx+4} 566 h34 l-8 14 l8 14 h-34 Z" fill="#f2c13d"/><circle cx="${fx+19}" cy="580" r="4" fill="#b8452a"/>`; }
    b += `<rect y="0" width="1600" height="900" fill="#ff8a3c" opacity=".05"/>`;
    return wrap(d, b);
  };

  /* ===== หมู่บ้านริมคลองยามเช้า ===== */
  SC.village = function(){
    const d = lin('vl-sky',[[0,'#8fb2c9'],[.55,'#e9d7b6'],[1,'#f6dfb2']]) + rad('vl-sun',[[0,'#fff6dc'],[.3,'#ffe6a8',.8],[1,'#ffd28a',0]]) +
      lin('vl-water',[[0,'#9db7b3'],[.35,'#6f8f8c'],[1,'#33504f']]) + lin('vl-mist',[[0,'#f3e6cc',0],[.5,'#f3e6cc',.55],[1,'#f3e6cc',0]]);
    let b = `<rect width="1600" height="900" fill="url(#vl-sky)"/><circle cx="420" cy="430" r="240" fill="url(#vl-sun)"/><circle cx="420" cy="430" r="46" fill="#fff7e2"/>`;
    b += `<path d="M0 520 Q200 470 400 505 T800 490 T1200 505 T1600 485 V600 H0 Z" fill="#9aa59a" opacity=".55"/>`;
    b += `<path d="M0 560 Q180 520 380 548 T780 535 T1180 550 T1600 530 V620 H0 Z" fill="#6f7f6c" opacity=".7"/>`;
    for(let i=0;i<14;i++) b += palm(60+i*118+(i%3)*20, 600, 150+(i%4)*28, (i%2?18:-22), '#4f5e4b', .7);
    b += `<rect y="600" width="1600" height="300" fill="url(#vl-water)"/>`;
    for(let i=0;i<40;i++){ const y=620+((i*53)%270), x=((i*197)%1600); b += `<rect x="${x}" y="${y}" width="${60+(i%5)*30}" height="2" fill="#f6e7c4" opacity="${.15+(i%4)*.06}"/>`; }
    b += `<path d="M0 640 L0 590 Q300 575 520 600 L560 640 Z" fill="#4f4a33"/>`;
    b += house(70, 650, 230, 1, {post:'#3b2615', dark:'#3b2615', wall:'#8a5a33', win:'#2a1a0f', roof:'#5a3a24', gable:'#7a4e2c', trim:'#c7a066'});
    b += `<path d="M1600 640 L1600 585 Q1300 570 1040 596 L1000 640 Z" fill="#4f4a33"/>`;
    b += house(1090, 655, 210, 1.05, {post:'#3b2615', dark:'#3b2615', wall:'#7d5130', win:'#2a1a0f', roof:'#4d3220', gable:'#6e4428', trim:'#c7a066'});
    b += house(1360, 640, 170, .85, {post:'#3b2615', dark:'#3b2615', wall:'#8f6038', win:'#2a1a0f', roof:'#5a3a24', gable:'#7a4e2c', trim:'#b48d55'});
    b += palm(380, 610, 330, 40, '#2e3a2a', 1.1) + palm(980, 605, 300, -50, '#2e3a2a', 1) + banana(560, 630, 1.1, '#3b4a33') + banana(1010, 625, .9, '#3b4a33');
    b += `<g transform="translate(700 735)"><path d="M-170 0 Q0 26 190 -6 L210 -18 Q30 6 -180 -10 Z" fill="#3a2414"/><path d="M-60 -8 l14 -46 l14 46 Z" fill="#2a1a0f"/><path d="M-72 -50 Q-46 -70 -20 -50 Z" fill="#c9a76a"/><rect x="150" y="-34" width="34" height="18" fill="#2a1a0f"/><line x1="184" y1="-24" x2="250" y2="-4" stroke="#2a1a0f" stroke-width="4"/></g>`;
    b += `<g opacity=".55">${[0,1,2,3].map(i=>`<rect x="${560+i*24}" y="${746+i*9}" width="${300-i*40}" height="2" fill="#2a1a0f"/>`).join('')}</g>`;
    b += `<rect y="470" width="1600" height="200" fill="url(#vl-mist)"/>`;
    return wrap(d, b);
  };

  /* ===== รพ.สต. ยามค่ำ ===== */
  SC.office_night = function(){
    const d = lin('on-sky',[[0,'#070b1d'],[.6,'#17254a'],[1,'#2d3a5e']]) + rad('on-glow',[[0,'#ffd98a',.9],[1,'#ffb347',0]]) +
      lin('on-ground',[[0,'#151a24'],[1,'#07090d']]) + rad('on-lamp',[[0,'#fff1c0',.55],[1,'#fff1c0',0]],.5,0,.9);
    let b = `<rect width="1600" height="900" fill="url(#on-sky)"/>`;
    for(let i=0;i<90;i++){ const x=(i*173)%1600, y=(i*97)%420; b += `<circle cx="${x}" cy="${y}" r="${(i%3)*.6+.6}" fill="#fff" opacity="${.3+(i%5)*.12}"/>`; }
    b += `<circle cx="1300" cy="140" r="42" fill="#f6efd6"/><circle cx="1318" cy="128" r="40" fill="#0d1430"/>`;
    b += palm(140, 690, 360, 30, '#05070d', 1.15) + palm(1460, 690, 330, -40, '#05070d', 1.05) + palm(1290, 690, 250, 20, '#080b14', .8);
    b += `<rect y="690" width="1600" height="210" fill="url(#on-ground)"/>`;
    // อาคาร
    b += `<path d="M330 430 L800 330 L1270 430 Z" fill="#3a2a2a"/><path d="M300 440 L800 326 L1300 440" fill="none" stroke="#5a3d34" stroke-width="10"/>`;
    b += `<rect x="360" y="430" width="880" height="260" fill="#d9cfb8"/><rect x="360" y="430" width="880" height="260" fill="#0b1330" opacity=".45"/>`;
    b += `<rect x="520" y="372" width="560" height="54" rx="3" fill="#1d5f58"/><rect x="526" y="378" width="548" height="42" rx="2" fill="none" stroke="#e8e0c8" stroke-width="1.5"/>`;
    b += `<text x="800" y="407" text-anchor="middle" font-family="Sarabun,Leelawadee UI,sans-serif" font-size="24" font-weight="700" fill="#f3eedd">โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านสุขใจ</text>`;
    for(const [wx,lit] of [[400,1],[530,1],[930,0],[1060,1],[1170,0]]){
      b += `<rect x="${wx}" y="480" width="90" height="110" fill="${lit?'#ffd98a':'#1a2238'}"/>`;
      if(lit) b += `<circle cx="${wx+45}" cy="535" r="110" fill="url(#on-glow)" opacity=".35"/>`;
      b += `<path d="M${wx} 535 H${wx+90} M${wx+45} 480 V590" stroke="#3a2f2a" stroke-width="4"/>`;
    }
    b += `<path d="M560 590 q20 -40 40 -36 q14 2 16 22 l4 14 Z" fill="#3a2a1e" opacity=".85"/><circle cx="584" cy="528" r="12" fill="#3a2a1e" opacity=".85"/>`;
    b += `<rect x="700" y="500" width="200" height="190" fill="#2a2018"/><rect x="712" y="512" width="80" height="178" fill="#ffe2a0" opacity=".85"/><rect x="808" y="512" width="80" height="178" fill="#ffe2a0" opacity=".7"/>`;
    b += `<path d="M330 690 H1270 V706 H330 Z" fill="#8f8572"/>`;
    // เสาไฟ
    b += `<rect x="1360" y="430" width="8" height="260" fill="#11151f"/><path d="M1364 432 q40 -10 60 6" stroke="#11151f" stroke-width="6" fill="none"/><path d="M1300 700 L1424 446 L1548 700 Z" fill="url(#on-lamp)"/><circle cx="1424" cy="446" r="7" fill="#fff6d8"/>`;
    // มอเตอร์ไซค์
    b += `<g transform="translate(1140 690)" fill="#0c0f16"><circle cx="-40" cy="-16" r="16"/><circle cx="40" cy="-16" r="16"/><path d="M-40 -16 L-10 -46 H24 L40 -16 Z"/><path d="M-6 -50 h34 v-6 h-34 Z"/></g>`;
    return wrap(d, b);
  };

  /* ===== ห้องทำงาน (กลางวัน) ===== */
  SC.office = function(){
    const d = lin('of-wall',[[0,'#d8dcc6'],[1,'#b9bea6']]) + lin('of-win',[[0,'#bfe0ee'],[1,'#f2e4bd']]) + lin('of-desk',[[0,'#7a4d2c'],[1,'#4a2c18']]) +
      rad('of-light',[[0,'#fff4d0',.55],[1,'#fff4d0',0]]) + lin('of-floor',[[0,'#8d8673'],[1,'#4c4639']]);
    let b = `<rect width="1600" height="900" fill="url(#of-wall)"/><rect y="640" width="1600" height="260" fill="url(#of-floor)"/>`;
    for(let i=0;i<9;i++) b += `<line x1="${i*200}" y1="640" x2="${i*200-200}" y2="900" stroke="#3a352b" stroke-width="2" opacity=".35"/>`;
    b += `<rect y="628" width="1600" height="14" fill="#6b6150"/>`;
    // หน้าต่าง
    b += `<rect x="90" y="120" width="420" height="380" fill="url(#of-win)"/>`;
    b += palm(210, 520, 260, 30, '#5f7a59', .9) + bush(300, 520, 230, 60, '#6d8a62');
    for(let i=0;i<14;i++) b += `<rect x="90" y="${130+i*26}" width="420" height="9" fill="#e9e2cc" opacity=".55"/>`;
    b += `<rect x="90" y="120" width="420" height="380" fill="none" stroke="#5a4a36" stroke-width="12"/><line x1="300" y1="120" x2="300" y2="500" stroke="#5a4a36" stroke-width="8"/>`;
    b += `<circle cx="300" cy="320" r="420" fill="url(#of-light)"/>`;
    // ไวท์บอร์ด
    b += `<rect x="640" y="110" width="560" height="330" fill="#f7f7f2" stroke="#9aa0a6" stroke-width="10"/>`;
    b += `<text x="670" y="160" font-family="Charm,Sarabun,sans-serif" font-size="34" font-weight="700" fill="#1f4aa8">สอบสวนโรคอุจจาระร่วง ต.บ้านสุขใจ</text>`;
    b += `<path d="M680 380 L740 340 L800 352 L860 290 L920 300 L980 230 L1040 250" fill="none" stroke="#c8352a" stroke-width="5"/>`;
    for(const [x,y,c] of [[700,210,'#c8352a'],[760,240,'#c8352a'],[1090,200,'#2f7d4a'],[1130,330,'#c8352a']]) b += `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`;
    b += `<rect x="1060" y="180" width="110" height="80" fill="#fff3a6" transform="rotate(4 1115 220)"/><rect x="1080" y="290" width="100" height="70" fill="#ffd6e0" transform="rotate(-5 1130 325)"/>`;
    // นาฬิกา ปฏิทิน
    b += `<circle cx="1370" cy="170" r="52" fill="#f8f6ee" stroke="#4a3f33" stroke-width="7"/><path d="M1370 170 V132 M1370 170 L1396 182" stroke="#2a2420" stroke-width="5" stroke-linecap="round"/>`;
    b += `<rect x="1310" y="270" width="130" height="170" fill="#fbfaf4" stroke="#bbb" stroke-width="2"/><rect x="1310" y="270" width="130" height="40" fill="#b8302a"/><text x="1375" y="298" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="20" font-weight="700" fill="#fff">ตุลาคม</text>`;
    // โต๊ะ จอ แฟ้ม
    b += `<rect x="520" y="560" width="900" height="34" fill="#8a5a33"/><rect x="540" y="594" width="860" height="240" fill="url(#of-desk)"/>`;
    b += `<rect x="760" y="380" width="300" height="190" rx="6" fill="#1b1f27"/><rect x="772" y="392" width="276" height="160" fill="#0f2a33"/>`;
    for(let i=0;i<9;i++){ const hh = [30,45,40,70,95,120,110,80,60][i]; b += `<rect x="${786+i*29}" y="${540-hh}" width="20" height="${hh}" fill="${i>3&&i<7?'#e2573f':'#4fb3a0'}"/>`; }
    b += `<rect x="895" y="570" width="30" height="20" fill="#1b1f27"/>`;
    for(let i=0;i<6;i++) b += `<rect x="${600+i*16}" y="${470-i*0}" width="14" height="92" fill="${['#2f5fae','#c23a2e','#e0a92e','#2f8a5a','#7b4bb0','#2f5fae'][i]}"/>`;
    b += `<rect x="1180" y="520" width="140" height="44" fill="#f3efe2"/><rect x="1190" y="506" width="120" height="18" fill="#e9e3d0"/>`;
    // พัดลม
    b += `<g transform="translate(1480 470)"><rect x="-5" y="0" width="10" height="320" fill="#d8d8d0"/><ellipse cx="0" cy="320" rx="50" ry="12" fill="#bfbfb6"/><circle r="70" fill="#e8f0f2" stroke="#9fb4bd" stroke-width="6" opacity=".9"/><circle r="12" fill="#5d8aa0"/></g>`;
    return wrap(d, b);
  };

  A.scenes = Object.assign(A.scenes || {}, SC);
  /* ทำให้ id ของ gradient ไม่ซ้ำกันในแต่ละครั้งที่วาด (ฉากเดียวกันอาจอยู่หลายที่ในหน้า) */
  let sceneUid = 0;
  A.scene = function(name){
    const svg = (A.scenes[name] || A.scenes.temple)(), n = ++sceneUid;
    const ids = Array.from(svg.matchAll(/id="([^"]+)"/g), m=>m[1]);
    return ids.reduce((s,id)=>s.split(`id="${id}"`).join(`id="${id}-${n}"`).split(`url(#${id})`).join(`url(#${id}-${n})`).split(`href="#${id}"`).join(`href="#${id}-${n}"`), svg);
  };
})(OD.art);
