'use client';

import { useMemo } from 'react';
import { Header } from '@/components/Header';
import { TechniqueCard } from '@/components/TechniqueCard';
import { useTechniques } from '@/lib/queries';
import { filterTechniques } from '@/lib/filters';

export default function LearnedPage() {
  const { data, isLoading, error } = useTechniques();
  const list = useMemo(() => (data ? filterTechniques(data, { learned: true }) : []), [data]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl px-3 py-4">
        <h1 className="mb-3 px-1 font-display text-xl font-extrabold tracking-tight">익힌 기술</h1>
        {isLoading && <p className="p-4 text-sm text-foreground-muted">불러오는 중…</p>}
        {error && <p className="p-4 text-sm text-danger">불러오기 실패: {(error as Error).message}</p>}
        {!isLoading && !error && list.length === 0 && (
          <p className="p-12 text-center text-sm text-foreground-muted">아직 익힌 기술이 없습니다.</p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((t) => <TechniqueCard key={t.id} t={t} />)}
        </div>
      </main>
    </>
  );
}
