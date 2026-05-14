-- techniques 테이블
CREATE TABLE techniques (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  position     text NOT NULL,
  category     text NOT NULL,
  difficulty   int2 NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  details      text,
  image_path   text,
  is_favorite  boolean NOT NULL DEFAULT false,
  is_learned   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX techniques_position_idx   ON techniques (position);
CREATE INDEX techniques_category_idx   ON techniques (category);
CREATE INDEX techniques_difficulty_idx ON techniques (difficulty);
CREATE INDEX techniques_favorite_idx   ON techniques (is_favorite) WHERE is_favorite;
CREATE INDEX techniques_learned_idx    ON techniques (is_learned)  WHERE is_learned;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER techniques_set_updated_at
  BEFORE UPDATE ON techniques
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read"
  ON techniques FOR SELECT
  USING (true);

CREATE POLICY "authenticated can write"
  ON techniques FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
