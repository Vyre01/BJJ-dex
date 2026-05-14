# GrappleGuide 설계서

- 작성일: 2026-05-07
- 상태: 승인됨 (사용자 사전 승인)

## 개요

주짓수 기술을 카드 형태로 정리하고 폰(체육관) 및 PC에서 열람·편집할 수 있는 1인용 웹 앱.

## 요구사항 요약

- 사용자: 본인 1인 (타인 가입 불가)
- 사용 환경: 폰 메인(체육관), PC 보조
- 규모: 약 50장 카드
- 미디어: 사진만 (영상은 추후 단계)
- 편집: 폰·PC 양쪽
- UI 언어: 한국어
- 카드 속성:
  - 기술명 (텍스트)
  - 포지션 (드롭다운 선택)
  - 카테고리 (드롭다운 선택)
  - 난이도 (★ 1–5)
  - 디테일 (자유 텍스트, 마크다운)
  - 이미지 (1장)
  - 즐겨찾기 (불리언)
  - 익힘 (불리언)

## 1. 아키텍처

```
[ 폰/PC 브라우저 ]
       │
       ▼
[ Next.js (Vercel) ]
   ├─ App Router, SSR/CSR 혼합
   ├─ Tailwind, 모바일 우선 반응형
   └─ Supabase JS SDK 직접 호출
       │
       ▼
[ Supabase ]
   ├─ Postgres: techniques 테이블
   ├─ Storage: bucket "technique-images" (공개 읽기 / 인증 쓰기)
   └─ Auth: 이메일+비밀번호 단일 계정 (신규 가입 비활성화)
```

핵심 결정:
- BFF 레이어 없음 — 1인 소형 앱이라 클라이언트에서 Supabase 직접 호출
- RLS로 쓰기 권한 보호 (anon 읽기 / authenticated 쓰기)
- 이미지 업로드는 브라우저 → Supabase Storage 직행
- 호스팅: Vercel(프론트) + Supabase(백엔드 풀매니지드), 둘 다 무료 티어

## 2. 데이터 모델

### 2.1 `techniques` 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `name` | text | NOT NULL | 기술명 |
| `position` | text | NOT NULL | 포지션 enum 값 |
| `category` | text | NOT NULL | 카테고리 enum 값 |
| `difficulty` | int2 | NOT NULL, CHECK 1..5 | 별점 |
| `details` | text | nullable | 디테일(마크다운) |
| `image_path` | text | nullable | Storage 안 경로 |
| `is_favorite` | boolean | NOT NULL DEFAULT false | 즐겨찾기 |
| `is_learned` | boolean | NOT NULL DEFAULT false | 익힘 |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | 트리거로 자동 갱신 |

인덱스:
- `(position)`, `(category)`, `(difficulty)` — 클라이언트 필터링이지만 향후 서버 필터로 옮길 때 대비
- `(is_favorite) WHERE is_favorite`, `(is_learned) WHERE is_learned` — 부분 인덱스

### 2.2 코드 측 상수 (lib/constants.ts)

```ts
export const POSITIONS = [
  '가드', '클로즈드 가드', '오픈 가드', '하프 가드',
  '마운트', '사이드 컨트롤', '백', '노스-사우스', '터틀', '스탠딩',
] as const;

export const CATEGORIES = [
  '서브미션', '스윕', '패스', '이스케이프',
  '가드 리커버리', '테이크다운', '트랜지션',
] as const;
```

DB enum이 아니라 텍스트 + 코드 상수로 둔 이유: 50장 규모에서 별도 enum 타입은 과함. 추가/변경 시 상수 한 줄 수정.

### 2.3 Storage

- Bucket: `technique-images`
- 경로 규약: `{technique_id}.{ext}` (jpg/webp만 허용)
- 공개 읽기 정책: 누구나 URL로 이미지 조회 가능
- 쓰기 정책: authenticated 역할만 INSERT/UPDATE/DELETE

### 2.4 RLS 정책

```sql
-- techniques
ALTER TABLE techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read"
  ON techniques FOR SELECT
  USING (true);

CREATE POLICY "authenticated can write"
  ON techniques FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
```

## 3. 페이지 / 라우팅

| 경로 | 설명 | 인증 |
|---|---|---|
| `/` | 메인 그리드 + 필터 | 익명 OK |
| `/cards/[id]` | 카드 상세 | 익명 OK |
| `/cards/new` | 카드 추가 폼 | 필수 |
| `/cards/[id]/edit` | 카드 수정 폼 | 필수 |
| `/learned` | 익힌 기술 모음 | 익명 OK |
| `/favorites` | 즐겨찾기 모음 | 익명 OK (단, 토글은 로그인 시) |
| `/login` | 로그인 | — |

### 3.1 메인 화면 레이아웃 (모바일 우선)

```
┌──────────────────────────┐
│ GrappleGuide        ⚙ 🔑 │  ← 헤더 sticky
├──────────────────────────┤
│ 🔍 검색...                │
│ [포지션▾][카테고리▾][★▾] │  ← 필터 바, 가로 스크롤
│ [☆즐겨찾기][✓익힘][초기화]│
├──────────────────────────┤
│ ┌────┐ ┌────┐            │
│ │이미지│ │이미지│  ← 모바일 2열
│ │ ★★★│ │ ★★★│   데스크톱 4열
│ │이름 │ │이름 │
│ └────┘ └────┘            │
│ ...                      │
│                       ⊕  │  ← FAB 추가 버튼(인증 시만)
└──────────────────────────┘
```

## 4. 컴포넌트 구조

- `TechniqueCard` — 그리드 셀, 썸네일·이름·별점·뱃지(★, ✓)
- `TechniqueDetail` — 상세 뷰
- `TechniqueForm` — 추가/수정 공용 폼
- `FilterBar` — 필터 칩 + 검색 + URL 동기화
- `ImageUploader` — 파일 선택, 압축, Storage 업로드
- `StarRating` — 별점 입력/표시
- `Toast` — 에러/성공 알림

## 5. 데이터 흐름

### 5.1 카드 추가

1. 폼 입력 + 이미지 선택
2. 클라이언트에서 이미지 검증(< 5MB) + WebP 변환 (`browser-image-compression`)
3. `crypto.randomUUID()`로 임시 ID 생성 → Storage `{id}.webp` 업로드
4. `techniques` INSERT (image_path 포함)
5. React Query 캐시 무효화 → 메인 그리드 자동 갱신
6. `/`로 리다이렉트, 토스트 "추가됨"

### 5.2 카드 목록

- 클라이언트에서 React Query `useQuery(['techniques'])`로 전체 fetch
- 50장 전부 메모리에 두고 `filterTechniques(list, filters)` 순수 함수로 필터링
- 페이지네이션·서버 필터링 없음 (YAGNI)

### 5.3 토글 (즐겨찾기/익힘)

- 카드의 ★/✓ 버튼 클릭
- React Query `setQueryData`로 optimistic update
- Supabase UPDATE
- 실패 시 캐시 롤백 + 에러 토스트

## 6. 인증

- Supabase Auth, 이메일+비밀번호
- 본인 계정 1개를 Supabase 대시보드에서 사전 생성
- "Disable signups" 옵션으로 신규 가입 차단
- `middleware.ts`에서 `/cards/new`, `/cards/*/edit` 인증 검사 → 미인증 시 `/login`
- 메인·상세·즐겨찾기·익힘 페이지는 익명 접근 허용
- 토글 버튼은 인증 시에만 활성

## 7. 필터링 UX

- 모든 필터 상태는 URL 쿼리스트링과 양방향 동기화
- 쿼리 키:
  - `q` — 기술명 검색(부분 일치, 대소문자 무시)
  - `position` — 단일 선택
  - `category` — 단일 선택
  - `difficulty` — 정수 1..5 (이상 필터)
  - `fav` — `1`이면 즐겨찾기만, 미지정이면 전체 (이분값)
  - `learned` — `1`이면 익힘만, `0`이면 미익힘만, 미지정이면 전체 (삼분값)
- `learned`만 삼분값인 이유: "아직 안 익힌 것만 보기"가 학습 동기 면에서 유용한 뷰이기 때문. 즐겨찾기는 그런 반대 뷰가 의미 없어 이분값으로 둠.
- 예: `/?category=서브미션&difficulty=3&fav=1`
- 필터링은 클라이언트 메모리에서 수행 → 즉시 반영
- "초기화" 버튼으로 모든 필터 해제

## 8. 에러 처리

- Supabase 호출 실패 → 토스트 + 폼 상태 유지(데이터 손실 방지)
- 이미지 업로드 실패 → 폼 그대로, 재시도 버튼
- 네트워크 끊김 → React Query 자동 재시도, 마지막 캐시로 표시
- App Router `error.tsx`로 라우트 레벨 미처리 에러 캐치
- 하드 손상(예: 잘못된 image_path) → 카드에 placeholder 이미지 표시, 콘솔 경고

## 9. 테스트 전략

규모와 1인 앱 특성상 핵심 플로우만 검증:

- **Playwright E2E**:
  1. 로그인 → 카드 추가(이미지 포함) → 목록에 표시
  2. 필터 적용 → URL 반영 → 결과 일치
  3. 즐겨찾기 토글 → 새로고침 후 유지
  4. 비인증 사용자가 `/cards/new` 접근 → `/login` 리다이렉트
- **단위 테스트(Vitest)**:
  - `filterTechniques(list, filters)` 순수 함수만 — 모든 필터 조합 검증
- 컴포넌트 스냅샷·시각 회귀 테스트 없음

## 10. 프로젝트 구조

```
GrappleGuide/
├─ app/
│  ├─ (public)/page.tsx          메인 그리드
│  ├─ cards/
│  │  ├─ [id]/page.tsx
│  │  ├─ [id]/edit/page.tsx
│  │  └─ new/page.tsx
│  ├─ learned/page.tsx
│  ├─ favorites/page.tsx
│  ├─ login/page.tsx
│  ├─ layout.tsx
│  ├─ error.tsx
│  └─ globals.css
├─ components/
│  ├─ TechniqueCard.tsx
│  ├─ TechniqueDetail.tsx
│  ├─ TechniqueForm.tsx
│  ├─ FilterBar.tsx
│  ├─ ImageUploader.tsx
│  ├─ StarRating.tsx
│  └─ Toast.tsx
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts                브라우저용 클라이언트
│  │  └─ server.ts                서버 컴포넌트/미들웨어용
│  ├─ constants.ts                POSITIONS, CATEGORIES
│  ├─ filters.ts                  filterTechniques 순수 함수
│  ├─ types.ts                    Technique 타입
│  └─ image.ts                    압축·업로드 유틸
├─ supabase/
│  └─ migrations/
│     └─ 0001_init.sql            테이블 + RLS + 트리거
├─ tests/
│  ├─ e2e/
│  │  ├─ add-technique.spec.ts
│  │  ├─ filter.spec.ts
│  │  ├─ favorite.spec.ts
│  │  └─ auth-redirect.spec.ts
│  └─ unit/
│     └─ filters.test.ts
├─ middleware.ts
├─ next.config.js
├─ tailwind.config.ts
├─ package.json
└─ .env.local.example             SUPABASE_URL, SUPABASE_ANON_KEY
```

## 11. 배포

- **프론트**: Vercel에 GitHub 연결 자동 배포
- **백엔드**: Supabase 프로젝트 1개 (지역: Tokyo 또는 Seoul)
- 환경 변수:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 도메인: Vercel 기본 서브도메인 사용 (커스텀 도메인 추후)

## 12. 범위 외 (의도적 제외)

명시적으로 v1에서 제외하여 단순함을 유지:

- 영상 첨부
- 다중 이미지/갤러리
- 다중 사용자, 공유, 댓글
- 통계·진척도 그래프
- 오프라인 모드(PWA)
- 다국어
- 태그·커스텀 분류
- 카드 간 연관(콤비네이션, 흐름도)
- 데이터 백업/내보내기 기능 — Supabase 대시보드에서 직접 가능

## 13. 향후 확장 여지

설계가 막지 않는 추가 가능 항목:

- 영상: `image_path` 옆에 `video_path` 추가, 썸네일 자동 생성
- 태그: 별도 테이블 `technique_tags`
- 콤비네이션: `technique_relations(from_id, to_id, kind)` 테이블
- PWA: Next.js에 service worker 추가, Supabase 캐시 전략 필요
