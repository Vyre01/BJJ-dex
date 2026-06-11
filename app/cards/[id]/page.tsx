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
import { isMockMode } from '@/lib/mock/flag';

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
      if (t.image_path && !isMockMode()) {
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
      <main className="mx-auto max-w-xl p-4">
        {isLoading && <p className="text-sm text-foreground-muted">불러오는 중…</p>}
        {error && <p className="text-sm text-danger">{(error as Error).message}</p>}
        {t && (
          <article className="space-y-4">
            {t.gif_url ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-muted shadow-lg shadow-black/20">
                <video
                  src={t.gif_url}
                  poster={t.gif_poster ?? undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label={t.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              t.image_path && (
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-muted shadow-lg shadow-black/20">
                  <SafeImage
                    src={publicImageUrl(t.image_path)}
                    alt={t.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                  />
                </div>
              )
            )}
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{t.name}</h1>
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 font-medium">{t.position}</span>
                <span>{t.category}</span>
              </div>
              <StarRating value={t.difficulty} />
            </div>
            <div className="flex gap-2 text-sm">
              {t.is_favorite && <span className="rounded-full bg-favorite/12 px-3 py-1 font-medium text-favorite">★ 즐겨찾기</span>}
              {t.is_learned && <span className="rounded-full bg-learned/12 px-3 py-1 font-medium text-learned">✓ 익힘</span>}
            </div>
            {t.steps && t.steps.length > 0 && (
              <section className="rounded-2xl border border-border bg-surface p-4">
                <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground-muted">
                  <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
                  기술 순서
                </h2>
                <ol className="space-y-2.5">
                  {t.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 font-display text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {t.details && (
              <div className="text-sm leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:rounded [&_strong]:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.details}</ReactMarkdown>
              </div>
            )}
            {authed && (
              <div className="flex gap-2 pt-4">
                <Link
                  href={`/cards/${t.id}/edit`}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
                >
                  수정
                </Link>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/20"
                >
                  삭제
                </button>
              </div>
            )}
          </article>
        )}
      </main>
    </>
  );
}
