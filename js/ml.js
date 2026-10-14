/* =========================================================
   ml — อัลกอริทึมวิทยาศาสตร์ข้อมูลที่ใช้ในเกม (เขียนเองทั้งหมด ไม่พึ่งไลบรารีภายนอก เล่นออฟไลน์ได้)
   logistic regression · decision tree (CART) · k-fold cross-validation · ROC/AUC
   Naive Bayes สำหรับข้อความภาษาไทย · DBSCAN · KDE · การพยากรณ์ · ระบบเตือนภัยการระบาด
   ========================================================= */
OD.ml = (function(){
  const U = OD.u, ML = {};

  /* ---------- สุ่มแบบกำหนด seed (แยกจากของโลกจำลอง จะได้ไม่รบกวนลำดับสุ่มของเกม) ---------- */
  ML.rng = function(seed){
    let a = seed>>>0;
    return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; };
  };
  ML.gauss = r => { let u=0,v=0; while(!u)u=r(); while(!v)v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  ML.poisson = (lam, r) => {
    if(lam<=0) return 0;
    if(lam>40) return Math.max(0, Math.round(lam + Math.sqrt(lam)*ML.gauss(r)));
    const L = Math.exp(-lam); let k = 0, p = 1;
    do{ k++; p *= r(); } while(p>L);
    return k-1;
  };
  ML.shuffle = (a, r) => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  ML.mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : NaN;
  ML.sd = a => { if(a.length<2) return 0; const m = ML.mean(a); return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)); };
  /* การแจกแจงปกติสะสม (Abramowitz–Stegun) ใช้คำนวณค่า p ของ Wald test */
  ML.normCdf = x => { const t=1/(1+0.2316419*Math.abs(x)), d=0.3989423*Math.exp(-x*x/2);
    const p = d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274)))); return x>0 ? 1-p : p; };

  /* ---------- พีชคณิตเมทริกซ์ขนาดเล็ก ---------- */
  function inv(A){
    const n = A.length, M = A.map((r,i)=>r.concat(Array.from({length:n},(_,j)=>i===j?1:0)));
    for(let c=0;c<n;c++){
      let p = c; for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[p][c])) p = r;
      if(Math.abs(M[p][c])<1e-12) return null;
      [M[c],M[p]] = [M[p],M[c]];
      const d = M[c][c]; for(let j=0;j<2*n;j++) M[c][j] /= d;
      for(let r=0;r<n;r++) if(r!==c){ const f = M[r][c]; if(f) for(let j=0;j<2*n;j++) M[r][j] -= f*M[c][j]; }
    }
    return M.map(r=>r.slice(n));
  }
  const sig = z => 1/(1+Math.exp(-z));

  /* ---------- Logistic regression (Newton–Raphson / IRLS) ----------
     ใส่ ridge เล็กน้อย (λ) ที่สัมประสิทธิ์ทุกตัวยกเว้นค่าคงที่ กันค่าพุ่งเป็นอนันต์เมื่อข้อมูลแยกขาด (separation)
     X: n×p (0/1 หรือตัวเลข) · y: 0/1 → สัมประสิทธิ์ ค่าคลาดเคลื่อนมาตรฐาน และฟังก์ชันทำนายความน่าจะเป็น */
  ML.logistic = function(X, y, o={}){
    const n = X.length, p = (X[0]||[]).length + 1, lam = o.lambda==null ? 0.1 : o.lambda;
    const Z = X.map(r=>[1].concat(r));
    const b = new Array(p).fill(0);
    let conv = false, it = 0;
    const hess = () => {
      const g = new Array(p).fill(0), H = Array.from({length:p},()=>new Array(p).fill(0));
      for(let i=0;i<n;i++){
        const z = Z[i]; let eta = 0; for(let j=0;j<p;j++) eta += b[j]*z[j];
        const mu = sig(eta), w = Math.max(mu*(1-mu), 1e-9), r = y[i]-mu;
        for(let j=0;j<p;j++){ if(!z[j]) continue; g[j] += r*z[j]; const wz = w*z[j]; for(let k=j;k<p;k++) if(z[k]) H[j][k] += wz*z[k]; }
      }
      for(let j=0;j<p;j++){ for(let k=0;k<j;k++) H[j][k] = H[k][j]; if(j>0){ H[j][j] += lam; g[j] -= lam*b[j]; } }
      return {g, H};
    };
    for(it=0; it<60; it++){
      const {g, H} = hess(), Hi = inv(H); if(!Hi) break;
      let step = 0;
      for(let j=0;j<p;j++){ let d = 0; for(let k=0;k<p;k++) d += Hi[j][k]*g[k]; d = U.clamp(d, -4, 4); b[j] += d; step = Math.max(step, Math.abs(d)); }
      if(step<1e-8){ conv = true; break; }
    }
    const cov = inv(hess().H);
    const se = b.map((_,j)=>cov ? Math.sqrt(Math.max(cov[j][j], 0)) : NaN);
    const predict = x => { let eta = b[0]; for(let j=1;j<p;j++) eta += b[j]*x[j-1]; return sig(eta); };
    const coef = b.map((v,j)=>{ const z = se[j]>0 ? v/se[j] : 0;
      return {b:v, se:se[j], or:Math.exp(v), lo:Math.exp(v-1.96*se[j]), hi:Math.exp(v+1.96*se[j]), p:2*(1-ML.normCdf(Math.abs(z)))}; });
    return {b, se, coef, conv, iter:it, predict};
  };

  /* ---------- Decision tree (CART · Gini) สำหรับตัวแปรสองค่า ---------- */
  const gini = (pos, n) => { if(!n) return 0; const q = pos/n; return 2*q*(1-q); };
  ML.tree = function(X, y, o={}){
    const maxD = o.depth==null ? 3 : o.depth, minLeaf = o.minLeaf==null ? 3 : o.minLeaf, p = (X[0]||[]).length, N = y.length;
    const imp = new Array(p).fill(0);
    function grow(idx, d){
      const n = idx.length, pos = idx.reduce((a,i)=>a+y[i],0), node = {n, pos, prob: n ? pos/n : 0, depth:d};
      if(d>=maxD || pos===0 || pos===n || n<2*minLeaf) return node;
      const g0 = gini(pos,n); let best = null;
      for(let f=0; f<p; f++){
        let n1 = 0, p1 = 0; for(const i of idx) if(X[i][f]){ n1++; p1 += y[i]; }
        const n0 = n-n1, p0 = pos-p1; if(n1<minLeaf || n0<minLeaf) continue;
        const gain = g0 - (n1/n)*gini(p1,n1) - (n0/n)*gini(p0,n0);
        if(gain>1e-9 && (!best || gain>best.gain+1e-12)) best = {f, gain};
      }
      if(!best) return node;
      node.f = best.f; node.gain = best.gain; imp[best.f] += best.gain*n/N;
      node.yes = grow(idx.filter(i=>X[i][best.f]), d+1);
      node.no  = grow(idx.filter(i=>!X[i][best.f]), d+1);
      return node;
    }
    const root = grow(y.map((_,i)=>i), 0), tot = imp.reduce((a,b)=>a+b,0) || 1;
    const predict = x => { let nd = root; while(nd.f!=null) nd = x[nd.f] ? nd.yes : nd.no; return nd.prob; };
    const leaves = (nd=root) => nd.f==null ? 1 : leaves(nd.yes) + leaves(nd.no);
    return {root, imp:imp.map(v=>v/tot), predict, leaves:leaves()};
  };

  /* ---------- การประเมินโมเดล ---------- */
  /* แบ่ง k ส่วนแบบรักษาสัดส่วนป่วย/ไม่ป่วย (stratified) — กำหนด seed ให้ผลเหมือนเดิมทุกครั้งที่วาดหน้าจอ */
  ML.folds = function(y, k, seed){
    const r = ML.rng(seed), f = new Array(y.length);
    const pos = ML.shuffle(y.map((v,i)=>v?i:-1).filter(i=>i>=0), r), neg = ML.shuffle(y.map((v,i)=>v?-1:i).filter(i=>i>=0), r);
    pos.concat(neg).forEach((i,j)=>{ f[i] = j%k; });
    return f;
  };
  /* ทำนายแบบ cross-validation: ทุกแถวถูกทำนายโดยโมเดลที่ไม่เคยเห็นแถวนั้นตอนฝึก */
  ML.cvPredict = function(X, y, k, seed, fit){
    const f = ML.folds(y, k, seed), out = new Array(y.length).fill(NaN);
    for(let i=0;i<k;i++){
      const tr = [], te = [];
      f.forEach((g,j)=>(g===i ? te : tr).push(j));
      if(!te.length || !tr.length) continue;
      const m = fit(tr.map(j=>X[j]), tr.map(j=>y[j]));
      te.forEach(j=>{ out[j] = m.predict(X[j]); });
    }
    return out;
  };
  ML.confusion = function(y, prob, thr=.5){
    let tp=0, fp=0, tn=0, fn=0;
    y.forEach((v,i)=>{ if(isNaN(prob[i])) return; const h = prob[i]>=thr; if(v&&h)tp++; else if(v)fn++; else if(h)fp++; else tn++; });
    const n = tp+fp+tn+fn || 1;
    return {tp, fp, tn, fn, acc:(tp+tn)/n, sens: tp+fn ? tp/(tp+fn) : NaN, spec: tn+fp ? tn/(tn+fp) : NaN, ppv: tp+fp ? tp/(tp+fp) : NaN};
  };
  /* AUC = ความน่าจะเป็นที่ผู้ป่วยสุ่มหนึ่งรายได้คะแนนสูงกว่าคนไม่ป่วยสุ่มหนึ่งคน (Mann–Whitney · จัดการค่าเท่ากัน) */
  ML.auc = function(y, s){
    const all = s.map((v,i)=>({v, y:y[i]})).filter(d=>!isNaN(d.v)).sort((a,b)=>a.v-b.v);
    const nP = all.filter(d=>d.y).length, nN = all.length-nP; if(!nP || !nN) return NaN;
    let rs = 0;
    for(let i=0;i<all.length;){ let j = i; while(j+1<all.length && all[j+1].v===all[i].v) j++; const rk = (i+j)/2+1; for(let k=i;k<=j;k++) if(all[k].y) rs += rk; i = j+1; }
    return (rs - nP*(nP+1)/2)/(nP*nN);
  };
  ML.roc = function(y, s){
    const all = s.map((v,i)=>({v, y:y[i]})).filter(d=>!isNaN(d.v)).sort((a,b)=>b.v-a.v);
    const nP = all.filter(d=>d.y).length || 1, nN = (all.length - all.filter(d=>d.y).length) || 1;
    const pts = [[0,0]]; let tp = 0, fp = 0;
    for(let i=0;i<all.length;){ let j = i; while(j<all.length && all[j].v===all[i].v){ all[j].y ? tp++ : fp++; j++; } pts.push([fp/nN, tp/nP]); i = j; }
    return pts;
  };

  /* ---------- ข้อความภาษาไทย: ตัดคำ + Naive Bayes ----------
     ภาษาไทยไม่เว้นวรรคระหว่างคำ จึงใช้ Intl.Segmenter (พจนานุกรมของเบราว์เซอร์) ถ้าไม่มีให้ใช้ตัวอักษรสองตัวติดกัน (bigram) แทน */
  const SEG = (()=>{ try{ return (typeof Intl!=='undefined' && Intl.Segmenter) ? new Intl.Segmenter('th', {granularity:'word'}) : null; }catch(e){ return null; } })();
  ML.hasSegmenter = !!SEG;
  const STOP = new Set(['ที่','และ','ก็','ไป','มา','ได้','จะ','มี','เป็น','ของ','ให้','กับ','แล้ว','นะ','ค่ะ','ครับ','คะ','จ้า','จ้ะ','อยู่','ว่า','กัน','นี้','ใน','เลย','ๆ','คือ','แต่','หรือ','ด้วย','จาก','ยัง','เขา','เรา','นั้น','อีก','บ้าง','ทุก','ทั้ง','เมื่อ','ไหม','จริง','เอง','ตอน','แบบ','ช่วง','คน']);
  ML.tokens = function(text){
    const t = String(text).toLowerCase().replace(/[0-9๐-๙]+/g,' ').replace(/[!-\/:-@\[-`{-~“”‘’…•·]+/g,' ');
    let out;
    if(SEG) out = Array.from(SEG.segment(t)).filter(s=>s.isWordLike).map(s=>s.segment.trim());
    else { out = []; for(const chunk of t.split(/\s+/)){ const c = Array.from(chunk.replace(/[^฀-๿a-z]/g,'')); for(let i=0;i<c.length-1;i++) out.push(c[i]+c[i+1]); } }
    return out.filter(w=>w && !STOP.has(w) && /[ก-ฮa-z]/.test(w));
  };
  /* Multinomial Naive Bayes + Laplace smoothing */
  ML.nbTrain = function(docs, labels, classes){
    const cnt = {}, tot = {}, prior = {}, vocab = new Set();
    classes.forEach(c=>{ cnt[c] = {}; tot[c] = 0; prior[c] = 0; });
    docs.forEach((d,i)=>{ const c = labels[i]; if(!(c in cnt)) return; prior[c]++; for(const w of ML.tokens(d)){ cnt[c][w] = (cnt[c][w]||0)+1; tot[c]++; vocab.add(w); } });
    const V = vocab.size || 1, nDocs = labels.filter(l=>l in cnt).length || 1;
    const lp = (w,c) => Math.log(((cnt[c][w]||0)+1)/(tot[c]+V));
    const logPrior = c => Math.log((prior[c]+1)/(nDocs+classes.length));
    const predict = text => {
      const ws = ML.tokens(text).filter(w=>vocab.has(w));
      const sc = classes.map(c=>logPrior(c) + ws.reduce((a,w)=>a+lp(w,c),0)), mx = Math.max(...sc);
      const ex = sc.map(v=>Math.exp(v-mx)), z = ex.reduce((a,b)=>a+b,0);
      const probs = Object.fromEntries(classes.map((c,i)=>[c, ex[i]/z]));
      const best = classes[sc.indexOf(mx)];
      return {c:best, p:probs[best], probs, known:ws.length};
    };
    /* คำที่โมเดลใช้แยกแต่ละกลุ่มมากที่สุด (อธิบายโมเดลได้) */
    const topWords = (c, k=6) => [...vocab].filter(w=>cnt[c][w]).map(w=>({w, s: lp(w,c) - Math.max(...classes.filter(x=>x!==c).map(x=>lp(w,x)))}))
      .sort((a,b)=>b.s-a.s).slice(0,k);
    return {predict, topWords, vocab:V};
  };

  /* ---------- ข้อมูลเชิงพื้นที่ ---------- */
  ML.dbscan = function(pts, eps, minPts){
    const n = pts.length, lab = new Array(n).fill(undefined), e2 = eps*eps;
    const region = i => { const out = []; for(let j=0;j<n;j++){ const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y; if(dx*dx+dy*dy<=e2) out.push(j); } return out; };
    let C = 0;
    for(let i=0;i<n;i++){
      if(lab[i]!==undefined) continue;
      const nb = region(i);
      if(nb.length<minPts){ lab[i] = -1; continue; }
      lab[i] = ++C;
      const seeds = nb.filter(j=>j!==i);
      while(seeds.length){
        const j = seeds.pop();
        if(lab[j]===-1) lab[j] = C;
        if(lab[j]!==undefined) continue;
        lab[j] = C;
        const nb2 = region(j); if(nb2.length>=minPts) for(const q of nb2) if(lab[q]===undefined || lab[q]===-1) seeds.push(q);
      }
    }
    return {labels:lab, k:C};
  };
  /* เปลือกนูน (monotone chain) ใช้วาดขอบกลุ่มผู้ป่วย */
  ML.hull = function(pts){
    const P = pts.slice().sort((a,b)=>a.x-b.x || a.y-b.y); if(P.length<3) return P;
    const cross = (o,a,b) => (a.x-o.x)*(b.y-o.y) - (a.y-o.y)*(b.x-o.x), lo = [], up = [];
    for(const p of P){ while(lo.length>=2 && cross(lo[lo.length-2], lo[lo.length-1], p)<=0) lo.pop(); lo.push(p); }
    for(let i=P.length-1;i>=0;i--){ const p = P[i]; while(up.length>=2 && cross(up[up.length-2], up[up.length-1], p)<=0) up.pop(); up.push(p); }
    return lo.slice(0,-1).concat(up.slice(0,-1));
  };
  /* ความหนาแน่นแบบเคอร์เนล (Gaussian) บนกริด */
  ML.kde = function(pts, w, h, cell, bw){
    const cols = Math.ceil(w/cell), rows = Math.ceil(h/cell), v = new Float64Array(cols*rows), R = Math.ceil(3*bw/cell), k = 1/(2*bw*bw);
    for(const p of pts){
      const ci = Math.floor(p.x/cell), ri = Math.floor(p.y/cell);
      for(let r=Math.max(0,ri-R); r<=Math.min(rows-1,ri+R); r++) for(let c=Math.max(0,ci-R); c<=Math.min(cols-1,ci+R); c++){
        const dx = (c+.5)*cell-p.x, dy = (r+.5)*cell-p.y; v[r*cols+c] += Math.exp(-(dx*dx+dy*dy)*k);
      }
    }
    return {cols, rows, cell, v};
  };

  /* ---------- การพยากรณ์ผู้ป่วยรายใหม่ ๒๔ ชม. ข้างหน้า ---------- */
  ML.forecast = function(series){
    const s = series.filter(v=>v!=null), n = s.length, last = n ? s[n-1] : 0;
    const ma = n ? ML.mean(s.slice(-3)) : 0;
    let trend = last, growth = 0;
    const m = Math.min(4, n);
    if(m>=2){
      // เส้นตรงบน log(จำนวน+1) · จำกัดอัตราการเติบโตไม่เกินเท่าตัวต่อวัน กันการลากเส้นพุ่งเกินจริงจากข้อมูลไม่กี่วัน
      const ys = s.slice(-m).map(v=>Math.log(v+1)), xs = ys.map((_,i)=>i), mx = ML.mean(xs), my = ML.mean(ys);
      let sxy = 0, sxx = 0; xs.forEach((x,i)=>{ sxy += (x-mx)*(ys[i]-my); sxx += (x-mx)*(x-mx); });
      growth = U.clamp(sxx ? sxy/sxx : 0, -Math.LN2, Math.LN2);
      trend = Math.max(0, Math.exp(my + growth*(m-mx)) - 1);
    }
    return {naive:last, ma, trend, growth, dbl: growth>0.01 ? Math.log(2)/growth : null, half: growth<-0.01 ? Math.log(2)/-growth : null};
  };

  /* ---------- ระบบเตือนภัยการระบาดจากข้อมูลรายสัปดาห์ (บทที่ ๑) ----------
     ข้อมูลรง.๕๐๖ ระดับอำเภอ ๕ ปี — ฤดูกาล + สัญญาณรบกวน + การระบาดที่เคยสอบสวนแล้ว (ใช้เป็น "เฉลย" ประเมินอัลกอริทึม) */
  const WK = 52, YEARS = 5, EVAL_FROM = 2*WK;
  ML.SURV = {WK, YEARS, EVAL_FROM, FA_MAX:3};
  ML.ALARM = {
    median:{label:'ค่ามัธยฐานย้อนหลัง × k', short:'มัธยฐาน', par:'k', min:1, max:2.6, step:.1, def:1.8,
      how:'เตือนเมื่อจำนวนผู้ป่วยเกิน k เท่าของค่ามัธยฐาน (สัปดาห์เดียวกัน ±๒ สัปดาห์ ในปีก่อนหน้า) — คล้ายเกณฑ์ที่ใช้ในระบบเฝ้าระวังของไทย'},
    ears:  {label:'EARS C2 (ค่าเฉลี่ยเคลื่อนที่ + k·SD)', short:'EARS C2', par:'k', min:1, max:4, step:.1, def:3,
      how:'เตือนเมื่อเกินค่าเฉลี่ย + k เท่าของส่วนเบี่ยงเบนมาตรฐานของ ๗ สัปดาห์ก่อนหน้า (เว้น ๒ สัปดาห์ล่าสุดไว้ไม่ให้การระบาดปนกับค่าฐาน) — พัฒนาโดย US CDC'},
    cusum: {label:'CUSUM (ผลรวมสะสม)', short:'CUSUM', par:'h', min:.5, max:6, step:.1, def:4,
      how:'สะสมส่วนที่เกินค่าฐานทีละสัปดาห์ (หักค่าอ้างอิง ๐.๕ SD) เตือนเมื่อผลรวมสะสมเกิน h — จับการเพิ่มขึ้นเล็ก ๆ ต่อเนื่องได้ดีกว่า แต่ช้ากว่าเล็กน้อย'},
  };
  ML.survSeries = function(seed){
    const gen = s => {
      const r = ML.rng(s), mu = [], x = [];
      for(let t=0;t<YEARS*WK;t++){ const w = t%WK;
        mu.push(Math.max(1.5, 9 + 3.2*Math.cos(2*Math.PI*(w-5)/WK) + 1.6*Math.cos(4*Math.PI*(w-27)/WK) + .006*t)); }
      for(let t=0;t<mu.length;t++) x.push(ML.poisson(mu[t]*Math.exp(.12*ML.gauss(r)), r));
      // การระบาดที่สอบสวนแล้ว: ๑ ครั้งในปีที่ ๒ (ทำให้ค่าฐานปนเปื้อน) + ๔ ครั้งใน ๓ ปีหลัง (ขนาดต่างกัน มีครั้งหนึ่งเล็กมาก)
      const ob = [], sizes = [26, 18, 13, 8], prof = [[.55,1,.45],[.5,1,.6,.3],[1,.6],[.7,1,.35]];
      const take = (lo, hi) => { for(let k=0;k<80;k++){ const st = lo + Math.floor(r()*(hi-lo)); if(ob.every(o=>Math.abs(o.s-st)>14)) return st; } return null; };
      const e0 = take(WK+6, 2*WK-8); if(e0!=null){ [.6,1,.5].forEach((f,i)=>{ x[e0+i] += Math.round(22*f); }); }
      for(const [i,sz] of ML.shuffle(sizes,r).entries()){
        const st = take(EVAL_FROM+10, YEARS*WK-6); if(st==null) continue;
        const pr = prof[i%prof.length]; pr.forEach((f,j)=>{ x[st+j] += Math.round(sz*f*(.85+.3*r())); });
        ob.push({s:st, e:st+pr.length-1, size:sz});
      }
      ob.sort((a,b)=>a.s-b.s);
      return {x, mu, ob, past: e0};
    };
    // เลือกชุดข้อมูลที่ทำให้ "มีทางตั้งค่าได้ตามเป้า" แต่ค่าเริ่มต้นยังไม่ผ่าน
    let best = null;
    for(let k=0;k<40;k++){
      const d = gen((seed + k*7919)>>>0);
      if(d.ob.length<4) continue;
      const okAny = Object.keys(ML.ALARM).some(m=>ML.sweep(d, m).some(pt=>pt.det===d.ob.length && pt.fa<=ML.SURV.FA_MAX));
      const defPass = Object.keys(ML.ALARM).some(m=>{ const e = ML.evalAlarms(ML.alarms(d.x, m, ML.ALARM[m].def), d.ob); return e.det===d.ob.length && e.fa<=ML.SURV.FA_MAX; });
      if(okAny && !defPass){ best = d; break; }
      if(okAny && !best) best = d;
    }
    return best || gen(seed);
  };
  ML.alarms = function(x, method, k){
    const out = []; let cs = 0;
    for(let t=EVAL_FROM; t<x.length; t++){
      let thr = null, alarm = false, stat = null;
      if(method==='median'){
        const v = []; for(let y=1;y<=YEARS;y++) for(let d=-2; d<=2; d++){ const s = t-WK*y+d; if(s>=0) v.push(x[s]); }
        thr = k*U.median(v); alarm = x[t]>thr;
      } else {
        const base = x.slice(Math.max(0,t-9), t-2), m = ML.mean(base), sd = Math.max(1, ML.sd(base));
        if(method==='ears'){ thr = m + k*sd; alarm = x[t]>thr; }
        else { cs = Math.max(0, cs + (x[t]-m)/sd - .5); stat = cs; alarm = cs>k; if(alarm) cs = 0; }
      }
      out.push({t, thr, alarm, stat});
    }
    return out;
  };
  ML.evalAlarms = function(res, ob){
    const al = res.filter(r=>r.alarm).map(r=>r.t);
    const det = ob.map(o=>{ const a = al.find(t=>t>=o.s && t<=o.e+1); return a==null ? null : a-o.s; });
    const inOb = t => ob.some(o=>t>=o.s-1 && t<=o.e+2);
    const fa = al.filter(t=>!inOb(t)).length, hit = det.filter(d=>d!=null);
    return {det:hit.length, n:ob.length, fa, delay: hit.length ? ML.mean(hit) : null, perOb:det, alarms:al.length, ppv: al.length ? (al.length-fa)/al.length : null};
  };
  ML.sweep = function(d, method){
    const A = ML.ALARM[method], out = [];
    for(let j=0; ; j++){ const v = +(A.min + j*A.step*2).toFixed(2); if(v>A.max+1e-9) break;
      const e = ML.evalAlarms(ML.alarms(d.x, method, v), d.ob); out.push({v, det:e.det, fa:e.fa}); }
    return out;
  };

  return ML;
})();
