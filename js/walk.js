/* =========================================================
   walk — โหมดเดินสำรวจหมู่บ้าน (พิกเซลอาร์ตมุมบน วาดด้วยโค้ดทั้งหมด ไม่ใช้ไฟล์ภาพ)
   OD.walk.open(F) — F = OD.field (ใช้ F.act / F.after / F.hint / F.can / F.spend)
   พิกัดโลกเดียวกับแผนที่ข้อมูล 1000×680 (๑ หน่วย = ๔ เมตร = ๑ พิกเซลก่อนขยาย)
   ========================================================= */
OD.walk = (function(){
  const U = OD.u, M = OD.sim;
  const WW = 1000, WH = 680, CELL = 5, GW = WW/CELL, GH = WH/CELL;
  const SPEED = 62;              // หน่วย/วินาที
  const UNITS_PER_HOUR = 1000;   // เดิน ๔ กม. = ๑ ชม. ในเกม
  let W, S, F, built = null, el, cv, ctx, view, vctx, mini, mctx;
  let running = false, raf = 0, lastT = 0, zoomFar = false;
  let P = null;                  // ผู้เล่น
  let keys = new Set(), path = null, pendingTarget = null, focus = null, sheetFor = null;
  let actors = [], ducks = [], boat = null, smoke = [], clouds = [];
  let hudKey = '', flagCache = {key:'', list:[]};

  /* ---------- สุ่มแบบกำหนด seed (แยกจากตัวสุ่มของโลกจำลอง) ---------- */
  function rng(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  const hash = (x,y) => { let h = Math.imul(x|0, 374761393) + Math.imul(y|0, 668265263); h = Math.imul(h^(h>>>13), 1274126177); return ((h^(h>>>16))>>>0)/4294967296; };
  function vnoise(x, y, s){ const fx = x/s, fy = y/s, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx-ix, ty = fy-iy;
    const a = hash(ix,iy), b = hash(ix+1,iy), c = hash(ix,iy+1), d = hash(ix+1,iy+1), sx = tx*tx*(3-2*tx), sy = ty*ty*(3-2*ty);
    return a + (b-a)*sx + (c-a)*sy + (a-b-c+d)*sx*sy; }

  /* ---------- เครื่องมือวาดสไปรต์ ---------- */
  function canvas(w,h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function spr(w, h, fn, outline=true){
    const c = canvas(w+2, h+2), g = c.getContext('2d');
    const p = (col,x,y,ww=1,hh=1)=>{ g.fillStyle = col; g.fillRect(x+1|0, y+1|0, ww, hh); };
    fn(p, g);
    if(outline) addOutline(c, g);
    return c;
  }
  function addOutline(c, g, col=[26,20,14,200]){
    const w = c.width, h = c.height, d = g.getImageData(0,0,w,h), a = d.data, o = new Uint8ClampedArray(a);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=(y*w+x)*4; if(a[i+3]>40) continue;
      const n = (xx,yy)=> xx>=0&&yy>=0&&xx<w&&yy<h && a[(yy*w+xx)*4+3]>140;
      if(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1)){ o[i]=col[0]; o[i+1]=col[1]; o[i+2]=col[2]; o[i+3]=col[3]; } }
    g.putImageData(new ImageData(o,w,h),0,0);
  }
  function pix(rows, pal, outline=true){
    const h = rows.length, w = Math.max(...rows.map(r=>r.length));
    return spr(w, h, p=>rows.forEach((r,y)=>{ for(let x=0;x<r.length;x++){ const c = pal[r[x]]; if(c) p(c,x,y); } }), outline);
  }
  function flip(c){ const f = canvas(c.width, c.height), g = f.getContext('2d'); g.translate(c.width,0); g.scale(-1,1); g.drawImage(c,0,0); return f; }
  function line(p, col, x0,y0,x1,y1){ x0|=0; y0|=0; x1|=0; y1|=0; const dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1; let e=dx+dy;
    for(;;){ p(col,x0,y0); if(x0===x1&&y0===y1) break; const e2=2*e; if(e2>=dy){ e+=dy; x0+=sx; } if(e2<=dx){ e+=dx; y0+=sy; } } }
  const shade = (hex, k) => { const n = parseInt(hex.slice(1),16); let r=n>>16, g=n>>8&255, b=n&255;
    const f = v => Math.round(k<0 ? v*(1+k) : v+(255-v)*k); return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join(''); };

  /* ---------- ตัวละคร (สไปรต์ ๑๒×๑๘ วาดตามทิศ/เฟรม แล้วเก็บแคช) ---------- */
  const pcache = new Map();
  const ROWER = {skin:'#b97c52', hair:'#2a2623', shirt:'#2f6fb0', pants:'#2f6fb0', hat:'ngob', robe:true};
  function person(look, dir, frame){
    if(!look._k) Object.defineProperty(look, '_k', {value: JSON.stringify(look)});
    const key = look._k+dir+frame;
    if(pcache.has(key)) return pcache.get(key);
    const side = dir==='l' || dir==='r';
    let c = spr(12, 19, p=>{
      const L = look, kid = L.kid, dy = kid ? 3 : 0, sk = L.skin, hr = L.hair || sk;
      const top = 3+dy, by = 9+dy, bh = kid ? 3 : 5, ly = by+bh;
      // ขา
      const legC = L.robe ? L.shirt : L.pants, foot = '#3a2a1e';
      if(L.robe){ p(L.shirt, side?4:3, ly, side?4:6, 18-ly); p(foot, side?4:4, 18, side?4:4, 1); }
      else if(side){
        const a = frame===1 ? -1 : frame===2 ? 1 : 0;
        p(legC, 5+a, ly, 2, 18-ly); p(legC, 5-a, ly, 2, 18-ly); p(shade(legC,-.25), 5-a, ly, 1, 18-ly);
        p(foot, 5+a+(dir==='r'?0:-1), 18, 3, 1); p(foot, 5-a+(dir==='r'?0:-1), 18, 3, 1);
      } else {
        const l1 = frame===1 ? 1 : 0, l2 = frame===2 ? 1 : 0;
        p(legC, 4, ly, 2, 18-ly-l1); p(legC, 6, ly, 2, 18-ly-l2);
        p(foot, 4, 18-l1, 2, 1); p(foot, 6, 18-l2, 2, 1);
      }
      // ลำตัว แขน
      const sh = L.shirt;
      if(side){ p(sh, 4, by, 4, bh); p(shade(sh,-.2), dir==='r'?4:7, by, 1, bh);
        const sw = frame===1 ? 1 : frame===2 ? -1 : 0; p(shade(sh,-.1), 6+(dir==='r'?-sw:sw)-0, by+1, 2, bh-2); p(sk, 6+(dir==='r'?-sw:sw), by+bh-1, 2, 1); }
      else { p(sh, 3, by, 6, bh); p(shade(sh,-.18), 3, by+bh-1, 6, 1);
        const sw = frame===1 ? 1 : frame===2 ? -1 : 0;
        p(sh, 2, by+(sw>0?1:0), 1, bh-2); p(sk, 2, by+bh-2+(sw>0?1:0), 1, 1);
        p(sh, 9, by+(sw<0?1:0), 1, bh-2); p(sk, 9, by+bh-2+(sw<0?1:0), 1, 1);
        if(L.vest && dir==='d'){ p('#f4f1e8', 5, by, 2, bh-1); p('#ffffff', 7, by+1, 1, 1); }
        if(L.apron && dir==='d'){ p(L.apron, 4, by+1, 4, bh); }
        if(L.robe){ p(sk, dir==='d'?7:4, by, 2, 2); }
        if(L.bag){ line(p, '#6b4a2a', dir==='d'?3:8, by, dir==='d'?8:3, by+bh-1); p('#8a5e34', dir==='d'?8:2, by+bh-2, 2, 2); }
      }
      // ศีรษะ
      if(side){
        p(sk, 4, top+2, 5, 4); p(hr, 3, top, 6, 2); p(hr, dir==='r'?3:8, top+2, 1, L.long?6:3); p(hr, dir==='r'?4:7, top+2, 1, 1);
        p('#2b1d14', dir==='r'?7:4, top+3, 1, 1); p(shade(sk,-.15), dir==='r'?8:3, top+4, 1, 1);
      } else if(dir==='u'){
        p(hr, 3, top, 6, 6); p(sk, 2, top+3, 1, 1); p(sk, 9, top+3, 1, 1);
        if(L.long) p(hr, 3, top+6, 6, 2);
      } else {
        p(sk, 3, top+1, 6, 5); p(hr, 3, top, 6, 2); p(hr, 3, top+2, 1, L.long?6:2); p(hr, 8, top+2, 1, L.long?6:2);
        p('#2b1d14', 4, top+3, 1, 1); p('#2b1d14', 7, top+3, 1, 1); p(shade(sk,-.22), 5, top+5, 2, 1);
        if(L.blush) { p('#e8908a', 4, top+4, 1, 1); p('#e8908a', 7, top+4, 1, 1); }
      }
      if(!L.hair) { /* ศีรษะโล้น (พระ) */ }
      if(L.bun) p(hr, 5, top-2, 2, 2);
      if(L.hat==='ngob'){ p('#d8b66a', 5, top-3, 2, 1); p('#d8b66a', 4, top-2, 4, 1); p('#c9a252', 2, top-1, 8, 1); p('#a8843e', 1, top, 10, 1); }
      if(L.hat==='cap'){ p(L.capC||'#c0392b', 3, top-1, 6, 2); if(dir==='d') p(shade(L.capC||'#c0392b',-.3), 3, top+1, 6, 1); else if(side) p(L.capC||'#c0392b', dir==='r'?8:1, top, 3, 1); }
    });
    pcache.set(key, c); return c;
  }

  /* ---------- สัตว์ ---------- */
  let SP = null;
  function sprites(){
    if(SP) return SP;
    SP = {};
    const chick = (w)=>pix(["....r..","...wwy.","w..wk..","wwwww..",".wwww..","..y.y.."], {r:'#d23a2a', w, y:'#e8a53a', k:'#222'});
    SP.hen = [chick('#f4efe4'), chick('#b8743a'), chick('#2b2420')];
    SP.buffalo = pix([
      "..........h...h.",
      "...........hbbh.",
      ".bbbbbbbbb.bbbb.",
      "bBBBBBBBBBbbkbbn",
      ".bbbbbbbbbbbbbbn",
      ".bbbbbbbbbbbbb..",
      ".bbbbbbbbbbb....",
      ".l.l.....l.l....",
      ".l.l.....l.l....",
    ], {h:'#e2d8c6', b:'#3f3a3a', B:'#5c5555', k:'#0d0d0d', n:'#7a6f6c', l:'#2e2a2a'});
    SP.dog = pix(["......ee","t....ddd",".dddddd.",".dddddd.",".d.d.d.d"], {e:'#8a6237', t:'#c79a5a', d:'#c79a5a'});
    SP.duck = pix(["...ww.","...wwo","wwwww.",".www.."], {w:'#fbf8ef', o:'#e98a2a'});
    SP.boat = spr(20, 5, p=>{ p('#6b4426',0,1,20,2); p('#8a5a32',1,0,18,1); p('#4e2f1a',2,3,16,1); p('#3a2312',4,4,12,1); p('#c9a24a',1,1,1,1); });
    SP.card = pix(["gggggg","gyyyyg","gywwyg","gyyyyg","gywwyg","gyyyyg","gggggg"], {g:'#a8741c', y:'#f2c94c', w:'#fff7d6'});
    SP.flag = (col)=>spr(7, 11, p=>{ p('#5a3e26',0,0,1,11); p(col,1,0,5,1); p(col,1,1,6,1); p(col,1,2,5,1); p(shade(col,-.3),1,3,3,1); });
    SP.flagRed = SP.flag('#d8322a'); SP.flagNew = SP.flag('#ff8a1e');
    SP.haystack = spr(11, 8, p=>{ p('#c9a24a',2,1,7,1); p('#e2bd5c',1,2,9,2); p('#d4ae4e',0,4,11,3); p('#b08a38',0,7,11,1); p('#f0d27a',3,2,3,1); });
    SP.scare = spr(9, 13, p=>{ p('#d8b66a',3,0,3,1); p('#c9a252',1,1,7,1); p('#e8c9a0',3,2,3,2); p('#7a5a3a',4,4,1,9); p('#b5402c',0,5,9,2); p('#2f6fb0',2,7,5,2); });
    SP.jar = spr(5, 6, p=>{ p('#7a3d1e',1,0,3,1); p('#a0552a',0,1,5,4); p('#c26a36',1,2,1,2); p('#6a3418',1,5,3,1); });
    SP.sign = spr(14, 12, p=>{ p('#5a3e26',2,4,2,8); p('#5a3e26',10,4,2,8); p('#8a5e34',0,0,14,6); p('#a8784a',1,1,12,4); p('#6b4426',0,6,14,1); });
    SP.bang = pix(["..yyy..",".yykyy.",".yykyy.",".yykyy.",".yyyyy.",".yykyy.","..yyy..","...y..."], {y:'#ffd23f', k:'#3a2a10'});
    SP.qmark = pix([".yyyy.","yy..yy","....yy","...yy.","..yy..","......","..yy.."], {y:'#ffe9a8'});
    SP.check = pix(["......g",".....gg","g...gg.","gg.gg..",".ggg...","..g...."], {g:'#3ccf6e'});
    SP.tape = spr(26, 7, p=>{ for(let x=0;x<26;x++) p(((x>>1)&1)?'#f2d23a':'#1e1e1e', x, 1, 1, 2); p('#d8322a',0,0,2,7); p('#d8322a',24,0,2,7); p('#ffffff',0,3,2,1); p('#ffffff',24,3,2,1); });
    // จักรยาน (มุมข้าง / มุมหน้า) มีตะกร้าหน้าแบบจักรยานบ้าน ๆ
    SP.bikeS = spr(16, 9, p=>{
      const wheel = (x)=>{ p('#222',x-2,4,1,3); p('#222',x+2,4,1,3); p('#222',x-1,3,3,1); p('#222',x-1,7,3,1); p('#b8b8b8',x,5,1,1); };
      wheel(3); wheel(12);
      line(p,'#c0392b',3,5,7,5); line(p,'#c0392b',7,5,5,1); line(p,'#c0392b',5,1,10,2); line(p,'#c0392b',10,1,12,5); line(p,'#c0392b',7,5,10,2);
      p('#3a2a1e',4,0,3,1); p('#333',9,0,3,1); p('#c9a24a',12,1,3,2); p('#a8843e',12,3,3,1);
    });
    SP.bikeF = spr(5, 11, p=>{ p('#333',0,2,5,1); p('#c0392b',2,3,1,3); p('#c9a24a',1,3,3,2); p('#222',2,6,1,5); p('#555',1,6,3,1); });
    // ขยะริมคลอง
    SP.trash = [
      pix(['.c.','.w.','www','wbw','www','www'], {c:'#2f6fb0', w:'#cfe8f2', b:'#8fc4dc'}),
      pix(['.p.p.','ppppp','pwppp','ppppp'], {p:'#f2f2ee', w:'#e86a8a'}),
      pix(['sss','rrr','rwr','rrr'], {s:'#b8b8b8', r:'#c0392b', w:'#f2f2ee'}),
    ];
    // ผีเสื้อ ๒ เฟรม · นก · ฟองอารมณ์เหนือหัว
    SP.fly = ['#f2c94c','#e86a8a','#8ab4f8','#f2f2ee'].map(c=>[pix(['c.c','.k.'], {c, k:'#222'}, false), pix(['.c.','ckc'], {c, k:'#222'}, false)]);
    SP.bird = [pix(['k...k','.k.k.'], {k:'#2a2420'}, false), pix(['.....','kkkkk'], {k:'#2a2420'}, false)];
    const bub = (draw)=>spr(9, 9, p=>{ p('#ffffff',1,0,7,7); p('#ffffff',0,1,9,5); p('#ffffff',3,7,2,1); p('#ffffff',3,8,1,1); draw(p); });
    SP.emo = {
      note: bub(p=>{ p('#2f6fb0',5,1,1,4); p('#2f6fb0',6,1,1,1); p('#2f6fb0',3,4,2,2); }),
      heart: bub(p=>{ p('#e8322a',2,2,2,2); p('#e8322a',5,2,2,2); p('#e8322a',2,3,5,1); p('#e8322a',3,4,3,1); p('#e8322a',4,5,1,1); }),
      dots: bub(p=>{ p('#555',2,3,1,1); p('#555',4,3,1,1); p('#555',6,3,1,1); }),
      sweat: bub(p=>{ p('#4f8ab8',4,1,1,1); p('#4f8ab8',3,2,3,2); p('#8ab4f8',4,2,1,1); p('#4f8ab8',4,4,1,1); }),
      bang: bub(p=>{ p('#e8b830',4,1,1,3); p('#e8b830',4,5,1,1); }),
      star: bub(p=>{ p('#e8b830',4,1,1,5); p('#e8b830',2,3,5,1); p('#e8b830',3,2,3,3); }),
    };
    // ต้นไม้ (สุ่มหลายแบบ)
    const R = rng(77);
    SP.palm = [0,1,2].map(v=>spr(23, 28, p=>{
      const lean = v-1, top = [11+lean*2, 8];
      for(let y=27;y>=top[1];y--){ const t = (27-y)/(27-top[1]), x = Math.round(11 + lean*2*t*t); p('#8a6a44',x,y,2,1); if(y%3===0) p('#6b5032',x,y,2,1); }
      const fr = [[-10,4],[-8,-3],[-3,-8],[3,-8],[9,-4],[11,3],[-6,8],[6,8]];
      fr.forEach(([dx,dy],i)=>{ line(p, i%2?'#2f6b2a':'#3f8a34', top[0],top[1], top[0]+dx, top[1]+dy); line(p, '#6fb84a', top[0],top[1]-1, top[0]+Math.round(dx*.7), top[1]+Math.round(dy*.7)-1); });
      p('#5a3a1e', top[0]-1, top[1]+1, 2, 2); p('#6b4a26', top[0]+1, top[1]+2, 2, 2);
    }));
    SP.banana = [0,1].map(v=>spr(15, 16, p=>{
      p('#5d8a32',7,9,2,7);
      const lv = [[-7,-1],[-6,-6],[0,-8],[6,-6],[7,0]];
      lv.forEach(([dx,dy],i)=>{ for(let k=0;k<3;k++) line(p, k===1?'#9ad35a':'#6fb03e', 7+k-1, 9, 7+dx+k-1, 9+dy); line(p,'#4f8a2a',7,9,7+dx,9+dy); });
      if(v) { p('#e8c84a',9,10,2,3); }
    }));
    SP.tree = [0,1,2].map(v=>spr(24, 24, p=>{
      p('#6b4a2a',10,15,4,9); p('#523720',11,19,2,5);
      const cols = v===2 ? ['#2f6b34','#3f8a3c','#5aa548'] : ['#2b5f2e','#3d7f38','#62a84a'];
      const blobs = [[12,9,9],[6,11,6],[18,11,6],[9,5,6],[15,5,6]];
      blobs.forEach(([cx,cy,r])=>{ for(let y=-r;y<=r;y++) for(let x=-r;x<=r;x++){ const d = x*x+y*y; if(d<=r*r){ const k = (x+y) < -r*.4 ? 2 : d > r*r*.6 ? 0 : 1; p(cols[k], cx+x, cy+y); } } });
      for(let i=0;i<10;i++) p(cols[2], 4+Math.floor(R()*16), 2+Math.floor(R()*12));
      if(v===1) for(let i=0;i<5;i++) p('#f2a43a', 5+Math.floor(R()*14), 6+Math.floor(R()*8));   // ต้นมะม่วงมีผล
    }));
    SP.bush = [0,1].map(v=>spr(9, 6, p=>{ p('#3d7f38',1,1,7,4); p('#2b5f2e',0,3,9,3); p('#62a84a',2,1,3,1); if(v){ p('#e85a8a',2,2,1,1); p('#f7d14a',6,3,1,1); } }));
    SP.bamboo = spr(13, 22, p=>{ for(let i=0;i<5;i++){ const x = 2+i*2; p(i%2?'#7cb342':'#5d9a2e', x, 3+(i%3), 1, 19-(i%3)); for(let y=5;y<21;y+=4) p('#3f6b1e', x, y); }
      for(let i=0;i<14;i++){ const x = 1+Math.floor(R()*11), y = 1+Math.floor(R()*14); p('#8bc34a', x, y, 2, 1); } });
    return SP;
  }

  /* ---------- บ้านเรือน ---------- */
  const ROOFS = [['#a0583a','#b86a45'],['#8c96a0','#a8b2bc'],['#c9a35a','#ddb86e'],['#a8382c','#c4483a'],['#4f7ea8','#6896c0']];
  const WALLS = [['#9a6b3f','#7d5532'],['#b58456','#94693f'],['#e6dcc8','#c9bda5']];
  function house(v){
    const [rc1, rc2] = ROOFS[v%5], [wc, wd] = WALLS[Math.floor(v/5)%3];
    return spr(24, 23, p=>{
      p('rgba(0,0,0,.18)', 3, 16, 18, 6);
      [4,9,14,19].forEach(x=>p('#5a3e26', x, 15, 1, 7));
      p('#6b4a2a', 2, 14, 20, 1);
      p(wc, 3, 7, 18, 7);
      for(let x=4;x<21;x+=3) p(wd, x, 7, 1, 7);
      p('#3a2a1a', 6, 9, 3, 3); p(shade(wc,.25), 5, 9, 1, 3); p(shade(wc,.25), 9, 9, 1, 3);
      p('#4a3220', 14, 8, 3, 6); p('#c9a24a', 16, 11, 1, 1);
      for(let r=0;r<=7;r++){ const half = Math.round(2 + r*1.45); p(r===7 ? shade(rc1,-.25) : (r%2?rc1:rc2), 12-half, r, half*2, 1); }
      p(shade(rc2,.2), 11, 0, 2, 1);
      for(let i=0;i<6;i++) p('#9a7048', 17+i*.7|0, 15+i, 3, 1);
      if(v%3===0){ p('#a0552a', 21, 18, 3, 4); p('#7a3d1e', 21, 17, 3, 1); }
    });
  }
  function hut(){ return spr(15, 15, p=>{ p('rgba(0,0,0,.15)',2,10,11,4); [2,12].forEach(x=>p('#5a3e26',x,6,1,9)); p('#8a6a44',1,8,13,1);
    for(let r=0;r<6;r++){ const h = 2+r; p(r%2?'#c9a35a':'#ddb86e', 7-h, r, h*2+1, 1); } p('#a8843e',0,6,15,1); }); }

  /* ---------- อาคารสถานที่สำคัญ ---------- */
  function thaiFlag(p, x, y){ p('#d8d8d8', x, y, 1, 14); ['#c8102e','#ffffff','#2d2a6e','#2d2a6e','#ffffff','#c8102e'].forEach((c,i)=>p(c, x+1, y+i, 7, 1)); }
  function siteSprite(id){
    const st = M.SITES[id];
    switch(st.type){
      case 'water': return spr(24, 22, p=>{
        p('rgba(0,0,0,.18)',3,15,18,5);
        p('#7a5a3a',4,3,1,12); p('#7a5a3a',19,3,1,12);
        for(let r=0;r<4;r++) p(r%2?'#9a4a32':'#b85a3c', 2+r*0, r, 20, 1);
        p('#7a3826',1,4,22,1);
        p('#9aa3a8',4,11,16,7); p('#b8c0c4',5,11,14,1); p('#7d868c',4,17,16,1);
        p('#2a5f8a',6,12,12,4); p('#3f7fae',7,12,6,1);
        p('#5a3e26',11,5,1,6); p('#8a5e34',10,9,3,3); p('#c9a24a',10,9,3,1);
        p('#6d7880',20,14,3,4); p('#4f8ab8',20,14,3,1);
      });
      case 'food': {
        const C = {R1:['#c0392b','#2e8a52'], R2:['#2f6fb0','#e8c84a'], R3:['#e8b830','#b5402c'], R4:['#8a1f1f','#222']}[id];
        return spr(34, 28, p=>{
          p('rgba(0,0,0,.18)',2,20,30,7);
          p('#8c96a0',2,0,30,2); p('#a8b2bc',2,2,30,2); p('#6d7780',2,4,30,1);
          p('#d9c19a',3,5,28,10); p('#b89c72',3,14,28,1);
          for(let x=0;x<30;x++){ const c = (Math.floor(x/3)%2) ? C[0] : '#f6efe4'; p(c, 2+x, 6, 1, 4); if(x%3===1) p(c, 2+x, 10, 1, 1); }
          p(C[1], 11, 1, 12, 3); p('#fff7d6', 12, 2, 10, 1);
          p('#8a5e34', 4, 12, 26, 4); p('#a8784a', 4, 12, 26, 1);
          // โต๊ะพลาสติก + เก้าอี้พลาสติกแดง/น้ำเงิน
          [[5,20],[19,20]].forEach(([x,y],i)=>{ p('#f2f2ee',x,y,8,3); p('#c9c9c2',x,y+3,8,1); p('#d8322a',x-2,y+1,2,2); p('#2f6fb0',x+8,y+1,2,2); p('#d8322a',x+3,y+4,2,2); });
          if(id==='R1'){ p('#6b4a2a',7,10,4,3); p('#8a6a44',8,10,2,1); p('#f29a3a',14,11,3,2); p('#7cb342',18,11,2,2); }
          if(id==='R2'){ p('#6b4426',6,13,22,3); p('#8a5a32',7,12,20,1); p('#9aa3a8',12,9,5,4); p('#ffffff',13,7,1,1); p('#ffffff',15,6,1,1); }
          if(id==='R3'){ p('#cfe6ec',8,8,12,5); p('#e89a4a',10,9,2,3); p('#e89a4a',14,9,2,3); p('#e89a4a',18,9,1,3); }
          if(id==='R4'){ [[7,19],[21,19]].forEach(([x,y])=>{ p('#3a3a3a',x,y,4,2); p('#6a6a6a',x+1,y-1,2,1); }); }
        });
      }
      case 'school': return spr(64, 38, p=>{
        p('rgba(0,0,0,.18)',2,28,58,8);
        p('#9a3a26',3,0,52,2); p('#b5452e',1,2,56,3); p('#c85a3c',1,5,56,2); p('#7a2e1e',1,7,56,1);
        p('#efe2c0',3,8,52,20); p('#d8c9a2',3,26,52,2);
        for(let i=0;i<8;i++){ const x = 6+i*6; if(i===3||i===4){ continue; } p('#5f8fb8',x,11,4,5); p('#8ab4d8',x,11,4,1); p('#5f8fb8',x,19,4,5); p('#8ab4d8',x,19,4,1); }
        p('#6b4426',24,18,10,10); p('#8a5e34',25,19,8,9); p('#c9a24a',28,23,1,1);
        p('#e8d090',22,10,14,6); p('#2e6a8a',23,11,12,4);
        thaiFlag(p, 58, 12); p('#9aa3a8',56,26,5,2);
      });
      case 'event': return spr(74, 52, p=>{
        p('rgba(0,0,0,.18)',2,44,64,7);
        p('#efe9dc',6,42,52,4); p('#d9d0bc',4,46,56,2);
        p('#fbf8f0',12,26,40,16); for(let x=14;x<52;x+=6) p('#e8e0cc',x,26,2,16);
        p('#8a1f1f',28,30,8,12); p('#e6b422',27,29,10,1); p('#e6b422',27,29,1,13); p('#e6b422',36,29,1,13);
        [[16,32],[44,32]].forEach(([x,y])=>{ p('#8a1f1f',x,y,4,6); p('#e6b422',x,y-1,4,1); });
        const tier = (y0, h, x0, x1)=>{ for(let r=0;r<h;r++){ const inset = Math.round((h-r)*1.3); p(r===h-1?'#2f7a4a':'#b3262a', x0+inset, y0+r, (x1-x0)-inset*2, 1); } p('#e6b422', x0+2, y0+h, x1-x0-4, 1); };
        tier(17, 9, 6, 58); tier(9, 9, 12, 52); tier(2, 8, 19, 45);
        p('#e6b422',31,0,2,3); p('#e6b422',30,0,1,1); p('#e6b422',33,0,1,1);
        [[7,17],[56,17],[13,9],[50,9]].forEach(([x,y])=>{ p('#e6b422',x,y-2,1,3); p('#e6b422',x+(x<32?-1:1),y-3,1,1); });
        p('#e6b422',26,19,12,6); p('#b3262a',28,20,8,4); p('#f2d06a',31,21,2,2);
        // เจดีย์
        p('#fbf8f0',62,36,10,8); p('#efe9dc',63,30,8,6); p('#fbf8f0',64,25,6,5); p('#efe9dc',65,21,4,4); p('#e6b422',66,12,2,9); p('#e6b422',67,9,1,3); p('#d9d0bc',61,44,12,2);
      });
      case 'ice': return spr(52, 34, p=>{
        p('rgba(0,0,0,.18)',2,26,48,7);
        for(let x=0;x<44;x++) p(x%3?'#8d9fad':'#6d7f8d', 2+x, 0, 1, 7);
        p('#5a6b78',2,7,44,1);
        p('#c4d0d8',3,8,42,18); p('#a8b6c0',3,24,42,2);
        p('#3a4650',8,14,14,12); for(let y=15;y<26;y+=2) p('#4c5a66',8,y,14,1);
        p('#2f6fb0',26,10,16,6); p('#cfeef8',28,11,4,4); p('#ffffff',28,11,2,1); p('#cfeef8',34,11,4,4); p('#ffffff',34,11,2,1);
        [[26,20],[31,20],[36,20],[28,16],[33,16]].forEach(([x,y])=>{ p('#bfe6f2',x,y,5,4); p('#eaf9ff',x,y,5,1); p('#8cc4d8',x+4,y+1,1,3); });
        p('#3f7fc0',44,22,7,6); p('#9ac8e8',45,23,3,2); p('#2a2a2a',45,28,2,2); p('#2a2a2a',49,28,2,2);
        p('rgba(120,180,220,.45)',24,27,14,3);
      });
      case 'farm': return spr(46, 30, p=>{
        for(let r=0;r<5;r++){ p('#6b4a2a',2,10+r*4,32,3); for(let x=3;x<33;x+=3) p(r%2?'#5aa548':'#7cc04f',x,10+r*4,2,2); }
        [36,40].forEach(x=>p('#5a3e26',x,8,1,8)); for(let r=0;r<5;r++){ const h = 1+r; p(r%2?'#c9a35a':'#ddb86e', 39-h, 2+r, h*2+2, 1); }
        p('#9aa3a8',38,20,4,4); p('#6d7880',41,22,5,1); p('#2a5f8a',44,24,2,6);
        p('#d8b66a',20,0,3,1); p('#c9a252',18,1,7,1); p('#e8c9a0',20,2,3,2); p('#7a5a3a',21,4,1,6); p('#b5402c',17,5,9,2);
      });
    }
  }
  function hcSprite(){
    return spr(48, 32, p=>{
      p('rgba(0,0,0,.18)',2,24,44,7);
      for(let r=0;r<7;r++){ const inset = 6-r; p(r===6?'#2c5480':(r%2?'#3d6fa3':'#4a7fb5'), inset, r, 44-inset*2+2, 1); }
      p('#f6f4ee',3,7,40,17); p('#dedbd2',3,22,40,2);
      [6,12,30,36].forEach(x=>{ p('#7fb2d8',x,11,4,5); p('#b8d8ee',x,11,4,1); });
      p('#5f8fb8',19,13,8,11); p('#8ab4d8',20,14,6,9); p('#cfd8de',18,24,10,2);
      p('#ffffff',19,3,8,7); p('#2e9a5a',22,4,2,5); p('#2e9a5a',20,6,6,1); p('#2e9a5a',20,5,6,2); p('#2e9a5a',22,4,2,5);
      thaiFlag(p, 44, 8);
    });
  }

  /* ---------- พื้นที่: คลอง ถนน นาข้าว (เรนเดอร์ครั้งเดียวต่อคดี) ---------- */
  function bez(pts){
    const out = [pts[0].slice()];
    for(let i=0;i<pts.length-1;i++){
      const p0 = pts[i-1]||pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2]||p2;
      const c1 = [p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6], c2 = [p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6];
      for(let k=1;k<=18;k++){ const t = k/18, u = 1-t;
        out.push([u*u*u*p1[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*p2[0], u*u*u*p1[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*p2[1]]); }
    }
    return out;
  }
  function mask(draw){
    const c = canvas(WW, WH), g = c.getContext('2d'); g.strokeStyle = g.fillStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
    draw(g); const d = g.getImageData(0,0,WW,WH).data, m = new Uint8Array(WW*WH);
    for(let i=0;i<m.length;i++) m[i] = d[i*4+3] > 110 ? 1 : 0; return m;
  }
  const stroke = (g, pts, w) => { g.lineWidth = w; g.beginPath(); pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])); g.stroke(); };

  function build(){
    const R = rng(W.seed ^ 0x51ed);
    const canal = bez(M.CANAL), roads = M.ROADS.map(bez);
    const mBank = mask(g=>stroke(g, canal, 30)), mWater = mask(g=>stroke(g, canal, 22)), mDeep = mask(g=>stroke(g, canal, 11));
    const mRoad = mask(g=>roads.forEach((r,i)=>stroke(g, r, i===0?14:10)));
    const mRoadE = mask(g=>roads.forEach((r,i)=>stroke(g, r, i===0?17:13)));
    const mBridge = mask(g=>roads.forEach(r=>stroke(g, r, 20)));   // สะพานกว้างกว่าถนน ให้เดินข้ามคลองได้สบาย
    const mNear = mask(g=>{ roads.forEach(r=>stroke(g, r, 34)); stroke(g, canal, 54);
      for(const id in M.SITES){ const s = loc(id); g.beginPath(); g.arc(s.x, s.y, 50, 0, 7); g.fill(); }
      g.beginPath(); g.arc(HC.x, HC.y, 46, 0, 7); g.fill(); });
    // ระยะถึงหมู่บ้าน (วงรีตามการกระจายบ้าน)
    const VS = M.VILLAGES;
    const vd = (x,y) => { let m = 1e9; for(let k=0;k<VS.length;k++){ const v = VS[k], a = (x-v.x)/v.sx, b = (y-v.y)/v.sy, d = a*a+b*b; if(d<m) m = d; } return Math.sqrt(m); };

    const bg = canvas(WW, WH), g = bg.getContext('2d'), img = g.createImageData(WW, WH), d = img.data;
    const put = (i, c) => { d[i*4]=c[0]; d[i*4+1]=c[1]; d[i*4+2]=c[2]; d[i*4+3]=255; };
    const GRASS = [[96,156,72],[106,168,78],[86,142,64],[118,176,84]];
    const PADDY = {gold:[[214,182,82],[200,166,70],[226,196,98]], green:[[124,184,72],[110,170,62],[138,196,84]], stub:[[176,150,96],[160,134,84],[188,162,108]]};
    const paddyKind = (cx,cy) => { const h = hash(cx*7+3, cy*13+1); return h<.5 ? 'gold' : h<.78 ? 'green' : 'stub'; };
    const isPaddy = new Uint8Array(WW*WH);
    for(let y=0;y<WH;y++) for(let x=0;x<WW;x++){
      const i = y*WW+x, n = hash(x,y), vn = vnoise(x,y,22);
      if(mWater[i] && !mBridge[i]){
        const edge = !mWater[i-1] || !mWater[i+1] || !mWater[i-WW] || !mWater[i+WW];
        put(i, edge ? [96,150,170] : mDeep[i] ? (n<.04 ? [70,130,175] : [44,104,150]) : (n<.05 ? [86,150,190] : [58,124,170])); continue;
      }
      if(mWater[i]){                                    // สะพานไม้ มีราวสองข้าง
        const rail = !mBridge[i-1] || !mBridge[i+1] || !mBridge[i-WW] || !mBridge[i+WW] || !mBridge[i-2] || !mBridge[i+2];
        put(i, rail ? [74,48,26] : (y%3===0) ? [112,78,46] : n<.1 ? [168,124,78] : [150,108,66]); continue;
      }
      if(mRoad[i]){
        if(n<.08) put(i, [184,148,96]); else if(n>.93) put(i, [214,184,130]); else put(i, [200,166,112]); continue;
      }
      if(mRoadE[i]){ put(i, mWater[i] ? [74,50,30] : [168,134,86]); continue; }
      if(mBank[i]){ put(i, n<.3 ? [138,120,78] : n<.55 ? [120,150,74] : [148,128,84]); continue; }
      const dv = vd(x,y);
      if(dv < 1.25){                                   // ลานดินในหมู่บ้าน ผสมหญ้า
        const t = (dv - .55)/.7 + (vn-.5)*.9;
        if(t < .35) put(i, n<.15 ? [176,148,98] : n<.2 ? [210,182,130] : [194,166,114]);
        else put(i, GRASS[Math.floor(n*4)]);
        continue;
      }
      if(dv > 1.7 && !mNear[i]){                       // นาข้าว แบ่งแปลงด้วยคันนา
        const cx = Math.floor((x + Math.floor(vnoise(0,y,60)*8))/28), cy = Math.floor(y/20);
        const bx = (x + Math.floor(vnoise(0,y,60)*8)) % 28, by = y % 20;
        isPaddy[i] = 1;
        if(bx===0 || by===0){ put(i, n<.5 ? [132,160,80] : [148,170,92]); continue; }
        const k = paddyKind(cx,cy), pal = PADDY[k];
        if(k==='stub') put(i, (x+y)%4===0 ? pal[2] : pal[Math.floor(n*2)]);
        else put(i, (y%3===0) ? pal[1] : (n<.12 ? pal[2] : pal[0]));
        continue;
      }
      const c = GRASS[vn<.35 ? 2 : vn>.7 ? 3 : (n<.5?0:1)];
      put(i, n>.995 ? [240,220,90] : n>.99 ? [235,120,150] : c);
    }
    g.putImageData(img, 0, 0);
    // เส้นกึ่งกลางถนนสายหลัก
    let acc = 0; for(let k=1;k<roads[0].length;k++){ const a = roads[0][k-1], b = roads[0][k], L = Math.hypot(b[0]-a[0], b[1]-a[1]);
      for(let s=0;s<L;s+=1){ acc++; if(acc%10<5){ const x = Math.round(a[0]+(b[0]-a[0])*s/L), y = Math.round(a[1]+(b[1]-a[1])*s/L); g.fillStyle = '#e8d8a8'; g.fillRect(x,y,1,1); } } }

    // พื้นที่ทึบ (เดินผ่านไม่ได้): น้ำ (ยกเว้นสะพาน) + ฐานอาคาร
    const solid = new Uint8Array(WW*WH);
    for(let i=0;i<solid.length;i++) solid[i] = mWater[i] && !mBridge[i] ? 1 : 0;
    const block = (x0,y0,w,h) => { for(let y=Math.max(0,y0|0); y<Math.min(WH,(y0+h)|0); y++) for(let x=Math.max(0,x0|0); x<Math.min(WW,(x0+w)|0); x++) solid[y*WW+x] = 1; };
    const free = (x0,y0,w,h,pad=2) => { for(let y=y0-pad;y<y0+h+pad;y++) for(let x=x0-pad;x<x0+w+pad;x++){ if(x<4||y<4||x>=WW-4||y>=WH-4) return false; const i = y*WW+x; if(solid[i]||mRoadE[i]||mBank[i]) return false; } return true; };

    const objs = [], sp = sprites(), spots = [];
    const add = (o) => { objs.push(o); return o; };
    // สถานที่สำคัญ: ฐานภาพอยู่ที่ y+10 · จุดคุย/ทางเข้าอยู่ที่ y+18
    const SITE_FOOT = {water:[16,4], food:[30,6], school:[54,6], event:[60,6], ice:[46,6], farm:[10,6]};
    for(const id in M.SITES){
      const st = Object.assign({}, M.SITES[id], loc(id)), c = siteSprite(id), bx = Math.round(st.x - c.width/2), by = Math.round(st.y + 10 - c.height);
      const [fw, fh] = SITE_FOOT[st.type];
      const fx = st.type==='farm' ? st.x + 14 : st.x - fw/2;
      block(fx, st.y + 10 - fh - 2, fw, fh);
      add({kind:'site', id, img:c, x:bx, y:by, base:st.y+10});
      spots.push({kind:'site', id, x:st.x, y:st.y+18, r:22, w:c.width/2+8});
    }
    { const c = hcSprite(), bx = Math.round(HC.x - c.width/2), by = Math.round(HC.y + 10 - c.height);
      block(HC.x-22, HC.y+2, 44, 8); add({kind:'hc', img:c, x:bx, y:by, base:HC.y+10}); spots.push({kind:'hc', x:HC.x, y:HC.y+18, r:22, w:32}); }
    // ป้ายหมู่บ้านกลางลานบ้าน
    const plazas = M.VILLAGES.map(v=>{
      let px = v.x, py = v.y;
      for(let t=0;t<40 && !free(px-8, py-6, 16, 10, 4); t++){ px = v.x + (R()-.5)*60; py = v.y + (R()-.5)*40; }
      block(px-5, py+8, 10, 3);
      add({kind:'sign', img:sp.sign, x:Math.round(px-8), y:Math.round(py-2), base:py+11, vid:v.id});
      spots.push({kind:'village', vid:v.id, x:px, y:py+16, r:18});
      return {vid:v.id, x:px, y:py+16};
    });
    // บ้านตามตำแหน่งครัวเรือนจริงในโลกจำลอง (วางเท่าที่ไม่ทับกัน)
    const houses = [];
    const hhs = W.households.slice().sort((a,b)=>hash(a.id,9)-hash(b.id,9));
    for(const hh of hhs){
      const x = Math.round(hh.x - 12), y = Math.round(hh.y - 18);
      if(houses.some(h=>Math.abs(h.x-x)<25 && Math.abs(h.y-y)<21)) continue;
      if(plazas.some(q=>Math.hypot(q.x-hh.x, q.y-16-hh.y)<24)) continue;
      if(Object.keys(M.SITES).map(loc).some(s=>Math.abs(s.x-hh.x)<44 && Math.abs(s.y-hh.y)<34) || Math.hypot(HC.x-hh.x, HC.y-hh.y)<40) continue;
      if(!free(x+2, y+14, 20, 8, 1)) continue;
      const v = Math.floor(hash(hh.id, 3)*15);
      block(x+3, y+16, 18, 6);
      houses.push({x, y, hh:hh.id});
      add({kind:'house', img:house(v), x, y, base:y+22, hh:hh.id});
      if(hash(hh.id,5)<.35){ const jx = x + 24, jy = y + 16; if(free(jx, jy, 5, 6, 0)) add({kind:'prop', img:sp.jar, x:jx, y:jy, base:jy+6}); }
    }
    // เถียงนา กองฟาง หุ่นไล่กา ในนาข้าว
    const inPaddy = (x,y) => x>2 && y>2 && x<WW-2 && y<WH-2 && isPaddy[(y|0)*WW+(x|0)];
    const hutImg = hut();
    for(let k=0, n=0; k<400 && n<9; k++){ const x = Math.floor(R()*WW), y = Math.floor(R()*WH); if(!inPaddy(x,y)||!inPaddy(x+14,y+14)||!free(x, y+8, 15, 6, 2)) continue; block(x+2,y+10,11,4); add({kind:'prop', img:hutImg, x, y, base:y+15}); n++; }
    for(let k=0, n=0; k<600 && n<26; k++){ const x = Math.floor(R()*WW), y = Math.floor(R()*WH); if(!inPaddy(x,y)||!inPaddy(x+10,y+8)) continue; add({kind:'prop', img:sp.haystack, x, y, base:y+8}); n++; }
    for(let k=0, n=0; k<400 && n<7; k++){ const x = Math.floor(R()*WW), y = Math.floor(R()*WH); if(!inPaddy(x,y)) continue; add({kind:'prop', img:sp.scare, x, y, base:y+13}); n++; }
    // ต้นไม้: มะพร้าวริมคลองและในหมู่บ้าน กล้วย ต้นไม้ใหญ่ ไผ่ พุ่มไม้
    const treeOk = (x,y,w) => { const i = (y|0)*WW+(x|0); if(x<6||y<6||x>WW-6||y>WH-6) return false; if(solid[i]||mRoadE[i]||mWater[i]) return false;
      if(spots.some(s=>Math.abs(s.x-x) < (s.w||16) && y > s.y-34 && y < s.y+28)) return false;
      return !objs.some(o=>o.kind!=='tree' && o.kind!=='prop' ? (x > o.x-4 && x < o.x+o.img.width+4 && y > o.base-o.img.height*.5-4 && y < o.base+6) : false) && !objs.some(o=>o.kind==='tree' && Math.abs(o.tx-x)<w && Math.abs(o.base-y)<6); };
    const plant = (img, x, y) => add({kind:'tree', img, x:Math.round(x-img.width/2), y:Math.round(y-img.height), base:Math.round(y), tx:x});
    for(let k=0;k<canal.length;k+=3){ const q = canal[k]; for(const side of [-1,1]){ if(R()<.45) continue; const x = q[0] + (R()-.5)*20, y = q[1] + side*(18+R()*10); if(treeOk(x,y,10)) plant(sp.palm[Math.floor(R()*3)], x, y); } }
    for(const v of M.VILLAGES) for(let k=0;k<26;k++){ const x = v.x + gauss(R)*v.sx*1.1, y = v.y + gauss(R)*v.sy*1.1;
      const t = R(), img = t<.3 ? sp.palm[Math.floor(R()*3)] : t<.6 ? sp.banana[Math.floor(R()*2)] : t<.85 ? sp.tree[Math.floor(R()*3)] : sp.bamboo; if(treeOk(x,y,12)) plant(img, x, y); }
    for(let k=0;k<900;k++){ const x = R()*WW, y = R()*WH, i = (y|0)*WW+(x|0); if(isPaddy[i]) { if(R()<.97) continue; }
      const t = R(), img = t<.35 ? sp.tree[Math.floor(R()*3)] : t<.55 ? sp.palm[Math.floor(R()*3)] : t<.85 ? sp.bush[Math.floor(R()*2)] : sp.banana[Math.floor(R()*2)];
      if(treeOk(x,y,14)) plant(img, x, y); }
    for(const o of objs) if(o.kind==='tree' && o.img.width>12) block(o.tx-1, o.base-2, 3, 2);

    // ตารางเดิน (A*)
    const grid = new Uint8Array(GW*GH);
    // เซลล์เดินได้ถ้าจุดกลางเซลล์ยืนได้ (เกณฑ์เดียวกับ walkable) — สะพานแคบจึงยังข้ามได้
    const ok = (x,y) => { if(x<4||y<4||x>=WW-4||y>=WH-2) return false; const i = y*WW+x; return !solid[i] && !solid[i-3] && !solid[i+3]; };
    for(let gy=0;gy<GH;gy++) for(let gx=0;gx<GW;gx++){ const cx = gx*CELL+2, cy = gy*CELL+2; let b = 0;
      for(let dy=-2;dy<=2 && !b;dy+=2) for(let dx=-2;dx<=2;dx+=2) if(!ok(cx+dx, cy+dy)){ b = 1; break; }
      grid[gy*GW+gx] = b; }

    // เซลล์ที่เดินไปถึงได้จริงจาก รพ.สต. (กันของสะสมไปตกในที่ที่ถูกล้อมไว้)
    const reach = new Uint8Array(GW*GH);
    { const s0 = ((HC.y+24)/CELL|0)*GW + (HC.x/CELL|0), q = [s0]; reach[s0] = 1;
      while(q.length){ const k = q.pop(), kx = k%GW, ky = k/GW|0;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = kx+dx, ny = ky+dy; if(nx<0||ny<0||nx>=GW||ny>=GH) continue; const n = ny*GW+nx; if(!grid[n] && !reach[n]){ reach[n] = 1; q.push(n); } } } }
    const reachable = (x,y) => x>=0 && y>=0 && x<WW && y<WH && reach[(y/CELL|0)*GW+(x/CELL|0)] === 1;
    // ประกายน้ำ
    const sparkles = []; for(let k=0;k<4000 && sparkles.length<700;k++){ const x = Math.floor(R()*WW), y = Math.floor(R()*WH); if(mWater[y*WW+x] && !mBridge[y*WW+x]) sparkles.push([x,y,R()*6.28]); }
    // การ์ดความรู้
    const cards = []; for(let k=0;k<3000 && cards.length<CARDS.length;k++){ const x = 30+R()*(WW-60), y = 30+R()*(WH-60);
      if(!reachable(x,y) || cards.some(c=>Math.hypot(c.x-x,c.y-y)<110) || spots.some(s=>Math.hypot(s.x-x,s.y-y)<40)) continue; cards.push({x, y, i:cards.length}); }
    // จุดริมคลองที่เดินถึงได้ (ใช้วางขยะ หิ่งห้อย)
    const bankPts = []; for(let k=0;k<canal.length;k+=2){ const a = canal[Math.max(0,k-1)], b = canal[Math.min(canal.length-1,k+1)], L = Math.hypot(b[0]-a[0], b[1]-a[1]) || 1, nx = -(b[1]-a[1])/L, ny = (b[0]-a[0])/L;
      for(const s of [-1,1]){ const x = canal[k][0]+nx*s*17, y = canal[k][1]+ny*s*17; if(reachable(x,y) && walkableAt(solid,x,y)) bankPts.push([x,y]); } }

    // มินิแมป
    const mm = canvas(WW/5, WH/5), mg = mm.getContext('2d'); mg.imageSmoothingEnabled = true; mg.drawImage(bg, 0, 0, WW/5, WH/5);
    for(const o of objs) if(o.kind==='house'){ mg.fillStyle = '#7a4a2a'; mg.fillRect(o.x/5+1, o.y/5+2, 3, 2); }

    return {bg, solid, grid, objs, spots, plazas, canal, sparkles, cards, mm, houses, inPaddy, mWater, mRoad, reachable, bankPts};
  }
  function walkableAt(solid, x, y){ if(x<4||y<4||x>=WW-4||y>=WH-2) return false; const i = (y|0)*WW+(x|0); return !solid[i] && !solid[i-3] && !solid[i+3]; }
  const HC = {x:300, y:200, name:'รพ.สต. บ้านสุขใจ'};
  /* อาคารบางแห่งเลื่อนจากจุดบนแผนที่ข้อมูลเล็กน้อย ไม่ให้ตัวอาคารทับถนน/คลอง */
  const OFF = {S:[45,12], R3:[25,40], R4:[0,-18], F1:[0,38], F2:[0,30]};
  const loc = id => { const s = M.SITES[id], o = OFF[id] || [0,0]; return {x:s.x+o[0], y:s.y+o[1]}; };
  const gauss = R => { let u=0,v=0; while(!u)u=R(); while(!v)v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };

  /* ---------- ความรู้สำหรับเก็บสะสม ---------- */
  const CARDS = [
    ['🧼 ล้างมือ', 'ล้างมือด้วยสบู่อย่างน้อย ๒๐ วินาที ก่อนกินและหลังเข้าห้องน้ำ ลดโรคท้องร่วงได้เกือบครึ่ง'],
    ['🔥 ต้มน้ำ', 'ต้มน้ำให้เดือดพล่านอย่างน้อย ๑ นาที ฆ่าเชื้อแบคทีเรียและไวรัสที่ทำให้ท้องร่วงได้เกือบทั้งหมด'],
    ['🗺️ จอห์น สโนว์', 'ปี ค.ศ. ๑๘๕๔ หมอจอห์น สโนว์ ปักจุดบ้านผู้ป่วยอหิวาต์บนแผนที่ลอนดอน จนพบว่าต้นเหตุคือปั๊มน้ำบนถนนบรอดสตรีท — ธงแดงในหมู่บ้านนี้ก็คือแผนที่จุดแบบเดียวกัน'],
    ['⏳ ระยะฟักตัว', 'ระยะฟักตัว คือเวลาตั้งแต่ได้รับเชื้อจนเริ่มป่วย ถ้ารู้ระยะฟักตัว เราย้อนเวลากลับไปหา “มื้อต้องสงสัย” ได้'],
    ['📊 Odds Ratio', 'OR มากกว่า ๑ แปลว่าคนป่วยเคยสัมผัสสิ่งนั้นบ่อยกว่าคนไม่ป่วย — แต่ต้องดูช่วงความเชื่อมั่นด้วยว่าไม่คร่อม ๑'],
    ['🎭 ตัวแปรกวน', 'สองอย่างเกิดคู่กัน ไม่ได้แปลว่าอย่างหนึ่งเป็นสาเหตุของอีกอย่าง — อาจมีปัจจัยที่สามซ่อนอยู่ เช่น คนหมู่เดียวกันใช้บ่อเดียวกันและกินร้านเดียวกัน'],
    ['🧊 น้ำแข็ง', 'น้ำแข็งก็พาเชื้อโรคได้ ถ้าผลิตจากน้ำไม่สะอาดหรือขนส่งไม่ถูกสุขลักษณะ'],
    ['🔐 ข้อมูลส่วนบุคคล', 'นักวิทยาศาสตร์ข้อมูลสุขภาพต้องปกป้องข้อมูลผู้ป่วย ใช้รหัสแทนชื่อ และเปิดเผยเท่าที่จำเป็นตาม PDPA'],
    ['🤖 Machine Learning', 'โมเดล ML เรียนรู้รูปแบบจากข้อมูล แต่ข้อมูลผิด โมเดลก็ผิด — มนุษย์ต้องตรวจสอบผลเสมอ'],
    ['🥄 กินร้อน ช้อนกลาง', 'กินอาหารที่ปรุงสุกใหม่ ใช้ช้อนกลาง และล้างมือ — สามข้อง่าย ๆ ที่ช่วยตัดวงจรเชื้อโรคทางอาหาร'],
  ];

  /* ---------- ตัวละครในหมู่บ้าน ---------- */
  const SKINS = ['#e8b98e','#d9a37a','#c98d5f','#b97c52','#f0c8a0'], HAIRS = ['#1c1410','#2a1d17','#3a2a20','#4a3626'];
  const SHIRTS = ['#c0392b','#2f6fb0','#2e8a52','#e8a33d','#7b3fa0','#e86a8a','#f2f2ee','#3a8a8a','#d8c84a','#6a7a8a'];
  function lookFor(p){
    const h = k => hash(p.id, k);
    const kid = p.age < 13, old = p.age >= 60, fem = p.sex==='หญิง';
    return {skin:SKINS[Math.floor(h(1)*5)], hair: old ? '#9a9590' : HAIRS[Math.floor(h(2)*4)], long: fem && h(3)<.7, bun: fem && old && h(4)<.6,
      shirt:SHIRTS[Math.floor(h(5)*SHIRTS.length)], pants: fem ? (h(6)<.5 ? '#5a3a6a' : '#3a4a6a') : (h(6)<.5 ? '#3a3a44' : '#5a4a3a'), kid,
      hat: !kid && h(7)<.22 ? 'ngob' : kid && h(7)<.2 ? 'cap' : null, capC: SHIRTS[Math.floor(h(8)*SHIRTS.length)], blush: kid};
  }
  const NAMED = [
    {who:'doctor', at:()=>({x:HC.x+26, y:HC.y+20}), look:{skin:'#dcab82', hair:'#15100c', shirt:'#4e9a82', pants:'#2b3550', vest:true}},
    {who:'boonma', at:()=>{ const q = built.plazas[1]; return {x:q.x+14, y:q.y-2}; }, look:{skin:'#c99064', hair:'#8f8984', bun:true, long:false, shirt:'#5a8fd0', pants:'#3a3a5a'}},
    {who:'kamnan', at:()=>{ const q = built.plazas[2]; return {x:q.x-14, y:q.y-2}; }, look:{skin:'#b97c52', hair:'#2a2623', shirt:'#b0904f', pants:'#4a3e2a'}},
    {who:'monk', at:()=>({x:loc('E').x-24, y:loc('E').y+22}), look:{skin:'#c88d5e', hair:null, shirt:'#d9782a', pants:'#d9782a', robe:true}},
    {who:'vendorF', at:()=>({x:loc('R1').x+20, y:loc('R1').y+18}), look:{skin:'#c98d5f', hair:'#231a14', long:true, shirt:'#c0392b', pants:'#3a3a44', apron:'#f2f2ee'}},
    {who:'vendorM', at:()=>({x:loc('R2').x+20, y:loc('R2').y+18}), look:{skin:'#b67a4e', hair:'#2a2420', shirt:'#7a5a2a', pants:'#2f7a4a', hat:'ngob'}},
    {who:'director', at:()=>({x:loc('S').x-22, y:loc('S').y+20}), look:{skin:'#e0b088', hair:'#1c1410', shirt:'#2b3a5c', pants:'#2b3a5c'}},
  ];
  /* ตัวละครภารกิจ (ไม่มีในฉากเล่าเรื่อง จึงใช้ภาพพิกเซลเป็นรูปหน้า) */
  const QNPC = {
    yai:  {name:'ยายผิน', title:'ชาวบ้าน หมู่ ๑ บ้านทุ่ง', look:{skin:'#c99064', hair:'#a8a29c', bun:true, shirt:'#8a5aa8', pants:'#4a3a5a'}},
    kids: {name:'น้องต้นข้าว กับ น้องใบเตย', title:'นักเรียน ป.๓ โรงเรียนบ้านสุขใจ', look:{skin:'#f0c8a0', hair:'#1c1410', kid:true, shirt:'#f2f2ee', pants:'#2b3a6c', blush:true}},
    kids2:{look:{skin:'#d9a37a', hair:'#2a1d17', kid:true, long:true, shirt:'#f2f2ee', pants:'#2b3a6c', blush:true}},
    lung: {name:'ลุงเผือก', title:'ชาวประมงริมคลอง', look:{skin:'#b97c52', hair:'#2a2623', shirt:'#4f7fa8', pants:'#3a3a44', hat:'ngob'}},
  };
  const WASH = [['🙌','ฝ่ามือถูฝ่ามือ'],['🤚','ฝ่ามือถูหลังมือ ทีละข้าง'],['🤲','ฝ่ามือถูฝ่ามือ นิ้วสอดประสานกัน'],['✊','หลังนิ้วมือถูฝ่ามือ (เกี่ยวนิ้วกัน)'],['👍','ถูนิ้วหัวแม่มือโดยรอบ'],['👌','ปลายนิ้วถูวนที่ฝ่ามือ'],['⌚','ถูรอบข้อมือ']];
  let quest = null;      // ตำแหน่งต่าง ๆ ของภารกิจ (คำนวณต่อคดี)
  let qhen = null, flies = [], fireflies = [], birds = null, birdT = 8, parts = [], dustT = 0;

  function spawnActors(){
    actors = [];
    const R = rng(W.seed ^ 0x77);
    for(const n of NAMED){ const a = n.at(), q = freeNear(a.x, a.y); actors.push({kind:'named', who:n.who, look:n.look, x:q.x, y:q.y, hx:q.x, hy:q.y, dir:'d', frame:0, t:0, emoT:2+R()*6}); }
    // ชาวบ้านที่ยังสบายดี เดินไปมาใกล้บ้านตัวเอง
    const pool = W.people.filter(p=>p.inf===null && hash(p.id, 11) < .06).slice(0, 26);
    for(const p of pool){ const hh = W.households[p.hh-1], q = freeNear(hh.x, hh.y+6); actors.push({kind:'villager', p, look:lookFor(p), x:q.x, y:q.y, hx:q.x, hy:q.y, dir:'d', frame:0, t:R()*3, tx:null, ty:null, speed:18+R()*12, emoT:3+R()*8}); }
    // ผู้ให้ภารกิจ
    const pl1 = built.plazas[0], sc = loc('S');
    const qa = (q, look, x, y) => { const p = freeNear(x, y); actors.push({kind:'quest', q, look, x:p.x, y:p.y, hx:p.x, hy:p.y, dir:'d', frame:0, t:0, emoT:1+R()*4}); return p; };
    const yaiP = qa('yai', QNPC.yai.look, pl1.x-18, pl1.y-4);
    qa('kids', QNPC.kids.look, sc.x+26, sc.y+24); qa('kids', QNPC.kids2.look, sc.x+36, sc.y+27);
    const lb = built.bankPts.slice().sort((a,b)=>Math.hypot(a[0]-250,a[1]-395)-Math.hypot(b[0]-250,b[1]-395))[0] || [250,395];
    const lungP = qa('lung', QNPC.lung.look, lb[0], lb[1]);
    // ไก่นางดำ: ไปเตร็ดเตร่ไกลจากบ้านยาย · ขยะ ๘ ชิ้นริมคลอง
    let hen = null;
    for(let k=0;k<4000 && !hen;k++){ const x = 20+R()*(WW-40), y = 20+R()*(WH-40), d = Math.hypot(x-yaiP.x, y-yaiP.y);
      if(d>170 && d<330 && built.reachable(x,y) && walkable(x,y) && (k>2500 || built.inPaddy(x,y))) hen = {x, y}; }
    hen = hen || freeNear(yaiP.x+200, yaiP.y+120);
    const marks = [{n:HC.name, x:HC.x, y:HC.y}].concat(Object.keys(M.SITES).filter(id=>!M.SITES[id].hidden).map(id=>Object.assign({n:M.SITES[id].name}, loc(id)))).concat(M.VILLAGES.map(v=>({n:v.name, x:v.x, y:v.y})));
    const lm = marks.sort((a,b)=>Math.hypot(a.x-hen.x,a.y-hen.y)-Math.hypot(b.x-hen.x,b.y-hen.y))[0];
    const trash = []; const bp = built.bankPts.slice();
    for(let k=0;k<600 && trash.length<8 && bp.length;k++){ const q = bp[Math.floor(R()*bp.length)]; if(trash.some(t=>Math.hypot(t.x-q[0],t.y-q[1])<45) || Math.hypot(q[0]-lungP.x,q[1]-lungP.y)<30) continue; trash.push({x:q[0], y:q[1], k:trash.length%3}); }
    quest = {yai:yaiP, lung:lungP, hen, henMark:lm.n, trash};
    qhen = {x:hen.x, y:hen.y, hx:hen.x, hy:hen.y, tx:null, ty:null, t:0, dir:'r', frame:0, speed:20};
    const animal = (kind, img, n, where, speed) => { for(let k=0, m=0; k<500 && m<n; k++){ const q = where(R); if(!q || !walkable(q.x,q.y)) continue; actors.push({kind, img, x:q.x, y:q.y, hx:q.x, hy:q.y, dir:R()<.5?'l':'r', t:R()*3, speed, tx:null, ty:null}); m++; } };
    animal('hen', null, 14, R=>{ const h = built.houses[Math.floor(R()*built.houses.length)]; return h && {x:h.x+R()*30-3, y:h.y+24+R()*10}; }, 22);
    animal('dog', SP.dog, 4, R=>{ const v = M.VILLAGES[Math.floor(R()*5)]; return {x:v.x+(R()-.5)*80, y:v.y+(R()-.5)*60}; }, 30);
    animal('buffalo', SP.buffalo, 6, R=>{ const x = R()*WW, y = R()*WH; return built.inPaddy(x,y) ? {x,y} : null; }, 6);
    actors.filter(a=>a.kind==='hen').forEach((a,i)=>a.img = SP.hen[i%3]);
    ducks = []; for(let k=0;k<7;k++){ const s = Math.floor(R()*built.canal.length); ducks.push({s, off:(R()-.5)*8, dir: R()<.5?1:-1, t:R()*10}); }
    boat = {s:20, dir:1};
    clouds = [0,1,2].map(i=>({x:R()*WW, y:R()*WH, r:40+R()*40, v:4+R()*4}));
    flies = []; for(const v of M.VILLAGES) for(let k=0;k<3;k++) flies.push({hx:v.x+(R()-.5)*120, hy:v.y+(R()-.5)*80, x:0, y:0, ph:R()*9, c:Math.floor(R()*4)});
    fireflies = []; for(let k=0;k<60 && built.bankPts.length;k++){ const q = built.bankPts[Math.floor(R()*built.bankPts.length)]; fireflies.push({x:q[0]+(R()-.5)*30, y:q[1]+(R()-.5)*20-6, ph:R()*9}); }
    birds = null; birdT = 6;
  }
  function freeNear(x, y){
    for(let r=0;r<60;r+=3) for(let a=0;a<8;a++){ const xx = x + Math.cos(a*.785)*r, yy = y + Math.sin(a*.785)*r; if(walkable(xx,yy)) return {x:xx, y:yy}; }
    return {x, y};
  }
  function walkable(x, y){ return walkableAt(built.solid, x, y); }

  /* ---------- A* บนตาราง ---------- */
  function findPath(x0,y0,x1,y1){
    const G = built.grid, s = (y0/CELL|0)*GW + (x0/CELL|0); let t = (y1/CELL|0)*GW + (x1/CELL|0);
    if(G[t]){ // หาเซลล์ว่างที่ใกล้ที่สุด
      const tx = t%GW, ty = t/GW|0; let best = -1, bd = 1e9;
      for(let r=1;r<14 && best<0;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const xx = tx+dx, yy = ty+dy; if(xx<0||yy<0||xx>=GW||yy>=GH) continue; const k = yy*GW+xx; if(!G[k]){ const d = dx*dx+dy*dy; if(d<bd){ bd = d; best = k; } } }
      if(best<0) return null; t = best;
    }
    const N = GW*GH, gs = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const h = k => { const dx = Math.abs(k%GW - t%GW), dy = Math.abs((k/GW|0) - (t/GW|0)); return Math.max(dx,dy) + .414*Math.min(dx,dy); };
    const heap = [[h(s), s]]; gs[s] = 0;
    const push = it => { heap.push(it); let i = heap.length-1; while(i>0){ const p = (i-1)>>1; if(heap[p][0] <= heap[i][0]) break; [heap[p],heap[i]] = [heap[i],heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if(heap.length){ heap[0] = last; let i = 0; for(;;){ const l = 2*i+1, r = l+1; let m = i; if(l<heap.length && heap[l][0]<heap[m][0]) m = l; if(r<heap.length && heap[r][0]<heap[m][0]) m = r; if(m===i) break; [heap[m],heap[i]] = [heap[i],heap[m]]; i = m; } } return top; };
    let iter = 0;
    while(heap.length && iter++ < 60000){
      const [, k] = pop(); if(closed[k]) continue; closed[k] = 1;
      if(k===t) break;
      const kx = k%GW, ky = k/GW|0;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue; const nx = kx+dx, ny = ky+dy; if(nx<0||ny<0||nx>=GW||ny>=GH) continue;
        const n = ny*GW+nx; if(G[n] || closed[n]) continue; if(dx&&dy && (G[ky*GW+nx] || G[ny*GW+kx])) continue;
        const c = gs[k] + (dx&&dy ? 1.414 : 1); if(c < gs[n]){ gs[n] = c; from[n] = k; push([c + h(n), n]); } }
    }
    if(from[t]<0 && t!==s) return null;
    const out = []; for(let k=t; k!==s && k>=0; k=from[k]) out.push([(k%GW)*CELL+CELL/2, (k/GW|0)*CELL+CELL/2]);
    out.reverse();
    // ตัดจุดที่มองเห็นกันได้ทิ้ง ให้เดินเป็นเส้นตรง ไม่ซิกแซก
    const sm = []; let cur = [x0,y0], i = 0;
    while(i < out.length){ let j = out.length-1; while(j>i && !clear(cur, out[j])) j--; sm.push(out[j]); cur = out[j]; i = j+1; }
    if(walkable(x1,y1) && (!sm.length || clear(sm[sm.length-1], [x1,y1]))){ if(sm.length && Math.hypot(sm[sm.length-1][0]-x1, sm[sm.length-1][1]-y1) < CELL*2) sm[sm.length-1] = [x1,y1]; else if(Math.hypot(x1-x0,y1-y0) > 1) sm.push([x1,y1]); }
    return sm;
  }
  function clear(a, b){ const L = Math.hypot(b[0]-a[0], b[1]-a[1]); if(L<.5) return true; for(let s=0;s<=L;s+=1.5){ const x = a[0]+(b[0]-a[0])*s/L, y = a[1]+(b[1]-a[1])*s/L; if(!walkable(x,y)) return false; } return walkable(b[0],b[1]); }

  /* ---------- ข้อมูลเกม: ธงบ้านผู้ป่วย ---------- */
  let recCache = {key:'', list:[]};
  function recs(){ const key = W.seed+'|'+S.T+'|'+S.ver+'|'+S.acfAt; if(recCache.key!==key) recCache = {key, list:M.records(W,S)}; return recCache.list; }
  function caseFlags(){
    const key = W.seed+'|'+S.T+'|'+S.ver+'|'+S.acfAt+'|'+Object.keys(S.ans).length;
    if(flagCache.key===key) return flagCache.list;
    const by = new Map();
    for(const r of recs()){ if(r.dup) continue; const hh = W.households[r.p.hh-1]; if(!hh) continue;
      if(!by.has(hh.id)) by.set(hh.id, {hh, ps:[], isNew:false}); const f = by.get(hh.id); f.ps.push(r.p); if(S.newIds.has(r.p.id)) f.isNew = true; }
    const list = [...by.values()].map(f=>{ const q = freeNear(f.hh.x+4, f.hh.y+8); return Object.assign(f, {x:q.x, y:q.y}); });
    flagCache = {key, list}; return list;
  }

  /* ---------- เปิด / ปิด ---------- */
  let coarse = false, navTarget = null, view2 = null, vctx2 = null, badgeT = 0;
  const Q = () => S.flags.wq;
  let startleOn = true, startleClock = 0, startleNext = 30, startleCount = 0, startleLife = 0;
  let stepDistance = 0, stepClock = 0;
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clearStartle(){ startleLife = 0; const box = el && el.querySelector('.wk-startle'); if(box){ box.classList.add('hidden'); box.textContent = ''; } }
  function triggerStartle(test = false){
    if(!running || !startleOn || sheetFor || blocked() || document.hidden || startleLife || startleCount >= 2 || (!test && startleClock < startleNext)) return false;
    const box = el.querySelector('.wk-startle'); if(!box) return false;
    const bird = Math.random() < .5;
    box.innerHTML = '<span class="wk-startle-animal" aria-hidden="true">' + (bird ? '🐦' : '🐈') + '</span><span>' + (bird ? 'ฟึ่บ! แค่นกบินผ่านเอง 🐦' : 'แฮ่! แมวเจ้าถิ่นแวะมาทัก 🐈') + '<small>ไม่มีผลต่อคดีหรือคะแนน · ปิดได้ที่ปุ่ม สะดุ้ง</small></span>';
    box.classList.toggle('wk-still', reducedMotion()); box.classList.remove('hidden');
    startleLife = 3.5; startleCount++; startleNext = startleClock + 90;
    OD.sfx && OD.sfx('startle'); return true;
  }
  function updateStartle(dt, moved){
    if(!startleOn || sheetFor || blocked() || document.hidden){ clearStartle(); return; }
    startleClock += dt;
    if(startleLife){ startleLife -= dt; if(startleLife <= 0) clearStartle(); }
    else if(moved > 0 && startleClock >= startleNext && Math.random() < dt*.025) triggerStartle();
  }
  function cancelNavigation(){ path = null; pendingTarget = null; navTarget = null; dest = null; hold = null; hudKey = ''; }
  function placeInfo(s, i){
    const site = s.kind==='site' ? M.SITES[s.id] : null;
    const unknown = site && site.hidden && !S.known.has(s.id);
    return Object.assign({}, s, {spot:s, code:s.kind==='hc' ? 'H' : s.kind==='village' ? 'V'+s.vid : unknown ? '?'+(i+1) : s.id,
      n:s.kind==='hc' ? HC.name : s.kind==='village' ? M.VILLAGES[s.vid-1].name : unknown ? (site.type==='farm' ? 'สวนผัก' : 'โรงน้ำแข็ง')+'ที่ยังไม่รู้จัก' : site.name,
      ic:s.kind==='hc' ? '🏥' : s.kind==='village' ? '🏘️' : unknown ? '❔' : site.icon,
      closed:!!(site && !unknown && M.isClosed(S,s.id)), d:Math.hypot(s.x-P.x,s.y-P.y)*1.25});
  }
  function places(){ return built.spots.map(placeInfo); }
  function selectPlace(s){ if(!s || !running) return; closeSheet(); navTarget = s; goTo(s.x,s.y,s.spot); }
  function routeDistance(){ if(!path || !path.length) return 0; let x=P.x,y=P.y,d=0; for(const p of path){ d+=Math.hypot(p[0]-x,p[1]-y); x=p[0]; y=p[1]; } return d; }

  function open(field){
    if(running) return;
    F = field; W = OD.W; S = OD.S;
    if(!built || built.seed!==W.seed){ sprites(); built = build(); built.seed = W.seed; spawnActors(); }
    recCache = {key:'', list:[]}; flagCache = {key:'', list:[]};
    S.flags.walkCards = S.flags.walkCards || [];
    S.flags.wq = S.flags.wq || {hen:0, wash:0, trash:0, trashGot:[], visited:[], talked:[], badges:[], dist:0, bikeDist:0, bike:false, riding:false, night:false};
    coarse = matchMedia('(pointer:coarse)').matches;
    try{ startleOn = localStorage.getItem('od3-startle') !== '0'; }catch(e){}
    startleClock = 0; startleNext = 30; startleCount = 0; startleLife = 0; stepDistance = 0; stepClock = 0;
    const sv = S.flags.walkPos;
    P = {x: sv ? sv[0] : HC.x, y: sv ? sv[1] : HC.y+24, dir:'d', frame:0, ft:0, look:{skin: S.gender==='f' ? '#f3cfac' : '#ebbd96', hair: S.gender==='f' ? '#3a2219' : '#2a1d17', long: S.gender==='f', shirt:'#2f7f6c', pants:'#2b3550', vest:true, bag:true}};
    if(!walkable(P.x,P.y)){ const q = freeNear(P.x,P.y); P.x = q.x; P.y = q.y; }
    if(Q().hen===2){ qhen.x = P.x-6; qhen.y = P.y+2; }
    if(!el){ el = document.createElement('div'); el.id = 'walk'; el.className = 'walk'; document.body.appendChild(el); }
    el.innerHTML = `<canvas class="wk-cv"></canvas>
      <div class="wk-hud"><div class="wk-left"><div class="wk-stats"></div><div class="wk-quest"></div></div>
        <div class="wk-btns"><button class="wk-b" data-w="home">🏥 กลับ รพ.สต.</button><button class="wk-b hidden" data-w="stop">⏹ หยุดเดิน</button><button class="wk-b" data-w="startle" aria-pressed="${startleOn}">สะดุ้ง: ${startleOn ? 'เปิด' : 'ปิด'}</button><button class="wk-b" data-w="nav" title="นำทาง (N)">🧭 ไปที่…</button><button class="wk-b" data-w="book" title="สมุดนักสำรวจ">📒 สมุด</button><button class="wk-b hidden" data-w="bike" title="ขึ้น/ลงจักรยาน (B)">🚲</button><button class="wk-b" data-w="zoom" title="ซูมเข้า/ออก (M)">🔍</button><button class="wk-b" data-w="help" title="วิธีเล่น">❔</button><button class="wk-b gold" data-w="exit">🗺️ กลับหน้าข้อมูล</button></div></div>
      <div class="wk-map-panel"><button class="wk-map-open" data-w="nav" aria-label="ขยายแผนที่ ดูชื่อร้านและเลือกจุดหมาย"><canvas class="wk-mini" aria-hidden="true"></canvas><span>🗺️ ชื่อร้าน / ขยายแผนที่</span></button><div class="wk-shop-legend">${places().filter(s=>s.kind==='site' && M.SITES[s.id].type==='food').map(s=>'<button data-w="shop" data-id="'+U.esc(s.id)+'" title="ไป '+U.esc(s.n)+'"><b>'+U.esc(s.code)+'</b> <span>'+U.esc(s.n)+'</span></button>').join('')}</div></div>
      <button class="wk-act hidden" data-w="act"></button>
      <div class="wk-startle hidden" role="status" aria-live="polite"></div>
      <div class="wk-sheet hidden"></div>`;
    el.classList.remove('hidden');
    cv = el.querySelector('.wk-cv'); ctx = cv.getContext('2d');
    mini = el.querySelector('.wk-mini'); mini.width = WW/5; mini.height = WH/5; mctx = mini.getContext('2d');
    view = view || canvas(10,10); vctx = view.getContext('2d');
    view2 = view2 || canvas(10,10); vctx2 = view2.getContext('2d');
    bind(); resize();
    running = true; lastT = performance.now(); hudKey = ''; sheetFor = null; path = null; pendingTarget = null; navTarget = null; hold = null; parts = [];
    document.body.classList.add('walking');
    raf = requestAnimationFrame(loop);
    let seen = false; try{ seen = localStorage.getItem('od3-walkhelp')==='1'; }catch(e){}
    if(!seen){ try{ localStorage.setItem('od3-walkhelp','1'); }catch(e){} help(); }
    OD.sfx && OD.sfx('page');
  }
  async function close(){
    if(!running) return;
    running = false; cancelAnimationFrame(raf); unbind(); clearStartle(); cancelNavigation(); closeSheet();
    S.flags.walkPos = [Math.round(P.x), Math.round(P.y)];
    el.classList.add('hidden'); el.innerHTML = ''; document.body.classList.remove('walking');
    const charged = charge();
    if(document.getElementById('scr-field').classList.contains('hidden')) return;
    F.render();
    if(charged) await F.after();
  }
  /* คิดเวลาเดินทาง (สะสมเศษไว้ ไม่ปัดทิ้ง) */
  function charge(){
    const acc = S.flags.walkAcc || 0, h = Math.floor(acc / UNITS_PER_HOUR);
    if(h < 1) return false;
    const left = M.DEADLINE - S.T; if(left <= 0){ S.flags.walkAcc = 0; return false; }
    const hh = Math.min(h, left);
    S.flags.walkAcc = acc - h*UNITS_PER_HOUR;
    F.spend(hh, 0, `เดินทางสำรวจหมู่บ้าน ${U.thaiNum(hh)} ชม.`);
    return true;
  }

  /* ---------- อินพุต ---------- */
  let H = null, hold = null;
  function blocked(){ return document.getElementById('modal').classList.contains('open') || !document.getElementById('vn').classList.contains('hidden') || !!document.querySelector('.tour'); }
  const MOVE_KEYS = ['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];
  function toWorld(cx, cy){ const r = cv.getBoundingClientRect(), k = cv.width / r.width; return {x: camF.x + (cx - r.left)*k/scale, y: camF.y + (cy - r.top)*k/scale}; }
  function bind(){
    H = {
      kd: e=>{ if(!running) return; const k = (e.key||'').toLowerCase();
        if(k==='shift'){ keys.add('shift'); return; }
        if(blocked()) return; if(e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
        if(MOVE_KEYS.includes(k)){ cancelNavigation(); keys.add(k); e.preventDefault(); }
        else if(k==='e' || k===' ' || k==='enter'){ e.preventDefault(); if(sheetFor) closeSheet(); else if(focus) interact(focus); }
        else if(k==='escape'){ if(sheetFor) closeSheet(); else cancelNavigation(); }
        else if(k==='m') toggleZoom();
        else if(k==='b') toggleBike();
        else if(k==='n') navSheet(); },
      ku: e=>keys.delete((e.key||'').toLowerCase()),
      blur: ()=>{ keys.clear(); hold = null; clearStartle(); },
      visibility: ()=>{ keys.clear(); hold = null; clearStartle(); lastT = performance.now(); },
      rs: ()=>resize(),
      down: e=>{ if(blocked()) return; e.preventDefault();
        const w = toWorld(e.clientX, e.clientY), tgt = pickAt(w.x, w.y);
        cancelNavigation();
        if(tgt) goTo(tgt.a ? tgt.a.x : tgt.x, tgt.a ? tgt.a.y : tgt.y, tgt); else goTo(w.x, w.y, null);
        if(sheetFor && !tgt) closeSheet();
        hold = {id:e.pointerId, cx:e.clientX, cy:e.clientY, t0:performance.now(), tgt:!!tgt};
        try{ cv.setPointerCapture(e.pointerId); }catch(er){} },
      move: e=>{ if(hold && e.pointerId===hold.id){ hold.cx = e.clientX; hold.cy = e.clientY; } },
      up: e=>{ if(hold && e.pointerId===hold.id){ if(hold.steer){ path = null; pendingTarget = null; } hold = null; } },
      click: e=>{ const b = e.target.closest('[data-w],[data-a]'); if(!b || b.disabled) return;
        if(b.dataset.a){ doAction(b.dataset.a, b.dataset.arg); return; }
        const w = b.dataset.w; if(blocked()) return;
        if(w==='exit') close();
        else if(w==='zoom') toggleZoom();
        else if(w==='help') help();
        else if(w==='nav') navSheet();
        else if(w==='shop') selectPlace(places().find(s=>s.id===b.dataset.id));
        else if(w==='home') selectPlace(places().find(s=>s.kind==='hc'));
        else if(w==='stop') cancelNavigation();
        else if(w==='startle'){ startleOn = !startleOn; try{ localStorage.setItem('od3-startle', startleOn ? '1' : '0'); }catch(er){} clearStartle(); b.textContent = 'สะดุ้ง: '+(startleOn ? 'เปิด' : 'ปิด'); b.setAttribute('aria-pressed', String(startleOn)); }
        else if(w==='book') bookSheet(b.dataset.tab || 'badge');
        else if(w==='bike') toggleBike();
        else if(w==='borrow'){ Q().bike = true; Q().riding = true; closeSheet(); U.toast('🚲 ยืมจักรยาน รพ.สต. แล้ว! เร็วขึ้นเกือบ ๒ เท่า และเสียเวลาเดินทางน้อยลง · กด 🚲 หรือ B เพื่อขึ้น/ลง'); OD.sfx && OD.sfx('chime'); hudKey = ''; }
        else if(w==='go') selectPlace(navList[+b.dataset.i]);
        else if(w==='act'){ if(focus) interact(focus); }
        else if(w==='close' || w==='card') closeSheet();
        else if(w==='q') questAction(b.dataset.q, b.dataset.v);
        else if(w==='wash') washPick(+b.dataset.i);
        else if(w==='map'){ S.ui.hl = b.dataset.hl || null; if(S.ui.hl) S.flags.vPlace = true; close().then(()=>{ const m = document.getElementById('fMap'); m && m.scrollIntoView({behavior:'smooth', block:'start'}); }); } },
    };
    addEventListener('keydown', H.kd); addEventListener('keyup', H.ku); addEventListener('blur', H.blur); addEventListener('resize', H.rs);
    cv.addEventListener('pointerdown', H.down); cv.addEventListener('pointermove', H.move); cv.addEventListener('pointerup', H.up); cv.addEventListener('pointercancel', H.up);
    document.addEventListener('visibilitychange', H.visibility); el.addEventListener('click', H.click);
  }
  function unbind(){ if(!H) return; removeEventListener('keydown', H.kd); removeEventListener('keyup', H.ku); removeEventListener('blur', H.blur); removeEventListener('resize', H.rs); document.removeEventListener('visibilitychange', H.visibility); el.removeEventListener('click', H.click); cv.removeEventListener('pointerdown', H.down); cv.removeEventListener('pointermove', H.move); cv.removeEventListener('pointerup', H.up); cv.removeEventListener('pointercancel', H.up); keys.clear(); hold = null; H = null; }
  function toggleZoom(){ zoomFar = !zoomFar; resize(); }
  function toggleBike(){
    if(!Q().bike){ U.toast('🚲 ยืมจักรยานได้ที่ 🏥 รพ.สต. (ฟรี)'); return; }
    Q().riding = !Q().riding; hudKey = ''; OD.sfx && OD.sfx('pin');
    U.toast(Q().riding ? '🚲 ขึ้นจักรยาน — ปั่น ๑๒ กม. = ๑ ชม. ในเกม' : '🚶 ลงเดิน');
  }

  let scale = 3, cam = {x:0, y:0}, camF = {x:0, y:0}, vw = 320, vh = 180, dpr = 1;
  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
    cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr);
    const target = zoomFar ? 620 : 330;
    scale = Math.max(1, Math.round(cv.width / Math.min(target, w < 700 ? (zoomFar?380:210) : target)));
    vw = Math.ceil(cv.width/scale); vh = Math.ceil(cv.height/scale);
    view.width = view2.width = vw+1; view.height = view2.height = vh+1;
  }

  /* ---------- การเดิน ---------- */
  let dest = null;
  function goTo(x, y, tgt){
    path = findPath(P.x, P.y, x, y);
    pendingTarget = tgt; dest = {x, y}; P.retry = 0; P.stuck = 0;
    if(!path){ cancelNavigation(); U.toast('🚧 ไปตรงนั้นไม่ได้ — ลองเดินอ้อมหรือหาสะพาน'); return; }
    hudKey = ''; OD.sfx && OD.sfx('navigate');
    if(!path.length){ path = null; arrive(); }
  }
  function arrive(){
    dest = null;
    navTarget = null; hudKey = '';
    OD.sfx && OD.sfx('arrive');
    if(!pendingTarget) return;
    const tg = pendingTarget; pendingTarget = null;
    const tx = tg.a ? tg.a.x : tg.x, ty = tg.a ? tg.a.y : tg.y;
    if(Math.hypot(P.x-tx, P.y-ty) < (tg.r||16) + 10) interact(tg);
  }
  /* หันหน้าแบบมีช่วงกันสั่น: เดินเฉียงจะไม่สลับมุมข้าง/มุมหน้าไปมาทุกเฟรม */
  function faceDir(cur, dx, dy){
    const ax = Math.abs(dx), ay = Math.abs(dy); if(ax < 1e-6 && ay < 1e-6) return cur;
    const horiz = cur==='l' || cur==='r';
    if(horiz ? ay > ax*1.35 : ax > ay*1.35) return ax > ay ? (dx>0?'r':'l') : (dy>0?'d':'u');
    if(horiz) return dx>0 ? 'r' : dx<0 ? 'l' : cur;
    return dy>0 ? 'd' : dy<0 ? 'u' : cur;
  }
  function speedNow(){ return SPEED * (Q().riding ? 1.9 : keys.has('shift') ? 1.5 : 1); }
  function moveP(dx, dy, dt, maxStep){
    const L = Math.hypot(dx,dy); if(!L) return 0;
    let sp = speedNow()*dt; if(maxStep!=null) sp = Math.min(sp, maxStep);
    const mx = dx/L*sp, my = dy/L*sp, x0 = P.x, y0 = P.y;
    if(walkable(P.x+mx, P.y+my)){ P.x += mx; P.y += my; }
    else { if(walkable(P.x+mx, P.y)) P.x += mx; if(walkable(P.x, P.y+my)) P.y += my; }
    P.dir = faceDir(P.dir, dx, dy);
    return Math.hypot(P.x-x0, P.y-y0);
  }
  function update(dt, t){
    let moved = 0;
    const q = Q();
    stepClock += dt;
    if(!blocked() && !sheetFor && !document.hidden){
      let dx = 0, dy = 0;
      if(keys.has('arrowleft')||keys.has('a')) dx--; if(keys.has('arrowright')||keys.has('d')) dx++;
      if(keys.has('arrowup')||keys.has('w')) dy--; if(keys.has('arrowdown')||keys.has('s')) dy++;
      // กดค้างแล้วลากนิ้ว = บังคับทิศทางเหมือนจอยสติ๊ก
      if(hold && !dx && !dy && performance.now() - hold.t0 > 230){
        const w = toWorld(hold.cx, hold.cy), ddx = w.x - P.x, ddy = w.y - (P.y-8);
        if(Math.hypot(ddx, ddy) > 6){ hold.steer = true; path = null; pendingTarget = null; navTarget = null; dest = null; dx = ddx; dy = ddy; }
      }
      if(dx||dy) moved = moveP(dx, dy, dt);
      else if(path && path.length){
        const [tx, ty] = path[0], d = Math.hypot(tx-P.x, ty-P.y);
        if(d < .75){ path.shift(); if(!path.length){ path = null; arrive(); } }
        else if(dt > .001){ moved = moveP(tx-P.x, ty-P.y, dt, d);
          if(moved < .01){ P.stuck = (P.stuck||0) + dt;
            if(P.stuck > .3){ P.stuck = 0;
              // ติดสิ่งกีดขวาง → หาเส้นทางใหม่จากจุดปัจจุบัน (สูงสุด ๓ ครั้ง)
              if(dest && (P.retry = (P.retry||0) + 1) <= 3) path = findPath(P.x, P.y, dest.x, dest.y); else path = null;
              if(!path){ cancelNavigation(); U.toast('🚧 ทางติดขัด — เลือกจุดหมายอีกครั้ง'); } else if(!path.length){ path = null; arrive(); } } }
          else P.stuck = 0; }
      }
    }
    updateStartle(dt, moved);
    if(moved){
      stepDistance += moved;
      if(stepDistance >= (q.riding ? 35 : 15) && stepClock >= (q.riding ? .5 : .25)){ OD.sfx && OD.sfx(q.riding ? 'bike' : 'step'); stepDistance = 0; stepClock = 0; }
      P.ft += dt; P.frame = [1,0,2,0][Math.floor(P.ft*(q.riding ? 10 : keys.has('shift') ? 11 : 8))%4];
      S.flags.walkAcc = (S.flags.walkAcc||0) + moved * (q.riding ? 1/3 : 1);
      q.dist += moved; if(q.riding) q.bikeDist += moved;
      const hr = S.T % 24; if(hr>=19 || hr<5) q.night = true;
      dustT -= dt; if(dustT < 0 && !q.riding){ dustT = keys.has('shift') ? .08 : .16; parts.push({x:P.x+(Math.random()-.5)*4, y:P.y, vx:0, vy:-3, life:.45, max:.45, c:'rgba(214,190,140,', s:2, ground:true}); }
    } else { P.frame = 0; P.ft = 0; }
    // การ์ดความรู้
    for(const c of built.cards){ if(S.flags.walkCards.includes(c.i)) continue; if(Math.hypot(c.x-P.x, c.y-(P.y-4)) < 10){ S.flags.walkCards.push(c.i); burst(c.x, c.y-8, 18); showCard(c.i); } }
    // ภารกิจ: ขยะริมคลอง
    if(q.trash===1) quest.trash.forEach((tr,i)=>{ if(!q.trashGot.includes(i) && Math.hypot(tr.x-P.x, tr.y-P.y) < 10){ q.trashGot.push(i); burst(tr.x, tr.y-4, 10, ['#9ad35a','#f2f2ee']); OD.sfx && OD.sfx('pin');
      if(q.trashGot.length===quest.trash.length) U.toast('🗑️ เก็บครบ ๘ ชิ้นแล้ว! กลับไปบอก<b>ลุงเผือก</b>ที่ริมคลอง', '', 5000); else U.toast(`🗑️ เก็บขยะ ${U.thaiNum(q.trashGot.length)}/${U.thaiNum(quest.trash.length)}`, '', 1400); } });
    // ภารกิจ: ไก่นางดำ
    henUpdate(dt, q);
    // สถานที่ที่ไปถึงแล้ว
    for(const s of built.spots){ const k = spotKey(s); if(!q.visited.includes(k) && Math.hypot(s.x-P.x, s.y-P.y) < 26) q.visited.push(k); }
    badgeT -= dt; if(badgeT < 0){ badgeT = .6; checkBadges(); }
    // ตัวละครและสัตว์
    const R = Math.random;
    for(const a of actors){
      a.t -= dt;
      if(a.emoT!=null){ a.emoT -= dt; if(a.emoT < -1.6) a.emoT = 4 + R()*8; }
      if(a.kind==='named' || a.kind==='quest'){ const d = Math.hypot(P.x-a.x, P.y-a.y);
        if(d < 40) a.dir = faceDir(a.dir, P.x-a.x, P.y-a.y); else if(a.t<0){ a.t = 2+R()*3; a.dir = 'ldru'[Math.floor(R()*4)]; } continue; }
      if(a.kind==='villager' && sheetFor && sheetFor.a===a){ a.frame = 0; a.dir = faceDir(a.dir, P.x-a.x, P.y-a.y); continue; }
      if(a.tx==null){ if(a.t<0){ const rad = a.kind==='buffalo' ? 30 : a.kind==='villager' ? 46 : 26; const tx = a.hx + (R()-.5)*rad*2, ty = a.hy + (R()-.5)*rad*1.4;
          if(walkable(tx,ty) && (a.kind!=='buffalo' || built.inPaddy(tx,ty))){ a.tx = tx; a.ty = ty; } else a.t = .5; } a.frame = 0; continue; }
      const dx = a.tx-a.x, dy = a.ty-a.y, d = Math.hypot(dx,dy);
      if(d < 1.5){ a.tx = null; a.t = a.kind==='hen' ? .4+R()*1.5 : 1.5+R()*4; continue; }
      const s = Math.min(d, a.speed*dt), nx = a.x + dx/d*s, ny = a.y + dy/d*s;
      if(walkable(nx,ny)){ a.x = nx; a.y = ny; } else { a.tx = null; a.t = 1; }
      a.dir = a.kind==='villager' ? faceDir(a.dir, dx, dy) : (dx>0?'r':'l');
      a.ft = (a.ft||0) + dt; a.frame = [1,0,2,0][Math.floor(a.ft*6)%4];
    }
    for(const d of ducks){ d.t += dt; if(d.t > .7){ d.t = 0; d.s += d.dir; if(d.s<2||d.s>built.canal.length-3 || R()<.04) d.dir *= -1; } }
    boat.s += boat.dir*dt*1.6; if(boat.s < 4 || boat.s > built.canal.length-5) boat.dir *= -1;
    for(const c of clouds){ c.x += c.v*dt; if(c.x - c.r > WW) c.x = -c.r; }
    for(const f of flies){ f.ph += dt; f.x = f.hx + Math.sin(f.ph*.7)*22 + Math.sin(f.ph*2.3)*5; f.y = f.hy + Math.cos(f.ph*.5)*14 + Math.sin(f.ph*3.1)*3; }
    // ฝูงนกบินผ่านเป็นครั้งคราว
    birdT -= dt; if(birdT < 0 && !birds){ const dir = R()<.5 ? 1 : -1; birds = {x: dir>0 ? camF.x-30 : camF.x+vw+30, y: camF.y + 10 + R()*vh*.5, vx: 46*dir, vy: (R()-.5)*8, t:0}; birdT = 18 + R()*20; }
    if(birds){ birds.t += dt; birds.x += birds.vx*dt; birds.y += birds.vy*dt; if(birds.t > 14) birds = null; }
    if(R() < dt*6){ const r4 = loc('R4'); if(!M.isClosed(S,'R4')) parts.push({x:r4.x-8+R()*16, y:r4.y+8, vx:(R()-.5)*2, vy:-10, life:1.6, max:1.6, c:'rgba(235,235,235,', s:2, a:.55}); }
    for(const p of parts){ p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; if(p.g) p.vy += p.g*dt; } parts = parts.filter(p=>p.life>0);
    // จุดที่อยู่ใกล้ (คุย/สำรวจ)
    focus = nearest();
    if(sheetFor && sheetFor.x!=null){ const fx = sheetFor.a ? sheetFor.a.x : sheetFor.x, fy = sheetFor.a ? sheetFor.a.y : sheetFor.y; if(Math.hypot(P.x-fx, P.y-fy) > 44) closeSheet(); }
  }
  function henUpdate(dt, q){
    const h = qhen;
    if(q.hen===2){ // เดินตามผู้เล่น
      const dx = P.x - h.x, dy = P.y - h.y, d = Math.hypot(dx,dy);
      if(d > 60){ h.x = P.x - 6; h.y = P.y + 2; }
      else if(d > 11){ const s = Math.min(d-11, (speedNow()+4)*dt); h.x += dx/d*s; h.y += dy/d*s; h.dir = dx>0?'r':'l'; h.ft = (h.ft||0)+dt; h.frame = Math.floor(h.ft*8)%2; } else h.frame = 0;
      if(Math.hypot(P.x-quest.yai.x, P.y-quest.yai.y) < 24){ q.hen = 3; h.hx = quest.yai.x + 12; h.hy = quest.yai.y + 6; h.x = h.hx; h.y = h.hy;
        reward('พาไก่นางดำกลับไปคืนยายผิน'); sheet(qHead('yai') + `<div class="wk-sh-b">${say('yai', 'โอ๊ย นางดำของยาย! ขอบใจหลานมากนะ… ยายจะบอกทุกคนในหมู่บ้านเลยว่าทีมหมอใจดี')}</div>`, {kind:'quest', a:actors.find(a=>a.q==='yai')}); }
      return; }
    if(q.hen===1 || q.hen===3){ h.t -= dt;
      if(h.tx==null){ if(h.t < 0){ const tx = h.hx + (Math.random()-.5)*28, ty = h.hy + (Math.random()-.5)*18; if(walkable(tx,ty)){ h.tx = tx; h.ty = ty; } else h.t = .4; } h.frame = 0; return; }
      const dx = h.tx-h.x, dy = h.ty-h.y, d = Math.hypot(dx,dy); if(d < 1){ h.tx = null; h.t = .5+Math.random()*1.5; return; }
      const s = Math.min(d, h.speed*dt); h.x += dx/d*s; h.y += dy/d*s; h.dir = dx>0?'r':'l'; h.ft = (h.ft||0)+dt; h.frame = Math.floor(h.ft*8)%2; }
  }
  const spotKey = s => s.id || (s.kind + (s.vid||''));
  function targets(){
    const T = [];
    for(const s of built.spots) T.push(s);
    for(const a of actors) if(a.kind==='named' || a.kind==='villager' || a.kind==='quest') T.push({kind:a.kind, a, x:a.x, y:a.y, r:16});
    if(Q().hen===1) T.push({kind:'qhen', a:qhen, x:qhen.x, y:qhen.y, r:16});
    for(const f of caseFlags()) T.push({kind:'flag', f, x:f.x, y:f.y+2, r:13});
    return T;
  }
  function nearest(){ let best = null, bd = 1e9; for(const t of targets()){ const d = Math.hypot(t.x-P.x, t.y-P.y); if(d < t.r && d < bd){ bd = d; best = t; } } return best; }
  function pickAt(x, y){ let best = null, bd = 1e9;
    for(const t of targets()){ const big = t.kind==='site'||t.kind==='hc', ty = big ? t.y-26 : t.y-8; const d = Math.hypot(t.x-x, ty-y); const r = big ? 30 : 12; if(d < r && d < bd){ bd = d; best = t; } }
    return best; }

  /* ---------- เหรียญ ภารกิจ เอฟเฟกต์ ---------- */
  const BADGES = [
    ['walk5','🥾','นักเดินทางไกล','เดินสำรวจรวมครบ ๕ กม.', q=>q.dist*4/1000 >= 5],
    ['bike','🚲','นักปั่นประจำตำบล','ปั่นจักรยานครบ ๒ กม.', q=>q.bikeDist*4/1000 >= 2],
    ['cards','📚','หนอนหนังสือ','เก็บการ์ดความรู้ครบ ๑๐ ใบ', ()=>S.flags.walkCards.length >= CARDS.length],
    ['talk','💬','เพื่อนทั้งตำบล','คุยกับคนสำคัญครบ ๗ คน', q=>NAMED.every(n=>q.talked.includes(n.who))],
    ['explore','🗺️','นักสำรวจตัวจริง','ไปถึงทุกสถานที่และทุกหมู่บ้าน', q=>built.spots.every(s=>q.visited.includes(spotKey(s)))],
    ['hen','🐔','ฮีโร่ของยายผิน','พาไก่นางดำกลับบ้าน', q=>q.hen===3],
    ['wash','🧼','ครูสอนล้างมือ','สอนน้อง ๆ ล้างมือ ๗ ขั้นตอน', q=>q.wash===2],
    ['trash','🗑️','คลองสวยน้ำใส','เก็บขยะริมคลองให้ลุงเผือกครบ', q=>q.trash===2],
    ['night','🌙','นกฮูกนักสืบ','ออกสำรวจตอนกลางคืน', q=>q.night],
  ];
  function checkBadges(){
    const q = Q();
    for(const [k, ic, n, , ok] of BADGES){ if(q.badges.includes(k) || !ok(q)) continue;
      q.badges.push(k); OD.sfx && OD.sfx('chime'); burst(P.x, P.y-14, 30);
      U.toast(`🏅 ได้เหรียญใหม่ <b>${ic} ${n}</b> · ดูได้ใน 📒 สมุด`, '', 4500); hudKey = ''; break; }
  }
  function burst(x, y, n, cols){
    const C = cols || ['#f2c94c','#e8322a','#3ccf6e','#4f8ab8','#e86a8a','#ffffff'];
    for(let i=0;i<n;i++){ const a = Math.random()*6.28, v = 20+Math.random()*40; parts.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v-25, g:70, life:.7+Math.random()*.6, max:1.3, c:C[i%C.length], s:1, solid:true}); }
  }
  function reward(text, n=2){
    S.trust = Math.min(100, S.trust + n);
    S.log.unshift({t:S.T, text:`${text} — ชาวบ้านประทับใจ (ความเชื่อมั่นชุมชน +${n})`, kind:'good'});
    U.toast(`💚 ${text} · ความเชื่อมั่นชุมชน +${U.thaiNum(n)}`, '', 4500); burst(P.x, P.y-12, 40); OD.sfx && OD.sfx('heart');
    checkBadges();
  }

  /* ---------- การวาด ---------- */
  let frames = 0;
  function loop(now){
    if(!running) return;
    frames++;
    const dt = U.clamp((now - lastT)/1000, 0, .05); lastT = now;
    if(document.getElementById('scr-field').classList.contains('hidden')){ running = false; unbind(); clearStartle(); cancelNavigation(); closeSheet(); el.classList.add('hidden'); document.body.classList.remove('walking'); return; }
    if(document.hidden){ clearStartle(); raf = requestAnimationFrame(loop); return; }
    update(dt, now/1000);
    draw(now/1000);
    raf = requestAnimationFrame(loop);
  }
  function hourTint(){
    const h = S.T % 24;
    if(h>=7 && h<16) return null;
    if(h>=16 && h<18) return ['rgba(255,150,60,.13)', 0];
    if(h>=18 && h<19) return ['rgba(150,70,120,.28)', .3];
    if(h>=19 || h<5) return ['rgba(18,24,70,.52)', 1];
    return ['rgba(255,170,190,.16)', .2];
  }
  /* กล้องเลื่อนแบบลื่น: วาดโลกที่พิกัดจำนวนเต็ม แล้วเลื่อนทั้งภาพด้วยเศษพิกเซลบนจอ
     ตัวผู้เล่นวาดตรงจอโดยตรง จึงนิ่งอยู่กลางจอไม่สั่น · แบ่งเป็นชั้นหลังผู้เล่น/หน้าผู้เล่น */
  function draw(t){
    camF.x = vw >= WW ? (WW-vw)/2 : U.clamp(P.x - vw/2, 0, WW - vw);
    camF.y = vh >= WH ? (WH-vh)/2 : U.clamp(P.y - 8 - vh/2, 0, WH - vh);
    cam.x = Math.floor(camF.x); cam.y = Math.floor(camF.y);
    const ox = -Math.round((camF.x - cam.x)*scale), oy = -Math.round((camF.y - cam.y)*scale), W1 = vw+1, H1 = vh+1;
    const g = vctx, g2 = vctx2; g.imageSmoothingEnabled = g2.imageSmoothingEnabled = false;
    g.fillStyle = '#2d5a3a'; g.fillRect(0,0,W1,H1);
    g.drawImage(built.bg, -cam.x, -cam.y);
    g2.clearRect(0,0,W1,H1);
    const X = x => Math.round(x - cam.x), Y = y => Math.round(y - cam.y);
    const inView = (x,y,m=40) => x > cam.x-m && x < cam.x+W1+m && y > cam.y-m && y < cam.y+H1+m;
    const q = Q(), hr = S.T % 24, night = hr>=19 || hr<5;
    // พื้นดิน/น้ำ (อยู่หลังทุกอย่าง)
    g.fillStyle = 'rgba(230,245,255,.9)';
    for(const [x,y,ph] of built.sparkles){ if(!inView(x,y,2)) continue; if(Math.sin(t*2.2+ph*3) > .93) g.fillRect(X(x), Y(y), 2, 1); }
    for(const d of ducks){ const p = built.canal[d.s|0]; if(!p || !inView(p[0],p[1])) continue; const img = d.dir>0 ? SP.duck : flip_c('duck', SP.duck); g.drawImage(img, X(p[0]-3), Y(p[1]+d.off-3)); }
    { const k = Math.floor(boat.s), p = built.canal[k], p2 = built.canal[Math.min(built.canal.length-1,k+1)];
      if(p && inView(p[0],p[1])){ const f = boat.s-k, x = p[0]+(p2[0]-p[0])*f, y = p[1]+(p2[1]-p[1])*f;
        g.drawImage(boat.dir>0 ? SP.boat : flip_c('boat', SP.boat), X(x-10), Y(y-2)); g.drawImage(person(ROWER, boat.dir>0?'r':'l', 0), X(x-6), Y(y-17)); } }
    if(q.trash===1) quest.trash.forEach((tr,i)=>{ if(q.trashGot.includes(i) || !inView(tr.x,tr.y)) return; const img = SP.trash[tr.k]; g.drawImage(img, X(tr.x-img.width/2), Y(tr.y-img.height+1));
      if(Math.sin(t*4+i)>.7){ g.fillStyle = '#fff'; g.fillRect(X(tr.x+3), Y(tr.y-7), 1, 1); } });
    for(const p of parts) if(p.ground && inView(p.x,p.y)){ g.fillStyle = p.c + Math.max(0, p.life/p.max*.7) + ')'; g.fillRect(X(p.x), Y(p.y), p.s, 1); }
    // วัตถุเรียงตามแนวลึก แยกชั้นหลัง/หน้าผู้เล่น
    const list = [];
    for(const o of built.objs){ if(o.x > cam.x+W1+4 || o.x+o.img.width < cam.x-4 || o.y > cam.y+H1+4 || o.base < cam.y-4) continue; list.push(o); }
    for(const a of actors) if(inView(a.x,a.y)) list.push({actor:a, base:a.y});
    if(q.hen>0 && inView(qhen.x,qhen.y)) list.push({qhen:true, base:qhen.y});
    for(const f of caseFlags()) if(inView(f.x,f.y)) list.push({flag:f, base:f.y});
    for(const c of built.cards) if(!S.flags.walkCards.includes(c.i) && inView(c.x,c.y)) list.push({card:c, base:c.y});
    list.sort((a,b)=>a.base-b.base);
    const shadow = (L, x,y,w) => { L.fillStyle = 'rgba(0,0,0,.22)'; L.fillRect(X(x-w/2+1), Y(y), w-2, 1); L.fillRect(X(x-w/2), Y(y-1), w, 1); };
    for(const o of list){
      const L = o.base <= P.y ? g : g2;
      if(o.actor){ const a = o.actor;
        if(a.look){ shadow(L, a.x, a.y, 9); L.drawImage(person(a.look, a.dir, a.frame), X(a.x-7), Y(a.y-19)); }
        else { const img = a.dir==='l' ? flip_c(a.kind+(a.img===SP.hen[1]?1:a.img===SP.hen[2]?2:0), a.img) : a.img; const hop = a.kind==='hen' && a.frame ? 1 : 0; shadow(L, a.x, a.y, a.img.width-4); L.drawImage(img, X(a.x-img.width/2), Y(a.y-img.height+1-hop)); }
        continue; }
      if(o.qhen){ const img = qhen.dir==='l' ? flip_c('hen2', SP.hen[2]) : SP.hen[2]; shadow(L, qhen.x, qhen.y, 5); L.drawImage(img, X(qhen.x-4), Y(qhen.y-7-(qhen.frame?1:0))); continue; }
      if(o.flag){ const f = o.flag, img = f.isNew && Math.floor(t*3)%2 ? SP.flagNew : SP.flagRed; L.drawImage(img, X(f.x-1), Y(f.y-12)); continue; }
      if(o.card){ const c = o.card, b = Math.round(Math.sin(t*3+c.i)*1.5); L.drawImage(SP.card, X(c.x-4), Y(c.y-12+b));
        if(Math.sin(t*5+c.i*2)>.6){ L.fillStyle = '#fff7d6'; L.fillRect(X(c.x+4), Y(c.y-13+b), 1, 1); L.fillRect(X(c.x-5), Y(c.y-6+b), 1, 1); } continue; }
      // ของที่อยู่หน้าผู้เล่นและบังตัวอยู่ → โปร่งแสง ให้มองเห็นตัวเองเสมอ
      const cover = L===g2 && o.x < P.x+6 && o.x+o.img.width > P.x-6 && o.y < P.y-2 && o.base-2 > P.y-22;
      if(o.kind==='site'){ const hidden = M.SITES[o.id].hidden && !S.known.has(o.id); L.globalAlpha = hidden ? .55 : cover ? .6 : 1; L.drawImage(o.img, X(o.x), Y(o.y)); L.globalAlpha = 1; continue; }
      if(cover) L.globalAlpha = .5;
      L.drawImage(o.img, X(o.x), Y(o.y));
      L.globalAlpha = 1;
    }
    // ชั้นหน้า: สถานะสถานที่ ควัน ผีเสื้อ ฟองอารมณ์ เครื่องหมาย !
    for(const id in M.SITES){ const st = loc(id); if(!inView(st.x, st.y, 60)) continue;
      const known = S.known.has(id), topY = st.y + 10 - siteH(id);
      if(!known){ g2.drawImage(SP.qmark, X(st.x-4), Y(topY-24+Math.round(Math.sin(t*3)*1.5))); continue; }
      if(M.isClosed(S,id)) g2.drawImage(SP.tape, X(st.x-14), Y(st.y+10));
      if(S.inspected[id]) g2.drawImage(SP.check, X(st.x + 12), Y(st.y));
    }
    for(const p of parts){ if(p.ground || !inView(p.x,p.y)) continue; g2.fillStyle = p.solid ? p.c : p.c + Math.max(0, p.life/p.max*(p.a||.6)) + ')'; g2.fillRect(X(p.x), Y(p.y), p.s+(p.solid?0:1), p.s); }
    if(!night && hr>=6) for(const f of flies){ if(!inView(f.x,f.y)) continue; g2.drawImage(SP.fly[f.c][Math.floor(f.ph*8)%2], X(f.x), Y(f.y)); }
    for(const a of actors){ if(a.emoT==null || a.emoT > 0 || a.emoT < -1.6 || !inView(a.x,a.y)) continue; const k = emoteFor(a); if(k) g2.drawImage(SP.emo[k], X(a.x-5), Y(a.y-31)); }
    if(q.hen===1 && inView(qhen.x,qhen.y)) g2.drawImage(SP.emo.dots, X(qhen.x-5), Y(qhen.y-19+Math.round(Math.sin(t*4))));
    if(focus && !sheetFor){ const big = focus.kind==='site'||focus.kind==='hc', fy = big ? focus.y - 34 - (focus.kind==='hc'?32:siteH(focus.id)) : (focus.a ? focus.a.y-32 : focus.y-30), fx = focus.a ? focus.a.x : focus.x;
      g2.drawImage(SP.bang, X(fx-4), Y(fy + Math.round(Math.sin(t*6)*1.5))); }
    if(birds){ for(let i=0;i<5;i++){ const bx = birds.x - Math.sign(birds.vx)*[0,6,6,12,12][i], by = birds.y + [0,-4,4,-8,8][i]; if(!inView(bx,by)) continue;
      g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(X(bx), Y(by+26), 3, 1); g2.drawImage(SP.bird[Math.floor(t*6+i)%2], X(bx), Y(by)); } }
    g2.fillStyle = 'rgba(20,30,40,.08)';
    for(const c of clouds){ if(!inView(c.x,c.y,c.r)) continue; g2.beginPath(); g2.ellipse(X(c.x), Y(c.y), c.r, c.r*.55, 0, 0, 7); g2.ellipse(X(c.x+c.r*.6), Y(c.y+6), c.r*.6, c.r*.4, 0, 0, 7); g2.fill(); }
    // กลางวัน/กลางคืนตามเวลาในเกม
    const tint = hourTint();
    if(tint){ g2.fillStyle = tint[0]; g2.fillRect(0,0,W1,H1);
      if(tint[1] > 0){ g2.globalCompositeOperation = 'lighter';
        for(const o of built.objs){ if((o.kind!=='house' && o.kind!=='site' && o.kind!=='hc') || !inView(o.x,o.base,30)) continue; if(hash(o.x, o.y) < .25 && o.kind==='house') continue;
          const cx = X(o.x + o.img.width/2), cy = Y(o.base - o.img.height*.55), r = o.kind==='house' ? 7 : 14;
          const gr = g2.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(255,190,90,${.45*tint[1]})`); gr.addColorStop(1, 'rgba(255,190,90,0)'); g2.fillStyle = gr; g2.fillRect(cx-r, cy-r, r*2, r*2); }
        const gr = g2.createRadialGradient(X(P.x), Y(P.y-8), 0, X(P.x), Y(P.y-8), 28); gr.addColorStop(0, `rgba(255,230,170,${.34*tint[1]})`); gr.addColorStop(1,'rgba(255,230,170,0)'); g2.fillStyle = gr; g2.fillRect(X(P.x)-28, Y(P.y-8)-28, 56, 56);
        if(night) for(const f of fireflies){ if(!inView(f.x,f.y)) continue; const b = Math.sin(t*2.5+f.ph); if(b < .3) continue; g2.fillStyle = `rgba(220,255,120,${b*.9})`; g2.fillRect(X(f.x + Math.sin(t*.8+f.ph)*3), Y(f.y + Math.cos(t*.6+f.ph)*2), 1, 1); }
        g2.globalCompositeOperation = 'source-over'; }
    }
    // รวมภาพ: ชั้นหลัง → ผู้เล่น (วางตรงจอ) → ชั้นหน้า
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(view, 0, 0, W1, H1, ox, oy, W1*scale, H1*scale);
    drawPlayer(t);
    ctx.drawImage(view2, 0, 0, W1, H1, ox, oy, W1*scale, H1*scale);
    // เงาโปร่งของผู้เล่นทับชั้นหน้า — มองเห็นตัวเองเสมอ แม้อยู่หลังต้นไม้หรือตอนกลางคืน
    ctx.globalAlpha = night ? .6 : .28; drawPlayer(t, true); ctx.globalAlpha = 1;
    labels(t);
    guide(t);
    drawMini(t);
    hud();
  }
  function drawPlayer(t, ghost){
    const s = scale, sx = x => Math.round((x - camF.x)*s), sy = y => Math.round((y - camF.y)*s), q = Q();
    if(!ghost){ ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(sx(P.x-4), sy(P.y-1), 8*s, s); ctx.fillRect(sx(P.x-3), sy(P.y), 6*s, s); }
    const riding = q.riding, side = P.dir==='l' || P.dir==='r', lift = riding ? 4 : 0;
    const bike = riding ? (side ? (P.dir==='l' ? flip_c('bikeS', SP.bikeS) : SP.bikeS) : SP.bikeF) : null;
    const bx = bike && Math.round(P.x - bike.width/2), by = bike && Math.round(P.y - bike.height + 1);
    if(bike && P.dir!=='d') ctx.drawImage(bike, sx(bx), sy(by), bike.width*s, bike.height*s);
    const img = person(P.look, P.dir, P.frame);
    ctx.drawImage(img, sx(P.x-7), sy(P.y-19-lift), img.width*s, img.height*s);
    if(bike && P.dir==='d') ctx.drawImage(bike, sx(bx), sy(by), bike.width*s, bike.height*s);
  }
  function emoteFor(a){
    if(a.kind==='quest'){ const q = Q(); if(a.q==='yai') return q.hen===0 ? 'bang' : q.hen===3 ? 'heart' : 'sweat'; if(a.q==='kids') return q.wash===2 ? 'note' : 'bang'; if(a.q==='lung') return q.trash===2 ? 'heart' : q.trash===1 && q.trashGot.length===quest.trash.length ? 'star' : 'bang'; }
    if(a.kind==='named') return a.who==='doctor' ? 'star' : 'dots';
    if(a.p){ const sick = recs().some(r=>!r.dup && r.p.hh===a.p.hh); if(sick) return 'sweat'; return a.look.kid ? 'note' : (hash(a.p.id, 31) < .5 ? 'dots' : 'heart'); }
    return null;
  }
  /* ลูกศรนำทาง: ไปยังปลายทางที่เลือก หรือพาไก่กลับบ้านยาย */
  function guideTarget(){ const q = Q(); if(navTarget) return navTarget; if(q.hen===2) return {x:quest.yai.x, y:quest.yai.y, n:'ยายผิน'}; if(q.trash===1 && q.trashGot.length===quest.trash.length) return {x:quest.lung.x, y:quest.lung.y, n:'ลุงเผือก'}; return null; }
  function guide(t){
    const tg = guideTarget(); if(!tg) return;
    const s = scale, x = (tg.x - camF.x)*s, y = (tg.y - camF.y)*s - 34*s, m = 40*dpr;
    const on = x > m && x < cv.width-m && y > m && y < cv.height-m;
    ctx.save();
    if(on){ const b = Math.sin(t*6)*4*dpr; ctx.translate(x, y + b); ctx.rotate(Math.PI/2); }
    else { const cx = cv.width/2, cy = cv.height/2, a = Math.atan2(y-cy, x-cx), ex = U.clamp(x, m, cv.width-m), ey = U.clamp(y, m+40*dpr, cv.height-m); ctx.translate(ex, ey); ctx.rotate(a); }
    const k = 11*dpr; ctx.beginPath(); ctx.moveTo(k,0); ctx.lineTo(-k*.8,-k*.75); ctx.lineTo(-k*.35,0); ctx.lineTo(-k*.8,k*.75); ctx.closePath();
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 2.5*dpr; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  const fcache = new Map();
  function flip_c(k, img){ if(!fcache.has(k)) fcache.set(k, flip(img)); return fcache.get(k); }
  const SH = {};
  function siteH(id){ if(SH[id]==null){ const o = built.objs.find(o=>o.kind==='site' && o.id===id); SH[id] = o ? o.img.height : 24; } return SH[id]; }

  function labels(t){
    const fs = Math.round(12.5*dpr), sx = x => (x - camF.x)*scale, sy = y => (y - camF.y)*scale;
    ctx.font = `600 ${fs}px Sarabun, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tag = (txt, x, y, bgc='rgba(24,16,8,.72)', fg='#fff4dc') => {
      x = Math.round(x); y = Math.round(y);
      const w = ctx.measureText(txt).width + 12*dpr, h = fs + 8*dpr; if(x+w/2 < 0 || x-w/2 > cv.width || y < -h || y > cv.height+h) return;
      ctx.fillStyle = bgc; rr(x-w/2, y-h/2, w, h, h/2); ctx.fill(); ctx.fillStyle = fg; ctx.fillText(txt, x, y+1*dpr); };
    for(const id in M.SITES){ const st = Object.assign({}, M.SITES[id], loc(id)), known = S.known.has(id);
      const info = placeInfo(built.spots.find(s=>s.id===id));
      const txt = `${info.ic} ${info.n}`;
      tag(txt + (known && M.isClosed(S,id) ? ' · ปิดอยู่' : ''), sx(st.x), sy(st.y+10-siteH(id)) - 4*dpr, known ? (M.isClosed(S,id) ? 'rgba(140,20,20,.8)' : 'rgba(24,16,8,.72)') : 'rgba(60,60,70,.7)'); }
    tag('🏥 รพ.สต. บ้านสุขใจ · ฐานทีม HDS', sx(HC.x), sy(HC.y+10-32) - 4*dpr, 'rgba(20,90,60,.82)');
    for(const p of built.plazas){ const v = M.VILLAGES[p.vid-1]; tag(`🏘️ ${v.name}`, sx(p.x), sy(p.y-30), 'rgba(90,60,20,.78)'); }
    if(focus && !sheetFor){ const hint = focusLabel(focus); if(hint){ const fx = focus.a ? focus.a.x : focus.x, fy = focus.a ? focus.a.y + 8 : focus.y + 10; tag(hint, sx(fx), sy(fy) + 4*dpr, 'rgba(176,130,30,.9)', '#1a1206'); } }
    function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  }
  function focusLabel(f){
    const key = coarse ? 'แตะ 💬' : 'กด E';
    if(f.kind==='named') return `${key} คุยกับ${OD.CHARS[f.a.who].name}`;
    if(f.kind==='quest') return `${key} คุยกับ${QNPC[f.a.q].name}`;
    if(f.kind==='qhen') return `${key} จับไก่นางดำ 🐔`;
    if(f.kind==='villager') return `${key} ทักทายชาวบ้าน`;
    if(f.kind==='flag') return `${key} ดูบ้านผู้ป่วย`;
    if(f.kind==='village') return `${key} ดูข้อมูลหมู่บ้าน`;
    if(f.kind==='hc') return `${key} เข้าฐานทีม HDS`;
    if(f.kind==='site') return `${key} สำรวจที่นี่`;
    return '';
  }
  function drawMini(t){
    const g = mctx, q = Q(); g.drawImage(built.mm, 0, 0);
    if(path && path.length){ g.strokeStyle = '#ffe391'; g.lineWidth = 2; g.beginPath(); g.moveTo(P.x/5,P.y/5); for(const p of path) g.lineTo(p[0]/5,p[1]/5); g.stroke(); }
    for(const id in M.SITES){ const s = loc(id); g.fillStyle = S.known.has(id) ? (M.isClosed(S,id) ? '#d8322a' : '#ffd23f') : '#9aa'; g.fillRect(s.x/5-2, s.y/5-2, 4, 4); }
    g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for(const s of places().filter(s=>s.kind==='site' && M.SITES[s.id].type==='food')){ const x=U.clamp(s.x/5,10,mini.width-10), y=U.clamp(s.y/5-9,7,mini.height-7); g.fillStyle='#201b11'; g.fillRect(x-9,y-6,18,12); g.fillStyle='#ffe493'; g.fillText(s.code,x,y); }
    g.fillStyle = '#2e9a5a'; g.fillRect(HC.x/5-2, HC.y/5-2, 5, 5); g.fillStyle = '#fff'; g.fillRect(HC.x/5-1, HC.y/5, 3, 1); g.fillRect(HC.x/5, HC.y/5-1, 1, 3);
    g.fillStyle = '#e8322a'; for(const f of caseFlags()) g.fillRect(f.x/5-1, f.y/5-1, 2, 2);
    if(q.trash===1){ g.fillStyle = '#9ad35a'; quest.trash.forEach((tr,i)=>{ if(!q.trashGot.includes(i)) g.fillRect(tr.x/5-1, tr.y/5-1, 2, 2); }); }
    const tg = guideTarget(); if(tg && Math.floor(t*4)%2){ g.strokeStyle = '#ffd23f'; g.lineWidth = 1.5; g.beginPath(); g.arc(tg.x/5, tg.y/5, 4, 0, 7); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.strokeRect(camF.x/5+.5, camF.y/5+.5, vw/5, vh/5);
    if(Math.floor(t*3)%2){ g.fillStyle = '#ffffff'; g.beginPath(); g.arc(P.x/5, P.y/5, 3, 0, 7); g.fill(); }
    g.fillStyle = '#2f7f6c'; g.beginPath(); g.arc(P.x/5, P.y/5, 2, 0, 7); g.fill();
  }
  function questLine(){
    const q = Q();
    if(navTarget) return `🧭 ไป <b>${U.esc(navTarget.n)}</b> · เหลือ ${(routeDistance()*4/1000).toFixed(1)} กม. · กด ⏹ เพื่อหยุด`;
    if(q.hen===2) return '🐔 พาไก่นางดำไปส่ง<b>ยายผิน</b> (ตามลูกศรสีทอง)';
    if(q.trash===1) return q.trashGot.length===quest.trash.length ? '🗑️ เก็บครบแล้ว — กลับไปหา<b>ลุงเผือก</b>' : `🗑️ เก็บขยะริมคลอง ${U.thaiNum(q.trashGot.length)}/${U.thaiNum(quest.trash.length)} (จุดเขียวบนแผนที่ย่อ)`;
    if(q.hen===1) return `🐔 ตามหาไก่นางดำ — ยายว่ามันชอบไปแถว<b>${quest.henMark}</b>`;
    return path ? '🚶 กำลังเดินตามเส้นทาง · กด ⏹ เพื่อหยุด' : 'เริ่มที่ 🧭 ไปที่… เลือกร้าน → สำรวจ/สัมภาษณ์ → เทียบหลักฐาน · 🏥 กลับฐานได้เสมอ';
  }
  function hud(){
    const acc = S.flags.walkAcc || 0, h = M.DEADLINE - S.T, q = Q();
    const nRec = recs().length, ql = questLine();
    const key = [S.T, S.budget, nRec, Math.floor(acc/50), S.flags.walkCards.length, focus && focusLabel(focus), !!sheetFor, q.riding, q.bike, q.badges.length, ql].join('|');
    if(key===hudKey) return; hudKey = key;
    el.querySelector('.wk-stats').innerHTML = `<span>🕘 <b>${M.fmtT(S.T)}</b></span><span>⏳ เหลือ ${h} ชม.</span><span>💰 ${U.baht(S.budget)}</span><span>🚩 ผู้ป่วย ${nRec} ราย</span>
      <span title="เดินทาง ๑,๐๐๐ หน่วย = ๑ ชม. ในเกม — คิดเวลาเมื่อทำภารกิจหรือกลับหน้าข้อมูล">⏱️ เดินทาง ${(acc/UNITS_PER_HOUR).toFixed(1)} ชม.</span><span>✨ ${S.flags.walkCards.length}/${CARDS.length}</span><span>🏅 ${q.badges.length}/${BADGES.length}</span>`;
    const qe = el.querySelector('.wk-quest'); qe.innerHTML = ql; qe.classList.toggle('hidden', !ql);
    el.querySelector('[data-w="stop"]').classList.toggle('hidden', !path);
    const bb = el.querySelector('[data-w="bike"]'); bb.classList.toggle('hidden', !q.bike); bb.classList.toggle('gold', !!q.riding); bb.textContent = q.riding ? '🚲 ปั่นอยู่' : '🚲';
    const ab = el.querySelector('.wk-act');
    if(focus && !sheetFor){ ab.classList.remove('hidden'); ab.textContent = focusLabel(focus).replace(/^(กด E|แตะ 💬) /, '💬 '); } else ab.classList.add('hidden');
  }

  /* ---------- แผ่นข้อมูลด้านล่าง (โต้ตอบ) ---------- */
  const nm = id => M.SITES[id].name;
  const EXP_SITES = ['W1','W2','W3','R1','R2','R3','R4','S','E'];
  const FLAVOR = {water:'ชาวบ้านตักน้ำบ่อนี้ไปดื่มและหุงข้าว — น้ำบ่อตื้นปนเปื้อนได้ง่ายหลังฝนตกหนัก', food:'ร้านประจำของคนในตำบล มีคนแวะกินทุกวัน',
    school:'เด็ก ๆ กินอาหารกลางวันที่โรงอาหารนี้ทุกวันเรียน', event:'วัดประจำตำบล งานบุญแต่ละครั้งคนมาร่วมหลายร้อยคน', ice:'โรงน้ำแข็งที่ส่งน้ำแข็งให้ร้านค้าในตำบล', farm:'สวนผักริมคลอง ใช้น้ำคลองรดผัก'};
  function sheet(html, forT){
    cancelNavigation(); clearStartle(); sheetFor = forT; keys.clear(); hold = null;
    const s = el.querySelector('.wk-sheet'); s.classList.remove('wk-map-sheet'); s.innerHTML = html; s.classList.remove('hidden'); s.scrollTop = 0; hudKey = '';
    OD.sfx && OD.sfx('blip');
  }
  function closeSheet(){ sheetFor = null; const s = el && el.querySelector('.wk-sheet'); if(s){ s.classList.add('hidden'); s.classList.remove('wk-map-sheet'); s.innerHTML = ''; } hudKey = ''; }
  const head = (ic, title, sub) => `<div class="wk-sh-h"><span class="ic">${ic}</span><div class="tt"><b>${title}</b>${sub?`<small>${sub}</small>`:''}</div><button class="wk-x" data-w="close" title="ปิด">✕</button></div>`;
  const btn = (a, label, cost, dis, arg) => `<button class="wk-ab" data-a="${a}" ${arg?`data-arg="${arg}"`:''} ${dis?'disabled':''}><span>${label}</span>${cost?`<small>${cost}</small>`:''}</button>`;
  const wbtn = (attrs, label, sub) => `<button class="wk-ab" ${attrs}><span>${label}</span>${sub?`<small>${sub}</small>`:''}</button>`;
  const costTxt = c => `${c.h} ชม.${c.b?` · ${U.baht(c.b)}`:''}`;
  /* ใช้ปุ่มเดียวกับแถบการกระทำหลัก (สถานะ/ค่าใช้จ่ายตรงกันเสมอ) */
  function cloneActs(list){ F.render(); return list.map(k=>{ const b = document.querySelector(`#fActions [data-a="${k}"]`); return b ? b.outerHTML.replace('class="act"', 'class="act wk-act-c"') : ''; }).join(''); }
  /* รูปหน้าแบบพิกเซลของตัวละครที่ไม่มีภาพวาด */
  const ppCache = new Map();
  function pxPortrait(look){ const img = person(look, 'd', 0), k = look._k;
    if(!ppCache.has(k)){ const c = canvas(img.width*4, 15*4), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, img.width, 15, 0, 0, img.width*4, 60); ppCache.set(k, c.toDataURL()); }
    return `<img class="wk-pxp" alt="" src="${ppCache.get(k)}">`; }
  const say = (who, text) => `<div class="wk-say">${pxPortrait(QNPC[who].look)}<p class="wk-bubble">“${text}”</p></div>`;
  const qHead = who => head('💬', QNPC[who].name, QNPC[who].title);

  function interact(f){
    if(f.kind==='site') return siteSheet(f);
    if(f.kind==='hc'){ const q = Q();
      return sheet(head('🏥', 'รพ.สต. บ้านสุขใจ', 'ฐานปฏิบัติการทีม HDS — งานเอกสาร สัมภาษณ์ วิเคราะห์ข้อมูล')
        + `<div class="wk-sh-b"><div class="wk-say">${OD.mentorFace()}<div><b>พี่วิ</b><div>${F.hint()}</div></div></div></div>`
        + (q.bike ? '' : `<div class="wk-acts">${wbtn('data-w="borrow"', '🚲 ยืมจักรยาน รพ.สต.', 'ฟรี · เร็วขึ้นเกือบ ๒ เท่า')}</div>`)
        + `<div class="wk-acts">${cloneActs(['review','acf','interview','deep','hyp','controls','supply','nlp','ai','skip'])}</div>`
        + `<div class="wk-sh-f"><button class="btn btn-gold btn-sm" data-a="report">📝 ๑๐ เขียนรายงานสอบสวนโรค</button></div>`, f); }
    if(f.kind==='village') return villageSheet(f);
    if(f.kind==='flag') return flagSheet(f);
    if(f.kind==='named') return namedSheet(f);
    if(f.kind==='villager') return villagerSheet(f);
    if(f.kind==='quest') return questSheet(f);
    if(f.kind==='qhen'){ Q().hen = 2; OD.sfx && OD.sfx('pin'); burst(qhen.x, qhen.y-6, 14, ['#2b2420','#f2f2ee','#d23a2a']);
      U.toast('🐔 จับนางดำได้แล้ว! พาไปส่ง<b>ยายผิน</b>ที่หมู่ ๑ — ตามลูกศรสีทอง', '', 5000); hudKey = ''; }
  }
  function siteSheet(f){
    const id = f.id, st = M.SITES[id];
    if(st.hidden && !S.known.has(id)){
      return sheet(head(st.icon, `${st.type==='farm'?'สวนผัก':'โรงน้ำแข็ง'}ที่ยังไม่รู้จัก`, 'ยังไม่รู้ว่าที่นี่เกี่ยวข้องกับใคร')
        + `<div class="wk-sh-b"><p>ประตูปิดอยู่ ไม่มีใครออกมาต้อนรับ… ยังไม่รู้ว่าที่นี่ส่งวัตถุดิบให้ใคร — ค้นพบได้จาก <b>🔎 ตรวจสิ่งแวดล้อม</b>ร้านอาหาร/โรงอาหาร (ดูว่าซื้อน้ำแข็ง/ผักจากไหน) หรือ <b>📦 ห่วงโซ่อุปทาน</b> ที่ รพ.สต.</p></div>`, f);
    }
    const lines = [];
    lines.push(`<p class="faint">${FLAVOR[st.type]}</p>`);
    if(M.isClosed(S,id)) lines.push(`<div class="note red">🛑 ปิด/งดใช้อยู่ตามมาตรการเร่งด่วน</div>`);
    else if(M.wasReopened(S,id)) lines.push(`<div class="note">ถูกเปิดให้กลับมาใช้งานแล้ว</div>`);
    lines.push(S.inspected[id] ? `<div class="note jade">📋 <b>ผลตรวจสิ่งแวดล้อม:</b> ${S.inspected[id]}</div>` : `<div class="note">ยังไม่ได้ตรวจสิ่งแวดล้อมที่นี่</div>`);
    for(const l of S.labs.filter(l=>l.site===id)) lines.push(`<div class="note">${l.seen ? (l.pos ? `🧪 ผลแล็บ: <b>พบ${M.PATHOGENS[l.pathogen].short}</b>${l.mixed?' (ฉลากเลอะ)':''}` : '🧪 ผลแล็บ: ไม่พบเชื้อก่อโรค') : `🧪 รอผลแล็บ · ออก ${M.fmtT(l.due)}`}</div>`);
    if(EXP_SITES.includes(id)){
      const iv = recs().filter(r=>!r.dup && S.ans[r.p.id]), k = iv.filter(r=>S.ans[r.p.id][id]===true).length;
      lines.push(iv.length ? `<div class="note">🗣️ ผู้ป่วยที่สัมภาษณ์แล้ว <b>${k} จาก ${iv.length} ราย</b> (${Math.round(k/iv.length*100)}%) เคยสัมผัสที่นี่ — ต้องเทียบกับ<b>กลุ่มควบคุม</b> (OR) ก่อนสรุปว่าเป็นต้นตอ</div>`
        : `<div class="note faint">🗣️ ยังไม่รู้ว่าผู้ป่วยเคยมาที่นี่หรือไม่ — ต้องสัมภาษณ์ผู้ป่วยที่ รพ.สต. ก่อน</div>`);
    }
    const ci = M.COST.inspect, ce = M.COST.env, canClose = id!=='E' && !M.isClosed(S,id) && !(S.closed[id]!=null && !M.wasReopened(S,id));
    const acts = btn('inspect', '🔎 ตรวจสิ่งแวดล้อม', S.inspected[id] ? 'ตรวจแล้ว ✓' : costTxt(ci), !!S.inspected[id] || !F.can(ci), id)
      + btn('lab', '🧪 เก็บตัวอย่างส่งแล็บ', M.sampleTypes(W,S,id).length ? costTxt(ce) : 'ไม่มีตัวอย่างเหลือ', !M.sampleTypes(W,S,id).length || !F.can(ce), id)
      + (id!=='E' ? btn('measure', M.wasReopened(S,id) ? '🛑 สั่งปิดอีกครั้ง' : '🛑 สั่งปิด/งดใช้', M.isClosed(S,id) ? 'ปิดอยู่' : '๑ ชม.', !canClose, id) : '')
      + (EXP_SITES.includes(id) ? wbtn(`data-w="map" data-hl="${id}"`, '🗺️ ดูผู้สัมผัสบนแผนที่', 'ฟรี') : '');
    sheet(head(st.icon, nm(id), {water:'แหล่งน้ำดื่ม', food:'ร้านอาหาร', school:'โรงเรียน', event:'วัด', ice:'โรงน้ำแข็ง', farm:'สวนผัก'}[st.type]) + `<div class="wk-sh-b">${lines.join('')}</div><div class="wk-acts">${acts}</div>`, f);
  }
  function villageSheet(f){
    const v = M.VILLAGES[f.vid-1], R = recs().filter(r=>!r.dup);
    const all = M.VILLAGES.map(x=>{ const pp = W.people.filter(p=>p.v===x.id).length, nn = R.filter(r=>r.p.v===x.id).length; return {x, pp, nn, ar: nn/pp*1000}; });
    const me = all[v.id-1], mx = Math.max(1, ...all.map(a=>a.ar)), hh = W.households.filter(h=>h.v===v.id).length;
    sheet(head('🏘️', v.name, `${hh} ครัวเรือน · ประชากร ${me.pp} คน`)
      + `<div class="wk-sh-b"><p>ผู้ป่วยในฐานข้อมูลจากหมู่นี้ <b>${me.nn} ราย</b> · อัตราป่วย <b>${me.ar.toFixed(1)} ต่อประชากร ๑,๐๐๐ คน</b></p>
        <div class="wk-bars">${all.map(a=>`<div class="${a.x.id===v.id?'on':''}"><span>${a.x.short}</span><i style="width:${a.ar/mx*100}%"></i><b>${a.ar.toFixed(1)}</b></div>`).join('')}</div>
        <p class="faint" style="font-size:13px">💡 เปรียบเทียบ <b>อัตรา</b> (ป่วยต่อประชากร) ไม่ใช่แค่ <b>จำนวน</b> — หมู่ที่คนเยอะ ผู้ป่วยก็มักเยอะตามไปด้วย</p></div>
        <div class="wk-acts">${cloneActs(['acf'])}${wbtn('data-w="map"', '🗺️ ดูแผนที่ข้อมูล', 'ฟรี')}</div>`, f);
  }
  function flagSheet(f){
    const ps = f.f.ps;
    const rows = ps.map(p=>{ const a = S.ans[p.id];
      return `<li><b>${p.ini || ('P'+String(p.id).padStart(3,'0'))}</b> · ${p.sex} ${p.age} ปี · เริ่มป่วย ${p.onsetDay ? M.fmtDay(p.onsetDay) : '—'}${p.admit?' · 🏥 นอน รพ.':''}${S.newIds.has(p.id)?' · <span style="color:#e8742a">รายงานใหม่</span>':''}
        <br><small>${a ? 'สัมภาษณ์แล้ว — สัมผัส: ' + (M.EXPOSURES.filter(x=>a[x.k]===true && x.k!=='HH').map(x=>x.label.replace('งานบวช: ','')).slice(0,5).join(', ') || '—') : 'ยังไม่ได้สัมภาษณ์'}</small></li>`; }).join('');
    sheet(head('🚩', `บ้านผู้ป่วย · ${M.VILLAGES[f.f.hh.v-1].name}`, `${ps.length} รายในบ้านนี้`)
      + `<div class="wk-sh-b"><ul class="wk-list">${rows}</ul><p class="faint" style="font-size:13px">🗺️ ธงแดงทุกผืนคือ “แผนที่จุด” (spot map) แบบเดียวกับที่หมอจอห์น สโนว์ใช้ค้นหาบ่อน้ำต้นเหตุอหิวาต์ — ลองสังเกตว่าธงกระจุกอยู่ใกล้อะไร</p></div>
        <div class="wk-acts">${cloneActs(['interview'])}</div>`, f);
  }
  const SAY = {
    doctor: ()=>F.hint(),
    boonma: ()=>U.pick([`ป้าเป็น อสม. หมู่ ๒ จ้ะ รู้จักทุกบ้านในหมู่นี้ ถ้าจะ<b>ค้นหาผู้ป่วยเชิงรุก</b> ป้าพาเคาะประตูได้นะ`, 'ชาวบ้านบางคนท้องเสียแต่ไม่ไปหาหมอหรอก กินยาเองอยู่บ้าน… ข้อมูลพวกนี้ไม่มีในโรงพยาบาลนะหนู', 'ล้างมือก่อนกินข้าวนะลูก ป้าพูดจนปากเปียกปากแฉะแล้ว']),
    kamnan: ()=>U.pick(['จะปิดร้านไหน ปิดบ่อไหน ต้องมีหลักฐานนะ ชาวบ้านเขาทำมาหากิน', 'นักข่าวโทรมาถามผมทั้งวันเลย อยากรู้เร็ว ๆ ว่าต้นเหตุคืออะไร', `ผมเป็นห่วงลูกบ้านทุกคน ความเชื่อมั่นของชาวบ้านตอนนี้อยู่ที่ <b>${Math.round(S.trust)}</b> — อย่าให้ต่ำกว่านี้เลย`]),
    monk: ()=>U.pick(['เจริญพร… ญาติโยมทำงานเหนื่อยไหม พักดื่มน้ำก่อนก็ได้นะ', 'งานบุญที่วัดคนมาร่วมเยอะ ถ้ามีอะไรให้วัดช่วยประกาศ อาตมายินดี', 'ความไม่ประมาทเป็นทางแห่งความไม่ตาย — สุขภาพก็เช่นกัน']),
    vendorF: ()=>M.isClosed(S,'R1') ? 'ร้านป้าโดนสั่งปิด… ขายไม่ได้เลย หวังว่าจะหาต้นเหตุเจอเร็ว ๆ นะ' : U.pick(['ส้มตำปูปลาร้าของป้าขายดีที่สุดในตำบล! ลองไหมจ๊ะ', 'ช่วงนี้ลูกค้าหายไปเยอะ เขาลือกันว่ากินแล้วท้องเสีย… ป้าไม่สบายใจเลย']),
    vendorM: ()=>M.isClosed(S,'R2') ? 'ร้านลุงปิดอยู่… ลุงยอมให้ตรวจทุกอย่างเลย ขอให้ชัดเจนก็พอ' : U.pick(['ก๋วยเตี๋ยวเรือลุงสูตรโบราณ น้ำซุปเคี่ยวทั้งคืน!', 'ลุงล้างผักด้วยน้ำประปานะ แต่ร้านอื่นไม่รู้เหมือนกัน']),
    director: ()=>U.pick(['นักเรียนลาป่วยเพิ่มขึ้นช่วงนี้ ครูก็กังวลค่ะ', 'โรงเรียนยินดีให้ความร่วมมือเต็มที่ ขอให้แจ้งผู้ปกครองอย่างระมัดระวังนะคะ', 'เราสอนเด็ก ๆ ให้ล้างมือก่อนกินข้าวทุกวันค่ะ']),
  };
  function namedSheet(f){
    const c = OD.CHARS[f.a.who], q = Q();
    if(!q.talked.includes(f.a.who)) q.talked.push(f.a.who);
    sheet(head('💬', c.name, c.title) + `<div class="wk-sh-b"><div class="wk-say"><div class="face">${OD.art.person(f.a.who,'neutral')}</div><div>${SAY[f.a.who]()}</div></div></div>`
      + (f.a.who==='doctor' ? `<div class="wk-acts">${cloneActs(['interview','hyp','skip'])}</div>` : f.a.who==='boonma' ? `<div class="wk-acts">${cloneActs(['acf'])}</div>` : ''), f);
    checkBadges();
  }
  function villagerSheet(f){
    const p = f.a.p, hhSick = recs().some(r=>!r.dup && r.p.hh===p.hh);
    const kid = p.age < 13, old = p.age >= 60;
    let pool;
    if(S.trust < 40) pool = ['ทีมสาธารณสุขอีกแล้ว… ถามแต่เรื่องเดิม ๆ', 'ไม่รู้จะเชื่อใครดี ในเฟซบุ๊กเขาลือกันไปหมด', 'ปิดนู่นปิดนี่ แล้วชาวบ้านจะทำมาหากินยังไง'];
    else if(hhSick) pool = ['คนในบ้านฉันท้องเสียอยู่เลย หมอมาถามข้อมูลได้นะ', 'ที่บ้านมีคนป่วย ฉันต้มน้ำดื่มทุกวันแล้วตอนนี้', 'หวังว่าจะหาต้นเหตุเจอเร็ว ๆ นะ คนที่บ้านยังไม่หายดีเลย'];
    else if(kid) pool = ['พี่เป็นนักสืบเหรอ! เท่จัง 😆', 'หนูล้างมือก่อนกินข้าวทุกครั้งเลยนะ ครูสอน!', 'โตขึ้นหนูอยากเป็นนักวิทยาศาสตร์ข้อมูลแบบพี่บ้าง!', 'ไก่บ้านหนูชอบหนีออกไปเดินเล่นตรงนา', 'พี่ ๆ เห็นผีเสื้อสีชมพูแถวนี้ไหม หนูตามมาตั้งนานแล้ว!'];
    else if(old) pool = ['สมัยก่อนเราดื่มน้ำบ่อกันทั้งหมู่บ้าน ไม่เห็นเป็นอะไรเลย…', 'ยายต้มน้ำก่อนดื่มทุกครั้งนะ แม่ยายสอนมา', 'หลานเอ๊ย เดินดี ๆ นะ ถนนแถวนี้ลื่น'];
    else pool = ['ช่วงนี้ได้ยินว่าคนท้องเสียกันเยอะ จริงไหมคะ', 'ฝนตกหนักคืนนั้น น้ำในคลองขึ้นสูงมากเลย', 'งานบุญคราวนี้คนเยอะมาก ใคร ๆ ก็ไป', 'ฉันซื้อน้ำแข็งที่ร้านประจำทุกวัน อากาศมันร้อน'];
    const h = k => hash(p.id, k), fem = p.sex==='หญิง';
    const call = kid ? (fem?'เด็กหญิง':'เด็กชาย') : old ? (fem?'คุณยาย':'คุณตา') : (fem?'ชาวบ้าน (หญิง)':'ชาวบ้าน (ชาย)');
    sheet(head('💬', `${call} · ${p.age} ปี`, M.VILLAGES[p.v-1].name) + `<div class="wk-sh-b"><div class="wk-say">${pxPortrait(f.a.look)}<p class="wk-bubble">“${pool[Math.floor(h(20 + (S.T/6|0))*pool.length)]}”</p></div></div>`, f);
  }

  /* ---------- ภารกิจชาวบ้าน ---------- */
  let washState = null;
  function questSheet(f){
    const who = f.a.q, q = Q();
    if(who==='yai'){
      const t = q.hen===0 ? `หลานจ๋า… ไก่นางดำของยายหายไปตั้งแต่เช้า มันชอบไปคุ้ยดินแถว<b>${quest.henMark}</b> ช่วยตามหาให้ยายหน่อยได้ไหม`
        : q.hen===1 ? `ยังหาไม่เจอเหรอหลาน… ลองไปดูแถว<b>${quest.henMark}</b> มันตัวดำ ๆ ร้องกุ๊ก ๆ` : q.hen===2 ? 'นั่นไง นางดำ! มาใกล้ ๆ ยายหน่อย' : 'นางดำออกไข่ให้ยายแล้วนะ ขอบใจหลานอีกทีจ้ะ — อย่าลืมล้างมือหลังจับไก่ด้วยนะ!';
      return sheet(qHead('yai') + `<div class="wk-sh-b">${say('yai', t)}</div>` + (q.hen===0 ? `<div class="wk-acts">${wbtn('data-w="q" data-q="hen" data-v="1"', '🐔 รับภารกิจ: ตามหาไก่นางดำ', 'ความเชื่อมั่นชุมชน +๒')}</div>` : ''), f);
    }
    if(who==='kids'){
      if(q.wash===2) return sheet(qHead('kids') + `<div class="wk-sh-b">${say('kids', 'หนูล้างมือครบ ๗ ขั้นตอนทุกครั้งเลยค่ะ! ร้องเพลงแฮปปี้เบิร์ธเดย์ ๒ รอบ ก็ ๒๐ วินาทีพอดี 🎵')}</div>`, f);
      return sheet(qHead('kids') + `<div class="wk-sh-b">${say('kids', 'พี่ขา ครูสอนล้างมือ ๗ ขั้นตอนแล้วแต่หนูลืม… พี่สอนหน่อยได้ไหมคะ')}</div><div class="wk-acts">${wbtn('data-w="q" data-q="wash" data-v="1"', '🧼 สอนน้องล้างมือ ๗ ขั้นตอน', 'มินิเกม · ความเชื่อมั่น +๒')}</div>`, f);
    }
    if(who==='lung'){
      const all = q.trashGot.length===quest.trash.length;
      if(q.trash===1 && all){ q.trash = 2; reward('ช่วยลุงเผือกเก็บขยะริมคลอง');
        return sheet(qHead('lung') + `<div class="wk-sh-b">${say('lung', 'ครบแล้ว! คลองสะอาดขึ้นเยอะเลย… ขยะกับสิ่งปฏิกูลในน้ำคือบ้านของเชื้อโรค ถ้าคลองสะอาด คนใช้น้ำก็ปลอดภัยขึ้น')}</div>`, f); }
      const t = q.trash===0 ? 'ขยะลอยมาติดริมคลองเต็มเลยหลังพายุ… น้ำสกปรก เชื้อโรคก็มากับน้ำ ช่วยลุงเก็บสัก ๘ ชิ้นได้ไหม'
        : q.trash===1 ? `เก็บได้ ${U.thaiNum(q.trashGot.length)} จาก ${U.thaiNum(quest.trash.length)} ชิ้นแล้ว — ดูจุดสีเขียวบนแผนที่ย่อนะ` : 'ขอบใจมากหลาน ปลาก็กลับมาแล้ว ลุงจะช่วยบอกชาวบ้านไม่ให้ทิ้งขยะลงคลองอีก';
      return sheet(qHead('lung') + `<div class="wk-sh-b">${say('lung', t)}</div>` + (q.trash===0 ? `<div class="wk-acts">${wbtn('data-w="q" data-q="trash" data-v="1"', '🗑️ รับภารกิจ: เก็บขยะริมคลอง ๘ ชิ้น', 'ความเชื่อมั่นชุมชน +๒')}</div>` : ''), f);
    }
  }
  function questAction(k, v){
    const q = Q();
    if(k==='hen'){ q.hen = 1; qhen.x = qhen.hx = quest.hen.x; qhen.y = qhen.hy = quest.hen.y; closeSheet(); U.toast(`🐔 รับภารกิจแล้ว! ไก่นางดำอยู่แถว<b>${quest.henMark}</b> (มองหาฟอง … เหนือไก่ดำ)`, '', 5000); OD.sfx && OD.sfx('pin'); }
    if(k==='trash'){ q.trash = 1; closeSheet(); U.toast('🗑️ รับภารกิจแล้ว! ขยะ ๘ ชิ้นเป็น<b>จุดสีเขียว</b>บนแผนที่ย่อ เดินผ่านเพื่อเก็บ', '', 5000); OD.sfx && OD.sfx('pin'); }
    if(k==='wash'){ washState = {order:U.shuffle(WASH.map((_,i)=>i)), next:0, miss:0}; washDraw(); }
    hudKey = '';
  }
  function washDraw(){
    const w = washState;
    sheet(qHead('kids') + `<div class="wk-sh-b">${say('kids', w.next===0 ? 'ขั้นแรกทำยังไงคะพี่?' : `ถูกต้อง! แล้วขั้นที่ ${U.thaiNum(w.next+1)} ล่ะคะ?`)}
      <ol class="wk-wash-done">${WASH.slice(0, w.next).map(([ic,t])=>`<li>${ic} ${t}</li>`).join('')}</ol>
      <p class="faint" style="font-size:13px">แตะขั้นตอนตามลำดับ ๑ → ๗ (ล้างนานรวมอย่างน้อย ๒๐ วินาที)</p></div>
      <div class="wk-acts wk-wash">${w.order.filter(i=>i>=w.next).map(i=>wbtn(`data-w="wash" data-i="${i}"`, `${WASH[i][0]} ${WASH[i][1]}`, '')).join('')}</div>`, {kind:'quest', a:actors.find(a=>a.q==='kids')});
  }
  function washPick(i){
    const w = washState; if(!w) return;
    if(i===w.next){ w.next++; OD.sfx && OD.sfx('pin');
      if(w.next===WASH.length){ Q().wash = 2; washState = null; reward('สอนน้อง ๆ ล้างมือ ๗ ขั้นตอน');
        sheet(qHead('kids') + `<div class="wk-sh-b">${say('kids', w.miss ? 'เย้! จำได้หมดแล้วค่ะ ขอบคุณพี่นะคะ 💖' : 'สุดยอด ถูกหมดทุกขั้นเลย! พี่เป็นครูได้แน่ ๆ 💖')}</div>`, {kind:'quest', a:actors.find(a=>a.q==='kids')}); return; }
      washDraw(); }
    else { w.miss++; OD.sfx && OD.sfx('down'); U.toast(`🤔 ยังไม่ใช่ขั้นที่ ${U.thaiNum(w.next+1)} — ลองนึกดูว่าทำอะไรต่อจาก “${w.next ? WASH[w.next-1][1] : 'เปิดน้ำ ฟอกสบู่'}”`, '', 2600); }
  }

  /* ---------- นำทาง / สมุดนักสำรวจ ---------- */
  let navList = [];
  function navSheet(){
    navList = places().sort((a,b)=>a.d-b.d);
    const per = Q().riding ? 3 : 1;
    const map = '<div class="wk-map-full"><img alt="แผนที่ตำบลพร้อมหมุดสถานที่" src="'+built.mm.toDataURL()+'">'
      + navList.map((s,i)=>'<button class="wk-pin '+(s.closed ? 'closed' : '')+'" data-w="go" data-i="'+i+'" style="left:'+s.x/WW*100+'%;top:'+s.y/WH*100+'%" title="'+U.esc(s.n)+'" aria-label="ไป '+U.esc(s.n)+'">'+U.esc(s.code)+'</button>').join('')
      + caseFlags().map(f=>'<span class="wk-map-case" style="left:'+f.x/WW*100+'%;top:'+f.y/WH*100+'%" title="บ้านผู้ป่วย"></span>').join('')
      + '<span class="wk-map-you" style="left:'+P.x/WW*100+'%;top:'+P.y/WH*100+'%" title="คุณอยู่ที่นี่">●</span></div>';
    sheet(head('🗺️', 'แผนที่และชื่อสถานที่', 'แตะหมุดรหัสหรือชื่อด้านล่าง เพื่อเดินไปสำรวจและเปิดข้อมูลเมื่อถึง')
      + '<div class="wk-sh-b">'+map+'<p class="wk-map-legend">🟢 คุณอยู่ที่นี่ · H ฐาน รพ.สต. · R ร้านอาหาร · W บ่อน้ำ · V ลานหมู่บ้าน · 🔴 บ้านผู้ป่วย · หมุดชมพู ปิดอยู่ · ❔ ยังไม่รู้จัก</p><p class="faint">'+(Q().riding ? '🚲 ปั่นจักรยาน' : '🚶 เดิน')+' · เวลาเดินทางในเกมคิดตามระยะทางจริง · รายชื่อด้านล่างเลือกได้ทุกจุด</p></div>'
      + '<div class="wk-acts wk-nav">'+navList.map((s,i)=>wbtn('data-w="go" data-i="'+i+'"', '<b class="wk-place-code">'+U.esc(s.code)+'</b> '+s.ic+' '+U.esc(s.n)+(s.closed ? ' · ปิดอยู่' : '')+(Q().visited.includes(spotKey(s.spot)) ? ' ✓' : ''), (s.d*4/1000).toFixed(1)+' กม. โดยประมาณ · ~'+Math.max(1,Math.round(s.d/per/UNITS_PER_HOUR*60))+' นาที')).join('')+'</div>', {kind:'nav',x:null});
    el.querySelector('.wk-sheet').classList.add('wk-map-sheet');
  }
  function bookSheet(tab){
    const q = Q(), tabs = [['badge','🏅 เหรียญ'],['quest','📌 ภารกิจ'],['card','✨ การ์ดความรู้']];
    let body = '';
    if(tab==='badge') body = `<div class="wk-badges">${BADGES.map(([k,ic,n,d])=>`<div class="wk-badge ${q.badges.includes(k)?'on':''}"><span class="bi">${q.badges.includes(k)?ic:'🔒'}</span><b>${n}</b><small>${d}</small></div>`).join('')}</div>
      <p class="faint" style="font-size:13px">เดินทางรวม ${(q.dist*4/1000).toFixed(1)} กม.${q.bikeDist?` (ปั่น ${(q.bikeDist*4/1000).toFixed(1)} กม.)`:''} · ไปมาแล้ว ${U.thaiNum(q.visited.length)}/${U.thaiNum(built.spots.length)} แห่ง · คุยกับคนสำคัญ ${U.thaiNum(q.talked.length)}/${U.thaiNum(NAMED.length)} คน</p>`;
    if(tab==='quest'){ const st = (s, a, b) => s>=b ? '<span class="ok">✅ สำเร็จ</span>' : s>=a ? '<span class="go">⏳ กำลังทำ</span>' : '<span class="no">ยังไม่ได้รับ</span>';
      body = `<ul class="wk-qlist">
        <li><b>🐔 ไก่นางดำของยายผิน</b> ${st(q.hen,1,3)}<small>คุยกับยายผินที่ลานหมู่ ๑ บ้านทุ่ง${q.hen===1?` · ยายว่ามันชอบไปแถว${quest.henMark}`:''}</small></li>
        <li><b>🧼 สอนน้องล้างมือ ๗ ขั้นตอน</b> ${st(q.wash,1,2)}<small>น้อง ๆ ยืนรออยู่หน้าโรงอาหารโรงเรียน</small></li>
        <li><b>🗑️ เก็บขยะริมคลอง</b> ${st(q.trash,1,2)}<small>ลุงเผือกนั่งอยู่ริมคลองใกล้สะพาน${q.trash===1?` · เก็บแล้ว ${U.thaiNum(q.trashGot.length)}/${U.thaiNum(quest.trash.length)}`:''}</small></li></ul>
        <p class="faint" style="font-size:13px">ทำภารกิจสำเร็จ ชาวบ้านจะไว้ใจทีมมากขึ้น (ความเชื่อมั่นชุมชน +๒ ต่อภารกิจ)</p>`; }
    if(tab==='card') body = `<div class="wk-cards">${CARDS.map(([t,d],i)=>S.flags.walkCards.includes(i) ? `<div class="wk-card sm"><b>${t}</b><p>${d}</p></div>` : `<div class="wk-card sm locked"><b>❓ การ์ดใบที่ ${U.thaiNum(i+1)}</b><p>ยังไม่พบ — ซ่อนอยู่ที่ไหนสักแห่งในตำบล</p></div>`).join('')}</div>`;
    sheet(head('📒', 'สมุดนักสำรวจ', `เหรียญ ${U.thaiNum(q.badges.length)}/${U.thaiNum(BADGES.length)} · การ์ด ${U.thaiNum(S.flags.walkCards.length)}/${U.thaiNum(CARDS.length)}`)
      + `<div class="wk-tabs">${tabs.map(([k,l])=>`<button class="wk-tab ${k===tab?'on':''}" data-w="book" data-tab="${k}">${l}</button>`).join('')}</div><div class="wk-sh-b">${body}</div>`, {kind:'book', x:null});
  }
  function showCard(i){
    const [t, d] = CARDS[i];
    OD.sfx && OD.sfx('ding');
    sheet(head('✨', `การ์ดความรู้ ${U.thaiNum(S.flags.walkCards.length)}/${U.thaiNum(CARDS.length)}`, t) + `<div class="wk-sh-b"><div class="wk-card"><b>${t}</b><p>${d}</p></div>
      ${S.flags.walkCards.length===CARDS.length ? '<div class="note jade">🏆 เก็บครบทุกใบแล้ว! คุณคือนักสืบสายความรู้ตัวจริง</div>' : ''}</div><div class="wk-acts"><button class="wk-ab" data-w="card"><span>เก็บใส่สมุด 📒</span></button></div>`, {kind:'card', x:P.x, y:P.y});
  }
  function help(){
    sheet(head('🚶', 'เดินสำรวจตำบลบ้านสุขใจ', 'โหมดใหม่ในเวอร์ชัน ๓')
      + `<div class="wk-sh-b"><ul class="wk-list">
        <li><b>เดิน:</b> ปุ่มลูกศร / WASD (กด <b>Shift</b> ค้างเพื่อวิ่ง) · <b>แตะ/คลิก</b>ที่พื้นเพื่อเดินไปเอง · <b>แตะค้างแล้วลาก</b>เพื่อบังคับทิศแบบจอยสติ๊ก</li>
        <li><b>🧭 ไปที่…</b> เลือกสถานที่แล้วตัวละครเดินไปเอง · แตะ<b>ชื่อร้าน / ขยายแผนที่</b> ดูชื่อและเลือกหมุด · <b>🏥 กลับ รพ.สต.</b> เดินกลับฐาน · <b>⏹ หยุดเดิน</b> ยกเลิกจุดหมาย · <b>🚲</b> ยืมจักรยานที่ รพ.สต.</li>
        <li><b>คุย/สำรวจ:</b> เมื่อมีเครื่องหมาย <b style="color:#e8b830">!</b> กด <b>E</b> / Space หรือแตะปุ่ม 💬</li>
        <li>📌 <b>ภารกิจชาวบ้าน</b> ๓ อย่าง (คนที่มีฟอง <b style="color:#e8b830">!</b> เหนือหัว) · 🏅 เหรียญ ${U.thaiNum(BADGES.length)} เหรียญ · ✨ การ์ดความรู้ ${U.thaiNum(CARDS.length)} ใบ — ดูใน <b>📒 สมุด</b></li>
        <li>🚩 <b>ธงแดง</b> = บ้านที่มีผู้ป่วยในฐานข้อมูล (ธงส้มกะพริบ = รายงานใหม่) · 🏥 <b>รพ.สต.</b> = ฐานทีม สัมภาษณ์ ส่งรายงานได้ที่นั่น</li>
        <li><b>สะดุ้ง: เปิด/ปิด</b> เลือกเหตุการณ์แมวหรือนกเล็กน้อย ไม่มีผลต่อคะแนน และจำค่าที่เลือก</li>
        <li>⏱️ <b>เวลาเดินทางมีค่า:</b> เดิน ๔ กม. หรือปั่น ๑๒ กม. = ๑ ชม. ในเกม (คิดเมื่อทำภารกิจหรือกลับหน้าข้อมูล)</li></ul></div>
        <div class="wk-acts"><button class="wk-ab" data-w="close"><span>เริ่มเดินเลย! 🚶</span></button></div>`, {kind:'help', x:null});
  }
  async function doAction(a, arg){
    closeSheet();
    // คิดเวลาเดินทางก่อน แล้วให้เหตุการณ์ที่ถึงเวลาเกิดขึ้นก่อนเริ่มงานใหม่
    if(charge()){ await F.after(); if(!running || document.getElementById('scr-field').classList.contains('hidden')) return; }
    if(a==='report'){ await close(); F.act('report'); return; }
    F.act(a, arg);
  }

  // _dbg/_t ใช้กับชุดทดสอบ headless เท่านั้น (เกมไม่ได้เรียกใช้)
  return {open, close, get on(){ return running; }, _dbg: ()=>({P, path, frames, lastT, built, quest, qhen, camF}), _t: {findPath, update, draw, goTo, walkable, caseFlags, interact, nearest, questAction, washPick, navSheet, bookSheet, toggleBike, places, selectPlace, cancelNavigation, triggerStartle, startleState:()=>({enabled:startleOn, active:startleLife>0, count:startleCount, clock:startleClock, next:startleNext})}};
})();
