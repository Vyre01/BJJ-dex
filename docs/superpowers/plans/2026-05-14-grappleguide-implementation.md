# GrappleGuide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 주짓수 기술 50장 규모의 1인용 카드 웹앱 — 모바일 우선 그리드 + 필터, Supabase 백엔드, 이미지 업로드, 즐겨찾기/익힘 토글, 단일계정 인증.

**Architecture:** Next.js 15 (App Router, 클라이언트 중심 CSR + 서버 컴포넌트 일부) → Supabase JS SDK 직접 호출(BFF 없음). 50장은 메모리에 전부 로드해 React Query 캐시 + 클라이언트 사이드 필터. RLS로 익명 읽기 / authenticated 쓰기.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase (Postgres + Storage + Auth), `@tanstack/react-query` v5, `browser-image-compression`, Playwright (E2E), Vitest (단위).

**참조 스펙:** [`docs/superpowers/specs/2026-05-07-grappleguide-design.md`](../specs/2026-05-07-grappleguide-design.md)

---

## File Structure

> 모든 경로는 `C:\Projects\GrappleGuide\` 기준 상대 경로.

**Configuration / 루트:**
- `package.json` — 의존성 + 스크립트
- `tsconfig.json` — TypeScript 설정
- `next.config.js` — Next.js 설정 (Supabase 이미지 도메인 허용)
- `tailwind.config.ts` — Tailwind 설정
- `postcss.config.mjs` — PostCSS 설정
- `playwright.config.ts` — Playwright E2E 설정
- `vitest.config.ts` — Vitest 단위 테스트 설정
- `middleware.ts` — `/cards/new`, `/cards/*/edit` 인증 가드
- `.env.local.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `.gitignore`

**App Router 페이지:**
- `app/layout.tsx` — 루트 레이아웃 + React Query Provider + Toast Provider
- `app/page.tsx` — 메인 그리드 (`/`)
- `app/globals.css` — Tailwind directives
- `app/error.tsx` — 라우트 레벨 에러 바운더리
- `app/cards/[id]/page.tsx` — 카드 상세
- `app/cards/[id]/edit/page.tsx` — 카드 수정
- `app/cards/new/page.tsx` — 카드 추가
- `app/learned/page.tsx` — 익힌 기술
- `app/favorites/page.tsx` — 즐겨찾기
- `app/login/page.tsx` — 로그인

**컴포넌트:**
- `components/TechniqueCard.tsx` — 그리드 셀
- `components/TechniqueDetail.tsx` — 상세 본문
- `components/TechniqueForm.tsx` — 추가/수정 공용 폼
- `components/FilterBar.tsx` — 검색 + 필터 + URL 동기화
- `components/ImageUploader.tsx` — 파일 선택 + 압축 + 업로드
- `components/StarRating.tsx` — 별점 입출력
- `components/Toast.tsx` — 토스트 + Provider
- `components/Header.tsx` — sticky 헤더
- `components/Fab.tsx` — Floating Action Button (인증 시만 표시)
- `components/Providers.tsx` — React Query + Toast Provider 묶음

**라이브러리:**
- `lib/supabase/client.ts` — 브라우저용 Supabase 클라이언트
- `lib/supabase/server.ts` — 서버 컴포넌트/미들웨어용
- `lib/constants.ts` — `POSITIONS`, `CATEGORIES`
- `lib/types.ts` — `Technique` 타입
- `lib/filters.ts` — `filterTechniques(list, filters)` 순수 함수
- `lib/filters-url.ts` — URL ↔ filter 상태 변환
- `lib/image.ts` — 이미지 압축·업로드 유틸
- `lib/queries.ts` — React Query key + hook (`useTechniques`, `useTechnique`, mutation)

**DB 마이그레이션:**
- `supabase/migrations/0001_init.sql` — 테이블 + 인덱스 + RLS + trigger
- `supabase/storage-policies.sql` — Storage bucket 정책 (참조용 SQL, 콘솔/migration 둘 다 가능)

**테스트:**
- `tests/unit/filters.test.ts` — `filterTechniques` 단위 테스트
- `tests/e2e/add-technique.spec.ts`
- `tests/e2e/filter.spec.ts`
- `tests/e2e/favorite.spec.ts`
- `tests/e2e/auth-redirect.spec.ts`
- `tests/e2e/fixtures/` — 테스트 이미지

---

## 작업 흐름 노트

- TDD: `filters.ts`처럼 순수 함수가 있는 모듈은 테스트 먼저 작성.
- 빈번한 커밋: 각 Task 끝에 커밋. 단, **사용자가 사전에 `git init`을 해두지 않았다면 Task 1에서 git 초기화를 먼저 한다.**
- Windows + PowerShell 환경: `pnpm`이 아니라 `npm`을 기본으로 사용 (사용자 환경에 lock-in 줄임). 사용자가 다른 선호를 표명하면 변경 가능.
- Supabase 프로젝트는 **사용자가 직접 생성**해야 한다 (대시보드 작업). Task 3에서 사용자에게 안내하고 `.env.local`을 받는다.

---

## Task 1: 프로젝트 초기화 (Next.js + TS + Tailwind)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`

- [ ] **Step 1: Next.js 프로젝트 부트스트랩**

`docs/`가 이미 존재해 `create-next-app .`이 거부될 수 있다. 가장 확실한 우회: 임시 디렉터리에서 만들고 결과물을 옮긴다.

PowerShell에서:

```powershell
cd C:\Projects
npx --yes create-next-app@latest GrappleGuide-bootstrap --typescript --tailwind --app --eslint --no-src-dir --import-alias '@/*' --use-npm
# 결과물을 기존 디렉터리로 이동 (docs/ 보존)
Move-Item -Force GrappleGuide-bootstrap\* C:\Projects\GrappleGuide\
Move-Item -Force GrappleGuide-bootstrap\.[!.]* C:\Projects\GrappleGuide\
Remove-Item -Recurse -Force GrappleGuide-bootstrap
cd C:\Projects\GrappleGuide
```

옵션 의미: TS / Tailwind / App Router / ESLint / src 디렉터리 사용 안함 / `@/` import alias / npm 강제.

만약 위의 옵션 플래그 일부가 현재 `create-next-app` 버전에서 다른 이름을 갖는다면 interactive prompt가 뜬다 — 동일한 선택지로 응답한다.

`docs/`가 그대로 남아 있는지 마지막에 확인:

```powershell
Test-Path docs\superpowers\specs\2026-05-07-grappleguide-design.md
```

`True`여야 함.

- [ ] **Step 2: Git 초기화 + 초기 커밋**

```powershell
git init
git add .
git commit -m "chore: bootstrap Next.js + TS + Tailwind"
```

- [ ] **Step 3: 작동 확인**

```powershell
npm run dev
```

브라우저로 `http://localhost:3000` 열어 기본 Next.js 페이지 확인 → 종료(Ctrl+C).

- [ ] **Step 4: `app/page.tsx`를 빈 placeholder로 교체**

```tsx
export default function HomePage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">GrappleGuide</h1>
      <p className="text-sm text-gray-500">곧 준비됩니다…</p>
    </main>
  );
}
```

- [ ] **Step 5: 커밋**

```powershell
git add app/page.tsx
git commit -m "chore: replace default landing with placeholder"
```

---

## Task 2: 의존성 설치 (Supabase / React Query / 이미지 압축 / 테스트)

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 런타임 의존성 설치**

```powershell
npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query browser-image-compression
```

`@supabase/ssr`은 서버 컴포넌트/미들웨어에서 쿠키 기반 세션을 다루기 위해 필요.

- [ ] **Step 2: dev 의존성 설치**

```powershell
npm install -D vitest @vitest/ui @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: `package.json` scripts 보강**

`scripts` 섹션을 다음과 같이 만든다(기존 `dev`/`build`/`start`/`lint` 유지):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 4: 빌드 통과 확인**

```powershell
npm run build
```

타입 에러 없이 통과해야 함.

- [ ] **Step 5: 커밋**

```powershell
git add package.json package-lock.json
git commit -m "chore: add Supabase, React Query, image compression, test deps"
```

---

## Task 3: Supabase 프로젝트 설정 안내 + 환경 변수

**Files:**
- Create: `.env.local.example`, `.env.local` (gitignored)
- Modify: `.gitignore`

- [ ] **Step 1: 사용자에게 Supabase 프로젝트 생성 안내**

이 단계는 사용자의 외부 작업이 필요하다. 실행자가 사용자에게 다음 단계를 안내한다:

1. https://supabase.com 에서 새 프로젝트 생성 (지역: Tokyo 또는 Seoul)
2. 프로젝트 Settings → API → `Project URL`과 `anon public` 키 복사
3. Authentication → Providers → Email 활성화, **Disable signups 켜기**
4. Authentication → Users → "Add user"로 본인 이메일/비밀번호 1개 사전 생성
5. Storage → New bucket → 이름 `technique-images`, **Public bucket = ON**

- [ ] **Step 2: `.env.local.example` 작성**

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

- [ ] **Step 3: 사용자로부터 받은 값으로 `.env.local` 생성**

사용자가 값을 제공하면 동일 포맷의 `.env.local`을 작성. 값이 없으면 사용자에게 입력을 요청한다.

- [ ] **Step 4: `.gitignore`에 `.env.local`이 포함되어 있는지 확인**

`create-next-app` 기본 `.gitignore`에 이미 들어있을 것. 없으면 추가:

```
.env*.local
```

- [ ] **Step 5: 커밋**

```powershell
git add .env.local.example .gitignore
git commit -m "chore: add Supabase env example"
```

`.env.local`은 커밋하지 않는다.

---

## Task 4: DB 마이그레이션 SQL 작성 + 적용

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/storage-policies.sql`

- [ ] **Step 1: `supabase/migrations/0001_init.sql` 작성**

```sql
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
```

- [ ] **Step 2: `supabase/storage-policies.sql` 작성 (참조용)**

```sql
-- bucket: technique-images (콘솔에서 Public=ON으로 생성한 상태 가정)

CREATE POLICY "anyone can read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'technique-images');

CREATE POLICY "authenticated can write images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'technique-images');

CREATE POLICY "authenticated can update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'technique-images');

CREATE POLICY "authenticated can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'technique-images');
```

- [ ] **Step 3: 사용자가 Supabase SQL Editor에서 두 파일을 순서대로 실행**

`0001_init.sql` → `storage-policies.sql` 순서.

실행 후 사용자에게 "techniques 테이블이 만들어졌는지, RLS가 켜져 있는지" 대시보드에서 확인 요청.

- [ ] **Step 4: 커밋**

```powershell
git add supabase/
git commit -m "feat(db): initial schema, RLS, triggers, storage policies"
```

---

## Task 5: 코어 타입 + 상수 + Supabase 클라이언트

**Files:**
- Create: `lib/types.ts`, `lib/constants.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: `lib/types.ts` 작성**

```ts
import type { POSITIONS, CATEGORIES } from './constants';

export type Position = (typeof POSITIONS)[number];
export type Category = (typeof CATEGORIES)[number];
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Technique {
  id: string;
  name: string;
  position: Position;
  category: Category;
  difficulty: Difficulty;
  details: string | null;
  image_path: string | null;
  is_favorite: boolean;
  is_learned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Filters {
  q?: string;
  position?: Position;
  category?: Category;
  difficulty?: Difficulty;
  fav?: boolean;
  learned?: boolean;
}
```

- [ ] **Step 2: `lib/constants.ts` 작성**

```ts
export const POSITIONS = [
  '가드', '클로즈드 가드', '오픈 가드', '하프 가드',
  '마운트', '사이드 컨트롤', '백', '노스-사우스', '터틀', '스탠딩',
] as const;

export const CATEGORIES = [
  '서브미션', '스윕', '패스', '이스케이프',
  '가드 리커버리', '테이크다운', '트랜지션',
] as const;

export const STORAGE_BUCKET = 'technique-images';
```

- [ ] **Step 3: `lib/supabase/client.ts` 작성 (브라우저)**

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: `lib/supabase/server.ts` 작성 (서버 컴포넌트 / 미들웨어)**

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions),
            );
          } catch {
            // Server Component에서 set이 막힐 수 있음 — 미들웨어가 보완
          }
        },
      },
    },
  );
}
```

- [ ] **Step 5: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 6: 커밋**

```powershell
git add lib/
git commit -m "feat(lib): types, constants, supabase clients"
```

---

## Task 6: `filterTechniques` 순수 함수 (TDD)

**Files:**
- Test: `tests/unit/filters.test.ts`
- Create: `lib/filters.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: `vitest.config.ts` 작성**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 2: 실패 테스트 작성 `tests/unit/filters.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { filterTechniques } from '@/lib/filters';
import type { Technique } from '@/lib/types';

function tech(over: Partial<Technique> = {}): Technique {
  return {
    id: 't1',
    name: '암바',
    position: '클로즈드 가드',
    category: '서브미션',
    difficulty: 3,
    details: null,
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '',
    updated_at: '',
    ...over,
  };
}

describe('filterTechniques', () => {
  it('필터 없으면 전체 반환', () => {
    const list = [tech({ id: 'a' }), tech({ id: 'b', name: '트라이앵글' })];
    expect(filterTechniques(list, {})).toHaveLength(2);
  });

  it('q는 대소문자 무시 부분 일치 (한글/영문 혼합)', () => {
    const list = [
      tech({ id: 'a', name: '암바(Armbar)' }),
      tech({ id: 'b', name: '트라이앵글' }),
      tech({ id: 'c', name: 'BJJ Kimura' }),
    ];
    expect(filterTechniques(list, { q: 'arm' }).map((t) => t.id)).toEqual(['a']);
    expect(filterTechniques(list, { q: '트라' }).map((t) => t.id)).toEqual(['b']);
    expect(filterTechniques(list, { q: 'KIMURA' }).map((t) => t.id)).toEqual(['c']);
  });

  it('position 정확 일치', () => {
    const list = [
      tech({ id: 'a', position: '마운트' }),
      tech({ id: 'b', position: '백' }),
    ];
    expect(filterTechniques(list, { position: '마운트' }).map((t) => t.id)).toEqual(['a']);
  });

  it('category 정확 일치', () => {
    const list = [
      tech({ id: 'a', category: '서브미션' }),
      tech({ id: 'b', category: '스윕' }),
    ];
    expect(filterTechniques(list, { category: '스윕' }).map((t) => t.id)).toEqual(['b']);
  });

  it('difficulty는 "이상" 필터', () => {
    const list = [
      tech({ id: 'a', difficulty: 1 }),
      tech({ id: 'b', difficulty: 3 }),
      tech({ id: 'c', difficulty: 5 }),
    ];
    expect(filterTechniques(list, { difficulty: 3 }).map((t) => t.id)).toEqual(['b', 'c']);
  });

  it('fav=true면 즐겨찾기만, undefined면 전체', () => {
    const list = [
      tech({ id: 'a', is_favorite: true }),
      tech({ id: 'b', is_favorite: false }),
    ];
    expect(filterTechniques(list, { fav: true }).map((t) => t.id)).toEqual(['a']);
    expect(filterTechniques(list, {}).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('learned 삼분값: true=익힘만, false=미익힘만, undefined=전체', () => {
    const list = [
      tech({ id: 'a', is_learned: true }),
      tech({ id: 'b', is_learned: false }),
    ];
    expect(filterTechniques(list, { learned: true }).map((t) => t.id)).toEqual(['a']);
    expect(filterTechniques(list, { learned: false }).map((t) => t.id)).toEqual(['b']);
    expect(filterTechniques(list, {}).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('여러 필터 AND 결합', () => {
    const list = [
      tech({ id: 'a', position: '마운트', category: '서브미션', difficulty: 4, is_favorite: true }),
      tech({ id: 'b', position: '마운트', category: '서브미션', difficulty: 2, is_favorite: true }),
      tech({ id: 'c', position: '백',    category: '서브미션', difficulty: 5, is_favorite: true }),
    ];
    const out = filterTechniques(list, {
      position: '마운트',
      category: '서브미션',
      difficulty: 3,
      fav: true,
    });
    expect(out.map((t) => t.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

```powershell
npm test
```

Expected: FAIL — `filterTechniques` 미정의.

- [ ] **Step 4: `lib/filters.ts` 최소 구현**

```ts
import type { Filters, Technique } from './types';

export function filterTechniques(list: Technique[], f: Filters): Technique[] {
  const q = f.q?.trim().toLowerCase();
  return list.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q)) return false;
    if (f.position && t.position !== f.position) return false;
    if (f.category && t.category !== f.category) return false;
    if (f.difficulty !== undefined && t.difficulty < f.difficulty) return false;
    if (f.fav === true && !t.is_favorite) return false;
    if (f.learned === true && !t.is_learned) return false;
    if (f.learned === false && t.is_learned) return false;
    return true;
  });
}
```

- [ ] **Step 5: 테스트 통과 확인**

```powershell
npm test
```

Expected: PASS — 모든 케이스 통과.

- [ ] **Step 6: 커밋**

```powershell
git add tests/unit/ lib/filters.ts vitest.config.ts
git commit -m "feat(filters): pure filter function with full unit coverage"
```

---

## Task 7: URL ↔ Filters 변환 + queries 훅

**Files:**
- Create: `lib/filters-url.ts`, `lib/queries.ts`

- [ ] **Step 1: `lib/filters-url.ts` 작성**

```ts
import type { Filters, Position, Category, Difficulty } from './types';
import { POSITIONS, CATEGORIES } from './constants';

export function filtersFromSearchParams(sp: URLSearchParams): Filters {
  const out: Filters = {};
  const q = sp.get('q');
  if (q) out.q = q;

  const pos = sp.get('position');
  if (pos && (POSITIONS as readonly string[]).includes(pos)) out.position = pos as Position;

  const cat = sp.get('category');
  if (cat && (CATEGORIES as readonly string[]).includes(cat)) out.category = cat as Category;

  const diff = sp.get('difficulty');
  if (diff) {
    const n = Number(diff);
    if (Number.isInteger(n) && n >= 1 && n <= 5) out.difficulty = n as Difficulty;
  }

  if (sp.get('fav') === '1') out.fav = true;

  const learned = sp.get('learned');
  if (learned === '1') out.learned = true;
  else if (learned === '0') out.learned = false;

  return out;
}

export function filtersToSearchParams(f: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.position) sp.set('position', f.position);
  if (f.category) sp.set('category', f.category);
  if (f.difficulty) sp.set('difficulty', String(f.difficulty));
  if (f.fav === true) sp.set('fav', '1');
  if (f.learned === true) sp.set('learned', '1');
  else if (f.learned === false) sp.set('learned', '0');
  return sp;
}
```

- [ ] **Step 2: `lib/queries.ts` 작성**

```ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from './supabase/client';
import type { Technique } from './types';

export const techniquesKey = ['techniques'] as const;

export function useTechniques() {
  return useQuery({
    queryKey: techniquesKey,
    queryFn: async (): Promise<Technique[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('techniques')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Technique[];
    },
    staleTime: 30_000,
  });
}

export function useTechnique(id: string) {
  return useQuery({
    queryKey: ['technique', id],
    queryFn: async (): Promise<Technique> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('techniques')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Technique;
    },
  });
}

export function useToggleFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; field: 'is_favorite' | 'is_learned'; value: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('techniques')
        .update({ [vars.field]: vars.value })
        .eq('id', vars.id);
      if (error) throw error;
    },
    onMutate: async ({ id, field, value }) => {
      await qc.cancelQueries({ queryKey: techniquesKey });
      const prev = qc.getQueryData<Technique[]>(techniquesKey);
      if (prev) {
        qc.setQueryData<Technique[]>(
          techniquesKey,
          prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(techniquesKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: techniquesKey });
    },
  });
}

export function useDeleteTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('techniques').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: techniquesKey }),
  });
}
```

- [ ] **Step 3: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 4: 커밋**

```powershell
git add lib/filters-url.ts lib/queries.ts
git commit -m "feat(lib): URL filter serialization and React Query hooks"
```

---

## Task 8: 이미지 압축/업로드 유틸

**Files:**
- Create: `lib/image.ts`

- [ ] **Step 1: `lib/image.ts` 작성**

```ts
import imageCompression from 'browser-image-compression';
import { createClient } from './supabase/client';
import { STORAGE_BUCKET } from './constants';

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5MB

export class ImageError extends Error {}

export async function compressToWebp(file: File): Promise<Blob> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('이미지는 5MB 이하만 가능합니다.');
  }
  if (!file.type.startsWith('image/')) {
    throw new ImageError('이미지 파일만 업로드할 수 있습니다.');
  }
  return imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
  });
}

export async function uploadImage(techniqueId: string, file: File): Promise<string> {
  const blob = await compressToWebp(file);
  const path = `${techniqueId}.webp`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/webp' });
  if (error) throw new ImageError(error.message);
  return path;
}

export function publicImageUrl(path: string): string {
  const supabase = createClient();
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteImage(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) throw new ImageError(error.message);
}
```

- [ ] **Step 2: `next.config.js`에 Supabase Storage 이미지 호스트 허용**

`next.config.js`를 다음으로 교체:

```js
/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co').host; }
  catch { return 'example.supabase.co'; }
})();

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' },
    ],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 3: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 4: 커밋**

```powershell
git add lib/image.ts next.config.js
git commit -m "feat(image): compression and Supabase Storage upload helpers"
```

---

## Task 9: Providers (React Query + Toast)

**Files:**
- Create: `components/Toast.tsx`, `components/Providers.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: `components/Toast.tsx` 작성**

```tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type Tone = 'info' | 'success' | 'error';
type ToastItem = { id: number; tone: Tone; text: string };

const ToastCtx = createContext<((text: string, tone?: Tone) => void) | null>(null);

export function useToast() {
  const fn = useContext(ToastCtx);
  if (!fn) throw new Error('useToast outside ToastProvider');
  return fn;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((text: string, tone: Tone = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, tone, text }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              'rounded-lg px-4 py-2 text-sm shadow-lg ' +
              (t.tone === 'error'
                ? 'bg-red-600 text-white'
                : t.tone === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-900 text-white')
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
```

- [ ] **Step 2: `components/Providers.tsx` 작성**

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from './Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: `app/layout.tsx` 수정**

기존 layout.tsx를 다음으로 교체 (메타데이터/폰트는 create-next-app이 만든 것 유지하되 children을 Providers로 감싼다):

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'GrappleGuide',
  description: '주짓수 기술 카드',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

(create-next-app이 만든 Geist 등의 폰트 import가 이미 있다면 그대로 유지하고 Providers 래핑만 추가해도 됨.)

- [ ] **Step 4: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 5: 커밋**

```powershell
git add components/Providers.tsx components/Toast.tsx app/layout.tsx
git commit -m "feat(ui): React Query + Toast providers"
```

---

## Task 10: StarRating 컴포넌트

**Files:**
- Create: `components/StarRating.tsx`

- [ ] **Step 1: `components/StarRating.tsx` 작성**

```tsx
'use client';

type Props =
  | { value: number; onChange: (v: 1 | 2 | 3 | 4 | 5) => void; size?: 'sm' | 'md' }
  | { value: number; onChange?: undefined; size?: 'sm' | 'md' };

export function StarRating(props: Props) {
  const { value, size = 'md' } = props;
  const onChange = 'onChange' in props ? props.onChange : undefined;
  const readonly = !onChange;
  const cls = size === 'sm' ? 'text-base' : 'text-2xl';
  return (
    <div className={'inline-flex ' + cls} role={readonly ? 'img' : 'radiogroup'} aria-label={`난이도 ${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const common = filled ? 'text-yellow-500' : 'text-gray-300';
        return readonly ? (
          <span key={n} className={common}>★</span>
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`${n}점`}
            className={common + ' px-0.5'}
            onClick={() => onChange?.(n as 1 | 2 | 3 | 4 | 5)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 3: 커밋**

```powershell
git add components/StarRating.tsx
git commit -m "feat(ui): StarRating component"
```

---

## Task 11: TechniqueCard 컴포넌트 + 토글 버튼

**Files:**
- Create: `components/TechniqueCard.tsx`

- [ ] **Step 1: `components/TechniqueCard.tsx` 작성**

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Technique } from '@/lib/types';
import { publicImageUrl } from '@/lib/image';
import { useToggleFlag } from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import { StarRating } from './StarRating';

export function TechniqueCard({ t }: { t: Technique }) {
  const toggle = useToggleFlag();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const imgSrc = t.image_path ? publicImageUrl(t.image_path) : null;

  return (
    <div className="relative rounded-lg bg-white shadow overflow-hidden">
      <Link href={`/cards/${t.id}`} className="block">
        <div className="aspect-square bg-gray-200 relative">
          {imgSrc ? (
            <Image src={imgSrc} alt={t.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">이미지 없음</div>
          )}
        </div>
        <div className="p-2">
          <StarRating value={t.difficulty} size="sm" />
          <div className="text-sm font-medium truncate" title={t.name}>{t.name}</div>
          <div className="text-xs text-gray-500 truncate">{t.position} · {t.category}</div>
        </div>
      </Link>

      <div className="absolute top-1 right-1 flex gap-1">
        <button
          type="button"
          aria-label={t.is_favorite ? '즐겨찾기 해제' : '즐겨찾기'}
          disabled={!authed || toggle.isPending}
          onClick={(e) => {
            e.preventDefault();
            toggle.mutate({ id: t.id, field: 'is_favorite', value: !t.is_favorite });
          }}
          className={
            'rounded-full bg-white/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
            (t.is_favorite ? 'text-yellow-500' : 'text-gray-400')
          }
        >
          ★
        </button>
        <button
          type="button"
          aria-label={t.is_learned ? '익힘 해제' : '익힘'}
          disabled={!authed || toggle.isPending}
          onClick={(e) => {
            e.preventDefault();
            toggle.mutate({ id: t.id, field: 'is_learned', value: !t.is_learned });
          }}
          className={
            'rounded-full bg-white/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
            (t.is_learned ? 'text-emerald-600' : 'text-gray-400')
          }
        >
          ✓
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 3: 커밋**

```powershell
git add components/TechniqueCard.tsx
git commit -m "feat(ui): TechniqueCard with favorite/learned toggle"
```

---

## Task 12: FilterBar (검색 + 드롭다운 + URL 동기화)

**Files:**
- Create: `components/FilterBar.tsx`

- [ ] **Step 1: `components/FilterBar.tsx` 작성**

```tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { POSITIONS, CATEGORIES } from '@/lib/constants';
import { filtersFromSearchParams, filtersToSearchParams } from '@/lib/filters-url';
import type { Filters } from '@/lib/types';

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(new URLSearchParams(sp.toString())), [sp]);

  function apply(next: Filters) {
    const qs = filtersToSearchParams(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-2 p-2 bg-white border-b sticky top-12 z-10">
      <input
        type="search"
        placeholder="🔍 기술명 검색…"
        defaultValue={filters.q ?? ''}
        onChange={(e) => apply({ ...filters, q: e.target.value || undefined })}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
        <select
          aria-label="포지션"
          value={filters.position ?? ''}
          onChange={(e) => apply({ ...filters, position: (e.target.value || undefined) as Filters['position'] })}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="">포지션</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          aria-label="카테고리"
          value={filters.category ?? ''}
          onChange={(e) => apply({ ...filters, category: (e.target.value || undefined) as Filters['category'] })}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="">카테고리</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          aria-label="난이도 이상"
          value={filters.difficulty ?? ''}
          onChange={(e) =>
            apply({
              ...filters,
              difficulty: e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4 | 5) : undefined,
            })
          }
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="">★ 이상</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)} 이상</option>)}
        </select>
        <button
          type="button"
          aria-pressed={filters.fav === true}
          onClick={() => apply({ ...filters, fav: filters.fav ? undefined : true })}
          className={
            'rounded-md border px-2 py-1 text-sm ' +
            (filters.fav ? 'bg-yellow-100 border-yellow-400' : 'bg-white')
          }
        >
          ☆ 즐겨찾기
        </button>
        <button
          type="button"
          aria-label="익힘 상태"
          onClick={() =>
            apply({
              ...filters,
              learned: filters.learned === true ? false : filters.learned === false ? undefined : true,
            })
          }
          className={
            'rounded-md border px-2 py-1 text-sm ' +
            (filters.learned === true
              ? 'bg-emerald-100 border-emerald-400'
              : filters.learned === false
              ? 'bg-gray-100 border-gray-400'
              : 'bg-white')
          }
        >
          {filters.learned === true ? '✓ 익힘만' : filters.learned === false ? '○ 미익힘만' : '✓ 익힘'}
        </button>
        <button
          type="button"
          onClick={() => apply({})}
          className="rounded-md border px-2 py-1 text-sm bg-white"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 3: 커밋**

```powershell
git add components/FilterBar.tsx
git commit -m "feat(ui): FilterBar with URL sync"
```

---

## Task 13: Header + FAB + 메인 그리드 페이지

**Files:**
- Create: `components/Header.tsx`, `components/Fab.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: `components/Header.tsx` 작성**

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    setEmail(null);
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b">
      <div className="flex items-center justify-between px-3 h-12">
        <Link href="/" className="font-bold">GrappleGuide</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/favorites" className={pathname === '/favorites' ? 'font-semibold' : 'text-gray-600'}>★</Link>
          <Link href="/learned" className={pathname === '/learned' ? 'font-semibold' : 'text-gray-600'}>✓</Link>
          {email ? (
            <button type="button" onClick={logout} className="text-gray-600">로그아웃</button>
          ) : (
            <Link href="/login" className="text-gray-600">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: `components/Fab.tsx` 작성**

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function Fab() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!authed) return null;
  return (
    <Link
      href="/cards/new"
      aria-label="카드 추가"
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl flex items-center justify-center shadow-lg"
    >
      ＋
    </Link>
  );
}
```

- [ ] **Step 3: `app/page.tsx` 교체**

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { TechniqueCard } from '@/components/TechniqueCard';
import { Fab } from '@/components/Fab';
import { useTechniques } from '@/lib/queries';
import { filtersFromSearchParams } from '@/lib/filters-url';
import { filterTechniques } from '@/lib/filters';

export default function HomePage() {
  const sp = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(new URLSearchParams(sp.toString())), [sp]);
  const { data, isLoading, error } = useTechniques();

  const list = useMemo(() => (data ? filterTechniques(data, filters) : []), [data, filters]);

  return (
    <>
      <Header />
      <FilterBar />
      <main className="p-2">
        {isLoading && <p className="p-4 text-sm text-gray-500">불러오는 중…</p>}
        {error && <p className="p-4 text-sm text-red-600">불러오기 실패: {(error as Error).message}</p>}
        {!isLoading && !error && list.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-500">조건에 맞는 기술이 없습니다.</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {list.map((t) => <TechniqueCard key={t.id} t={t} />)}
        </div>
      </main>
      <Fab />
    </>
  );
}
```

- [ ] **Step 4: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 5: dev 서버로 확인**

```powershell
npm run dev
```

브라우저로 `http://localhost:3000` 열어 헤더 + 필터 + (비어있는) 그리드 + (인증 안 했으므로 안 보이는) FAB 확인 → Ctrl+C.

- [ ] **Step 6: 커밋**

```powershell
git add components/Header.tsx components/Fab.tsx app/page.tsx
git commit -m "feat(ui): main grid page with header, filter bar, FAB"
```

---

## Task 14: 로그인 페이지 + 미들웨어

**Files:**
- Create: `app/login/page.tsx`, `middleware.ts`

- [ ] **Step 1: `app/login/page.tsx` 작성**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast(`로그인 실패: ${error.message}`, 'error');
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <main className="max-w-sm mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">로그인</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-blue-600 text-white py-2 disabled:opacity-50"
        >
          {busy ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: `middleware.ts` 작성**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const needsAuth =
    path === '/cards/new' || /^\/cards\/[^/]+\/edit$/.test(path);

  if (needsAuth && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/cards/:path*'],
};
```

- [ ] **Step 3: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 4: 수동 검증**

```powershell
npm run dev
```

`http://localhost:3000/cards/new` 접속 → `/login?next=/cards/new` 리다이렉트 확인. 로그인 후 `/` 이동 확인. Ctrl+C.

- [ ] **Step 5: 커밋**

```powershell
git add app/login/ middleware.ts
git commit -m "feat(auth): login page and middleware-gated edit routes"
```

---

## Task 15: TechniqueForm + ImageUploader + new/edit 페이지

**Files:**
- Create: `components/ImageUploader.tsx`, `components/TechniqueForm.tsx`, `app/cards/new/page.tsx`, `app/cards/[id]/edit/page.tsx`

- [ ] **Step 1: `components/ImageUploader.tsx` 작성**

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { compressToWebp } from '@/lib/image';

export type ImageDraft =
  | { kind: 'none' }
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; previewUrl: string; blob: Blob };

export function ImageUploader({
  initialUrl,
  onChange,
}: {
  initialUrl: string | null;
  onChange: (d: ImageDraft) => void;
}) {
  const [state, setState] = useState<ImageDraft>(
    initialUrl ? { kind: 'existing', url: initialUrl } : { kind: 'none' },
  );
  const [err, setErr] = useState<string | null>(null);

  async function pick(file: File) {
    setErr(null);
    try {
      const blob = await compressToWebp(file);
      const previewUrl = URL.createObjectURL(blob);
      const next: ImageDraft = { kind: 'new', file, previewUrl, blob };
      setState(next);
      onChange(next);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  function clear() {
    const next: ImageDraft = { kind: 'none' };
    setState(next);
    onChange(next);
  }

  const url =
    state.kind === 'existing' ? state.url : state.kind === 'new' ? state.previewUrl : null;

  return (
    <div className="space-y-2">
      {url ? (
        <div className="relative w-full aspect-square bg-gray-100 rounded">
          <Image src={url} alt="미리보기" fill className="object-cover rounded" sizes="100vw" unoptimized />
        </div>
      ) : (
        <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
          이미지 없음
        </div>
      )}
      <div className="flex gap-2">
        <label className="rounded-md border px-3 py-1 text-sm cursor-pointer">
          이미지 선택
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pick(f);
            }}
          />
        </label>
        {state.kind !== 'none' && (
          <button type="button" onClick={clear} className="rounded-md border px-3 py-1 text-sm">
            제거
          </button>
        )}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
```

- [ ] **Step 2: `components/TechniqueForm.tsx` 작성**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { STORAGE_BUCKET, POSITIONS, CATEGORIES } from '@/lib/constants';
import { techniquesKey } from '@/lib/queries';
import type { Technique, Position, Category, Difficulty } from '@/lib/types';
import { StarRating } from './StarRating';
import { ImageUploader, type ImageDraft } from './ImageUploader';
import { publicImageUrl } from '@/lib/image';
import { useToast } from './Toast';

export function TechniqueForm({ initial }: { initial?: Technique }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState(initial?.name ?? '');
  const [position, setPosition] = useState<Position>((initial?.position as Position) ?? POSITIONS[0]);
  const [category, setCategory] = useState<Category>((initial?.category as Category) ?? CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 3);
  const [details, setDetails] = useState(initial?.details ?? '');
  const [image, setImage] = useState<ImageDraft>(
    initial?.image_path ? { kind: 'existing', url: publicImageUrl(initial.image_path) } : { kind: 'none' },
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast('기술명을 입력하세요.', 'error');
      return;
    }
    setBusy(true);
    const supabase = createClient();

    const id = initial?.id ?? crypto.randomUUID();
    let imagePath: string | null = initial?.image_path ?? null;

    try {
      if (image.kind === 'new') {
        const path = `${id}.webp`;
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, image.blob, { upsert: true, contentType: 'image/webp' });
        if (error) throw error;
        imagePath = path;
      } else if (image.kind === 'none' && initial?.image_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([initial.image_path]);
        imagePath = null;
      }

      const payload = {
        id,
        name: name.trim(),
        position,
        category,
        difficulty,
        details: details.trim() ? details : null,
        image_path: imagePath,
      };

      const { error } = initial
        ? await supabase.from('techniques').update(payload).eq('id', id)
        : await supabase.from('techniques').insert(payload);
      if (error) throw error;

      await qc.invalidateQueries({ queryKey: techniquesKey });
      toast(initial ? '수정됨' : '추가됨', 'success');
      router.push(initial ? `/cards/${id}` : '/');
      router.refresh();
    } catch (e) {
      toast(`저장 실패: ${(e as Error).message}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="text-sm">기술명</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm">포지션</span>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value as Position)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">카테고리</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <div>
        <span className="text-sm">난이도</span>
        <div className="mt-1"><StarRating value={difficulty} onChange={setDifficulty} /></div>
      </div>

      <label className="block">
        <span className="text-sm">디테일 (마크다운)</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm"
        />
      </label>

      <div>
        <span className="text-sm">이미지</span>
        <div className="mt-1">
          <ImageUploader
            initialUrl={initial?.image_path ? publicImageUrl(initial.image_path) : null}
            onChange={setImage}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
        >
          {busy ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-4 py-2"
        >
          취소
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: `app/cards/new/page.tsx` 작성**

```tsx
import { TechniqueForm } from '@/components/TechniqueForm';
import { Header } from '@/components/Header';

export default function NewCardPage() {
  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">새 기술 추가</h1>
        <TechniqueForm />
      </main>
    </>
  );
}
```

- [ ] **Step 4: `app/cards/[id]/edit/page.tsx` 작성**

```tsx
'use client';

import { use } from 'react';
import { Header } from '@/components/Header';
import { TechniqueForm } from '@/components/TechniqueForm';
import { useTechnique } from '@/lib/queries';

export default function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = useTechnique(id);

  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">기술 수정</h1>
        {isLoading && <p className="text-sm text-gray-500">불러오는 중…</p>}
        {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
        {data && <TechniqueForm initial={data} />}
      </main>
    </>
  );
}
```

- [ ] **Step 5: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 6: 수동 검증**

```powershell
npm run dev
```

로그인 → FAB 클릭 → 폼 작성 + 이미지 1장 → 저장 → 메인에 카드 표시 확인. Ctrl+C.

- [ ] **Step 7: 커밋**

```powershell
git add components/ImageUploader.tsx components/TechniqueForm.tsx app/cards/
git commit -m "feat(cards): create/edit form with image upload"
```

---

## Task 16: 카드 상세 페이지 (마크다운 렌더 + 삭제 버튼)

**Files:**
- Create: `app/cards/[id]/page.tsx`
- Modify: `package.json` (마크다운 라이브러리 추가)

- [ ] **Step 1: 마크다운 의존성 추가**

```powershell
npm install react-markdown remark-gfm
```

- [ ] **Step 2: `app/cards/[id]/page.tsx` 작성**

```tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { StarRating } from '@/components/StarRating';
import { useTechnique, useDeleteTechnique } from '@/lib/queries';
import { publicImageUrl, deleteImage } from '@/lib/image';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { data: t, isLoading, error } = useTechnique(id);
  const del = useDeleteTechnique();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  async function onDelete() {
    if (!t) return;
    if (!confirm(`"${t.name}" 카드를 삭제할까요?`)) return;
    try {
      if (t.image_path) {
        try { await deleteImage(t.image_path); } catch { /* 이미지 실패해도 레코드 삭제 진행 */ }
      }
      await del.mutateAsync(t.id);
      toast('삭제됨', 'success');
      router.push('/');
      router.refresh();
    } catch (e) {
      toast(`삭제 실패: ${(e as Error).message}`, 'error');
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto p-4">
        {isLoading && <p className="text-sm text-gray-500">불러오는 중…</p>}
        {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
        {t && (
          <article className="space-y-3">
            {t.image_path && (
              <div className="relative w-full aspect-square bg-gray-100 rounded">
                <Image
                  src={publicImageUrl(t.image_path)}
                  alt={t.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover rounded"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold">{t.name}</h1>
            <div className="text-sm text-gray-600">{t.position} · {t.category}</div>
            <StarRating value={t.difficulty} />
            <div className="flex gap-2 text-sm">
              {t.is_favorite && <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">★ 즐겨찾기</span>}
              {t.is_learned && <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">✓ 익힘</span>}
            </div>
            {t.details && (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.details}</ReactMarkdown>
              </div>
            )}
            {authed && (
              <div className="flex gap-2 pt-4">
                <Link href={`/cards/${t.id}/edit`} className="rounded-md border px-3 py-1 text-sm">수정</Link>
                <button type="button" onClick={onDelete} className="rounded-md border px-3 py-1 text-sm text-red-600">삭제</button>
              </div>
            )}
          </article>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 3: Tailwind typography 플러그인 (선택 — `prose` 클래스용)**

`prose` 클래스를 쓰려면 `@tailwindcss/typography` 설치:

```powershell
npm install -D @tailwindcss/typography
```

`tailwind.config.ts`에서 `plugins: [require('@tailwindcss/typography')]` 추가. 만약 typography 플러그인 도입이 부담스러우면 본문에서 `prose prose-sm max-w-none`을 빼고 단순 `<div className="whitespace-pre-wrap">`로 대체해도 무방.

- [ ] **Step 4: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 5: 커밋**

```powershell
git add 'app/cards/[id]/page.tsx' package.json package-lock.json tailwind.config.ts
git commit -m "feat(cards): detail page with markdown, edit, delete"
```

---

## Task 17: Favorites + Learned 페이지

**Files:**
- Create: `app/favorites/page.tsx`, `app/learned/page.tsx`

- [ ] **Step 1: `app/favorites/page.tsx` 작성**

```tsx
'use client';

import { useMemo } from 'react';
import { Header } from '@/components/Header';
import { TechniqueCard } from '@/components/TechniqueCard';
import { useTechniques } from '@/lib/queries';
import { filterTechniques } from '@/lib/filters';

export default function FavoritesPage() {
  const { data, isLoading } = useTechniques();
  const list = useMemo(() => (data ? filterTechniques(data, { fav: true }) : []), [data]);

  return (
    <>
      <Header />
      <main className="p-2">
        <h1 className="text-lg font-bold p-2">즐겨찾기</h1>
        {isLoading && <p className="p-4 text-sm text-gray-500">불러오는 중…</p>}
        {!isLoading && list.length === 0 && <p className="p-8 text-center text-sm text-gray-500">즐겨찾기가 없습니다.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {list.map((t) => <TechniqueCard key={t.id} t={t} />)}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: `app/learned/page.tsx` 작성**

```tsx
'use client';

import { useMemo } from 'react';
import { Header } from '@/components/Header';
import { TechniqueCard } from '@/components/TechniqueCard';
import { useTechniques } from '@/lib/queries';
import { filterTechniques } from '@/lib/filters';

export default function LearnedPage() {
  const { data, isLoading } = useTechniques();
  const list = useMemo(() => (data ? filterTechniques(data, { learned: true }) : []), [data]);

  return (
    <>
      <Header />
      <main className="p-2">
        <h1 className="text-lg font-bold p-2">익힌 기술</h1>
        {isLoading && <p className="p-4 text-sm text-gray-500">불러오는 중…</p>}
        {!isLoading && list.length === 0 && <p className="p-8 text-center text-sm text-gray-500">아직 익힌 기술이 없습니다.</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {list.map((t) => <TechniqueCard key={t.id} t={t} />)}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 3: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 4: 커밋**

```powershell
git add app/favorites/ app/learned/
git commit -m "feat(views): favorites and learned pages"
```

---

## Task 18: 에러 바운더리

**Files:**
- Create: `app/error.tsx`, `app/not-found.tsx`

- [ ] **Step 1: `app/error.tsx` 작성**

```tsx
'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2">문제가 발생했습니다</h1>
      <p className="text-sm text-gray-600 mb-4">{error.message}</p>
      <button type="button" onClick={reset} className="rounded-md border px-3 py-1 text-sm">
        다시 시도
      </button>
    </main>
  );
}
```

- [ ] **Step 2: `app/not-found.tsx` 작성**

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-xl font-bold mb-2">찾을 수 없습니다</h1>
      <Link href="/" className="text-blue-600 underline">메인으로</Link>
    </main>
  );
}
```

- [ ] **Step 3: 빌드 통과 확인**

```powershell
npm run build
```

- [ ] **Step 4: 커밋**

```powershell
git add app/error.tsx app/not-found.tsx
git commit -m "feat(ui): error boundary and 404 page"
```

---

## Task 19: Playwright 설정 + 인증 가드 E2E

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/auth-redirect.spec.ts`

- [ ] **Step 1: `playwright.config.ts` 작성**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

- [ ] **Step 2: `tests/e2e/auth-redirect.spec.ts` 작성**

```ts
import { test, expect } from '@playwright/test';

test('비인증 사용자가 /cards/new 접근 시 /login으로 리다이렉트', async ({ page }) => {
  await page.goto('/cards/new');
  await expect(page).toHaveURL(/\/login\?next=%2Fcards%2Fnew/);
});

test('비인증 사용자가 /cards/x/edit 접근 시 /login으로 리다이렉트', async ({ page }) => {
  await page.goto('/cards/00000000-0000-0000-0000-000000000000/edit');
  await expect(page).toHaveURL(/\/login\?next=/);
});
```

- [ ] **Step 3: 테스트 실행**

```powershell
npm run test:e2e -- auth-redirect
```

Expected: PASS — 두 케이스 모두.

- [ ] **Step 4: 커밋**

```powershell
git add playwright.config.ts tests/e2e/auth-redirect.spec.ts
git commit -m "test(e2e): Playwright config + auth redirect spec"
```

---

## Task 20: E2E 인증 헬퍼 + 카드 추가 / 필터 / 즐겨찾기 E2E

**Files:**
- Create: `tests/e2e/helpers.ts`, `tests/e2e/add-technique.spec.ts`, `tests/e2e/filter.spec.ts`, `tests/e2e/favorite.spec.ts`, `tests/e2e/fixtures/sample.png`

> **사전 조건:** 사용자가 테스트 전용 `.env.test`에 테스트 계정 자격증명을 두거나, 또는 Step 1에서 안내하는 환경 변수를 PowerShell에서 설정해야 한다. 본 계정 1개라서 이 단계를 위해 별도 테스트 카드 생성 → 정리 순서를 지킨다.

- [ ] **Step 1: 환경 변수 안내**

E2E 실행 전 PowerShell에서:

```powershell
$env:E2E_EMAIL='your@email.com'
$env:E2E_PASSWORD='yourpass'
```

또는 `.env.test.local`을 만들어 dotenv-cli로 주입 가능 (선택).

- [ ] **Step 2: 테스트용 이미지 fixture 추가**

`tests/e2e/fixtures/sample.png` — 임의의 작은 png (사용자에게 1장 준비 요청; 또는 코드 생성):

```powershell
New-Item -ItemType Directory -Force tests\e2e\fixtures | Out-Null
# 임시 1x1 PNG (base64) 생성
$bytes = [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
[IO.File]::WriteAllBytes("tests\e2e\fixtures\sample.png", $bytes)
```

- [ ] **Step 3: `tests/e2e/helpers.ts` 작성**

```ts
import type { Page } from '@playwright/test';

export async function login(page: Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error('E2E_EMAIL / E2E_PASSWORD 환경 변수가 필요합니다.');
  }
  await page.goto('/login');
  await page.getByPlaceholder('이메일').fill(email);
  await page.getByPlaceholder('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('/');
}

export async function deleteCardByName(page: Page, name: string) {
  await page.goto('/');
  const card = page.locator('div', { has: page.locator(`text=${name}`) }).first();
  if (await card.count()) {
    await card.click();
    await page.waitForURL(/\/cards\//);
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: '삭제' }).click();
    await page.waitForURL('/');
  }
}
```

- [ ] **Step 4: `tests/e2e/add-technique.spec.ts` 작성**

```ts
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { login, deleteCardByName } from './helpers';

const NAME = `E2E-카드-${Date.now()}`;

test('로그인 → 카드 추가(이미지 포함) → 목록 표시', async ({ page }) => {
  await login(page);

  await page.goto('/cards/new');
  await page.getByLabel('기술명').fill(NAME);
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/e2e/fixtures/sample.png'));
  // 압축 완료 대기 (미리보기 이미지 출현)
  await expect(page.getByAltText('미리보기')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: '저장' }).click();
  await page.waitForURL('/');
  await expect(page.getByText(NAME)).toBeVisible();
});

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await login(page);
  await deleteCardByName(page, NAME);
  await page.close();
});
```

> 참고: `getByLabel`은 `<label><span>기술명</span><input/></label>` 패턴에서 동작. 만약 안 잡히면 `page.locator('label:has-text("기술명") input')`로 변경.

- [ ] **Step 5: `tests/e2e/filter.spec.ts` 작성**

```ts
import { test, expect } from '@playwright/test';

test('필터 적용 → URL 반영', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('카테고리').selectOption('서브미션');
  await expect(page).toHaveURL(/category=%EC%84%9C%EB%B8%8C%EB%AF%B8%EC%85%98/);

  await page.getByLabel('포지션').selectOption('마운트');
  await expect(page).toHaveURL(/position=%EB%A7%88%EC%9A%B4%ED%8A%B8/);

  await page.getByRole('button', { name: '초기화' }).click();
  await expect(page).toHaveURL(/\/$/);
});
```

- [ ] **Step 6: `tests/e2e/favorite.spec.ts` 작성**

```ts
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { login, deleteCardByName } from './helpers';

const NAME = `E2E-즐겨-${Date.now()}`;

test('즐겨찾기 토글 → 새로고침 후 유지', async ({ page }) => {
  await login(page);

  // 사전 카드 1장 생성
  await page.goto('/cards/new');
  await page.getByLabel('기술명').fill(NAME);
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/e2e/fixtures/sample.png'));
  await expect(page.getByAltText('미리보기')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: '저장' }).click();
  await page.waitForURL('/');

  // 해당 카드의 ★ 버튼 클릭
  const card = page.locator('a', { hasText: NAME }).first().locator('..');
  await card.getByRole('button', { name: /즐겨찾기/ }).click();

  // 즐겨찾기 페이지로 이동해 노출 확인
  await page.goto('/favorites');
  await expect(page.getByText(NAME)).toBeVisible();

  // 새로고침 후 유지
  await page.reload();
  await expect(page.getByText(NAME)).toBeVisible();
});

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await login(page);
  await deleteCardByName(page, NAME);
  await page.close();
});
```

- [ ] **Step 7: 전체 E2E 실행**

```powershell
npm run test:e2e
```

Expected: 4 specs PASS (auth-redirect 2건 + 추가/필터/즐겨찾기 각 1건).

E2E 실패 시 systematic-debugging 스킬을 사용해 원인 분석 후 fix. 절대 임의로 테스트를 약화시키지 않는다.

- [ ] **Step 8: 커밋**

```powershell
git add tests/e2e/
git commit -m "test(e2e): add-technique, filter, favorite, with login helper"
```

---

## Task 21: 빌드 + lint + 모든 테스트 최종 검증

- [ ] **Step 1: Lint**

```powershell
npm run lint
```

Expected: 에러 없음. 경고만 있으면 수정 여부 사용자에게 확인.

- [ ] **Step 2: 단위 테스트**

```powershell
npm test
```

Expected: 모든 케이스 PASS.

- [ ] **Step 3: 프로덕션 빌드**

```powershell
npm run build
```

Expected: 빌드 성공.

- [ ] **Step 4: E2E 전체**

```powershell
npm run test:e2e
```

Expected: 전체 PASS.

- [ ] **Step 5: 수동 골든패스 1회**

```powershell
npm run dev
```

체크리스트:
- 로그인
- 카드 추가 (이미지 포함)
- 필터 작동 + URL 동기화
- 즐겨찾기 토글 → 즐겨찾기 페이지에 반영
- 익힘 토글 → 익힘 페이지에 반영
- 상세 진입, 마크다운 렌더, 수정, 삭제
- 로그아웃 → FAB 안 보임 / 토글 버튼 비활성

종료 (Ctrl+C).

- [ ] **Step 6: 커밋 (있다면)**

검증 중 발견된 잔여 수정사항 있으면 커밋. 없으면 다음 Task로.

---

## Task 22: README + 배포 안내

**Files:**
- Create: `README.md`

- [ ] **Step 1: `README.md` 작성**

```markdown
# GrappleGuide

주짓수 기술 카드 관리 1인용 앱.

## 개발

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev
```

## 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 테스트

```bash
npm test            # 단위 (Vitest)
npm run test:e2e    # E2E (Playwright)
```

E2E는 `E2E_EMAIL` / `E2E_PASSWORD` 환경 변수가 필요.

## 배포

- Frontend: Vercel (이 저장소 연결, 환경 변수 동일하게 등록)
- Backend: Supabase (`supabase/migrations/0001_init.sql`, `supabase/storage-policies.sql` 적용)
```

- [ ] **Step 2: 커밋**

```powershell
git add README.md
git commit -m "docs: README with setup, env, test, deploy notes"
```

- [ ] **Step 3: Vercel 배포 안내 (사용자 작업)**

사용자에게 다음을 안내한다:

1. GitHub에 저장소 push
2. https://vercel.com 에서 Import → 저장소 선택
3. Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록
4. Deploy 클릭
5. 배포 후 폰에서 URL 접속 → 홈 화면에 추가

---

## 완료 기준

스펙(`docs/superpowers/specs/2026-05-07-grappleguide-design.md`) 대비 완료 항목:

- [x] 메인 그리드 + 필터 (Task 11–13)
- [x] URL ↔ 필터 동기화, 삼분/이분값 (Task 7, 12)
- [x] 카드 추가/수정/삭제 (Task 15, 16)
- [x] 이미지 압축 + Supabase Storage 업로드 (Task 8, 15)
- [x] 즐겨찾기 / 익힘 토글 + optimistic update (Task 7, 11)
- [x] 즐겨찾기 / 익힘 모음 페이지 (Task 17)
- [x] 마크다운 디테일 (Task 16)
- [x] 단일 계정 로그인 + 미들웨어 가드 (Task 14)
- [x] RLS + Storage 정책 (Task 4)
- [x] Vitest 단위 / Playwright E2E (Task 6, 19, 20)
- [x] 에러 바운더리 (Task 18)
- [x] Vercel 배포 안내 (Task 22)

스펙의 "범위 외" 항목(영상, 다중 이미지, PWA 등)은 의도적으로 구현하지 않음.
