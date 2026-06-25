# 카드 호버 수정 버튼 + GIF 편집 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 그리드 카드에 호버 시 나타나는 수정 버튼을 추가하고, 생성/수정 폼에서 GIF(URL)를 편집할 수 있게 한다.

**Architecture:** 추가/수정 라우트(`/cards/new`, `/cards/[id]/edit`)와 공용 `TechniqueForm`은 이미 존재한다. (1) 순수 헬퍼 `lib/gif.ts`로 Giphy 포스터를 도출하고, (2) `TechniqueForm`에 GIF URL 입력·미리보기를 추가해 mock·Supabase 양쪽 저장 경로에 `gif_url`/`gif_poster`를 싣고, (3) `TechniqueCard`의 기존 우상단 인증 클러스터에 호버 노출 연필 링크를 추가한다. 새 페이지/라우트 없음.

**Tech Stack:** Next.js 16 (App Router, 클라이언트 컴포넌트), React 19, TypeScript, TanStack Query, Tailwind v4, Vitest(unit), Playwright(e2e).

## Global Constraints

- **GIF 입력은 URL 붙여넣기만** — 파일 업로드/스토리지 변경 없음.
- **수정 폼은 전체 폼 유지 + GIF 필드만 추가** — 기존 필드(포지션·카테고리·난이도·순서·설명·이미지) 제거 금지.
- **"기술 설명" = `details` 필드**(기존 "디테일(마크다운)").
- **GIF 포스터는 자동 도출** — 별도 입력 필드 없음. Giphy mp4면 `giphy_s.gif`, 아니면 `null`.
- **`gif_url`/`gif_poster`는 mock 페이로드와 Supabase 페이로드 양쪽 모두에 포함**. DB 컬럼은 `supabase/migrations/0002_steps_and_gif.sql`로 이미 존재.
- **UI 카피는 한국어**.
- **AGENTS.md**: 이 Next.js는 학습 데이터와 다를 수 있음 — 새 Next API를 도입하지 말고 기존 컴포넌트 패턴(클라이언트 컴포넌트 + `next/link`)만 따른다. 본 작업은 새 Next API를 쓰지 않는다.
- 기존 코드 스타일(들여쓰기, 한국어 주석, Tailwind 유틸 클래스 구성)을 그대로 따른다.

---

## File Structure

- **Create** `lib/gif.ts` — 순수 헬퍼 `derivePoster(url)`. 단일 책임: Giphy mp4 → 포스터 URL 도출.
- **Create** `tests/unit/gif.test.ts` — `derivePoster` 단위 테스트.
- **Modify** `components/TechniqueForm.tsx` — GIF URL 상태/입력/미리보기 추가, 두 저장 경로에 gif 필드 포함.
- **Modify** `components/TechniqueCard.tsx` — 우상단 인증 클러스터에 호버 노출 수정 링크 추가.

---

## Task 1: `derivePoster` 헬퍼 (TDD)

**Files:**
- Create: `lib/gif.ts`
- Test: `tests/unit/gif.test.ts`

**Interfaces:**
- Consumes: 없음.
- Produces: `export function derivePoster(url: string): string | null` — Giphy mp4 핫링크면 정지 프레임(poster) URL을 반환, 그 외엔 `null`. Task 2가 사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/unit/gif.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { derivePoster } from '@/lib/gif';

describe('derivePoster', () => {
  it('Giphy mp4 URL이면 giphy_s.gif 포스터를 도출한다', () => {
    expect(derivePoster('https://media.giphy.com/media/abc123/giphy.mp4')).toBe(
      'https://media.giphy.com/media/abc123/giphy_s.gif',
    );
  });

  it('media 서브도메인 숫자도 허용한다', () => {
    expect(derivePoster('https://media2.giphy.com/media/xyz/giphy.mp4')).toBe(
      'https://media2.giphy.com/media/xyz/giphy_s.gif',
    );
  });

  it('Giphy가 아닌 mp4면 null', () => {
    expect(derivePoster('https://example.com/clip.mp4')).toBeNull();
  });

  it('Giphy gif(비 mp4)면 null', () => {
    expect(derivePoster('https://media.giphy.com/media/abc123/giphy.gif')).toBeNull();
  });

  it('빈 문자열이면 null', () => {
    expect(derivePoster('')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- gif`
Expected: FAIL — `Failed to resolve import "@/lib/gif"` (모듈 없음).

- [ ] **Step 3: 최소 구현 작성**

`lib/gif.ts`:

```ts
/**
 * Giphy mp4 핫링크(`.../giphy.mp4`)면 정지 프레임(poster) URL(`.../giphy_s.gif`)을
 * 도출한다. Giphy 패턴이 아니면 null(이 경우 비디오 첫 프레임이 그대로 노출됨).
 * seed.ts 의 giphy() 헬퍼가 만드는 URL 형식과 짝을 이룬다.
 */
export function derivePoster(url: string): string | null {
  const m = url.match(/^(https:\/\/media\d*\.giphy\.com\/media\/[^/]+\/)giphy\.mp4(?:\?.*)?$/);
  return m ? `${m[1]}giphy_s.gif` : null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- gif`
Expected: PASS (5개 통과).

- [ ] **Step 5: 커밋**

```bash
git add lib/gif.ts tests/unit/gif.test.ts
git commit -m "feat: add derivePoster helper for Giphy gif posters"
```

---

## Task 2: `TechniqueForm`에 GIF (URL) 필드 추가

**Files:**
- Modify: `components/TechniqueForm.tsx`

**Interfaces:**
- Consumes: `derivePoster` (Task 1) from `@/lib/gif`.
- Produces: 저장 시 `Technique.gif_url` / `Technique.gif_poster`를 채우는 폼. 별도 외부 인터페이스 없음.

이 컴포넌트는 node 환경 vitest로 단위 테스트할 수 없으므로(현재 RTL/jsdom 미설치) lint + 타입체크 + mock 모드 수동 검증으로 확인한다.

- [ ] **Step 1: `derivePoster` import 추가**

`components/TechniqueForm.tsx` 상단 import 묶음에 추가(예: `publicImageUrl` import 아래):

```ts
import { derivePoster } from '@/lib/gif';
```

- [ ] **Step 2: `gifUrl` 상태 추가**

`const [image, setImage] = useState<ImageDraft>(...)` 블록 **다음 줄**에 추가:

```ts
const [gifUrl, setGifUrl] = useState(initial?.gif_url ?? '');
```

- [ ] **Step 3: 제출 핸들러에서 gif 값 계산**

`onSubmit` 안에서 `const stepsValue = stepsList.length ? stepsList : null;` **다음**에 추가:

```ts
// GIF URL → null(빈 값) 정규화. 포스터는 Giphy면 자동 도출, URL이 그대로면 기존 포스터 보존.
const gifValue = gifUrl.trim() || null;
const gifPosterValue = !gifValue
  ? null
  : gifValue === (initial?.gif_url ?? null)
    ? initial?.gif_poster ?? derivePoster(gifValue)
    : derivePoster(gifValue);
```

- [ ] **Step 4: mock 페이로드에 gif 필드 포함**

mock 분기의 `const payload: Technique = { ... }` 객체에서 `image_path,` 줄 **다음**에 두 줄 추가:

```ts
          image_path,
          gif_url: gifValue,
          gif_poster: gifPosterValue,
```

(기존 코드: `image_path,` 다음은 `is_favorite: ...`. 그 사이에 삽입.)

- [ ] **Step 5: Supabase 페이로드에 gif 필드 포함**

Supabase 분기의 `const payload = { ... }` 객체에서 `image_path: imagePath,` 줄 **다음**에 두 줄 추가:

```ts
        image_path: imagePath,
        gif_url: gifValue,
        gif_poster: gifPosterValue,
      };
```

- [ ] **Step 6: GIF (URL) 입력 + 미리보기 UI 추가**

`<div>`로 감싼 **이미지 블록**(`<span className={labelCls}>이미지</span>` 가 있는 `<div>`) **바로 앞**에 아래 블록을 삽입:

```tsx
      <label className="block">
        <span className={labelCls}>GIF (URL)</span>
        <input
          value={gifUrl}
          onChange={(e) => setGifUrl(e.target.value)}
          placeholder="예: https://media.giphy.com/media/xxxx/giphy.mp4"
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-foreground-subtle">
          호버/탭 시 재생되는 미리보기 영상(mp4) URL. 비우면 GIF 없음.
        </span>
        {gifUrl.trim() && (
          <div className="relative mt-2 aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
            <video
              key={gifUrl.trim()}
              src={gifUrl.trim()}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </label>
```

(`key={gifUrl.trim()}`는 URL이 바뀔 때 `<video>`를 강제로 새로 로드시킨다.)

- [ ] **Step 7: 린트 통과 확인**

Run: `npm run lint`
Expected: 에러 없음(경고 0 또는 기존 수준 유지).

- [ ] **Step 8: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 9: mock 모드 수동 검증**

Run: `npm run dev` (mock 모드 — `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`이 없거나 `NEXT_PUBLIC_USE_MOCK=true`)

확인 항목:
1. `/cards/new`에서 "GIF (URL)" 입력에 `https://media.giphy.com/media/1WYS9mpxOUVbxGmdFt/giphy.mp4` 붙여넣기 → 사각형 미리보기가 재생된다.
2. 이름 입력 후 저장 → 홈 목록의 새 카드에 호버하면 GIF가 재생된다.
3. 기존 GIF 시드 카드 "암바" 상세 → 수정 진입 → GIF 입력란에 기존 URL이 채워져 있음 → 변경 없이 저장 → 카드/상세에서 GIF가 **그대로 유지**된다(편집 시 GIF 사라짐 버그 해결 확인).
4. GIF 입력을 비우고 저장 → 카드가 이미지(또는 플레이스홀더)로 폴백된다.

- [ ] **Step 10: 커밋**

```bash
git add components/TechniqueForm.tsx
git commit -m "feat: edit GIF url in technique form (create + edit)"
```

---

## Task 3: `TechniqueCard`에 호버 수정 버튼 추가

**Files:**
- Modify: `components/TechniqueCard.tsx`

**Interfaces:**
- Consumes: 기존 `t.id`, `authed`, 그리고 이미 import된 `Link` (`next/link`).
- Produces: 외부 인터페이스 없음(시각적 동작만).

- [ ] **Step 1: 인증 클러스터에 수정 링크 추가**

`components/TechniqueCard.tsx`에서 `{authed && (` 로 시작하는 블록의 `<div className="absolute right-2 top-2 flex gap-1.5">` **여는 태그 바로 다음**(첫 자식으로, 기존 즐겨찾기 `IconToggle` 앞)에 삽입:

```tsx
          <Link
            href={`/cards/${t.id}/edit`}
            aria-label="수정"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-black/60 hover:text-white focus-visible:opacity-100 active:scale-95 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
```

근거: 이 클러스터는 카드의 `<Link>` 래퍼 바깥 형제이므로 상세 이동과 충돌하지 않는다. 루트 `div`에 `group` 클래스가 있어 `group-hover:opacity-100`가 카드 전체 호버에 반응한다. `[@media(hover:none)]:opacity-100`로 터치 기기에서는 항상 노출. `focus-visible:opacity-100`로 키보드 접근 보장.

- [ ] **Step 2: 린트 통과 확인**

Run: `npm run lint`
Expected: 에러 없음.

- [ ] **Step 3: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: mock 모드 수동 검증**

Run: `npm run dev`

확인 항목:
1. 홈에서 카드에 마우스를 올리면 우상단에 연필(수정) 버튼이 페이드 인된다(즐겨찾기/익힘 왼쪽).
2. 연필 클릭 → `/cards/<id>/edit`로 이동한다(즐겨찾기/익힘 토글이나 카드 본문 클릭과 혼동되지 않음).
3. 키보드 Tab으로 포커스 시 버튼이 보인다.

- [ ] **Step 5: 커밋**

```bash
git add components/TechniqueCard.tsx
git commit -m "feat: show edit button on card hover"
```

---

## Task 4: 통합 검증

**Files:** 없음(검증 전용).

- [ ] **Step 1: 전체 단위 테스트**

Run: `npm test`
Expected: 모든 테스트 PASS(기존 + `gif.test.ts`).

- [ ] **Step 2: 린트 + 타입체크**

Run: `npm run lint && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 프로덕션 빌드**

Run: `npm run build`
Expected: 빌드 성공(타입/컴파일 에러 없음).

- [ ] **Step 4: (선택) e2e**

`E2E_EMAIL`/`E2E_PASSWORD`와 실제 Supabase 백엔드가 있을 때만:
Run: `npm run test:e2e`
Expected: 기존 e2e PASS. (mock 전용 환경에서는 자격 증명이 없으면 생략.)

---

## Self-Review

**Spec coverage:**
- 호버 수정 버튼 → Task 3. ✓
- GIF URL 편집(생성+수정) → Task 2. ✓
- 포스터 자동 도출(Giphy/그 외 null) → Task 1 + Task 2 Step 3. ✓
- 두 저장 경로에 gif 필드 포함 → Task 2 Step 4·5. ✓
- 편집 시 GIF 사라짐 버그 해결 → Task 2 Step 4 + Step 9(3). ✓
- 전체 폼 유지(필드 제거 없음) → Task 2는 추가만 함. ✓
- 비범위(업로드/별도 포스터 필드/추가 진입점 재설계) → 계획에 없음. ✓

**Placeholder scan:** TBD/TODO/"적절히 처리" 류 없음. 모든 코드 단계에 실제 코드 포함. ✓

**Type consistency:** `derivePoster(url: string): string | null` 시그니처가 Task 1 정의와 Task 2 사용에서 일치. `gifValue`/`gifPosterValue` 이름이 Step 3·4·5에서 일관. `gif_url`/`gif_poster`는 `lib/types.ts`의 `Technique` 필드명과 일치. ✓
