import { DIAGNOSE_ENGINE } from './engine'
import { RENDER_REPORT } from './report'

export const CLIENT_JS = String.raw`
/* ===================== State ===================== */
let apiData = null;
let lastResult = null;
const toggleState = { smartcall: false, talktalk: false, news: false };

function escapeHtml(v){
  if(v===null||v===undefined) return '';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ===================== Stage 제어 ===================== */
function showStage(id){
  document.querySelectorAll('.stage').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}
function togglePill(el){
  const field = el.dataset.field;
  const val = el.dataset.value;
  document.querySelectorAll('.toggle-pill[data-field="'+field+'"]').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  toggleState[field] = (val==='yes');
}

/* ===================== 진단 시작 ===================== */
async function startDiagnosis(){
  const url = document.getElementById('urlInput').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const btn = document.getElementById('diagnoseBtn');
  errorMsg.style.display='none';
  if(!url){ errorMsg.textContent='URL을 입력해주세요'; errorMsg.style.display='block'; return; }

  showStage('loadingScreen');
  btn.disabled = true;
  try{
    const apiPromise = fetch('/api/place?url='+encodeURIComponent(url))
      .then(r=>r.json().then(body=>({ok:r.ok, body})));
    const animPromise = runAiLoadingAnimation({
      title:'AI가 매장을 분석하고 있어요',
      sub:'네이버 플레이스 26개 항목 · 실시간 진단',
      steps: ANALYZE_STEPS, quotes: ANALYZE_QUOTES,
      dataPromise: apiPromise.then(r=>(r&&r.ok?r.body:null)).catch(()=>null),
      detailBuilder: buildAnalyzeDetail,
      endLine: '진단 결과 화면으로 이동합니다...'
    });
    const [{ok, body:data}] = await Promise.all([apiPromise, animPromise]);
    if(!ok) throw new Error(data.error||'진단에 실패했습니다');

    apiData = data;
    document.getElementById('confirmName').textContent = (data.name||'가게')+' 정보를 가져왔어요';
    const descEmptyMsg = data.microIntro
      ? ('한줄소개: "'+data.microIntro+'"\\n(상세설명 전문은 직접 확인·입력해주세요)')
      : '상세설명은 자동 확인이 어려워요. 등록돼 있다면 내용을 붙여넣어 주세요';
    applyAutoField('description', data.placeIntro||'', descEmptyMsg);
    const kwText = (data.keywords && data.keywords.length) ? data.keywords.join(', ') : '';
    applyAutoField('keywords', kwText, '대표키워드는 자동 확인이 어려워요. 등록한 키워드를 쉼표로 입력해주세요');
    applyAutoField('direction', data.directionInfoAuto||'', '찾아오는 길이 등록되어 있지 않아요');
    setAutoToggle('smartcall', !!data.hasSmartCallAuto, '사용 중', '미사용');
    setAutoToggle('talktalk', !!data.hasTalkTalkAuto, '사용 중', '미사용');
    applyAutoNewsToggle(data);
    showStage('stage2');
  }catch(err){
    showStage('stage1'); btn.disabled=false;
    errorMsg.textContent=err.message; errorMsg.style.display='block';
  }
}

/* ===================== AI 로딩 애니메이션 ===================== */
const ANALYZE_STEPS=[
  {label:'매장 기본 정보 수집',ms:900,init:'네이버 플레이스 접속 중'},
  {label:'메뉴·사진·편의시설 분석',ms:1000,init:'메뉴 리스트 파싱 중'},
  {label:'리뷰 품질 스캔',ms:1100,init:'방문자 리뷰 로드 중'},
  {label:'스마트플레이스 기능 점검',ms:800,init:'예약·톡톡·결제 확인 중'},
  {label:'상세설명·키워드 판독',ms:900,init:'키워드 추출 중'}
];
const ANALYZE_QUOTES=[
  '리뷰는 양보다 "최근성"이 중요해요',
  '대표키워드 5개를 꽉 채우면 노출이 달라져요',
  '상세설명에 손님이 검색할 단어를 녹여보세요',
  '사진 많은 가게가 클릭률도 높습니다'
];
function renderAiSteps(steps){
  const list=document.getElementById('aiStepList');
  list.innerHTML = steps.map((s,i)=>(
    '<div class="ai-step" data-i="'+i+'">'+
      '<div class="ai-step-icon"></div>'+
      '<div class="ai-step-body"><div class="ai-step-label">'+s.label+'</div>'+
      '<div class="ai-step-detail">'+s.init+'</div></div></div>'
  )).join('');
}
async function runAiLoadingAnimation(cfg){
  if(cfg.title){ const t=document.getElementById('aiLoadingTitle'); if(t)t.textContent=cfg.title; }
  if(cfg.sub){ const su=document.getElementById('aiLoadingSub'); if(su)su.textContent=cfg.sub; }
  renderAiSteps(cfg.steps);
  const quoteEl=document.getElementById('aiQuote');
  let qi=0; quoteEl.textContent=cfg.quotes[0];
  const qt=setInterval(()=>{ qi=(qi+1)%cfg.quotes.length; quoteEl.style.opacity='0'; setTimeout(()=>{quoteEl.textContent=cfg.quotes[qi]; quoteEl.style.opacity='0.9';},200); },1800);
  const all=document.querySelectorAll('.ai-step');
  let resolved=null;
  // 완료된 단계들의 detail을 현재 데이터 기준으로 (재)채움.
  // 데이터가 늦게 와도, 이미 지나간 단계까지 소급해서 실제 값으로 갱신한다.
  function refreshDetails(){
    if(!cfg.detailBuilder || !resolved) return;
    for(let j=0;j<cfg.steps.length;j++){
      const e=all[j];
      if(!e || !e.classList.contains('done')) continue;
      const d=cfg.detailBuilder(j,resolved);
      if(d) e.querySelector('.ai-step-detail').textContent=d;
    }
  }
  if(cfg.dataPromise) cfg.dataPromise.then(r=>{ if(r){ resolved=r; refreshDetails(); } }).catch(()=>{});
  for(let i=0;i<cfg.steps.length;i++){
    const el=all[i]; el.classList.add('active');
    await sleep(cfg.steps[i].ms);
    el.classList.remove('active'); el.classList.add('done');
    if(cfg.detailBuilder && resolved){ const d=cfg.detailBuilder(i,resolved); if(d) el.querySelector('.ai-step-detail').textContent=d; }
  }
  // 애니메이션이 데이터보다 빨리 끝났으면 응답을 기다린 뒤 모든 단계 detail을 실제 값으로 채운다.
  if(cfg.dataPromise){
    const late=await cfg.dataPromise.catch(()=>null);
    if(late && !resolved) resolved=late;
    refreshDetails();
    if(resolved) await sleep(450); // 채워진 실제 값을 사용자가 볼 수 있도록 잠깐 유지
  }
  clearInterval(qt);
  quoteEl.style.opacity='0'; setTimeout(()=>{quoteEl.textContent=cfg.endLine; quoteEl.style.opacity='0.9';},150);
  await sleep(300);
}
function buildAnalyzeDetail(idx,d){
  if(!d) return '';
  if(idx===0) return (d.name||'')+' · '+(d.category||'');
  if(idx===1){
    const conv=(d.conveniences&&d.conveniences.length)||0;
    return '메뉴 '+(d.totalMenus||0)+'개 · 사진 '+(d.imageCount||0)+'장 · 편의 '+conv+'종';
  }
  if(idx===2) return '방문자 '+(d.totalReviewCount||0).toLocaleString()+'건 · 블로그 '+(d.blogCafeReviewCount||0).toLocaleString()+'건';
  if(idx===3){ const t=[]; if(d.hasBooking)t.push('예약'); if(d.hasSmartCallAuto)t.push('스마트콜'); if(d.hasNPay)t.push('N페이'); if(d.hasTalkTalkAuto)t.push('톡톡'); return t.length?t.join(' + ')+' 확인':'기능 점검 완료'; }
  if(idx===4){
    const len=(d.description||'').length;
    const kw=(d.keywords&&d.keywords.length)||0;
    return (len>0?('상세설명 '+len+'자 · '):'')+'대표키워드 '+kw+'개 분석';
  }
  return '';
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

document.getElementById('urlInput').addEventListener('keydown',e=>{ if(e.key==='Enter') startDiagnosis(); });

/* ===================== Stage2 자동 필드 ===================== */
function applyAutoField(fieldId, text, emptyMsg){
  const ta=document.getElementById('input'+fieldId[0].toUpperCase()+fieldId.slice(1));
  const preview=document.getElementById(fieldId+'Preview');
  const badge=document.getElementById(fieldId+'Badge');
  ta.value=text||'';
  if(text&&text.trim()){
    preview.textContent=text; preview.classList.remove('empty');
    badge.textContent='자동 확인됨'; badge.className='auto-field-badge confirmed';
  }else{
    preview.textContent=emptyMsg; preview.classList.add('empty');
    badge.textContent='미등록'; badge.className='auto-field-badge empty';
  }
}
function toggleAutoEdit(fieldId){
  const ed=document.getElementById(fieldId+'Editor');
  const btn=document.querySelector('.auto-field[data-field="'+fieldId+'"] .auto-field-edit-btn');
  const open=ed.style.display!=='none';
  ed.style.display=open?'none':'block';
  btn.textContent=open?'수정하기':'접기';
}
function setAutoToggle(field,on,labelOn,labelOff){
  toggleState[field]=on;
  const yes=document.querySelector('.toggle-pill[data-field="'+field+'"][data-value="yes"]');
  const no=document.querySelector('.toggle-pill[data-field="'+field+'"][data-value="no"]');
  const badge=document.getElementById(field+'Badge');
  if(on){ yes.classList.add('active'); no.classList.remove('active'); badge.textContent=labelOn; badge.className='auto-toggle-badge on'; }
  else{ no.classList.add('active'); yes.classList.remove('active'); badge.textContent=labelOff; badge.className='auto-toggle-badge off'; }
}
function applyAutoNewsToggle(data){
  const feed = data.latestFeed;
  const within = feed && feed.within30Days;
  // 실제 게시일(daysAgo)을 알 수 있으면 참조 사이트처럼 'N일 전 게시' 라벨 표시
  var labelOn = '있음';
  if(within && feed.daysAgo != null){
    var d = feed.daysAgo;
    labelOn = d===0 ? '오늘 게시' : d===1 ? '어제 게시' : (d + '일 전 게시');
  }
  setAutoToggle('news', !!within, labelOn, '없음');
}
function toggleToggleEditors(){
  const eds=document.querySelectorAll('.auto-toggle-edit');
  const open = eds[0] && eds[0].style.display!=='none';
  eds.forEach(ed=>ed.style.display=open?'none':'block');
}

/* ===================== 결과 ===================== */
async function showResult(){
  // Stage2 사용자 입력 반영
  const kwRaw = document.getElementById('inputKeywords').value.trim();
  const user={
    description: document.getElementById('inputDescription').value.trim(),
    direction: document.getElementById('inputDirection').value.trim(),
    keywords: kwRaw ? kwRaw.split(/[,\n]/).map(s=>s.trim()).filter(Boolean) : null,
    smartcall: toggleState.smartcall, talktalk: toggleState.talktalk, news: toggleState.news
  };
  // 진단을 먼저 계산해 실제 결과값을 로딩 단계에 표시한다.
  const result = analyzePlaceData(apiData, user);
  lastResult = result;
  const weakCount = (result.items||[]).filter(i=>!i.na && i.max>0 && (i.score/i.max)<0.7)
    .sort((a,b)=>(a.score/a.max)-(b.score/b.max)).slice(0,3).length || 3;
  const peerMap = {
    accommodation:'숙박·펜션·게스트하우스', food:'음식점·카페', beauty:'미용·뷰티',
    medical:'병원·의원', education:'학원·교육', fitness:'운동·피트니스',
    professional:'전문 서비스', studio:'사진·스튜디오', leisure:'여가·오락',
    realestate:'부동산', service:'서비스업'
  };
  const peerName = (result.industry && (peerMap[result.industry.group] || result.industry.displayName)) || '동일 업종';

  showStage('loadingScreen');
  await runAiLoadingAnimation({
    title:'AI가 리포트를 작성하고 있어요',
    sub:'26개 항목 분석 기반 · 맞춤 액션 플랜',
    steps:[
      {label:'강점·약점 도출',ms:800,init:'카테고리별 점수 분석 중'},
      {label:'사장님 맞춤 액션 플랜 작성',ms:800,init:'우선 개선 항목 선정 중'},
      {label:'업종 평균과 최종 비교',ms:700,init:'동일 업종 벤치마크 비교 중'},
      {label:'리포트 구성·그래프 렌더링',ms:800,init:'시각화 준비 중'}
    ],
    quotes:['강점은 살리고 약점은 구체적으로 짚어드릴게요','진단은 시작일 뿐, 실행이 매출을 바꿔요'],
    dataPromise: Promise.resolve(result),
    detailBuilder:(idx,r)=>{
      if(!r) return '';
      if(idx===0) return '총점 '+r.displayScore+'점 · '+r.grade+' 등급';
      if(idx===1) return '우선 개선 '+weakCount+'가지 선정';
      if(idx===2) return peerName+' 평균 반영';
      if(idx===3) return '시각화 준비 완료';
      return '';
    },
    endLine:'리포트를 준비했어요!'
  });
  renderReport(result);
  showStage('stage3');
}

function restart(){
  document.getElementById('urlInput').value='';
  document.getElementById('diagnoseBtn').disabled=false;
  showStage('stage1');
}

/* ===================== 진단 엔진 (26항목) ===================== */
` + DIAGNOSE_ENGINE + `

/* ===================== 리포트 렌더 ===================== */
` + RENDER_REPORT + `
`
