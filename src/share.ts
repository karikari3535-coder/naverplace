import { PAGE_CSS } from './styles'
import { CLIENT_JS } from './client'

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * 저장된 result로 /r/{id} 페이지를 서버에서 직접 렌더.
 * - OG 메타: 제목에 "매장명 · NN점 · X등급"
 * - window.__SHARED_RESULT 로 result를 주입 → 클라이언트가 즉시 renderReport
 */
export function renderSharePage(id: string, origin: string, result: any): string {
  const name = result?.name || '우리 가게'
  const score = result?.displayScore ?? '-'
  const grade = result?.grade || '-'
  const pageUrl = `${origin}/r/${id}`
  const ogImage = `${origin}/static/og-card.png`

  const title = `${name} · 플레이스 진단 ${score}점 (${grade}등급)`
  const desc = `네이버 플레이스 26개 항목 진단 결과예요. 내 가게도 무료로 진단해보세요 · 셀러랩스`

  // result를 안전하게 스크립트에 주입 (</script> 토큰 방지)
  const injected = JSON.stringify(result).replace(/</g, '\\u003c')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="icon" href="/static/sellerlabs-bird.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="셀러랩스">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="셀러랩스 플레이스 진단 결과">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
  <style>${PAGE_CSS}</style>
</head>
<body>
  <!-- 공유 페이지는 리포트만 보여준다 -->
  <section class="stage active" id="stage3">
    <div class="report-container" id="reportContainer"></div>
  </section>

  <script>window.__SHARED_RESULT = ${injected};</script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script>${CLIENT_JS}</script>
</body>
</html>`
}

/** id가 없거나 잘못됐을 때 안내 폴백 페이지 */
export function renderShareFallback(origin: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>진단 결과를 찾을 수 없어요 | 셀러랩스</title>
  <link rel="icon" href="/static/sellerlabs-bird.svg" type="image/svg+xml">
  <style>${PAGE_CSS}</style>
</head>
<body>
  <main class="stage active" style="text-align:center;">
    <div class="brand-row"><img class="brand-logo" src="/static/sellerlabs-bird.svg" alt="셀러랩스" width="64" height="73"></div>
    <h1>결과를 찾을 수 없어요</h1>
    <p class="subtitle">링크가 만료되었거나 잘못된 주소예요.<br>내 가게를 새로 진단해보세요.</p>
    <div class="form-submit" style="margin-top:24px;">
      <a class="btn-primary" href="${esc(origin)}/" style="display:inline-block;text-decoration:none;">무료 진단하러 가기</a>
    </div>
  </main>
</body>
</html>`
}
