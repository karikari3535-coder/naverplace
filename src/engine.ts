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
    if(r7>=40){s=PTS_RECENT7;c='최상위권 유입 수준입니다. 지금의 리뷰 흐름이 상위노출을 이끌고 있습니다.';}
    else if(r7>=35){s=isNonBeautyT2?12:9;c='매우 우수한 페이스입니다. 이 추세라면 상위권 노출이 안정적으로 유지됩니다.';}
    else if(r7>=30){s=isNonBeautyT2?10:8;c='리뷰가 꾸준히 쌓이고 있습니다. 좋은 흐름입니다.';}
    else if(r7>=25){s=isNonBeautyT2?9:7;c='양호한 상태입니다. 리뷰 작성 가이드를 더하면 적립 속도가 빨라집니다.';}
    else if(r7>=20){s=isNonBeautyT2?7.5:6;c='준수한 수준입니다. 조금만 보완하면 상위 구간 진입이 가능합니다.';}
    else if(r7>=15){s=isNonBeautyT2?6:5;c='평균 수준입니다. 리뷰 유도 이벤트를 한 번 운영해보세요.';}
    else if(r7>=10){s=isNonBeautyT2?5:4;c='지금부터 리뷰 관리를 체계화하면 한 달 안에 효과가 나타납니다.';}
    else if(r7>=7){s=isNonBeautyT2?4:3;c='리뷰 작성 가이드를 만들어 적립량을 늘려보세요.';}
    else if(r7>=4){s=isNonBeautyT2?2.5:2;c='리뷰 유입이 부족합니다. 결제 직후 리뷰 요청 과정을 만들어보세요.';}
    else if(r7>=1){s=isNonBeautyT2?1.5:1;c='최근 7일 리뷰가 거의 없습니다. 오늘부터 리뷰 요청을 시작해보세요.';}
    else{s=0;c='최근 7일 리뷰가 없습니다. 리뷰 작성 가이드 정비가 시급합니다.';}
    items.push({key:'recent7',name:'최근 7일 리뷰',cat:'review',max:PTS_RECENT7,score:s,detail:r7+'개',comment:c});
  } else pushNA('recent7','최근 7일 리뷰','review',PTS_RECENT7,'리뷰 데이터를 가져올 수 없었어요');

  // #2 최근 30일 리뷰 (7)
  if(hasReviewDetail){
    const r30=api.last30DaysReviews||0; let s,c;
    if(r30>=45){s=7;c='월간 리뷰 적립이 매우 활발합니다. 지금 흐름을 유지하시면 됩니다.';}
    else if(r30>=40){s=6.5;c='월간 리뷰 지표가 우수합니다. 꾸준히 관리되고 있습니다.';}
    else if(r30>=35){s=6;c='리뷰 적립이 안정적입니다. 상위 그룹에 해당합니다.';}
    else if(r30>=30){s=5;c='양호한 상태입니다. 리뷰 가이드를 강화하면 추가 상승 여지가 있습니다.';}
    else if(r30>=25){s=4;c='준수한 수준입니다. 주 2~3건만 더해도 구간이 달라집니다.';}
    else if(r30>=20){s=3;c='평균 수준입니다. 영수증 리뷰 이벤트를 도입해보세요.';}
    else if(r30>=15){s=2.5;c='하루 1건 수준입니다. 가이드와 이벤트를 함께 운영해 속도를 높여보세요.';}
    else if(r30>=10){s=2;c='월간 리뷰가 다소 부족합니다. 직접 요청 과정을 점검해보세요.';}
    else if(r30>=5){s=1;c='월간 리뷰가 한 자릿수입니다. 리뷰 이벤트 세팅부터 진행해보세요.';}
    else if(r30>=1){s=0.5;c='월간 리뷰가 거의 없습니다. 오늘부터 적립을 시작해보세요.';}
    else{s=0;c='최근 한 달간 리뷰가 없습니다. 가장 먼저 조치가 필요한 항목입니다.';}
    items.push({key:'recent30',name:'최근 30일 리뷰',cat:'review',max:PTS_RECENT30,score:s,detail:r30+'개',comment:c});
  } else pushNA('recent30','최근 30일 리뷰','review',PTS_RECENT30,'리뷰 데이터를 가져올 수 없었어요');

  // #3 방문자 리뷰 총 수 (5)
  {
    const t=api.totalReviewCount||0; let s,c;
    if(t>=1000){s=5;c='리뷰 1,000건 이상으로 충분한 신뢰 지표를 확보했습니다.';}
    else if(t>=800){s=4.5;c='리뷰 적립량이 상위 수준입니다.';}
    else if(t>=600){s=4;c='리뷰 기반이 탄탄해 신뢰도가 충분합니다.';}
    else if(t>=500){s=3.5;c='500건 이상으로 안정적으로 관리되고 있습니다.';}
    else if(t>=400){s=3;c='양호한 적립량입니다. 지금처럼 계속 쌓아가시면 됩니다.';}
    else if(t>=300){s=2.5;c='300건을 넘었습니다. 이제 리뷰 품질 관리도 함께 신경 써보세요.';}
    else if(t>=200){s=2;c='준수한 수준입니다. 리뷰 이벤트로 적립을 더 빠르게 할 수 있습니다.';}
    else if(t>=150){s=1.5;c='리뷰 가이드를 마련하면 적립 속도가 빨라집니다.';}
    else if(t>=100){s=1;c='100건을 넘었지만 아직 부족합니다. 직접 요청이 가장 효과적입니다.';}
    else if(t>=50){s=0.5;c='리뷰가 100건 미만입니다. 가이드 정비부터 진행해보세요.';}
    else{s=0;c='리뷰가 50건 미만입니다. 오늘부터 적립을 시작해보세요.';}
    items.push({key:'totalReview',name:'방문자 리뷰 총 수',cat:'review',max:PTS_TOTAL_REV,score:s,detail:t.toLocaleString()+'개',comment:c});
  }

  // #4 리뷰 품질 — 뷰티는 동행 제외 3요소, 그 외 4요소 (참조 사이트와 동일)
  if(hasReviewDetail && api.reviewQualityAvg>0){
    var useThree = isBeauty;
    var avg = api.reviewQualityAvg; var s,c;
    if(useThree){
      if(avg>=1.9){s=5;c='리뷰 정보량이 우수합니다. 네이버 AI가 요약·추천에 활용하기 좋은 수준입니다.';}
      else if(avg>=1.5){s=4;c='구체적인 리뷰가 많습니다. 시술 목적·만족도가 담긴 리뷰가 추천에 유리합니다.';}
      else if(avg>=1.1){s=3;c='양호한 상태입니다. 가이드로 좀 더 구체적인 리뷰를 유도해보세요.';}
      else if(avg>=0.8){s=2;c='리뷰가 다소 단순합니다. 어떤 시술을 왜 받았는지 적도록 안내해보세요.';}
      else if(avg>=0.4){s=1;c='리뷰 가이드를 만들어보세요. 구체적 리뷰가 AI 추천의 핵심입니다.';}
      else{s=0.5;c='리뷰의 구체적 정보가 부족합니다. 가이드 정비로 개선해보세요.';}
    } else {
      if(avg>=2.5){s=5;c='리뷰 정보량이 우수합니다. 네이버 AI가 요약·추천에 활용하기 좋은 수준입니다.';}
      else if(avg>=2.0){s=4;c='구체적인 리뷰 비중이 높습니다. 동행·목적이 드러난 리뷰가 추천에 유리합니다.';}
      else if(avg>=1.5){s=3;c='양호한 상태입니다. 리뷰 가이드로 구체성을 더 끌어올려보세요.';}
      else if(avg>=1.0){s=2;c='리뷰가 다소 단순합니다. 누구와·왜·무엇을 했는지 안내를 더해보세요.';}
      else if(avg>=0.5){s=1;c='리뷰 가이드 도입이 필요합니다. 구체적 리뷰가 AI 추천의 핵심입니다.';}
      else{s=0.5;c='리뷰의 구체적 정보가 부족합니다. 가이드 정비로 개선해보세요.';}
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
    if(posRate>=55){as=5;ac='정보가 풍부한 리뷰 비중이 높습니다. 네이버 AI 브리핑이 이 리뷰들을 골라 고객에게 요약해줍니다.';}
    else if(posRate>=42){as=4.5;ac='AI가 활용할 만한 리뷰가 많습니다. 가이드를 한 번 더 다듬으면 만점 수준입니다.';}
    else if(posRate>=32){as=4;ac='양호한 상태입니다. 단답형 리뷰만 줄이면 AI 브리핑 노출이 더 늘어납니다.';}
    else if(posRate>=24){as=3;ac='준수하지만 단답형 리뷰도 적지 않습니다. 메뉴·상황이 담긴 리뷰를 더 유도해보세요.';}
    else if(posRate>=16){as=2;ac='리뷰는 쌓이지만 AI가 활용할 만한 비중은 낮습니다. 단답형 리뷰는 요약에 반영되지 않습니다.';}
    else if(posRate>=9){as=1;ac='대부분 단답형이라 AI 브리핑에 거의 반영되지 않습니다. 가이드 정비부터 시작해보세요.';}
    else if(posRate>=1){as=0.5;ac='AI가 요약할 만한 리뷰가 거의 없습니다. 메뉴명·가격·상황·솔직한 평가가 담긴 리뷰가 필요합니다.';}
    else{as=0;ac='AI 브리핑에 반영될 리뷰가 없습니다. 가장 먼저 조치가 필요한 항목입니다.';}
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
    if(b>=50) c='블로그 리뷰가 풍부합니다. 검색 노출에 큰 힘이 됩니다.';
    else if(b>=10) c='블로그 리뷰가 쌓이고 있습니다. 체험단을 활용하면 더 빨라집니다.';
    else c='블로그 리뷰가 부족합니다. 체험단·블로거 협업을 검토해보세요.';
    items.push({key:'blogReview',name:'블로그 리뷰',cat:'review',max:PTS_BLOG_REVIEW,score:s,detail:b+'개',comment:c});
  }

  // #7 별점 (5) — 매장이 별점을 숨기면(starRating null) N/A
  {
    const star=api.starRating;
    if(star===null||star===undefined||star===0){
      pushNA('starRating','별점','review',5,'아직 별점이 없거나 매장이 별점을 비공개로 설정했어요');
    } else {
      const d=Math.round(star*10)/10; let s,c;
      if(d>=4.7){s=5;c='별점이 매우 높습니다. 첫 클릭 전환을 이끄는 핵심 지표입니다.';}
      else if(d>=4.5){s=4.5;c='별점이 우수합니다. 4.7 이상 구간에서 클릭률이 더 올라갑니다.';}
      else if(d>=4.3){s=4;c='양호한 상태입니다. 5점 리뷰를 늘려 4.5 이상 구간 진입을 노려보세요.';}
      else if(d>=4.0){s=3;c='4점대에 진입했지만 4.5 미만은 클릭에서 불리합니다. 5점 리뷰 확보가 핵심입니다.';}
      else if(d>=3.5){s=2;c='별점이 아쉽습니다. 3점대는 고객이 클릭을 망설이는 구간입니다.';}
      else if(d>=3.0){s=1;c='별점이 낮아 상위노출되어도 클릭 전환이 어렵습니다. 5점 리뷰 확보가 시급합니다.';}
      else{s=0;c='별점이 위험 수준입니다. 운영 전반의 점검이 먼저입니다.';}
      items.push({key:'starRating',name:'별점',cat:'review',max:5,score:s,detail:d+'점',comment:c});
    }
  }

  // #8 리뷰 답글 비율 (5)
  if(hasReviewDetail){
    const rr=api.replyRate||0; let s,c;
    if(rr>=95){s=PTS_REPLY_RATE;c='거의 모든 리뷰에 답글이 작성되어 있습니다. 우수한 응대 수준입니다.';}
    else if(rr>=85){s=PTS_REPLY_RATE*0.83;c='응대율이 높습니다. 일부 누락분만 보완하면 완성도가 높아집니다.';}
    else if(rr>=70){s=PTS_REPLY_RATE*0.67;c='양호한 상태입니다. 답글은 신규 고객에게 노출되는 응대 지표이니 조금 더 채워보세요.';}
    else if(rr>=55){s=PTS_REPLY_RATE*0.5;c='절반 이상 응대하고 있습니다. 나머지도 채워보세요.';}
    else if(rr>=40){s=PTS_REPLY_RATE*0.33;c='미응대 리뷰가 적지 않습니다. 신규 고객에게 그대로 노출됩니다.';}
    else if(rr>=25){s=PTS_REPLY_RATE*0.25;c='응대율이 부족합니다. 하루 3건씩 처리해보세요.';}
    else if(rr>=10){s=PTS_REPLY_RATE*0.12;c='답글이 거의 없습니다. 응대는 친절도 평가에 반영됩니다.';}
    else{s=0;c='답글 작성부터 시작해보세요. 답글은 신규 고객을 위한 정보입니다.';}
    s=Math.round(s*2)/2;
    items.push({key:'reviewReply',name:'리뷰 답글 비율',cat:'review',max:PTS_REPLY_RATE,score:s,detail:rr+'%',comment:c});
  } else pushNA('reviewReply','리뷰 답글 비율','review',PTS_REPLY_RATE,'리뷰 답글 비율은 직접 확인이 필요해요');

  // #9 저장 수 (7) — 공개 데이터 미노출 → N/A
  if(api.saveCount===null||api.saveCount===undefined){
    pushNA('saveCount','저장 수','review',7,'이 업종/매장은 네이버에서 저장 수를 제공하지 않아요. 점수 계산에서 제외했어요');
  } else {
    const sc=api.saveCount; let s,c;
    if(sc>=3000){s=7;}else if(sc>=2000){s=5.5;}else if(sc>=1000){s=4;}else if(sc>=500){s=3;}else if(sc>=200){s=1.5;}else{s=0.5;}
    c='저장 수는 고객이 \'나중에 방문할 곳\'으로 찜해두는 신호입니다.';
    items.push({key:'saveCount',name:'저장 수',cat:'review',max:7,score:s,detail:sc.toLocaleString()+'개',comment:c});
  }

  // #10 사진 리뷰 비율 (5)
  if(hasReviewDetail){
    const pr=api.photoReviewRate||0; let s,c;
    if(pr>=60){s=5;c='사진 리뷰 비중이 높습니다. 신규 고객 전환에 강한 영향을 줍니다.';}
    else if(pr>=45){s=4;c='절반 가까이 사진이 포함되어 있습니다. 가이드에 사진 요청 문구를 더해보세요.';}
    else if(pr>=30){s=3;c='양호한 상태입니다. 사진 리뷰가 늘수록 체류시간이 좋아집니다.';}
    else if(pr>=15){s=2;c='사진 리뷰가 다소 부족합니다. 포토존 설치를 검토해보세요.';}
    else{s=1;c='사진 없는 리뷰는 신규 고객 설득력이 낮습니다. 사진 리뷰 유도가 필요합니다.';}
    items.push({key:'photoReview',name:'사진 리뷰 비율',cat:'review',max:5,score:s,detail:pr+'%',comment:c});
  } else pushNA('photoReview','사진 리뷰 비율','review',5,'사진 리뷰 비율 데이터를 가져올 수 없었어요');

  /* ── 시스템 & 결제 ── */

  if(isAccommodation){
    // 숙박업: 참조 사이트와 동일하게 네이버 페이(3) + 숙박 예약 연결(3) = 6점 만점
    // #7 네이버 페이 (3)
    {
      const has=!!api.hasNPay; const s=has?3:0;
      const c=has?'네이버 페이가 연결되어 있습니다. 결제 데이터가 쌓이면 노출에도 도움이 됩니다.':'네이버 페이를 연결하면 결제가 편리해지고 노출에도 도움이 됩니다.';
      items.push({key:'npay',name:'네이버 페이',cat:'system',max:3,score:s,detail:has?'활성':'미사용',comment:c});
    }
    // #8 숙박 예약 연결 (3)
    {
      const has=!!api.hasBooking; const s=has?3:0;
      const c=has?'네이버 예약이 잘 연결되어 있습니다. 영업시간 외에도 고객이 직접 예약할 수 있습니다.':'숙박 예약을 연결하면 고객이 24시간 직접 예약할 수 있습니다.';
      items.push({key:'booking',name:'숙박 예약 연결',cat:'system',max:3,score:s,detail:has?'연결됨':'미연결',comment:c});
    }
  } else {
    // 참조 사이트와 동일: 시스템&결제 = 네이버 예약(6) + 네이버 페이(3) + 쿠폰(2)
    //   (스마트콜·톡톡은 콘텐츠&운영 영역으로 이동)

    // #8 네이버 예약 (6)
    if(naKeys.has('booking')){ /* skip */ }
    else {
      const has=!!api.hasBooking; const s=has?6:0;
      const c=has?'네이버 예약이 연결되어 있습니다. AI 추천 환경에서는 예약 가능한 매장이 우선 노출됩니다.':'네이버 예약이 꺼져 있습니다. 무료 기능이니 켜두면 고객 유입에 직접적인 도움이 됩니다.';
      items.push({key:'booking',name:'네이버 예약',cat:'system',max:6,score:s,detail:has?'활성':'미활성',comment:c});
    }

    // #9 네이버 페이 (3)
    {
      const has=!!api.hasNPay; const s=has?3:0;
      const c=has?'네이버 페이가 연결되어 있습니다. 결제 데이터가 쌓일수록 AI 추천에 유리하게 작용합니다.':'네이버 페이를 연동하면 결제 데이터가 AI 추천의 중요한 근거가 됩니다.';
      items.push({key:'npay',name:'네이버 페이',cat:'system',max:3,score:s,detail:has?'활성':'미활성',comment:c});
    }

    // #11 쿠폰 (2) — 의료기관은 환자 유인 광고 금지로 N/A
    if(naKeys.has('coupon')){
      pushNA('coupon','쿠폰','system',2,'의료기관은 쿠폰·할인이 환자 유인 광고로 금지되어 있어 진단에서 제외했어요');
    } else {
      const has=!!api.hasCoupon; const s=has?2:0;
      const c=has?'쿠폰을 잘 활용하고 있습니다.':'쿠폰이 없습니다. 부담 없는 무료 쿠폰을 하나 만들어 다운로드를 유도해보세요.';
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
    if(n>=30){s=4;c='사진이 충분합니다. 고객이 방문 전에 매장을 충분히 가늠할 수 있습니다.';}
    else if(n>=15){s=3;c='사진이 어느 정도 등록되어 있습니다. 메뉴·내부 사진을 더 추가해보세요.';}
    else if(n>=5){s=2;c='사진이 부족합니다. 대표 메뉴 사진을 늘려보세요.';}
    else if(n>0){s=1;c='사진이 너무 적어 첫인상이 약해질 수 있습니다.';}
    else{s=0;c='등록된 사진이 거의 없습니다. 우선 10장 정도 올려보세요.';}
    items.push({key:'imageCount',name:'업체 등록 사진',cat:'basic',max:4,score:s,detail:n+'장',comment:c});
  }

  // #13 편의시설 등록 (2)
  {
    const arr=api.conveniences||[]; const n=arr.length; let s,c;
    if(n>=5){s=2;c='편의시설 정보가 잘 등록되어 있습니다.';}
    else if(n>=2){s=1;c='편의시설을 더 등록하면 검색 필터 노출에 유리합니다.';}
    else{s=0;c='편의시설이 등록되어 있지 않습니다. 주차·예약 등 해당 항목을 채워보세요.';}
    items.push({key:'convenience',name:'편의시설 등록',cat:'basic',max:2,score:s,detail:n+'개',comment:c});
  }

  if(isAccommodation){
    // 숙박업: 참조 사이트와 동일하게 영업시간(3) + 객실 등록(4) + 객실 가격 공개(3) + 체크인아웃(2)
    // #14 영업시간 (3) — 숙박업은 운영 시작이 명확하므로 점수화
    {
      const has=!!api.hasBusinessHours; const s=has?3:0;
      const c=has?'운영 시간(시작)이 등록되어 있습니다.':'영업시간이 없으면 고객이 현재 운영 여부를 확인하기 어렵습니다.';
      items.push({key:'businessHours',name:'영업시간',cat:'basic',max:3,score:s,detail:has?'등록됨':'미등록',comment:c});
    }
    // #15 객실 등록 (4)
    {
      const n=api.totalMenus||0; let s,c;
      if(n>=6){s=4;c='객실이 충분히 등록되어 있습니다.';}
      else if(n>=3){s=3;c='객실이 어느 정도 등록되어 있습니다. 더 채우면 선택폭이 넓어집니다.';}
      else if(n>=1){s=2;c='객실 등록이 적습니다. 객실 타입별로 모두 올려보세요.';}
      else{s=0;c='등록된 객실이 없습니다. 객실 타입부터 등록해보세요.';}
      items.push({key:'roomCount',name:'객실 등록',cat:'basic',max:4,score:s,detail:n+'개',comment:c});
    }
    // #16 객실 가격 공개 (3)
    {
      const total=api.totalMenus||0; const rate=api.menuPriceRate||0; let s,c;
      if(total===0){ s=0; c='객실 가격이 비어 있습니다. 가격을 공개하면 문의가 줄어듭니다.'; }
      else if(rate>=90){s=3;c='모든 객실에 가격이 표기되어 있습니다. 가격 표기는 예약 전환에 큰 도움이 됩니다.';}
      else if(rate>=60){s=2;c='가격 공개율이 양호합니다. 나머지 객실도 채워보세요.';}
      else if(rate>0){s=1;c='가격이 빠진 객실이 있습니다. 고객은 가격을 먼저 확인합니다.';}
      else{s=0;c='객실 가격이 비어 있습니다. 가격을 공개하면 문의가 줄어듭니다.';}
      items.push({key:'roomPrice',name:'객실 가격 공개',cat:'basic',max:3,score:s,detail:total+'개 중 '+rate+'% 가격공개',comment:c});
    }
    // #17 체크인/체크아웃 명시 (2)
    {
      const has=!!api.hasCheckInOut; const s=has?2:0;
      const c=has?'체크인·체크아웃 시간이 잘 명시되어 있습니다.':'체크인·체크아웃 시간을 명시하면 문의가 줄고 신뢰가 올라갑니다.';
      items.push({key:'checkInOut',name:'체크인/체크아웃 명시',cat:'basic',max:2,score:s,detail:has?'명시됨':'미명시',comment:c});
    }
  } else if(isEducationOrRealestate){
    // 학원·부동산(중개): 메뉴/가격 개념이 약해 menuPrice/menuPhoto 대신
    // 콘텐츠 영역의 전용 항목(소개글 충실도·프로그램/매물·예약상담)으로 대체.
    // basic 영역은 영업시간만 점수화.
    {
      const has=!!api.hasBusinessHours; const s=has?2:0;
      const c=has?'영업시간이 등록되어 있습니다.':'영업시간을 등록하지 않으면 고객이 헛걸음할 수 있습니다.';
      items.push({key:'businessHours',name:'영업시간 등록',cat:'basic',max:2,score:s,detail:has?'등록됨':'미등록',comment:c});
    }
  } else {
    // #14 영업시간 (3) — 참조 사이트와 동일 (미등록 시 손님 이탈 큰 영향)
    if(naKeys.has('businessHours')){
      pushNA('businessHours','영업시간','basic',3,'이 업종은 영업시간 항목이 진단 대상이 아니에요');
    } else {
      const has=!!api.hasBusinessHours; const s=has?3:0;
      const c=has?'영업시간이 잘 등록되어 있습니다.':'영업시간이 없으면 고객이 현재 영업 여부를 확인할 수 없습니다.';
      items.push({key:'businessHours',name:'영업시간',cat:'basic',max:3,score:s,detail:has?'등록됨':'미등록',comment:c});
    }

    // #16 메뉴 가격 입력율 (2) — 비뷰티 Tier2(헬스 등)는 항목 제거, 메뉴 개념 없는 업종은 N/A
    if(industry.tier===2 && !isBeauty){ /* 항목 제외 — 정규화가 자동 처리 */ }
    else if(naKeys.has('menuPrice')){
      pushNA('menuPrice',menuWord+' 가격 입력율','basic',2,'이 업종은 '+menuWord+' 가격 항목이 진단 대상이 아니에요');
    } else {
      const total=api.totalMenus||0; const rate=api.menuPriceRate||0; let s,c;
      if(total===0){ s=0; c='아직 등록된 항목이 없습니다. 가장 먼저 채워야 할 부분입니다.'; }
      else if(rate>=90){s=2;c='가격이 모두 입력되어 있습니다.';}
      else if(rate>=60){s=1;c='가격이 빠진 항목이 일부 있습니다.';}
      else{s=0;c='가격 정보가 거의 없습니다. 가격을 모르면 예약으로 이어지기 어렵습니다.';}
      items.push({key:'menuPrice',name:menuWord+' 가격 입력율',cat:'basic',max:2,score:s,detail:total+'개 중 '+rate+'% 가격공개',comment:c});
    }

    // #17 메뉴 사진 비율 (2) — 미용실·네일은 "스타일 탭", 그 외 Tier2는 항목 제거
    if(industry.tier===2 && !hasStyleTab){ /* 항목 제외 */ }
    else if(isBeauty && hasStyleTab){
      const sc=api.styleCount||0; let s,c,d;
      if(sc>=50){s=2;c='사진이 충분히 등록되어 있어 고객이 결과물을 미리 확인할 수 있습니다.';d=sc+'장';}
      else if(sc>=20){s=1.5;c='사진이 어느 정도 있습니다. 대표 항목부터 사진을 더 채워보세요.';d=sc+'장';}
      else if(sc>0){s=1;c='사진이 부족합니다. 사진이 있는 항목의 선택률이 훨씬 높습니다.';d=sc+'장';}
      else{s=0.5;c='사진이 부족합니다. 사진이 있는 항목의 선택률이 훨씬 높습니다.';d='부족';}
      items.push({key:'menuPhoto',name:'스타일 탭',cat:'basic',max:2,score:s,detail:d,comment:c});
    } else if(naKeys.has('menuPhoto')){
      pushNA('menuPhoto',menuWord+' 사진 비율','basic',2,'이 업종은 '+menuWord+' 사진 항목이 진단 대상이 아니에요');
    } else {
      const total=api.totalMenus||0; const rate=api.menuPhotoRate||0; let s,c;
      if(total===0){ s=0; c='사진이 부족합니다. 사진이 있는 항목의 선택률이 훨씬 높습니다.'; }
      else if(rate>=90){s=2;c='사진이 충분히 등록되어 있어 고객이 결과물을 미리 확인할 수 있습니다.';}
      else if(rate>=60){s=1;c='사진이 어느 정도 있습니다. 대표 항목부터 사진을 더 채워보세요.';}
      else if(rate>=30){s=0.5;c='사진이 부족합니다. 사진이 있는 항목의 선택률이 훨씬 높습니다.';}
      else{s=0;c='사진이 부족합니다. 사진이 있는 항목의 선택률이 훨씬 높습니다.';}
      items.push({key:'menuPhoto',name:menuWord+' 사진 비율',cat:'basic',max:2,score:s,detail:rate+'% 사진등록',comment:c});
    }
  }

  /* ── 콘텐츠 & 운영 ── */

  // #17 대표키워드 (5)
  {
    const kwList=(user.keywords&&user.keywords.length)?user.keywords:(api.keywords||[]);
    const kw=kwList.length; let s,c;
    if(kw>=5){s=5;c='대표키워드가 잘 채워져 있습니다. 고객 검색어와 잘 연결되어 있습니다.';}
    else if(kw>=3){s=3;c='대표키워드를 더 채워보세요. 비어 있는 칸은 노출 기회를 놓치는 것입니다.';}
    else if(kw>=1){s=2;c='대표키워드를 더 채워보세요. 비어 있는 칸은 노출 기회를 놓치는 것입니다.';}
    else{s=0;c='대표키워드가 비어 있습니다. 고객이 검색하는 단어로 5개를 채워보세요.';}
    const list=kwList.join(', ');
    items.push({key:'keywords',name:'대표키워드',cat:'content',max:5,score:s,detail:kw+'개'+(list?(' · '+list):''),comment:c});
  }

  // #18 상세설명 (5) — 학원·부동산은 "소개글 충실도(3)+프로그램/매물(2)+예약상담(1)"로 대체
  if(isEducationOrRealestate){
    // 소개글 충실도 (3)
    {
      const desc=(user.description||api.description||''); const len=desc.length; let s,c;
      if(len>=500){s=3;c='소개글이 충실합니다. 고객이 전화 전에 매장을 충분히 이해할 수 있습니다.';}
      else if(len>=300){s=2;c='소개글이 어느 정도 작성되어 있습니다. 과정·전문 분야·상담 절차를 더 구체적으로 적어보세요.';}
      else if(len>=100){s=1;c='소개글이 비어 있습니다. 소개글이 없으면 고객이 매장을 이해하기 어렵습니다.';}
      else if(len>=1){s=0.5;c='소개글이 비어 있습니다. 소개글이 없으면 고객이 매장을 이해하기 어렵습니다.';}
      else{s=0;c='소개글이 비어 있습니다. 소개글이 없으면 고객이 매장을 이해하기 어렵습니다.';}
      items.push({key:'specialDescription',name:'소개글 충실도',cat:'content',max:3,score:s,detail:len+'자',comment:c});
    }
    // 프로그램/매물 등록 (2)
    {
      const total=api.totalMenus||0; const serviceName=isEducation?'수강료·프로그램 등록':'서비스 메뉴(매물 유형)'; let s,c;
      if(total>=5){s=2;c='프로그램·서비스 항목이 충분히 등록되어 있습니다.';}
      else if(total>=3){s=1.5;c='조금 더 세분화할 수 있습니다.';}
      else if(total>=1){s=0.5;c='등록 항목이 너무 적습니다.';}
      else{s=0;c=isEducation?'수강료나 프로그램이 없으면 학부모가 비교하기 어렵습니다.':'매물 유형이나 상담 서비스를 메뉴로 나눠두면 고객이 전문 분야를 빠르게 이해합니다.';}
      items.push({key:'specialMenu',name:serviceName,cat:'content',max:2,score:s,detail:total+'개',comment:c});
    }
    // 예약/상담 연결 (1)
    {
      const hasResvFacility=Array.isArray(api.conveniences)&&api.conveniences.some(function(it){return String(it).includes('예약');});
      const has=!!api.hasBooking||hasResvFacility; const s=has?1:0;
      const c=has?(isEducation?'체험수업·상담 예약 경로가 확인됩니다.':'방문상담 예약 경로가 확인됩니다.')
        :(isEducation?'체험수업 예약이 없으면 문의 전환율이 떨어집니다.':'방문상담 예약이 없으면 매물 문의가 끊기기 쉽습니다.');
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
    if(s>=5)c='상세설명이 충실하고 검색 키워드도 잘 녹아 있습니다.';
    else if(s>=3)c='상세설명이 잘 작성되어 있습니다. 검색 키워드를 조금 더 녹여보세요.';
    else if(len>0)c='상세설명이 짧습니다. 고객이 검색할 단어를 녹여 더 길게 작성해보세요.';
    else c='상세설명이 비어 있습니다. 매장 이야기와 검색 키워드를 채워보세요.';
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
    if(s>=3)c='찾아오는 길이 친절하게 안내되어 있습니다.';
    else if(s>=1)c='찾아오는 길을 더 구체적으로 적어보세요. 주차·대중교통 정보가 도움이 됩니다.';
    else c='찾아오는 길이 비어 있습니다. 길 안내를 적으면 헛걸음이 줄어듭니다.';
    items.push({key:'direction',name:'찾아오는 길',cat:'content',max:3,score:s,detail:len>0?(len+'자'+(found.length?(' · '+found.join(', ')):'')):'미등록',comment:c});
  }

  // 참조 사이트와 동일하게 스마트콜·네이버 톡톡을 콘텐츠&운영에 배치 (전 업종)
  // 스마트콜·톡톡은 자동 수집값(api) 우선, 없으면 사용자 확인값(user) 사용
  {
    const has=!!(api.hasSmartCallAuto||user.smartcall); const s=has?3:0;
    const c=has?'스마트콜이 잘 켜져 있습니다.':'스마트콜을 켜면 고객이 클릭 한 번으로 전화할 수 있습니다. 켜두는 것을 권합니다.';
    items.push({key:'smartcall',name:'스마트콜',cat:'content',max:3,score:s,detail:has?'사용 중':'미사용',comment:c});
  }
  {
    const has=!!(api.hasTalkTalkAuto||user.talktalk); const s=has?3:0;
    const c=has?'톡톡이 잘 켜져 있습니다. 영업시간 외 문의도 받을 수 있습니다.':'톡톡을 켜면 고객이 전화 없이도 문의할 수 있어 예약 문의가 늘어납니다.';
    items.push({key:'talktalk',name:'네이버 톡톡',cat:'content',max:3,score:s,detail:has?'사용 중':'미사용',comment:c});
  }

  // #20 소식 (3) — 사용자 확인값(news 토글). 의료기관은 N/A 항목으로 표시(참조 사이트와 동일)
  if(naKeys.has('news')){
    pushNA('news','소식','content',3,'의료기관의 소식·이벤트 게시는 의료광고 사전심의 대상이라 진단에서 제외했어요');
  }
  else {
    const has=!!user.news; const s=has?3:0;
    const c=has?'최근 소식이 올라오고 있어 활발한 매장으로 보입니다.':'소식을 올리지 않으면 관리되지 않는 매장으로 보일 수 있습니다.';
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

  /* ── 합산 (카테고리 고정 가중치 방식) ── */
  // 모든 매장에서 카테고리 만점을 동일하게 고정 (합 100)
  const CAT_WEIGHTS = { review:45, content:23, basic:16, system:16 };

  // 카테고리별 달성률 (N/A 항목은 분자·분모에서 함께 제외, 전부 N/A면 null=평가 불가)
  const catRatio = {};
  for(const cat of ['review','content','basic','system']){
    const ci=items.filter(i=>i.cat===cat&&!i.na);
    const got=ci.reduce((a,i)=>a+i.score,0); const mx=ci.reduce((a,i)=>a+i.max,0);
    catRatio[cat]= mx>0?(got/mx):null;
  }

  // 평가 가능한 카테고리의 고정 만점 합 (평가 불가 카테고리는 제외 후 재정규화)
  const activeWeight = Object.keys(CAT_WEIGHTS)
    .filter(c=>catRatio[c]!==null)
    .reduce((a,c)=>a+CAT_WEIGHTS[c],0);

  // 카테고리별 환산 점수/만점 (평가 불가 카테고리는 만점 0, 비중은 나머지로 이전)
  const catNormScore = {};
  const catNormMax = {};
  for(const cat of ['review','content','basic','system']){
    if(catRatio[cat]===null){
      catNormScore[cat]=0; catNormMax[cat]=0;
    } else {
      const normMax = activeWeight>0 ? (CAT_WEIGHTS[cat]/activeWeight*100) : 0;
      catNormMax[cat]=normMax;
      catNormScore[cat]=catRatio[cat]*normMax;
    }
  }

  // 상단 총점 = 카테고리 환산 점수의 합
  const rawSum = ['review','content','basic','system'].reduce((a,c)=>a+catNormScore[c],0);
  const displayScore = Math.round(rawSum);
  const categoryNorm = { score:catNormScore, max:catNormMax };

  // 기존 변수 유지 (naMaxScore 안내 등 다른 곳에서 참조)
  const rawMax = items.reduce((a,i)=>a+(i.na?0:i.max),0);
  const rawScore = items.reduce((a,i)=>a+(i.na?0:i.score),0);
  const effectiveMax = rawMax;

  // 등급
  let grade,gradeComment,gradeColor;
  if(displayScore>=90){grade='S';gradeComment='최적화 수준이 매우 높은 상태입니다. 지금의 운영 방식을 유지하시면 됩니다.';gradeColor='#0E9F6E';}
  else if(displayScore>=75){grade='A';gradeComment='기본기가 탄탄한 상태입니다. 미흡한 몇 개 항목만 보완하면 매출 전환이 눈에 띄게 좋아집니다.';gradeColor='#0284c7';}
  else if(displayScore>=60){grade='B';gradeComment='구조는 갖춰져 있지만 일부 항목에 공백이 있습니다. 지금 보완하면 충분히 만회되는 단계입니다.';gradeColor='#6A35FF';}
  else if(displayScore>=40){grade='C';gradeComment='유입 대비 전환 손실이 생기고 있는 구간입니다. 영향이 큰 항목부터 하나씩 개선해보세요.';gradeColor='#E8A200';}
  else{grade='D';gradeComment='기초 항목부터 단계적으로 정비가 필요한 상태입니다. 영향이 가장 큰 항목 하나부터 시작해보세요.';gradeColor='#DC2626';}

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

  /* ── 참조 사이트(마피아넷) 스타일 지표 패키지 ── */
  // 사진 리뷰 개수: imageReviewCount가 있으면 그대로, 없으면 총리뷰 × 사진비율로 근사
  var photoReviewCount = (api.imageReviewCount!=null && api.imageReviewCount>0)
    ? api.imageReviewCount
    : Math.round((api.totalReviewCount||0)*((api.photoReviewRate||0)/100));
  var metrics = {
    totalReviews: api.totalReviewCount||0,
    starRating: api.starRating,            // null이면 비공개
    photoReviewCount: photoReviewCount,
    // 리뷰 품질 분석 3종 (리뷰 상세 수집 실패 시 null → 화면에서 '-' 표시)
    textReviewRate: (api.textReviewRate!=null ? api.textReviewRate : null),
    mediaReviewRate: (api.mediaReviewRate!=null ? api.mediaReviewRate : null),
    reviewerDiversity: (api.reviewerDiversity!=null ? api.reviewerDiversity : null)
  };

  /* ── 프로필 완성도 체크리스트 (참조 사이트와 동일 8항목) ── */
  var hasMenuPhoto = (api.menuPhotoRate||0)>0 || (api.styleCount||0)>0 || (api.totalMenus||0)>0;
  var hasPrice = (api.menuPriceRate||0)>0;
  var hasConvenience = Array.isArray(api.conveniences) && api.conveniences.length>0;
  var hasIntro = !!((api.microIntro&&api.microIntro.length) || (api.description&&api.description.length));
  var hasMainImage = (api.imageCount||0)>0;
  var hasSmartOrder = !!(api.hasNPay || api.hasSmartCallAuto);
  var profileChecklist = [
    {label:'영업시간 등록', done:!!api.hasBusinessHours},
    {label:'메뉴/사진 등록', done:hasMenuPhoto},
    {label:'가격 정보',      done:hasPrice},
    {label:'편의시설 정보',  done:hasConvenience},
    {label:'네이버 예약',    done:!!api.hasBooking},
    {label:'스마트주문',     done:hasSmartOrder},
    {label:'한줄평(소개)',   done:hasIntro},
    {label:'대표 이미지',    done:hasMainImage}
  ];
  var profileDone = profileChecklist.filter(function(x){return x.done;}).length;
  var profileCompleteness = Math.round(profileDone/profileChecklist.length*100);

  /* ── 업체 정보 (참조 사이트와 동일) ── */
  var business = {
    address: api.roadAddress||api.address||'',
    phone: api.phone||null,
    intro: api.microIntro||'',
    placeUrl: api.id ? ('https://m.place.naver.com/place/'+api.id+'/home') : ''
  };

  return {
    name:api.name||'가게', category:api.category||'', address:api.roadAddress||'',
    industry, displayScore, rawScore, effectiveMax, naMaxScore,
    grade, gradeComment, gradeColor,
    persona, personaDesc, personaIcon, catScores, items,
    categoryNorm,
    metrics, profileChecklist, profileCompleteness, business
  };
}
`
