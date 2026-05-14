# GrappleGuide

주짓수 기술 카드 관리 1인용 앱. Next.js + Supabase로 만든 모바일 우선 웹앱.

## 기능
- 카드 그리드 + 검색/포지션/카테고리/난이도/즐겨찾기/익힘 필터
- 카드 추가·수정·삭제 (이미지 1장 포함)
- 즐겨찾기·익힘 토글 (optimistic update)
- 단일 계정 로그인 (Supabase Auth, 이메일+비밀번호)

## 개발

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev
```

## 환경 변수

`.env.local`에 다음 두 개 필요:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon public 키

## Supabase 초기 설정

1. https://supabase.com 에서 새 프로젝트 생성 (지역: Tokyo 또는 Seoul 권장)
2. Settings → API → `Project URL`과 `anon public` 키 복사해 `.env.local`에 입력
3. Authentication → Providers → Email 활성화, **Disable signups 켜기**
4. Authentication → Users → "Add user"로 본인 계정 1개 생성
5. Storage → New bucket → 이름 `technique-images`, **Public bucket = ON**
6. SQL Editor에서 다음 두 파일을 순서대로 실행:
   - `supabase/migrations/0001_init.sql` — 테이블, 인덱스, RLS, 트리거
   - `supabase/storage-policies.sql` — Storage 정책

## 테스트

```bash
npm test            # 단위 (Vitest) — filterTechniques 8 케이스
npm run test:e2e    # E2E (Playwright)
```

E2E의 카드 추가/즐겨찾기 케이스는 다음 환경 변수가 필요:

```bash
# PowerShell
$env:E2E_EMAIL='your@email.com'
$env:E2E_PASSWORD='yourpass'

# bash
export E2E_EMAIL=your@email.com
export E2E_PASSWORD=yourpass
```

`auth-redirect` 케이스는 자격증명 없이도 통과한다.

## 배포

- Frontend: Vercel (이 저장소 GitHub 연결 → Import → 환경 변수 등록 → Deploy)
- Backend: Supabase 위 항목대로 초기 설정 1회

폰에서 배포 URL 접속 후 "홈 화면에 추가"로 PWA 비슷한 사용성 확보 가능.

## 프로젝트 구조

```
app/                Next.js App Router 페이지
components/         재사용 컴포넌트
lib/                타입, 상수, 클라이언트, 쿼리, 필터
supabase/           DB 마이그레이션 + Storage 정책
tests/
  unit/             Vitest 단위 테스트
  e2e/              Playwright E2E
docs/superpowers/   설계서 + 구현 계획
```

## 라이선스

본인용 사적 프로젝트.
