-- 기술 순서(steps) + GIF 미리보기 컬럼 추가
-- (디자인 단계에서는 mock 데이터로만 쓰이지만, 실제 Supabase 적용 시 이 마이그레이션을 실행한다.)

ALTER TABLE techniques
  ADD COLUMN IF NOT EXISTS steps      text[],   -- 단계별 순서 (배열, 한 원소 = 한 단계)
  ADD COLUMN IF NOT EXISTS gif_url    text,     -- 재생용 애니메이션 (mp4/gif) URL
  ADD COLUMN IF NOT EXISTS gif_poster text;     -- 정지 프레임(poster) URL
