-- 0005_reports.sql: 실시간 위험 및 장애물 신고 테이블
CREATE TABLE IF NOT EXISTS reports (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES auth.users(id),
    location    geometry(Point, 4326) NOT NULL,
    type        TEXT        NOT NULL CHECK (type IN ('stairs', 'construction', 'steep_slope', 'elevator_broken')),
    severity    INTEGER     NOT NULL DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
    description TEXT,
    image_url   TEXT,  -- Supabase Storage Public URL
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- RLS 설정
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_select' AND tablename = 'reports') THEN
        CREATE POLICY reports_select ON reports FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_insert' AND tablename = 'reports') THEN
        CREATE POLICY reports_insert ON reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Supabase Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE reports;

-- 스토리지 버킷 설정 (DML은 SQL 에디터에서 권장되나 명시용)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports-images', 'reports-images', true)
ON CONFLICT (id) DO NOTHING;
