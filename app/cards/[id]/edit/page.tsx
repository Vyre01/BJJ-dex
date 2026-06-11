'use client';

import { use } from 'react';
import { Header } from '@/components/Header';
import { TechniqueForm } from '@/components/TechniqueForm';
import { useTechnique } from '@/lib/queries';

export default function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = useTechnique(id);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl p-4">
        <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">기술 수정</h1>
        {isLoading && <p className="text-sm text-foreground-muted">불러오는 중…</p>}
        {error && <p className="text-sm text-danger">{(error as Error).message}</p>}
        {data && <TechniqueForm initial={data} />}
      </main>
    </>
  );
}
