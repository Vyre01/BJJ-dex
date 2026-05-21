'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { TechniqueCard } from '@/components/TechniqueCard';
import { Fab } from '@/components/Fab';
import { useTechniques } from '@/lib/queries';
import { filtersFromSearchParams } from '@/lib/filters-url';
import { filterTechniques } from '@/lib/filters';

function HomeContent() {
  const sp = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(new URLSearchParams(sp.toString())), [sp]);
  const { data, isLoading, error } = useTechniques();

  const list = useMemo(() => (data ? filterTechniques(data, filters) : []), [data, filters]);

  return (
    <>
      <FilterBar />
      <main className="p-2">
        {isLoading && <p className="p-4 text-sm text-foreground-muted">불러오는 중…</p>}
        {error && <p className="p-4 text-sm text-danger">불러오기 실패: {(error as Error).message}</p>}
        {!isLoading && !error && list.length === 0 && (
          <p className="p-8 text-center text-sm text-foreground-muted">조건에 맞는 기술이 없습니다.</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {list.map((t) => <TechniqueCard key={t.id} t={t} />)}
        </div>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<p className="p-4 text-sm text-foreground-muted">불러오는 중…</p>}>
        <HomeContent />
      </Suspense>
      <Fab />
    </>
  );
}
