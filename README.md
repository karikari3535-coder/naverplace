# 플레이스 닥터 (Place Doctor) — 네이버 플레이스 진단 리포트

EunCoach 플레이스 진단 사이트를 Cloudflare Pages + Hono로 클론·개선한 웹앱입니다.
네이버 플레이스 URL만 넣으면 매장 데이터를 자동 수집해 **25개 항목**을 채점하고,
등급(S/A/B/C/D)·사장님 페르소나·맞춤 처방까지 담은 리포트를 만들어 줍니다.

## 프로젝트 개요
- **이름**: 플레이스 닥터 (Place Doctor)
- **목표**: 네이버 플레이스 운영 상태를 자동 진단해, 무엇을 먼저 개선해야 하는지 한눈에 보여주기
- **핵심 특징**:
  - 네이버 플레이스 URL(또는 `naver.me` 단축링크) 입력만으로 자동 데이터 수집
  - AI 분석 로딩 애니메이션 → 정보 확인 → 진단 리포트의 3단계 플로우
  - 4개 카테고리(리뷰·시스템·기본정보·콘텐츠) 25개 항목 가중치 채점
  - 100점 환산 점수 + S/A/B/C/D 등급 + 5가지 사장님 페르소나
  - 약점 우선순위 기반 Top-3 액션 플랜 제시
  - 따뜻한 베이지/오렌지 톤의 단일 페이지 디자인

## URL
- **로컬(개발) 서비스**: http://localhost:3000
- **샌드박스 공개 URL**: https://3000-i03eveccw07udgx8tl7pb-18e660f9.sandbox.novita.ai
- **프로덕션(Cloudflare Pages)**: 아직 배포 전 (배포 시 갱신)

## 기능 진입 경로 (URI / 파라미터)
| 메서드 | 경로 | 파라미터 | 설명 |
|--------|------|----------|------|
| `GET` | `/` | 없음 | 메인 단일 페이지 (Stage1~3 모두 포함) |
| `GET` | `/api/place` | `url` (필수, 네이버 플레이스 URL 또는 naver.me 단축링크) | 매장 데이터를 추출해 JSON 반환 |

`/api/place` 응답 예시(요약):
```json
{
  "id": "11726718",
  "name": "오산횟집",
  "category": "생선회",
  "industry": { "tier": 1, "group": "food", "displayName": "식당·카페·주점" },
  "totalReviewCount": 482,
  "starRating": 3.98,
  "imageCount": 16,
  "totalMenus": 24,
  "hasNPay": true,
  "microIntro": "30년 단골이 인증한 변함없는 맛"
}
```

## 데이터 아키텍처
- **데이터 출처**: 네이버 모바일 플레이스 페이지(`m.place.naver.com/{type}/{id}/home`)에 임베드된
  `window.__APOLLO_STATE__` JSON을 서버에서 fetch하여 파싱 (브레이스 밸런싱 기반 문자열-aware 파서).
- **저장소**: 별도 영구 저장소 없음 (Stateless). 진단은 요청 시점에 실시간 계산.
- **데이터 흐름**:
  1. 사용자가 URL 입력 → `GET /api/place?url=...`
  2. 서버: 단축링크 해제 → placeId 추출 → 여러 type 경로 시도 → APOLLO_STATE 추출 → 필드 조립(`PlaceData`)
  3. 클라이언트: 응답을 Stage2에서 사용자 확인/보정(상세설명·대표키워드·찾아오는길·스마트콜·톡톡·소식)
  4. 클라이언트 엔진 `analyzePlaceData(api, user)`가 25항목 채점 → 점수/등급/페르소나/액션 산출
  5. `renderReport(result)`가 Stage3 리포트 HTML 렌더링

### 진단 항목 (25개, 4카테고리, 참조 사이트와 동일 가중 배점)
- **리뷰(review, ~45점)**: 최근 7일(10/13)·최근 30일(7)·총 방문자 리뷰(5)·리뷰 품질(5)·AI 브리핑(5)·블로그 리뷰(5/7)·별점(5)·답글 비율(5)·저장 수(7)·포토 리뷰(5)
- **시스템(system, ~12점)**: 네이버 예약(6)·네이버 페이(3)·쿠폰(2)·**톡톡 응답률(3, 신규)**
- **기본정보(basic, ~10점)**: 업체 사진(4)·편의시설(2)·영업시간(3)·메뉴 가격(2)·메뉴 사진/스타일탭(2)
- **콘텐츠(content, ~22점)**: 대표키워드(5)·상세설명(5)·찾아오는길(3)·스마트콜(3)·톡톡(3)·소식(3)·**클립/동영상(3, 신규)**

#### 신규 추가 항목 (v2)
| 항목 | 카테고리 | 배점 | 데이터 소스 | N/A 케이스 |
|------|----------|------|-------------|------------|
| 클립/동영상 | content | 3 | APOLLO_STATE의 `Clip/Moment/Video/ShortForm` 키 → `placeDetail.clips/clipList` → 클립 탭(`/place/{id}/clip`) HTML 1회 fetch | 모든 경로에서 데이터를 못 가져오면 `clipCount=null` → N/A (탭은 조회됐으나 0개면 0점) |
| 톡톡 응답률 | system | 3 | APOLLO_STATE/base/detail의 `responseRate/answerRate/replyTime` 류 키 탐색 | 응답률은 **점주(스마트플레이스) 전용 지표**라 공개 페이지엔 대개 없음 → 톡톡 연결 시 N/A, 미연결 시 0점 |

> 🔎 **리뷰 상세 수집**: 네이버 방문자 리뷰 GraphQL API(`api.place.naver.com/graphql`)로 최신 리뷰를
> 가져와 **최근 7/30일 리뷰 수, 답글 비율, 사진 리뷰 비율, 리뷰 품질 근사치**를 계산합니다
> (`hasReviewDetail=true`). 수집 실패·매장이 비공개로 설정한 항목(별점 비공개, 저장 수 미제공 등)은
> **N/A 처리** 후 분모(effectiveMax)에서 제외해 점수를 보정합니다.
> 의료기관은 의료광고법에 따라 소식·블로그 리뷰·쿠폰을 진단에서 제외합니다.
> 상세설명·대표키워드·소통 채널은 Stage2에서 자동 수집값 기준으로 확인·보정합니다.

## 사용 방법
1. 메인 페이지에서 네이버 플레이스 URL 또는 `naver.me` 단축링크를 붙여넣고 **진단 시작**.
2. AI 분석 로딩이 끝나면 자동 수집된 정보(상세설명/키워드/찾아오는길/스마트콜·톡톡·소식)를 확인·보정.
3. **결과 보기**를 누르면 점수 게이지·등급·페르소나·카테고리 요약·Top-3 액션·항목 상세 리포트가 표시됩니다.
4. 리포트 상단의 **리포트 PDF 다운로드**(html2pdf.js) / **내 점수 공유하기**(Web Share API·클립보드 폴백) 버튼으로 결과를 저장·공유할 수 있습니다.

## 기술 스택
- **백엔드/엣지런타임**: Cloudflare Pages (Workers) + Hono 4
- **빌드**: Vite 6 (`@hono/vite-build/cloudflare-pages`)
- **프론트**: 순수 JS(문자열 주입) + Pretendard 폰트, 인라인 CSS 테마
- **프로세스 관리(개발)**: PM2 + `wrangler pages dev`

## 프로젝트 구조
```
webapp/
├── src/
│   ├── index.tsx     # Hono 엔트리 (/ 페이지, /api/place)
│   ├── page.ts       # renderHome() — 전체 HTML 셸 (Stage1~3)
│   ├── styles.ts     # PAGE_CSS — 베이지/오렌지 테마
│   ├── client.ts     # CLIENT_JS — 스테이지 제어/로딩/폼 처리
│   ├── engine.ts     # DIAGNOSE_ENGINE — analyzePlaceData(25항목 채점)
│   ├── report.ts     # RENDER_REPORT — renderReport(리포트 렌더)
│   └── lib/naver.ts  # fetchPlaceData() — 네이버 APOLLO_STATE 파서
├── ecosystem.config.cjs  # PM2 (wrangler pages dev, port 3000)
├── wrangler.jsonc
├── vite.config.ts
└── package.json
```

## 로컬 실행
```bash
npm install
npm run build
pm2 start ecosystem.config.cjs   # http://localhost:3000
curl http://localhost:3000        # 동작 확인
```

## 아직 구현되지 않은 / 한계 항목
- **별점·저장 수**: 매장이 비공개로 설정했거나 네이버 API 미제공 시 N/A 처리.
- **AI 브리핑 적합도·리뷰 4요소 정밀 분석**: 네이버 내부 라벨링 지표라 근사치(리뷰 본문 분석)로 대체하거나 N/A 처리.
- `imageCount`는 노출 사진/메뉴 사진 기반 추정치(정확한 전체 사진 수 아님).
- 영업시간(`openingHours`)이 home HTML에 없을 때가 많아 종종 N/A.
- 사용자 계정/이력 관리 없음 (Stateless).

## 권장 다음 단계
1. Cloudflare Pages 프로덕션 배포 (`wrangler pages deploy dist`).
2. 진단 결과 공유용 영구 링크 (KV/D1에 결과 스냅샷 저장).
3. 업종별(미용·의료·숙박 등) 항목 가중치 미세 조정 및 카피 보강.
4. 리뷰 본문 4요소(메뉴명·가격·상황·평가) 정밀 분석으로 리뷰 품질 정확도 향상.
5. 정확도 향상을 위한 추가 데이터 소스(로그인 세션 또는 공식 API) 검토.

## 배포 상태
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 로컬/샌드박스 동작 / ❌ 프로덕션 미배포
- **기술 스택**: Hono + Vite + Cloudflare Pages
- **최종 업데이트**: 2026-06-13 (리뷰 가중 배점 참조 사이트 일치 + PDF 다운로드·점수 공유 버튼 추가)
