const DOMAIN_TESTS = {
  "Memory": ["REC","REM","WSLT_IM","WSLT_DEL","BVRT","LM_IM","LM_DEL","FP_IM","FP_DEL"],
  "Executive function": ["TMT_B","CTT_2","mCST_CAT","mCST_PE","ARI","DSS"],
  "Language": ["VNT","TT","SAVF","SIM"],
  "Visuospatial function": ["JLO","3D","MR"],
  "Attention/speed": ["PP_D","PP_ND","PP_B","DS","SS","TMT_A","CTT_1"]
};

// DEMO ONLY. Replace with validated Taiwanese normative conversion tables.
const DEMO_NORMS = {
  REC:{min:0,max:20,highBetter:true}, REM:{min:0,max:20,highBetter:true}, WSLT_IM:{min:0,max:60,highBetter:true}, WSLT_DEL:{min:0,max:12,highBetter:true}, BVRT:{min:0,max:10,highBetter:true}, LM_IM:{min:0,max:50,highBetter:true}, LM_DEL:{min:0,max:30,highBetter:true}, FP_IM:{min:0,max:64,highBetter:true}, FP_DEL:{min:0,max:64,highBetter:true},
  TMT_B:{min:35,max:240,highBetter:false}, CTT_2:{min:35,max:240,highBetter:false}, mCST_CAT:{min:0,max:6,highBetter:true}, mCST_PE:{min:0,max:24,highBetter:false}, ARI:{min:0,max:22,highBetter:true}, DSS:{min:0,max:110,highBetter:true},
  VNT:{min:0,max:30,highBetter:true}, TT:{min:0,max:36,highBetter:true}, SAVF:{min:0,max:30,highBetter:true}, SIM:{min:0,max:30,highBetter:true},
  JLO:{min:0,max:30,highBetter:true}, "3D":{min:0,max:18,highBetter:true}, MR:{min:0,max:26,highBetter:true},
  PP_D:{min:0,max:18,highBetter:true}, PP_ND:{min:0,max:18,highBetter:true}, PP_B:{min:0,max:16,highBetter:true}, DS:{min:0,max:20,highBetter:true}, SS:{min:0,max:50,highBetter:true}, TMT_A:{min:20,max:180,highBetter:false}, CTT_1:{min:20,max:180,highBetter:false}
};

const DEMO_RAW = {REC:13,REM:12,WSLT_IM:38,WSLT_DEL:7,BVRT:6,LM_IM:32,LM_DEL:17,FP_IM:39,FP_DEL:31,TMT_B:95,CTT_2:88,mCST_CAT:4,mCST_PE:7,ARI:12,DSS:61,VNT:21,TT:24,SAVF:18,SIM:19,JLO:19,"3D":12,MR:18,PP_D:12,PP_ND:11,PP_B:9,DS:11,SS:29,TMT_A:62,CTT_1:58};

// Research profile coefficients (illustrative manuscript-derived SCD-memory equation).
// This is NOT a validated diagnostic probability model.
const MEMORY_PROFILE_COEF = {REC:-0.25,REM:-0.31,WSLT_IM:0.07,WSLT_DEL:-0.12,BVRT:-0.02,LM_IM:-0.05,LM_DEL:0.22,FP_IM:0.13,FP_DEL:-0.06};
const MEMORY_PROFILE_CUTOFF = 32.70; // manuscript exploratory threshold; lower = more aMCI-like.

function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function demoPercentile(raw,spec){
  if(raw===""||raw==null||Number.isNaN(Number(raw))) return null;
  let t=(Number(raw)-spec.min)/(spec.max-spec.min);
  if(!spec.highBetter)t=1-t;
  return clamp(Math.round(1+98*t),1,99);
}
function mean(a){const x=a.filter(v=>Number.isFinite(v));return x.length?x.reduce((s,v)=>s+v,0)/x.length:null;}
function sd(a){const x=a.filter(v=>Number.isFinite(v)); if(x.length<2)return null; const m=mean(x); return Math.sqrt(x.reduce((s,v)=>s+(v-m)**2,0)/(x.length-1));}

function buildInputs(){
  const root=document.getElementById('testInputs'); root.innerHTML='';
  Object.entries(DOMAIN_TESTS).forEach(([domain,tests])=>{
    const h=document.createElement('div');h.className='test-domain';h.textContent=domain;root.appendChild(h);
    tests.forEach(test=>{
      const row=document.createElement('div');row.className='test-row';
      row.innerHTML=`<span>${test}</span><input id="raw_${test}" type="number" step="0.01" placeholder="raw"><span id="pct_${test}" class="pct">—</span>`;
      root.appendChild(row);
      row.querySelector('input').addEventListener('input',()=>updatePercentile(test));
    });
  });
}
function updatePercentile(test){
  const raw=document.getElementById(`raw_${test}`).value;
  const p=demoPercentile(raw,DEMO_NORMS[test]);
  document.getElementById(`pct_${test}`).textContent=p==null?'—':`P${p}`;
  return p;
}
function collect(){
  const percentiles={},raw={};
  Object.values(DOMAIN_TESTS).flat().forEach(t=>{raw[t]=Number(document.getElementById(`raw_${t}`).value);percentiles[t]=updatePercentile(t);});
  const domains={};
  Object.entries(DOMAIN_TESTS).forEach(([d,tests])=>{const vals=tests.map(t=>percentiles[t]).filter(Number.isFinite);domains[d]={mean:mean(vals),dispersion:sd(vals),values:vals};});
  return {raw,percentiles,domains};
}
function profileScore(p){return Object.entries(MEMORY_PROFILE_COEF).reduce((s,[k,b])=>s+b*(p[k]??0),0);}

function svgLineChart(domains){
  const labels=Object.keys(DOMAIN_TESTS);
  const values=labels.map(d=>domains[d].dispersion);
  const finite=values.filter(Number.isFinite);
  const observedMax=finite.length?Math.max(...finite):10;
  const yMax=Math.max(10,Math.ceil((observedMax+3)/5)*5);
  const W=980,H=350,pad={l:60,r:30,t:28,b:76};
  const x=i=>pad.l+i*(W-pad.l-pad.r)/(labels.length-1);
  const y=v=>pad.t+(yMax-v)*(H-pad.t-pad.b)/yMax;
  const caseColor='#8a4eb8';
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Individual domain dispersion profile">`;
  for(let v=0;v<=yMax;v+=5){
    s+=`<line x1="${pad.l}" y1="${y(v)}" x2="${W-pad.r}" y2="${y(v)}" stroke="#d9e3ea"/><text x="${pad.l-12}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#607487">${v}</text>`;
  }
  labels.forEach((lab,i)=>{
    s+=`<text x="${x(i)}" y="${H-34}" text-anchor="middle" font-size="11" fill="#385268">${lab.replace(' function','')}</text>`;
  });
  const pts=values.map((v,i)=>Number.isFinite(v)?`${x(i)},${y(v)}`:null).filter(Boolean).join(' ');
  if(pts) s+=`<polyline points="${pts}" fill="none" stroke="${caseColor}" stroke-width="4"/>`;
  values.forEach((v,i)=>{
    if(Number.isFinite(v)){
      s+=`<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="${caseColor}"/>`;
      s+=`<text x="${x(i)}" y="${y(v)-12}" text-anchor="middle" font-size="12" font-weight="700" fill="#5b327f">${v.toFixed(1)}</text>`;
    }
  });
  s+=`<text transform="translate(18 ${H/2}) rotate(-90)" text-anchor="middle" font-size="12" fill="#334e63">Within-domain percentile SD</text>`;
  s+=`</svg><div class="legend"><span><i style="background:${caseColor}"></i>Current participant</span></div>`;
  return s;
}

function radarSVG(labels,vals){const W=300,H=260,cx=150,cy=125,R=92,n=labels.length;const ang=i=>-Math.PI/2+i*2*Math.PI/n;const pt=(r,i)=>[cx+r*Math.cos(ang(i)),cy+r*Math.sin(ang(i))];let s=`<svg viewBox="0 0 ${W} ${H}">`;
  [20,40,60,80,100].forEach(level=>{const r=R*level/100;const poly=labels.map((_,i)=>pt(r,i).join(',')).join(' ');s+=`<polygon points="${poly}" fill="none" stroke="#d7e1e7"/>`;});
  labels.forEach((lab,i)=>{const [x,y]=pt(R,i);const [tx,ty]=pt(R+22,i);s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#d7e1e7"/><text x="${tx}" y="${ty}" text-anchor="middle" font-size="10" fill="#405b6d">${lab}</text>`;});
  const poly=vals.map((v,i)=>pt(R*(v??0)/100,i).join(',')).join(' ');s+=`<polygon points="${poly}" fill="#27a7b533" stroke="#1293a0" stroke-width="2"/>`;vals.forEach((v,i)=>{const [x,y]=pt(R*(v??0)/100,i);s+=`<circle cx="${x}" cy="${y}" r="3.5" fill="#1293a0"/>`;});return s+`</svg>`;}

function renderRadars(p){const root=document.getElementById('radarGrid');root.innerHTML='';Object.entries(DOMAIN_TESTS).forEach(([domain,tests])=>{const vals=tests.map(t=>p[t]??0);const div=document.createElement('div');div.className='radar-card';div.innerHTML=`<h4>${domain}</h4>${radarSVG(tests,vals)}`;root.appendChild(div);});}
function cvRisks(){return ['htn','dm','hld','smoking','af','stroke'].filter(id=>document.getElementById(id).checked).map(id=>({htn:'高血壓',dm:'糖尿病',hld:'高血脂',smoking:'吸菸史',af:'心房顫動',stroke:'腦中風史'})[id]);}

function run(){
  const data=collect();
  document.getElementById('dispersionChart').innerHTML=svgLineChart(data.domains); renderRadars(data.percentiles);
  const mScore=profileScore(data.percentiles); const mLike=mScore<MEMORY_PROFILE_CUTOFF;
  const band=mLike?'high':'medium'; const rb=document.getElementById('riskBand');rb.className=`risk-band ${band}`;rb.textContent=mLike?'aMCI-like profile':'SCD-like / indeterminate profile';
  document.getElementById('riskValue').textContent=`Index ${mScore.toFixed(1)}`;
  document.getElementById('riskNote').textContent=`Exploratory manuscript profile cutoff = ${MEMORY_PROFILE_CUTOFF.toFixed(2)}（非經驗證診斷機率）`;
  const cv=cvRisks();document.getElementById('clinicalSummary').innerHTML=`<p>年齡：${age.value}｜教育：${education.value} 年</p><p>估計基準智力：${premorbidIq.value}</p><p>心血管因子：${cv.length?cv.join('、'):'未勾選'}</p><p class="muted">CV factors recorded but excluded from v1.0 model.</p>`;
  const d=Object.entries(data.domains).sort((a,b)=>(b[1].dispersion??-1)-(a[1].dispersion??-1));
  const top=d[0]; const mem=data.domains['Memory'];
  const report=[
    ['個案摘要',`${subjectId.value}；${age.value} 歲；教育 ${education.value} 年。`],
    ['最高 dispersion domain',`${top[0]}：SD = ${top[1].dispersion?.toFixed(2)??'—'}。`],
    ['Memory profile',`Mean percentile = ${mem.mean?.toFixed(1)??'—'}；dispersion = ${mem.dispersion?.toFixed(2)??'—'}。`],
    ['aMCI profile index',`${mScore.toFixed(2)}；依 exploratory cutoff 顯示 ${mLike?'較偏 aMCI-like':'較偏 SCD-like / indeterminate'}。`],
    ['DAT / dementia risk','v1.0 未載入獨立 longitudinal/logistic/Cox dementia model，因此不產生虛構機率。'],
    ['解讀限制','目前 percentile conversion 使用 DEMO NORMS；正式研究部署前須換成 validated Taiwanese normative tables，且風險模型應做外部驗證/交叉驗證。']
  ];
  document.getElementById('report').innerHTML=report.flatMap(([a,b])=>[`<div>${a}</div>`,`<div>${b}</div>`]).join('');
  window.__lastReport={subject:{id:subjectId.value,age:+age.value,sex:sex.value,education:+education.value,premorbidIq:+premorbidIq.value,cardiovascular:cv},...data,memoryProfileIndex:mScore,exploratoryClassification:mLike?'aMCI-like':'SCD-like/indeterminate',modelVersion:'prototype-1.0'};
}
function loadDemo(){Object.entries(DEMO_RAW).forEach(([t,v])=>{document.getElementById(`raw_${t}`).value=v;updatePercentile(t)});run();}
function exportJson(){if(!window.__lastReport)run();const blob=new Blob([JSON.stringify(window.__lastReport,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${subjectId.value||'subject'}_neurodispersion.json`;a.click();URL.revokeObjectURL(a.href);}

buildInputs();document.getElementById('demoBtn').addEventListener('click',loadDemo);document.getElementById('runBtn').addEventListener('click',run);document.getElementById('exportBtn').addEventListener('click',exportJson);

// ---------------- Supabase persistence ----------------
let sb = null;
let currentUser = null;

function setAuthStatus(msg, kind=''){
  const el=document.getElementById('authStatus');
  if(!el) return;
  el.textContent=msg;
  el.className=`auth-status ${kind}`.trim();
}

function initSupabase(){
  const cfg=window.NEURODISPERSION_SUPABASE||{};
  if(!cfg.url || !cfg.anonKey){
    setAuthStatus('尚未設定 Supabase。請填入 config/supabase-config.js。');
    return;
  }
  if(!window.supabase){
    setAuthStatus('Supabase client 載入失敗。','err');
    return;
  }
  sb=window.supabase.createClient(cfg.url,cfg.anonKey);
  sb.auth.getUser().then(({data,error})=>{
    if(error){ setAuthStatus(`Supabase 連線完成；尚未登入。`); return; }
    currentUser=data.user||null;
    setAuthStatus(currentUser?`已登入：${currentUser.email}`:'Supabase 連線完成；尚未登入。',currentUser?'ok':'');
    if(currentUser) refreshRecords();
  });
  sb.auth.onAuthStateChange((_event,session)=>{
    currentUser=session?.user||null;
    setAuthStatus(currentUser?`已登入：${currentUser.email}`:'已登出。',currentUser?'ok':'');
    if(currentUser) refreshRecords(); else document.getElementById('savedRecords').innerHTML='';
  });
}

async function login(){
  if(!sb){ setAuthStatus('請先設定 Supabase URL 與 publishable/anon key。','err'); return; }
  const email=document.getElementById('authEmail').value.trim();
  const password=document.getElementById('authPassword').value;
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error){ setAuthStatus(`登入失敗：${error.message}`,'err'); return; }
  currentUser=data.user;
  setAuthStatus(`已登入：${currentUser.email}`,'ok');
  refreshRecords();
}

async function logout(){
  if(!sb) return;
  const {error}=await sb.auth.signOut();
  if(error) setAuthStatus(`登出失敗：${error.message}`,'err');
}

function recordPayload(){
  if(!window.__lastReport) run();
  const r=window.__lastReport;
  return {
    owner_id: currentUser.id,
    subject_id: r.subject.id,
    demographics: {
      age:r.subject.age,
      sex:r.subject.sex,
      education:r.subject.education,
      premorbidIq:r.subject.premorbidIq
    },
    clinical_features: {
      cardiovascular:r.subject.cardiovascular
    },
    raw_scores:r.raw,
    percentiles:r.percentiles,
    domains:r.domains,
    outputs:{
      memoryProfileIndex:r.memoryProfileIndex,
      exploratoryClassification:r.exploratoryClassification
    },
    model_version:'prototype-1.1'
  };
}

async function saveRecord(){
  if(!sb || !currentUser){ setAuthStatus('請先登入 Supabase。','err'); return; }
  run();
  const payload=recordPayload();
  const {data,error}=await sb.from('neurodispersion_records').insert(payload).select('id,subject_id,created_at').single();
  if(error){ setAuthStatus(`儲存失敗：${error.message}`,'err'); return; }
  setAuthStatus(`已儲存 ${data.subject_id}`,'ok');
  refreshRecords();
}

async function refreshRecords(){
  if(!sb || !currentUser) return;
  const root=document.getElementById('savedRecords');
  root.innerHTML='<div class="muted">讀取中…</div>';
  const {data,error}=await sb.from('neurodispersion_records')
    .select('id,subject_id,assessment_date,created_at')
    .order('created_at',{ascending:false})
    .limit(30);
  if(error){ root.innerHTML=`<div class="auth-status err">${error.message}</div>`; return; }
  if(!data?.length){ root.innerHTML='<div class="muted">尚無已儲存個案。</div>'; return; }
  root.innerHTML=data.map(x=>`<div class="saved-item"><div><strong>${x.subject_id}</strong><br><span class="muted">${new Date(x.created_at).toLocaleString()}</span></div><button class="ghost" data-load-id="${x.id}">載入</button></div>`).join('');
  root.querySelectorAll('[data-load-id]').forEach(btn=>btn.addEventListener('click',()=>loadRecord(btn.dataset.loadId)));
}

async function loadRecord(id){
  if(!sb || !currentUser) return;
  const {data,error}=await sb.from('neurodispersion_records').select('*').eq('id',id).single();
  if(error){ setAuthStatus(`載入失敗：${error.message}`,'err'); return; }
  subjectId.value=data.subject_id||'';
  age.value=data.demographics?.age??'';
  sex.value=data.demographics?.sex??'M';
  education.value=data.demographics?.education??'';
  premorbidIq.value=data.demographics?.premorbidIq??'';
  const cv=new Set(data.clinical_features?.cardiovascular||[]);
  const map={htn:'高血壓',dm:'糖尿病',hld:'高血脂',smoking:'吸菸史',af:'心房顫動',stroke:'腦中風史'};
  Object.entries(map).forEach(([id,label])=>document.getElementById(id).checked=cv.has(label));
  Object.entries(data.raw_scores||{}).forEach(([t,v])=>{
    const el=document.getElementById(`raw_${t}`);
    if(el){ el.value=v??''; updatePercentile(t); }
  });
  run();
  setAuthStatus(`已載入 ${data.subject_id}`,'ok');
}

// Attach Supabase controls after DOM is ready (script is at end of body).
document.getElementById('loginBtn')?.addEventListener('click',login);
document.getElementById('logoutBtn')?.addEventListener('click',logout);
document.getElementById('saveDbBtn')?.addEventListener('click',saveRecord);
document.getElementById('refreshDbBtn')?.addEventListener('click',refreshRecords);
initSupabase();
