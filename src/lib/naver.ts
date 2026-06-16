/**
 * 네이버 플레이스 데이터 파서 (Cloudflare Workers 호환 — fetch + 정규식만 사용)
 *
 * 동작 개요
 *  1) 입력 URL에서 placeId 추출. naver.me 단축링크면 먼저 redirect 추적.
 *  2) m.place.naver.com/{type}/{id}/home 을 모바일 UA로 fetch.
 *  3) HTML 안의 window.__APOLLO_STATE__ (JSON)를 추출/파싱.
 *  4) PlaceDetailBase / Menu / FsasReview / VisitorReviewStatsResult 에서
 *     진단에 필요한 필드를 정리해 반환.
 */

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'

export interface PlaceData {
  id: string
  name: string
  category: string
  roadAddress: string
  address: string
  phone: string | null
  imageUrl: string | null
  industry: IndustryInfo
  conveniences: string[]
  paymentInfo: string[]
  imageCount: number
  styleCount: number
  totalMenus: number
  menuPriceRate: number
  menuPhotoRate: number
  totalReviewCount: number
  starRating: number | null
  textReviewCount: number
  imageReviewCount: number
  photoReviewRate: number
  blogCafeReviewCount: number
  blogLatestDaysAgo: number | null
  description: string
  placeIntro: string
  microIntro: string
  keywords: string[]
  hasBooking: boolean
  hasNPay: boolean
  hasCoupon: boolean
  hasBusinessHours: boolean
  hasCheckInOut: boolean
  hasTalkTalkAuto: boolean
  hasSmartCallAuto: boolean
  directionInfoAuto: string
  saveCount: number | null
  latestFeed: { within30Days: boolean; daysAgo: number | null } | null
  // 클립/동영상 콘텐츠 수 (수집 실패 시 null → engine에서 N/A 처리, 탭 조회됐는데 0개면 0)
  clipCount: number | null
  // 네이버 톡톡 응답률/응답시간 (점주 전용 지표라 공개 페이지엔 대개 없음 → 없으면 null)
  talkResponseRate: number | null
  talkResponseTime: string | null
  // 리뷰 상세 (HTML만으로는 최근 N일 단위 집계가 불완전 → 근사치)
  last7DaysReviews: number
  last30DaysReviews: number
  replyRate: number
  reviewQualityAvg: number
  hasReviewDetail: boolean
  reviewsAnalyzed: number
  // 리뷰 상세(GraphQL) 수집이 차단/실패했는지 여부 → 리포트 상단 경고 배너 노출용
  reviewDetailFailed: boolean
  // 리뷰 품질 4요소 비율
  reviewQualityDetails: {
    companionRate: number
    purposeRate: number
    detailedRate: number
    recommendRate: number
  } | null
  // AI 브리핑 적합도(정보풍부/보통/단답)
  aiBriefing: {
    positiveRate: number
    semiRate: number
    negativeRate: number
  } | null
  // 참조 사이트(마피아넷) 스타일 지표 (리뷰 상세 수집 실패 시 null)
  textReviewRate: number | null
  mediaReviewRate: number | null
  reviewerDiversity: number | null
}

export interface IndustryInfo {
  tier: number
  group: string
  displayName: string
  matched: boolean
  mismatch: string | null
  naItemKeys: string[]
  isMedical: boolean
}

/* ------------------------------------------------------------------ */
/* placeId 추출                                                        */
/* ------------------------------------------------------------------ */

function extractPlaceId(url: string): { id: string; type: string } | null {
  // 지원 URL 예시
  //  - https://map.naver.com/p/entry/place/1603635150
  //  - https://map.naver.com/v5/entry/place/1603635150
  //  - https://m.place.naver.com/restaurant/11726718/home
  //  - https://m.place.naver.com/place/11726718
  //  - https://pcmap.place.naver.com/restaurant/11726718/home
  //  - https://place.naver.com/restaurant/11726718
  //  - https://map.naver.com/?...&id=11726718  / ...placePath=/restaurant/11726718
  //  - naver.me 단축링크(사전 해제 후)

  // 1) /{type}/{id} 형태에서 type과 id를 함께 추출
  const typeIdMatch = url.match(
    /(?:^|\/)(restaurant|hairshop|beauty|hospital|pharmacy|clinic|accommodation|attraction|cafe|academy|place|share|hairshop)\/(\d{5,})/i
  )
  if (typeIdMatch) {
    const type = typeIdMatch[1].toLowerCase()
    return { id: typeIdMatch[2], type: type === 'place' ? 'place' : type }
  }

  // 2) entry/place/{id} (map.naver.com 신규 형식)
  const entryMatch = url.match(/entry\/place\/(\d{5,})/i)
  if (entryMatch) return { id: entryMatch[1], type: 'place' }

  // 3) ?id=12345 / &placeId=12345
  const queryMatch = url.match(/[?&](?:id|placeId|entryId)=(\d{5,})/i)
  if (queryMatch) return { id: queryMatch[1], type: 'place' }

  // 4) 마지막 폴백: URL 안의 가장 긴 숫자열(5자리 이상)을 id로 간주
  const numMatches = url.match(/\d{5,}/g)
  if (numMatches && numMatches.length) {
    // 가장 긴 숫자(placeId는 보통 7~12자리)를 선택
    const id = numMatches.sort((a, b) => b.length - a.length)[0]
    return { id, type: 'place' }
  }

  return null
}

async function resolveShortUrl(url: string): Promise<string> {
  // naver.me 등 단축 링크 → 실제 URL 추적
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': MOBILE_UA },
  })
  return res.url || url
}

/* ------------------------------------------------------------------ */
/* APOLLO_STATE 추출                                                   */
/* ------------------------------------------------------------------ */

function extractApolloState(html: string): Record<string, any> | null {
  const marker = 'window.__APOLLO_STATE__'
  const idx = html.indexOf(marker)
  if (idx === -1) return null
  // '=' 다음 첫 '{' 부터 brace balance로 끝까지
  const eq = html.indexOf('=', idx)
  if (eq === -1) return null
  let start = html.indexOf('{', eq)
  if (start === -1) return null

  let depth = 0
  let inStr = false
  let strCh = ''
  let esc = false
  let end = -1
  for (let i = start; i < html.length; i++) {
    const ch = html[i]
    if (inStr) {
      if (esc) {
        esc = false
      } else if (ch === '\\') {
        esc = true
      } else if (ch === strCh) {
        inStr = false
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      inStr = true
      strCh = ch
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  if (end === -1) return null
  try {
    return JSON.parse(html.slice(start, end))
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* 업종 판정                                                            */
/* ------------------------------------------------------------------ */

function detectIndustry(category: string): IndustryInfo {
  const c = category || ''
  const make = (
    tier: number,
    group: string,
    displayName: string,
    naItemKeys: string[] = [],
    isMedical = false
  ): IndustryInfo => ({
    tier,
    group,
    displayName,
    matched: true,
    mismatch: null,
    naItemKeys,
    isMedical,
  })

  // 숙박 (호텔·모텔·펜션·캠핑·글램핑·야영장 등 — 메뉴/가격·영업시간 개념 약함)
  if (
    /(호텔|모텔|펜션|게스트하우스|리조트|민박|숙박|글램핑|캠핑|야영|오토캠|카라반|풀빌라|한옥스테이|스테이|콘도|유스호스텔|여관|모텔)/.test(
      c
    )
  )
    return make(2, 'accommodation', '숙박업', [
      'recent7',
      'recent30',
      'menuPrice',
      'menuPhoto',
      'businessHours',
    ])
  // 의료
  if (/(병원|의원|치과|한의원|성형|피부과|정형외과|약국|클리닉|의료)/.test(c))
    return make(2, 'medical', '의료기관', ['news', 'blogReview', 'coupon'], true)
  // 뷰티
  if (/(미용실|헤어|네일|속눈썹|왁싱|피부관리|에스테틱|마사지|스파|태닝|바버|체형)/.test(c))
    return make(2, 'beauty', '뷰티·미용', [])
  // 교육 (학원·교습소·어학·입시·예체능 교육 등)
  if (
    /(학원|교습소|과외|어학|영어|중국어|일본어|회화|학습|교육|클래스|레슨|입시|보습|논술|코딩|미술학원|음악학원|피아노|태권도|유치원|어린이집|독서실|스터디)/.test(
      c
    )
  )
    return make(2, 'education', '교육·학원', ['recent7'])
  // 운동·피트니스·여가 (헬스장·요가·필라테스·골프 등 — 메뉴/가격 개념 약함)
  if (
    /(헬스|피트니스|짐|크로스핏|요가|필라테스|골프|클라이밍|수영|복싱|주짓수|무도|댄스|PT|스포츠|체육관|볼링|당구|스크린)/.test(
      c
    )
  )
    return make(2, 'fitness', '운동·피트니스', ['menuPrice', 'menuPhoto'])
  // 부동산
  if (/(부동산|공인중개|중개사)/.test(c))
    return make(2, 'realestate', '부동산', ['recent7', 'menuPhoto'])
  // 전문 서비스 (세무·법률·금융·노무·컨설팅 등) — 메뉴/가격이 없는 업종
  if (
    /(세무|회계|법무|법률|변호사|변리사|노무|행정사|손해사정|특허|컨설팅|금융|보험|대출|투자|감정평가)/.test(
      c
    )
  )
    return make(3, 'professional', '전문 서비스', [
      'recent7',
      'recent30',
      'menuPrice',
      'menuPhoto',
    ])
  // 사진·스튜디오 (예약 중심, 메뉴/가격 약함)
  if (/(사진관|스튜디오|포토|사진|촬영|증명사진)/.test(c))
    return make(3, 'studio', '사진·스튜디오', ['menuPrice'])
  // 유흥·여가 (노래방·PC방·카페형 여가 등 — 메뉴 개념 약함)
  if (/(노래방|노래연습장|PC방|피씨방|만화|보드게임|방탈출|오락|유흥|클럽|라운지)/.test(c))
    return make(3, 'leisure', '여가·오락', ['menuPrice', 'menuPhoto'])
  // 기타 서비스/상품 (Tier 3)
  if (
    /(정비|수리|세차|인테리어|이사|청소|꽃집|꽃배달|반려|동물병원|수선|세탁|장례|열쇠|간판|광고|운송|택배|렌탈|대여)/.test(
      c
    )
  )
    return make(3, 'service', '서비스업', ['recent7'])
  // 카페·디저트
  if (/(카페|디저트|베이커리|빵집|커피|브런치|찻집|티룸)/.test(c))
    return make(1, 'food', '카페·디저트', [])
  // 음식점 계열 명시 매칭
  if (
    /(식당|음식|횟집|고기|한식|중식|일식|양식|분식|치킨|피자|주점|술집|바|뷔페|국밥|냉면|찌개|구이|회|초밥|요리|맛집|레스토랑|곱창|족발|보쌈|국수|찜|탕|면|밥|포차)/.test(
      c
    )
  )
    return make(1, 'food', '식당·카페·주점', [])
  // 기본: 분류 불가 시 일반 서비스 (food로 오분류 방지)
  return make(3, 'service', '일반 업종', ['recent7'])
}

/* ------------------------------------------------------------------ */
/* 날짜 파싱 (블로그 리뷰 "1일 전" / "2025.01.23." 형식)                 */
/* ------------------------------------------------------------------ */

function parseDaysAgo(dateStr: string): number | null {
  if (!dateStr) return null
  const s = dateStr.trim()
  if (/방금|오늘/.test(s)) return 0
  let m = s.match(/(\d+)\s*일\s*전/)
  if (m) return parseInt(m[1], 10)
  m = s.match(/(\d+)\s*주\s*전/)
  if (m) return parseInt(m[1], 10) * 7
  m = s.match(/(\d+)\s*개월\s*전/)
  if (m) return parseInt(m[1], 10) * 30
  m = s.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/)
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3])
    const diff = Date.now() - d.getTime()
    return Math.max(0, Math.floor(diff / 86400000))
  }
  return null
}

/* ------------------------------------------------------------------ */
/* 메인                                                                 */
/* ------------------------------------------------------------------ */

export async function fetchPlaceData(inputUrl: string): Promise<PlaceData> {
  let url = inputUrl.trim()

  // 공유 텍스트에 섞인 URL 추출
  const urlMatch = url.match(/https?:\/\/[^\s]+/)
  if (urlMatch) url = urlMatch[0]

  // naver.me 단축링크 해제
  if (/naver\.me/.test(url)) {
    url = await resolveShortUrl(url)
  }

  let parsed = extractPlaceId(url)
  if (!parsed) {
    // 혹시 리다이렉트 후 placeId가 생길 수 있으니 한 번 더 추적
    url = await resolveShortUrl(url)
    parsed = extractPlaceId(url)
  }
  if (!parsed) {
    throw new Error('플레이스 URL에서 매장 ID를 찾지 못했어요. 링크를 확인해주세요')
  }

  const { id } = parsed

  const headers = {
    'User-Agent': MOBILE_UA,
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'ko-KR,ko;q=0.9',
  }

  // 특정 type 경로의 home HTML을 가져온다. (리다이렉트는 따라감)
  const fetchHtml = async (type: string): Promise<string | null> => {
    const res = await fetch(`https://m.place.naver.com/${type}/${id}/home`, {
      headers,
      redirect: 'follow',
    })
    if (!res.ok) return null
    const text = await res.text()
    // 빈 리다이렉트 안내 페이지(짧은 HTML)는 무효 처리
    if (text.length < 1000 && /Redirecting to/i.test(text)) return null
    return text
  }

  /**
   * 네이버가 알려주는 "정식 type 경로"를 동적으로 알아낸다.
   *   m.place.naver.com/place/{id} 는 업종에 맞는 경로(/restaurant, /hairshop ...)로
   *   302 리다이렉트되므로, 그 Location의 type 세그먼트를 신뢰한다.
   *   (모든 업종에서 동작하는 범용 방식 — 타입 하드코딩 불필요)
   */
  const resolveCanonicalType = async (): Promise<string | null> => {
    try {
      const res = await fetch(`https://m.place.naver.com/place/${id}`, {
        headers,
        redirect: 'follow',
      })
      const finalUrl = res.url || ''
      const m = finalUrl.match(/m\.place\.naver\.com\/([a-z]+)\/\d+/i)
      if (m && m[1] && m[1] !== 'place') return m[1]
    } catch {
      /* ignore */
    }
    return null
  }

  // 1) 네이버가 알려주는 정식 타입을 우선 사용
  let html: string | null = null
  let apollo: Record<string, any> | null = null

  const canonical = await resolveCanonicalType()
  const tryTypes: string[] = []
  if (canonical) tryTypes.push(canonical)
  // 2) URL에서 추출한 타입, 그리고 알려진 전체 타입 목록으로 폴백
  for (const t of [
    parsed.type,
    'restaurant',
    'place',
    'hairshop',
    'beauty',
    'hospital',
    'pharmacy',
    'accommodation',
    'attraction',
    'cafe',
    'academy',
    'share', // 공유오피스/기타
  ]) {
    if (!tryTypes.includes(t)) tryTypes.push(t)
  }

  let usedType: string | null = null
  for (const t of tryTypes) {
    html = await fetchHtml(t)
    apollo = html ? extractApolloState(html) : null
    if (apollo && findBase(apollo, id)) {
      usedType = t
      break
    }
    apollo = null
  }

  if (!apollo) {
    throw new Error('네이버에서 매장 정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요')
  }

  const base = findBase(apollo, id)
  if (!base) {
    throw new Error('매장 정보를 찾지 못했어요. 플레이스 URL이 맞는지 확인해주세요')
  }

  const detail = findPlaceDetail(apollo)

  // 방문자 리뷰 상세(최근 리뷰·답글)를 네이버 GraphQL로 추가 수집 → hasReviewDetail=true
  // 참조 사이트와 동일하게 최근 7/30일 리뷰 수, 답글 비율, 사진 리뷰 비율을 정확히 계산한다.
  const businessType = (usedType && usedType !== 'place' ? usedType : (parsed.type || 'restaurant'))
  const reviewDetail = await fetchVisitorReviewDetail(id, businessType)

  // 소식(피드) 최신 게시일을 소식 탭 HTML에서 추가 수집 → '5일 전 게시'처럼 표시
  const feedDetail = await fetchFeedDetail(id)

  // 클립/동영상 탭에서 등록 수 추가 수집 (canonical 타입 사용, 실패 시 null → N/A)
  const clipCount = await fetchClipCount(id, businessType)

  return assemble(apollo, base, id, detail, reviewDetail, feedDetail, clipCount)
}

/**
 * 네이버 플레이스 소식(피드) 탭에서 가장 최근 소식의 게시일을 가져온다.
 * 직접 작성 소식(feedExist)뿐 아니라 블로그 연동 소식(BLOG)도 포함하며,
 * 각 Feed 객체의 createdString(YYYYMMDD)을 파싱해 며칠 전인지 계산한다.
 */
interface FeedDetail {
  latestDate: string | null // YYYYMMDD
  daysAgo: number | null
  within30Days: boolean
}
async function fetchFeedDetail(id: string): Promise<FeedDetail | null> {
  try {
    const res = await fetch(`https://m.place.naver.com/place/${id}/feed`, {
      headers: {
        'User-Agent': MOBILE_UA,
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Accept: 'text/html',
      },
    })
    if (!res.ok) return null
    const html = await res.text()

    // Feed 객체들의 createdString(YYYYMMDD)을 모두 수집 (가장 최근 날짜 사용)
    const dates: string[] = []
    const re = /"createdString":"(\d{8})"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) dates.push(m[1])
    if (dates.length === 0) return null

    // 가장 최근(가장 큰) 날짜
    dates.sort()
    const latest = dates[dates.length - 1]

    const y = Number(latest.slice(0, 4))
    const mo = Number(latest.slice(4, 6))
    const d = Number(latest.slice(6, 8))
    const feedDate = new Date(y, mo - 1, d)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const daysAgo = Math.max(0, Math.round((today.getTime() - feedDate.getTime()) / 86400000))

    return { latestDate: latest, daysAgo, within30Days: daysAgo <= 30 }
  } catch {
    return null
  }
}

/**
 * 네이버 플레이스 클립/동영상 탭에서 등록된 클립 수를 가져온다.
 *   - 클립 탭(/{businessType}/{id}/clip)을 fetch (canonical 타입이어야 빈 리다이렉트가 아님).
 *   - 응답 HTML 안의 Clip/Moment/Video 정규화 키 또는 clipUrl/videoId 패턴을 카운트.
 *   - fetch 실패/빈 리다이렉트면 null(데이터를 못 가져옴 → N/A), 조회는 됐는데 0개면 0 반환.
 */
async function fetchClipCount(id: string, businessType: string): Promise<number | null> {
  try {
    const res = await fetch(`https://m.place.naver.com/${businessType}/${id}/clip`, {
      headers: {
        'User-Agent': MOBILE_UA,
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Accept: 'text/html',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()
    // 빈 리다이렉트 안내 페이지(짧은 HTML)는 데이터 미수집 → null
    if (html.length < 1000 && /Redirecting to/i.test(html)) return null

    // ⚠️ 주의: 클립 탭 HTML에는 "리뷰에 첨부된 동영상(VideoItemInfo+reviewId)"도 섞여 있어
    //    무분별하게 video를 세면 매장 클립이 아닌 리뷰 영상을 클립으로 오인한다.
    //    → 매장이 직접 올린 클립 전용 식별자만 카운트한다.

    // 1) 매장 클립 전용 Apollo 정규화 키(ShortClip/Moment/PlaceClip/ClipContent 등)
    const keySet = new Set<string>()
    const keyRe = /"((?:ShortClip|ShortForm|Moment|PlaceClip|ClipContent)[A-Za-z]*):([^"]+)"/g
    let km: RegExpExecArray | null
    while ((km = keyRe.exec(html)) !== null) keySet.add(km[1] + ':' + km[2])
    if (keySet.size > 0) return keySet.size

    // 2) 매장 클립 전용 식별자(clipSeq/clipNo/clipId/momentId) — videoId는 리뷰 영상과 겹쳐 제외
    const idSet = new Set<string>()
    const idRe = /"(?:clipSeq|clipNo|clipId|momentId)":"?([A-Za-z0-9]{3,})"?/g
    let im: RegExpExecArray | null
    while ((im = idRe.exec(html)) !== null) idSet.add(im[1])
    if (idSet.size > 0) return idSet.size

    // 3) 매장 클립 전용 신호가 전혀 없음.
    //    클립 탭은 클립 목록을 비동기 API로 별도 로딩하므로, SSR HTML만으로는
    //    "정말 0개"인지 "SSR에 안 실린 것"인지 단정할 수 없다 → null(N/A)로 안전 처리.
    return null
  } catch {
    return null
  }
}

/**
 * 네이버 플레이스 방문자 리뷰 GraphQL API로 최신 리뷰 목록을 가져와
 * 최근 7/30일 리뷰 수, 답글 비율, 사진 리뷰 비율, 리뷰 품질 근사치를 계산한다.
 * 실패 시 null 반환(→ hasReviewDetail=false 로 N/A 처리).
 */

/**
 * 마지막 GraphQL 리뷰 상세 호출이 차단(403/429/5xx/빈응답)됐는지 여부.
 * fetchVisitorReviewDetail 호출 직후 assemble 단계에서 읽어 reviewDetailFailed 로 전달한다.
 * (모듈 스코프 단일 진단 흐름 기준 — 요청마다 fetchVisitorReviewDetail 시작 시 false 로 리셋)
 */
let lastGraphqlBlocked = false

/**
 * 네이버 m.place 프런트가 GraphQL 호출 시 보내는 x-wtm-graphql 컨텍스트 토큰을 모사.
 * 형식이 수시로 바뀌어 보장되진 않지만, Origin/Referer 와 함께 보내면 성공률이 오른다.
 */
function buildWtmGraphql(id: string, businessType: string): string {
  try {
    const payload = JSON.stringify({ arg: id, type: businessType, source: 'place' })
    // Cloudflare Workers 환경에 btoa 존재
    return btoa(unescape(encodeURIComponent(payload)))
  } catch {
    return ''
  }
}
export interface ReviewDetail {
  last7DaysReviews: number
  last30DaysReviews: number
  replyRate: number
  photoReviewRate: number
  reviewQualityAvg: number
  analyzed: number
  // ── 리뷰 품질 4요소 비율 (참조 사이트와 동일) ──
  companionRate: number // 동행(누구와)
  purposeRate: number // 목적(왜)
  detailedRate: number // 구체적(무엇을)
  recommendRate: number // 추천 한마디
  // ── AI 브리핑 적합도(정보풍부/보통/단답 분류) ──
  aiPositiveRate: number // 정보 풍부 (AI가 쓸 만함)
  aiSemiRate: number // 보통
  aiNegativeRate: number // 단답
  // ── 참조 사이트(마피아넷) 스타일 지표 ──
  textReviewRate: number // 텍스트 리뷰 비율 (본문이 담긴 리뷰 비율)
  mediaReviewRate: number // 미디어 리뷰 비율 (리뷰당 미디어 총 개수 / 리뷰 수 → 100% 초과 가능)
  reviewerDiversity: number // 리뷰어 다양성 (고유 작성자 비율, author.id 없으면 0)
}

async function fetchVisitorReviewDetail(
  id: string,
  businessType: string
): Promise<ReviewDetail | null> {
  const buildBody = (page: number) => [
    {
      operationName: 'getVisitorReviews',
      variables: {
        input: {
          businessId: id,
          businessType,
          page,
          size: 50,
          isPhotoUsed: false,
          includeContent: true,
          getAuthorInfo: true,
          item: '0',
        },
        id,
      },
      query:
        'query getVisitorReviews($input: VisitorReviewsInput) { visitorReviews(input: $input) { total items { rating author { id } body created reply { body } media { thumbnail } } } }',
    },
  ]

  // 이번 진단 호출 시작 시 차단 플래그 리셋
  lastGraphqlBlocked = false

  const fetchPage = async (page: number, attempt = 0): Promise<any[]> => {
    try {
      const res = await fetch('https://api.place.naver.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': MOBILE_UA,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          // ↓ 네이버가 검사하는 핵심 헤더들 (Origin / 정확한 Referer / 컨텍스트 토큰)
          Origin: 'https://m.place.naver.com',
          Referer: `https://m.place.naver.com/${businessType}/${id}/review/visitor`,
          'x-wtm-graphql': buildWtmGraphql(id, businessType),
        },
        body: JSON.stringify(buildBody(page)),
      })

      // 차단/오류를 조용히 삼키지 말고 플래그로 표시 + 백오프 재시도
      if (res.status === 403 || res.status === 429 || res.status >= 500) {
        lastGraphqlBlocked = true
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
          return fetchPage(page, attempt + 1)
        }
        return []
      }
      if (!res.ok) {
        lastGraphqlBlocked = true
        return []
      }

      const j: any = await res.json()
      const items = j?.[0]?.data?.visitorReviews?.items
      if (!Array.isArray(items)) {
        // 200 인데 items 가 비정상 → 봇 차단/빈 응답으로 간주
        lastGraphqlBlocked = true
        return []
      }
      return items
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
        return fetchPage(page, attempt + 1)
      }
      lastGraphqlBlocked = true
      return []
    }
  }

  const items = [...(await fetchPage(1)), ...(await fetchPage(2))]
  if (items.length === 0) return null

  const now = new Date()
  const MS = 86400000
  let last7 = 0
  let last30 = 0
  let withReply = 0
  let withPhoto = 0
  let qualitySum = 0
  // 4요소 카운터
  let companionCnt = 0
  let purposeCnt = 0
  let detailedCnt = 0
  let recommendCnt = 0
  // AI 브리핑 분류 카운터
  let aiPositive = 0
  let aiSemi = 0
  let aiNegative = 0
  // ── 참조 사이트(마피아넷) 스타일 지표 카운터 ──
  let withText = 0 // 텍스트(본문)가 충분히 담긴 리뷰
  let mediaTotal = 0 // 미디어(사진/영상) 총 개수 — 리뷰당 여러 장 → 100% 초과 가능
  const authorSet = new Set<string>() // 고유 작성자 (리뷰어 다양성)

  for (const it of items) {
    const dt = parseReviewDate(it.created || '', now)
    if (dt) {
      const days = (now.getTime() - dt.getTime()) / MS
      if (days <= 7) last7++
      if (days <= 30) last30++
    }
    if (it.reply && it.reply.body) withReply++
    const mediaCnt = Array.isArray(it.media) ? it.media.length : 0
    const hasMedia = mediaCnt > 0
    if (hasMedia) withPhoto++
    mediaTotal += mediaCnt

    const body: string = typeof it.body === 'string' ? it.body : ''
    const len = body.length
    // 텍스트 리뷰: 본문이 10자 이상 담긴 리뷰
    if (len >= 10) withText++
    // 리뷰어 다양성: 작성자 고유 식별자 수집 (author.id 없으면 무시)
    const authorId = it.author && it.author.id ? String(it.author.id) : ''
    if (authorId) authorSet.add(authorId)

    // ── 리뷰 품질 4요소 판정 (각 리뷰가 해당 요소를 담고 있으면 +1) ──
    // ① 동행(누구와): 가족·친구·아이·부모·커플 등 동행자 언급
    const hasCompanion = /아이|애기|아기|딸|아들|자녀|아이들|가족|친구|남편|아내|와이프|엄마|아빠|부모|딸아이|아들아이|동생|언니|누나|형|선생님|관장님|코치|동행|함께|같이/.test(body)
    // ② 목적(왜): 체험·등록·상담·시험·승급·생일·데이트·회식 등 방문 목적
    const hasPurpose = /때문|위해|위한|하려고|배우|등록|체험|상담|시험|승급|심사|대회|생일|데이트|회식|기념|운동|다이어트|건강|치료|교정|레슨|수업|수강|준비/.test(body)
    // ③ 구체적(무엇을): 숫자(가격·횟수·기간) 또는 구체 활동/시술/메뉴명, 충분한 길이
    const hasDetail = (/[0-9]/.test(body) || /개월|주차|동작|품새|발차기|겨루기|줄넘기|매트|코스|메뉴|시술|커트|펌|염색|레이어드/.test(body)) && len >= 25
    // ④ 추천 한마디: 추천·만족·최고·강추·재방문 등 평가
    const hasRecommend = /추천|강추|만족|최고|짱|좋아|좋았|훌륭|친절|깔끔|감사|또 올|또 갈|재방문|믿고|굿|만족스/.test(body)

    if (hasCompanion) companionCnt++
    if (hasPurpose) purposeCnt++
    if (hasDetail) detailedCnt++
    if (hasRecommend) recommendCnt++

    // 4요소 합 → 0~4 (참조의 reviewQualityAvg 와 동일 척도)
    const q = (hasCompanion ? 1 : 0) + (hasPurpose ? 1 : 0) + (hasDetail ? 1 : 0) + (hasRecommend ? 1 : 0)
    qualitySum += q

    // ── AI 브리핑 분류: 정보풍부 / 보통 / 단답 ──
    // 정보풍부(Positive): 요소 2개 이상 + 충분한 길이 → AI가 요약에 쓸 만함
    // 보통(Semi): 요소 1개 또는 중간 길이
    // 단답(Negative): "좋아요/만족" 같은 짧은 리뷰
    if (q >= 2 && len >= 30) aiPositive++
    else if (q >= 1 || len >= 20) aiSemi++
    else aiNegative++
  }

  const n = items.length
  const pct = (x: number) => Math.round((x / n) * 100)
  return {
    last7DaysReviews: last7,
    last30DaysReviews: last30,
    replyRate: Math.round((withReply / n) * 100),
    photoReviewRate: Math.round((withPhoto / n) * 100),
    reviewQualityAvg: Math.round((qualitySum / n) * 10) / 10,
    analyzed: n,
    companionRate: pct(companionCnt),
    purposeRate: pct(purposeCnt),
    detailedRate: pct(detailedCnt),
    recommendRate: pct(recommendCnt),
    aiPositiveRate: pct(aiPositive),
    aiSemiRate: pct(aiSemi),
    aiNegativeRate: pct(aiNegative),
    // ── 참조 사이트(마피아넷) 스타일 지표 ──
    // 텍스트 리뷰 비율: 본문이 담긴 리뷰 비율
    textReviewRate: pct(withText),
    // 미디어 리뷰 비율: 사진/영상 포함 리뷰 비율 기준 + 멀티미디어 가중(리뷰당 평균 장수 반영, 최대 130%로 캡)
    mediaReviewRate: Math.min(
      130,
      Math.round(((withPhoto / n) * 100 + ((mediaTotal - withPhoto) / n) * 20) * 10) / 10
    ),
    reviewerDiversity: authorSet.size > 0 ? Math.round((authorSet.size / n) * 1000) / 10 : 0,
  }
}

/**
 * 네이버 리뷰 created 문자열을 Date로 파싱.
 *   "5.23.토"      → 올해 5/23
 *   "24.5.23.목"   → 2024/5/23
 *   "3일 전" 등 상대표현은 daysAgo 로 환산
 */
function parseReviewDate(s: string, now: Date): Date | null {
  if (!s) return null
  const rel = s.match(/(\d+)\s*일\s*전/)
  if (rel) {
    const d = new Date(now)
    d.setDate(d.getDate() - Number(rel[1]))
    return d
  }
  if (/오늘|방금|시간\s*전|분\s*전/.test(s)) return new Date(now)
  const nums = s
    .split('.')
    .map((x) => x.trim())
    .filter((p) => /^\d+$/.test(p))
    .map(Number)
  let y: number, mo: number, d: number
  if (nums.length >= 3) {
    y = 2000 + nums[0]
    mo = nums[1]
    d = nums[2]
  } else if (nums.length === 2) {
    y = now.getFullYear()
    mo = nums[0]
    d = nums[1]
  } else {
    return null
  }
  const dt = new Date(y, mo - 1, d)
  if (dt.getTime() > now.getTime()) dt.setFullYear(dt.getFullYear() - 1)
  return dt
}

function findBase(apollo: Record<string, any>, id: string): any {
  return (
    apollo[`PlaceDetailBase:${id}`] ||
    Object.entries(apollo).find(([k]) => k.startsWith('PlaceDetailBase:'))?.[1] ||
    null
  )
}

/**
 * ROOT_QUERY.placeDetail({...}) 객체를 찾는다.
 * 상세설명·대표키워드·영업시간·주차정보 등 home HTML의 풍부한 데이터가 여기 들어있다.
 * 키 이름에 GraphQL 인자가 직렬화되어 붙으므로(예: placeDetail({"input":...})) prefix로 매칭.
 */
function findPlaceDetail(apollo: Record<string, any>): any {
  const root = apollo.ROOT_QUERY || apollo['ROOT_QUERY'] || null
  if (!root || typeof root !== 'object') return null
  for (const k of Object.keys(root)) {
    if (k.startsWith('placeDetail(')) return root[k]
  }
  return null
}

/** 객체에서 prefix로 시작하는 첫 키의 값을 반환 (GraphQL 인자 붙은 키 매칭용) */
function getByKeyPrefix(obj: any, prefix: string): any {
  if (!obj || typeof obj !== 'object') return undefined
  for (const k of Object.keys(obj)) {
    if (k === prefix || k.startsWith(prefix + '(')) return obj[k]
  }
  return undefined
}

function assemble(
  apollo: Record<string, any>,
  base: any,
  id: string,
  detail?: any,
  reviewDetail?: ReviewDetail | null,
  feedDetail?: FeedDetail | null,
  clipCountArg?: number | null
): PlaceData {
  const category: string = base.category || ''
  const industry = detectIndustry(category)
  detail = detail || {}

  // ── 메뉴 ──
  const menus = Object.entries(apollo)
    .filter(([k]) => k.startsWith('Menu:'))
    .map(([, v]) => v as any)
  const totalMenus = menus.length
  const menuWithPrice = menus.filter((m) => m.price && String(m.price).trim()).length
  const menuWithPhoto = menus.filter(
    (m) => (Array.isArray(m.images) && m.images.length > 0) || m.image
  ).length
  const menuPriceRate = totalMenus ? Math.round((menuWithPrice / totalMenus) * 100) : 0
  const menuPhotoRate = totalMenus ? Math.round((menuWithPhoto / totalMenus) * 100) : 0

  // ── 블로그/카페 리뷰 ──
  const blogs = Object.entries(apollo)
    .filter(([k]) => k.startsWith('FsasReview:'))
    .map(([, v]) => v as any)
  let blogLatestDaysAgo: number | null = null
  for (const b of blogs) {
    const d = parseDaysAgo(b.date || b.createdString || '')
    if (d !== null && (blogLatestDaysAgo === null || d < blogLatestDaysAgo)) {
      blogLatestDaysAgo = d
    }
  }
  const blogCafeReviewCount = base.cafeBlogReviewsTotal || 0

  // ── 방문자 리뷰 통계 ──
  const vrStats =
    apollo[`VisitorReviewStatsResult:${id}`] ||
    Object.entries(apollo).find(([k]) => k.startsWith('VisitorReviewStatsResult:'))?.[1] ||
    {}
  const review = (vrStats as any).review || {}
  const totalReviewCount = base.visitorReviewsTotal || review.totalCount || 0
  // 별점: 네이버가 매장 설정으로 별점을 숨기면(showVisitorReviewScore:false) 또는 0이면 N/A
  const rawStar = base.visitorReviewsScore || review.avgRating || 0
  const showStar = !(base.reviewSettings && base.reviewSettings.showVisitorReviewScore === false)
  const starRating: number | null = rawStar > 0 && showStar ? rawStar : null
  const textReviewCount = base.visitorReviewsTextReviewTotal || 0
  const imageReviewCount = review.imageReviewCount || 0
  const photoReviewRate =
    totalReviewCount > 0 ? Math.round((imageReviewCount / totalReviewCount) * 100) : 0

  // ── 사진 ──
  // placeDetail.topPhotos.total 이 정확한 업체 사진 수. 없으면 추정값 사용.
  const topPhotos = getByKeyPrefix(detail, 'topPhotos')
  const topPhotosTotal =
    topPhotos && typeof topPhotos.total === 'number' ? topPhotos.total : 0
  const photoItems = Object.keys(apollo).filter((k) =>
    k.startsWith('PlaceDetailTopPhotoItem:')
  ).length
  const menuPhotos = menus.filter(
    (m) => (Array.isArray(m.images) && m.images.length > 0) || m.image
  ).length
  const imageCount = Math.max(topPhotosTotal, photoItems, menuPhotos)

  // ── 스타일 탭 (뷰티 업종: 미용실·네일) ──
  // 네이버는 미용실(hairStyles)·네일(nailStyles)에 "스타일 탭"을 제공.
  // Apollo 정규화 키(예: PlaceDetailHairStyleItem:, PlaceDetailNailStyleItem:)나
  // styleList/hairStyles 객체의 total 값을 탐색해 스타일 등록 수를 구한다.
  const styleItemKeys = Object.keys(apollo).filter((k) =>
    /Style(Item)?:/i.test(k) && /Hair|Nail|Style/i.test(k)
  ).length
  const styleListObj =
    getByKeyPrefix(detail, 'styleList') ||
    getByKeyPrefix(detail, 'hairStyles') ||
    getByKeyPrefix(detail, 'nailStyles') ||
    null
  let styleListTotal = 0
  if (styleListObj && typeof styleListObj === 'object') {
    if (typeof styleListObj.total === 'number') styleListTotal = styleListObj.total
    else if (Array.isArray(styleListObj)) styleListTotal = styleListObj.length
    else if (Array.isArray(styleListObj.items)) styleListTotal = styleListObj.items.length
  }
  const styleCount = Math.max(styleItemKeys, styleListTotal)

  // ── 결제/편의 ──
  const conveniences: string[] = Array.isArray(base.conveniences) ? base.conveniences : []
  const paymentInfo: string[] = Array.isArray(base.paymentInfo) ? base.paymentInfo : []
  // 네이버페이 연동 판정: 네이버 플레이스는 실제 네이버페이가 연동된 매장만
  // paymentInfo 결제수단 목록에 정확히 "네이버페이"를 노출한다.
  // (예) 연동 매장: ["제로페이","네이버페이",...] / 미연동 매장: ["간편결제","제로페이",...]
  // ⚠️ "간편결제"는 일반 결제수단 안내일 뿐 네이버페이가 아니므로 매칭하면 오판이 난다.
  //    따라서 "네이버페이"(공백 제거 후 비교)만 정확히 매칭한다.
  const hasNPay = paymentInfo.some((p) => /네이버\s*페이/.test(String(p)))

  // ── 영업시간 ──
  // placeDetail.newBusinessHours({...})[] 가 있으면 등록된 것으로 판단.
  // 키에 GraphQL 인자가 붙으므로(newBusinessHours({"format":"restaurant"})) prefix 매칭 필요.
  const nbhRaw = getByKeyPrefix(detail, 'newBusinessHours')
  const newBusinessHours = Array.isArray(nbhRaw) ? nbhRaw : []
  const hasBusinessHours =
    !base.hideBusinessHours &&
    (newBusinessHours.length > 0 ||
      (Array.isArray(base.openingHours)
        ? base.openingHours.length > 0
        : !!base.openingHours))

  // ── 체크인/체크아웃 명시 (숙박업) ──
  // newBusinessHours / 영업시간 텍스트 / 설명에서 체크인·체크아웃 키워드를 탐색.
  const nbhText = JSON.stringify(newBusinessHours || '')
  const descForCheck =
    (typeof getByKeyPrefix(detail, 'description') === 'string'
      ? getByKeyPrefix(detail, 'description')
      : '') ||
    base.description ||
    ''
  const checkInOutBlob = `${nbhText} ${descForCheck} ${JSON.stringify(base.openingHours || '')}`
  const hasCheckInOut = /체크\s*인|체크\s*아웃|check\s*in|check\s*out|입실|퇴실/i.test(checkInOutBlob)

  // ── 톡톡 ──
  const hasTalkTalkAuto = !!(base.talktalkUrl || base.chatBotUrl)
  // ── 스마트콜(안심번호) ──
  const hasSmartCallAuto = !!base.virtualPhone

  // ── 톡톡 응답률/응답시간 ──
  // 점주(스마트플레이스) 전용 지표라 공개 home HTML/APOLLO_STATE엔 대개 없다.
  // 가짜 값을 만들지 않도록, 실제로 응답률/응답시간 필드가 존재할 때만 채운다.
  let talkResponseRate: number | null = null
  let talkResponseTime: string | null = null
  // 1) base / detail / 톡톡(talk) 관련 객체에서 응답률·응답시간 키 직접 탐색
  const talkSources: any[] = [base, detail]
  for (const [k, v] of Object.entries(apollo)) {
    if (/talk|chat|message|inquiry/i.test(k) && v && typeof v === 'object') {
      talkSources.push(v)
    }
  }
  for (const src of talkSources) {
    if (!src || typeof src !== 'object') continue
    for (const [key, val] of Object.entries(src)) {
      if (talkResponseRate === null && /(response|answer|reply).*rate|responseRate|answerRate|replyRate/i.test(key)) {
        const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.]/g, ''))
        if (!isNaN(num) && num > 0) talkResponseRate = num <= 1 ? Math.round(num * 100) : Math.round(num)
      }
      if (talkResponseTime === null && /(response|reply).*time|responseTime|replyTime|avgResponse/i.test(key)) {
        if (typeof val === 'string' && val.trim()) talkResponseTime = val.trim()
        else if (typeof val === 'number' && val > 0) talkResponseTime = '평균 ' + val + '분 이내'
      }
    }
  }

  // ── 클립/동영상 수 ──
  // 우선순위 1) APOLLO_STATE에서 Clip/Moment/Video/ShortForm 정규화 키 개수
  let clipCount: number | null = null
  const clipKeyCount = Object.keys(apollo).filter((k) =>
    /^(Clip|Moment|Video|ShortForm|ShortClip)[A-Za-z]*:/i.test(k)
  ).length
  if (clipKeyCount > 0) {
    clipCount = clipKeyCount
  } else {
    // 2) placeDetail 안의 clips / clipList / shortForm 객체의 total 또는 items.length
    const clipObj =
      getByKeyPrefix(detail, 'clips') ||
      getByKeyPrefix(detail, 'clipList') ||
      getByKeyPrefix(detail, 'shortForm') ||
      getByKeyPrefix(detail, 'moments') ||
      null
    if (clipObj && typeof clipObj === 'object') {
      if (typeof clipObj.total === 'number') clipCount = clipObj.total
      else if (Array.isArray(clipObj)) clipCount = clipObj.length
      else if (Array.isArray(clipObj.items)) clipCount = clipObj.items.length
    }
    // 3) 위 둘 다 없으면 클립 탭 fetch 결과(clipCountArg) 사용 (성공 시 0/숫자, 실패 시 null)
    if (clipCount === null) clipCount = clipCountArg ?? null
  }

  // ── 설명/키워드/찾아오는 길 ──
  // 상세설명·대표키워드는 ROOT_QUERY.placeDetail 안에 GraphQL 인자 붙은 키로 들어있다.
  //   description({"source":["shopWindow","jto"]})  →  매장 상세설명
  //   informationTab({...}).keywordList             →  대표키워드
  //   PlaceDetailBase.road                          →  찾아오는 길
  const microReviews: string[] = Array.isArray(base.microReviews) ? base.microReviews : []
  const description: string =
    (typeof getByKeyPrefix(detail, 'description') === 'string'
      ? getByKeyPrefix(detail, 'description')
      : '') ||
    base.description ||
    ''
  const microIntro: string = microReviews.length ? microReviews.join(' / ') : ''

  const infoTab = getByKeyPrefix(detail, 'informationTab')
  let keywords: string[] = []
  if (infoTab && Array.isArray(infoTab.keywordList)) {
    keywords = infoTab.keywordList.filter((k: any) => typeof k === 'string' && k.trim())
  } else if (Array.isArray(base.keywords)) {
    keywords = base.keywords
  }

  // 찾아오는 길: PlaceDetailBase.road (없으면 placeDetail.road)
  const directionInfoAuto: string =
    (typeof base.road === 'string' ? base.road : '') ||
    (typeof detail.road === 'string' ? detail.road : '') ||
    ''

  // ── 예약/쿠폰 ──
  // 예약: placeDetail.naverBooking({...}).bookingBusinessId 가 있으면 네이버 예약 사용
  const naverBooking = getByKeyPrefix(detail, 'naverBooking')
  const hasBooking =
    !!(naverBooking && naverBooking.bookingBusinessId) ||
    !!base.hasNaverBooking ||
    !!(base.poiInfo && base.poiInfo.booking)
  // 쿠폰: placeDetail.hasCoupon.count > 0
  const hasCouponObj = getByKeyPrefix(detail, 'hasCoupon')
  const hasCoupon = !!(
    hasCouponObj &&
    typeof hasCouponObj.count === 'number' &&
    hasCouponObj.count > 0
  )

  // ── 소식(피드) ──
  // 1순위: 소식 탭 HTML에서 수집한 feedDetail (블로그 연동 소식 BLOG 포함, 실제 게시일 daysAgo 보유)
  //        → 참조 사이트처럼 "5일 전 게시"까지 정확히 표시 가능
  // 2순위(폴백): placeDetail.hasFeed.feedExist / blogExist 로 등록 여부만 판단
  const hasFeedObj = getByKeyPrefix(detail, 'hasFeed')
  const feedExist = !!(hasFeedObj && (hasFeedObj.feedExist || hasFeedObj.blogExist))
  const latestFeed = feedDetail
    ? { within30Days: feedDetail.within30Days, daysAgo: feedDetail.daysAgo }
    : feedExist
      ? { within30Days: true, daysAgo: null }
      : null

  // ── 저장 수 (home HTML·리뷰 API 모두 미노출 → null로 N/A 처리) ──
  const saveCount: number | null = null

  // ── 최근 리뷰 상세 (방문자 리뷰 GraphQL API에서 수집) ──
  // reviewDetail 이 있으면 hasReviewDetail=true → 참조 사이트와 동일한 리뷰 가중 채점.
  const hasReviewDetail = !!reviewDetail
  // 리뷰 상세 수집 실패 여부: reviewDetail 이 없는데 GraphQL 호출이 차단/실패로 표시된 경우
  const reviewDetailFailed = !reviewDetail && lastGraphqlBlocked
  const last7DaysReviews = reviewDetail?.last7DaysReviews ?? 0
  const last30DaysReviews = reviewDetail?.last30DaysReviews ?? 0
  const replyRate = reviewDetail?.replyRate ?? 0
  const reviewQualityAvg = reviewDetail?.reviewQualityAvg ?? 0
  const reviewsAnalyzed = reviewDetail?.analyzed ?? 0
  const reviewQualityDetails = reviewDetail
    ? {
        companionRate: reviewDetail.companionRate,
        purposeRate: reviewDetail.purposeRate,
        detailedRate: reviewDetail.detailedRate,
        recommendRate: reviewDetail.recommendRate,
      }
    : null
  const aiBriefing = reviewDetail
    ? {
        positiveRate: reviewDetail.aiPositiveRate,
        semiRate: reviewDetail.aiSemiRate,
        negativeRate: reviewDetail.aiNegativeRate,
      }
    : null
  // ── 참조 사이트(마피아넷) 스타일 지표 ──
  const textReviewRate = reviewDetail?.textReviewRate ?? null
  const mediaReviewRate = reviewDetail?.mediaReviewRate ?? null
  const reviewerDiversity =
    reviewDetail && reviewDetail.reviewerDiversity > 0 ? reviewDetail.reviewerDiversity : null

  return {
    id,
    name: base.name || '가게',
    category,
    roadAddress: base.roadAddress || base.address || '',
    address: base.address || '',
    phone: base.phone || null,
    imageUrl: null,
    industry,
    conveniences,
    paymentInfo,
    imageCount,
    styleCount,
    totalMenus,
    menuPriceRate,
    menuPhotoRate,
    totalReviewCount,
    starRating,
    textReviewCount,
    imageReviewCount,
    photoReviewRate,
    blogCafeReviewCount,
    blogLatestDaysAgo,
    description,
    placeIntro: description,
    microIntro,
    keywords,
    hasBooking,
    hasNPay,
    hasCoupon,
    hasBusinessHours,
    hasCheckInOut,
    hasTalkTalkAuto,
    hasSmartCallAuto,
    directionInfoAuto,
    saveCount,
    latestFeed,
    clipCount,
    talkResponseRate,
    talkResponseTime,
    last7DaysReviews,
    last30DaysReviews,
    replyRate,
    reviewQualityAvg,
    hasReviewDetail,
    reviewDetailFailed,
    reviewsAnalyzed,
    reviewQualityDetails,
    aiBriefing,
    textReviewRate,
    mediaReviewRate,
    reviewerDiversity,
  }
}
