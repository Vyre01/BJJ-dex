'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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

  return (
    <div className="space-y-2 p-2 bg-surface border-b border-border sticky top-[calc(3rem+env(safe-area-inset-top))] z-10">
      <input
        type="search"
        placeholder="🔍 기술명 검색…"
        value={qInput}
        onChange={(e) => setQInput(e.target.value)}
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
            (filters.fav ? 'bg-favorite/10 border-favorite/40' : 'bg-surface border-border')
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
              ? 'bg-learned/10 border-learned/40'
              : filters.learned === false
              ? 'bg-surface-muted border-border-strong'
              : 'bg-surface border-border')
          }
        >
          {filters.learned === true ? '✓ 익힘만' : filters.learned === false ? '○ 미익힘만' : '✓ 익힘'}
        </button>
        <button
          type="button"
          onClick={() => apply({})}
          className="rounded-md border border-border px-2 py-1 text-sm bg-surface"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
