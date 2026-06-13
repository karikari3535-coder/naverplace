// 클라이언트에서 실행되는 진단 엔진 (문자열로 주입)
export const DIAGNOSE_ENGINE = String.raw`
function analyzePlaceData(api, user){
  const items=[];
  const industry = api.industry || {tier:1,group:'food',displayName:'일반',naItemKeys:[],isMedical:false};
  const naKeys = new Set(industry.naItemKeys||[]);
  const isMedical = !!industry.isMedical;
  const isBeauty = industry.group==='beauty';
  const isAccommodation = industry.group==='accommodation';
  const isEducation = industry.group==='education';
  const isRealestate = industry.group==='realestate';
  const isEducationOrRealestate = isEducation || isRealestate;
  const hasReviewDetail = !!api.hasReviewDetail;
  const menuWord = industry.tier===2 ? (isBeauty?'시술':'프로그램') : (industry.tier===3?'상품':'메뉴');
  // 스타일 탭은 네이버가 미용실(hairStyles)·네일(nailStyles)에만 제공 — displayName/category로 판정
  const _styleRe = /미용실|헤어|바버|네일/;
  const hasStyleTab = _styleRe.test(industry.displayName||'') || _styleRe.test(api.category||'');

  let naMaxScore=0;
  function pushNA(key,name,cat,max,reason){
    naMaxScore+=max;
    items.push({key,name,cat,max,score:0,detail:reason||'데이터를 가져올 수 없었습니다',comment:'직접 확인해주세요',na:true});
  }

  /* ── 리뷰 & 신뢰 (참조 사이트와 동일한 가중 배점) ──
     리뷰 상세(방문자 리뷰 API)를 수집했으면(hasReviewDetail=true) 참조 사이트와
     동일하게 최근 7/30일 리뷰·답글·사진 비율을 높은 가중치로 채점한다.
     수집 실패 시 해당 항목은 N/A(effectiveMax 제외) 처리. */
  const isNonBeautyT2 = industry.tier===2 && !isBeauty;
  const isBeautyNoStyleTab = isBeauty && !hasStyleTab;
  const PTS_RECENT7 = isNonBeautyT2 ? 13 : 10;
  const PTS_RECENT30 = 7;
  const PTS_TOTAL_REV = 5;
  const PTS_REPLY_RATE = 5;
  const PTS_BLOG_REVIEW = isBeautyNoStyleTab ? 7 : 5;

  // #1 최근 7일 리뷰 (10/13)
  if(hasReviewDetail){
    const r7=api.last7DaysReviews||0; let s,c;
    if(r7>=40){s=PTS_RECENT7;c='사장님 이거 비결이 뭐예요? 저한테도 알려주세요';}
    else if(r7>=35){s=isNonBeautyT2?12:9;c='대단하세요. 이 페이스면 플레이스 상위권 유지됩니다';}
    else if(r7>=30){s=isNonBeautyT2?10:8;c='참 잘하고 계세요! 리뷰가 쌓이는 게 눈에 보여요';}
    else if(r7>=25){s=isNonBeautyT2?9:7;c='좋아요. 여기서 리뷰 가이드만 추가하면 더 빨라져요';}
    else if(r7>=20){s=isNonBeautyT2?7.5:6;c='나쁘지 않아요. 조금만 더 신경 쓰면 확 달라질 구간이에요';}
    else if(r7>=15){s=isNonBeautyT2?6:5;c='중간이에요. 리뷰 이벤트 한 번 해보시겠어요?';}
    else if(r7>=10){s=isNonBeautyT2?5:4;c='여기서부터 관리 시작하면 한 달 뒤에 달라져요';}
    else if(r7>=7){s=isNonBeautyT2?4:3;c='리뷰 가이드를 만들어서 조금 더 받아보면 확 달라질 거예요';}
    else if(r7>=4){s=isNonBeautyT2?2.5:2;c='리뷰를 직접 부탁해보신 적 있으세요?';}
    else if(r7>=1){s=isNonBeautyT2?1.5:1;c='이번 주 리뷰가 거의 없어요. 오늘부터 한 분한테만 부탁해보세요';}
    else{s=0;c='이번 주 리뷰 0개예요. 리뷰 가이드부터 같이 만들어봐요';}
    items.push({key:'recent7',name:'최근 7일 리뷰',cat:'review',max:PTS_RECENT7,score:s,detail:r7+'개',comment:c});
  } else pushNA('recent7','최근 7일 리뷰','review',PTS_RECENT7,'리뷰 데이터를 가져올 수 없었어요');

  // #2 최근 30일 리뷰 (7)
  if(hasReviewDetail){
    const r30=api.last30DaysReviews||0; let s,c;
    if(r30>=45){s=7;c='한 달 리뷰가 폭발적이에요. 이 흐름 유지하시면 됩니다';}
    else if(r30>=40){s=6.5;c='월간 리뷰가 아주 좋아요. 꾸준히 가고 계세요';}
    else if(r30>=35){s=6;c='잘 하고 계세요. 리뷰 강자예요';}
    else if(r30>=30){s=5;c='좋아요. 리뷰 가이드를 강화하면 더 올라갈 수 있어요';}
    else if(r30>=25){s=4;c='나쁘지 않아요. 주 2~3개만 더 받으면 확 달라져요';}
    else if(r30>=20){s=3;c='중간이에요. 영수증 리뷰 이벤트를 시작해보세요';}
    else if(r30>=15){s=2.5;c='하루 1개꼴이에요. 리뷰 가이드 + 이벤트로 속도를 올려보세요';}
    else if(r30>=10){s=2;c='한 달 리뷰가 좀 적어요. 손님한테 직접 부탁해보셨나요?';}
    else if(r30>=5){s=1;c='월 리뷰가 한 자리예요. 리뷰 이벤트부터 세팅해보세요';}
    else if(r30>=1){s=0.5;c='한 달 리뷰가 거의 없어요. 오늘부터 시작해보세요';}
    else{s=0;c='최근 한 달간 리뷰 0개예요. 가장 급한 항목이에요';}
    items.push({key:'recent30',name:'최근 30일 리뷰',cat:'review',max:PTS_RECENT30,score:s,detail:r30+'개',comment:c});
  } else pushNA('recent30','최근 30일 리뷰','review',PTS_RECENT30,'리뷰 데이터를 가져올 수 없었어요');

  // #3 방문자 리뷰 총 수 (5)
  {
    const t=api.totalReviewCount||0; let s,c;
    if(t>=1000){s=5;c='리뷰 천 개 넘으셨네요. 인기 인증이에요';}
    else if(t>=800){s=4.5;c='거의 천 개 가까이 오셨어요. 대단하십니다';}
    else if(t>=600){s=4;c='리뷰가 탄탄하게 쌓여있네요. 신뢰감 충분해요';}
    else if(t>=500){s=3.5;c='500개 넘으셨네요. 꾸준히 잘 관리하고 계세요';}
    else if(t>=400){s=3;c='리뷰 400개대, 좋아요. 계속 쌓아가시면 됩니다';}
    else if(t>=300){s=2.5;c='300개 넘으셨어요. 이제 리뷰 품질에도 신경 쓰면 좋겠어요';}
    else if(t>=200){s=2;c='200개대, 나쁘지 않아요. 리뷰 이벤트를 해보시겠어요?';}
    else if(t>=150){s=1.5;c='조금 더 모아볼까요? 리뷰 가이드 만들면 속도가 붙어요';}
    else if(t>=100){s=1;c='100개는 넘었는데 아직 부족해요. 직접 부탁이 제일 빨라요';}
    else if(t>=50){s=0.5;c='리뷰가 아직 100개가 안 돼요. 가이드부터 만들어보세요';}
    else{s=0;c='리뷰가 50개도 안 돼요. 오늘부터 직접 부탁해보세요';}
    items.push({key:'totalReview',name:'방문자 리뷰 총 수',cat:'review',max:PTS_TOTAL_REV,score:s,detail:t.toLocaleString()+'개',comment:c});
  }

  // #4 리뷰 품질 — 뷰티는 동행 제외 3요소, 그 외 4요소 (참조 사이트와 동일)
  if(hasReviewDetail && api.reviewQualityAvg>0){
    var useThree = isBeauty;
    var avg = api.reviewQualityAvg; var s,c;
    if(useThree){
      if(avg>=1.9){s=5;c='리뷰 품질이 정말 좋으세요. AI가 이 리뷰를 읽고 손님한테 추천할 거예요';}
      else if(avg>=1.5){s=4;c='구체적인 리뷰가 많네요. 시술 목적·만족도가 들어간 리뷰가 AI 추천에 유리해요';}
      else if(avg>=1.1){s=3;c='괜찮아요. 리뷰 가이드로 좀 더 구체적인 리뷰를 유도해보세요';}
      else if(avg>=0.8){s=2;c='리뷰가 좀 단순해요. 어떤 시술을 왜 받았는지 적어달라고 안내해보세요';}
      else if(avg>=0.4){s=1;c='사장님, 리뷰 가이드를 만들어보세요. 구체적인 리뷰가 AI 추천의 핵심이에요';}
      else{s=0.5;c='리뷰에 구체적인 정보가 부족해요. 리뷰 가이드를 만들면 확 달라져요';}
    } else {
      if(avg>=2.5){s=5;c='리뷰 품질이 정말 좋으세요. AI가 이 리뷰를 읽고 손님한테 추천할 거예요';}
      else if(avg>=2.0){s=4;c='구체적인 리뷰가 많네요. 동행자나 목적이 들어간 리뷰가 AI 추천에 유리해요';}
      else if(avg>=1.5){s=3;c='괜찮아요. 리뷰 가이드로 좀 더 구체적인 리뷰를 유도해보세요';}
      else if(avg>=1.0){s=2;c='리뷰가 좀 단순해요. 누구와, 왜, 뭘 했는지 적어달라고 안내해보세요';}
      else if(avg>=0.5){s=1;c='사장님, 리뷰 가이드를 만들어보세요. 구체적인 리뷰가 AI 추천의 핵심이에요';}
      else{s=0.5;c='리뷰에 구체적인 정보가 부족해요. 리뷰 가이드를 만들면 확 달라져요';}
    }
    var analyzedN = api.reviewsAnalyzed || 50;
    var d = api.reviewQualityDetails;
    var detailStr = d
      ? (useThree
          ? '목적 '+d.purposeRate+'% / 구체적 '+d.detailedRate+'% / 추천 '+d.recommendRate+'% (최신 '+analyzedN+'개 기준)'
          : '동행 '+d.companionRate+'% / 목적 '+d.purposeRate+'% / 구체적 '+d.detailedRate+'% / 추천 '+d.recommendRate+'% (최신 '+analyzedN+'개 기준)')
      : '평균 '+avg.toFixed(1)+'점';
    var itemName = useThree ? '리뷰 품질 3요소' : '리뷰 품질 4요소';
    items.push({key:'reviewQuality',name:itemName,cat:'review',max:5,score:s,detail:detailStr,comment:c});
  } else pushNA('reviewQuality',(isBeauty?'리뷰 품질 3요소':'리뷰 품질 4요소'),'review',5,'리뷰 본문을 분석할 데이터가 부족해요');

  // #5 AI 브리핑 적합도 — 리뷰 본문 정보풍부/보통/단답 분류로 채점 (참조 사이트와 동일)
  if(hasReviewDetail && api.aiBriefing){
    var ab = api.aiBriefing;
    var posRate = ab.positiveRate || 0;
    var as,ac;
    if(posRate>=55){as=5;ac='리뷰 절반 넘게가 정보가 풍부해요. 네이버 AI 브리핑이 이 리뷰들을 골라 손님에게 요약해줍니다';}
    else if(posRate>=42){as=4.5;ac='AI가 쓸 만한 리뷰가 많아요. 리뷰 가이드만 한 번 더 다듬으면 만점이에요';}
    else if(posRate>=32){as=4;ac='좋아요. 단답 리뷰만 조금 더 줄이면 AI 브리핑 노출이 더 늘어요';}
    else if(posRate>=24){as=3;ac='괜찮아요. 다만 단답 리뷰도 적지 않아요. 메뉴·상황이 들어간 리뷰를 더 유도해보세요';}
    else if(posRate>=16){as=2;ac='리뷰는 쌓이는데 AI가 쓸 만한 건 적어요. "맛있어요" 같은 단답은 AI가 버려요';}
    else if(posRate>=9){as=1;ac='리뷰 대부분이 단답이라 AI 브리핑에 거의 안 쓰여요. 리뷰 가이드부터 같이 만들어봐요';}
    else if(posRate>=1){as=0.5;ac='AI가 요약할 만한 리뷰가 거의 없어요. 메뉴명·가격·상황·솔직한 평가가 담긴 리뷰가 필요해요';}
    else{as=0;ac='사장님, AI 브리핑에 쓰일 리뷰가 0건이에요. 가장 급한 항목이에요';}
    var aN = api.reviewsAnalyzed || 50;
    var aDetail = 'AI가 쓸 만한 리뷰 '+posRate+'% (정보풍부 '+ab.positiveRate+'% / 보통 '+ab.semiRate+'% / 단답 '+ab.negativeRate+'% · 최신 '+aN+'개 기준)';
    items.push({key:'aiBriefing',name:'AI 브리핑 적합도',cat:'review',max:5,score:as,detail:aDetail,comment:ac});
  } else pushNA('aiBriefing','AI 브리핑 적합도','review',5,'네이버 AI 브리핑 노출 적합도는 직접 확인이 필요해요');

  // #6 블로그/카페 리뷰 (5/7) — 의료기관 등 광고심의 대상 업종은 진단 제외(N/A)
  if(naKeys.has('blogReview')){
    pushNA('blogReview','블로그 리뷰','review',PTS_BLOG_REVIEW,'의료기관은 체험단·후기 유치가 환자 유인 광고로 금지되어 있어 진단에서 제외했어요');
  } else {
    const b=api.blogCafeReviewCount||0; let s,c;
    if(PTS_BLOG_REVIEW===7){
      if(b>=100){s=7;}else if(b>=50){s=5.5;}else if(b>=30){s=4;}else if(b>=10){s=2.5;}else if(b>=1){s=1;}else{s=0;}
    } else {
      if(b>=100){s=5;}else if(b>=50){s=4;}else if(b>=30){s=3;}else if(b>=10){s=2;}else if(b>=1){s=1;}else{s=0;}
    }
    if(b>=50) c='블로그 리뷰가 풍성해요. 검색 노출에 큰 힘이 돼요';
    else if(b>=10) c='블로그 리뷰가 쌓이고 있어요. 체험단을 활용하면 더 빨라져요';
    else c='블로그 리뷰가 적어요. 체험단·블로거 협업을 고려해보세요';
    items.push({key:'blogReview',name:'블로그 리뷰',cat:'review',max:PTS_BLOG_REVIEW,score:s,detail:b+'개',comment:c});
  }

  // #7 별점 (5) — 매장이 별점을 숨기면(starRating null) N/A
  {
    const star=api.starRating;
    if(star===null||star===undefined||star===0){
      pushNA('starRating','별점','review',5,'아직 별점이 없거나 매장이 별점을 비공개로 설정했어요');
    } else {
      const d=Math.round(star*10)/10; let s,c;
      if(d>=4.7){s=5;c='별점이 아주 높으세요. 이 별점이 고객의 첫 클릭을 만들어요';}
      else if(d>=4.5){s=4.5;c='별점 좋아요. 4.7 이상은 클릭률이 확 달라져요';}
      else if(d>=4.3){s=4;c='괜찮아요. 5점 리뷰를 더 받아 4.5+ 구간 진입을 노려보세요';}
      else if(d>=4.0){s=3;c='4점대 진입했지만 4.5 미만은 클릭에서 손해예요. 5점 리뷰 확보가 핵심';}
      else if(d>=3.5){s=2;c='별점이 아쉬워요. 3점대는 고객이 클릭을 망설이는 구간이에요';}
      else if(d>=3.0){s=1;c='별점이 낮아 상위노출돼도 클릭이 안 돼요. 5점 리뷰 확보가 급해요';}
      else{s=0;c='별점이 위험 수준이에요. 운영 점검부터 같이 해야 합니다';}
      items.push({key:'starRating',name:'별점',cat:'review',max:5,score:s,detail:d+'점',comment:c});
    }
  }

  // #8 리뷰 답글 비율 (5)
  if(hasReviewDetail){
    const rr=api.replyRate||0; let s,c;
    if(rr>=95){s=PTS_REPLY_RATE;c='거의 모든 리뷰에 답글 달고 계시네요. 이게 진짜 실력이에요';}
    else if(rr>=85){s=PTS_REPLY_RATE*0.83;c='훌륭해요. 빠진 몇 개만 채우면 완벽합니다';}
    else if(rr>=70){s=PTS_REPLY_RATE*0.67;c='잘 하고 계세요. 답글은 신규 손님을 위한 광고예요. 조금만 더요';}
    else if(rr>=55){s=PTS_REPLY_RATE*0.5;c='반 이상은 달고 계시네요. 나머지도 채워보시겠어요?';}
    else if(rr>=40){s=PTS_REPLY_RATE*0.33;c='답글 없는 리뷰가 꽤 있어요. 신규 손님이 보고 있어요';}
    else if(rr>=25){s=PTS_REPLY_RATE*0.25;c='답글이 좀 부족해요. 하루에 3개씩만 달아보세요';}
    else if(rr>=10){s=PTS_REPLY_RATE*0.12;c='리뷰 답글이 거의 없어요. 답글도 친절도 점수에 반영됩니다';}
    else{s=0;c='답글부터 시작하셔야 돼요. 답글은 신규 고객을 위한 거예요';}
    s=Math.round(s*2)/2;
    items.push({key:'reviewReply',name:'리뷰 답글 비율',cat:'review',max:PTS_REPLY_RATE,score:s,detail:rr+'%',comment:c});
  } else pushNA('reviewReply','리뷰 답글 비율','review',PTS_REPLY_RATE,'리뷰 답글 비율은 직접 확인이 필요해요');

  // #9 저장 수 (7) — 공개 데이터 미노출 → N/A
  if(api.saveCount===null||api.saveCount===undefined){
    pushNA('saveCount','저장 수','review',7,'이 업종/매장은 네이버에서 저장 수를 제공하지 않아요. 점수 계산에서 제외했어요');
  } else {
    const sc=api.saveCount; let s,c;
    if(sc>=3000){s=7;}else if(sc>=2000){s=5.5;}else if(sc>=1000){s=4;}else if(sc>=500){s=3;}else if(sc>=200){s=1.5;}else{s=0.5;}
    c='저장 수는 고객의 \'가고 싶은 리스트\' 등록 신호예요';
    items.push({key:'saveCount',name:'저장 수',cat:'review',max:7,score:s,detail:sc.toLocaleString()+'개',comment:c});
  }

  // #10 사진 리뷰 비율 (5)
  if(hasReviewDetail){
    const pr=api.photoReviewRate||0; let s,c;
    if(pr>=60){s=5;c='사진 리뷰가 많으시네요. 신규 손님 전환에 진짜 큰 힘이에요';}
    else if(pr>=45){s=4;c='절반 가까이 사진이 있어요. 리뷰 가이드에 \'사진 찍어주세요\' 한 줄만 추가해보세요';}
    else if(pr>=30){s=3;c='나쁘지 않아요. 사진 리뷰가 더 늘면 체류시간이 확 올라가요';}
    else if(pr>=15){s=2;c='사진 리뷰가 좀 적어요. 포토존을 만들어보시는 것도 방법이에요';}
    else{s=1;c='사진 없는 리뷰는 신규 손님한테 설득력이 떨어져요';}
    items.push({key:'photoReview',name:'사진 리뷰 비율',cat:'review',max:5,score:s,detail:pr+'%',comment:c});
  } else pushNA('photoReview','사진 리뷰 비율','review',5,'사진 리뷰 비율 데이터를 가져올 수 없었어요');

  /* ── 시스템 & 결제 ── */

  if(isAccommodation){
    // 숙박업: 참조 사이트와 동일하게 네이버 페이(3) + 숙박 예약 연결(3) = 6점 만점
    // #7 네이버 페이 (3)
    {
      const has=!!api.hasNPay; const s=has?3:0;
      const c=has?'네이버 페이 쓰고 계시는군요. 결제 데이터가 붙으면 네이버가 우리 가게를 더 잘 알게 돼요':'네이버 페이를 연결하면 결제가 편해지고 노출에도 도움이 돼요';
      items.push({key:'npay',name:'네이버 페이',cat:'system',max:3,score:s,detail:has?'활성':'미사용',comment:c});
    }
    // #8 숙박 예약 연결 (3)
    {
      const has=!!api.hasBooking; const s=has?3:0;
      const c=has?'네이버 예약 연결 잘 되어 있어요. 고객이 영업시간 밖에도 알아서 예약해요':'숙박 예약을 연결하면 고객이 24시간 알아서 예약할 수 있어요';
      items.push({key:'booking',name:'숙박 예약 연결',cat:'system',max:3,score:s,detail:has?'연결됨':'미연결',comment:c});
    }
  } else {
    // 참조 사이트와 동일: 시스템&결제 = 네이버 예약(6) + 네이버 페이(3) + 쿠폰(2)
    //   (스마트콜·톡톡은 콘텐츠&운영 영역으로 이동)

    // #8 네이버 예약 (6)
    if(naKeys.has('booking')){ /* skip */ }
    else {
      const has=!!api.hasBooking; const s=has?6:0;
      const c=has?'오, 이건 잘 해놓으셨네요. AI 에이전트 시대엔 예약 가능한 가게가 먼저 추천돼요':'이거 안 켜놓으시면 손님이 우리 가게를 못 찾아요. 무료인데 안 하시면 손해예요!';
      items.push({key:'booking',name:'네이버 예약',cat:'system',max:6,score:s,detail:has?'활성':'미활성',comment:c});
    }

    // #9 네이버 페이 (3)
    {
      const has=!!api.hasNPay; const s=has?3:0;
      const c=has?'네이버 페이 쓰고 계시네요. 결제 데이터가 쌓이면 네이버가 우리 가게를 더 잘 알게 돼요':'네이버 페이를 연동하면 결제 데이터가 AI 추천에 중요한 데이터가 됩니다';
      items.push({key:'npay',name:'네이버 페이',cat:'system',max:3,score:s,detail:has?'활성':'미활성',comment:c});
    }

    // #11 쿠폰 (2) — 의료기관은 환자 유인 광고 금지로 N/A
    if(naKeys.has('coupon')){
      pushNA('coupon','쿠폰','system',2,'의료기관은 쿠폰·할인이 환자 유인 광고로 금지되어 있어 진단에서 제외했어요');
    } else {
      const has=!!api.hasCoupon; const s=has?2:0;
      const c=has?'쿠폰 잘 활용하고 계시네요':'쿠폰이 없으시네요. \'100% 공짜\' 쿠폰 하나 만들어보세요. 다운로드 폭발해요';
      items.push({key:'coupon',name:'쿠폰',cat:'system',max:2,score:s,detail:has?'있음':'없음',comment:c});
    }
  }

  // #신규 톡톡 응답률 (system, 3) — 응답률은 점주 전용 지표라 공개 데이터엔 대개 없음.
  //   값이 실제로 있으면 점수화, 톡톡은 연결됐는데 응답률만 없으면 N/A,
  //   톡톡 자체가 미연결이면 0점('연결 안 함'은 개선 가능한 명확한 상태).
  {
    const rate=api.talkResponseRate;
    const connected=!!api.hasTalkTalkAuto;
    if(rate!==null && rate!==undefined && !isNaN(rate)){
      let s,c;
      if(rate>=90){s=3;c='톡톡 응답이 거의 완벽하세요. 빠른 응답이 예약 전환을 만들어요';}
      else if(rate>=70){s=2;c='응답을 잘 하고 계세요. 조금만 더 빠르면 만점이에요';}
      else if(rate>=50){s=1;c='놓치는 문의가 있어요. 알림을 켜고 빠르게 답해보세요';}
      else{s=0;c='톡톡 문의에 답이 잘 안 나가고 있어요. 신규 손님을 놓치고 있어요';}
      const tt=api.talkResponseTime?(' · '+api.talkResponseTime):'';
      items.push({key:'talkResponse',name:'톡톡 응답률',cat:'system',max:3,score:s,detail:rate+'%'+tt,comment:c});
    } else if(connected){
      pushNA('talkResponse','톡톡 응답률','system',3,'톡톡은 연결돼 있지만 응답률은 점주만 볼 수 있어 자동 진단에서 제외했어요');
    } else {
      items.push({key:'talkResponse',name:'톡톡 응답률',cat:'system',max:3,score:0,detail:'톡톡 미연결',comment:'톡톡을 연결하면 손님이 부담 없이 문의하고, 응답률도 노출돼요'});
    }
  }

  /* ── 기본정보 ── */

  // #12 업체 등록 사진 (4)
  {
    const n=api.imageCount||0; let s,c;
    if(n>=30){s=4;c='사진이 풍부해요. 손님이 가게를 미리 그려볼 수 있어요';}
    else if(n>=15){s=3;c='사진이 어느 정도 있어요. 메뉴·내부 사진을 더 추가해보세요';}
    else if(n>=5){s=2;c='사진이 부족해요. 대표 메뉴 사진을 늘려보세요';}
    else if(n>0){s=1;c='사진이 너무 적어요. 첫인상이 약해질 수 있어요';}
    else{s=0;c='등록된 사진이 거의 없어요. 오늘 10장만 올려보세요';}
    items.push({key:'imageCount',name:'업체 등록 사진',cat:'basic',max:4,score:s,detail:n+'장',comment:c});
  }

  // #13 편의시설 등록 (2)
  {
    const arr=api.conveniences||[]; const n=arr.length; let s,c;
    if(n>=5){s=2;c='편의시설이 잘 등록돼 있어요';}
    else if(n>=2){s=1;c='편의시설을 더 등록하면 검색 필터에 더 잘 걸려요';}
    else{s=0;c='편의시설이 등록돼 있지 않아요. 주차·예약 등을 채워보세요';}
    items.push({key:'convenience',name:'편의시설 등록',cat:'basic',max:2,score:s,detail:n+'개',comment:c});
  }

  if(isAccommodation){
    // 숙박업: 참조 사이트와 동일하게 영업시간(3) + 객실 등록(4) + 객실 가격 공개(3) + 체크인아웃(2)
    // #14 영업시간 (3) — 숙박업은 운영 시작이 명확하므로 점수화
    {
      const has=!!api.hasBusinessHours; const s=has?3:0;
      const c=has?'운영 시간(시작)이 등록돼 있어요':'사장님, 영업시간이 없으면 손님이 \'지금 운영하나?\' 확인이 안 돼요';
      items.push({key:'businessHours',name:'영업시간',cat:'basic',max:3,score:s,detail:has?'등록됨':'미등록',comment:c});
    }
    // #15 객실 등록 (4)
    {
      const n=api.totalMenus||0; let s,c;
      if(n>=6){s=4;c='객실 6개 등록, 충분해요';}
      else if(n>=3){s=3;c='객실이 어느 정도 등록돼 있어요. 더 채우면 선택폭이 넓어져요';}
      else if(n>=1){s=2;c='객실이 적게 등록돼 있어요. 객실 타입별로 모두 올려주세요';}
      else{s=0;c='등록된 객실이 없어요. 객실 타입부터 등록해주세요';}
      items.push({key:'roomCount',name:'객실 등록',cat:'basic',max:4,score:s,detail:n+'개',comment:c});
    }
    // #16 객실 가격 공개 (3)
    {
      const total=api.totalMenus||0; const rate=api.menuPriceRate||0; let s,c;
      if(total===0){ s=0; c='객실 가격을 공개해주세요'; }
      else if(rate>=90){s=3;c='가격 빠진 객실이 없어요. 가격 표기는 예약 전환에 큰 도움이 돼요';}
      else if(rate>=60){s=2;c='가격 공개율이 좋아요. 나머지 객실도 채워보세요';}
      else if(rate>0){s=1;c='가격이 빠진 객실이 있어요. 고객은 가격을 먼저 봐요';}
      else{s=0;c='객실 가격이 비어 있어요. 가격을 공개하면 문의가 줄어요';}
      items.push({key:'roomPrice',name:'객실 가격 공개',cat:'basic',max:3,score:s,detail:total+'개 중 '+rate+'% 가격공개',comment:c});
    }
    // #17 체크인/체크아웃 명시 (2)
    {
      const has=!!api.hasCheckInOut; const s=has?2:0;
      const c=has?'체크인/체크아웃 시간이 잘 명시돼 있어요':'체크인/체크아웃 시간을 명시하면 문의가 줄고 신뢰가 올라가요';
      items.push({key:'checkInOut',name:'체크인/체크아웃 명시',cat:'basic',max:2,score:s,detail:has?'명시됨':'미명시',comment:c});
    }
  } else if(isEducationOrRealestate){
    // 학원·부동산(중개): 메뉴/가격 개념이 약해 menuPrice/menuPhoto 대신
    // 콘텐츠 영역의 전용 항목(소개글 충실도·프로그램/매물·예약상담)으로 대체.
    // basic 영역은 영업시간만 점수화.
    {
      const has=!!api.hasBusinessHours; const s=has?2:0;
      const c=has?'영업시간이 등록돼 있어요':'영업시간을 등록하지 않으면 손님이 헛걸음할 수 있어요';
      items.push({key:'businessHours',name:'영업시간 등록',cat:'basic',max:2,score:s,detail:has?'등록됨':'미등록',comment:c});
    }
  } else {
    // #14 영업시간 (3) — 참조 사이트와 동일 (미등록 시 손님 이탈 큰 영향)
    if(naKeys.has('businessHours')){
      pushNA('businessHours','영업시간','basic',3,'이 업종은 영업시간 항목이 진단 대상이 아니에요');
    } else {
      const has=!!api.hasBusinessHours; const s=has?3:0;
      const c=has?'영업시간이 잘 등록되어 있어요':'영업시간이 없으면 손님이 \'지금 영업하나?\' 확인을 못 해요';
      items.push({key:'businessHours',name:'영업시간',cat:'basic',max:3,score:s,detail:has?'등록됨':'미등록',comment:c});
    }

    // #16 메뉴 가격 입력율 (2) — 비뷰티 Tier2(헬스 등)는 항목 제거, 메뉴 개념 없는 업종은 N/A
    if(industry.tier===2 && !isBeauty){ /* 항목 제외 — 정규화가 자동 처리 */ }
    else if(naKeys.has('menuPrice')){
      pushNA('menuPrice',menuWord+' 가격 입력율','basic',2,'이 업종은 '+menuWord+' 가격 항목이 진단 대상이 아니에요');
    } else {
      const total=api.totalMenus||0; const rate=api.menuPriceRate||0; let s,c;
      if(total===0){ s=0; c=menuWord+'가 등록돼 있지 않아요. 가장 먼저 채워야 할 항목이에요'; }
      else if(rate>=90){s=2;c='가격 다 입력하셨네요';}
      else if(rate>=60){s=1;c='가격 빠진 '+menuWord+'가 있어요';}
      else{s=0;c='가격이 거의 없어요. 가격 모르면 예약 안 해요';}
      items.push({key:'menuPrice',name:menuWord+' 가격 입력율',cat:'basic',max:2,score:s,detail:total+'개 중 '+rate+'% 가격공개',comment:c});
    }

    // #17 메뉴 사진 비율 (2) — 미용실·네일은 "스타일 탭", 그 외 Tier2는 항목 제거
    if(industry.tier===2 && !hasStyleTab){ /* 항목 제외 */ }
    else if(isBeauty && hasStyleTab){
      const sc=api.styleCount||0; let s,c,d;
      if(sc>=50){s=2;c='스타일 탭에 포트폴리오가 충분해요. 잘 하고 계세요';d=sc+'장';}
      else if(sc>=20){s=1.5;c='스타일 탭이 괜찮아요. 꾸준히 추가하면 더 좋아요';d=sc+'장';}
      else if(sc>0){s=1;c='스타일 탭에 결과물을 더 올려보세요. 고객이 예약 전에 가장 많이 보는 곳이에요';d=sc+'장';}
      else{s=0.5;c='스타일 탭이 비어 있어요. 결과물 사진을 올려주세요. 고객이 예약 전에 가장 많이 보는 곳이에요';d='부족';}
      items.push({key:'menuPhoto',name:'스타일 탭',cat:'basic',max:2,score:s,detail:d,comment:c});
    } else if(naKeys.has('menuPhoto')){
      pushNA('menuPhoto',menuWord+' 사진 비율','basic',2,'이 업종은 '+menuWord+' 사진 항목이 진단 대상이 아니에요');
    } else {
      const total=api.totalMenus||0; const rate=api.menuPhotoRate||0; let s,c;
      if(total===0){ s=0; c=menuWord+' 사진을 등록해주세요'; }
      else if(rate>=90){s=2;c=menuWord+'마다 사진이 있어요. 잘 하고 계세요';}
      else if(rate>=60){s=1;c='사진 없는 '+menuWord+'가 일부 있어요. 빠진 것만 채우면 됩니다';}
      else if(rate>=30){s=0.5;c=menuWord+' 사진이 좀 부족해요. 사진 있는 '+menuWord+'가 주문이 더 잘 돼요';}
      else{s=0;c=menuWord+'에 사진이 거의 없어요';}
      items.push({key:'menuPhoto',name:menuWord+' 사진 비율',cat:'basic',max:2,score:s,detail:rate+'% 사진등록',comment:c});
    }
  }

  /* ── 콘텐츠 & 운영 ── */

  // #17 대표키워드 (5)
  {
    const kwList=(user.keywords&&user.keywords.length)?user.keywords:(api.keywords||[]);
    const kw=kwList.length; let s,c;
    if(kw>=5){s=5;c='대표키워드를 꽉 채우셨네요. 노출 기회를 다 잡고 있어요';}
    else if(kw>=3){s=3;c='키워드를 더 채워보세요. 5개를 다 쓰는 게 좋아요';}
    else if(kw>=1){s=2;c='키워드가 부족해요. 손님이 검색할 단어로 5개를 채워보세요';}
    else{s=0;c='대표키워드가 비어 있어요. 노출 기회를 놓치고 있어요';}
    const list=kwList.join(', ');
    items.push({key:'keywords',name:'대표키워드',cat:'content',max:5,score:s,detail:kw+'개'+(list?(' · '+list):''),comment:c});
  }

  // #18 상세설명 (5) — 학원·부동산은 "소개글 충실도(3)+프로그램/매물(2)+예약상담(1)"로 대체
  if(isEducationOrRealestate){
    // 소개글 충실도 (3)
    {
      const desc=(user.description||api.description||''); const len=desc.length; let s,c;
      if(len>=500){s=3;c='소개글이 잘 쓰여 있어요. 학원·중개 업종에서는 소개글이 가장 큰 설득 수단이에요';}
      else if(len>=300){s=2;c='소개글이 어느 정도 있지만 더 구체적으로 쓸 수 있어요';}
      else if(len>=100){s=1;c='소개글이 너무 짧아요. 수업 과정·전문 분야·경력을 추가해보세요';}
      else if(len>=1){s=0.5;c='소개글이 거의 없어요';}
      else{s=0;c='소개글이 비어있어요. 손님이 가게를 이해할 수 없어요';}
      items.push({key:'specialDescription',name:'소개글 충실도',cat:'content',max:3,score:s,detail:len+'자',comment:c});
    }
    // 프로그램/매물 등록 (2)
    {
      const total=api.totalMenus||0; const serviceName=isEducation?'수강료·프로그램 등록':'서비스 메뉴(매물 유형)'; let s,c;
      if(total>=5){s=2;c='프로그램/서비스 메뉴가 충분해요';}
      else if(total>=3){s=1.5;c='조금 더 세분화할 수 있어요';}
      else if(total>=1){s=0.5;c='너무 적어요';}
      else{s=0;c=isEducation?'수강료나 프로그램이 없으면 학부모가 비교하기 어려워요':'매물 유형이나 상담 서비스를 메뉴로 나눠두면 손님이 전문 분야를 빨리 이해해요';}
      items.push({key:'specialMenu',name:serviceName,cat:'content',max:2,score:s,detail:total+'개',comment:c});
    }
    // 예약/상담 연결 (1)
    {
      const hasResvFacility=Array.isArray(api.conveniences)&&api.conveniences.some(function(it){return String(it).includes('예약');});
      const has=!!api.hasBooking||hasResvFacility; const s=has?1:0;
      const c=has?(isEducation?'체험수업이나 상담 예약 경로가 보여요':'방문상담 예약 경로가 보여요')
        :(isEducation?'체험수업 예약이 없으면 문의 전환이 떨어져요':'방문상담 예약이 없으면 매물 문의가 끊기기 쉬워요');
      items.push({key:'consultBooking',name:'예약/상담 연결',cat:'content',max:1,score:s,detail:has?'연결됨':'미연결',comment:c});
    }
  } else {
    const desc=(user.description||api.description||'');
    const len=desc.length; let s=0; const found=[];
    if(len>=400){s+=4;found.push('충실한 설명');}
    else if(len>=200){s+=3;found.push('설명 충분');}
    else if(len>=100){s+=2;}
    else if(len>0){s+=1;}
    const kws=['주차','예약','단체','룸','객실','코스','가격','메뉴','위치','역','분 거리','체험','이벤트','할인','문의','영업','추천','시설','바비큐','전망'];
    let hit=0; kws.forEach(k=>{ if(desc.includes(k)){hit++;} });
    if(hit>=3){s+=1; if(!found.length)found.push('핵심정보 포함');}
    if(s>5)s=5;
    let c;
    if(s>=5)c='상세설명이 충실해요. 검색 키워드도 잘 녹아 있어요';
    else if(s>=3)c='상세설명이 잘 작성돼 있어요. 검색 키워드를 더 녹여보세요';
    else if(len>0)c='상세설명이 짧아요. 손님이 검색할 단어를 녹여서 길게 써보세요';
    else c='상세설명이 비어 있어요. 가게 이야기와 검색 키워드를 채워보세요';
    items.push({key:'description',name:'상세설명',cat:'content',max:5,score:s,detail:len+'자'+(found.length?(' · '+found.join(', ')):''),comment:c});
  }

  // #19 찾아오는 길 (3) — 사용자 확인값
  // 충분히 안내가 있으면(글자 수+교통/주차) 만점을 주도록 현실화.
  {
    const dir=(user.direction||api.directionInfoAuto||''); const len=dir.length; let s=0; const found=[];
    if(len>=100)s+=2; else if(len>=50)s+=1;
    if(/주차|발렛|파킹/.test(dir)){found.push('주차정보');}
    if(/역|출구|버스|택시|도보|분|걸어서|건너편|맞은편|골목|사거리|IC|터미널|네비|네이게이션|네비게이션|드라이브/.test(dir)){s+=1;found.push('교통정보');}
    else if(/주차|발렛|파킹/.test(dir)){s+=1;}
    if(s>3)s=3;
    let c;
    if(s>=3)c='찾아오는 길이 친절하게 안내돼 있어요';
    else if(s>=1)c='찾아오는 길을 더 구체적으로 적으면 좋아요 (주차·대중교통)';
    else c='찾아오는 길이 비어 있어요. 길 안내를 적으면 헛걸음이 줄어요';
    items.push({key:'direction',name:'찾아오는 길',cat:'content',max:3,score:s,detail:len>0?(len+'자'+(found.length?(' · '+found.join(', ')):'')):'미등록',comment:c});
  }

  // 참조 사이트와 동일하게 스마트콜·네이버 톡톡을 콘텐츠&운영에 배치 (전 업종)
  // 스마트콜·톡톡은 자동 수집값(api) 우선, 없으면 사용자 확인값(user) 사용
  {
    const has=!!(api.hasSmartCallAuto||user.smartcall); const s=has?3:0;
    const c=has?'스마트콜 잘 켜놓으셨어요':'스마트콜을 켜면 고객이 클릭 한 번으로 전화할 수 있어요. 켜두세요';
    items.push({key:'smartcall',name:'스마트콜',cat:'content',max:3,score:s,detail:has?'사용 중':'미사용',comment:c});
  }
  {
    const has=!!(api.hasTalkTalkAuto||user.talktalk); const s=has?3:0;
    const c=has?'톡톡 잘 켜놓으셨어요. 야간 문의도 받을 수 있으니 좋아요':'톡톡을 켜면 손님이 전화 안 하고도 문의할 수 있어요. 특히 예약 문의가 늘어나요';
    items.push({key:'talktalk',name:'네이버 톡톡',cat:'content',max:3,score:s,detail:has?'사용 중':'미사용',comment:c});
  }

  // #20 소식 (3) — 사용자 확인값(news 토글). 의료기관은 N/A 항목으로 표시(참조 사이트와 동일)
  if(naKeys.has('news')){
    pushNA('news','소식','content',3,'의료기관의 소식·이벤트 게시는 의료광고 사전심의 대상이라 진단에서 제외했어요');
  }
  else {
    const has=!!user.news; const s=has?3:0;
    const c=has?'최근 소식을 올리고 있어요. 활발한 가게로 보여요':'소식을 올리지 않으면 "관리 안 하는 가게"로 보일 수 있어요';
    items.push({key:'news',name:'소식 (최근 1개월)',cat:'content',max:3,score:s,detail:has?'있음':'없음',comment:c});
  }

  // #신규 클립/동영상 (content, 3) — 클립 수를 자동 확인하지 못하면 N/A
  {
    const cc=api.clipCount;
    if(cc===null||cc===undefined){
      pushNA('clip','클립/동영상','content',3,'클립/동영상 등록 여부를 자동으로 확인하지 못했어요. 직접 확인해주세요');
    } else {
      let s,c;
      if(cc>=3){s=3;c='클립을 꾸준히 올리고 계시네요. 네이버가 영상 콘텐츠를 강하게 밀고 있어서 상위노출에 큰 도움이 돼요';}
      else if(cc>=1){s=1.5;c='클립을 시작하셨네요. 1~2개 더 올리면 체류시간이 확 올라가요';}
      else{s=0;c='클립이 아직 없어요. 30초짜리 매장 영상 하나만 올려도 노출이 달라져요';}
      items.push({key:'clip',name:'클립/동영상',cat:'content',max:3,score:s,detail:cc+'개',comment:c});
    }
  }

  /* ── 합산 ── */
  const rawMax = items.reduce((a,i)=>a+(i.na?0:i.max),0);
  const rawScore = items.reduce((a,i)=>a+(i.na?0:i.score),0);
  const effectiveMax = rawMax;
  const displayScore = effectiveMax>0 ? Math.round((rawScore/effectiveMax)*100) : 0;

  // 등급
  let grade,gradeComment,gradeColor;
  if(displayScore>=90){grade='S';gradeComment='저 필요 없으시겠는데요? 진짜 잘 하고 계세요';gradeColor='#0E9F6E';}
  else if(displayScore>=75){grade='A';gradeComment='기본기가 탄탄하세요. 여기 몇 개만 잡으면 매출이 확 달라질 거예요';gradeColor='#0284c7';}
  else if(displayScore>=60){grade='B';gradeComment='구조는 있는데 구멍이 좀 있어요. 지금 잡으면 늦지 않았어요';gradeColor='#6A35FF';}
  else if(displayScore>=40){grade='C';gradeComment='지금 손님이 들어왔다 나가고 있어요. 괜찮아요, 하나씩 같이 잡아봐요';gradeColor='#E8A200';}
  else{grade='D';gradeComment='여기서부터 시작하면 돼요. 하나만 먼저 해볼까요?';gradeColor='#DC2626';}

  // 카테고리 점수율
  const catScores={};
  for(const cat of ['basic','review','system','content']){
    const ci=items.filter(i=>i.cat===cat&&!i.na);
    const got=ci.reduce((a,i)=>a+i.score,0); const mx=ci.reduce((a,i)=>a+i.max,0);
    catScores[cat]= mx>0?got/mx:0;
  }

  // 페르소나
  let persona,personaDesc,personaIcon;
  if(displayScore<40){persona='첫걸음 떼는 사장님';personaIcon='🌱';personaDesc='아직 플레이스에 채워 넣을 게 많아요. 걱정 마세요, 기본부터 차근차근 채우면 점수가 쑥 올라갑니다. 영업시간과 메뉴부터 시작해볼까요?';}
  else if(catScores.basic>=0.6 && catScores.review<0.4 && catScores.system<0.4){persona='밑작업 끝낸 사장님';personaIcon='🛠️';personaDesc='기본기는 야무지게 다져두셨어요. 이제 리뷰와 전환 장치만 더하면 됩니다. 여기만 채우면 결과가 눈에 띄게 달라져요.';}
  else if(catScores.basic>=0.5 && catScores.content<0.35){persona='다시 시동 걸 사장님';personaIcon='🔄';personaDesc='예전에 잘 세팅해두신 게 보여요. 다만 한동안 업데이트가 뜸했네요. 소식이나 리뷰 답글만 다시 챙겨도 금방 활기를 되찾아요.';}
  else if(displayScore>=75){persona='결승선 코앞의 사장님';personaIcon='🎖️';personaDesc='거의 다 하셨어요. 남은 몇 개만 잡으면 상위 1% 매장입니다. 아래에서 마지막 빈칸만 확인해보세요.';}
  else{persona='우선순위만 잡으면 되는 사장님';personaIcon='🧭';personaDesc='열심히 여러 가지를 해오셨는데 곳곳에 빈틈이 있어요. 무엇부터 손볼지 순서를 정리해드릴게요.';}

  return {
    name:api.name||'가게', category:api.category||'', address:api.roadAddress||'',
    industry, displayScore, rawScore, effectiveMax, naMaxScore,
    grade, gradeComment, gradeColor,
    persona, personaDesc, personaIcon, catScores, items
  };
}
`
