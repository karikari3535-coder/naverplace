import { PAGE_CSS } from './styles'
import { CLIENT_JS } from './client'

export function renderHome(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>플레이스 무료 진단 | 셀러랩스</title>
  <meta name="description" content="네이버 플레이스 URL만 넣으면 26개 항목을 무료로 진단해드려요. 셀러랩스가 내 가게에 딱 맞는 처방을 알려드립니다.">
  <link rel="icon" href="/static/sellerlabs-bird.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="셀러랩스">
  <meta property="og:url" content="https://bd619c54-8d18-4734-869c-45fd3a4c08a7.vip.gensparksite.com/">
  <meta property="og:title" content="플레이스 무료 진단 | 셀러랩스">
  <meta property="og:description" content="네이버 플레이스 URL만 넣으면 26개 항목을 무료로 진단해드려요. 셀러랩스가 내 가게에 딱 맞는 처방을 알려드립니다.">
  <meta property="og:image" content="https://bd619c54-8d18-4734-869c-45fd3a4c08a7.vip.gensparksite.com/static/og-card.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="셀러랩스 플레이스 무료 진단">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="플레이스 무료 진단 | 셀러랩스">
  <meta name="twitter:description" content="네이버 플레이스 URL만 넣으면 26개 항목을 무료로 진단해드려요.">
  <meta name="twitter:image" content="https://bd619c54-8d18-4734-869c-45fd3a4c08a7.vip.gensparksite.com/static/og-card.png">
  <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
  <style>${PAGE_CSS}</style>
</head>
<body>
  <!-- ============ Stage 1: URL 입력 ============ -->
  <main class="stage active" id="stage1">
    <div class="brand-row">
      <img class="brand-logo" src="/static/sellerlabs-bird.svg" alt="셀러랩스" width="64" height="73">
    </div>
    <h1>내 플레이스, 몇 점일까요?</h1>
    <p class="subtitle">네이버 플레이스 URL을 넣으면<br>26개 항목을 무료로 진단해드려요</p>
    <div class="input-group">
      <input type="text" id="urlInput" placeholder="플레이스 URL 또는 공유 링크를 붙여넣으세요">
      <button class="btn-primary" id="diagnoseBtn" onclick="startDiagnosis()">진단하기</button>
    </div>
    <p class="error-msg" id="errorMsg"></p>
    <p class="hero-hint">플레이스 앱에서 공유 버튼 누른 링크(naver.me/...)도 가능해요</p>
    <div class="hero-note">
      <strong>26개 진단 항목</strong>을 기반으로<br>
      내 가게에 딱 맞는 처방을 드려요
    </div>
  </main>

  <!-- ============ 로딩 ============ -->
  <section class="stage" id="loadingScreen">
    <div class="hero-logo" aria-hidden="true"><img src="/static/sellerlabs-bird.svg" alt="" width="44" height="50"></div>
    <div class="ai-loading-card">
      <div class="ai-loading-head">
        <div class="ai-loading-orb"></div>
        <div>
          <div class="ai-loading-title" id="aiLoadingTitle">AI가 매장을 분석하고 있어요</div>
          <div class="ai-loading-sub" id="aiLoadingSub">네이버 플레이스 26개 항목 · 실시간 진단</div>
        </div>
      </div>
      <div class="ai-step-list" id="aiStepList"></div>
      <div class="ai-quote" id="aiQuote"></div>
    </div>
  </section>

  <!-- ============ Stage 2: 정보 확인 ============ -->
  <section class="stage" id="stage2">
    <div class="confirm-badge">
      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
      <span id="confirmName"></span>
    </div>
    <h2>이 정보 맞나요?</h2>
    <p class="subtitle">플레이스에서 자동으로 확인했어요. 틀리면 수정할 수 있어요</p>

    <div class="form-container">
      <div class="auto-field" data-field="direction">
        <div class="auto-field-header">
          <span class="auto-field-label">찾아오는 길</span>
          <span class="auto-field-badge" id="directionBadge"></span>
        </div>
        <div class="auto-field-preview" id="directionPreview"></div>
        <button type="button" class="auto-field-edit-btn" onclick="toggleAutoEdit('direction')">수정하기</button>
        <div class="auto-field-editor" id="directionEditor" style="display:none;">
          <textarea id="inputDirection"></textarea>
        </div>
      </div>

      <div class="auto-field" data-field="description">
        <div class="auto-field-header">
          <span class="auto-field-label">상세설명</span>
          <span class="auto-field-badge" id="descriptionBadge"></span>
        </div>
        <div class="auto-field-preview" id="descriptionPreview"></div>
        <button type="button" class="auto-field-edit-btn" onclick="toggleAutoEdit('description')">수정하기</button>
        <div class="auto-field-editor" id="descriptionEditor" style="display:none;">
          <textarea id="inputDescription"></textarea>
        </div>
      </div>

      <div class="auto-field" data-field="keywords">
        <div class="auto-field-header">
          <span class="auto-field-label">대표키워드</span>
          <span class="auto-field-badge" id="keywordsBadge"></span>
        </div>
        <div class="auto-field-preview" id="keywordsPreview"></div>
        <button type="button" class="auto-field-edit-btn" onclick="toggleAutoEdit('keywords')">수정하기</button>
        <div class="auto-field-editor" id="keywordsEditor" style="display:none;">
          <textarea id="inputKeywords" placeholder="쉼표(,)로 구분해서 입력하세요. 예: 양양 섭국, 동호해변 맛집, 회"></textarea>
        </div>
      </div>

      <div class="auto-toggle" data-field="smartcall">
        <div class="auto-toggle-row">
          <span class="auto-toggle-label">스마트콜(안심번호)</span>
          <span class="auto-toggle-badge" id="smartcallBadge"></span>
        </div>
        <div class="auto-toggle-edit" id="smartcallEditor" style="display:none;">
          <div class="toggle-pills">
            <button class="toggle-pill" data-field="smartcall" data-value="yes" onclick="togglePill(this)">예</button>
            <button class="toggle-pill active" data-field="smartcall" data-value="no" onclick="togglePill(this)">아니오</button>
          </div>
        </div>
      </div>

      <div class="auto-toggle" data-field="talktalk">
        <div class="auto-toggle-row">
          <span class="auto-toggle-label">네이버 톡톡</span>
          <span class="auto-toggle-badge" id="talktalkBadge"></span>
        </div>
        <div class="auto-toggle-edit" id="talktalkEditor" style="display:none;">
          <div class="toggle-pills">
            <button class="toggle-pill" data-field="talktalk" data-value="yes" onclick="togglePill(this)">예</button>
            <button class="toggle-pill active" data-field="talktalk" data-value="no" onclick="togglePill(this)">아니오</button>
          </div>
        </div>
      </div>

      <div class="auto-toggle" data-field="news">
        <div class="auto-toggle-row">
          <span class="auto-toggle-label">최근 1개월 내 소식</span>
          <span class="auto-toggle-badge" id="newsBadge"></span>
        </div>
        <div class="auto-toggle-edit" id="newsEditor" style="display:none;">
          <div class="toggle-pills">
            <button class="toggle-pill" data-field="news" data-value="yes" onclick="togglePill(this)">예</button>
            <button class="toggle-pill active" data-field="news" data-value="no" onclick="togglePill(this)">아니오</button>
          </div>
        </div>
      </div>

      <div class="auto-edit-link-wrap">
        <button type="button" class="auto-edit-link" onclick="toggleToggleEditors()">혹시 내용이 잘못되었다면 직접 수정해주세요</button>
      </div>

      <div class="form-submit">
        <button class="btn-primary" onclick="showResult()">맞아요, 진단 시작</button>
      </div>
    </div>
  </section>

  <!-- ============ Stage 3: 리포트 ============ -->
  <section class="stage" id="stage3">
    <div class="report-container" id="reportContainer"></div>
  </section>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>${CLIENT_JS}</script>
</body>
</html>`
}
