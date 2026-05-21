# Arctic Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GrappleGuide 전반의 회색·상태 색을 차가운 슬레이트 기반 시맨틱 토큰 레이어로 교체한다. 화면 동작은 변하지 않는다.

**Architecture:** `app/globals.css` 의 `@theme inline` 블록에 11개 색 토큰을 정의해 단일 진실 공급원을 만들고, 모든 컴포넌트는 시맨틱 유틸리티(`bg-surface`, `text-foreground-muted`, `bg-primary` 등)로 토큰을 참조한다. Raw 팔레트(`gray-*`, `slate-*`, `yellow-*`, `emerald-*`, `red-*`, `blue-*`)는 globals.css 외에서는 사용하지 않는다. 옅은 tint 가 필요한 곳(상태 chip, 활성 필터 버튼)은 토큰에 opacity modifier 를 붙여 표현한다 (`bg-favorite/10` 등).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (`@theme inline`), Supabase, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-21-arctic-palette-design.md`

**Important — Next.js 16 / Tailwind v4 caveat:** This codebase is on a version that may differ from training data. The `AGENTS.md` says to read `node_modules/next/dist/docs/` before writing code. For Tailwind v4 `@theme inline` semantics and opacity-modifier behavior on custom color tokens, verify against installed Tailwind v4 docs (`node_modules/tailwindcss/`) before assuming behavior.

---

## File Structure

**Created:**
- _(none — this plan modifies existing files only)_

**Modified — Token definition (1 file):**
- `app/globals.css` — replace `:root` and `@media (prefers-color-scheme: dark)` blocks; add 11 semantic color tokens to existing `@theme inline` block; update `body` rule to reference new tokens.

**Modified — Chrome (3 files):**
- `app/layout.tsx` — `body` className
- `components/Header.tsx` — sticky header bg / border / nav text
- `components/FilterBar.tsx` — bar bg / inputs / status filter chips

**Modified — Cards & content (3 files):**
- `components/TechniqueCard.tsx` — card surface / thumb placeholder / star+check buttons / meta text
- `components/StarRating.tsx` — filled / empty star colors
- `components/SafeImage.tsx` — placeholder bg / text

**Modified — List & detail pages (4 files):**
- `app/page.tsx` — loading / error / empty text
- `app/favorites/page.tsx` — same
- `app/learned/page.tsx` — same
- `app/cards/[id]/page.tsx` — loading / error / detail meta / status chips / markdown code bg / delete button

**Modified — Forms (5 files):**
- `app/login/page.tsx` — Suspense fallback / submit button
- `app/cards/new/page.tsx` — (no color utilities currently — verify only)
- `app/cards/[id]/edit/page.tsx` — loading / error
- `components/TechniqueForm.tsx` — submit button
- `components/ImageUploader.tsx` — placeholder bg / error text

**Modified — Misc (4 files):**
- `app/error.tsx` — secondary text / digest text / pre code block
- `app/not-found.tsx` — link
- `components/Fab.tsx` — fab bg
- `components/Toast.tsx` — toast tone backgrounds

**Total: 20 files modified.**

---

## Reference: Mapping rules (used throughout)

| Current utility | → | Token utility |
|---|---|---|
| `bg-white` (card/panel surface) | → | `bg-surface` |
| `bg-gray-50` (body) | → | `bg-surface-sunken` |
| `bg-gray-100` (placeholder/muted) | → | `bg-surface-muted` |
| `bg-gray-200` (placeholder) | → | `bg-surface-muted` |
| `border` (default thin border, no color) | → | `border border-border` (explicit color) |
| `border-b` | → | `border-b border-border` |
| `border-gray-200` | → | `border-border` |
| `border-gray-400` | → | `border-border-strong` |
| `text-gray-900` | → | `text-foreground` (often omittable — body inherits) |
| `text-gray-700` | → | `text-foreground-muted` |
| `text-gray-600` | → | `text-foreground-muted` |
| `text-gray-500` | → | `text-foreground-muted` |
| `text-gray-400` | → | `text-foreground-subtle` |
| `text-gray-300` (empty star) | → | `text-foreground-subtle` |
| `bg-blue-600` (primary CTA bg) | → | `bg-primary` |
| `text-blue-600` (primary link) | → | `text-primary` |
| `text-white` (on primary bg) | → | `text-primary-foreground` |
| `text-yellow-500` (favorite icon) | → | `text-favorite` |
| `bg-yellow-100` (favorite tint bg) | → | `bg-favorite/10` |
| `border-yellow-400` (favorite tint border) | → | `border-favorite/40` |
| `text-yellow-800` (text on favorite tint) | → | `text-favorite` |
| `text-emerald-600` (learned icon) | → | `text-learned` |
| `bg-emerald-100` (learned tint bg) | → | `bg-learned/10` |
| `border-emerald-400` (learned tint border) | → | `border-learned/40` |
| `text-emerald-800` (text on learned tint) | → | `text-learned` |
| `bg-emerald-600` (Toast success bg) | → | `bg-learned` |
| `text-red-600` (error text) | → | `text-danger` |
| `bg-red-600` (Toast error bg) | → | `bg-danger` |
| `bg-gray-900` (Toast info bg) | → | `bg-foreground` |
| `bg-white/90` (alpha on white surface) | → | `bg-surface/90` |

---

## Task 1: Define semantic color tokens (no visual change)

**Files:**
- Modify: `app/globals.css` (full rewrite of file)

This task only adds the token layer. Components still reference the old utilities, so no visual change appears yet. We commit this isolated to keep the change set small.

- [ ] **Step 1: Verify Tailwind v4 `@theme inline` + custom-token opacity behavior**

Run: `ls node_modules/tailwindcss/`
Then: open `node_modules/tailwindcss/theme.css` (if present) or the top-level Tailwind v4 docs in `node_modules/` to confirm:
- `@theme inline` accepts `--color-*` definitions
- Custom `--color-X` tokens automatically generate `bg-X`, `text-X`, `border-X` utilities
- Opacity modifier (`bg-X/10`) works on custom tokens

If any of the above is not supported in this version, stop and report — the design depends on these.

Expected: Tailwind v4 supports all three (this is the v4 baseline).

- [ ] **Step 2: Rewrite `app/globals.css` to introduce the tokens**

Replace the entire file contents with:

```css
@import "tailwindcss";

@theme inline {
  /* Surfaces */
  --color-background: #ffffff;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-surface-sunken: #f8fafc;

  /* Borders */
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  /* Foreground (text) */
  --color-foreground: #0f172a;
  --color-foreground-muted: #475569;
  --color-foreground-subtle: #94a3b8;

  /* Primary action */
  --color-primary: #1e293b;
  --color-primary-hover: #334155;
  --color-primary-foreground: #ffffff;

  /* Status */
  --color-favorite: #0ea5e9;
  --color-learned: #0d9488;
  --color-danger: #e11d48;

  /* Fonts (preserved) */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--color-surface-sunken);
  color: var(--color-foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

Notes:
- The previous `:root { --background; --foreground }` and `@media (prefers-color-scheme: dark)` blocks are removed (single white-mode per spec).
- The previous `--color-background`/`--color-foreground` indirection through `:root` vars is replaced by direct hex values.

- [ ] **Step 3: Verify the dev server still builds**

Run: `npm run dev`
Expected: server starts on a port without errors. Open `http://localhost:3000`. Page renders identically to before this task (components still use old gray-* utilities, so nothing visual changes yet).

Stop the dev server after verifying.

- [ ] **Step 4: Verify lint passes**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): define semantic color tokens in @theme inline

Add 11 semantic tokens (surface/border/foreground/primary/status)
mapping to slate + sky/teal/rose. Remove unused dark-mode block.
Component refactor follows in subsequent commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Refactor `app/layout.tsx` (body chrome)

**Files:**
- Modify: `app/layout.tsx:28`

- [ ] **Step 1: Read current state**

Current line 28:
```tsx
<body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
```

- [ ] **Step 2: Replace utilities with tokens**

Edit `app/layout.tsx` line 28 to:
```tsx
<body className="min-h-screen bg-surface-sunken text-foreground flex flex-col">
```

- [ ] **Step 3: Visual confirm**

Run: `npm run dev`
Open `http://localhost:3000`.
Expected: body background is the same near-white slate tint (`#f8fafc` vs prior `#f9fafb` — barely perceptible difference).

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "refactor(theme): apply tokens to body chrome

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Refactor `components/Header.tsx`

**Files:**
- Modify: `components/Header.tsx:27,31,32,34,36`

- [ ] **Step 1: Read current state**

Lines 27–37 currently:
```tsx
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
```

- [ ] **Step 2: Replace utilities with tokens**

Apply these edits to `components/Header.tsx`:

| Find | Replace |
|---|---|
| `bg-white border-b` | `bg-surface border-b border-border` |
| `'font-semibold' : 'text-gray-600'` (both `Link` lines, 31 and 32) | `'font-semibold' : 'text-foreground-muted'` |
| `className="text-gray-600"` (line 34, button) | `className="text-foreground-muted"` |
| `className="text-gray-600"` (line 36, login Link) | `className="text-foreground-muted"` |

Use Edit tool with `replace_all: true` carefully — `text-gray-600` appears 4 times in this file. After: confirm no `text-gray-*` remains in this file.

- [ ] **Step 3: Verify**

Run: `npm run dev`. Open the home page. Header should look the same but inactive nav links use slate-600 (#475569) instead of gray-600 (#4b5563) — barely perceptible.

Run grep to confirm:
```bash
grep -nE "(bg-white|text-gray|border-gray)" components/Header.tsx
```
Expected: no matches (empty output).

- [ ] **Step 4: Commit**

```bash
git add components/Header.tsx
git commit -m "refactor(theme): apply tokens to Header

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Refactor `components/FilterBar.tsx`

**Files:**
- Modify: `components/FilterBar.tsx:38,84-85,99-105,113`

This file has multiple status tints (favorite active, learned active, learned-false). Status tints use opacity modifier on the token.

- [ ] **Step 1: Replace the bar container**

Current line 38:
```tsx
<div className="space-y-2 p-2 bg-white border-b sticky top-12 z-10">
```

Edit to:
```tsx
<div className="space-y-2 p-2 bg-surface border-b border-border sticky top-12 z-10">
```

- [ ] **Step 2: Replace favorite filter button (lines 79–89)**

Current:
```tsx
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
```

Edit to:
```tsx
<button
  type="button"
  aria-pressed={filters.fav === true}
  onClick={() => apply({ ...filters, fav: filters.fav ? undefined : true })}
  className={
    'rounded-md border px-2 py-1 text-sm ' +
    (filters.fav ? 'bg-favorite/10 border-favorite/40' : 'bg-surface border-border')
  }
>
  ☆ 즐겨찾기
</button>
```

- [ ] **Step 3: Replace learned filter button (lines 90–109)**

Current:
```tsx
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
```

Edit to:
```tsx
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
      ? 'bg-learned/10 border-learned/40'
      : filters.learned === false
      ? 'bg-surface-muted border-border-strong'
      : 'bg-surface border-border')
  }
>
  {filters.learned === true ? '✓ 익힘만' : filters.learned === false ? '○ 미익힘만' : '✓ 익힘'}
</button>
```

- [ ] **Step 4: Replace reset button (line 113)**

Current:
```tsx
className="rounded-md border px-2 py-1 text-sm bg-white"
```

Edit to:
```tsx
className="rounded-md border border-border px-2 py-1 text-sm bg-surface"
```

- [ ] **Step 5: Verify**

Run: `npm run dev`. Open home page.
- Filter bar background: same white (`#ffffff`).
- Click ☆ favorite filter: should turn pale sky-blue (was pale yellow).
- Click ✓ learned filter (cycles): "익힘만" pale teal (was pale emerald), "미익힘만" slate-100 with slate-300 border (was gray-100/gray-400).
- All select/input borders unchanged (no explicit color set in file — they use Tailwind's `border` width-only utility with default color).

Grep:
```bash
grep -nE "(bg-white|bg-gray|bg-yellow|bg-emerald|border-yellow|border-emerald|border-gray)" components/FilterBar.tsx
```
Expected: empty.

- [ ] **Step 6: Commit**

```bash
git add components/FilterBar.tsx
git commit -m "refactor(theme): apply tokens to FilterBar status chips

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Refactor `components/SafeImage.tsx`

**Files:**
- Modify: `components/SafeImage.tsx:21`

- [ ] **Step 1: Read current state**

Line 21:
```tsx
<div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
```

- [ ] **Step 2: Replace**

Edit to:
```tsx
<div className="absolute inset-0 flex items-center justify-center bg-surface-muted text-foreground-subtle text-sm">
```

- [ ] **Step 3: Verify**

Grep:
```bash
grep -nE "(bg-gray|text-gray)" components/SafeImage.tsx
```
Expected: empty.

- [ ] **Step 4: Commit (combined with Task 6 below to avoid trivial single-file commits)**

Hold this change uncommitted; commit together with Task 6.

---

## Task 6: Refactor `components/StarRating.tsx`

**Files:**
- Modify: `components/StarRating.tsx:16`

- [ ] **Step 1: Read current state**

Line 16:
```tsx
const common = filled ? 'text-yellow-500' : 'text-gray-300';
```

- [ ] **Step 2: Replace**

Edit to:
```tsx
const common = filled ? 'text-favorite' : 'text-foreground-subtle';
```

Note: `text-gray-300` in current code is one step lighter than `gray-400`. We map to `foreground-subtle` (slate-400) — slightly darker than gray-300 but more readable on white. Acceptable per spec (subtle/disabled).

- [ ] **Step 3: Verify**

Grep:
```bash
grep -nE "(text-gray|text-yellow)" components/StarRating.tsx
```
Expected: empty.

- [ ] **Step 4: Commit (combined with Task 5)**

```bash
git add components/SafeImage.tsx components/StarRating.tsx
git commit -m "refactor(theme): apply tokens to SafeImage and StarRating

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Refactor `components/TechniqueCard.tsx`

**Files:**
- Modify: `components/TechniqueCard.tsx:28,30,36,50-51,64-65`

- [ ] **Step 1: Read current state**

Card container (line 28): `className="relative rounded-lg bg-white shadow overflow-hidden"`
Thumb placeholder (line 30): `className="aspect-square bg-gray-200 relative"`
Meta line (line 36): `<div className="text-xs text-gray-500 truncate">`
Favorite button (lines 49–55):
```tsx
className={
  'rounded-full bg-white/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
  (t.is_favorite ? 'text-yellow-500' : 'text-gray-400')
}
```
Learned button (lines 64–68):
```tsx
className={
  'rounded-full bg-white/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
  (t.is_learned ? 'text-emerald-600' : 'text-gray-400')
}
```

- [ ] **Step 2: Replace card container**

Edit line 28 from:
```tsx
<div className="relative rounded-lg bg-white shadow overflow-hidden">
```
To:
```tsx
<div className="relative rounded-lg bg-surface shadow overflow-hidden">
```

- [ ] **Step 3: Replace thumb placeholder**

Edit line 30 from:
```tsx
<div className="aspect-square bg-gray-200 relative">
```
To:
```tsx
<div className="aspect-square bg-surface-muted relative">
```

- [ ] **Step 4: Replace meta line**

Edit line 36 from:
```tsx
<div className="text-xs text-gray-500 truncate">{t.position} · {t.category}</div>
```
To:
```tsx
<div className="text-xs text-foreground-muted truncate">{t.position} · {t.category}</div>
```

- [ ] **Step 5: Replace favorite button**

Edit the favorite button className (lines 49–52) from:
```tsx
className={
  'rounded-full bg-white/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
  (t.is_favorite ? 'text-yellow-500' : 'text-gray-400')
}
```
To:
```tsx
className={
  'rounded-full bg-surface/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
  (t.is_favorite ? 'text-favorite' : 'text-foreground-subtle')
}
```

- [ ] **Step 6: Replace learned button**

Edit the learned button className (lines 64–67) from:
```tsx
className={
  'rounded-full bg-white/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
  (t.is_learned ? 'text-emerald-600' : 'text-gray-400')
}
```
To:
```tsx
className={
  'rounded-full bg-surface/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
  (t.is_learned ? 'text-learned' : 'text-foreground-subtle')
}
```

- [ ] **Step 7: Verify**

Run: `npm run dev`. Open home page.
- Cards: white surface, slate-100 placeholder thumb.
- Filled star buttons: sky-500.
- Filled check buttons: teal-600.
- Inactive star/check buttons: slate-400 (was gray-400).

Grep:
```bash
grep -nE "(bg-white|bg-gray|text-gray|text-yellow|text-emerald)" components/TechniqueCard.tsx
```
Expected: empty.

- [ ] **Step 8: Commit**

```bash
git add components/TechniqueCard.tsx
git commit -m "refactor(theme): apply tokens to TechniqueCard

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Refactor list pages (`app/page.tsx`, `app/favorites/page.tsx`, `app/learned/page.tsx`)

**Files:**
- Modify: `app/page.tsx:24-27`
- Modify: `app/favorites/page.tsx:18-21`
- Modify: `app/learned/page.tsx:18-21`

All three pages share the same loading / error / empty pattern.

- [ ] **Step 1: Edit `app/page.tsx`**

Replace lines 24–27:
```tsx
{isLoading && <p className="p-4 text-sm text-gray-500">불러오는 중…</p>}
{error && <p className="p-4 text-sm text-red-600">불러오기 실패: {(error as Error).message}</p>}
{!isLoading && !error && list.length === 0 && (
  <p className="p-8 text-center text-sm text-gray-500">조건에 맞는 기술이 없습니다.</p>
)}
```
With:
```tsx
{isLoading && <p className="p-4 text-sm text-foreground-muted">불러오는 중…</p>}
{error && <p className="p-4 text-sm text-danger">불러오기 실패: {(error as Error).message}</p>}
{!isLoading && !error && list.length === 0 && (
  <p className="p-8 text-center text-sm text-foreground-muted">조건에 맞는 기술이 없습니다.</p>
)}
```

- [ ] **Step 2: Edit `app/favorites/page.tsx`**

Replace lines 18–22:
```tsx
{isLoading && <p className="p-4 text-sm text-gray-500">불러오는 중…</p>}
{error && <p className="p-4 text-sm text-red-600">불러오기 실패: {(error as Error).message}</p>}
{!isLoading && !error && list.length === 0 && (
  <p className="p-8 text-center text-sm text-gray-500">즐겨찾기가 없습니다.</p>
)}
```
With:
```tsx
{isLoading && <p className="p-4 text-sm text-foreground-muted">불러오는 중…</p>}
{error && <p className="p-4 text-sm text-danger">불러오기 실패: {(error as Error).message}</p>}
{!isLoading && !error && list.length === 0 && (
  <p className="p-8 text-center text-sm text-foreground-muted">즐겨찾기가 없습니다.</p>
)}
```

- [ ] **Step 3: Edit `app/learned/page.tsx`**

Replace lines 18–22:
```tsx
{isLoading && <p className="p-4 text-sm text-gray-500">불러오는 중…</p>}
{error && <p className="p-4 text-sm text-red-600">불러오기 실패: {(error as Error).message}</p>}
{!isLoading && !error && list.length === 0 && (
  <p className="p-8 text-center text-sm text-gray-500">아직 익힌 기술이 없습니다.</p>
)}
```
With:
```tsx
{isLoading && <p className="p-4 text-sm text-foreground-muted">불러오는 중…</p>}
{error && <p className="p-4 text-sm text-danger">불러오기 실패: {(error as Error).message}</p>}
{!isLoading && !error && list.length === 0 && (
  <p className="p-8 text-center text-sm text-foreground-muted">아직 익힌 기술이 없습니다.</p>
)}
```

- [ ] **Step 4: Verify**

Grep:
```bash
grep -rnE "(text-gray|text-red)" app/page.tsx app/favorites/page.tsx app/learned/page.tsx
```
Expected: empty.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/favorites/page.tsx app/learned/page.tsx
git commit -m "refactor(theme): apply tokens to list page states

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Refactor `app/cards/[id]/page.tsx`

**Files:**
- Modify: `app/cards/[id]/page.tsx:45-46,50,61,64-65,68,75`

This page has loading/error text, image placeholder, meta text, two status chips, a markdown code-bg style, and a delete button.

- [ ] **Step 1: Replace loading/error text (lines 45–46)**

Current:
```tsx
{isLoading && <p className="text-sm text-gray-500">불러오는 중…</p>}
{error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
```
Replace with:
```tsx
{isLoading && <p className="text-sm text-foreground-muted">불러오는 중…</p>}
{error && <p className="text-sm text-danger">{(error as Error).message}</p>}
```

- [ ] **Step 2: Replace image wrapper bg (line 50)**

Current:
```tsx
<div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden">
```
Replace with:
```tsx
<div className="relative w-full aspect-square bg-surface-muted rounded overflow-hidden">
```

- [ ] **Step 3: Replace meta text (line 61)**

Current:
```tsx
<div className="text-sm text-gray-600">{t.position} · {t.category}</div>
```
Replace with:
```tsx
<div className="text-sm text-foreground-muted">{t.position} · {t.category}</div>
```

- [ ] **Step 4: Replace status chips (lines 64–65)**

Current:
```tsx
{t.is_favorite && <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">★ 즐겨찾기</span>}
{t.is_learned && <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">✓ 익힘</span>}
```
Replace with:
```tsx
{t.is_favorite && <span className="px-2 py-0.5 rounded bg-favorite/10 text-favorite">★ 즐겨찾기</span>}
{t.is_learned && <span className="px-2 py-0.5 rounded bg-learned/10 text-learned">✓ 익힘</span>}
```

- [ ] **Step 5: Replace markdown code background (line 68)**

Inside the long `className` string on line 68, find:
```
[&_code]:bg-gray-100
```
Replace with:
```
[&_code]:bg-surface-muted
```

Use Edit with sufficient surrounding context — the full attribute is a single long string.

- [ ] **Step 6: Replace delete button (line 75)**

Current:
```tsx
<button type="button" onClick={onDelete} className="rounded-md border px-3 py-1 text-sm text-red-600">삭제</button>
```
Replace with:
```tsx
<button type="button" onClick={onDelete} className="rounded-md border border-border px-3 py-1 text-sm text-danger">삭제</button>
```

- [ ] **Step 7: Add explicit border color to edit link (line 74) for consistency**

Current:
```tsx
<Link href={`/cards/${t.id}/edit`} className="rounded-md border px-3 py-1 text-sm">수정</Link>
```
Replace with:
```tsx
<Link href={`/cards/${t.id}/edit`} className="rounded-md border border-border px-3 py-1 text-sm">수정</Link>
```

- [ ] **Step 8: Verify**

Grep:
```bash
grep -nE "(bg-gray|text-gray|bg-yellow|text-yellow|bg-emerald|text-emerald|text-red)" "app/cards/[id]/page.tsx"
```
Expected: empty.

- [ ] **Step 9: Commit**

```bash
git add "app/cards/[id]/page.tsx"
git commit -m "refactor(theme): apply tokens to card detail page

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Refactor forms (`login`, `new`, `edit`, `TechniqueForm`, `ImageUploader`)

**Files:**
- Modify: `app/login/page.tsx:57,68`
- Modify: `app/cards/[id]/edit/page.tsx:17-18`
- Modify: `components/TechniqueForm.tsx:161`
- Modify: `components/ImageUploader.tsx:60,64,87`
- Verify only: `app/cards/new/page.tsx` (no raw palette utilities expected)

- [ ] **Step 1: `app/login/page.tsx` — submit button (line 57)**

Current:
```tsx
<button
  type="submit"
  disabled={busy}
  className="w-full rounded-md bg-blue-600 text-white py-2 disabled:opacity-50"
>
```
Replace `className` value with:
```
"w-full rounded-md bg-primary text-primary-foreground py-2 disabled:opacity-50"
```

- [ ] **Step 2: `app/login/page.tsx` — Suspense fallback (line 68)**

Current:
```tsx
<Suspense fallback={<p className="p-6 text-sm text-gray-500">불러오는 중…</p>}>
```
Replace with:
```tsx
<Suspense fallback={<p className="p-6 text-sm text-foreground-muted">불러오는 중…</p>}>
```

- [ ] **Step 3: `app/cards/[id]/edit/page.tsx` — loading/error (lines 17–18)**

Current:
```tsx
{isLoading && <p className="text-sm text-gray-500">불러오는 중…</p>}
{error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
```
Replace with:
```tsx
{isLoading && <p className="text-sm text-foreground-muted">불러오는 중…</p>}
{error && <p className="text-sm text-danger">{(error as Error).message}</p>}
```

- [ ] **Step 4: `components/TechniqueForm.tsx` — submit button (line 161)**

Current:
```tsx
<button
  type="submit"
  disabled={busy}
  className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
>
```
Replace `className` value with:
```
"rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
```

- [ ] **Step 5: `components/ImageUploader.tsx` — preview wrapper (line 60)**

Current:
```tsx
<div className="relative w-full aspect-square bg-gray-100 rounded">
```
Replace with:
```tsx
<div className="relative w-full aspect-square bg-surface-muted rounded">
```

- [ ] **Step 6: `components/ImageUploader.tsx` — placeholder (line 64)**

Current:
```tsx
<div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
```
Replace with:
```tsx
<div className="w-full aspect-square bg-surface-muted rounded flex items-center justify-center text-foreground-subtle text-sm">
```

- [ ] **Step 7: `components/ImageUploader.tsx` — error text (line 87)**

Current:
```tsx
{err && <p className="text-sm text-red-600">{err}</p>}
```
Replace with:
```tsx
{err && <p className="text-sm text-danger">{err}</p>}
```

- [ ] **Step 8: Verify `app/cards/new/page.tsx` has no raw palette utilities**

Grep:
```bash
grep -nE "(bg-gray|text-gray|bg-yellow|bg-emerald|bg-red|bg-blue|text-yellow|text-emerald|text-red|text-blue|border-gray|border-yellow|border-emerald)" app/cards/new/page.tsx
```
Expected: empty. (This file currently has none — verification only.)

- [ ] **Step 9: Verify all changed files**

```bash
grep -nE "(bg-gray|text-gray|bg-yellow|bg-emerald|bg-red|bg-blue|text-yellow|text-emerald|text-red|text-blue|border-gray|border-yellow|border-emerald)" \
  app/login/page.tsx "app/cards/[id]/edit/page.tsx" components/TechniqueForm.tsx components/ImageUploader.tsx
```
Expected: empty.

- [ ] **Step 10: Commit**

```bash
git add app/login/page.tsx "app/cards/[id]/edit/page.tsx" components/TechniqueForm.tsx components/ImageUploader.tsx
git commit -m "refactor(theme): apply tokens to forms

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Refactor `app/error.tsx`, `app/not-found.tsx`, `components/Fab.tsx`, `components/Toast.tsx`

**Files:**
- Modify: `app/error.tsx:15,18,22`
- Modify: `app/not-found.tsx:7`
- Modify: `components/Fab.tsx:13`
- Modify: `components/Toast.tsx:36-39`

- [ ] **Step 1: `app/error.tsx` — secondary copy (line 15)**

Current:
```tsx
<p className="text-sm text-gray-600 mb-4">
```
Replace with:
```tsx
<p className="text-sm text-foreground-muted mb-4">
```

- [ ] **Step 2: `app/error.tsx` — digest (line 18)**

Current:
```tsx
<span className="ml-1 text-gray-400">(코드: {error.digest})</span>
```
Replace with:
```tsx
<span className="ml-1 text-foreground-subtle">(코드: {error.digest})</span>
```

- [ ] **Step 3: `app/error.tsx` — pre block (line 22)**

Current:
```tsx
<pre className="mb-4 max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
```
Replace with:
```tsx
<pre className="mb-4 max-h-48 overflow-auto rounded bg-surface-muted p-2 text-xs text-foreground-muted">
```

- [ ] **Step 4: `app/not-found.tsx` — link (line 7)**

Current:
```tsx
<Link href="/" className="text-blue-600 underline">메인으로</Link>
```
Replace with:
```tsx
<Link href="/" className="text-primary underline">메인으로</Link>
```

- [ ] **Step 5: `components/Fab.tsx` — fab button (line 13)**

Current:
```tsx
className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl flex items-center justify-center shadow-lg"
```
Replace with:
```tsx
className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground text-3xl flex items-center justify-center shadow-lg"
```

- [ ] **Step 6: `components/Toast.tsx` — tone backgrounds (lines 33–39)**

Current:
```tsx
className={
  'rounded-lg px-4 py-2 text-sm shadow-lg ' +
  (t.tone === 'error'
    ? 'bg-red-600 text-white'
    : t.tone === 'success'
    ? 'bg-emerald-600 text-white'
    : 'bg-gray-900 text-white')
}
```
Replace with:
```tsx
className={
  'rounded-lg px-4 py-2 text-sm shadow-lg text-primary-foreground ' +
  (t.tone === 'error'
    ? 'bg-danger'
    : t.tone === 'success'
    ? 'bg-learned'
    : 'bg-foreground')
}
```

Note: `text-primary-foreground` (white) is hoisted out of the conditional since all three tones use white text.

- [ ] **Step 7: Verify**

Grep:
```bash
grep -nE "(bg-gray|text-gray|bg-yellow|bg-emerald|bg-red|bg-blue|text-yellow|text-emerald|text-red|text-blue|text-white|border-gray)" \
  app/error.tsx app/not-found.tsx components/Fab.tsx components/Toast.tsx
```
Expected: empty.

- [ ] **Step 8: Commit**

```bash
git add app/error.tsx app/not-found.tsx components/Fab.tsx components/Toast.tsx
git commit -m "refactor(theme): apply tokens to error/404/Fab/Toast

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Final verification — no raw palette utilities anywhere

**Files:**
- No code changes expected. This task verifies the refactor is complete and catches any missed file.

- [ ] **Step 1: Repo-wide grep for raw palette utilities**

Run:
```bash
grep -rnE "(bg-gray-|text-gray-|border-gray-|bg-yellow-|text-yellow-|border-yellow-|bg-emerald-|text-emerald-|border-emerald-|bg-red-|text-red-|bg-blue-|text-blue-|bg-slate-|text-slate-|border-slate-)" app components --include="*.tsx" --include="*.ts"
```

Expected: empty output. If any match appears, refactor that file using the mapping rules at the top of this plan, then re-run.

- [ ] **Step 2: Confirm `app/globals.css` retains the token block**

Run:
```bash
grep -n "color-surface\|color-foreground\|color-favorite\|color-learned\|color-danger\|color-primary" app/globals.css
```

Expected: at least 11 matches (one per token).

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Run unit tests**

Run: `npm run test`
Expected: all pass. (Color changes do not affect logic, so existing `tests/unit/filters.test.ts` should remain green.)

- [ ] **Step 5: Run e2e tests**

Run: `npm run test:e2e`
Expected: all pass. (Playwright specs don't assert on color, so they should be unaffected. If any fail, investigate — it must be unrelated to color, or a selector that incidentally matched a class that was renamed.)

- [ ] **Step 6: Visual smoke check in dev server**

Run: `npm run dev`. Open `http://localhost:3000` and manually verify each surface:

| Surface | Expected look |
|---|---|
| Header | White bg, slate-200 bottom border, slate-600 inactive nav links |
| FilterBar | White bg, slate-200 bottom border. Active favorite filter = pale sky tint. Active learned filter = pale teal tint. |
| TechniqueCard grid | White cards, slate-100 thumb placeholder, sky-500 filled stars, teal-600 filled checks, slate-400 inactive icons |
| Card detail | Slate-100 image wrapper, slate-600 meta, pale-sky/pale-teal status chips |
| Login | Slate-800 submit button (was Bondi blue) |
| FAB | Slate-800 round button (was Bondi blue) |
| Toast (trigger error toast e.g. login with bad password) | Rose-600 bg (was red-600) |
| Toast (success after add) | Teal-600 bg (was emerald-600) |
| 404 page | Slate-800 "메인으로" link (was Bondi blue) |
| Error boundary | Slate-100 pre block bg (manually trigger to verify if desired) |

Stop the dev server when done.

- [ ] **Step 7: Confirm dark-mode media query is gone**

Run:
```bash
grep -n "prefers-color-scheme" app/globals.css
```
Expected: empty.

- [ ] **Step 8: (Nothing to commit — verification only)**

If all verification steps pass, the refactor is complete. If a small fix was required during Step 1, commit those separately with message `fix(theme): replace missed raw palette utilities in <files>`.

---

## Summary checklist (acceptance)

After all tasks above are complete:

- [ ] `app/globals.css` defines 11 `--color-*` tokens in `@theme inline`
- [ ] No `:root { --background }` or `prefers-color-scheme: dark` block remains in `app/globals.css`
- [ ] No raw palette utilities (`bg-gray-`, `text-gray-`, `bg-yellow-`, `text-yellow-`, `bg-emerald-`, `text-emerald-`, `bg-red-`, `text-red-`, `bg-blue-`, `text-blue-`, `bg-slate-`, etc.) exist anywhere under `app/` or `components/`
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run test:e2e` passes
- [ ] Dev-server visual smoke check confirms slate / sky / teal / rose tones replace gray / yellow / emerald / red
- [ ] FAB / login / save buttons use slate-800 primary (not blue-600)
