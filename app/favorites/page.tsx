'use client';

import { useMemo } from 'react';
import { Header } from '@/components/Header';
import { TechniqueCard } from '@/components/TechniqueCard';
import { useTechniques } from '@/lib/queries';
import { filterTechniques } from '@/lib/filters';

export default function FavoritesPage() {
  const { data, isLoading, error } = useTechniques();
  const list = useMemo(() => (data ? filterTechniques(data, { fav: true }) : []), [data]);

  return (
    <>
      <Header />
      <main className="p-2">
        <h1 className="text-lg font-bold p-2">즐겨찾기</h1>
        {isLoading && <p className="p-4 text-sm text-foreground-muted">불러오는 중…</p>}
        {error && <p className="p-4 text-sm text-danger">불러오기 실패: {(error as Error).message}</p>}
        {!isLoading && !error && list.length === 0 && (
          <p className="p-8 text-center text-sm text-foreground-muted">즐겨찾기가 없습니다.</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {list.map((t) => <TechniqueCard key={t.id} t={t} />)}
        </div>
      </main>
    </>
  );
}
