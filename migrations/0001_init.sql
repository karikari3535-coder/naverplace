-- 진단 결과 저장 테이블
CREATE TABLE IF NOT EXISTS diagnoses (
  id          TEXT PRIMARY KEY,        -- nanoid 10자
  place_id    TEXT,                    -- 재진단 비교용 (apiData.id)
  name        TEXT,
  category    TEXT,
  industry    TEXT,                    -- industry.group
  score       REAL,                    -- displayScore
  grade       TEXT,
  result_json TEXT NOT NULL,           -- renderReport에 넣을 result 전체
  created_at  INTEGER NOT NULL         -- epoch ms
);

CREATE INDEX IF NOT EXISTS idx_diag_place   ON diagnoses(place_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diag_created ON diagnoses(created_at DESC);
