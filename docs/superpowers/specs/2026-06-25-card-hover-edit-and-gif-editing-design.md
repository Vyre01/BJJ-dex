# 카드 호버 수정 버튼 + GIF 편집 — 설계

작성일: 2026-06-25

## 배경

카드 추가/수정 인프라는 이미 존재한다.

- **추가**: 플로팅 `+` 버튼(`components/Fab.tsx`, 로그인 시 노출) → `/cards/new` → `TechniqueForm`
- **수정**: 카드 상세 페이지(`/cards/[id]`)의 **수정** 버튼 → `/cards/[id]/edit` → 동일한 `TechniqueForm`

로컬 mock 모드에서는 `AuthProvider`가 `MOCK_USER`를 즉시 반환하므로 항상 "로그인" 상태로 간주되어 위 버튼들이 노출된다.

따라서 요청 대비 **실제로 빠진 것은 두 가지**다.

1. **그리드 카드에 호버 시 나타나는 수정 버튼이 없다.** 현재 수정 진입점은 상세 페이지뿐이다.
2. **GIF를 편집할 수단이 없다.** `TechniqueForm`은 이름·포지션·카테고리·난이도·순서·설명(details)·이미지(image_path)만 다루며 GIF 필드가 없다. `gif_url`/`gif_poster`는 `lib/mock/seed.ts`의 시드 데이터(Giphy mp4 URL)로만 들어온다.

또한 잠재 버그가 있다: `TechniqueForm`의 mock 저장 페이로드가 `gif_url`/`gif_poster`를 싣지 않아, GIF가 있는 시드 카드(예: 암바)를 수정하면 **GIF가 사라진다.** GIF 필드를 추가하면 이 버그도 해결된다.

## 결정 사항 (확정)

- **GIF 입력 방식**: URL 붙여넣기. 외부 GIF/MP4 URL(기존 시드와 동일한 Giphy 패턴 등)을 입력한다. 스토리지 업로드 파이프라인 불필요, mock·실DB에서 동일 동작.
- **수정 폼 범위**: 기존 전체 폼을 유지하고 GIF 필드만 추가한다. 요청한 이름·설명·GIF 편집을 모두 포함하면서 기존 편집 기능(포지션·카테고리·난이도·순서·이미지)도 보존한다.
- **"기술 설명" = `details` 필드**로 매핑한다(폼의 "디테일(마크다운)").

## 범위

- 새 페이지/라우트 없음. 파일 3곳 변경.
- 추가 플로우 배선은 그대로(같은 폼이 `/cards/new`도 구동하므로 GIF 필드가 생성 시에도 동작).

## 변경 1 — `components/TechniqueCard.tsx`: 호버 수정 버튼

- 기존 우상단 인증 클러스터(★ 즐겨찾기 / ✓ 익힘 버튼이 있는 `absolute right-2 top-2` 영역)에 연필 아이콘 `Link`를 추가한다. 링크 대상은 `/cards/${t.id}/edit`.
- 기본 숨김, 카드 호버 시 페이드 인: `opacity-0 group-hover:opacity-100`. 키보드 접근을 위해 `focus-visible:opacity-100`도 적용한다. `aria-label="수정"`.
- 노출 조건: `authed`일 때만(기존 클러스터와 동일).
- 이 클러스터는 카드의 `<Link>` 래퍼 **바깥**의 형제 요소이므로, 상세 이동과 수정 이동이 충돌하지 않는다. 일반 `next/link`로 충분(별도 `preventDefault` 불필요).
- 터치 기기(호버 없음): `[@media(hover:none)]:opacity-100` 를 추가해 항상 노출. 상세 페이지의 수정 버튼도 폴백으로 유지된다.
- 배치: 클러스터 내 순서는 **수정(호버 노출) → 즐겨찾기 → 익힘**. 즐겨찾기/익힘은 기존대로 항상 노출.

## 변경 2 — `components/TechniqueForm.tsx`: GIF (URL) 필드

- 신규 상태: `const [gifUrl, setGifUrl] = useState(initial?.gif_url ?? '')`.
- 이미지 필드 근처에 라벨 **"GIF (URL)"** 텍스트 입력을 추가(기존 `inputCls` 재사용).
- URL이 있으면 작은 라이브 미리보기 `<video autoPlay muted loop playsInline>` 를 정사각형으로 표시. 로드 실패 시 단순히 재생 안 됨(크래시 없음).
- 제출 시 값 계산:
  - `const gifValue = gifUrl.trim() || null;`
  - 포스터 자동 도출 헬퍼 `derivePoster(url)`: Giphy mp4 패턴(`media.giphy.com/media/<id>/giphy.mp4`)이면 `.../giphy_s.gif` 로 변환, 아니면 `null`.
  - 포스터 결정:
    ```
    const gifPosterValue = !gifValue
      ? null
      : gifValue === (initial?.gif_url ?? null)
        ? (initial?.gif_poster ?? derivePoster(gifValue))
        : derivePoster(gifValue);
    ```
    (URL이 기존과 동일하면 기존 포스터 보존, 바뀌면 새로 도출.)
- `gif_url`/`gif_poster`를 **두 저장 경로 모두**에 포함:
  - mock 페이로드(전체 `Technique` 객체)에 `gif_url: gifValue, gif_poster: gifPosterValue` 추가.
  - Supabase 페이로드(insert/update 객체)에 동일 두 필드 추가. DB 컬럼은 `supabase/migrations/0002_steps_and_gif.sql`로 이미 존재.
- 별도 포스터 입력 필드는 두지 않는다(요청한 3개 필드 유지, 포스터는 자동).

## 변경 3 — 추가 플로우

배선 변경 없음. 같은 `TechniqueForm`이 `/cards/new`를 구동하므로 GIF 필드가 **생성** 시에도 자동 동작. FAB는 추가 진입점으로 그대로 유지.

## 데이터 흐름

그리드 카드 → 호버 → 연필 링크 → `/cards/[id]/edit` → `TechniqueForm(initial)` → 이름 / 설명(details) / GIF 편집 → 제출 → mock `upsert` 또는 Supabase `update`(gif 필드 포함) → 쿼리 무효화(`techniquesKey`, `['technique', id]`) → 상세로 리다이렉트.

새 카드: FAB → `/cards/new` → `TechniqueForm`(initial 없음) → 제출(gif 포함) → insert/upsert → 홈으로 리다이렉트.

## 엣지 케이스 / 비범위

- GIF URL은 자유 입력(mp4 또는 gif). 잘못된 URL은 재생만 안 됨(크래시 없음). 가벼운 검증만(trim, 빈 값 → `null`).
- **비범위(YAGNI)**: GIF 파일 업로드(스토리지), 별도 포스터 입력 필드, 추가 진입점 재설계.

## 테스트

- 린트 + 타입체크/빌드 통과 확인.
- mock 모드에서 수동 검증: 추가, 카드 호버 수정 진입, GIF URL 입력·미리보기·저장, 시드 GIF 카드 수정 후 GIF 보존.
- `derivePoster` 헬퍼가 깔끔히 분리되면 작은 단위 테스트 1개 추가(Giphy 변환 / 비Giphy → null).
