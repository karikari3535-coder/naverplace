// 관리자 통계 HTML 대시보드 (T6 보강)
// /admin?token=... 으로 접속하면 /admin/stats(JSON)와 같은 데이터를 사람이 보기 좋게 렌더.

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// 업종 코드값 → 한글명 (client.ts peerMap과 동일)
const INDUSTRY_KO: Record<string, string> = {
  accommodation: '숙박·펜션·게스트하우스',
  food: '음식점·카페',
  beauty: '미용·뷰티',
  medical: '병원·의원',
  education: '학원·교육',
  fitness: '운동·피트니스',
  professional: '전문 서비스',
  studio: '사진·스튜디오',
  leisure: '여가·오락',
  realestate: '부동산',
  service: '서비스업',
  미분류: '미분류',
}

export interface AdminStats {
  total: number
  last7days: number
  avgScore: number | null
  daily: { d: string; n: number }[]
  topIndustries: { industry: string; n: number }[]
}

export function renderAdminDashboard(stats: AdminStats, token: string): string {
  const { total, last7days, avgScore, daily, topIndustries } = stats

  // 최근 7일 날짜 축을 빈 날까지 채워서 차트가 끊기지 않게 함
  const dayMap: Record<string, number> = {}
  for (const r of daily) dayMap[r.d] = r.n
  const labels: string[] = []
  const counts: number[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 86400000)
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    labels.push(`${dt.getMonth() + 1}/${dt.getDate()}`)
    counts.push(dayMap[key] || 0)
  }

  const maxN = Math.max(1, ...topIndustries.map((r) => r.n))
  const industryRows = topIndustries.length
    ? topIndustries
        .map((r, i) => {
          const name = INDUSTRY_KO[r.industry] || r.industry
          const pct = Math.round((r.n / maxN) * 100)
          return `<tr>
            <td class="rank">${i + 1}</td>
            <td class="iname">${esc(name)} <span class="icode">${esc(r.industry)}</span></td>
            <td class="ibar"><span class="ibar-fill" style="width:${pct}%"></span></td>
            <td class="inum">${r.n}</td>
          </tr>`
        })
        .join('')
    : `<tr><td colspan="4" class="empty">아직 진단 데이터가 없어요</td></tr>`

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>관리자 통계 | 셀러랩스</title>
  <meta name="robots" content="noindex,nofollow">
  <link rel="icon" href="/static/sellerlabs-bird.svg" type="image/svg+xml">
  <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif;
      background:#F5F1EA;color:#2A2438;padding:24px 16px;line-height:1.5;}
    .wrap{max-width:840px;margin:0 auto;}
    .head{display:flex;align-items:center;gap:12px;margin-bottom:6px;}
    .head img{width:36px;height:auto;}
    .head h1{font-size:22px;font-weight:800;}
    .sub{color:#A39A8E;font-size:13px;margin-bottom:24px;}
    .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
    .card{background:#fff;border:1px solid #E7E0D6;border-radius:16px;padding:18px 16px;text-align:center;}
    .card .label{font-size:13px;color:#A39A8E;margin-bottom:8px;}
    .card .value{font-size:32px;font-weight:800;color:#5B3FBF;line-height:1.1;}
    .card .value small{font-size:15px;font-weight:700;color:#A39A8E;}
    .panel{background:#fff;border:1px solid #E7E0D6;border-radius:16px;padding:20px;margin-bottom:20px;}
    .panel h2{font-size:16px;font-weight:800;margin-bottom:14px;}
    .chart-box{position:relative;height:240px;}
    table{width:100%;border-collapse:collapse;}
    th,td{padding:10px 8px;text-align:left;font-size:14px;border-bottom:1px solid #F0EBE2;}
    th{font-size:12px;color:#A39A8E;font-weight:700;}
    td.rank{width:36px;font-weight:800;color:#5B3FBF;}
    td.iname{font-weight:700;}
    td.iname .icode{font-size:11px;color:#C3BBAE;font-weight:500;margin-left:4px;}
    td.ibar{width:40%;}
    .ibar-fill{display:block;height:10px;border-radius:6px;background:linear-gradient(90deg,#7C5CFF,#5B3FBF);}
    td.inum{width:48px;text-align:right;font-weight:800;}
    td.empty{text-align:center;color:#A39A8E;padding:24px;}
    .foot{text-align:center;color:#C3BBAE;font-size:12px;margin-top:16px;}
    .foot a{color:#8A7FB0;}
    @media(max-width:560px){.cards{grid-template-columns:1fr;}.card .value{font-size:28px;}}
  </style>
</head>
<body>
  <main class="wrap">
    <header class="head">
      <img src="/static/sellerlabs-bird.svg" alt="셀러랩스">
      <h1>플레이스 진단 통계</h1>
    </header>
    <p class="sub">관리자 전용 대시보드 · 실시간 D1 집계</p>

    <section class="cards">
      <div class="card"><div class="label">총 진단 수</div><div class="value">${total.toLocaleString()}<small> 건</small></div></div>
      <div class="card"><div class="label">최근 7일</div><div class="value">${last7days.toLocaleString()}<small> 건</small></div></div>
      <div class="card"><div class="label">평균 점수</div><div class="value">${avgScore != null ? avgScore : '-'}<small>${avgScore != null ? ' 점' : ''}</small></div></div>
    </section>

    <section class="panel">
      <h2>최근 7일 진단 추이</h2>
      <div class="chart-box"><canvas id="dailyChart"></canvas></div>
    </section>

    <section class="panel">
      <h2>업종 Top 10</h2>
      <table>
        <thead><tr><th>#</th><th>업종</th><th>비중</th><th>건수</th></tr></thead>
        <tbody>${industryRows}</tbody>
      </table>
    </section>

    <p class="foot">데이터(JSON): <a href="/admin/stats?token=${esc(token)}">/admin/stats</a></p>
  </main>

  <script>
    const labels = ${JSON.stringify(labels)};
    const counts = ${JSON.stringify(counts)};
    new Chart(document.getElementById('dailyChart'), {
      type: 'bar',
      data: { labels, datasets: [{ label: '진단 수', data: counts,
        backgroundColor: '#7C5CFF', borderRadius: 6, maxBarThickness: 48 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#F0EBE2' } },
                  x: { grid: { display: false } } }
      }
    });
  </script>
</body>
</html>`
}
