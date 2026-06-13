import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { fetchPlaceData } from './lib/naver'
import { renderHome } from './page'

const app = new Hono()

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

// 메인 페이지 (단일 HTML)
app.get('/', (c) => {
  return c.html(renderHome())
})

export default app
