export const RENDER_REPORT = String.raw`
const CAT_META = {
  review:{label:'리뷰 & 신뢰', dataCat:'review'},
  system:{label:'시스템 & 결제', dataCat:'system'},
  basic:{label:'기본정보', dataCat:'basic'},
  content:{label:'콘텐츠 & 운영', dataCat:'content'}
};
// 표시 순서: ①콘텐츠&운영 ②리뷰&신뢰 ③기본정보 ④시스템&결제
// (2열 그리드: 좌상=콘텐츠&운영 / 우상=리뷰&신뢰 / 좌하=기본정보 / 우하=시스템&결제)
// 카드(summaryHTML)·상세진단(detailHTML) 모두 이 배열 순서를 그대로 따른다.
const CAT_ORDER=['content','review','basic','system'];

// 셀러랩스의 실전 팁 — 항목별 실무 노하우 (2~4문장, 구체적 숫자 + 행동 + 동기부여)
const TIPS = {
  recent7:"리뷰는 최신성이 핵심입니다. 누적 리뷰가 1,000개여도 최근 3개월 리뷰가 없으면 고객은 운영 여부를 의심하게 됩니다. 리뷰 가이드를 만들어 결제 직후 안내하고, '이런 내용을 적어주시면 도움이 됩니다'처럼 구체적으로 요청하면 작성률이 크게 올라갑니다. 리뷰가 잘 쌓이는 매장의 공통점은 '작성을 직접 요청한다'는 것입니다.",
  recent30:"한 달에 리뷰가 최소 10개는 꾸준히 쌓여야 네이버가 활성 매장으로 인식합니다. 몰아서 받는 것보다 매일 1~2개씩 꾸준히 받는 것이 훨씬 효과적입니다. 결제 직후가 요청하기 가장 좋은 시점입니다. 직원에게도 리뷰 요청 멘트를 응대 루틴으로 정착시켜보세요.",
  totalReview:"리뷰 100개를 넘어야 소규모 키워드 경쟁이 가능하고, 300개를 넘으면 중형 키워드도 도전할 수 있습니다. 영수증 리뷰, 블로그 체험단, 경품 이벤트를 동시에 운영해보세요. 핵심은 리뷰 한 건을 얻는 것이 아니라 '리뷰가 쌓이는 구조'를 만드는 것입니다.",
  starRating:"별점은 4.5점 이상 유지를 권합니다. 4.0점 아래로 떨어지면 클릭률이 눈에 띄게 감소합니다. 낮은 별점 리뷰에는 반드시 정중히 답글을 달고 개선 의지를 보여주세요. 진심 어린 답글 하나가 다음 고객의 신뢰로 이어집니다.",
  blogReview:"블로그 리뷰는 검색 노출의 숨은 자산입니다. 체험단 1명부터 시작해도 충분합니다. 지역 맛집·핫플 블로거에게 직접 제안하거나 소규모 체험단 플랫폼을 활용해보세요. 블로그 리뷰가 5개만 쌓여도 검색 결과에서 매장이 훨씬 풍성하게 보입니다.",
  reviewMix:"리뷰는 종류의 균형도 중요합니다. 영수증·블로그·사진·예약 리뷰가 고르게 쌓여야 네이버가 건강한 매장으로 인식합니다. 한 종류에만 몰리면 오히려 어뷰징으로 의심받을 수 있습니다. 영수증·블로그·사진 리뷰를 함께 운영하는 '리뷰 포트폴리오'를 구성해보세요.",
  aiBriefing:"최근 네이버는 AI가 리뷰를 요약해 'AI 브리핑'으로 노출합니다. 여기에 매장 강점이 잘 반영되려면 리뷰에 메뉴명·분위기·재방문 같은 핵심 단어가 자연스럽게 담겨야 합니다. 가이드에 '어떤 메뉴가 좋았는지 적어주세요'를 넣으면 AI 브리핑 품질이 좋아집니다.",
  reviewReply:"리뷰 답글은 매장의 응대 태도를 보여주는 창구입니다. 특히 낮은 별점 리뷰에 정중히 답글을 달면 이를 보는 다음 고객의 신뢰가 올라갑니다. 좋은 리뷰에는 감사를, 아쉬운 리뷰에는 개선 의지를 전달해보세요. 답글 여부에 따라 재방문율이 확연히 달라집니다.",
  saveCount:"저장(즐겨찾기)은 고객이 재방문 의사를 표시하는 신호입니다. 저장 수가 많을수록 네이버는 인기 매장으로 판단합니다. '저장하고 방문하면 음료 제공' 같은 작은 이벤트로 저장을 유도해보세요. 저장 고객에게는 소식 알림이 전달되어 재방문 유도에도 효과적입니다.",
  photoReview:"사진이 포함된 리뷰는 글만 있는 리뷰보다 신뢰도가 훨씬 높습니다. '사진 한 장 함께 올려주시면 음료 제공'처럼 작은 보상을 제안해보세요. 메뉴가 잘 보이는 포토존을 마련하면 사진 리뷰가 자연스럽게 늘어납니다.",
  npay:"네이버페이를 연결하면 결제 단계에서 이탈하는 고객을 잡을 수 있습니다. 별도 가입 없이 바로 결제되어 전환율이 올라갑니다. 또한 네이버페이 사용 매장은 검색 노출에서 가점을 받습니다. 아직 연결하지 않았다면 바로 연결해보세요.",
  booking:"네이버 예약은 전화 응대 부담을 줄여주는 효과적인 도구입니다. 고객이 영업시간 외에도 직접 예약하므로 놓치는 손님이 줄어듭니다. 예약 시 안내 메시지를 자동 발송하도록 설정하면 노쇼도 크게 감소합니다.",
  smartcall:"스마트콜(안심번호)을 사용하면 누가·언제·몇 번 전화했는지 데이터로 남습니다. 연결되지 않은 고객에게 다시 연락하면 매출로 이어집니다. 개인번호 노출도 막아주어 사장님의 사생활도 보호됩니다.",
  talktalk:"톡톡은 고객이 가장 부담 없이 문의하는 채널입니다. 자주 묻는 질문은 자동응답으로 설정해두면 응대 시간이 절반으로 줄어듭니다. 응답이 빠른 매장일수록 고객 만족도와 재방문율이 높습니다.",
  coupon:"쿠폰은 첫 방문 고객을 단골로 전환하는 가장 쉬운 방법입니다. '첫 방문 10% 할인'이나 '리뷰 작성 시 음료 제공' 쿠폰을 활용해보세요. 쿠폰을 받은 고객은 사용을 위해 다시 방문하므로 재방문율이 자연스럽게 올라갑니다.",
  imageCount:"대표 사진은 10장 이상을 기본으로 권합니다. 첫 화면의 대표 이미지가 클릭률을 좌우합니다. 음식·공간·외관·디테일을 고르게 보여주고 밝고 선명한 사진으로 채워보세요. 사진이 많을수록 고객은 매장을 더 신뢰합니다.",
  convenience:"주차, 와이파이, 반려동물 동반 같은 편의시설 정보는 반드시 체크해두세요. 고객은 이 정보를 보고 방문 여부를 결정합니다. 특히 주차 가능 여부는 방문 결정에 가장 큰 영향을 줍니다. 해당하는 항목은 빠짐없이 등록해보세요.",
  menuPrice:"메뉴와 가격은 정확하고 빠짐없이 등록해보세요. 가격 정보가 없으면 고객은 비싸다고 짐작하고 그냥 넘어갑니다. 대표 메뉴 3~5개는 사진과 함께 강조하고, 가격이 바뀌면 즉시 업데이트하세요.",
  menuPhoto:"메뉴 사진은 매출과 직결됩니다. 글로만 적힌 메뉴보다 사진이 있는 메뉴의 주문율이 훨씬 높습니다. 스마트폰으로 찍더라도 자연광에서 밝게 촬영하면 충분합니다. 대표 메뉴부터 하나씩 사진을 채워보세요.",
  roomCount:"객실은 타입별로 빠짐없이 등록해보세요. 스탠다드·디럭스·복층 등 종류가 다양할수록 고객 선택폭이 넓어지고 예약 전환율이 올라갑니다. 각 객실의 최대 인원, 평수, 침대 구성을 명확히 적으면 문의가 크게 줄어듭니다.",
  roomPrice:"객실 가격은 반드시 공개해보세요. 가격이 없으면 고객은 다른 숙소로 넘어갑니다. 주중·주말·성수기 요금을 구분해 표기하면 신뢰가 올라가고 가격 문의 전화도 줄어듭니다.",
  checkInOut:"체크인·체크아웃 시간은 반드시 명시해보세요. 입실·퇴실 시간이 불분명하면 도착 후 혼란이 생기고 부정적 리뷰로 이어집니다. '체크인 15:00 / 체크아웃 11:00'처럼 명확히 적고, 얼리 체크인·레이트 체크아웃 가능 여부도 함께 안내하면 만족도가 높아집니다.",
  businessHours:"영업시간은 정확하게, 휴무일도 빠짐없이 등록해보세요. 헛걸음한 고객은 재방문하지 않을 뿐 아니라 부정적 리뷰를 남길 수 있습니다. 명절·임시휴무는 미리 공지로 안내하면 신뢰가 올라갑니다.",
  keywords:"대표키워드는 고객이 실제로 검색하는 단어로 정해야 합니다. '맛집'처럼 막연한 단어보다 '강남 데이트 코스', '회사 회식 장소'처럼 구체적인 키워드가 효과적입니다. 매장의 강점과 고객의 검색어를 연결하는 것이 핵심입니다.",
  description:"상세설명은 매장의 첫인상입니다. 400자 이상으로 매장만의 이야기, 대표 메뉴, 분위기를 충실히 담아보세요. 고객이 검색하는 키워드를 자연스럽게 녹이면 노출에도 도움이 됩니다. 비어 있는 설명은 기회를 놓치는 것입니다.",
  direction:"찾아오는 길 안내는 친절할수록 좋습니다. 'OO역 3번 출구 도보 5분', 'OO건물 맞은편'처럼 구체적으로 적어보세요. 주차 정보와 대중교통 동선까지 안내하면 고객의 방문 결정이 한결 쉬워집니다.",
  news:"소식(공지)을 꾸준히 올리는 매장은 잘 관리되고 있다는 인상을 줍니다. 신메뉴, 이벤트, 휴무 안내를 정기적으로 올려보세요. 한 달에 2~3개만 꾸준히 올려도 단골과의 소통 창구가 되고 노출에도 긍정적입니다.",
  specialDescription:"학원·중개 같은 업종은 메뉴 사진보다 소개글이 가장 큰 설득 수단입니다. 500자 이상으로 수업 과정, 전문 분야, 경력·수상 이력, 상담 절차를 구체적으로 적어보세요. 고객이 전화 전에 소개글만으로 신뢰를 느끼게 하는 것이 핵심입니다.",
  specialMenu:"수강 프로그램이나 취급 매물 유형을 메뉴처럼 나누어 등록해보세요. '초등 영어 정규반', '아파트 전세 전문'처럼 세분화할수록 고객이 전문 분야를 빠르게 이해하고 비교하기 쉬워집니다. 5개 이상으로 나누면 노출에도 도움이 됩니다.",
  consultBooking:"체험수업·방문상담 예약 경로를 열어두세요. 학원·중개는 '상담 후 등록' 흐름이라 예약 버튼 하나가 문의 전환을 크게 좌우합니다. 네이버 예약이나 톡톡 상담 예약을 연결하면 영업시간 외 문의도 놓치지 않습니다."
};

// 액션플랜 처방 — 항목별 '구체적 실천 행동(todo)'과 '왜 먼저 해야 하는지(why)'
const ACTIONS = {
  recent7:{todo:"오늘부터 결제 직후 리뷰 요청을 응대 멘트로 정착시켜보세요. 리뷰 가이드를 출력해 계산대 옆에 비치하면 효과적입니다.", why:"최신 리뷰가 끊기면 네이버는 활동이 없는 매장으로 판단해 노출을 줄입니다. 가장 빠르게 회복할 수 있는 영역입니다."},
  recent30:{todo:"월 리뷰 10개를 목표로 매일 1~2명에게 직접 요청하고, 영수증 리뷰 이벤트를 함께 운영해보세요.", why:"꾸준한 리뷰 흐름이 검색 노출의 핵심 신호입니다. 지금 시작하면 한 달 뒤 순위가 달라집니다."},
  totalReview:{todo:"영수증 리뷰·블로그 체험단·경품 이벤트를 동시에 운영해 리뷰 100개를 먼저 넘겨보세요.", why:"리뷰 100개는 소규모 키워드 경쟁의 최소 기준입니다. 리뷰 수가 곧 신뢰이자 노출 경쟁력입니다."},
  blogReview:{todo:"지역 블로거 1명에게 체험단을 제안하거나 소규모 체험단 플랫폼에 등록해보세요.", why:"블로그 리뷰는 검색 결과를 풍성하게 만들어 클릭률을 끌어올리는 숨은 자산입니다."},
  npay:{todo:"네이버페이를 연결해보세요. 신청 후 영업일 기준 며칠이면 활성화됩니다.", why:"결제 단계의 이탈을 막아주고, 네이버페이 사용 매장은 노출에서 가점을 받습니다."},
  booking:{todo:"네이버 예약을 연결하고 객실·시간 옵션과 자동 안내 메시지를 설정해보세요.", why:"고객이 영업시간 외에도 직접 예약하므로 놓치는 손님이 줄고 전환율이 크게 올라갑니다."},
  smartcall:{todo:"스마트콜(안심번호)을 신청해 전화 문의를 데이터로 남겨보세요.", why:"누가·언제·몇 번 전화했는지 기록되어, 놓친 전화에 다시 연락하면 매출로 이어집니다."},
  talktalk:{todo:"네이버 톡톡을 켜고 자주 묻는 질문을 자동응답으로 설정해보세요. 3분이면 충분합니다.", why:"영업시간 외 문의도 받을 수 있고, 응답이 빠른 매장일수록 만족도와 재방문율이 올라갑니다."},
  coupon:{todo:"'첫 방문 10% 할인' 또는 '리뷰 작성 시 음료 제공' 쿠폰을 발행해보세요.", why:"쿠폰은 첫 방문을 단골로 전환하는 가장 쉬운 장치입니다. 받은 고객은 사용을 위해 다시 방문합니다."},
  imageCount:{todo:"음식·공간·외관·디테일 사진을 고르게 10장 이상 밝게 촬영해 올려보세요.", why:"첫 화면의 대표 이미지가 클릭률을 좌우합니다. 사진이 많을수록 신뢰도가 올라갑니다."},
  convenience:{todo:"주차·와이파이·예약 등 해당하는 편의시설을 빠짐없이 체크해보세요.", why:"고객은 이 정보로 방문을 결정합니다. 특히 주차 가능 여부는 방문 결정에 가장 큰 영향을 줍니다."},
  menuPrice:{todo:"대표 메뉴 3~5개를 가격과 함께 등록하고 빠진 가격을 채워보세요.", why:"가격 정보가 없으면 고객은 비싸다고 짐작하고 넘어갑니다. 가격 공개가 문의를 줄입니다."},
  menuPhoto:{todo:"대표 메뉴부터 자연광에서 밝게 촬영해 사진을 채워보세요.", why:"사진이 있는 메뉴의 주문율이 훨씬 높습니다. 메뉴 사진은 매출과 직결됩니다."},
  businessHours:{todo:"플레이스 앱에서 영업시간을 요일별로 정확히 입력해보세요. 3분이면 충분합니다.", why:"영업시간이 없으면 고객이 운영 여부를 확인하지 못해 헛걸음하거나 이탈합니다. 가장 먼저 처리할 항목입니다."},
  roomCount:{todo:"객실 타입별로 최대 인원·평수·침대 구성을 모두 등록해보세요.", why:"객실 종류가 다양할수록 고객 선택폭이 넓어지고 예약 전환율이 올라갑니다."},
  roomPrice:{todo:"주중·주말·성수기 요금을 구분해 모든 객실 가격을 공개해보세요.", why:"가격이 없으면 고객은 다른 숙소로 넘어갑니다. 가격 표기가 예약 전환에 큰 도움이 됩니다."},
  checkInOut:{todo:"'체크인 15:00 / 체크아웃 11:00'처럼 명확히 적고, 얼리·레이트 가능 여부도 안내해보세요.", why:"입실·퇴실 시간이 불분명하면 도착 후 혼란과 부정적 리뷰로 이어집니다."},
  keywords:{todo:"고객이 검색할 단어로 대표키워드 5개를 모두 채워보세요. 지역명+업종, 상황 키워드가 효과적입니다.", why:"비어 있는 키워드 칸은 노출 기회를 놓치는 것입니다. 5개를 모두 채우는 것이 좋습니다."},
  description:{todo:"고객이 전화로 가장 많이 묻는 5가지를 상세설명에 적어보세요. 주차·가격·예약·위치·메뉴 순서를 권합니다.", why:"상세설명은 고객의 탐색 과정에서 가장 중요하게 작용하는 정보 영역입니다."},
  direction:{todo:"'OO역 3번 출구 도보 5분', 주차 정보, 대중교통 동선을 구체적으로 적어보세요.", why:"찾아오는 길이 친절할수록 방문 결정이 쉬워지고 헛걸음이 줄어듭니다."},
  news:{todo:"신메뉴·이벤트·휴무 안내를 한 달에 2~3개 꾸준히 올려보세요.", why:"소식을 올리는 매장은 잘 관리되는 매장으로 보입니다. 단골 소통 창구가 되고 노출에도 긍정적입니다."},
  reviewMix:{todo:"영수증·블로그·사진·예약 리뷰를 함께 운영하는 '리뷰 포트폴리오'를 구성해보세요.", why:"리뷰 종류가 한쪽에 몰리면 어뷰징 의심을 받습니다. 균형이 건강한 매장의 신호입니다."},
  aiBriefing:{todo:"리뷰 가이드에 '어떤 메뉴가 좋았는지 적어주세요'를 넣어 핵심 단어가 담기도록 해보세요.", why:"네이버 AI 브리핑이 매장 강점을 잘 반영하려면 리뷰에 구체적인 단어가 필요합니다."},
  reviewReply:{todo:"낮은 별점 리뷰에는 정중한 답글을, 좋은 리뷰에는 감사 답글을 달아보세요.", why:"답글은 다음 고객이 보는 매장의 응대 태도입니다. 재방문율이 확연히 달라집니다."},
  saveCount:{todo:"'저장하고 방문하면 음료 제공' 같은 작은 이벤트로 저장을 유도해보세요.", why:"저장 수가 많을수록 네이버는 인기 매장으로 판단하고, 저장 고객에게는 소식 알림이 전달됩니다."},
  starRating:{todo:"낮은 별점 리뷰의 불만을 분석해 개선하고, 정중히 답글을 달아보세요.", why:"별점이 4.0 아래로 떨어지면 클릭률이 눈에 띄게 감소합니다. 4.5 이상 유지를 권합니다."},
  photoReview:{todo:"'사진 한 장 올려주시면 음료 제공'처럼 작은 보상으로 사진 리뷰를 유도해보세요.", why:"사진 리뷰는 글만 있는 리뷰보다 신뢰도가 훨씬 높고, 메뉴를 먹음직스럽게 보여줍니다."},
  specialDescription:{todo:"소개글을 500자 이상으로, 수업 과정·전문 분야·경력·상담 절차를 구체적으로 채워보세요.", why:"학원·중개는 메뉴 사진 대신 소개글이 가장 큰 설득 수단입니다. 고객은 소개글만으로 전화 여부를 결정합니다."},
  specialMenu:{todo:"수강 프로그램·취급 매물 유형을 메뉴처럼 5개 이상으로 세분화해 등록해보세요.", why:"전문 분야가 한눈에 보여야 고객이 비교하고 신뢰할 수 있습니다. 세분화할수록 노출에도 유리합니다."},
  consultBooking:{todo:"체험수업·방문상담 예약 경로(네이버 예약/톡톡 상담)를 열어두세요.", why:"학원·중개는 상담 후 등록 흐름이라 예약 버튼 하나가 문의 전환을 크게 좌우하고, 영업시간 외 문의도 잡을 수 있습니다."}
};

function toggleTip(btn){
  const tip=btn.closest('.coach-tip');
  if(tip) tip.classList.toggle('open');
}

// 카테고리 카드 클릭 → 해당 상세진단 섹션으로 부드럽게 스크롤 + 잠깐 강조
function scrollToCat(ck){
  const el=document.getElementById('detail-'+ck);
  if(!el) return;
  const y=el.getBoundingClientRect().top + window.pageYOffset - 16;
  window.scrollTo({ top:y, behavior:'smooth' });
  el.classList.add('cat-section-flash');
  setTimeout(function(){ el.classList.remove('cat-section-flash'); }, 1200);
}

// 간단한 토스트 알림
function showToast(msg){
  let t=document.getElementById('reportToast');
  if(!t){ t=document.createElement('div'); t.id='reportToast'; t.className='report-toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{ t.classList.remove('show'); }, 2600);
}

// 리포트 PDF 다운로드 (html2pdf.js 사용)
function downloadReportPDF(){
  const el=document.getElementById('reportContainer');
  if(!el){ showToast('리포트를 찾을 수 없어요'); return; }
  const r=window.__lastReport||{};
  const safeName=(r.name||'플레이스').replace(/[\\/:*?"<>|\s]+/g,'_');
  if(typeof window.html2pdf==='undefined'){
    showToast('PDF 모듈을 불러오는 중이에요. 잠시 후 다시 눌러주세요');
    return;
  }
  // 다운로드 중에는 버튼 영역을 숨겨 PDF에 포함되지 않게 함
  const actions=el.querySelector('.report-actions');
  if(actions) actions.style.visibility='hidden';
  showToast('PDF를 만들고 있어요...');
  const opt={
    margin:[8,8,8,8],
    filename:'플레이스진단_'+safeName+'.pdf',
    image:{type:'jpeg',quality:0.95},
    html2canvas:{scale:2,useCORS:true,backgroundColor:'#FBF7F0',scrollY:0},
    jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
    pagebreak:{mode:['css','legacy']}
  };
  // 화면 밖 캡처 카드(share-card-stage)는 PDF에 들어가면 안 되므로 잠시 제외
  const shareStage=el.querySelector('.share-card-stage');
  if(shareStage) shareStage.style.display='none';
  window.html2pdf().set(opt).from(el).save().then(()=>{
    if(actions) actions.style.visibility='visible';
    if(shareStage) shareStage.style.display='';
  }).catch(()=>{
    if(actions) actions.style.visibility='visible';
    if(shareStage) shareStage.style.display='';
    showToast('PDF 생성에 실패했어요. 다시 시도해주세요');
  });
}

// (T2) 결과 요약 카드를 PNG로 저장 (html2canvas)
function downloadShareCard(){
  const card=document.getElementById('shareCard');
  if(!card){ showToast('카드를 찾을 수 없어요'); return; }
  if(typeof window.html2canvas==='undefined'){
    showToast('이미지 모듈을 불러오는 중이에요. 잠시 후 다시 눌러주세요');
    return;
  }
  const r=window.__lastReport||{};
  const safeName=(r.name||'플레이스').replace(/[\\/:*?"<>|\s]+/g,'_');
  showToast('이미지를 만들고 있어요...');
  // 웹폰트(Pretendard)가 캡처 시점에 로드돼 있도록 보장
  Promise.resolve(document.fonts && document.fonts.ready).then(function(){
  window.html2canvas(card,{
    scale:1, useCORS:true, backgroundColor:null,
    width:1080, height:1350, windowWidth:1080, windowHeight:1350
  }).then(function(canvas){
    const link=document.createElement('a');
    link.download='플레이스진단_'+safeName+'.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
    showToast('이미지를 저장했어요!');
  }).catch(function(){
    showToast('이미지 생성에 실패했어요. 다시 시도해주세요');
  });
  });
}

// 내 점수 공유하기 (Web Share API → 실패 시 클립보드 복사)
async function shareScore(){
  const r=window.__lastReport||{};
  const text='['+(r.name||'우리 가게')+'] 네이버 플레이스 진단 결과: '+(r.score!=null?r.score:'-')+'점 ('+(r.grade||'-')+' 등급)\n셀러랩스 플레이스 진단으로 확인해보세요 👇';
  // 저장된 영구 링크(/r/{id})가 있으면 그걸 공유 → 카톡 미리보기(OG) 노출
  const url=(typeof sharedUrl!=='undefined' && sharedUrl) ? sharedUrl : window.location.href.split('#')[0];
  const shareData={ title:'네이버 플레이스 진단 결과', text:text, url:url };
  try{
    if(navigator.share){ await navigator.share(shareData); return; }
  }catch(e){ if(e&&e.name==='AbortError') return; }
  // 폴백: 클립보드 복사
  try{
    await navigator.clipboard.writeText(text+'\n'+url);
    showToast('점수 내용을 클립보드에 복사했어요!');
  }catch(e){
    showToast('공유를 지원하지 않는 환경이에요');
  }
}

function renderReport(result){
  const c=document.getElementById('reportContainer');
  // 공유·PDF 다운로드용 전역 저장
  window.__lastReport={ name:result.name, score:result.displayScore, grade:result.grade, category:result.category };
  const now=new Date();
  const dateStr=now.getFullYear()+'년 '+(now.getMonth()+1)+'월 '+now.getDate()+'일 '+
    String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');

  // 게이지
  const R=90, CIRC=2*Math.PI*R;
  const offset=CIRC*(1-result.displayScore/100);

  // 카테고리 요약 — 영역별 '완성도(%)'로 표시.
  //   · 종합 점수(displayScore)는 인기도(popScore)가 섞여 별도 산출되므로
  //     카드 합과 억지로 맞추는 '떠넘기기 보정'은 제거함.
  //   · 각 영역은 항목 실제점수 합 / 만점(N/A 제외) 기준 달성률(%)만 보여줌.
  const catSum={};
  let summaryHTML='';
  for(const ck of CAT_ORDER){
    const ci=result.items.filter(i=>i.cat===ck && !i.na);
    const realScore = ci.reduce((a,i)=>a+i.score,0);
    const realMax   = ci.reduce((a,i)=>a+i.max,0);
    const pct = realMax>0 ? Math.round(realScore/realMax*100) : 0;
    // 상세진단 헤더에서 재사용할 실제 점수/만점 저장
    catSum[ck]={ realScore:Math.round(realScore*10)/10, realMax, pct };
    summaryHTML+='<div class="summary-card" data-cat="'+CAT_META[ck].dataCat+'" '+
      'role="button" tabindex="0" onclick="scrollToCat(\''+ck+'\')" '+
      'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();scrollToCat(\''+ck+'\');}">'+
      '<div class="sc-name">'+CAT_META[ck].label+'</div>'+
      '<div class="sc-score">'+pct+'<span style="font-size:18px;font-weight:600;color:#A39A8E;">%</span></div>'+
      '<div class="sc-max">'+catSum[ck].realScore+' / '+realMax+'점</div>'+
      '<div class="summary-bar"><div class="summary-bar-fill" data-pct="'+pct+'"></div></div></div>';
  }

  // 항목 상세
  let detailHTML='';
  for(const ck of CAT_ORDER){
    const ci=result.items.filter(i=>i.cat===ck);
    if(!ci.length) continue;
    const cs=catSum[ck];
    let itemsHTML='';
    for(const item of ci){
      const ratio=item.max>0?item.score/item.max:0;
      let badge='badge-good';
      if(item.na)badge='badge-na';
      else if(ratio<0.4)badge='badge-bad';
      else if(ratio<0.7)badge='badge-warn';
      const badgeText=item.na?'N/A':(Math.round(item.score*10)/10)+' / '+item.max;
      const tip=TIPS[item.key];
      let tipHTML='';
      if(tip){
        tipHTML='<div class="coach-tip">'+
          '<button type="button" class="coach-tip-toggle" onclick="toggleTip(this)">'+
            '<span class="coach-tip-caret">▶</span> 셀러랩스의 실전 팁</button>'+
          '<div class="coach-tip-body">'+
            '<div class="coach-tip-row"><div class="bubble-logo-sm"><img src="/static/sellerlabs-bird.svg" alt="셀러랩스"></div>'+
            '<div class="coach-tip-text">'+escapeHtml(tip)+'</div></div></div></div>';
      }
      // 대표키워드 항목에는 순위추적 CTA를 노출해 사람들이 눈에 띄어 들어가게 한다.
      let ctaHTML='';
      if(item.key==='keywords'){
        ctaHTML='<a class="item-cta" href="https://sellerlabs.co.kr/naver/smartplace/ranking-track" target="_blank" rel="noopener">'+
          '<span class="item-cta-text">'+
            '<span class="item-cta-title">📈 내 대표키워드 순위 추적하기</span>'+
            '<span class="item-cta-desc">고객이 검색했을 때 내 매장이 몇 위에 뜨는지 무료로 확인해 보세요.</span>'+
          '</span>'+
          '<span class="item-cta-arrow">순위 추적하러 가기 →</span>'+
        '</a>';
      }
      itemsHTML+='<div class="item-card">'+
        '<div class="item-top"><span class="item-name">'+escapeHtml(item.name)+'</span>'+
        '<span class="item-badge '+badge+'">'+badgeText+'</span></div>'+
        '<div class="item-detail">'+escapeHtml(item.detail)+'</div>'+
        '<div class="item-comment-wrap"><div class="bubble-logo-sm"><img src="/static/sellerlabs-bird.svg" alt="셀러랩스"></div>'+
        '<div class="item-comment">'+escapeHtml(item.comment)+'</div></div>'+
        tipHTML+ctaHTML+'</div>';
    }
    detailHTML+='<div class="cat-section" id="detail-'+ck+'"><div class="cat-header" data-cat="'+CAT_META[ck].dataCat+'">'+
      '<span class="cat-dot"></span><span class="cat-label">'+CAT_META[ck].label+'</span>'+
      '<span class="cat-score-label">'+cs.realScore+' / '+cs.realMax+'점 ('+cs.pct+'%)</span></div>'+
      itemsHTML+'</div>';
  }

  // 액션플랜: 점수 비율 낮은 항목 top3 (N/A 제외)
  const weak=result.items.filter(i=>!i.na && i.max>0).map(i=>({...i,ratio:i.score/i.max}))
    .sort((a,b)=>a.ratio-b.ratio).slice(0,3);
  let actionHTML='';
  weak.forEach((it,i)=>{
    const act=ACTIONS[it.key];
    const todoText=act?act.todo:it.comment;
    const whyText=act?act.why:'';
    const scoreLabel=(Math.round(it.score*10)/10)+'/'+it.max+'점';
    actionHTML+='<div class="action-card"><div class="action-number">'+(i+1)+'</div>'+
      '<div class="action-body">'+
        '<div class="action-item-name">'+escapeHtml(it.name)+' <span class="action-item-score">('+scoreLabel+')</span></div>'+
        '<div class="action-current">현재: '+escapeHtml(it.detail)+'</div>'+
        '<div class="action-todo">'+escapeHtml(todoText)+'</div>'+
        (whyText?'<div class="action-why"><span class="action-why-label">왜 먼저?</span> '+escapeHtml(whyText)+'</div>':'')+
      '</div></div>';
  });

  // 의료기관 안내 (병원·의원은 의료광고법 사전심의 대상 → 일부 항목 진단 제외)
  const ind=result.industry||{};
  const medicalNotice = ind.isMedical
    ? '<div class="medical-notice">🏥 <b>의료기관 안내</b> — 병원·의원은 의료광고 사전심의 대상이라, 시술 사진·소식·체험단·할인(쿠폰) 권유는 진단에서 제외했어요. 허용되는 건 명칭·진료과목·의료진·진료시간·위치·예약 같은 <b>사실정보</b>와 <b>병원 공간·시설 사진</b>이에요.</div>'
    : '';

  // 리뷰 상세(최근 리뷰) 수집 실패 경고 — 네이버 봇 차단으로 GraphQL이 막혔을 때 노출
  const failNotice = result.reviewDetailFailed
    ? '<div class="warn-notice">⚠️ 최근 리뷰 데이터를 일시적으로 가져오지 못해 일부 리뷰 항목이 점수에서 제외됐어요. 잠시 후 다시 시도하면 더 정확한 점수가 나옵니다.</div>'
    : '';

  // 일부 항목 제외 안내 (N/A 항목이 있을 때) — 참조 사이트와 동일
  const naNotice = (result.naMaxScore>0)
    ? '<div class="na-notice">일부 항목(리뷰 상세 데이터 또는 업종에 해당 없는 항목)을 점수에서 제외하고 나머지 항목 기준으로 환산했습니다.</div>'
    : '';

  // 통계 — '진단 항목'은 서비스 표기와 일치하도록 26로 고정(항목 수는 업종별로 가변)
  const goodCount = result.items.filter(i=>i.score>=i.max*0.7).length;
  const badCount  = result.items.filter(i=>i.score<i.max*0.4).length;
  const totalCount= 26;

  /* ── 참조 사이트(마피아넷) 스타일 지표 섹션 ── */
  const M = result.metrics || {};
  const fmtRate = (v)=> (v===null||v===undefined||isNaN(v)) ? '-' : (v+'%');
  const fmtNum  = (v)=> (v===null||v===undefined) ? '-' : Number(v).toLocaleString();
  const starStr = (M.starRating===null||M.starRating===undefined||M.starRating===0)
    ? '비공개' : (Math.round(M.starRating*100)/100)+' / 5.0';

  // (구) 업체 종합 등급 카드 → 상단 점수 게이지와 중복이라 제거함.

  // 2) 주요 지표 (방문자 리뷰 / 평점 / 사진 리뷰)
  const keyMetricsHTML =
    '<div class="mp-card">'+
      '<div class="mp-card-title"><span class="mp-ic">📊</span> 주요 지표</div>'+
      '<div class="mp-metric-grid">'+
        '<div class="mp-metric"><div class="mp-metric-ic mp-ic-rev">💬</div>'+
          '<div class="mp-metric-val">'+fmtNum(M.totalReviews)+'</div><div class="mp-metric-lbl">방문자 리뷰</div></div>'+
        '<div class="mp-metric"><div class="mp-metric-ic mp-ic-star">⭐</div>'+
          '<div class="mp-metric-val">'+starStr+'</div><div class="mp-metric-lbl">평점</div></div>'+
        '<div class="mp-metric"><div class="mp-metric-ic mp-ic-cam">📷</div>'+
          '<div class="mp-metric-val">'+fmtNum(M.photoReviewCount)+'</div><div class="mp-metric-lbl">사진 리뷰</div></div>'+
      '</div>'+
    '</div>';

  // 3) 리뷰 품질 분석 (텍스트 / 미디어 / 다양성)
  const reviewQualHTML =
    '<div class="mp-card">'+
      '<div class="mp-card-title"><span class="mp-ic">📝</span> 리뷰 품질 분석</div>'+
      '<div class="mp-metric-grid">'+
        '<div class="mp-metric"><div class="mp-metric-ic mp-ic-text">📄</div>'+
          '<div class="mp-metric-val">'+fmtRate(M.textReviewRate)+'</div><div class="mp-metric-lbl">텍스트 리뷰 비율</div></div>'+
        '<div class="mp-metric"><div class="mp-metric-ic mp-ic-media">🖼️</div>'+
          '<div class="mp-metric-val">'+fmtRate(M.mediaReviewRate)+'</div><div class="mp-metric-lbl">미디어 리뷰 비율</div></div>'+
        '<div class="mp-metric"><div class="mp-metric-ic mp-ic-div">👥</div>'+
          '<div class="mp-metric-val">'+fmtRate(M.reviewerDiversity)+'</div><div class="mp-metric-lbl">리뷰어 다양성</div></div>'+
      '</div>'+
    '</div>';

  // 4) 프로필 완성도 (% 바 + 8개 체크리스트, 2열)
  const checklist = result.profileChecklist || [];
  const profPct = result.profileCompleteness || 0;
  let checkRows='';
  for(const item of checklist){
    checkRows+='<div class="mp-check '+(item.done?'mp-check-on':'mp-check-off')+'">'+
      '<span class="mp-check-mark">'+(item.done?'✓':'✗')+'</span>'+escapeHtml(item.label)+'</div>';
  }
  const profileHTML =
    '<div class="mp-card">'+
      '<div class="mp-card-title"><span class="mp-ic">✔︎</span> 프로필 완성도</div>'+
      '<div class="mp-prof-pct">'+profPct+'%</div>'+
      '<div class="mp-prof-bar"><div class="mp-prof-bar-fill" data-pct="'+profPct+'"></div></div>'+
      '<div class="mp-check-grid">'+checkRows+'</div>'+
    '</div>';

  // (구) 업체 정보 카드 → 상단 헤더(이름·카테고리·주소·바로가기)와 중복이라 제거함.
  //      주소는 헤더 shop-meta, 플레이스 링크는 헤더 '스마트플레이스 바로가기' 버튼으로 이동.

  // 가운데 마피아넷 스타일 섹션: 주요 지표 → 리뷰 품질 분석 → 프로필 완성도 순.
  const mapiaSectionHTML = keyMetricsHTML + reviewQualHTML + profileHTML;

  // 헤더 '스마트플레이스 바로가기' 링크용 URL (business.placeUrl 재사용)
  const placeUrl = (result.business && result.business.placeUrl) || '';

  c.innerHTML=
    '<div class="report-header">'+
      '<div class="header-nav">'+
        (placeUrl
          ? '<a class="header-nav-btn" href="'+placeUrl+'" target="_blank" rel="noopener">'+
              '<span class="hnb-ic">🔗</span> 스마트플레이스 바로가기</a>'
          : '')+
        '<button type="button" class="header-nav-btn" onclick="restart()">'+
          '<span class="hnb-ic">🔍</span> 다른 가게 진단하기</button>'+
      '</div>'+
      '<div class="shop-name">'+escapeHtml(result.name)+'</div>'+
      '<div class="shop-meta">'+escapeHtml(result.category)+(result.address?(' · '+escapeHtml(result.address)):'')+'</div>'+
      '<div class="report-date">진단일시: '+dateStr+'</div>'+
    '</div>'+

    medicalNotice+

    // 재진단 비교 배지가 들어갈 자리(주소 밑 · PLACE SCORE 위)
    '<div id="compareSlot"></div>'+

    '<div class="score-section">'+
      '<div class="score-gauge-container">'+
        '<svg viewBox="0 0 240 240">'+
          '<circle class="gauge-track" cx="120" cy="120" r="'+R+'"></circle>'+
          '<circle class="gauge-fill" cx="120" cy="120" r="'+R+'" '+
            'stroke="'+result.gradeColor+'" '+
            'stroke-dasharray="'+CIRC+'" stroke-dashoffset="'+CIRC+'" '+
            'transform="rotate(-90 120 120)" id="gaugeFill"></circle>'+
        '</svg>'+
        '<div class="score-text"><div class="score-label">PLACE SCORE</div>'+
          '<div class="score-number" style="color:'+result.gradeColor+'">'+result.displayScore+'</div>'+
          '<div class="score-max">/ 100점</div></div>'+
      '</div>'+
      '<div class="grade-badge" style="background:'+result.gradeColor+'">'+result.grade+' 등급</div>'+
      '<div class="score-stats">'+
        '<div class="score-stat"><div class="score-stat-value">'+goodCount+'</div><div class="score-stat-label">잘하는 항목</div></div>'+
        '<div class="score-stat"><div class="score-stat-value">'+badCount+'</div><div class="score-stat-label">보완 필요</div></div>'+
        '<div class="score-stat"><div class="score-stat-value">'+totalCount+'</div><div class="score-stat-label">진단 항목</div></div>'+
      '</div>'+
    '</div>'+

    '<div class="main-bubble-wrap"><div class="bubble-logo"><img src="/static/sellerlabs-bird.svg" alt="셀러랩스"></div>'+
      '<div class="speech-bubble">'+escapeHtml(result.gradeComment)+'</div></div>'+

    failNotice+
    naNotice+

    '<div class="report-actions">'+
      '<button type="button" class="report-action-btn" onclick="downloadShareCard()">'+
        '<span class="ra-icon">🖼️</span> 이미지로 저장</button>'+
      '<button type="button" class="report-action-btn" onclick="downloadReportPDF()">'+
        '<span class="ra-icon">📄</span> 리포트 PDF 다운로드</button>'+
      '<button type="button" class="report-action-btn" onclick="shareScore()">'+
        '<span class="ra-icon">🔗</span> 내 점수 공유하기</button>'+
    '</div>'+

    // 사장님 유형 카드: 공유/저장 버튼 아래로 이동
    '<div class="persona-card"><div class="persona-icon">'+result.personaIcon+'</div>'+
      '<div class="persona-label">사장님 유형</div>'+
      '<div class="persona-name">'+escapeHtml(result.persona)+'</div>'+
      '<div class="persona-desc">'+escapeHtml(result.personaDesc)+'</div></div>'+

    '<hr class="section-divider">'+
    '<div class="mp-section">'+mapiaSectionHTML+'</div>'+

    '<hr class="section-divider">'+
    '<div class="section-title">영역별 완성도</div>'+
    '<div class="section-subtitle">각 영역이 얼마나 채워졌는지 보여줘요. 종합 점수는 리뷰·인기도를 별도로 반영해 계산합니다.</div>'+
    '<div class="summary-grid">'+summaryHTML+'</div>'+

    '<hr class="section-divider">'+
    '<div class="section-title">셀러랩스라면, 이 3가지부터 시작하겠어요</div>'+
    '<div class="section-subtitle">점수 낮은 순서대로 마이마이가 처방한 우선순위예요 — 현장형으로 자세하게</div>'+
    '<div class="action-section">'+actionHTML+'</div>'+
    '<a class="action-cta-btn" href="https://smartplace.naver.com/bizes" target="_blank" rel="noopener">'+
      '<span class="acb-ic">🛠️</span> 이 3가지, 스마트플레이스에서 지금 수정하기'+
      '<span class="acb-arrow">›</span></a>'+

    '<hr class="section-divider">'+
    '<div class="section-title">항목별 상세 진단</div>'+
    '<div class="section-subtitle">모든 항목을 하나하나 살펴봤어요</div>'+
    detailHTML+

    '<div class="restart-wrap"><button class="btn-secondary" onclick="restart()">다른 가게 진단하기</button></div>'+
    '<div class="report-footer">본 진단은 네이버 플레이스 공개 정보를 기반으로 한 참고용 분석입니다.<br>실제 노출 순위는 네이버 알고리즘에 따라 달라질 수 있어요.'+
      '<div class="footer-brand"><img src="/static/sellerlabs-bird.svg" alt="셀러랩스" width="28" height="32"><br>'+
      '<a href="https://sellerlabs.co.kr" target="_blank" rel="noopener">sellerlabs.co.kr</a> · 스마트스토어·플레이스 순위 추적 솔루션</div></div>'+

    // (T2 개선) SNS 공유용 1080x1350 요약 카드 — 리포트 핵심을 한 장에
    '<div class="share-card-stage" aria-hidden="true">'+
      '<div id="shareCard" class="share-card">'+
        // 헤더: 브랜드 + 매장명
        '<div class="sc2-head">'+
          '<img src="/static/sellerlabs-logo.svg" alt="셀러랩스" class="sc2-logo">'+
          '<div class="sc2-store">'+escapeHtml(result.name)+'</div>'+
          '<div class="sc2-cat">'+escapeHtml(result.category)+'</div>'+
        '</div>'+
        // 점수 + 등급
        '<div class="sc2-score-row">'+
          '<div class="sc2-score" style="color:'+result.gradeColor+'">'+result.displayScore+
            '<span class="sc2-score-unit">점</span></div>'+
          '<div class="sc2-grade-wrap">'+
            '<div class="sc2-grade" style="background:'+result.gradeColor+'">'+result.grade+' 등급</div>'+
            '<div class="sc2-persona">'+result.personaIcon+' '+escapeHtml(result.persona)+'</div>'+
          '</div>'+
        '</div>'+
        // 주요 지표 3개
        '<div class="sc2-metrics">'+
          '<div class="sc2-metric"><div class="sc2-metric-val">'+fmtNum(M.totalReviews)+'</div><div class="sc2-metric-lbl">방문자 리뷰</div></div>'+
          '<div class="sc2-metric"><div class="sc2-metric-val">'+starStr+'</div><div class="sc2-metric-lbl">평점</div></div>'+
          '<div class="sc2-metric"><div class="sc2-metric-val">'+fmtNum(M.photoReviewCount)+'</div><div class="sc2-metric-lbl">사진 리뷰</div></div>'+
        '</div>'+
        // 영역별 완성도 (4개 바)
        '<div class="sc2-section-t">영역별 완성도</div>'+
        '<div class="sc2-bars">'+
          CAT_ORDER.map(function(ck){
            var cs=catSum[ck]||{pct:0};
            return '<div class="sc2-bar-row">'+
              '<span class="sc2-bar-label">'+CAT_META[ck].label+'</span>'+
              '<span class="sc2-bar-track"><span class="sc2-bar-fill" style="width:'+cs.pct+'%"></span></span>'+
              '<span class="sc2-bar-pct">'+cs.pct+'%</span></div>';
          }).join('')+
        '</div>'+
        // 우선 개선 3가지
        '<div class="sc2-section-t">먼저 개선하면 좋아요</div>'+
        '<div class="sc2-todos">'+
          weak.map(function(it,i){
            return '<div class="sc2-todo"><span class="sc2-todo-num">'+(i+1)+'</span>'+
              '<span class="sc2-todo-name">'+escapeHtml(it.name)+'</span></div>';
          }).join('')+
        '</div>'+
        '<div class="sc2-footer">네이버 플레이스 26개 항목 무료 진단 · sellerlabs.co.kr</div>'+
      '</div>'+
    '</div>';

  // 애니메이션
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      const g=document.getElementById('gaugeFill'); if(g) g.setAttribute('stroke-dashoffset', String(offset));
      document.querySelectorAll('.summary-bar-fill').forEach(el=>{ el.style.width=(el.dataset.pct||0)+'%'; });
      document.querySelectorAll('.mp-prof-bar-fill').forEach(el=>{ el.style.width=(el.dataset.pct||0)+'%'; });
    },100);
  });
}
`
