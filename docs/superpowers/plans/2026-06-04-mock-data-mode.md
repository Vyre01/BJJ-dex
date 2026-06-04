# Mock Data Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플래그로 켜지는 mock 데이터 레이어를 추가해, Supabase 없이도 14개 seed 기술로 앱 전체(목록/상세/필터/토글/추가/수정/삭제)가 인터랙티브하게 동작하게 한다.

**Architecture:** `lib/mock/` 에 `flag`(모드 판정) · `seed`(초기 데이터) · `store`(세션 가변 상태) · `user`(가짜 유저)를 둔다. Supabase 를 호출하는 7개 지점 최상단에 `if (isMockMode())` 조기 분기를 얹어 mock store/유저로 위임하고, 기존 Supabase 코드는 분기 아래 그대로 둔다. 변경은 in-memory(새로고침 시 seed 복귀), 이미지는 로컬 `/public/mock/` SVG.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, @tanstack/react-query 5, Vitest 4 (node env), TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-06-04-mock-data-mode-design.md`

**Next.js 16 / Tailwind v4 caveat:** 이 코드베이스는 학습 데이터와 다를 수 있다. `AGENTS.md` 지침대로 새 API 사용 전 `node_modules/next/dist/docs/` 를 확인한다. 단, 이 plan 은 기존 패턴(React Query 훅, next/image, 'use client')만 사용하고 새 Next API 는 도입하지 않는다.

---

## File Structure

**Created:**
- `lib/mock/flag.ts` — `isMockMode(): boolean`. mock 모드 단일 판정.
- `lib/mock/seed.ts` — `SEED_TECHNIQUES: Technique[]`. 14개 불변 원본 데이터.
- `lib/mock/store.ts` — 세션 가변 상태 + CRUD 접근 함수.
- `lib/mock/user.ts` — `MOCK_USER`. AuthProvider 용 가짜 유저.
- `public/mock/card-1.svg` ~ `public/mock/card-8.svg` — arctic 팔레트 SVG placeholder 이미지 8장.
- `tests/unit/mock-flag.test.ts` — `isMockMode()` env 분기 테스트.
- `tests/unit/mock-store.test.ts` — store CRUD + 불변성 테스트.
- `tests/unit/mock-seed.test.ts` — seed 가 필터 UI 를 비우지 않는지 스모크 테스트.

**Modified (7 seams):**
- `lib/queries.ts` — 4개 훅(useTechniques/useTechnique/useToggleFlag/useDeleteTechnique)에 mock 분기.
- `components/AuthProvider.tsx` — mock 분기로 즉시 로그인.
- `lib/image.ts` — `publicImageUrl` 패스스루 분기.
- `components/SafeImage.tsx` — mock 모드 `unoptimized`.
- `components/TechniqueForm.tsx` — `onSubmit` mock 분기(store upsert).
- `app/cards/[id]/page.tsx` — `deleteImage` 호출 mock 스킵.

**Total: 4 modules + 8 assets + 3 tests created, 6 files modified.**

---

## Task 1: `lib/mock/flag.ts` — mock 모드 판정

**Files:**
- Create: `lib/mock/flag.ts`
- Test: `tests/unit/mock-flag.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/unit/mock-flag.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';

const ORIG = {
  use: process.env.NEXT_PUBLIC_USE_MOCK,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_USE_MOCK = ORIG.use;
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIG.url;
});

describe('isMockMode', () => {
  it('NEXT_PUBLIC_USE_MOCK=true 면 true', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = 'true';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://real.supabase.co';
    const { isMockMode } = await import('@/lib/mock/flag');
    expect(isMockMode()).toBe(true);
  });

  it('SUPABASE_URL 이 없으면 true', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    const { isMockMode } = await import('@/lib/mock/flag');
    expect(isMockMode()).toBe(true);
  });

  it('SUPABASE_URL 있고 플래그 없으면 false (실 DB)', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://real.supabase.co';
    const { isMockMode } = await import('@/lib/mock/flag');
    expect(isMockMode()).toBe(false);
  });
});
```

> `isMockMode()` 는 호출 시점에 `process.env` 를 읽으므로(모듈 로드 시점이 아니라) 테스트에서 env 를 바꿔 검증할 수 있다. 동적 `import()` 로 가져온다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- mock-flag`
Expected: FAIL — `Cannot find module '@/lib/mock/flag'`.

- [ ] **Step 3: 구현**

Create `lib/mock/flag.ts`:

```ts
/**
 * mock 데이터 모드 판정 (단일 진실).
 * - NEXT_PUBLIC_USE_MOCK === 'true' → 강제 mock
 * - NEXT_PUBLIC_SUPABASE_URL 부재/빈값 → mock (DB 연결 전)
 * - 그 외 → 실 DB
 */
export function isMockMode(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return true;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true;
  return false;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- mock-flag`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/mock/flag.ts tests/unit/mock-flag.test.ts
git commit -m "feat(mock): add isMockMode flag

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `public/mock/` SVG 이미지 8장

**Files:**
- Create: `public/mock/card-1.svg` ~ `public/mock/card-8.svg`

테스트 없는 정적 에셋. 각 파일은 200×200 viewBox 의 linear-gradient 사각형 + 옅은 "GG" 워터마크. arctic 팔레트(slate/sky/teal)로 8가지 색 조합.

- [ ] **Step 1: 8개 SVG 파일 생성**

각 파일은 아래 템플릿에서 `STOP1`/`STOP2`(그라데이션 두 색)와 `ID`(gradient id) 만 다르다. `ID` 는 파일마다 고유해야 한다(`g1`~`g8`).

템플릿:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="ID" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="STOP1"/>
      <stop offset="100%" stop-color="STOP2"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#ID)"/>
  <circle cx="150" cy="55" r="60" fill="#ffffff" opacity="0.06"/>
  <circle cx="45" cy="160" r="40" fill="#ffffff" opacity="0.05"/>
  <text x="100" y="115" font-family="Arial, sans-serif" font-size="64" font-weight="700"
        fill="#ffffff" opacity="0.14" text-anchor="middle" letter-spacing="-3">GG</text>
</svg>
```

각 파일의 값:

| 파일 | ID | STOP1 | STOP2 |
|---|---|---|---|
| `public/mock/card-1.svg` | `g1` | `#1e293b` | `#334155` |
| `public/mock/card-2.svg` | `g2` | `#0ea5e9` | `#0284c7` |
| `public/mock/card-3.svg` | `g3` | `#0d9488` | `#0f766e` |
| `public/mock/card-4.svg` | `g4` | `#334155` | `#0ea5e9` |
| `public/mock/card-5.svg` | `g5` | `#475569` | `#94a3b8` |
| `public/mock/card-6.svg` | `g6` | `#0c4a6e` | `#0ea5e9` |
| `public/mock/card-7.svg` | `g7` | `#134e4a` | `#14b8a6` |
| `public/mock/card-8.svg` | `g8` | `#1e293b` | `#0d9488` |

예시 — `public/mock/card-1.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#g1)"/>
  <circle cx="150" cy="55" r="60" fill="#ffffff" opacity="0.06"/>
  <circle cx="45" cy="160" r="40" fill="#ffffff" opacity="0.05"/>
  <text x="100" y="115" font-family="Arial, sans-serif" font-size="64" font-weight="700"
        fill="#ffffff" opacity="0.14" text-anchor="middle" letter-spacing="-3">GG</text>
</svg>
```

나머지 7개도 동일 구조에 표의 `ID`/`STOP1`/`STOP2` 만 치환하여 생성한다.

- [ ] **Step 2: 파일 존재 확인**

Run: `ls public/mock/`
Expected: `card-1.svg card-2.svg card-3.svg card-4.svg card-5.svg card-6.svg card-7.svg card-8.svg` (8개).

- [ ] **Step 3: 커밋**

```bash
git add public/mock/
git commit -m "feat(mock): add 8 arctic-palette SVG placeholder images

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `lib/mock/seed.ts` — 14개 seed 기술

**Files:**
- Create: `lib/mock/seed.ts`
- Test: `tests/unit/mock-seed.test.ts`

- [ ] **Step 1: 실패 테스트(스모크) 작성**

Create `tests/unit/mock-seed.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SEED_TECHNIQUES } from '@/lib/mock/seed';
import { filterTechniques } from '@/lib/filters';
import { POSITIONS, CATEGORIES } from '@/lib/constants';

describe('SEED_TECHNIQUES', () => {
  it('14개', () => {
    expect(SEED_TECHNIQUES).toHaveLength(14);
  });

  it('id 가 모두 고유', () => {
    const ids = SEED_TECHNIQUES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('난이도 1~5 가 모두 등장', () => {
    const diffs = new Set(SEED_TECHNIQUES.map((t) => t.difficulty));
    expect([1, 2, 3, 4, 5].every((d) => diffs.has(d as 1 | 2 | 3 | 4 | 5))).toBe(true);
  });

  it('즐겨찾기/익힘/이미지/디테일 상태가 혼재', () => {
    expect(SEED_TECHNIQUES.some((t) => t.is_favorite)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => !t.is_favorite)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.is_learned)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => !t.is_learned)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.image_path !== null)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.image_path === null)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.details !== null)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.details === null)).toBe(true);
  });

  it('position/category 값이 모두 유효(constants 내)', () => {
    for (const t of SEED_TECHNIQUES) {
      expect(POSITIONS).toContain(t.position);
      expect(CATEGORIES).toContain(t.category);
    }
  });

  it('즐겨찾기 필터가 비어있지 않음', () => {
    expect(filterTechniques(SEED_TECHNIQUES, { fav: true }).length).toBeGreaterThan(0);
  });

  it('익힘 필터가 비어있지 않음', () => {
    expect(filterTechniques(SEED_TECHNIQUES, { learned: true }).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- mock-seed`
Expected: FAIL — `Cannot find module '@/lib/mock/seed'`.

- [ ] **Step 3: 구현**

Create `lib/mock/seed.ts` with exactly this content:

```ts
import type { Technique } from '@/lib/types';

/**
 * mock 모드 초기 데이터 (불변 원본). store 가 이를 deep copy 하여 사용한다.
 * 모든 UI 상태(난이도 1~5, 즐겨찾기/익힘, 이미지 유무, 마크다운/짧은/없는 디테일,
 * 포지션·카테고리 분산)를 커버한다. created_at 은 내림차순 정렬이 자연스럽도록 구성.
 */
export const SEED_TECHNIQUES: Technique[] = [
  {
    id: 'mock-armbar',
    name: '암바',
    position: '클로즈드 가드',
    category: '서브미션',
    difficulty: 2,
    details:
      '# 암바 (Armbar)\n\n클로즈드 가드에서 가장 기본이 되는 관절기.\n\n## 핵심 포인트\n\n- 상대 손목을 **가슴에 고정**한다\n- 엉덩이를 상대 어깨 쪽으로 회전\n- 다리로 머리와 팔을 압박\n\n## 디테일\n\n팔꿈치가 `엄지 방향`으로 향하도록 정렬해야 지렛대가 산다.',
    image_path: '/mock/card-1.svg',
    is_favorite: true,
    is_learned: true,
    created_at: '2026-05-20T09:00:00.000Z',
    updated_at: '2026-05-20T09:00:00.000Z',
  },
  {
    id: 'mock-triangle',
    name: '트라이앵글 초크',
    position: '클로즈드 가드',
    category: '서브미션',
    difficulty: 3,
    details:
      '# 트라이앵글 초크\n\n다리로 삼각형을 만들어 경동맥을 압박하는 조르기.\n\n## 순서\n\n1. 한 팔을 안으로, 한 팔을 밖으로 분리\n2. 다리를 상대 목과 한쪽 팔에 건다\n3. 정강이를 무릎 뒤에 걸고 **각도를 튼다**\n\n각도가 정면이면 잘 안 들어간다. 옆으로 빠져라.',
    image_path: '/mock/card-2.svg',
    is_favorite: true,
    is_learned: false,
    created_at: '2026-05-19T09:00:00.000Z',
    updated_at: '2026-05-19T09:00:00.000Z',
  },
  {
    id: 'mock-omoplata',
    name: '오모플라타',
    position: '오픈 가드',
    category: '서브미션',
    difficulty: 4,
    details: '어깨 관절을 다리로 압박하는 기술. 스윕으로도 전환 가능해 활용도가 높다.',
    image_path: '/mock/card-3.svg',
    is_favorite: false,
    is_learned: false,
    created_at: '2026-05-18T09:00:00.000Z',
    updated_at: '2026-05-18T09:00:00.000Z',
  },
  {
    id: 'mock-kimura',
    name: '기무라',
    position: '사이드 컨트롤',
    category: '서브미션',
    difficulty: 2,
    details: '양손으로 상대 손목과 자기 손목을 잡아 어깨를 비트는 figure-four 그립.',
    image_path: '/mock/card-4.svg',
    is_favorite: false,
    is_learned: true,
    created_at: '2026-05-17T09:00:00.000Z',
    updated_at: '2026-05-17T09:00:00.000Z',
  },
  {
    id: 'mock-scissor-sweep',
    name: '시저 스윕',
    position: '클로즈드 가드',
    category: '스윕',
    difficulty: 1,
    details:
      '# 시저 스윕\n\n가장 먼저 배우는 스윕 중 하나.\n\n## 메커니즘\n\n- 한 다리는 상대 **무릎 아래**, 한 다리는 엉덩이 높이\n- 가위질하듯 다리를 교차\n- 상대 균형을 대각선으로 무너뜨린다\n\n그립: 깃과 소매를 동시에 잡아 상체를 묶는다.',
    image_path: '/mock/card-5.svg',
    is_favorite: true,
    is_learned: true,
    created_at: '2026-05-16T09:00:00.000Z',
    updated_at: '2026-05-16T09:00:00.000Z',
  },
  {
    id: 'mock-hipbump-sweep',
    name: '힙 범프 스윕',
    position: '클로즈드 가드',
    category: '스윕',
    difficulty: 1,
    details: '상체를 일으켜 엉덩이로 밀어 넘기는 스윕. 키무라와 연계가 좋다.',
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '2026-05-15T09:00:00.000Z',
    updated_at: '2026-05-15T09:00:00.000Z',
  },
  {
    id: 'mock-double-leg',
    name: '더블 레그 테이크다운',
    position: '스탠딩',
    category: '테이크다운',
    difficulty: 3,
    details: '레슬링 기본 테이크다운. 레벨 체인지 후 두 다리를 안아 넘어뜨린다.',
    image_path: '/mock/card-6.svg',
    is_favorite: false,
    is_learned: false,
    created_at: '2026-05-14T09:00:00.000Z',
    updated_at: '2026-05-14T09:00:00.000Z',
  },
  {
    id: 'mock-toe-hold',
    name: '토 홀드',
    position: '오픈 가드',
    category: '서브미션',
    difficulty: 5,
    details:
      '# 토 홀드\n\n발목·발 관절을 비트는 리그락. **부상 위험이 높으니** 천천히.\n\n## 주의\n\n1. 발을 겨드랑이에 고정\n2. figure-four 그립으로 발등을 감싼다\n3. 손목을 말아 회전 — `급격한 토크 금지`\n\n경기 규정상 일부 단체에서는 금지된다.',
    image_path: '/mock/card-7.svg',
    is_favorite: true,
    is_learned: false,
    created_at: '2026-05-13T09:00:00.000Z',
    updated_at: '2026-05-13T09:00:00.000Z',
  },
  {
    id: 'mock-berimbolo',
    name: '베림볼로',
    position: '오픈 가드',
    category: '트랜지션',
    difficulty: 5,
    details: '데라히바 가드에서 구르며 백을 잡는 현대 주짓수의 상징적 무브.',
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '2026-05-12T09:00:00.000Z',
    updated_at: '2026-05-12T09:00:00.000Z',
  },
  {
    id: 'mock-knee-slice',
    name: '니 슬라이스 패스',
    position: '하프 가드',
    category: '패스',
    difficulty: 3,
    details: '무릎을 상대 허벅지 위로 미끄러뜨려 가드를 통과하는 기본 패스.',
    image_path: '/mock/card-8.svg',
    is_favorite: false,
    is_learned: true,
    created_at: '2026-05-11T09:00:00.000Z',
    updated_at: '2026-05-11T09:00:00.000Z',
  },
  {
    id: 'mock-back-take',
    name: '백 테이크',
    position: '터틀',
    category: '트랜지션',
    difficulty: 4,
    details: null,
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '2026-05-10T09:00:00.000Z',
    updated_at: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'mock-elbow-escape',
    name: '엘보 이스케이프',
    position: '마운트',
    category: '이스케이프',
    difficulty: 2,
    details: null,
    image_path: '/mock/card-1.svg',
    is_favorite: false,
    is_learned: true,
    created_at: '2026-05-09T09:00:00.000Z',
    updated_at: '2026-05-09T09:00:00.000Z',
  },
  {
    id: 'mock-darce',
    name: '다스 초크',
    position: '노스-사우스',
    category: '서브미션',
    difficulty: 4,
    details: null,
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '2026-05-08T09:00:00.000Z',
    updated_at: '2026-05-08T09:00:00.000Z',
  },
  {
    id: 'mock-guard-recovery',
    name: '가드 리커버리',
    position: '사이드 컨트롤',
    category: '가드 리커버리',
    difficulty: 3,
    details: null,
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '2026-05-07T09:00:00.000Z',
    updated_at: '2026-05-07T09:00:00.000Z',
  },
];
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- mock-seed`
Expected: PASS (7 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/mock/seed.ts tests/unit/mock-seed.test.ts
git commit -m "feat(mock): add 14 seed techniques covering all UI states

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `lib/mock/store.ts` — 세션 가변 store

**Files:**
- Create: `lib/mock/store.ts`
- Test: `tests/unit/mock-store.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/unit/mock-store.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Technique } from '@/lib/types';

// store 는 모듈 레벨 가변 상태라, 각 테스트마다 모듈을 리셋해 격리한다.
async function freshStore() {
  vi.resetModules();
  return import('@/lib/mock/store');
}

function newTech(over: Partial<Technique> = {}): Technique {
  return {
    id: 'new-1',
    name: '신규기술',
    position: '마운트',
    category: '서브미션',
    difficulty: 3,
    details: null,
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    ...over,
  };
}

describe('mock store', () => {
  let store: typeof import('@/lib/mock/store');

  beforeEach(async () => {
    store = await freshStore();
  });

  it('getAll 은 14개 seed 로 시작', () => {
    expect(store.getAll()).toHaveLength(14);
  });

  it('getAll 반환값을 변형해도 store 에 영향 없음(복사본)', () => {
    const list = store.getAll();
    list[0].name = '변형됨';
    expect(store.getAll()[0].name).not.toBe('변형됨');
  });

  it('getById 로 단건 조회, 없으면 undefined', () => {
    expect(store.getById('mock-armbar')?.name).toBe('암바');
    expect(store.getById('없는id')).toBeUndefined();
  });

  it('toggleFlag 가 해당 필드를 변경', () => {
    store.toggleFlag('mock-omoplata', 'is_favorite', true);
    expect(store.getById('mock-omoplata')?.is_favorite).toBe(true);
    store.toggleFlag('mock-omoplata', 'is_favorite', false);
    expect(store.getById('mock-omoplata')?.is_favorite).toBe(false);
  });

  it('upsert 가 신규를 맨 앞에 추가', () => {
    store.upsert(newTech({ id: 'new-1' }));
    const all = store.getAll();
    expect(all).toHaveLength(15);
    expect(all[0].id).toBe('new-1');
  });

  it('upsert 가 기존 id 를 갱신(개수 불변)', () => {
    store.upsert(newTech({ id: 'mock-armbar', name: '암바수정' }));
    expect(store.getAll()).toHaveLength(14);
    expect(store.getById('mock-armbar')?.name).toBe('암바수정');
  });

  it('remove 가 해당 id 를 삭제', () => {
    store.remove('mock-armbar');
    expect(store.getAll()).toHaveLength(13);
    expect(store.getById('mock-armbar')).toBeUndefined();
  });

  it('toggleFlag 는 seed 원본을 변형하지 않음', async () => {
    store.toggleFlag('mock-omoplata', 'is_favorite', true);
    const { SEED_TECHNIQUES } = await import('@/lib/mock/seed');
    expect(SEED_TECHNIQUES.find((t) => t.id === 'mock-omoplata')?.is_favorite).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- mock-store`
Expected: FAIL — `Cannot find module '@/lib/mock/store'`.

- [ ] **Step 3: 구현**

Create `lib/mock/store.ts`:

```ts
import type { Technique } from '@/lib/types';
import { SEED_TECHNIQUES } from './seed';

// seed 의 deep copy. 전체 페이지 새로고침 시 모듈이 재평가되어 seed 로 복귀한다.
let techniques: Technique[] = SEED_TECHNIQUES.map((t) => ({ ...t }));

export function getAll(): Technique[] {
  return techniques.map((t) => ({ ...t }));
}

export function getById(id: string): Technique | undefined {
  const found = techniques.find((t) => t.id === id);
  return found ? { ...found } : undefined;
}

export function toggleFlag(
  id: string,
  field: 'is_favorite' | 'is_learned',
  value: boolean,
): void {
  techniques = techniques.map((t) => (t.id === id ? { ...t, [field]: value } : t));
}

export function upsert(t: Technique): void {
  const idx = techniques.findIndex((x) => x.id === t.id);
  if (idx >= 0) {
    techniques = techniques.map((x) => (x.id === t.id ? { ...t } : x));
  } else {
    techniques = [{ ...t }, ...techniques];
  }
}

export function remove(id: string): void {
  techniques = techniques.filter((t) => t.id !== id);
}
```

> seed 의 deep copy 와 모든 반환값 복사본 처리로 `SEED_TECHNIQUES` 원본 불변을 보장한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- mock-store`
Expected: PASS (8 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/mock/store.ts tests/unit/mock-store.test.ts
git commit -m "feat(mock): add in-memory technique store

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `lib/queries.ts` — 4개 훅에 mock 분기

**Files:**
- Modify: `lib/queries.ts`

검증: React Query 훅이라 node 단위 테스트 부적합. dev 서버 수동 확인으로 검증(Task 9). 이 task 는 mock store 위임 분기를 추가한다.

- [ ] **Step 1: import 추가**

`lib/queries.ts` 상단 import 블록에 추가:
```ts
import { isMockMode } from './mock/flag';
import * as mockStore from './mock/store';
```

- [ ] **Step 2: `useTechniques` queryFn 분기**

기존:
```ts
    queryFn: async (): Promise<Technique[]> => {
      const supabase = createClient();
```
변경:
```ts
    queryFn: async (): Promise<Technique[]> => {
      if (isMockMode()) return mockStore.getAll();
      const supabase = createClient();
```

- [ ] **Step 3: `useTechnique` queryFn 분기**

기존:
```ts
    queryFn: async (): Promise<Technique> => {
      const supabase = createClient();
```
변경:
```ts
    queryFn: async (): Promise<Technique> => {
      if (isMockMode()) {
        const t = mockStore.getById(id);
        if (!t) throw new Error('기술을 찾을 수 없습니다.');
        return t;
      }
      const supabase = createClient();
```

- [ ] **Step 4: `useToggleFlag` mutationFn 분기**

기존:
```ts
    mutationFn: async (vars: { id: string; field: 'is_favorite' | 'is_learned'; value: boolean }) => {
      const supabase = createClient();
```
변경:
```ts
    mutationFn: async (vars: { id: string; field: 'is_favorite' | 'is_learned'; value: boolean }) => {
      if (isMockMode()) {
        mockStore.toggleFlag(vars.id, vars.field, vars.value);
        return;
      }
      const supabase = createClient();
```

> `onMutate`/`onError`/`onSettled` 는 변경하지 않는다. onSettled 의 invalidate 가 queryFn 을 재실행 → store 갱신값을 다시 읽어 반영된다.

- [ ] **Step 5: `useDeleteTechnique` mutationFn 분기**

기존:
```ts
    mutationFn: async (id: string) => {
      const supabase = createClient();
```
변경:
```ts
    mutationFn: async (id: string) => {
      if (isMockMode()) {
        mockStore.remove(id);
        return;
      }
      const supabase = createClient();
```

- [ ] **Step 6: 타입/린트 확인**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 7: 커밋**

```bash
git add lib/queries.ts
git commit -m "feat(mock): wire mock store into react-query hooks

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `components/AuthProvider.tsx` + `lib/mock/user.ts` — mock 로그인

**Files:**
- Create: `lib/mock/user.ts`
- Modify: `components/AuthProvider.tsx`

- [ ] **Step 1: `lib/mock/user.ts` 생성**

```ts
import type { User } from '@supabase/supabase-js';

/**
 * mock 모드에서 AuthProvider 가 즉시 반환할 가짜 유저.
 * auth 게이트 컴포넌트는 user 존재 여부와 email 만 읽으므로 최소 필드만 채운다.
 */
export const MOCK_USER = {
  id: 'mock-user',
  email: 'designer@grappleguide.local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
} as unknown as User;
```

- [ ] **Step 2: `AuthProvider.tsx` import 추가**

`components/AuthProvider.tsx` 상단에 추가:
```ts
import { isMockMode } from '@/lib/mock/flag';
import { MOCK_USER } from '@/lib/mock/user';
```

- [ ] **Step 3: `useEffect` 최상단 분기 추가**

기존:
```ts
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
```
변경:
```ts
  useEffect(() => {
    if (isMockMode()) {
      setState({ user: MOCK_USER, loading: false });
      return;
    }
    const supabase = createClient();
    let mounted = true;
```

- [ ] **Step 4: 린트 확인**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: 커밋**

```bash
git add lib/mock/user.ts components/AuthProvider.tsx
git commit -m "feat(mock): always-logged-in auth in mock mode

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `lib/image.ts` + `components/SafeImage.tsx` — 이미지 패스스루

**Files:**
- Modify: `lib/image.ts`
- Modify: `components/SafeImage.tsx`

- [ ] **Step 1: `lib/image.ts` import 추가**

`lib/image.ts` 상단(기존 import 아래)에 추가:
```ts
import { isMockMode } from './mock/flag';
```

- [ ] **Step 2: `publicImageUrl` 분기 추가**

기존:
```ts
export function publicImageUrl(path: string): string {
  const supabase = createClient();
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
```
변경:
```ts
export function publicImageUrl(path: string): string {
  if (isMockMode()) return path;
  const supabase = createClient();
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
```

> seed 의 `/mock/*.svg` 와 신규 카드의 blob URL 을 변형 없이 통과시킨다.

- [ ] **Step 3: `components/SafeImage.tsx` import 추가**

`components/SafeImage.tsx` 상단에 추가:
```ts
import { isMockMode } from '@/lib/mock/flag';
```

- [ ] **Step 4: next/image 에 `unoptimized` 적용**

기존(파일 맨 끝의 return):
```tsx
  return <Image src={src} alt={alt} onError={() => setErrored(true)} {...rest} />;
```
변경:
```tsx
  return <Image src={src} alt={alt} onError={() => setErrored(true)} unoptimized={isMockMode()} {...rest} />;
```

> 로컬 SVG·blob·임의 URL 을 next.config 원격 도메인 설정 없이 렌더하기 위함. 실 DB 모드에선 `unoptimized={false}` 로 기존 동작 유지.

- [ ] **Step 5: 린트 확인**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: 커밋**

```bash
git add lib/image.ts components/SafeImage.tsx
git commit -m "feat(mock): pass-through image urls and unoptimized images in mock mode

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `components/TechniqueForm.tsx` + `app/cards/[id]/page.tsx` — 쓰기 분기

**Files:**
- Modify: `components/TechniqueForm.tsx`
- Modify: `app/cards/[id]/page.tsx`

- [ ] **Step 1: `TechniqueForm.tsx` import 추가**

`components/TechniqueForm.tsx` 상단에 추가:
```ts
import { isMockMode } from '@/lib/mock/flag';
import * as mockStore from '@/lib/mock/store';
```

> `Technique` 타입은 이 파일에서 이미 `import type { Technique, Position, Category, Difficulty } from '@/lib/types';` 로 가져오고 있다(이 파일 라인 9 부근). 따라서 `Technique` 는 추가 import 하지 않는다 — 중복 import 는 린트 에러를 낸다. 위 두 줄(`isMockMode`, `mockStore`)만 추가한다.

- [ ] **Step 2: `onSubmit` 에 mock 분기 추가**

기존 `onSubmit` 의 시작부:
```ts
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast('기술명을 입력하세요.', 'error');
      return;
    }
    setBusy(true);
    const supabase = createClient();
```
변경 — `setBusy(true);` 와 `const supabase = createClient();` 사이에 mock 분기 블록을 삽입:
```ts
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast('기술명을 입력하세요.', 'error');
      return;
    }
    setBusy(true);

    if (isMockMode()) {
      try {
        const id = initial?.id ?? crypto.randomUUID();
        const image_path =
          image.kind === 'new'
            ? image.previewUrl
            : image.kind === 'existing'
            ? initial?.image_path ?? null
            : null;
        const now = new Date().toISOString();
        const payload: Technique = {
          id,
          name: name.trim(),
          position,
          category,
          difficulty,
          details: details.trim() ? details : null,
          image_path,
          is_favorite: initial?.is_favorite ?? false,
          is_learned: initial?.is_learned ?? false,
          created_at: initial?.created_at ?? now,
          updated_at: now,
        };
        mockStore.upsert(payload);
        await qc.invalidateQueries({ queryKey: techniquesKey });
        toast(initial ? '수정됨' : '추가됨', 'success');
        router.push(initial ? `/cards/${id}` : '/');
        router.refresh();
      } finally {
        setBusy(false);
      }
      return;
    }

    const supabase = createClient();
```

> `image.previewUrl` 은 `ImageDraft` 의 `'new'` 변형이 가지는 blob URL(`ImageUploader.pick` 에서 생성). `'existing'` 은 기존 경로 유지, `'none'` 은 null.

- [ ] **Step 3: `app/cards/[id]/page.tsx` import 추가**

상단 import 에 추가:
```ts
import { isMockMode } from '@/lib/mock/flag';
```

- [ ] **Step 4: `deleteImage` 호출을 mock 모드에서 스킵**

기존 `onDelete` 안:
```ts
      if (t.image_path) {
        try { await deleteImage(t.image_path); } catch { /* 이미지 실패해도 레코드 삭제 진행 */ }
      }
```
변경:
```ts
      if (t.image_path && !isMockMode()) {
        try { await deleteImage(t.image_path); } catch { /* 이미지 실패해도 레코드 삭제 진행 */ }
      }
```

> 레코드 삭제(`del.mutateAsync`)는 mock 분기가 적용된 `useDeleteTechnique` 가 처리하므로 별도 변경 불필요.

- [ ] **Step 5: 린트 확인**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: 커밋**

```bash
git add components/TechniqueForm.tsx "app/cards/[id]/page.tsx"
git commit -m "feat(mock): write to mock store on create/edit/delete

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 최종 검증

**Files:** 코드 변경 없음. 전체 동작 검증.

- [ ] **Step 1: 단위 테스트 전체 통과**

Run: `npm run test`
Expected: 기존 filters 테스트 + 신규 mock-flag(3) + mock-seed(7) + mock-store(8) 전부 PASS.

- [ ] **Step 2: 린트 통과**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: mock 모드 진입 확인 (env 없이)**

`.env.local` 에 `NEXT_PUBLIC_SUPABASE_URL` 이 설정되어 있지 않은지 확인:
```bash
grep -r "NEXT_PUBLIC_SUPABASE_URL" .env.local .env 2>/dev/null || echo "no supabase env — mock mode active"
```
Expected: env 가 없으면 mock 모드. (있다면 `npm run dev` 실행 시 `NEXT_PUBLIC_USE_MOCK=true npm run dev` 로 강제하거나, 검증 동안 해당 env 를 주석 처리.)

- [ ] **Step 4: dev 서버 수동 검증**

Run: `npm run dev` (필요 시 `$env:NEXT_PUBLIC_USE_MOCK="true"; npm run dev` — PowerShell). `http://localhost:3000` 에서 확인:

| 검증 항목 | 기대 결과 |
|---|---|
| 홈 그리드 | 14개 카드, 이미지(9)/placeholder(5) 혼재 |
| 별/체크 토글 | 클릭 시 색 즉시 변화, 같은 세션 내 유지 |
| 새로고침 후 | 토글이 seed 상태로 복귀 |
| FAB → 카드 추가 | 폼 저장 후 그리드 맨 앞에 신규 카드 |
| 카드 수정 | 변경 내용 상세에 반영 |
| 카드 삭제 | 그리드/상세에서 사라짐 |
| 필터 (포지션/카테고리/난이도/즐겨찾기/익힘) | 실제 필터링, 조합 시 빈 결과도 정상 메시지 |
| 카드 상세 | 마크다운 카드(암바 등) 렌더 + 디테일 없는 카드(백 테이크 등) 정상 |
| 로그인 상태 | Header 에 로그아웃 버튼, FAB 노출 (항상 로그인) |

각 항목 확인 후 dev 서버 종료.

- [ ] **Step 5: 실 DB 경로 회귀 없음 확인 (정적)**

각 분기 파일에서 `if (isMockMode())` 아래의 기존 supabase 코드가 그대로인지 확인. mock 작업 시작 직전 커밋(이 plan 의 Task 1 직전 HEAD)을 base 로 diff 한다. base SHA 는 다음으로 구한다:
```bash
git log --oneline --all | grep "mock data mode" | head -1   # spec 커밋 등 mock 작업 시작 지점 확인
```
그 다음, 6개 수정 파일의 diff 를 확인:
```bash
git diff <mock 작업 시작 전 SHA>..HEAD -- lib/queries.ts components/AuthProvider.tsx lib/image.ts components/TechniqueForm.tsx "app/cards/[id]/page.tsx" components/SafeImage.tsx
```
Expected: 추가된 것은 import + `if (isMockMode()) { ... }` 블록뿐, 기존 supabase 라인은 삭제/수정되지 않음. (SHA 가 불확실하면, 6개 파일을 직접 읽어 각 분기 아래 supabase 코드가 원형 그대로인지 확인해도 된다.)

- [ ] **Step 6: (커밋 없음 — 검증 전용)**

모든 검증 통과 시 완료. 검증 중 수정이 필요했다면 해당 task 로 돌아가 고치고 별도 커밋.

---

## Summary checklist (acceptance)

- [ ] `lib/mock/` 에 flag/seed/store/user 4개 모듈
- [ ] `public/mock/` 에 SVG 8장
- [ ] 신규 단위 테스트 3종(flag/seed/store) 통과, 기존 테스트 회귀 없음
- [ ] 7개 seam(queries×4 훅, AuthProvider, image, SafeImage, TechniqueForm, card detail)에 mock 분기
- [ ] env 없이 `npm run dev` → 14개 카드로 채워진 인터랙티브 앱
- [ ] 토글/추가/수정/삭제 in-memory 동작, 새로고침 시 seed 복귀
- [ ] `npm run lint` 통과
- [ ] 실 DB 코드 경로 미변경 (분기 아래 그대로)
