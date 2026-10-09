/* =========================================================
   ลายไทย: ประจำยาม กระจัง กนกเข้ามุม ลายก้ามปู — วาดด้วย SVG
   ========================================================= */
window.OD = window.OD || {};
OD.art = OD.art || {};

(function(A){
  const uri = svg => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;

  /* กลีบประจำยาม 1 กลีบ (ชี้ขึ้น) ใน viewBox 100x100 ศูนย์กลาง 50,50 */
  const PETAL = 'M50 50 C40 43 33 33 37 22 C39 16 44 11 50 4 C56 11 61 16 63 22 C67 33 60 43 50 50 Z';
  const PETAL_IN = 'M50 44 C44 39 41 32 43 25 C45 20 47 17 50 13 C53 17 55 20 57 25 C59 32 56 39 50 44 Z';
  const LEAF = 'M50 50 C46 45 45 39 50 30 C55 39 54 45 50 50 Z';

  /* ประจำยาม (ดอกสี่กลีบ) */
  A.prajam = function(fill, line, bg, size=100){
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">`;
    for(const r of [45,135,225,315]) s += `<path d="${LEAF}" fill="${fill}" opacity=".85" transform="rotate(${r} 50 50) translate(0 -14)"/>`;
    for(const r of [0,90,180,270]){
      s += `<g transform="rotate(${r} 50 50)"><path d="${PETAL}" fill="${fill}" stroke="${line}" stroke-width="1.2"/>`+
           `<path d="${PETAL_IN}" fill="none" stroke="${bg}" stroke-width="2.2" opacity=".9"/>`+
           `<path d="M50 40 L50 18" stroke="${bg}" stroke-width="1.4" opacity=".75"/></g>`;
    }
    s += `<circle cx="50" cy="50" r="11" fill="${fill}" stroke="${line}" stroke-width="1.2"/><circle cx="50" cy="50" r="6.5" fill="${bg}"/><circle cx="50" cy="50" r="3.6" fill="${fill}"/>`;
    return s + `</svg>`;
  };

  /* กนกเปลว (ตัวกนกสามตัวแบบย่อ) วาดชี้ไปทางขวา ความยาว ~40 */
  function kranok(x,y,rot,sc,fill,bg){
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">`+
      `<path d="M0 0 C6 -9 16 -13 26 -12 C33 -11 38 -14 41 -20 C41 -10 35 -4 26 -3 C33 -2 37 1 40 6 C33 3 27 3 21 5 C13 8 5 6 0 0 Z" fill="${fill}"/>`+
      `<path d="M6 -2 C11 -7 18 -8 24 -7" fill="none" stroke="${bg}" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`+
      `<circle cx="4" cy="-1" r="2.2" fill="${bg}" opacity=".9"/></g>`;
  }

  /* กนกเข้ามุม (มุมซ้ายบน) viewBox 100x100 */
  A.corner = function(fill, line, bg){
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">`;
    s += `<path d="M4 98 V16 Q4 4 16 4 H98" fill="none" stroke="${line}" stroke-width="1.6"/>`;
    s += `<path d="M11 98 V22 Q11 11 22 11 H98" fill="none" stroke="${line}" stroke-width=".8" opacity=".55"/>`;
    s += kranok(30,18,0,.95,fill,bg) + kranok(18,30,90,.95,fill,bg);
    s += kranok(62,11,0,.55,fill,bg) + kranok(11,62,90,.55,fill,bg);
    s += `<g transform="translate(2 2) scale(.32)">${A.prajam(fill,line,bg).replace(/<svg[^>]*>|<\/svg>/g,'')}</g>`;
    s += `<circle cx="86" cy="11" r="2" fill="${fill}"/><circle cx="11" cy="86" r="2" fill="${fill}"/>`;
    return s + `</svg>`;
  };

  /* กระจังฟันปลา (ไทล์แถบ) 22x16 */
  A.krajang = function(fill, bg){
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 16">`+
      `<path d="M1 16 C2 12 6 10.5 7.5 8 C9 5.5 10 3 11 0.5 C12 3 13 5.5 14.5 8 C16 10.5 20 12 21 16 Z" fill="${fill}"/>`+
      `<path d="M5.5 16 C7.5 13.5 10 12 11 8 C12 12 14.5 13.5 16.5 16 Z" fill="${bg}" opacity=".8"/>`+
      `<circle cx="11" cy="12.6" r="1.4" fill="${fill}"/></svg>`;
  };

  /* ลายก้ามปู (พื้นหลังโปร่ง) ไทล์ 64x64 */
  A.lattice = function(fill, op){
    const small = A.prajam(fill,fill,'transparent').replace(/<svg[^>]*>|<\/svg>/g,'');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" opacity="${op}">`+
      `<path d="M0 32 L32 0 L64 32 L32 64 Z" fill="none" stroke="${fill}" stroke-width=".6"/>`+
      `<g transform="translate(23 23) scale(.18)">${small}</g>`+
      [[0,0],[64,0],[0,64],[64,64]].map(([x,y])=>`<g transform="translate(${x-7} ${y-7}) scale(.14)">${small}</g>`).join('')+
      `</svg>`;
  };

  /* ลายคั่น: ประจำยามกลาง + กนกออกสองข้าง  viewBox 160x22 */
  A.divider = function(fill, line, bg){
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 22">`;
    s += `<g transform="translate(69 0) scale(.22)">${A.prajam(fill,line,bg).replace(/<svg[^>]*>|<\/svg>/g,'')}</g>`;
    s += kranok(94,12,0,.62,fill,bg) + `<g transform="translate(160 0) scale(-1 1)">${kranok(94,12,0,.62,fill,bg)}</g>`;
    s += `<circle cx="126" cy="11" r="1.8" fill="${fill}"/><circle cx="34" cy="11" r="1.8" fill="${fill}"/>`;
    s += `<circle cx="134" cy="11" r="1.1" fill="${fill}"/><circle cx="26" cy="11" r="1.1" fill="${fill}"/>`;
    return s + `</svg>`;
  };

  function rotCorner(svg, k){ // หมุนมุม: 0=tl 1=tr 2=br 3=bl
    const t = ['', 'translate(100 0) scale(-1 1)', 'translate(100 100) scale(-1 -1)', 'translate(0 100) scale(1 -1)'][k];
    return svg.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/, (m,a,b,c)=>`${a}<g transform="${t}">${b}</g>${c}`);
  }

  const PAL = {
    dark:  {fill:'#d4ae5c', line:'#a07a2c', bg:'#1b130d', lat:'#d4ae5c', latOp:.07, ink:'#9a7637', inkBg:'#efe1c1'},
    light: {fill:'#9a7424', line:'#7a5717', bg:'#f7eed8', lat:'#8a6720', latOp:.09, ink:'#9a7637', inkBg:'#fbf4e2'},
  };

  A.install = function(theme){
    const p = PAL[theme] || PAL.dark, st = document.documentElement.style;
    const c = A.corner(p.fill, p.line, p.bg), ci = A.corner(p.ink, p.ink, p.inkBg);
    ['tl','tr','br','bl'].forEach((k,i)=>{
      st.setProperty(`--orn-c-${k}`, uri(rotCorner(c,i)));
      st.setProperty(`--orn-c-${k}-ink`, uri(rotCorner(ci,i)));
    });
    st.setProperty('--orn-lattice', uri(A.lattice(p.lat, p.latOp)));
    st.setProperty('--orn-divider', uri(A.divider(p.fill, p.line, p.bg)));
    st.setProperty('--orn-divider-ink', uri(A.divider(p.ink, p.ink, p.inkBg)));
    st.setProperty('--orn-krajang', uri(A.krajang(p.fill, p.bg)));
    st.setProperty('--orn-prajam', uri(A.prajam(p.fill, p.line, p.bg)));
  };

  /* ประจำยามแบบ inline สำหรับหัวข้อ */
  A.prajamInline = function(size=22){
    return A.prajam('var(--gold)','var(--gold-3)','var(--panel)',size).replace('<svg ','<svg class="pj" aria-hidden="true" ');
  };
})(OD.art);
