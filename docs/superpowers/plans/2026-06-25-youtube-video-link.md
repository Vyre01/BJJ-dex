# 유튜브 영상 링크 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기술마다 유튜브 링크 하나를 저장하고, 상세 화면에서 임베드 플레이어로 바로 재생한다.

**Architecture:** GIF(URL) 기능과 같은 패턴. (1) 순수 헬퍼 `lib/youtube.ts`가 유튜브 URL에서 영상 ID를 뽑아 임베드 URL을 만들고, (2) `Technique`에 `video_url` 필드를 추가(타입+마이그레이션+시드), (3) `TechniqueForm`에 "유튜브 링크" 입력·미리보기를 더해 mock·Supabase 양쪽 저장 경로에 싣고, (4) 상세 페이지에서 임베드 iframe(또는 폴백 링크)을 렌더한다. 새 라우트 없음.

**Tech Stack:** Next.js 16 (App Router, 클라이언트 컴포넌트), React 19, TypeScript, TanStack Query, Tailwind v4, Supabase, Vitest(unit).

## Global Constraints

- **표시 위치**: 상세 화면에만 임베드(iframe). **목록 카드에는 표시/배지 추가 금지**.
- **입력**: URL 붙여넣기만. `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/`, `m.youtube.com` 형식 지원. 영상 **1개**.
- **잘못된/비유튜브 링크**: 임베드 대신 원본 URL로 "유튜브에서 보기" 링크 폴백. 크래시 없음.
- **저장**: `video_url`을 mock 페이로드와 Supabase 페이로드 **양쪽 모두**에 포함. 빈 값(trim 후) → `null`.
- **헬퍼**: `youtubeEmbedUrl(url: string): string | null`, `lib/youtube.ts`, 순수 함수. 성공 시 `https://www.youtube.com/embed/<id>` 반환.
- **UI 카피는 한국어**. 기존 코드 스타일(한국어 주석, Tailwind 유틸 구성, 상세 페이지 섹션 헤더 패턴) 유지.
- **AGENTS.md**: 새 Next API 도입 금지 — 기존 패턴(클라이언트 컴포넌트, 일반 `<iframe>`)만 사용.
- **비범위(YAGNI)**: 영상 여러 개, 자동 썸네일/메타데이터, 목록 카드 배지, 재생목록, 시작시간(`t=`) 보존.

---

## File Structure

- **Create** `lib/youtube.ts` — 순수 헬퍼 `youtubeEmbedUrl(url)`. 단일 책임: 유튜브 URL → 임베드 URL.
- **Create** `tests/unit/youtube.test.ts` — 헬퍼 단위 테스트.
- **Create** `supabase/migrations/0003_video_url.sql` — `video_url` 컬럼 추가(idempotent).
- **Modify** `lib/types.ts` — `Technique`에 `video_url?: string | null` 추가.
- **Modify** `lib/mock/seed.ts` — 데모용으로 카드 1개에 `video_url` 추가.
- **Modify** `tests/unit/mock-seed.test.ts` — 시드에 video_url 카드가 존재함을 잠금.
- **Modify** `components/TechniqueForm.tsx` — "유튜브 링크" 입력·미리보기 + 양쪽 페이로드.
- **Modify** `app/cards/[id]/page.tsx` — 임베드 iframe(또는 폴백 링크) 렌더.

---

## Task 1: `youtubeEmbedUrl` 헬퍼 (TDD)

**Files:**
- Create: `lib/youtube.ts`
- Test: `tests/unit/youtube.test.ts`

**Interfaces:**
- Consumes: 없음.
- Produces: `export function youtubeEmbedUrl(url: string): string | null` — 유튜브 URL이면 `https://www.youtube.com/embed/<id>`, 아니면 `null`. Task 3(폼 미리보기)·Task 4(상세 임베드)가 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/youtube.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { youtubeEmbedUrl } from '@/lib/youtube';

const EMBED = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

describe('youtubeEmbedUrl', () => {
  it('watch?v= 형식', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EMBED);
  });

  it('watch 뒤 추가 파라미터(t, list)도 처리', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=abc')).toBe(EMBED);
  });

  it('youtu.be 단축 + si 파라미터', () => {
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ?si=xyz123')).toBe(EMBED);
  });

  it('shorts 형식', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(EMBED);
  });

  it('이미 embed 형식', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(EMBED);
  });

  it('m.youtube.com 모바일 형식', () => {
    expect(youtubeEmbedUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EMBED);
  });

  it('비유튜브 URL이면 null', () => {
    expect(youtubeEmbedUrl('https://vimeo.com/123456')).toBeNull();
  });

  it('유튜브지만 영상 ID가 없으면 null', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/feed/subscriptions')).toBeNull();
  });

  it('빈 문자열이면 null', () => {
    expect(youtubeEmbedUrl('')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- youtube`
Expected: FAIL — `Failed to resolve import "@/lib/youtube"`.

- [ ] **Step 3: 최소 구현 작성**

`lib/youtube.ts`:

```ts
/**
 * 유튜브 영상 URL(watch/youtu.be/shorts/embed)에서 11자 영상 ID를 뽑아
 * 임베드 재생용 URL(https://www.youtube.com/embed/<id>)을 만든다.
 * 유튜브 링크가 아니거나 ID를 못 찾으면 null(상세 화면은 이 경우 링크로 폴백).
 */
export function youtubeEmbedUrl(url: string): string | null {
  if (!/youtube\.com|youtu\.be/.test(url)) return null;
  const patterns = [
    /[?&]v=([\w-]{11})/, // watch?v=ID
    /youtu\.be\/([\w-]{11})/, // youtu.be/ID
    /\/shorts\/([\w-]{11})/, // shorts/ID
    /\/embed\/([\w-]{11})/, // embed/ID
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- youtube`
Expected: PASS (9개 통과).

- [ ] **Step 5: 커밋**

```bash
git add lib/youtube.ts tests/unit/youtube.test.ts
git commit -m "feat: add youtubeEmbedUrl helper"
```

---

## Task 2: 데이터 모델 (타입 + 마이그레이션 + 시드)

**Files:**
- Modify: `lib/types.ts`
- Create: `supabase/migrations/0003_video_url.sql`
- Modify: `lib/mock/seed.ts`
- Modify: `tests/unit/mock-seed.test.ts`

**Interfaces:**
- Consumes: 없음.
- Produces: `Technique.video_url?: string | null` 필드 — Task 3·4가 읽고 쓴다.

- [ ] **Step 1: 타입에 필드 추가**

`lib/types.ts`에서 `gif_poster?: string | null;` 줄(주석 포함) **다음**에 추가:

```ts
  /** 정지 프레임(poster) URL ... (기존 gif_poster 줄 다음) */
  gif_poster?: string | null;
  /** 유튜브 강의 영상 URL(watch/youtu.be/shorts 등). 상세 화면에서 임베드 재생. */
  video_url?: string | null;
```

(기존 `gif_poster?: string | null;` 줄은 그대로 두고, 그 아래에 `video_url` 두 줄만 삽입.)

- [ ] **Step 2: 마이그레이션 작성**

`supabase/migrations/0003_video_url.sql`:

```sql
-- 기술 유튜브 영상 링크 컬럼 추가
-- (mock 모드에서는 시드로만 쓰이지만, 실제 Supabase 적용 시 이 마이그레이션을 실행한다.)

ALTER TABLE techniques
  ADD COLUMN IF NOT EXISTS video_url text;   -- 유튜브 영상 URL (상세 화면 임베드)
```

- [ ] **Step 3: 시드에 데모 영상 추가**

`lib/mock/seed.ts`의 `mock-armbar`(암바) 카드 객체에서 `image_path: '/mock/card-1.svg',` 줄 **다음**에 추가:

```ts
    image_path: '/mock/card-1.svg',
    // 데모용 샘플 링크 — 실제 강의 영상으로 교체 가능
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ...giphy('1WYS9mpxOUVbxGmdFt'),
```

(기존 `...giphy('1WYS9mpxOUVbxGmdFt'),` 줄 앞에 삽입.)

- [ ] **Step 4: 시드 테스트에 잠금 추가**

`tests/unit/mock-seed.test.ts`에서 `'position/category 값이 모두 유효(constants 내)'` it 블록 **다음**에 추가:

```ts
  it('영상 링크가 있는 카드가 최소 1개', () => {
    expect(SEED_TECHNIQUES.some((t) => !!t.video_url)).toBe(true);
  });
```

- [ ] **Step 5: 테스트 + 타입체크**

Run: `npm test -- mock-seed`
Expected: PASS (기존 + 새 it 통과).

Run: `npx tsc --noEmit`
Expected: 소스 에러 없음(`.next/dev/types/*` 의 사전 존재 에러는 무시 — `npm run build`로 최종 확인).

- [ ] **Step 6: 커밋**

```bash
git add lib/types.ts supabase/migrations/0003_video_url.sql lib/mock/seed.ts tests/unit/mock-seed.test.ts
git commit -m "feat: add video_url field (type, migration, seed)"
```

---

## Task 3: `TechniqueForm`에 유튜브 링크 입력

**Files:**
- Modify: `components/TechniqueForm.tsx`

**Interfaces:**
- Consumes: `youtubeEmbedUrl` (Task 1) from `@/lib/youtube`; `Technique.video_url` (Task 2).
- Produces: 저장 시 `Technique.video_url`을 채우는 폼. 외부 인터페이스 없음.

node 환경 vitest로 컴포넌트 단위 테스트 불가 → lint + 타입체크 + mock 수동 검증으로 확인.

- [ ] **Step 1: import 추가**

`components/TechniqueForm.tsx` 상단 import 묶음에서 `import { derivePoster } from '@/lib/gif';` 줄 **다음**에 추가:

```ts
import { youtubeEmbedUrl } from '@/lib/youtube';
```

- [ ] **Step 2: `videoUrl` 상태 추가**

`const [gifUrl, setGifUrl] = useState(initial?.gif_url ?? '');` 줄 **다음**에 추가:

```ts
const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? '');
```

- [ ] **Step 3: 제출 핸들러에서 video 값 계산**

`onSubmit` 안의 gif 포스터 계산 블록(`const gifPosterValue = ...;` 으로 끝나는 부분) **다음**, `const imagePath = ...` 줄 앞에 추가:

```ts
    // 유튜브 링크 → null(빈 값) 정규화. 임베드 변환은 상세 화면에서 수행.
    const videoValue = videoUrl.trim() || null;
```

- [ ] **Step 4: mock 페이로드에 필드 포함**

mock 분기의 `const payload: Technique = { ... }`에서 `gif_poster: gifPosterValue,` 줄 **다음**에 추가:

```ts
          gif_poster: gifPosterValue,
          video_url: videoValue,
```

- [ ] **Step 5: Supabase 페이로드에 필드 포함**

Supabase 분기의 `const payload = { ... }`에서 `gif_poster: gifPosterValue,` 줄 **다음**에 추가:

```ts
        gif_poster: gifPosterValue,
        video_url: videoValue,
```

- [ ] **Step 6: 유튜브 링크 입력 + 미리보기 UI 추가**

GIF `<label>` 블록(닫는 `</label>`이 미리보기 `<video>` 다음에 오는 블록)의 **닫는 `</label>` 다음**, 제출 버튼 `<div className="flex gap-2 pt-1">` **앞**에 삽입:

```tsx
      <label className="block">
        <span className={labelCls}>유튜브 링크</span>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="예: https://www.youtube.com/watch?v=xxxx 또는 https://youtu.be/xxxx"
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-foreground-subtle">
          상세 화면에서 재생되는 강의 영상 링크. 비우면 영상 없음.
        </span>
        {videoUrl.trim() && youtubeEmbedUrl(videoUrl.trim()) && (
          <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
            <iframe
              key={youtubeEmbedUrl(videoUrl.trim())!}
              src={youtubeEmbedUrl(videoUrl.trim())!}
              title="유튜브 미리보기"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
      </label>
```

- [ ] **Step 7: 린트 + 타입체크**

Run: `npm run lint`
Expected: 에러 없음.

Run: `npx tsc --noEmit`
Expected: 소스 에러 없음(`.next/dev/types/*` 사전 에러 무시).

- [ ] **Step 8: mock 모드 수동 검증** (헤드리스 불가 시 컨트롤러가 수행)

Run: `npm run dev`
1. `/cards/new`에서 "유튜브 링크"에 `https://youtu.be/dQw4w9WgXcQ` 입력 → 16:9 미리보기 플레이어가 뜬다.
2. 이름 입력 후 저장 → 상세 화면에서 영상이 재생된다.
3. 잘못된 링크(`https://example.com`) 입력 → 미리보기 안 뜸, 저장돼도 크래시 없음.

- [ ] **Step 9: 커밋**

```bash
git add components/TechniqueForm.tsx
git commit -m "feat: edit YouTube link in technique form"
```

---

## Task 4: 상세 화면에 임베드 렌더

**Files:**
- Modify: `app/cards/[id]/page.tsx`

**Interfaces:**
- Consumes: `youtubeEmbedUrl` (Task 1); `Technique.video_url` (Task 2).
- Produces: 외부 인터페이스 없음(상세 화면 표시).

- [ ] **Step 1: import 추가**

`app/cards/[id]/page.tsx` 상단에서 `import { isMockMode } from '@/lib/mock/flag';` 줄 **다음**에 추가:

```ts
import { youtubeEmbedUrl } from '@/lib/youtube';
```

- [ ] **Step 2: 임베드 URL 계산**

`const { user } = useAuth();` 줄 **다음**에 추가:

```ts
  const videoEmbed = t?.video_url ? youtubeEmbedUrl(t.video_url) : null;
```

(`t`는 `useTechnique`의 `data`로, 이 컴포넌트에서 이미 구조분해되어 있다.)

- [ ] **Step 3: 영상 섹션 삽입**

상세 JSX에서 즐겨찾기/익힘 플래그 블록(`{t.is_learned && ...}` 가 들어있는 `<div className="flex gap-2 text-sm">...</div>`)의 **닫는 `</div>` 다음**, "기술 순서" 섹션(`{t.steps && t.steps.length > 0 && (`) **앞**에 삽입:

```tsx
            {t.video_url && (
              <section className="space-y-2">
                <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground-muted">
                  <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
                  영상
                </h2>
                {videoEmbed ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-surface-muted shadow-lg shadow-black/20">
                    <iframe
                      src={videoEmbed}
                      title={`${t.name} 영상`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <a
                    href={t.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    ▶ 유튜브에서 보기
                  </a>
                )}
              </section>
            )}
```

- [ ] **Step 4: 린트 + 타입체크**

Run: `npm run lint`
Expected: 에러 없음.

Run: `npx tsc --noEmit`
Expected: 소스 에러 없음(`.next/dev/types/*` 사전 에러 무시).

- [ ] **Step 5: mock 모드 수동 검증** (헤드리스 불가 시 컨트롤러가 수행)

Run: `npm run dev`
1. 홈에서 "암바" 카드 → 상세 진입 → "영상" 섹션에 임베드 플레이어가 보인다.
2. 영상 없는 카드(예: 오모플라타) 상세 → "영상" 섹션이 아예 안 보인다.

- [ ] **Step 6: 커밋**

```bash
git add app/cards/[id]/page.tsx
git commit -m "feat: embed YouTube video on technique detail"
```

---

## Task 5: 통합 검증

**Files:** 없음(검증 전용).

- [ ] **Step 1: 전체 단위 테스트**

Run: `npm test`
Expected: 모든 테스트 PASS(기존 + `youtube.test.ts` + 시드 잠금).

- [ ] **Step 2: 린트 + 타입체크**

Run: `npm run lint && npx tsc --noEmit`
Expected: 에러 없음(`.next/dev/types/*` 사전 에러가 보이면 Step 3 빌드로 확인).

- [ ] **Step 3: 프로덕션 빌드**

Run: `npm run build`
Expected: 컴파일 + TypeScript + 정적 생성 성공. (실패가 `.next/dev/types/*` 때문이면 `rm -rf .next` 후 재실행.)

---

## Self-Review

**Spec coverage:**
- 임베드 헬퍼(youtubeEmbedUrl) → Task 1. ✓
- video_url 필드(타입/마이그레이션/시드) → Task 2. ✓
- 폼 입력 + 미리보기 + 양쪽 페이로드 → Task 3. ✓
- 상세 임베드 + 폴백 링크 → Task 4. ✓
- 목록 카드 미표시 → 어느 태스크도 카드를 건드리지 않음(설계대로). ✓
- 한국어 카피, 기존 섹션 헤더 패턴 → Task 3·4. ✓
- 비범위(영상 다수/썸네일/배지/재생목록/시작시간) → 계획에 없음. ✓

**Placeholder scan:** TBD/TODO/"적절히" 류 없음. 모든 코드 단계에 실제 코드 포함. ✓

**Type consistency:** `youtubeEmbedUrl(url: string): string | null` 시그니처가 Task 1 정의와 Task 3·4 사용에서 일치. `video_url` 필드명이 `Technique` 타입(Task 2)·폼 페이로드(Task 3)·상세(Task 4)에서 일관. `videoValue`/`videoEmbed` 이름 일관. ✓
