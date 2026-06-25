'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { STORAGE_BUCKET, POSITIONS, CATEGORIES } from '@/lib/constants';
import { techniquesKey } from '@/lib/queries';
import type { Technique, Position, Category, Difficulty } from '@/lib/types';
import { StarRating } from './StarRating';
import { Dropdown } from './Dropdown';
import { ImageUploader, type ImageDraft } from './ImageUploader';
import { publicImageUrl } from '@/lib/image';
import { derivePoster } from '@/lib/gif';
import { useToast } from './Toast';
import { isMockMode } from '@/lib/mock/flag';
import * as mockStore from '@/lib/mock/store';

export function TechniqueForm({ initial }: { initial?: Technique }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState(initial?.name ?? '');
  const [position, setPosition] = useState<Position>((initial?.position as Position) ?? POSITIONS[0]);
  const [category, setCategory] = useState<Category>((initial?.category as Category) ?? CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 3);
  const [steps, setSteps] = useState((initial?.steps ?? []).join('\n'));
  const [details, setDetails] = useState(initial?.details ?? '');
  const [image, setImage] = useState<ImageDraft>(
    initial?.image_path ? { kind: 'existing', url: publicImageUrl(initial.image_path) } : { kind: 'none' },
  );
  const [gifUrl, setGifUrl] = useState(initial?.gif_url ?? '');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast('기술명을 입력하세요.', 'error');
      return;
    }
    setBusy(true);

    // One step per line → trimmed array (null when empty).
    const stepsList = steps.split('\n').map((s) => s.trim()).filter(Boolean);
    const stepsValue = stepsList.length ? stepsList : null;

    // GIF URL → null(빈 값) 정규화. 포스터는 Giphy면 자동 도출, URL이 그대로면 기존 포스터 보존.
    const gifValue = gifUrl.trim() || null;
    const gifPosterValue = !gifValue
      ? null
      : gifValue === (initial?.gif_url ?? null)
        ? initial?.gif_poster ?? derivePoster(gifValue)
        : derivePoster(gifValue);

    if (isMockMode()) {
      try {
        const id = initial?.id ?? crypto.randomUUID();
        const image_path =
          image.kind === 'new'
            ? image.previewUrl
            : image.kind === 'existing'
            ? initial?.image_path ?? null
            : null;
        const now = new Date().toISOString();
        const payload: Technique = {
          id,
          name: name.trim(),
          position,
          category,
          difficulty,
          steps: stepsValue,
          details: details.trim() ? details : null,
          image_path,
          gif_url: gifValue,
          gif_poster: gifPosterValue,
          is_favorite: initial?.is_favorite ?? false,
          is_learned: initial?.is_learned ?? false,
          created_at: initial?.created_at ?? now,
          updated_at: now,
        };
        mockStore.upsert(payload);
        await qc.invalidateQueries({ queryKey: techniquesKey });
        await qc.invalidateQueries({ queryKey: ['technique', id] });
        toast(initial ? '수정됨' : '추가됨', 'success');
        router.push(initial ? `/cards/${id}` : '/');
        router.refresh();
      } finally {
        setBusy(false);
      }
      return;
    }

    const supabase = createClient();

    const id = initial?.id ?? crypto.randomUUID();
    const isNewCard = !initial;
    let imagePath: string | null = initial?.image_path ?? null;
    let uploadedNewPath: string | null = null;

    try {
      if (image.kind === 'new') {
        const path = `${id}.webp`;
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, image.blob, { upsert: true, contentType: 'image/webp' });
        if (error) throw error;
        imagePath = path;
        if (isNewCard) uploadedNewPath = path;
      } else if (image.kind === 'none') {
        imagePath = null;
      }

      const payload = {
        id,
        name: name.trim(),
        position,
        category,
        difficulty,
        steps: stepsValue,
        details: details.trim() ? details : null,
        image_path: imagePath,
        gif_url: gifValue,
        gif_poster: gifPosterValue,
      };

      const { error } = initial
        ? await supabase.from('techniques').update(payload).eq('id', id)
        : await supabase.from('techniques').insert(payload);
      if (error) throw error;

      if (image.kind === 'none' && initial?.image_path) {
        try {
          await supabase.storage.from(STORAGE_BUCKET).remove([initial.image_path]);
        } catch {
          /* 스토리지 삭제 실패는 사용자에게 노출하지 않음 */
        }
      }

      await qc.invalidateQueries({ queryKey: techniquesKey });
      await qc.invalidateQueries({ queryKey: ['technique', id] });
      toast(initial ? '수정됨' : '추가됨', 'success');
      router.push(initial ? `/cards/${id}` : '/');
      router.refresh();
    } catch (e) {
      if (uploadedNewPath) {
        try {
          await supabase.storage.from(STORAGE_BUCKET).remove([uploadedNewPath]);
        } catch {
          /* 정리 실패해도 원본 오류만 사용자에게 노출 */
        }
      }
      toast(`저장 실패: ${(e as Error).message}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    'mt-1.5 w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-foreground-subtle focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25';
  const labelCls = 'text-sm font-medium text-foreground-muted';

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className={labelCls}>기술명</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="예: 트라이앵글 초크"
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={labelCls}>포지션</span>
          <div className="mt-1.5">
            <Dropdown
              ariaLabel="포지션"
              placeholder="포지션"
              clearable={false}
              block
              value={position}
              onChange={(v) => setPosition(v as Position)}
              options={POSITIONS.map((p) => ({ value: p, label: p }))}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <span className={labelCls}>카테고리</span>
          <div className="mt-1.5">
            <Dropdown
              ariaLabel="카테고리"
              placeholder="카테고리"
              clearable={false}
              block
              value={category}
              onChange={(v) => setCategory(v as Category)}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <span className={labelCls}>난이도</span>
        <div className="mt-1.5"><StarRating value={difficulty} onChange={setDifficulty} /></div>
      </div>

      <label className="block">
        <span className={labelCls}>기술 순서</span>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={5}
          placeholder={'한 줄에 한 단계씩 입력하세요.\n예) 상대 손목을 가슴에 고정한다\n엉덩이를 빼며 각도를 튼다'}
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-foreground-subtle">한 줄 = 한 단계. 번호는 자동으로 매겨집니다.</span>
      </label>

      <label className="block">
        <span className={labelCls}>디테일 (마크다운)</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={6}
          className={inputCls + ' font-mono'}
        />
      </label>

      <label className="block">
        <span className={labelCls}>GIF (URL)</span>
        <input
          value={gifUrl}
          onChange={(e) => setGifUrl(e.target.value)}
          placeholder="예: https://media.giphy.com/media/xxxx/giphy.mp4"
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-foreground-subtle">
          호버/탭 시 재생되는 미리보기 영상(mp4) URL. 비우면 GIF 없음.
        </span>
        {gifUrl.trim() && (
          <div className="relative mt-2 aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
            <video
              key={gifUrl.trim()}
              src={gifUrl.trim()}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </label>

      <div>
        <span className={labelCls}>이미지</span>
        <div className="mt-1.5">
          <ImageUploader
            initialUrl={initial?.image_path ? publicImageUrl(initial.image_path) : null}
            onChange={setImage}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
        >
          취소
        </button>
      </div>
    </form>
  );
}
