import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { fetchPlaceData } from './lib/naver'
import { renderHome } from './page'
import { renderSharePage, renderShareFallback } from './share'
import { renderAdminDashboard, type AdminStats } from './admin'
import { makeId } from './lib/id'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

/**
 * GET /api/place?url=...
 * 네이버 플레이스 URL(또는 naver.me 단축링크)을 받아
 * 진단에 필요한 매장 데이터를 추출해 JSON으로 반환한다.
 */
app.get('/api/place', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.json({ error: 'URL을 입력해주세요' }, 400)
  }
  try {
    const data = await fetchPlaceData(url)
    return c.json(data)
  } catch (err: any) {
    const msg = err?.message || '진단에 실패했습니다'
    return c.json({ error: msg }, 400)
  }
})

/**
 * POST /api/save
 * body: { placeId?: string, result: <analyzePlaceData 결과 전체> }
 * → diagnoses에 저장하고 { id } 반환
 */
app.post('/api/save', async (c) => {
  try {
    const body = await c.req.json<{ placeId?: string; result: any }>()
    const result = body?.result
    if (!result || typeof result !== 'object') {
      return c.json({ error: 'result가 필요합니다' }, 400)
    }
    const id = makeId(10)
    const now = Date.now()
    await c.env.DB.prepare(
      `INSERT INTO diagnoses
         (id, place_id, name, category, industry, score, grade, result_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.placeId ?? null,
      result.name ?? null,
      result.category ?? null,
      result.industry?.group ?? null,
      result.displayScore ?? null,
      result.grade ?? null,
      JSON.stringify(result),
      now
    ).run()
    return c.json({ id })
  } catch (err: any) {
    return c.json({ error: err?.message || '저장에 실패했습니다' }, 500)
  }
})

/**
 * GET /api/prev?placeId=...&before=<created_at ms>
 * 같은 place_id의 "그 시점보다 이전" 가장 최근 레코드 1건 반환.
 * before를 안 주면 가장 최근(현재 저장 직전) 레코드를 본다.
 * → 재진단 비교용. 없으면 { prev: null }
 */
app.get('/api/prev', async (c) => {
  const placeId = c.req.query('placeId')
  if (!placeId) return c.json({ prev: null })
  const before = Number(c.req.query('before') || Date.now())

  const row = await c.env.DB.prepare(
    `SELECT score, result_json, created_at
       FROM diagnoses
      WHERE place_id = ? AND created_at < ?
      ORDER BY created_at DESC
      LIMIT 1`
  ).bind(placeId, before).first<{ score: number; result_json: string; created_at: number }>()

  if (!row) return c.json({ prev: null })

  let completeness = null
  try { completeness = JSON.parse(row.result_json)?.profileCompleteness ?? null } catch {}

  return c.json({
    prev: {
      score: row.score,
      completeness,
      createdAt: row.created_at,
    },
  })
})

/**
 * GET /api/r/:id
 * → 저장된 result JSON 반환 (없으면 404)
 */
app.get('/api/r/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    `SELECT result_json, created_at FROM diagnoses WHERE id = ?`
  ).bind(id).first<{ result_json: string; created_at: number }>()

  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json({
    result: JSON.parse(row.result_json),
    createdAt: row.created_at,
  })
})

/**
 * GET /r/:id
 * 저장된 결과를 서버에서 OG 메타와 함께 직접 렌더 → 카톡/크롤러 노출.
 */
app.get('/r/:id', async (c) => {
  const id = c.req.param('id')
  const origin = new URL(c.req.url).origin
  const row = await c.env.DB.prepare(
    `SELECT result_json FROM diagnoses WHERE id = ?`
  ).bind(id).first<{ result_json: string }>()

  if (!row) return c.html(renderShareFallback(origin), 404)

  try {
    const result = JSON.parse(row.result_json)
    return c.html(renderSharePage(id, origin, result))
  } catch {
    return c.html(renderShareFallback(origin), 500)
  }
})

/** 진단 통계 집계 (D1) — /admin/stats(JSON)와 /admin(HTML)이 공유 */
async function getStats(db: D1Database): Promise<AdminStats> {
  const since7d = Date.now() - 7 * 86400000

  const total = await db.prepare(
    `SELECT COUNT(*) AS n FROM diagnoses`
  ).first<{ n: number }>()

  const last7 = await db.prepare(
    `SELECT COUNT(*) AS n FROM diagnoses WHERE created_at >= ?`
  ).bind(since7d).first<{ n: number }>()

  // 날짜별 추이(최근 7일) — epoch ms를 일 단위로 그룹
  const daily = await db.prepare(
    `SELECT date(created_at / 1000, 'unixepoch', 'localtime') AS d,
            COUNT(*) AS n
       FROM diagnoses
      WHERE created_at >= ?
      GROUP BY d ORDER BY d ASC`
  ).bind(since7d).all<{ d: string; n: number }>()

  // 업종 Top N
  const byIndustry = await db.prepare(
    `SELECT COALESCE(industry, '미분류') AS industry, COUNT(*) AS n
       FROM diagnoses
      GROUP BY industry ORDER BY n DESC LIMIT 10`
  ).all<{ industry: string; n: number }>()

  const avgScore = await db.prepare(
    `SELECT ROUND(AVG(score), 1) AS avg FROM diagnoses WHERE score IS NOT NULL`
  ).first<{ avg: number }>()

  return {
    total: total?.n ?? 0,
    last7days: last7?.n ?? 0,
    avgScore: avgScore?.avg ?? null,
    daily: daily.results ?? [],
    topIndustries: byIndustry.results ?? [],
  }
}

/**
 * GET /admin/stats?token=...
 * 총 진단 수 / 최근 7일 추이 / 업종 Top N (JSON). 토큰 불일치 시 401.
 */
app.get('/admin/stats', async (c) => {
  const token = c.req.query('token')
  const expected = c.env.ADMIN_TOKEN
  if (!expected || token !== expected) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  return c.json(await getStats(c.env.DB))
})

/**
 * GET /admin?token=...
 * 같은 통계를 사람이 보기 좋은 HTML 대시보드로 렌더. 토큰 불일치 시 401.
 */
app.get('/admin', async (c) => {
  const token = c.req.query('token')
  const expected = c.env.ADMIN_TOKEN
  if (!expected || token !== expected) {
    return c.html('<!DOCTYPE html><meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;padding:60px;color:#888">접근 권한이 없습니다 (401)<br><small>?token= 파라미터를 확인하세요</small></body>', 401)
  }
  const stats = await getStats(c.env.DB)
  return c.html(renderAdminDashboard(stats, token!))
})

// 메인 페이지 (단일 HTML)
app.get('/', (c) => {
  return c.html(renderHome())
})

export default app
