import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { fetchPlaceData } from './lib/naver'
import { renderHome } from './page'
import { renderSharePage, renderShareFallback } from './share'
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

// 메인 페이지 (단일 HTML)
app.get('/', (c) => {
  return c.html(renderHome())
})

export default app
