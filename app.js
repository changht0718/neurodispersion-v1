const DOMAIN_TESTS = {
  "Memory": ["WSLT_IM","WSLT_DEL","BVRT","LM_IM","LM_DEL","FP_IM","FP_DEL"],
  "Executive function": ["CTT_2","mCST_CAT","mCST_PE","ARI","DSS"],
  "Language": ["VNT","TT","SAVF","SIM"],
  "Visuospatial function": ["JLO","3D","MR"],
  "Attention/speed": ["PP_D","PP_ND","PP_B","DS","SS","CTT_1"]
};

const NORM_KEY = {
  WSLT_IM:"WSLT-IM", WSLT_DEL:"WSLT-DEL", BVRT:"BVRT",
  LM_IM:"LM-IM", LM_DEL:"LM-DEL", FP_IM:"FP-IM", FP_DEL:"FP-DEL",
  CTT_2:"CTT-2", mCST_CAT:"mCST-CAT", mCST_PE:"mCST-PE", ARI:"ARI", DSS:"DSS",
  VNT:"VNT", TT:"TT", SAVF:"SAVF", SIM:"SIM",
  JLO:"JLO", "3D":"3D", MR:"MR",
  PP_D:"PP-D", PP_ND:"PP-ND", PP_B:"PP-B", DS:"DS", SS:"SS", CTT_1:"CTT-1"
};

const TEST_LABEL = {
  WSLT_IM:"WSLT-IM", WSLT_DEL:"WSLT-DEL", BVRT:"BVRT",
  LM_IM:"LM-IM", LM_DEL:"LM-DEL", FP_IM:"FP-IM", FP_DEL:"FP-DEL",
  CTT_2:"CTT-2", mCST_CAT:"mCST-CAT", mCST_PE:"mCST-PE", ARI:"ARI", DSS:"DSS",
  VNT:"VNT", TT:"TT", SAVF:"SAVF", SIM:"SIM",
  JLO:"JLO", "3D":"3D", MR:"MR",
  PP_D:"PP-D", PP_ND:"PP-ND", PP_B:"PP-B", DS:"DS", SS:"SS", CTT_1:"CTT-1"
};

const DEMO_RAW = {
  WSLT_IM:57, WSLT_DEL:4, BVRT:9, LM_IM:12, LM_DEL:12, FP_IM:12, FP_DEL:12,
  CTT_2:61, mCST_CAT:6, mCST_PE:1, ARI:11, DSS:11,
  VNT:56, TT:44, SAVF:41, SIM:12,
  JLO:27, "3D":29, MR:12,
  PP_D:15, PP_ND:15, PP_B:12, DS:11, SS:11, CTT_1:31
};

const CFG = window.CURRENT_NORM || {};
const SCALED = new Set(CFG.scaledTests || []);
const LOWER_BETTER = new Set(CFG.lowerBetter || []);
const IMPAIRMENT_P = CFG.roc?.individualImpairmentPercentile ?? 6.6807201269;

function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function mean(a){const x=a.filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null;}
function sd(a){const x=a.filter(Number.isFinite);if(x.length<2)return null;const m=mean(x);return Math.sqrt(x.reduce((s,v)=>s+(v-m)**2,0)/(x.length-1));}
function normalCdf(z){
  const sign=z<0?-1:1; const x=Math.abs(z)/Math.sqrt(2);
  const t=1/(1+0.3275911*x);
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429;
  const erf=sign*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x));
  return .5*(1+erf);
}
function genderCode(){return document.getElementById('sex').value==='F'?2:1;}
function currentDemographics(){
  return {
    age:Number(document.getElementById('age').value),
    education:Number(document.getElementById('education').value),
    gender:genderCode()
  };
}
function adjustedScore(normKey,raw){
  const b=CFG.coefficients?.[normKey];
  if(!b) return Number(raw);
  const ref=CFG.referenceDemographics;
  const d=currentDemographics();
  return Number(raw)
    - b.age*(d.age-ref.age)
    - b.education*(d.education-ref.education)
    - b.gender*(d.gender-ref.gender);
}
function empiricalPercentile(normKey,adjusted){
  const arr=CFG.ncAdjustedDistributions?.[normKey] || [];
  if(!arr.length || !Number.isFinite(adjusted)) return null;
  let lt=0,eq=0;
  for(const v of arr){if(v<adjusted)lt++; else if(Math.abs(v-adjusted)<1e-8)eq++;}
  let p=100*(lt+0.5*eq)/arr.length;
  if(LOWER_BETTER.has(normKey)) p=100-p;
  return clamp(p,0.13,99.87);
}
function convertPercentile(test,raw){
  if(raw===''||raw==null||Number.isNaN(Number(raw))) return null;
  const nk=NORM_KEY[test];
  if(SCALED.has(nk)){
    const x=Number(raw);
    if(x<1||x>19)return null;
    return clamp(100*normalCdf((x-10)/3),0.13,99.87);
  }
  return empiricalPercentile(nk,adjustedScore(nk,raw));
}

function buildInputs(){
  const root=document.getElementById('testInputs');root.innerHTML='';
  Object.entries(DOMAIN_TESTS).forEach(([domain,tests])=>{
    const h=document.createElement('div');h.className='test-domain';h.textContent=domain;root.appendChild(h);
    tests.forEach(test=>{
      const nk=NORM_KEY[test], scaled=SCALED.has(nk);
      const row=document.createElement('div');row.className='test-row';
      row.innerHTML=`<span>${TEST_LABEL[test]}${scaled?' <small class="score-type">SS</small>':''}</span>
        <input id="raw_${test}" type="number" step="${scaled?'1':'0.01'}" ${scaled?'min="1" max="19"':''}
          placeholder="${scaled?'scaled 1–19':'raw'}">
        <span id="pct_${test}" class="pct">—</span>`;
      root.appendChild(row);
      row.querySelector('input').addEventListener('input',()=>run());
    });
  });
}
function updatePercentile(test){
  const raw=document.getElementById(`raw_${test}`).value;
  const p=convertPercentile(test,raw);
  const el=document.getElementById(`pct_${test}`);
  el.textContent=p==null?'—':`P${p.toFixed(p<10?1:0)}`;
  el.classList.toggle('impaired',Number.isFinite(p)&&p<=IMPAIRMENT_P);
  el.title=Number.isFinite(p)&&p<=IMPAIRMENT_P?'≤ −1.5 SD (P6.68)':'';
  return p;
}
function collect(){
  const percentiles={},raw={},adjusted={};
  Object.values(DOMAIN_TESTS).flat().forEach(t=>{
    const el=document.getElementById(`raw_${t}`);
    raw[t]=el.value===''?null:Number(el.value);
    percentiles[t]=updatePercentile(t);
    const nk=NORM_KEY[t];
    adjusted[t]=raw[t]==null?null:(SCALED.has(nk)?raw[t]:adjustedScore(nk,raw[t]));
  });
  const domains={};
  Object.entries(DOMAIN_TESTS).forEach(([d,tests])=>{
    const vals=tests.map(t=>percentiles[t]).filter(Number.isFinite);
    const complete=vals.length===tests.length;
    const dispersion=sd(vals);
    const cutoff=CFG.dispersionReference?.[d]?.high ?? null;
    domains[d]={mean:mean(vals),dispersion,values:vals,n:vals.length,complete,cutoff,highDispersion:complete&&Number.isFinite(dispersion)&&dispersion>cutoff};
  });
  const allTests=Object.values(DOMAIN_TESTS).flat();
  const impaired=allTests.filter(t=>Number.isFinite(percentiles[t])&&percentiles[t]<=IMPAIRMENT_P);
  const memoryTests=DOMAIN_TESTS["Memory"];
  const memoryImpaired=memoryTests.filter(t=>Number.isFinite(percentiles[t])&&percentiles[t]<=IMPAIRMENT_P);
  return {
    raw,adjusted,percentiles,domains,
    impairment:{
      cutoffPercentile:IMPAIRMENT_P,
      totalCount:impaired.length,totalAvailable:allTests.filter(t=>Number.isFinite(percentiles[t])).length,totalTests:allTests.length,
      memoryCount:memoryImpaired.length,memoryAvailable:memoryTests.filter(t=>Number.isFinite(percentiles[t])).length,memoryTests:memoryTests.length,
      impairedTests:impaired,
      completeAll:allTests.every(t=>Number.isFinite(percentiles[t])),
      completeMemory:memoryTests.every(t=>Number.isFinite(percentiles[t]))
    }
  };
}

function svgLineChart(domains){
  const labels=Object.keys(DOMAIN_TESTS);
  const caseValues=labels.map(d=>domains[d].dispersion);
  const refMap={NC:'NC',AD:'AD',Glioma:'Glioma'};
  const visibleRefs=[];
  if(document.getElementById('showNC')?.checked)visibleRefs.push('NC');
  if(document.getElementById('showAD')?.checked)visibleRefs.push('AD');
  if(document.getElementById('showGlioma')?.checked)visibleRefs.push('Glioma');
  const showCutoff=document.getElementById('showCutoff')?.checked;

  const refVals=g=>labels.map(d=>CFG.referenceCurves?.[g]?.[d]??null);
  const cutoffVals=labels.map(d=>CFG.dispersionReference?.[d]?.high??null);
  const allValues=[...caseValues];
  visibleRefs.forEach(g=>allValues.push(...refVals(g)));
  if(showCutoff)allValues.push(...cutoffVals);
  const finite=allValues.filter(Number.isFinite);
  const yMax=Math.max(10,Math.ceil(((finite.length?Math.max(...finite):10)+3)/5)*5);
  const W=980,H=350,pad={l:60,r:30,t:28,b:76};
  const x=i=>pad.l+i*(W-pad.l-pad.r)/(labels.length-1);
  const y=v=>pad.t+(yMax-v)*(H-pad.t-pad.b)/yMax;
  const colors={NC:'#2d6fbb',AD:'#d95f50',Glioma:'#4b5563',Case:'#8a4eb8',Cutoff:'#c48919'};
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Current-norm individual domain dispersion profile">`;
  for(let v=0;v<=yMax;v+=5){
    s+=`<line x1="${pad.l}" y1="${y(v)}" x2="${W-pad.r}" y2="${y(v)}" stroke="#d9e3ea"/><text x="${pad.l-12}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#607487">${v}</text>`;
  }
  labels.forEach((lab,i)=>s+=`<text x="${x(i)}" y="${H-34}" text-anchor="middle" font-size="11" fill="#385268">${lab.replace(' function','')}</text>`);

  const drawSeries=(values,color,width=2.5,opacity=1,labelsOn=false,dash='')=>{
    const pts=values.map((v,i)=>Number.isFinite(v)?`${x(i)},${y(v)}`:null).filter(Boolean).join(' ');
    if(pts)s+=`<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
    values.forEach((v,i)=>{
      if(Number.isFinite(v)){
        s+=`<circle cx="${x(i)}" cy="${y(v)}" r="${labelsOn?5:3.5}" fill="${color}" opacity="${opacity}"/>`;
        if(labelsOn){
          const flag=domains[labels[i]]?.highDispersion?' ↑':'';
          s+=`<text x="${x(i)}" y="${y(v)-12}" text-anchor="middle" font-size="12" font-weight="700" fill="${domains[labels[i]]?.highDispersion?'#b83b2c':'#5b327f'}">${v.toFixed(1)}${flag}</text>`;
        }
      }
    });
  };
  visibleRefs.forEach(g=>drawSeries(refVals(g),colors[g],2,.62,false));
  if(showCutoff)drawSeries(cutoffVals,colors.Cutoff,2,.9,false,'7 5');
  drawSeries(caseValues,colors.Case,4,1,true);
  s+=`<text transform="translate(18 ${H/2}) rotate(-90)" text-anchor="middle" font-size="12" fill="#334e63">Within-domain percentile SD</text>`;
  s+=`</svg><div class="legend"><span><i style="background:${colors.Case}"></i>Current participant</span>`;
  if(showCutoff)s+=`<span><i style="background:${colors.Cutoff}"></i>NC mean + 1.5 SD</span>`;
  visibleRefs.forEach(g=>s+=`<span><i style="background:${colors[g]}"></i>Current ${g}</span>`);
  s+=`</div>`;
  return s;
}

function radarSVG(labels,vals){
  const W=300,H=260,cx=150,cy=125,R=92,n=labels.length,ang=i=>-Math.PI/2+i*2*Math.PI/n,pt=(r,i)=>[cx+r*Math.cos(ang(i)),cy+r*Math.sin(ang(i))];
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img">`;
  [20,40,60,80,100].forEach(level=>{const r=R*level/100;s+=`<polygon points="${labels.map((_,i)=>pt(r,i).join(',')).join(' ')}" fill="none" stroke="#d7e1e7"/>`;});
  labels.forEach((lab,i)=>{const [x,y]=pt(R,i),[tx,ty]=pt(R+22,i);s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#d7e1e7"/><text x="${tx}" y="${ty}" text-anchor="middle" font-size="10" fill="#405b6d">${TEST_LABEL[lab]}</text>`;});
  const usable=vals.map(v=>Number.isFinite(v)?v:0);
  s+=`<polygon points="${usable.map((v,i)=>pt(R*v/100,i).join(',')).join(' ')}" fill="#27a7b533" stroke="#1293a0" stroke-width="2"/>`;
  vals.forEach((v,i)=>{if(Number.isFinite(v)){const [x,y]=pt(R*v/100,i);s+=`<circle cx="${x}" cy="${y}" r="3.5" fill="${v<=IMPAIRMENT_P?'#d84a3a':'#1293a0'}"/>`;}});
  return s+`</svg>`;
}
function renderRadars(p){
  const root=document.getElementById('radarGrid');root.innerHTML='';
  Object.entries(DOMAIN_TESTS).forEach(([domain,tests])=>{
    const vals=tests.map(t=>p[t]);
    const div=document.createElement('div');div.className='radar-card';
    div.innerHTML=`<h4>${domain}</h4>${radarSVG(tests,vals)}`;
    root.appendChild(div);
  });
}
function cvRisks(){return ['htn','dm','hld','smoking','af','stroke'].filter(id=>document.getElementById(id).checked).map(id=>({htn:'高血壓',dm:'糖尿病',hld:'高血脂',smoking:'吸菸史',af:'心房顫動',stroke:'腦中風史'})[id]);}

function run(){
  const data=collect();
  document.getElementById('dispersionChart').innerHTML=svgLineChart(data.domains);
  renderRadars(data.percentiles);

  const imp=data.impairment;
  const allRoc=CFG.roc.all25, memRoc=CFG.roc.memory7;
  let band='medium', bandText='資料未完整', valueText='—', note='';
  if(imp.completeAll){
    if(imp.totalCount>=allRoc.cutoffCount){
      band='high';bandText='AD-like impairment burden';
      valueText=`${imp.totalCount} / ${imp.totalTests} impaired`;
      note=`Current-norm NC vs AD ROC：AUC ${allRoc.auc.toFixed(2)}；cutoff ≥${allRoc.cutoffCount} tests ≤P${IMPAIRMENT_P.toFixed(2)}；sens ${allRoc.sensitivity.toFixed(2)} / spec ${allRoc.specificity.toFixed(2)}。`;
    } else if(imp.memoryCount>=memRoc.cutoffCount){
      band='medium';bandText='Memory impairment criterion met';
      valueText=`Memory ${imp.memoryCount} / ${imp.memoryTests}`;
      note=`至少 1 個 memory test ≤ −1.5 SD；符合客觀記憶缺損篩檢條件，但 aMCI 診斷仍需 CDR/ADL 與臨床判斷。`;
    } else {
      band='low';bandText='No burden cutoff met';
      valueText=`${imp.totalCount} / ${imp.totalTests} impaired`;
      note=`完整 25-test battery 中，未達 current-norm ROC 的 ≥${allRoc.cutoffCount} impaired-tests cutoff。`;
    }
  } else if(imp.completeMemory){
    band=imp.memoryCount>=memRoc.cutoffCount?'medium':'low';
    bandText=imp.memoryCount>=memRoc.cutoffCount?'Memory impairment criterion met':'Memory cutoff not met';
    valueText=`Memory ${imp.memoryCount} / ${imp.memoryTests}`;
    note=`全套測驗未完整，因此不套用 25-test AD-like burden ROC；memory cutoff ROC AUC ${memRoc.auc.toFixed(2)}。`;
  } else {
    band='medium';bandText='Incomplete battery';
    valueText=`${imp.totalAvailable} / ${imp.totalTests} available`;
    note=`需完成全部 7 個 memory tests 才判讀 memory impairment burden；完整 25-test battery 才套用 AD-like burden ROC。`;
  }
  const rb=document.getElementById('riskBand');rb.className=`risk-band ${band}`;rb.textContent=bandText;
  document.getElementById('riskValue').textContent=valueText;
  document.getElementById('riskNote').textContent=note;

  const cv=cvRisks();
  document.getElementById('clinicalSummary').innerHTML=`<p>年齡：${age.value}｜教育：${education.value} 年</p><p>估計基準智力：${premorbidIq.value}</p><p>心血管因子：${cv.length?cv.join('、'):'未勾選'}</p><p class="muted">CV factors recorded but excluded from v1.6 model.</p>`;
  document.getElementById('mciModelState').textContent=`客觀記憶缺損：≥1/7 memory test ≤P${IMPAIRMENT_P.toFixed(2)}；ROC AUC ${memRoc.auc.toFixed(2)} (NC vs AD memory burden)`;
  document.getElementById('datModelState').textContent=`AD-like burden：≥${allRoc.cutoffCount}/25 tests ≤P${IMPAIRMENT_P.toFixed(2)}；ROC AUC ${allRoc.auc.toFixed(2)} (NC vs AD)`;

  const highDomains=Object.entries(data.domains).filter(([,v])=>v.highDispersion).map(([d])=>d);
  const domainRows=Object.entries(data.domains).map(([d,v])=>{
    const status=!v.complete?'測驗未完整':v.highDispersion?'高於 NC +1.5 SD':'未超過 NC +1.5 SD';
    return `${d}: SD ${v.dispersion?.toFixed(1)??'—'} / cutoff ${v.cutoff?.toFixed(1)??'—'} (${status})`;
  }).join('<br>');

  const report=[
    ['個案摘要',`${subjectId.value}；${age.value} 歲；教育 ${education.value} 年。`],
    ['Current norm',`15 個 raw-score tests：依 74 位 NC 的 demographic-adjusted empirical percentile；10 個 scaled-score tests：M=10, SD=3。`],
    ['−1.5 SD impairment cutoff',`P ≤ ${IMPAIRMENT_P.toFixed(2)}。目前 ${imp.totalCount}/${imp.totalAvailable} 個可用測驗達此門檻；memory ${imp.memoryCount}/${imp.memoryAvailable}。`],
    ['高 dispersion cutoff',domainRows],
    ['ROC re-analysis',`完整 25-test burden：AUC=${allRoc.auc.toFixed(2)}, cutoff ≥${allRoc.cutoffCount}, sensitivity=${allRoc.sensitivity.toFixed(2)}, specificity=${allRoc.specificity.toFixed(2)}（current-norm NC vs AD complete cases）。Memory burden：AUC=${memRoc.auc.toFixed(2)}, cutoff ≥${memRoc.cutoffCount}/7。`],
    ['Domain ISD ROC',`單獨 ISD 的 AUC 僅約 ${Math.min(...Object.values(CFG.roc.domainISD)).toFixed(2)}–${Math.max(...Object.values(CFG.roc.domainISD)).toFixed(2)}，因此 v1.6 不把 dispersion 單獨當作 AD classifier。`],
    ['解讀限制','這是橫斷面 current-norm profile screening，不是未來失智機率，也不能取代 aMCI/DAT 的 CDR、ADL、病史與臨床診斷。']
  ];
  document.getElementById('report').innerHTML=report.flatMap(([a,b])=>[`<div>${a}</div>`,`<div>${b}</div>`]).join('');

  window.__lastReport={
    subject:{id:subjectId.value,age:+age.value,sex:sex.value,education:+education.value,premorbidIq:+premorbidIq.value,cardiovascular:cv},
    ...data,
    currentNorm:{sample:CFG.normSample,impairmentPercentile:IMPAIRMENT_P,dispersionCutoffs:CFG.dispersionReference,roc:CFG.roc},
    classification:{band:bandText,highDispersionDomains:highDomains},
    modelVersion:'current-norm-1.6'
  };
}
function loadDemo(){Object.entries(DEMO_RAW).forEach(([t,v])=>{const el=document.getElementById(`raw_${t}`);if(el)el.value=v;});run();}
function exportJson(){if(!window.__lastReport)run();const blob=new Blob([JSON.stringify(window.__lastReport,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${subjectId.value||'subject'}_neurodispersion_current_norm.json`;a.click();URL.revokeObjectURL(a.href);}

buildInputs();
document.getElementById('demoBtn').addEventListener('click',loadDemo);
document.getElementById('runBtn').addEventListener('click',run);
document.getElementById('exportBtn').addEventListener('click',exportJson);
['subjectId','age','sex','education','premorbidIq'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener(el.tagName==='SELECT'?'change':'input',run);});
['htn','dm','hld','smoking','af','stroke','showNC','showAD','showGlioma','showCutoff'].forEach(id=>document.getElementById(id)?.addEventListener('change',run));
run();

// ---------------- Supabase persistence ----------------
let sb=null,currentUser=null;
function setAuthStatus(msg,kind=''){const el=document.getElementById('authStatus');if(!el)return;el.textContent=msg;el.className=`auth-status ${kind}`.trim();}
function initSupabase(){
  const cfg=window.NEURODISPERSION_SUPABASE||{};
  if(!cfg.url||!cfg.anonKey){setAuthStatus('尚未設定 Supabase。請填入 config/supabase-config.js。');return;}
  if(!window.supabase){setAuthStatus('Supabase client 載入失敗。','err');return;}
  sb=window.supabase.createClient(cfg.url,cfg.anonKey);
  sb.auth.getUser().then(({data,error})=>{if(error){setAuthStatus('Supabase 連線完成；尚未登入。');return;}currentUser=data.user||null;setAuthStatus(currentUser?`已登入：${currentUser.email}`:'Supabase 連線完成；尚未登入。',currentUser?'ok':'');if(currentUser)refreshRecords();});
  sb.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;setAuthStatus(currentUser?`已登入：${currentUser.email}`:'已登出。',currentUser?'ok':'');if(currentUser)refreshRecords();else document.getElementById('savedRecords').innerHTML='';});
}
async function login(){
  if(!sb){setAuthStatus('請先設定 Supabase URL 與 publishable/anon key。','err');return;}
  const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error){setAuthStatus(`登入失敗：${error.message}`,'err');return;}currentUser=data.user;setAuthStatus(`已登入：${currentUser.email}`,'ok');refreshRecords();
}
async function logout(){if(!sb)return;const {error}=await sb.auth.signOut();if(error)setAuthStatus(`登出失敗：${error.message}`,'err');}
function recordPayload(){
  if(!window.__lastReport)run();const r=window.__lastReport;
  return {
    owner_id:currentUser.id,subject_id:r.subject.id,
    demographics:{age:r.subject.age,sex:r.subject.sex,education:r.subject.education,premorbidIq:r.subject.premorbidIq},
    clinical_features:{cardiovascular:r.subject.cardiovascular},
    raw_scores:r.raw,percentiles:r.percentiles,domains:r.domains,
    outputs:{impairment:r.impairment,classification:r.classification,currentNorm:r.currentNorm},
    model_version:'current-norm-1.6'
  };
}
async function saveRecord(){
  if(!sb||!currentUser){setAuthStatus('請先登入 Supabase。','err');return;}run();
  const {data,error}=await sb.from('neurodispersion_records').insert(recordPayload()).select('id,subject_id,created_at').single();
  if(error){setAuthStatus(`儲存失敗：${error.message}`,'err');return;}setAuthStatus(`已儲存 ${data.subject_id}`,'ok');refreshRecords();
}
async function refreshRecords(){
  if(!sb||!currentUser)return;const root=document.getElementById('savedRecords');root.innerHTML='<div class="muted">讀取中…</div>';
  const {data,error}=await sb.from('neurodispersion_records').select('id,subject_id,assessment_date,created_at').order('created_at',{ascending:false}).limit(30);
  if(error){root.innerHTML=`<div class="auth-status err">${error.message}</div>`;return;}
  if(!data?.length){root.innerHTML='<div class="muted">尚無已儲存個案。</div>';return;}
  root.innerHTML=data.map(x=>`<div class="saved-item"><div><strong>${x.subject_id}</strong><br><span class="muted">${new Date(x.created_at).toLocaleString()}</span></div><button class="ghost" data-load-id="${x.id}">載入</button></div>`).join('');
  root.querySelectorAll('[data-load-id]').forEach(btn=>btn.addEventListener('click',()=>loadRecord(btn.dataset.loadId)));
}
async function loadRecord(id){
  if(!sb||!currentUser)return;const {data,error}=await sb.from('neurodispersion_records').select('*').eq('id',id).single();
  if(error){setAuthStatus(`載入失敗：${error.message}`,'err');return;}
  subjectId.value=data.subject_id||'';age.value=data.demographics?.age??'';sex.value=data.demographics?.sex??'M';education.value=data.demographics?.education??'';premorbidIq.value=data.demographics?.premorbidIq??'';
  const cv=new Set(data.clinical_features?.cardiovascular||[]),map={htn:'高血壓',dm:'糖尿病',hld:'高血脂',smoking:'吸菸史',af:'心房顫動',stroke:'腦中風史'};
  Object.entries(map).forEach(([id,label])=>document.getElementById(id).checked=cv.has(label));
  Object.values(DOMAIN_TESTS).flat().forEach(t=>{const el=document.getElementById(`raw_${t}`);if(el)el.value='';});
  Object.entries(data.raw_scores||{}).forEach(([t,v])=>{const el=document.getElementById(`raw_${t}`);if(el)el.value=v??'';});
  run();setAuthStatus(`已載入 ${data.subject_id}`,'ok');
}
document.getElementById('loginBtn')?.addEventListener('click',login);
document.getElementById('logoutBtn')?.addEventListener('click',logout);
document.getElementById('saveDbBtn')?.addEventListener('click',saveRecord);
document.getElementById('refreshDbBtn')?.addEventListener('click',refreshRecords);
initSupabase();
