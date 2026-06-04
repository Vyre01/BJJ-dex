'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { STORAGE_BUCKET, POSITIONS, CATEGORIES } from '@/lib/constants';
import { techniquesKey } from '@/lib/queries';
import type { Technique, Position, Category, Difficulty } from '@/lib/types';
import { StarRating } from './StarRating';
import { ImageUploader, type ImageDraft } from './ImageUploader';
import { publicImageUrl } from '@/lib/image';
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
  const [details, setDetails] = useState(initial?.details ?? '');
  const [image, setImage] = useState<ImageDraft>(
    initial?.image_path ? { kind: 'existing', url: publicImageUrl(initial.image_path) } : { kind: 'none' },
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast('기술명을 입력하세요.', 'error');
      return;
    }
    setBusy(true);

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
          details: details.trim() ? details : null,
          image_path,
          is_favorite: initial?.is_favorite ?? false,
          is_learned: initial?.is_learned ?? false,
          created_at: initial?.created_at ?? now,
          updated_at: now,
        };
        mockStore.upsert(payload);
        await qc.invalidateQueries({ queryKey: techniquesKey });
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
        details: details.trim() ? details : null,
        image_path: imagePath,
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

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="text-sm">기술명</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm">포지션</span>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value as Position)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">카테고리</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <div>
        <span className="text-sm">난이도</span>
        <div className="mt-1"><StarRating value={difficulty} onChange={setDifficulty} /></div>
      </div>

      <label className="block">
        <span className="text-sm">디테일 (마크다운)</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm"
        />
      </label>

      <div>
        <span className="text-sm">이미지</span>
        <div className="mt-1">
          <ImageUploader
            initialUrl={initial?.image_path ? publicImageUrl(initial.image_path) : null}
            onChange={setImage}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
        >
          {busy ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-4 py-2"
        >
          취소
        </button>
      </div>
    </form>
  );
}
