export const PAGE_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', system-ui, sans-serif;
  background: #FAF8FF;
  color: #1A1714;
  min-height: 100vh;
  min-height: 100dvh;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }

.stage { display: none; }
.stage.active { display: flex; }

/* Stage 1 */
#stage1 { flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; min-height: 100dvh; padding: 24px 20px; }
.brand-row { display: flex; align-items: center; justify-content: center; margin-bottom: 28px; }
.brand-logo { height: 80px; width: auto; }
.hero-logo {
  width: 110px; height: 110px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 52px; margin-bottom: 28px;
  background: linear-gradient(135deg, #FFFFFF, #F2ECFF);
  box-shadow: 0 0 40px rgba(97, 0, 255, 0.25);
}
.hero-logo img { width: 48px; height: 55px; }
#stage1 h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; text-align: center; letter-spacing: -0.5px; }
#stage1 .subtitle, #stage2 .subtitle { color: #6B635A; margin-bottom: 36px; text-align: center; line-height: 1.7; font-size: 16px; }
.input-group { display: flex; gap: 12px; width: 100%; max-width: 600px; }
.input-group input {
  flex: 1; padding: 16px 20px; border: 2px solid #DCD6CB; border-radius: 14px;
  background: #FFFFFF; color: #1A1714; font-size: 16px; outline: none; transition: border-color 0.2s;
}
.input-group input:focus { border-color: #5000D0; }
.input-group input::placeholder { color: #A39A8E; }
.btn-primary {
  padding: 16px 32px; min-height: 52px; background: linear-gradient(135deg, #6100FF, #FFBE00); color: white;
  border: none; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer;
  white-space: nowrap; transition: all 0.2s; box-shadow: 0 4px 14px rgba(97, 0, 255, 0.3);
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(97, 0, 255, 0.4); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { background: #E5E0D8; cursor: not-allowed; box-shadow: none; }
.error-msg { color: #DC2626; margin-top: 12px; font-size: 14px; display: none; }
.hero-hint { color:#A39A8E; font-size:12px; margin-top:8px; }
.hero-note { margin-top: 40px; color: #A39A8E; font-size: 13px; text-align: center; max-width: 400px; line-height: 1.6; }
.hero-note strong { color: #6B635A; }

/* Loading */
#loadingScreen { flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; min-height: 100dvh; padding: 20px 16px 40px; }
.ai-loading-card { width: 100%; max-width: 480px; background: #fff; border: 1px solid #ECE8E1; border-radius: 20px; padding: 28px 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
.ai-loading-head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.ai-loading-orb { position: relative; width: 44px; height: 44px; border-radius: 50%; background: conic-gradient(from 0deg, #6100FF, #FFBE00, #FFBE00, #6100FF); animation: orbSpin 2.4s linear infinite; flex-shrink: 0; }
.ai-loading-orb::after { content: ''; position: absolute; inset: 4px; border-radius: 50%; background: #fff; }
.ai-loading-orb::before { content: ''; position: absolute; inset: 11px; border-radius: 50%; background: radial-gradient(circle, #6100FF 0%, transparent 70%); animation: orbPulse 1.8s ease-in-out infinite; z-index: 1; }
@keyframes orbSpin { to { transform: rotate(360deg); } }
@keyframes orbPulse { 0%,100% { opacity: 0.6; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.15); } }
.ai-loading-title { color: #1A1714; font-size: 17px; font-weight: 700; line-height: 1.35; }
.ai-loading-sub { color: #6B635A; font-size: 12px; margin-top: 2px; }
.ai-step-list { display: flex; flex-direction: column; gap: 10px; }
.ai-step { display: flex; align-items: flex-start; gap: 12px; padding: 10px 12px; border-radius: 10px; transition: background 0.3s, opacity 0.3s; opacity: 0.35; }
.ai-step.active { background: rgba(97, 0, 255, 0.08); opacity: 1; }
.ai-step.done { opacity: 0.7; }
.ai-step-icon { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #DCD6CB; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #A39A8E; margin-top: 1px; transition: all 0.3s; }
.ai-step.active .ai-step-icon { border-color: #5000D0; border-top-color: transparent; animation: spin 0.8s linear infinite; }
.ai-step.done .ai-step-icon { border-color: #0E9F6E; background: #0E9F6E; color: #fff; animation: none; }
.ai-step.done .ai-step-icon::before { content: '✓'; font-weight: 700; }
@keyframes spin { to { transform: rotate(360deg); } }
.ai-step-body { flex: 1; min-width: 0; }
.ai-step-label { color: #1A1714; font-size: 14px; font-weight: 500; line-height: 1.4; }
.ai-step-detail { color: #A39A8E; font-size: 12px; margin-top: 2px; min-height: 14px; font-variant-numeric: tabular-nums; }
.ai-step.active .ai-step-detail { color: #FFBE00; }
.ai-step.done .ai-step-detail { color: #0E9F6E; }
.ai-quote { margin-top: 18px; padding-top: 16px; border-top: 1px dashed #E2DCD2; color: #6B635A; font-size: 12px; font-style: italic; text-align: center; line-height: 1.6; min-height: 40px; opacity: 0.9; transition: opacity 0.2s; }

/* Stage 2 */
#stage2 { flex-direction: column; align-items: center; padding: 40px 20px 60px; min-height: 100vh; min-height: 100dvh; }
.confirm-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.12); color: #0E9F6E; padding: 10px 20px; border-radius: 100px; font-size: 15px; font-weight: 600; margin-bottom: 16px; border: 1px solid rgba(16,185,129,0.2); }
.confirm-badge svg { width: 20px; height: 20px; }
#stage2 h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; text-align: center; }
.form-container { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 16px; }
.auto-field { background: #FBFAF7; border: 1px solid #ECE8E1; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.auto-field-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.auto-field-label { font-size: 14px; font-weight: 600; color: #1A1714; }
.auto-field-badge { font-size: 12px; padding: 3px 10px; border-radius: 999px; font-weight: 500; white-space: nowrap; }
.auto-field-badge.confirmed { background: #ecfdf5; color: #047857; }
.auto-field-badge.empty { background: #F1EEE8; color: #A39A8E; }
.auto-field-preview { font-size: 13px; color: #6B635A; line-height: 1.6; max-height: 64px; overflow: hidden; white-space: pre-wrap; word-break: break-word; }
.auto-field-preview.empty { color: #A39A8E; font-style: italic; }
.auto-field-preview.expanded { max-height: none; }
.auto-field-edit-btn { align-self: flex-start; background: transparent; border: none; color: #5000D0; font-size: 13px; font-weight: 500; padding: 8px 0; min-height: 32px; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.auto-field-edit-btn:hover { text-decoration: underline; }
.auto-field-editor textarea { width: 100%; min-height: 120px; padding: 12px 14px; border: 1px solid #DCD6CB; border-radius: 10px; font-size: 14px; color: #1A1714; background: #fff; font-family: inherit; resize: vertical; line-height: 1.6; }
.auto-field-editor textarea:focus { border-color: #5000D0; outline: none; }
.auto-toggle { background: #FBFAF7; border: 1px solid #ECE8E1; border-radius: 12px; padding: 12px 16px; }
.auto-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.auto-toggle-label { font-size: 14px; font-weight: 600; color: #1A1714; }
.auto-toggle-badge { font-size: 12px; padding: 3px 10px; border-radius: 999px; font-weight: 500; white-space: nowrap; }
.auto-toggle-badge.on { background: #ecfdf5; color: #047857; }
.auto-toggle-badge.off { background: #F1EEE8; color: #A39A8E; }
.auto-toggle-edit { margin-top: 10px; }
.toggle-pills { display: flex; background: #EDE8E0; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.toggle-pill { padding: 8px 20px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; background: transparent; color: #A39A8E; }
.toggle-pill.active { background: #6100FF; color: white; }
.auto-edit-link-wrap { text-align: center; }
.auto-edit-link { background: transparent; border: none; color: #A39A8E; font-size: 12px; text-decoration: underline; cursor: pointer; padding: 4px; }
.auto-edit-link:hover { color: #1A1714; }
.form-submit { margin-top: 8px; }
.form-submit .btn-primary { width: 100%; padding: 18px; font-size: 17px; }

/* Stage 3 */
#stage3 { flex-direction: column; align-items: center; padding: 0 0 60px; }
.report-container { width: 100%; max-width: 720px; padding: 0 20px; }
.report-header { text-align: center; padding: 48px 0 24px; border-bottom: 1px solid #ECE8E1; }
.report-header .shop-name { font-size: 24px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.5px; }
.report-header .shop-meta { color: #6B635A; font-size: 14px; margin-bottom: 4px; }
.report-header .report-date { color: #A39A8E; font-size: 13px; }

.score-section { text-align: center; padding: 40px 0 24px; }
.score-gauge-container { position: relative; width: 240px; height: 240px; margin: 0 auto 16px; }
.score-gauge-container svg { width: 240px; height: 240px; }
.gauge-track { fill: none; stroke: #EDE8E0; stroke-width: 14; }
.gauge-fill { fill: none; stroke-width: 14; stroke-linecap: round; transition: stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1); }
.score-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
.score-label { font-size: 11px; font-weight: 600; color: #A39A8E; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
.score-number { font-size: 64px; font-weight: 900; line-height: 1; letter-spacing: -3px; }
.score-max { font-size: 15px; color: #A39A8E; margin-top: 4px; font-weight: 500; }
.grade-badge { display: inline-block; font-size: 16px; font-weight: 800; padding: 10px 32px; border-radius: 100px; margin-top: 12px; letter-spacing: 2px; color: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.12); }

.persona-card { background: linear-gradient(135deg, rgba(97, 0, 255,0.08), rgba(97, 0, 255,0.02)); border: 1px solid rgba(97, 0, 255,0.25); border-radius: 16px; padding: 24px 20px; margin: 24px auto 20px; max-width: 460px; text-align: center; }
.persona-icon { font-size: 32px; margin-bottom: 8px; }
.persona-label { font-size: 11px; color: #6B635A; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
.persona-name { font-size: 18px; font-weight: 800; color: #5000D0; margin-bottom: 10px; }
.persona-desc { font-size: 13px; color: #6B635A; line-height: 1.6; }

.score-stats { display: flex; justify-content: center; gap: 32px; margin-top: 4px; padding: 16px 0; border-top: 1px solid #ECE8E1; border-bottom: 1px solid #ECE8E1; }
.score-stat { text-align: center; }
.score-stat-value { font-size: 22px; font-weight: 800; color: #1A1714; }
.score-stat-label { font-size: 11px; color: #A39A8E; margin-top: 2px; font-weight: 500; }

.main-bubble-wrap { display: flex; align-items: flex-start; gap: 12px; margin: 24px 0 0; }
.bubble-logo { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; display:flex; align-items:center; justify-content:center; background: linear-gradient(135deg, #FFFFFF, #F2ECFF); border: 1px solid #EDE5FF; }
.bubble-logo img { width: 24px; height: 27px; }
.bubble-logo-sm { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display:flex; align-items:center; justify-content:center; background: linear-gradient(135deg, #FFFFFF, #F2ECFF); border: 1px solid #EDE5FF; }
.bubble-logo-sm img { width: 16px; height: 18px; }
.speech-bubble { position: relative; background: #FFFFFF; border: 1px solid #DCD6CB; border-radius: 4px 16px 16px 16px; padding: 16px 20px; font-size: 15px; line-height: 1.8; color: #1A1714; flex: 1; }

.section-divider { border: none; border-top: 1px solid #ECE8E1; margin: 40px 0; }
.section-title { font-size: 20px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
.section-subtitle { color: #6B635A; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }

.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.summary-card { background: #FFFFFF; border: 1px solid #DCD6CB; border-radius: 16px; padding: 20px; position: relative; overflow: hidden; }
.summary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.summary-card[data-cat="review"]::before { background: #6C5FD4; }
.summary-card[data-cat="system"]::before { background: #2C8AA6; }
.summary-card[data-cat="basic"]::before { background: #FFBE00; }
.summary-card[data-cat="content"]::before { background: #2E9E78; }
.summary-card .sc-name { font-size: 13px; font-weight: 600; color: #6B635A; margin-bottom: 8px; }
.summary-card .sc-score { font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 2px; }
.summary-card[data-cat="review"] .sc-score { color: #6C5FD4; }
.summary-card[data-cat="system"] .sc-score { color: #2C8AA6; }
.summary-card[data-cat="basic"] .sc-score { color: #FFBE00; }
.summary-card[data-cat="content"] .sc-score { color: #2E9E78; }
.summary-card .sc-max { font-size: 12px; color: #A39A8E; margin-bottom: 12px; }
.summary-bar { height: 6px; background: #EDE8E0; border-radius: 3px; overflow: hidden; }
.summary-bar-fill { height: 100%; border-radius: 3px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); width: 0; }
.summary-card[data-cat="review"] .summary-bar-fill { background: #6C5FD4; }
.summary-card[data-cat="system"] .summary-bar-fill { background: #2C8AA6; }
.summary-card[data-cat="basic"] .summary-bar-fill { background: #FFBE00; }
.summary-card[data-cat="content"] .summary-bar-fill { background: #2E9E78; }

.cat-section { margin-top: 40px; }
.cat-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid; }
.cat-header[data-cat="review"] { border-color: #6C5FD4; }
.cat-header[data-cat="system"] { border-color: #2C8AA6; }
.cat-header[data-cat="basic"] { border-color: #FFBE00; }
.cat-header[data-cat="content"] { border-color: #2E9E78; }
.cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.cat-header[data-cat="review"] .cat-dot { background: #6C5FD4; }
.cat-header[data-cat="system"] .cat-dot { background: #2C8AA6; }
.cat-header[data-cat="basic"] .cat-dot { background: #FFBE00; }
.cat-header[data-cat="content"] .cat-dot { background: #2E9E78; }
.cat-label { font-size: 17px; font-weight: 700; }
.cat-score-label { margin-left: auto; font-size: 14px; color: #6B635A; font-weight: 500; }

.item-card { background: #FFFFFF; border: 1px solid #DCD6CB; border-radius: 14px; padding: 20px; margin-bottom: 12px; transition: border-color 0.2s; }
.item-card:hover { border-color: #A39A8E; }
.item-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.item-name { font-size: 15px; font-weight: 700; color: #1A1714; }
.item-badge { font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 100px; white-space: nowrap; }
.badge-good { background: rgba(16,185,129,0.15); color: #0E9F6E; }
.badge-warn { background: rgba(251,191,36,0.15); color: #FFBE00; }
.badge-bad { background: rgba(239,68,68,0.15); color: #DC2626; }
.badge-na { background: rgba(148,163,184,0.15); color: #6B635A; }
.item-detail { font-size: 13px; color: #6B635A; margin-bottom: 12px; }
.item-comment-wrap { display: flex; align-items: flex-start; gap: 8px; }
.item-comment { background: #EDE8E0; border: 1px solid #DCD6CB; border-radius: 4px 12px 12px 12px; padding: 10px 14px; font-size: 13px; line-height: 1.7; color: #6B635A; flex: 1; }

.coach-tip { margin-top: 10px; }
.coach-tip-toggle { width: 100%; text-align: left; background: rgba(97, 0, 255,0.06); border: 1px solid rgba(97, 0, 255,0.22); border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 700; color: #5000D0; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: background 0.15s; }
.coach-tip-toggle:hover { background: rgba(97, 0, 255,0.1); }
.coach-tip-caret { display: inline-block; font-size: 9px; transition: transform 0.2s; color: #6100FF; }
.coach-tip.open .coach-tip-caret { transform: rotate(90deg); }
.coach-tip-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.coach-tip.open .coach-tip-body { max-height: 600px; }
.coach-tip-row { display: flex; align-items: flex-start; gap: 8px; padding: 12px 4px 2px; }
.coach-tip-text { background: linear-gradient(135deg, rgba(97, 0, 255,0.08), rgba(255, 190, 0,0.04)); border: 1px solid rgba(97, 0, 255,0.18); border-radius: 4px 12px 12px 12px; padding: 12px 14px; font-size: 13px; line-height: 1.8; color: #5A4A42; flex: 1; }

.action-section { margin-top: 40px; }
.action-card { background: linear-gradient(135deg, rgba(97, 0, 255,0.08), rgba(97, 0, 255,0.02)); border: 1px solid rgba(97, 0, 255,0.2); border-radius: 16px; padding: 20px; margin-bottom: 12px; display: flex; gap: 14px; align-items: flex-start; }
.action-number { width: 32px; height: 32px; background: linear-gradient(135deg, #6100FF, #FFBE00); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; }
.action-body { flex: 1; }
.medical-notice { background: rgba(56,189,248,0.10); border: 1px solid rgba(56,189,248,0.35); border-radius: 14px; padding: 14px 18px; margin: 16px 0; font-size: 13px; color: #1E6E8C; line-height: 1.7; }
.na-notice { background: rgba(148,163,184,0.08); border: 1px solid rgba(148,163,184,0.15); border-radius: 12px; padding: 14px 18px; margin: 16px 0 4px; font-size: 13px; color: #6B635A; line-height: 1.7; text-align: center; }
.action-body .action-item-name { font-size: 15px; font-weight: 700; color: #5000D0; margin-bottom: 2px; }
.action-body .action-item-score { font-size: 13px; font-weight: 600; color: #FFBE00; }
.action-body .action-current { font-size: 13px; color: #6B635A; margin-bottom: 6px; }
.action-body .action-todo { font-size: 14px; color: #1A1714; line-height: 1.7; }
.action-body .action-why { margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(97, 0, 255,0.25); font-size: 13px; color: #6B635A; line-height: 1.7; }
.action-body .action-why-label { display: inline-block; font-size: 11px; font-weight: 800; color: #5000D0; background: rgba(97, 0, 255,0.12); border-radius: 6px; padding: 1px 7px; margin-right: 4px; }

.report-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin: 22px 0 4px; }
.report-action-btn { display: inline-flex; align-items: center; gap: 7px; padding: 11px 20px; background: #fff; color: #5000D0; border: 1.5px solid rgba(97, 0, 255,0.45); border-radius: 999px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.18s; box-shadow: 0 2px 8px rgba(97, 0, 255,0.08); }
.report-action-btn:hover { background: rgba(97, 0, 255,0.06); border-color: #6100FF; transform: translateY(-1px); }
.report-action-btn .ra-icon { font-size: 15px; }
.report-toast { position: fixed; left: 50%; bottom: 36px; transform: translateX(-50%) translateY(20px); background: #1A1714; color: #fff; padding: 12px 22px; border-radius: 12px; font-size: 14px; font-weight: 600; box-shadow: 0 8px 28px rgba(0,0,0,0.28); opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; z-index: 9999; }
.report-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.restart-wrap { text-align: center; margin-top: 32px; }
.btn-secondary { padding: 14px 28px; min-height: 48px; background: transparent; color: #6B635A; border: 2px solid #DCD6CB; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.btn-secondary:hover { border-color: #A39A8E; color: #1A1714; }
.report-footer { text-align: center; padding: 32px 0 16px; color: #A39A8E; font-size: 12px; line-height: 1.6; }
.footer-brand { margin-top: 18px; padding-top: 18px; border-top: 1px solid #ECE8E1; color: #A39A8E; font-size: 11px; }
.footer-brand img { opacity: 0.75; margin-bottom: 8px; }
.footer-brand a { color: #6100FF; text-decoration: none; font-weight: 700; }
.footer-brand a:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .input-group { flex-direction: column; }
  #stage1 h1 { font-size: 24px; }
  .score-gauge-container, .score-gauge-container svg { width: 200px; height: 200px; }
  .score-number { font-size: 48px; }
  .score-stats { gap: 20px; }
  .score-stat-value { font-size: 18px; }
  .summary-grid { gap: 8px; }
  .summary-card { padding: 16px; }
  .summary-card .sc-score { font-size: 24px; }
}

/* 초소형 화면 (아이폰 SE/미니 등 360px 이하) */
@media (max-width: 380px) {
  #stage1 { padding: 20px 14px; }
  #stage1 h1 { font-size: 21px; }
  #stage1 .subtitle, #stage2 .subtitle { font-size: 14px; }
  #stage2 { padding: 28px 12px 48px; }
  .report-container { padding: 0 12px; }
  .score-gauge-container, .score-gauge-container svg { width: 170px; height: 170px; }
  .score-number { font-size: 40px; }
  .score-stats { gap: 12px; }
  .score-stat-value { font-size: 16px; }
  .score-stat-label { font-size: 11px; }
  .summary-grid { grid-template-columns: 1fr; }
  .persona-card { padding: 18px 14px; }
  .btn-primary { padding: 14px 20px; font-size: 15px; }
  .btn-secondary { padding: 12px 18px; font-size: 14px; }
  .item-badge { font-size: 12px; padding: 4px 9px; }
}
`
