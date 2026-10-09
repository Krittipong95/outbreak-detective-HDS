/* =========================================================
   util — ตัวช่วยทั่วไป, สุ่มแบบกำหนด seed, สถิติ, UI พื้นฐาน
   ========================================================= */
window.OD = window.OD || {};
OD.u = (function(){
  const U = {};
  U.$ = (s, r=document) => r.querySelector(s);
  U.$$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  U.esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  U.sleep = ms => new Promise(r=>setTimeout(r, ms));

  /* ---------- random ---------- */
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  let R = Math.random;
  U.seed = s => { R = mulberry32(s); };
  U.unseed = () => { R = Math.random; };
  U.r = () => R();
  U.gauss = () => { let u=0,v=0; while(!u)u=R(); while(!v)v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  U.pick = a => a[Math.floor(R()*a.length)];
  U.shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  U.wpick = (items, ws) => { const t=ws.reduce((x,y)=>x+y,0); let r=R()*t; for(let i=0;i<items.length;i++){ r-=ws[i]; if(r<=0) return items[i]; } return items[items.length-1]; };
  U.clamp = (x,a,b) => Math.max(a, Math.min(b, x));
  U.median = arr => { if(!arr.length) return NaN; const s=arr.slice().sort((a,b)=>a-b), m=s.length>>1; return s.length%2 ? s[m] : (s[m-1]+s[m])/2; };

  /* ---------- formatting ---------- */
  const TH = '๐๑๒๓๔๕๖๗๘๙';
  U.thaiNum = n => String(n).replace(/\d/g, d=>TH[d]);
  U.baht = n => '฿' + Math.round(n).toLocaleString('th-TH');
  U.pct = (x, d=0) => (x*100).toFixed(d) + '%';
  U.fmtOR = x => !isFinite(x) ? '∞' : x>=100 ? x.toFixed(0) : x>=10 ? x.toFixed(1) : x.toFixed(2);
  U.fmtP = p => p<0.001 ? '<0.001' : p.toFixed(3);

  /* ---------- stats ---------- */
  const LF = [0];
  function logFact(n){ for(let i=LF.length;i<=n;i++) LF[i]=LF[i-1]+Math.log(i); return LF[n]; }
  function hyper(a,b,c,d){ const n=a+b+c+d; return Math.exp(logFact(a+b)+logFact(c+d)+logFact(a+c)+logFact(b+d)-logFact(n)-logFact(a)-logFact(b)-logFact(c)-logFact(d)); }
  U.fisherP = function(a,b,c,d){
    const r1=a+b, c1=a+c, n=a+b+c+d, pObs=hyper(a,b,c,d);
    let p=0; const lo=Math.max(0,c1-(n-r1)), hi=Math.min(r1,c1);
    for(let x=lo;x<=hi;x++){ const px=hyper(x,r1-x,c1-x,n-r1-c1+x); if(px<=pObs*(1+1e-7)) p+=px; }
    return Math.min(1,p);
  };
  /* a=สัมผัส&ป่วย b=สัมผัส&ไม่ป่วย c=ไม่สัมผัส&ป่วย d=ไม่สัมผัส&ไม่ป่วย */
  U.or2x2 = function(a,b,c,d){
    const z = (a===0||b===0||c===0||d===0) ? .5 : 0;
    const A=a+z,B=b+z,C=c+z,D=d+z, or=(A*D)/(B*C), se=Math.sqrt(1/A+1/B+1/C+1/D);
    return {or, lo:Math.exp(Math.log(or)-1.96*se), hi:Math.exp(Math.log(or)+1.96*se), p:U.fisherP(a,b,c,d)};
  };
  /* Mantel–Haenszel OR พร้อม CI แบบ test-based */
  U.mh = function(strata){
    let num=0, den=0, chiN=0, chiV=0;
    for(const [a,b,c,d] of strata){
      const n=a+b+c+d; if(n<2) continue;
      num += a*d/n; den += b*c/n;
      const r1=a+b, r0=c+d, m1=a+c, m0=b+d;
      chiN += a - r1*m1/n; chiV += r1*r0*m1*m0/(n*n*(n-1));
    }
    if(den===0 || num===0) return {or: num>0?Infinity:0, lo:NaN, hi:NaN};
    const or=num/den, chi=chiV>0 ? (chiN*chiN)/chiV : 0;
    if(chi<=0) return {or, lo:NaN, hi:NaN};
    const k=1.96/Math.sqrt(chi);
    return {or, lo:Math.pow(or,1-k), hi:Math.pow(or,1+k)};
  };

  /* ---------- UI ---------- */
  U.show = id => { U.$$('.screen').forEach(s=>s.classList.toggle('hidden', s.id!==id)); window.scrollTo(0,0); };
  U.toast = function(msg, kind=''){
    const box = U.$('#toasts'); const t = document.createElement('div');
    t.className = 'toast ' + kind; t.innerHTML = msg; box.appendChild(t);
    while(box.children.length > 2) box.firstElementChild.remove();   // แสดงพร้อมกันไม่เกิน ๒ อัน ไม่บังแถบสถานะ
    setTimeout(()=>t.remove(), 3200);
  };
  let mh = null;
  U.modal = function(html, handler, opts={}){
    const root = U.$('#modal');
    root.innerHTML = `<div class="m-card ${opts.paper?'paper':'frame'} ${opts.wide?'wide':''} ${opts.cls||''}" role="dialog" aria-modal="true">${html}</div>`;
    root.classList.add('open'); mh = handler;
    root.onclick = e => {
      if(e.target===root && !opts.locked){ U.closeModal(); return; }
      const b = e.target.closest('[data-m]'); if(b && !b.disabled && mh) mh(b.dataset.m, b, e);
    };
    return root.firstElementChild;
  };
  U.closeModal = () => { const r=U.$('#modal'); r.classList.remove('open'); r.innerHTML=''; r.onclick=null; mh=null; };
  U.ask = (html, buttons, opts={}) => new Promise(res=>{
    U.modal(html + `<div class="m-actions">${buttons.map(([k,label,cls])=>`<button class="btn ${cls||''}" data-m="${k}">${label}</button>`).join('')}</div>`,
      k=>{ U.closeModal(); res(k); }, Object.assign({locked:true}, opts));
  });
  U.tip = function(e, html){
    const t = U.$('#tooltip'); t.innerHTML = html; t.classList.remove('hidden');
    const r = t.getBoundingClientRect(); let x=e.clientX+14, y=e.clientY+14;
    if(x+r.width>innerWidth-8) x=e.clientX-r.width-14; if(y+r.height>innerHeight-8) y=e.clientY-r.height-14;
    t.style.left=Math.max(8,x)+'px'; t.style.top=Math.max(8,y)+'px';
  };
  U.hideTip = () => U.$('#tooltip').classList.add('hidden');
  return U;
})();
