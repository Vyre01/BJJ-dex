'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { SafeImage } from '@/components/SafeImage';
import { StarRating } from '@/components/StarRating';
import { useTechnique, useDeleteTechnique } from '@/lib/queries';
import { publicImageUrl, deleteImage } from '@/lib/image';
import { useToast } from '@/components/Toast';

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { data: t, isLoading, error } = useTechnique(id);
  const del = useDeleteTechnique();
  const { user } = useAuth();
  const authed = !!user;

  async function onDelete() {
    if (!t) return;
    if (!confirm(`"${t.name}" 카드를 삭제할까요?`)) return;
    try {
      if (t.image_path) {
        try { await deleteImage(t.image_path); } catch { /* 이미지 실패해도 레코드 삭제 진행 */ }
      }
      await del.mutateAsync(t.id);
      toast('삭제됨', 'success');
      router.push('/');
      router.refresh();
    } catch (e) {
      toast(`삭제 실패: ${(e as Error).message}`, 'error');
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto p-4">
        {isLoading && <p className="text-sm text-foreground-muted">불러오는 중…</p>}
        {error && <p className="text-sm text-danger">{(error as Error).message}</p>}
        {t && (
          <article className="space-y-3">
            {t.image_path && (
              <div className="relative w-full aspect-square bg-surface-muted rounded overflow-hidden">
                <SafeImage
                  src={publicImageUrl(t.image_path)}
                  alt={t.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold">{t.name}</h1>
            <div className="text-sm text-foreground-muted">{t.position} · {t.category}</div>
            <StarRating value={t.difficulty} />
            <div className="flex gap-2 text-sm">
              {t.is_favorite && <span className="px-2 py-0.5 rounded bg-favorite/10 text-favorite">★ 즐겨찾기</span>}
              {t.is_learned && <span className="px-2 py-0.5 rounded bg-learned/10 text-learned">✓ 익힘</span>}
            </div>
            {t.details && (
              <div className="text-sm leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:rounded [&_strong]:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.details}</ReactMarkdown>
              </div>
            )}
            {authed && (
              <div className="flex gap-2 pt-4">
                <Link href={`/cards/${t.id}/edit`} className="rounded-md border border-border px-3 py-1 text-sm">수정</Link>
                <button type="button" onClick={onDelete} className="rounded-md border border-border px-3 py-1 text-sm text-danger">삭제</button>
              </div>
            )}
          </article>
        )}
      </main>
    </>
  );
}
