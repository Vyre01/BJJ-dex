# Mock Data Mode — 디자인 스펙

**작성일:** 2026-06-04
**대상 프로젝트:** GrappleGuide (Next.js 16 + React 19 + Tailwind v4 + Supabase)
**상태:** 승인 대기

## 1. 배경 & 목적

DB(Supabase) 연결은 나중으로 미루고, **디자인을 먼저 잡기 위해** 앱을 mock 데이터로 채운다. 현재 모든 데이터/인증/이미지 흐름이 Supabase 에 묶여 있고, `createClient()` 는 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` env 를 요구한다(`!` 단언). env 가 없으면 클라이언트 생성 시점에 깨지므로, mock 모드는 **supabase 호출 앞단에서 조기 분기**하여 createClient 를 아예 호출하지 않아야 한다.

목표: 플래그 하나로 mock ↔ 실 DB 를 전환하고, Supabase 코드는 손대지 않으며, 나중에 `lib/mock/` 삭제 + 분기 제거로 흔적 없이 들어낼 수 있게 한다.

## 2. 브레인스토밍 합의 사항

| 항목 | 결정 |
|---|---|
| mock 성격 | 환경 플래그로 전환 (Supabase 코드 유지) |
| 이미지 | 일부 카드만 이미지, 일부는 placeholder |
| 이미지 소스 | 로컬 `/public/mock/` 번들 (외부 의존 없음, 오프라인 동작) |
| 상호작용 | 완전 인터랙티브 + 항상 로그인 상태. 변경은 in-memory, 새로고침 시 seed 복귀 |
| 구현 접근 | A — 기존 seam 앞단에 중앙화된 mock 레이어 |
| 범위 외 | 실 DB/스토리지 연결, 인증 플로우, 디자인 토큰 추가 변경 |

## 3. 모듈 구조 (`lib/mock/`)

| 파일 | 책임 | 공개 인터페이스 |
|---|---|---|
| `lib/mock/flag.ts` | mock 모드 판정 (단일 진실) | `isMockMode(): boolean` |
| `lib/mock/seed.ts` | 초기 mock 데이터 (불변 원본) | `SEED_TECHNIQUES: Technique[]` |
| `lib/mock/store.ts` | 세션 내 가변 상태 + 접근 함수 | `getAll()`, `getById(id)`, `toggleFlag(id, field, value)`, `upsert(t)`, `remove(id)` |
| `lib/mock/user.ts` | AuthProvider 용 가짜 유저 | `MOCK_USER` |

### 3.1 `flag.ts`

```ts
export function isMockMode(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return true;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true;
  return false;
}
```

판정 규칙:
- `NEXT_PUBLIC_USE_MOCK === 'true'` → 강제 mock
- `NEXT_PUBLIC_SUPABASE_URL` 부재/빈값 → mock (현재 상태, DB 나중에 → `npm run dev` 만으로 mock 진입)
- supabase url 있고 플래그 없음 → 실 DB (기존 코드 그대로)

> `NEXT_PUBLIC_*` env 는 빌드 시점에 클라이언트 번들로 인라인된다. `isMockMode()` 는 클라이언트/서버 양쪽에서 안전하게 호출 가능.

### 3.2 `store.ts`

모듈 레벨 가변 배열을 `SEED_TECHNIQUES` 의 deep copy 로 초기화한다. 전체 페이지 새로고침 시 JS 모듈이 재평가되어 자동으로 seed 상태로 복귀한다(별도 reset 함수 불필요).

```ts
import type { Technique } from '@/lib/types';
import { SEED_TECHNIQUES } from './seed';

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
  if (idx >= 0) techniques[idx] = { ...t };
  else techniques = [t, ...techniques];
}

export function remove(id: string): void {
  techniques = techniques.filter((t) => t.id !== id);
}
```

- 반환값은 항상 얕은 복사본으로 주어 호출자가 store 내부를 직접 변형하지 못하게 한다.
- `upsert` 의 신규 삽입은 배열 맨 앞에 추가하여 `created_at` 내림차순 정렬과 일관되게 최신 카드가 위로 오게 한다.

### 3.3 `user.ts`

```ts
import type { User } from '@supabase/supabase-js';

export const MOCK_USER = {
  id: 'mock-user',
  email: 'designer@grappleguide.local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
} as unknown as User;
```

`User` 타입의 전체 필드를 채우지 않고 `as unknown as User` 로 캐스팅한다. AuthProvider 와 auth 게이트 컴포넌트는 `user` 의 존재 여부와 `email` 만 읽으므로 충분하다.

## 4. 분기점 (7개 파일)

각 supabase 호출 지점 최상단에 `if (isMockMode())` 조기 분기를 둔다. 기존 supabase 코드는 분기 아래에 그대로 유지한다.

### 4.1 `lib/queries.ts` — 4개 훅

**`useTechniques`** queryFn 최상단:
```ts
queryFn: async (): Promise<Technique[]> => {
  if (isMockMode()) return mockStore.getAll();
  const supabase = createClient();
  // ...기존 코드 유지
}
```

**`useTechnique`** queryFn 최상단:
```ts
queryFn: async (): Promise<Technique> => {
  if (isMockMode()) {
    const t = mockStore.getById(id);
    if (!t) throw new Error('기술을 찾을 수 없습니다.');
    return t;
  }
  const supabase = createClient();
  // ...기존 코드 유지
}
```

**`useToggleFlag`** mutationFn 최상단:
```ts
mutationFn: async (vars) => {
  if (isMockMode()) {
    mockStore.toggleFlag(vars.id, vars.field, vars.value);
    return;
  }
  const supabase = createClient();
  // ...기존 코드 유지
}
```
기존 `onMutate`(optimistic update) / `onError`(rollback) / `onSettled`(invalidate) 는 변경하지 않는다. mock 에서도 onSettled 의 invalidate 가 queryFn 을 재실행 → store 의 갱신값을 다시 읽어 반영된다.

**`useDeleteTechnique`** mutationFn 최상단:
```ts
mutationFn: async (id: string) => {
  if (isMockMode()) {
    mockStore.remove(id);
    return;
  }
  const supabase = createClient();
  // ...기존 코드 유지
}
```

### 4.2 `components/AuthProvider.tsx`

`useEffect` 최상단에서 mock 분기:
```ts
useEffect(() => {
  if (isMockMode()) {
    setState({ user: MOCK_USER, loading: false });
    return;
  }
  const supabase = createClient();
  // ...기존 코드 유지
}, []);
```
mock 모드에선 supabase 를 접촉하지 않고 즉시 로그인 상태가 된다 → Header 의 로그아웃 버튼, FAB, 카드 상세의 수정/삭제 버튼이 모두 노출된다.

### 4.3 `components/TechniqueForm.tsx` — onSubmit

`onSubmit` 의 `setBusy(true)` 직후, supabase 로직 앞에서 mock 분기. 구현 핵심:
- `id`, `name`, `position`, `category`, `difficulty`, `details` 는 실제 폼 값으로 `Technique` 객체 구성.
- 이미지 `image_path`:
  - `image.kind === 'new'` → `image.previewUrl` (blob URL) 사용. 세션 내에서 선택한 이미지가 보인다.
  - `image.kind === 'existing'` → 기존 `initial.image_path` 유지.
  - `image.kind === 'none'` → `null`.
- `is_favorite` / `is_learned` 는 수정 시 `initial` 값 유지, 신규는 `false`.
- `created_at` / `updated_at` 은 신규 시 고정 ISO 문자열(예: seed 와 구분되는 큰 값) 사용. `Date.now()`/`new Date()` 사용 가능(런타임 클라이언트 코드이므로 워크플로 제약과 무관) — 신규 카드가 맨 앞에 오도록 store.upsert 가 처리하므로 정렬 정확도는 부차적.
- 스토리지 업로드(`supabase.storage`) 는 스킵.
- `mockStore.upsert(payload)` 후 `qc.invalidateQueries({ queryKey: techniquesKey })`, toast, `router.push`, `router.refresh()` 는 기존과 동일.

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

  // ...기존 supabase 코드 유지
}
```

### 4.4 `lib/image.ts` — `publicImageUrl`

최상단 패스스루:
```ts
export function publicImageUrl(path: string): string {
  if (isMockMode()) return path;
  const supabase = createClient();
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
```
seed 의 `/mock/xxx.svg` 로컬 경로와 신규 카드의 blob URL 을 변형 없이 통과시킨다. 실 DB 모드에선 기존 동작 유지.

### 4.5 `app/cards/[id]/page.tsx` — `deleteImage` 호출

`onDelete` 안의 이미지 삭제는 이미 `try/catch` 로 감싸져 있다. mock 모드에선 `deleteImage` 호출 자체를 건너뛴다:
```ts
if (t.image_path && !isMockMode()) {
  try { await deleteImage(t.image_path); } catch { /* ... */ }
}
```
레코드 삭제(`del.mutateAsync`)는 mock 분기가 적용된 `useDeleteTechnique` 가 처리하므로 별도 변경 불필요.

### 4.6 `components/SafeImage.tsx` — mock 모드 unoptimized

next/image 가 로컬 SVG·blob·임의 URL 을 설정 없이 렌더하도록, mock 모드에서 `unoptimized` 를 적용한다:
```tsx
return <Image src={src} alt={alt} onError={() => setErrored(true)} unoptimized={isMockMode()} {...rest} />;
```
디자인 전용 분기이며 실 DB 모드 동작에는 영향이 없다.

## 5. seed 데이터 (`seed.ts`)

UI 의 모든 상태를 한 화면에서 검증할 수 있도록 **14개** 기술을 구성한다.

### 5.1 상태 커버리지

- **난이도**: 1~5 전부 등장 (별 0~5칸)
- **즐겨찾기**: 약 4개 `is_favorite: true`
- **익힘**: 약 4개 `is_learned: true` (일부는 즐겨찾기+익힘 동시)
- **이미지**: 9개는 로컬 SVG (`/mock/*.svg`), 5개는 `image_path: null` (placeholder 상태)
- **details (마크다운)**:
  - 약 4개: 풍부한 마크다운 (h1/h2, ul/ol, `code`, **bold**) — 카드 상세의 모든 마크다운 스타일 검증
  - 약 6개: 짧은 1~2문단
  - 약 4개: `details: null` — 디테일 없는 상세 페이지
- **포지션/카테고리**: `POSITIONS`·`CATEGORIES` 전반에 분산 (FilterBar 필터링 실제 동작 보장)
- **created_at**: 시간차를 둔 ISO 문자열 (내림차순 정렬이 자연스럽게)

### 5.2 기술 목록 (실제 BJJ 기술, 한국어)

암바, 트라이앵글 초크, 오모플라타, 기무라, 시저 스윕, 힙 범프 스윕, 더블 레그 테이크다운, 토 홀드, 베림볼로, 니 슬라이스 패스, 백 테이크, 엘보 이스케이프, 다스 초크, 가드 리커버리.

각 기술의 `position`/`category`/`difficulty` 는 BJJ 도메인상 자연스럽게 매핑하되, 5.1 의 분포를 만족하도록 배정한다. `id` 는 고정 문자열(예: `'mock-armbar'`)로 부여하여 상세 페이지 라우팅이 안정적이게 한다.

### 5.3 로컬 이미지 (`/public/mock/`)

arctic 팔레트(slate/sky/teal) 톤의 SVG placeholder **6~8장**을 생성하여 커밋한다. 9개 이미지 카드가 이들을 재사용한다.

- 오프라인 동작, 외부 의존 없음
- next/image 원격 도메인 설정 불필요 (mock 모드 `unoptimized` 로 SVG 직접 렌더)
- 파일명 예: `/public/mock/card-1.svg` ~ `card-8.svg`. 각기 다른 그라데이션/패턴으로 그리드가 단조롭지 않게.

## 6. 테스트

- **`lib/mock/store.ts`** — vitest 단위 테스트: `getAll/getById/toggleFlag/upsert/remove` 동작 + "원본 seed 불변(deep copy)" 검증. 기존 `tests/unit/filters.test.ts` 패턴 준용.
- **`lib/mock/flag.ts`** — `isMockMode()` env 조합별 분기(플래그 true / supabase url 부재 / 실 DB) 단위 테스트. `process.env` 를 테스트 내에서 임시 설정/복원.
- **seed 스모크** — `filterTechniques(SEED_TECHNIQUES, f)` 가 주요 필터(각 position/category, 난이도, fav, learned)에서 비어있지 않은 결과를 내는지 확인 (디자인 중 빈 화면 방지).
- **분기점(훅/AuthProvider/Form)** — 통합 동작이므로 단위 테스트 대신 dev 서버 수동 확인으로 검증.

## 7. 검증 기준

- [ ] env 없이 `npm run dev` → 홈 그리드에 14개 카드, 이미지/placeholder 혼재
- [ ] 별·체크 토글 시 색이 즉시 변하고 세션 내 유지, 새로고침 시 seed 로 복귀
- [ ] FAB → 카드 추가 → 그리드에 최신 카드가 맨 앞에 반영
- [ ] 카드 수정·삭제 동작
- [ ] 필터(포지션/카테고리/난이도/즐겨찾기/익힘) 실제 작동, 조합 시 빈 결과도 정상 표시
- [ ] 카드 상세에서 마크다운 렌더 정상 + 디테일 없는 카드도 정상
- [ ] 이미지 카드/placeholder 카드 모두 의도대로 렌더
- [ ] `npm run test` 통과 (신규 store/flag 테스트 포함)
- [ ] `npm run lint` 통과
- [ ] supabase 코드 경로 미변경 — 실 DB 분기 회귀 없음 (분기 아래 코드 그대로)

## 8. 범위 외

- 실제 Supabase DB/스토리지 연결
- 인증 플로우 (mock 은 항상 로그인; 로그인 페이지 자체는 변경하지 않음)
- 디자인 토큰/색 추가 변경 (별도 작업으로 완료됨)
- next.config 원격 이미지 도메인 설정 (전부 로컬이라 불필요)

## 9. 제거 가이드 (나중에 DB 붙일 때)

1. `lib/mock/` 디렉터리 삭제
2. 7개 분기점에서 `if (isMockMode())` 블록 제거 (분기 아래 supabase 코드만 남김)
3. `SafeImage` 의 `unoptimized={isMockMode()}` 제거
4. `/public/mock/` SVG 삭제
5. mock 관련 단위 테스트 삭제
6. `.env` 에 supabase env 설정
