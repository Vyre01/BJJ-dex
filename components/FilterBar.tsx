'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { POSITIONS, CATEGORIES } from '@/lib/constants';
import { filtersFromSearchParams, filtersToSearchParams } from '@/lib/filters-url';
import type { Filters } from '@/lib/types';
import { Dropdown } from './Dropdown';

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(new URLSearchParams(sp.toString())), [sp]);

  function apply(next: Filters) {
    const qs = filtersToSearchParams(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const [qInput, setQInput] = useState(filters.q ?? '');
  const [lastUrlQ, setLastUrlQ] = useState(filters.q);
  if (lastUrlQ !== filters.q) {
    setLastUrlQ(filters.q);
    setQInput(filters.q ?? '');
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      const nextQ = qInput.trim() || undefined;
      if (nextQ === filters.q) return;
      const qs = filtersToSearchParams({ ...filters, q: nextQ }).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 200);
    return () => clearTimeout(handle);
  }, [qInput, filters, router, pathname]);

  const hasFilters =
    !!filters.q || !!filters.position || !!filters.category || !!filters.difficulty ||
    filters.fav === true || filters.learned !== undefined;

  return (
    <div className="glass sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 space-y-3 border-b border-border px-3 py-3">
      {/* Search */}
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="기술명 검색…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pl-11 pr-3 text-sm text-foreground transition-colors placeholder:text-foreground-subtle focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          ariaLabel="포지션"
          placeholder="포지션"
          value={filters.position ?? ''}
          onChange={(v) => apply({ ...filters, position: (v || undefined) as Filters['position'] })}
          options={POSITIONS.map((p) => ({ value: p, label: p }))}
        />
        <Dropdown
          ariaLabel="카테고리"
          placeholder="카테고리"
          value={filters.category ?? ''}
          onChange={(v) => apply({ ...filters, category: (v || undefined) as Filters['category'] })}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Dropdown
          ariaLabel="난이도 이상"
          placeholder="난이도"
          value={filters.difficulty ? String(filters.difficulty) : ''}
          onChange={(v) =>
            apply({ ...filters, difficulty: v ? (Number(v) as 1 | 2 | 3 | 4 | 5) : undefined })
          }
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${'★'.repeat(n)} 이상` }))}
        />

        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />

        <FilterChip
          active={filters.fav === true}
          activeColor="favorite"
          onClick={() => apply({ ...filters, fav: filters.fav ? undefined : true })}
          ariaPressed={filters.fav === true}
        >
          <Star className="h-3.5 w-3.5" filled={filters.fav === true} /> 즐겨찾기
        </FilterChip>

        <FilterChip
          active={filters.learned !== undefined}
          activeColor={filters.learned === false ? 'danger' : 'learned'}
          ariaLabel="익힘 상태"
          onClick={() =>
            apply({
              ...filters,
              learned: filters.learned === true ? false : filters.learned === false ? undefined : true,
            })
          }
        >
          {filters.learned === false ? '○ 미익힘만' : '✓ 익힘만'}
        </FilterChip>

        {hasFilters && (
          <button
            type="button"
            onClick={() => apply({})}
            className="ml-auto rounded-full px-3 py-1.5 text-sm font-medium text-foreground-subtle transition-colors hover:text-danger"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  activeColor,
  children,
  onClick,
  ariaPressed,
  ariaLabel,
}: {
  active: boolean;
  activeColor: 'favorite' | 'learned' | 'danger';
  children: React.ReactNode;
  onClick: () => void;
  ariaPressed?: boolean;
  ariaLabel?: string;
}) {
  const activeCls =
    activeColor === 'favorite'
      ? 'border-favorite/50 bg-favorite/12 text-favorite'
      : activeColor === 'learned'
      ? 'border-learned/50 bg-learned/12 text-learned'
      : 'border-danger/50 bg-danger/12 text-danger';
  return (
    <button
      type="button"
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ' +
        (active ? activeCls : 'border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground')
      }
    >
      {children}
    </button>
  );
}

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.9 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
