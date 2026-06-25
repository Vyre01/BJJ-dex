# 유튜브 영상 링크 — 설계

작성일: 2026-06-25

## 배경

기술 카드는 이미지/GIF 미리보기를 가질 수 있다(`image_path`, `gif_url`/`gif_poster`). 사용자는 기술마다 **유튜브 강의 영상**을 붙여 상세 화면에서 바로 보고 싶어 한다. 이 기능은 앞서 만든 GIF(URL) 기능과 같은 패턴을 따른다: 카드에 텍스트 필드 하나(`video_url`)를 추가하고, 폼에서 입력하며, 상세 화면에서 렌더한다.

## 결정 사항 (확정)

- **표시 방식**: 상세 화면에 유튜브 **임베드 플레이어**(iframe)로 화면 안에서 재생.
- **표시 위치**: 기술 **상세 화면에만**. 목록 카드에는 배지/표시를 **추가하지 않는다**(카드 모서리가 이미 GIF·즐겨찾기·익힘·수정으로 빽빽함).
- **입력 방식**: 추가/수정 폼에 "유튜브 링크" 텍스트 칸. `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/` 등 어떤 형식이든 붙여넣으면 영상 ID를 자동 추출.
- **개수**: 기술당 영상 **1개**.
- **잘못된 링크**: ID를 못 뽑으면 임베드 대신 원본 URL로 "유튜브에서 보기" 링크를 표시(앱이 깨지지 않음).
- **저장**: 추가·수정 양쪽 경로(mock + Supabase) 모두에 `video_url` 포함. 빈 값 → `null`.

## 범위

- 파일: 신규 2개(헬퍼+테스트, 마이그레이션), 수정 3개(타입, 시드, 폼, 상세) — 아래 참조.
- 추가 진입점/라우트 변경 없음(같은 폼이 `/cards/new`도 구동).

## 데이터 모델

- `Technique`에 `video_url?: string | null` 추가(`lib/types.ts`).
- Supabase: `supabase/migrations/0003_video_url.sql` — `ALTER TABLE techniques ADD COLUMN IF NOT EXISTS video_url text;` (기존 0002 마이그레이션과 동일한 idempotent 패턴).
- mock 시드(`lib/mock/seed.ts`): 데모용으로 카드 1~2개(예: 암바)에 실제 유튜브 링크를 넣는다.

## 헬퍼 — `lib/youtube.ts`

순수 함수 `youtubeEmbedUrl(url: string): string | null`:

- 다음 형식에서 11자 내외의 영상 ID(`[\w-]+`)를 추출한다:
  - `https://www.youtube.com/watch?v=<id>` (추가 파라미터 `&t=`, `&list=` 허용)
  - `https://youtu.be/<id>` (`?si=` 등 허용)
  - `https://www.youtube.com/shorts/<id>`
  - `https://www.youtube.com/embed/<id>`
  - `www.` 유무, `http`/`https` 무관, `m.youtube.com` 허용
- 성공 시 `https://www.youtube.com/embed/<id>` 반환, 실패 시 `null`.
- 빈 문자열/비유튜브 URL → `null`.

이 헬퍼는 GIF의 `derivePoster`와 같은 위치/역할(순수·단위테스트)이다. 단위 테스트: `tests/unit/youtube.test.ts`.

## 폼 — `components/TechniqueForm.tsx`

- 신규 상태 `const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? '')`.
- GIF 칸 아래에 "유튜브 링크" 텍스트 입력 + 안내 문구.
- 입력값이 있고 `youtubeEmbedUrl`이 임베드 URL을 반환하면, 칸 아래에 작은 16:9 `<iframe>` **미리보기**를 표시(URL이 바뀌면 `key`로 새로 로드). 임베드 불가하면 미리보기 없음.
- 제출 시: `const videoValue = videoUrl.trim() || null;` 를 mock 페이로드와 Supabase 페이로드 **양쪽**에 `video_url: videoValue`로 포함.

## 상세 화면 — `app/cards/[id]/page.tsx`

- `t.video_url`이 있으면 "▶ 영상" 섹션을 렌더(제목·난이도·플래그 아래, "기술 순서" 위).
- `youtubeEmbedUrl(t.video_url)`이 임베드 URL을 반환하면 16:9 컨테이너 안에 `<iframe>`(`allowFullScreen`, `loading="lazy"`)으로 플레이어 표시.
- 반환이 `null`이면 원본 URL로 "유튜브에서 보기" 링크(새 탭) 표시.

## 데이터 흐름

폼 입력 → 저장 시 `video_url`을 mock `upsert` 또는 Supabase `insert/update`에 포함 → 쿼리 무효화 → 상세로 이동 → 상세에서 `youtubeEmbedUrl`로 변환해 iframe 렌더.

## 엣지 케이스 / 비범위

- 잘못된/비유튜브 링크: 임베드 대신 링크 폴백, 크래시 없음.
- **비범위(YAGNI)**: 영상 여러 개, 자동 썸네일/메타데이터, 목록 카드 배지, 재생목록, 시작 시간(`t=`) 보존(임베드는 ID만 사용).

## 테스트

- `youtubeEmbedUrl` 단위 테스트: watch / youtu.be / shorts / embed / 추가 파라미터 / 비유튜브(→null) / 빈 문자열(→null).
- 린트 + 타입체크 + 새 빌드 통과.
- mock 모드 수동 검증: 추가·수정에서 링크 입력→미리보기, 저장 후 상세에서 재생, 잘못된 링크 폴백.
