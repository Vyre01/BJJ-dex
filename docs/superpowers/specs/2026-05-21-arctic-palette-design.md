# Arctic Palette — 디자인 패턴 스펙

**작성일:** 2026-05-21
**대상 프로젝트:** GrappleGuide (Next.js 16 + Tailwind v4 + Supabase)
**상태:** 승인 대기

## 1. 배경

레퍼런스로 받은 TRSN 사이트(아틱 스트리트웨어, 차가운 블루-그레이 톤)의 **색감만** 차용해 GrappleGuide 의 디자인 패턴을 재정의한다. 레이아웃, 타이포그래피, 산/그라피티 같은 분위기 이미지는 차용하지 않는다.

현재 GrappleGuide 는 흰 배경에 기본 회색(`gray-*`)을 흩어 쓰고 있으며, 디자인 토큰이라고 부를 만한 단일 진실 공급원이 없다. 이번 작업의 목표는 색에 한해 시맨틱 토큰 레이어를 도입해 "디자인 패턴"이라 부를 수 있는 시스템을 만드는 것이다.

## 2. 결정 사항 (브레인스토밍 합의)

| 항목 | 결정 |
|---|---|
| 차용 요소 | 색감만 (레이아웃·타이포·분위기 이미지 제외) |
| 기본 모드 | 화이트 베이스 |
| 액센트 적용 위치 | 텍스트 본문/보조설명, 카드·컨테이너 테두리·구분선, 주요 버튼/링크/CTA, 헤더/FilterBar chrome — **광범위** |
| 색 강도 | 중간(Slate, slate-* 계열) — 분명한 푸른 기운, 저채도 |
| 구현 접근 | 시맨틱 토큰 레이어 (Tailwind v4 `@theme inline`) |
| 상태 색 방향 | 차가운 톤으로 통일 (sky·teal), 단 danger 는 rose 유지 |
| 범위 외 | 폰트 family, 간격, 라운드, 그림자 값 — 이번에는 손대지 않음 |

## 3. 색 토큰 분류

`app/globals.css` 의 `@theme inline` 블록에 다음 11개 시맨틱 토큰을 정의한다. 컴포넌트는 시맨틱 유틸리티(`bg-surface`, `text-muted` 등)로만 참조하며, 토큰 정의 외 위치에서 `slate-*` 같은 raw 팔레트 유틸리티를 직접 쓰지 않는다.

### 3.1 Surfaces

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-background` | `#ffffff` | 페이지 최외곽 배경 |
| `--color-surface` | `#ffffff` | 기본 카드/패널 표면 |
| `--color-surface-muted` | `#f1f5f9` (slate-100) | 보조 표면 (FilterBar, placeholder 등) |
| `--color-surface-sunken` | `#f8fafc` (slate-50) | 가라앉은 영역 (body 기본 배경) |

### 3.2 Borders

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-border` | `#e2e8f0` (slate-200) | 기본 테두리, 구분선 |
| `--color-border-strong` | `#cbd5e1` (slate-300) | hover/focus 강조 테두리 |

### 3.3 Text (Foreground)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-foreground` | `#0f172a` (slate-900) | 본문 기본, 제목 |
| `--color-foreground-muted` | `#475569` (slate-600) | 보조 설명 |
| `--color-foreground-subtle` | `#94a3b8` (slate-400) | placeholder, disabled, 메타 |

> **이름 변경 이유:** 토큰 이름이 곧 Tailwind 유틸리티 이름이 된다 (예: `--color-text` → `text-text`). 어색한 중복을 피해 shadcn 컨벤션의 `foreground` 명칭을 채택. 의미·매핑·개수는 동일.

### 3.4 Primary (액션)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-primary` | `#1e293b` (slate-800) | CTA, 강조 버튼 배경 |
| `--color-primary-hover` | `#334155` (slate-700) | primary hover 상태 |
| `--color-primary-foreground` | `#ffffff` | primary 위 텍스트 |

### 3.5 상태 색 (차가운 톤 통일, danger 제외)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-favorite` | `#0ea5e9` (sky-500) | 즐겨찾기 별 (warm yellow → cold sky) |
| `--color-learned` | `#0d9488` (teal-600) | 익힘 체크 (emerald → teal) |
| `--color-danger` | `#e11d48` (rose-600) | 에러 텍스트 (red → rose, slate 와 어울리는 핑크 기운) |

위험 신호는 인지적 convention 상 따뜻한 색이 유리하므로 danger 만 차가운 톤에서 예외로 둔다.

## 4. Tailwind v4 통합 방식

Tailwind v4 의 `@theme inline` 블록에 위 토큰을 정의하면 자동으로 `bg-surface`, `text-foreground-muted`, `border-border` 같은 유틸리티가 생성된다 (토큰 이름이 그대로 유틸리티가 됨).

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-background: #ffffff;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-surface-sunken: #f8fafc;

  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  --color-foreground: #0f172a;
  --color-foreground-muted: #475569;
  --color-foreground-subtle: #94a3b8;

  --color-primary: #1e293b;
  --color-primary-hover: #334155;
  --color-primary-foreground: #ffffff;

  --color-favorite: #0ea5e9;
  --color-learned: #0d9488;
  --color-danger: #e11d48;

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--color-surface-sunken);
  color: var(--color-foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

기존 `:root` 의 `--background`/`--foreground` 와 `prefers-color-scheme: dark` 미디어쿼리 블록은 제거한다(다크 모드는 이번 범위 외, 흰 베이스 단일 모드).

**주의 — Next.js 16 변경점:** Tailwind v4 의 `@theme inline` 사용 방식이나 토큰 → 유틸리티 매핑 규칙이 학습 데이터 시점과 다를 수 있다. 구현 시 `node_modules/next/dist/docs/` 와 Tailwind v4 공식 문서를 먼저 확인한 뒤 코드를 쓴다.

## 5. 매핑 룰 (현재 회색·상태 색 → 토큰)

리팩터링 시 다음 1:1 치환 규칙을 따른다.

| 현재 | 토큰 유틸리티 |
|---|---|
| `bg-white` (카드/패널 표면) | `bg-surface` |
| `bg-gray-50` (body) | `bg-surface-sunken` |
| `bg-gray-100`, `bg-gray-200` (placeholder, muted) | `bg-surface-muted` |
| `border` / `border-b` / `border-gray-200` | `border-border` (테두리 토큰) |
| `text-gray-900` | `text-foreground` (대부분 body 기본 inherit 으로 생략 가능) |
| `text-gray-600` | `text-foreground-muted` |
| `text-gray-500` | `text-foreground-muted` |
| `text-gray-400` | `text-foreground-subtle` |
| `text-yellow-500` (favorite) | `text-favorite` |
| `text-emerald-600` (learned) | `text-learned` |
| `text-red-600` (error) | `text-danger` |

`bg-white/90` 같은 alpha 변형은 `bg-surface/90` 으로 그대로 옮긴다 (Tailwind v4 의 색 토큰은 opacity modifier 와 호환).

## 6. 영향 받는 파일

### 6.1 Chrome / Layout (3 파일)

- `app/layout.tsx` — body 클래스 (`bg-gray-50 text-gray-900` → 토큰)
- `components/Header.tsx` — sticky 헤더 배경·테두리·nav 텍스트
- `components/FilterBar.tsx` — 필터 바 배경·테두리

### 6.2 카드 / 콘텐츠 (3 파일)

- `components/TechniqueCard.tsx` — 카드 배경, thumb placeholder, 별/체크 상태 색, 메타 텍스트
- `components/StarRating.tsx` — 별 색
- `components/SafeImage.tsx` — 이미지 placeholder 색

### 6.3 페이지 / 상태 / 폼 (다수)

- `app/page.tsx`, `app/favorites/page.tsx`, `app/learned/page.tsx` — 로딩·에러·empty state 텍스트
- `app/login/page.tsx`, `app/cards/[id]/page.tsx`, `app/cards/new/page.tsx`, `app/cards/[id]/edit/page.tsx` — 폼/링크/메타 회색 텍스트
- `app/not-found.tsx`, `app/error.tsx` — 회색 텍스트
- `components/TechniqueForm.tsx`, `components/ImageUploader.tsx`, `components/Fab.tsx`, `components/Toast.tsx` — 회색·액션 색

### 6.4 범위 외 (이번에 손대지 않음)

- 폰트 family (`Geist`, `Arial` 그대로)
- 간격(spacing) 유틸리티
- `rounded-*` 라운드 값
- `shadow-*` 그림자 값
- 다크 모드

## 7. 작업 순서

1. **토큰 정의** — `app/globals.css` 의 `@theme inline` 블록에 11개 색 토큰 추가, 기존 `:root` / `prefers-color-scheme` 블록 정리. 이 단계만으로는 화면이 바뀌지 않음.
2. **Chrome 리팩터링** — `app/layout.tsx`, `components/Header.tsx`, `components/FilterBar.tsx` 의 색 유틸리티를 토큰 기반으로 치환. 가장 자주 보이는 영역부터 시작해 변화 체감.
3. **카드 / StarRating / SafeImage** — 콘텐츠 영역 색 치환. 상태 색(favorite/learned)도 이 단계에서 토큰화.
4. **페이지 / 폼 / 상태 화면** — 로딩·에러·empty state 텍스트, 폼·메타 회색 일괄 치환.
5. **시각 확인** — `npm run dev` 로 브라우저에서 각 주요 화면 점검 (홈/카드 상세/즐겨찾기/익힘/로그인/카드 생성). 상태 색이 slate 위에서 적절히 식별되는지 확인.

## 8. 검증 기준

- [ ] `app/globals.css` 외 어떤 파일에서도 raw `slate-*`, `gray-*`, `yellow-*`, `emerald-*`, `red-*` 색 유틸리티가 남아있지 않다 (grep 으로 확인).
- [ ] 홈 화면, 카드 상세, 즐겨찾기, 익힘, 로그인, 카드 생성/수정 페이지에서 회색이 모두 차가운 slate 톤으로 바뀌어 보인다.
- [ ] 별(즐겨찾기)이 sky 블루, 익힘 체크가 teal 로 표시되고, 에러는 rose 로 표시된다.
- [ ] `npm run lint`, `npm run test`, `npm run test:e2e` 가 통과한다 (색 변경이 기능에 영향 주지 않아야 함).
- [ ] 다크 모드 미디어쿼리가 제거되어 시스템 다크 설정에서도 흰 베이스가 유지된다.

## 9. 향후 확장 가능성 (범위 외, 메모)

- **다크 모드** — 토큰 레이어가 자리잡으면 `.dark` 클래스 토글로 같은 토큰의 값만 swap 하면 됨. 11개 토큰만 다시 매핑.
- **스페이싱/라운드/그림자 토큰화** — 색 토큰이 안착한 뒤 같은 패턴으로 확장 가능.
- **타이포그래피 시스템** — 폰트/사이즈/행간 토큰화는 별도 스펙으로 진행.
