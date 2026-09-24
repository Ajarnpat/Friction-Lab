
(() => {
  'use strict';

  // Student-facing values are intentionally hidden. Full parameters are documented in SETUP_PARAMETERS.md.
  const G = 9.81;
  const BASE_MASS_G = 200;
  const DISK_MASS_G = 100;
  const MAX_DISKS = 7;

  const SURFACES = {
    rubber_tarmac: {label:'Rubber on tarmac', block:'rubber', ground:'tarmac', muS:0.95, muK:0.72},
    rubber_glass:  {label:'Rubber on glass',  block:'rubber', ground:'glass',  muS:0.87, muK:0.63},
    iron_glass:    {label:'Iron on glass',    block:'iron',   ground:'glass',  muS:0.22, muK:0.16}
  };

  // Every measurement uses a fresh independent random variation within ±7.5%.
  // No result is reused across repeats, masses, surfaces, or contact-area settings.

  let lab = 1;
  let disks = 0;
  let area = 'large';
  let running = false;
  let currentForce = 0;
  let peakForce = 0;
  let averageForce = null;
  let averageSum = 0;
  let averageCount = 0;
  let showPeak = false;
  let showAverage = false;
  let raf = null;

  const el = id => document.getElementById(id);
  const tab1=el('tab1'), tab2=el('tab2'), tab3=el('tab3'), instructions=el('instructions'), surfaceSelect=el('surfaceSelect');
  const areaLarge=el('areaLarge'), areaSmall=el('areaSmall'), addMass=el('addMass'), removeMass=el('removeMass');
  const massValue=el('massValue'), startBtn=el('startBtn'), resetBtn=el('resetBtn'), status=el('status'), surfaceStrip=el('surfaceStrip');
  const rig=el('rig'), block=el('block'), massStack=el('massStack'), probeScreen=el('probeScreen'), probeBtn=el('probeBtn');
  const hand=document.querySelector('.hand'), stringline=document.querySelector('.stringline');
  const probeLabel=el('probeLabel'), probeHint=el('probeHint'), velocityTag=el('velocityTag'), labTitle=el('labTitle');

  const instructionsText = {
    1: `<strong>Instructions:</strong> Choose a surface pair and contact area. Add or remove 100 g mass disks as required. Press <strong>Start</strong> and take three repeats for each data point. During a run, use <strong>MAX FORCE</strong> on the electronic force probe when required. Record your measurements and plot an appropriate graph. Use your graph to describe the relationship you observe. This is a realistic simulation and includes random experimental uncertainty.`,
    2: `<strong>Instructions:</strong> Choose a surface pair and contact area. Add or remove 100 g mass disks as required. Press <strong>Start</strong> and take three repeats for each data point. After the block reaches constant velocity, use <strong>SHOW AVERAGE</strong> on the electronic force probe and record the reading. Plot an appropriate graph and use it to describe the relationship you observe. This is a realistic simulation and includes random experimental uncertainty.`
  };

  function totalMassG(){ return BASE_MASS_G + disks*DISK_MASS_G; }
  function random01(){
    if(window.crypto && window.crypto.getRandomValues){
      const a=new Uint32Array(1);
      window.crypto.getRandomValues(a);
      return a[0]/4294967295;
    }
    return Math.random();
  }
  function measurementFactor(){
    return 0.925 + 0.15*random01();
  }

  function renderMasses(){
    massStack.innerHTML='';
    for(let i=0;i<disks;i++){
      const d=document.createElement('div'); d.className='disk'; massStack.appendChild(d);
    }
    massValue.textContent=`${totalMassG()} g`;
    removeMass.disabled=running || disks===0;
    addMass.disabled=running || disks===MAX_DISKS;
  }

  function renderSurface(){
    const s=SURFACES[surfaceSelect.value];
    surfaceStrip.className=`surface-strip surface-${s.ground}`;
    block.className=`block ${area} ${s.block}`;
    block.textContent=s.block.toUpperCase();
  }

  function resetRig(){
    if(raf) cancelAnimationFrame(raf);
    raf=null; running=false; currentForce=0; peakForce=0; averageForce=null; averageSum=0; averageCount=0; showPeak=false; showAverage=false;
    rig.style.transform='translateX(0px)'; hand.style.transform=''; probe.style.transform=''; stringline.style.transform=''; velocityTag.classList.remove('show');
    surfaceSelect.disabled=false; areaLarge.disabled=false; areaSmall.disabled=false;
    startBtn.disabled=false; startBtn.textContent='Start';
    renderMasses();
    configureProbe();
    updateProbeDisplay();
  }

  function configureProbe(){
    if(lab===1){
      probeBtn.innerHTML='MAX<br>FORCE'; probeBtn.disabled=false; probeLabel.textContent=showPeak?'Maximum force':'Force';
      probeHint.innerHTML='Press <strong>MAX FORCE</strong> to view the maximum recorded force.';
    } else {
      probeBtn.innerHTML='SHOW<br>AVERAGE'; probeBtn.disabled=true; probeLabel.textContent=showAverage?'Average force':'Force';
      probeHint.innerHTML='After the block is moving steadily, press <strong>SHOW AVERAGE</strong> to view the average force.';
    }
  }

  function updateProbeDisplay(){
    if(lab===1){
      probeScreen.classList.remove('hidden-reading');
      probeScreen.textContent=`${(showPeak?peakForce:currentForce).toFixed(2)} N`;
      probeLabel.textContent=showPeak?'Maximum force':'Force';
    } else {
      probeScreen.classList.remove('hidden-reading');
      if(showAverage && averageForce!==null){
        probeScreen.textContent=`${averageForce.toFixed(2)} N`;
        probeLabel.textContent='Average force';
      } else {
        probeScreen.textContent=`${currentForce.toFixed(2)} N`;
        probeLabel.textContent='Force';
      }
    }
  }

  function setLab(n){
    lab=n; resetRig();
    el('labMain').classList.remove('hidden'); el('analysisPage').classList.remove('active'); instructions.classList.remove('hidden');
    tab1.classList.toggle('active',n===1); tab2.classList.toggle('active',n===2);
    tab1.setAttribute('aria-selected',n===1); tab2.setAttribute('aria-selected',n===2); tab3.classList.remove('active'); tab3.setAttribute('aria-selected','false');
    labTitle.textContent=n===1?'Lab 1 · Static Friction':'Lab 2 · Kinetic Friction';
    instructions.innerHTML=instructionsText[n];
    status.textContent='Ready.';
    configureProbe(); updateProbeDisplay();
  }

  function setArea(a){
    if(running) return;
    area=a; areaLarge.classList.toggle('active',a==='large'); areaSmall.classList.toggle('active',a==='small'); renderSurface();
  }

  function easeInOut(t){ return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }

  function runLab(){
    if(running) return;
    running=true; startBtn.disabled=true; surfaceSelect.disabled=true; areaLarge.disabled=true; areaSmall.disabled=true; addMass.disabled=true; removeMass.disabled=true;
    showPeak=false; showAverage=false; currentForce=0; peakForce=0; averageForce=null; averageSum=0; averageCount=0; velocityTag.classList.remove('show');
    configureProbe(); updateProbeDisplay();

    const s=SURFACES[surfaceSelect.value];
    const N=(totalMassG()/1000)*G;
    const maxStatic=s.muS*N*measurementFactor();
    const kinetic=s.muK*N*measurementFactor();
    if(lab===2) averageForce=kinetic;
    const t0=performance.now();
    const staticRamp=3600;
    const release=650;
    const kineticTravel=3300;
    const travelPx=Math.min(260, Math.max(120, window.innerWidth*0.15));
    status.textContent=lab===1?'Pulling gently…':'Pulling gently…';

    function frame(now){
      const t=now-t0;
      if(t<=staticRamp){
        const p=t/staticRamp;
        currentForce=maxStatic*easeInOut(p);
        peakForce=Math.max(peakForce,currentForce);
        const pullShift=10*easeInOut(p);
        hand.style.transform=`translateX(${pullShift}px)`;
        probe.style.transform=`translateX(${pullShift}px)`;
        stringline.style.transform=`scaleX(${1+0.05*easeInOut(p)})`; 
        updateProbeDisplay();
        raf=requestAnimationFrame(frame); return;
      }

      if(lab===1){
        const p=Math.min(1,(t-staticRamp)/release);
        currentForce=maxStatic + (kinetic-maxStatic)*p;
        peakForce=Math.max(peakForce,maxStatic);
        rig.style.transform=`translateX(${12*easeInOut(p)}px)`;
        updateProbeDisplay();
        if(p<1){ raf=requestAnimationFrame(frame); return; }
        currentForce=kinetic; updateProbeDisplay();
        status.textContent='Run complete. The block has started moving.';
        running=false; startBtn.disabled=false; surfaceSelect.disabled=false; areaLarge.disabled=false; areaSmall.disabled=false; renderMasses();
        return;
      }

      const after=t-staticRamp;
      if(after<=release){
        const p=after/release;
        currentForce=maxStatic + (kinetic-maxStatic)*p;
        peakForce=Math.max(peakForce,maxStatic);
        rig.style.transform=`translateX(${12*easeInOut(p)}px)`;
        updateProbeDisplay();
        status.textContent='The block is beginning to move…';
        raf=requestAnimationFrame(frame); return;
      }

      const travelT=after-release;
      const p=Math.min(1,travelT/kineticTravel);
      // Small live variation in the force-probe reading during steady sliding.
      const jitter = 1 + 0.018*Math.sin(travelT/95) + 0.008*Math.sin(travelT/37);
      currentForce=kinetic*jitter;
      rig.style.transform=`translateX(${12+travelPx*p}px)`;
      if(p>0.12){
        velocityTag.classList.add('show');
        probeBtn.disabled=false;
        status.textContent='Constant velocity reached. Average force is available.';
      }
      updateProbeDisplay();
      if(p<1){ raf=requestAnimationFrame(frame); return; }
      status.textContent='Run complete. Average force remains available.';
      running=false; startBtn.disabled=false; surfaceSelect.disabled=false; areaLarge.disabled=false; areaSmall.disabled=false; renderMasses();
    }
    raf=requestAnimationFrame(frame);
  }

  // ---------- Data analysis ----------
  const ROW_COUNT=8;
  const STORAGE_KEY='frictionLabDataV1';
  const COLORS={
    static_rubber_tarmac:'#1f77b4', static_rubber_glass:'#2ca02c', static_iron_glass:'#9467bd',
    kinetic_rubber_tarmac:'#d62728', kinetic_rubber_glass:'#ff7f0e', kinetic_iron_glass:'#8c564b'
  };
  let datasets={}; let compareMode=false;
  try{ datasets=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{}; }catch(e){ datasets={}; }
  function dsKey(){ return `${el('analysisType').value}_${el('analysisSurface').value}`; }
  function getDataset(key=dsKey()){
    if(!datasets[key]) datasets[key]=Array.from({length:ROW_COUNT},()=>({m:'',f1:'',f2:'',f3:''}));
    return datasets[key];
  }
  function saveData(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(datasets)); }
  function fmt(v){ return Number.isFinite(v)?v.toFixed(2):'—'; }
  function meanRow(r){
    const vals=[r.f1,r.f2,r.f3]
      .filter(v=>String(v).trim()!=='')
      .map(Number)
      .filter(Number.isFinite);
    return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:NaN;
  }
  function renderTable(){
    compareMode=false;
    const type=el('analysisType').value;
    el('frictionGroupHead').textContent=type==='static'?'Maximum static friction / N':'Kinetic friction / N';
    const body=el('dataBody'); body.innerHTML='';
    getDataset().forEach((r,i)=>{
      const tr=document.createElement('tr');
      const m=Number(r.m), N=Number.isFinite(m)&&m>0?(m/1000)*G:NaN;
      tr.innerHTML=`<td><input inputmode="decimal" aria-label="mass row ${i+1}" data-row="${i}" data-field="m" value="${r.m}"></td><td class="calc">${fmt(N)}</td>`+
        ['f1','f2','f3'].map(k=>`<td><input inputmode="decimal" aria-label="${k} for ${r.m} g" data-row="${i}" data-field="${k}" value="${r[k]}"></td>`).join('')+
        `<td class="calc">${fmt(meanRow(r))}</td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',e=>{
      const r=getDataset()[+e.target.dataset.row];
      let v=e.target.value.replace(',','.').replace(/[^0-9.\-]/g,''); e.target.value=v; r[e.target.dataset.field]=v; saveData(); renderCalculatedCells(+e.target.dataset.row); drawSingle();
    }));
    drawSingle();
  }
  function renderCalculatedCells(i){ const row=el('dataBody').children[i], r=getDataset()[i], m=Number(r.m); const N=Number.isFinite(m)&&m>0?(m/1000)*G:NaN; row.children[1].textContent=fmt(N); row.lastElementChild.textContent=fmt(meanRow(r)); }
  function regression(points){
    if(points.length<2) return null;
    const n=points.length, sx=points.reduce((a,p)=>a+p[0],0), sy=points.reduce((a,p)=>a+p[1],0);
    const sxx=points.reduce((a,p)=>a+p[0]*p[0],0), sxy=points.reduce((a,p)=>a+p[0]*p[1],0);
    const den=n*sxx-sx*sx; if(Math.abs(den)<1e-12) return null;
    const a=(n*sxy-sx*sy)/den, b=(sy-a*sx)/n;
    const ybar=sy/n, ssTot=points.reduce((q,p)=>q+(p[1]-ybar)**2,0), ssRes=points.reduce((q,p)=>q+(p[1]-(a*p[0]+b))**2,0);
    const r2=ssTot>0?1-ssRes/ssTot:1;
    return {a,b,r2};
  }
  function datasetPoints(key=dsKey()){
    return getDataset(key).map(r=>{const m=Number(r.m); return [Number.isFinite(m)&&m>0?(m/1000)*G:NaN,meanRow(r)];}).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
  }
  function esc(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
  function drawAxes(svg,maxX,maxY){
    const W=760,H=500,L=72,R=24,T=26,B=62,pw=W-L-R,ph=H-T-B;
    const ns='http://www.w3.org/2000/svg'; svg.innerHTML='';
    const line=(x1,y1,x2,y2,stroke='#d9e0e5',w=1)=>{const e=document.createElementNS(ns,'line');Object.assign(e,{ });e.setAttribute('x1',x1);e.setAttribute('y1',y1);e.setAttribute('x2',x2);e.setAttribute('y2',y2);e.setAttribute('stroke',stroke);e.setAttribute('stroke-width',w);svg.appendChild(e);};
    const text=(x,y,txt,size=13,anchor='middle')=>{const e=document.createElementNS(ns,'text');e.setAttribute('x',x);e.setAttribute('y',y);e.setAttribute('font-size',size);e.setAttribute('fill','#3f4b55');e.setAttribute('text-anchor',anchor);e.textContent=txt;svg.appendChild(e);};
    for(let i=0;i<=5;i++){const x=L+pw*i/5;line(x,T,x,T+ph);text(x,T+ph+22,(maxX*i/5).toFixed(1));const y=T+ph-ph*i/5;line(L,y,L+pw,y);text(L-10,y+4,(maxY*i/5).toFixed(1),13,'end');}
    line(L,T+ph,L+pw,T+ph,'#4e5962',1.5);line(L,T,L,T+ph,'#4e5962',1.5);
    text(L+pw/2,H-18,'Normal force / N',14);
    const yl=document.createElementNS(ns,'text');yl.setAttribute('x',18);yl.setAttribute('y',T+ph/2);yl.setAttribute('font-size',14);yl.setAttribute('fill','#3f4b55');yl.setAttribute('text-anchor','middle');yl.setAttribute('transform',`rotate(-90 18 ${T+ph/2})`);yl.textContent='Friction force / N';svg.appendChild(yl);
    return {L,T,pw,ph,X:x=>L+(x/maxX)*pw,Y:y=>T+ph-(y/maxY)*ph,ns,line,text};
  }
  function drawSeries(ctx,points,fit,color){
    const {ns}=ctx, svg=el('plot');
    points.forEach(([x,y])=>{const c=document.createElementNS(ns,'circle');c.setAttribute('cx',ctx.X(x));c.setAttribute('cy',ctx.Y(y));c.setAttribute('r',5);c.setAttribute('fill',color);svg.appendChild(c);});
    if(fit){ const x1=0,x2=9; const y1=fit.a*x1+fit.b,y2=fit.a*x2+fit.b; const l=document.createElementNS(ns,'line');l.setAttribute('x1',ctx.X(x1));l.setAttribute('y1',ctx.Y(y1));l.setAttribute('x2',ctx.X(x2));l.setAttribute('y2',ctx.Y(y2));l.setAttribute('stroke',color);l.setAttribute('stroke-width',2.4);svg.appendChild(l); }
  }
  function drawSingle(){
    compareMode=false; const key=dsKey(), pts=datasetPoints(key), fit=regression(pts), type=el('analysisType').value, s=SURFACES[el('analysisSurface').value];
    el('graphTitle').textContent=`${type==='static'?'Static':'Kinetic'} friction · ${s.label}`;
    const maxY=Math.max(2,(pts.length?Math.max(...pts.map(p=>p[1])):0)*1.15); const ctx=drawAxes(el('plot'),9,maxY); drawSeries(ctx,pts,fit,COLORS[key]);
    el('fitBox').textContent=fit?`Best fit: F = ${fit.a.toFixed(3)}N ${fit.b>=0?'+':'−'} ${Math.abs(fit.b).toFixed(3)}   |   R² = ${fit.r2.toFixed(3)}`:'Enter at least two complete data points to calculate a best-fit line.';
    el('legend').innerHTML='';
  }
  function allKeys(){return ['static_rubber_tarmac','static_rubber_glass','static_iron_glass','kinetic_rubber_tarmac','kinetic_rubber_glass','kinetic_iron_glass'];}
  function prettyKey(k){ const [t,...rest]=k.split('_'); return `${t==='static'?'Static':'Kinetic'} · ${SURFACES[rest.join('_')].label}`; }
  function drawAll(){
    compareMode=true; const series=allKeys().map(k=>({k,pts:datasetPoints(k)})).filter(s=>s.pts.length>=1); const allY=series.flatMap(s=>s.pts.map(p=>p[1])); const maxY=Math.max(2,(allY.length?Math.max(...allY):0)*1.15); const ctx=drawAxes(el('plot'),9,maxY);
    el('graphTitle').textContent='Comparison of all six datasets'; let fits=[];
    series.forEach(s=>{const fit=regression(s.pts); drawSeries(ctx,s.pts,fit,COLORS[s.k]); if(fit) fits.push(`${prettyKey(s.k)}: F = ${fit.a.toFixed(3)}N ${fit.b>=0?'+':'−'} ${Math.abs(fit.b).toFixed(3)}`);});
    const completeCount=series.length;
    const summary=completeCount?`Showing ${completeCount} of 6 datasets.`:'Enter data in at least one dataset first.';
    el('fitBox').innerHTML=fits.length?`${esc(summary)}<br>${fits.map(esc).join('<br>')}`:esc(summary);
    el('legend').innerHTML=series.map(s=>`<span style="color:${COLORS[s.k]}"><i></i>${esc(prettyKey(s.k))}</span>`).join('');
  }
  function showAnalysis(){
    if(running) resetRig(); el('labMain').classList.add('hidden'); el('analysisPage').classList.add('active'); instructions.classList.add('hidden');
    tab1.classList.remove('active');tab2.classList.remove('active');tab3.classList.add('active');tab1.setAttribute('aria-selected','false');tab2.setAttribute('aria-selected','false');tab3.setAttribute('aria-selected','true'); renderTable();
  }

  tab1.addEventListener('click',()=>setLab(1));
  tab2.addEventListener('click',()=>setLab(2));
  tab3.addEventListener('click',showAnalysis);
  el('analysisType').addEventListener('change',renderTable);
  el('analysisSurface').addEventListener('change',renderTable);
  el('compareAll').addEventListener('click',drawAll);
  el('clearDataset').addEventListener('click',()=>{datasets[dsKey()]=Array.from({length:ROW_COUNT},()=>({m:'',f1:'',f2:'',f3:''}));saveData();renderTable();});
  surfaceSelect.addEventListener('change',()=>{resetRig();renderSurface();status.textContent='Ready.'});
  areaLarge.addEventListener('click',()=>setArea('large'));
  areaSmall.addEventListener('click',()=>setArea('small'));
  addMass.addEventListener('click',()=>{if(disks<MAX_DISKS){disks++;renderMasses();resetRig();}});
  removeMass.addEventListener('click',()=>{if(disks>0){disks--;renderMasses();resetRig();}});
  startBtn.addEventListener('click',runLab);
  resetBtn.addEventListener('click',()=>{ resetRig(); status.textContent='Ready.'; });
  probeBtn.addEventListener('click',()=>{
    if(lab===1){showPeak=!showPeak; updateProbeDisplay();}
    else if(averageForce!==null){showAverage=!showAverage; updateProbeDisplay(); probeBtn.innerHTML=showAverage?'HIDE<br>AVERAGE':'SHOW<br>AVERAGE';}
  });
  window.addEventListener('resize',()=>{ if(!running) rig.style.transform='translateX(0px)'; });

  instructions.innerHTML=instructionsText[1];
  renderSurface(); renderMasses(); configureProbe(); updateProbeDisplay();
})();
