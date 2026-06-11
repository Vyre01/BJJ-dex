'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { compressToWebp } from '@/lib/image';

export type ImageDraft =
  | { kind: 'none' }
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; previewUrl: string; blob: Blob };

export function ImageUploader({
  initialUrl,
  onChange,
}: {
  initialUrl: string | null;
  onChange: (d: ImageDraft) => void;
}) {
  const [state, setState] = useState<ImageDraft>(
    initialUrl ? { kind: 'existing', url: initialUrl } : { kind: 'none' },
  );
  const [err, setErr] = useState<string | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  async function pick(file: File) {
    setErr(null);
    try {
      const blob = await compressToWebp(file);
      const previewUrl = URL.createObjectURL(blob);
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = previewUrl;
      const next: ImageDraft = { kind: 'new', file, previewUrl, blob };
      setState(next);
      onChange(next);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  function clear() {
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    lastUrlRef.current = null;
    const next: ImageDraft = { kind: 'none' };
    setState(next);
    onChange(next);
  }

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    };
  }, []);

  const url =
    state.kind === 'existing' ? state.url : state.kind === 'new' ? state.previewUrl : null;

  return (
    <div className="space-y-2">
      {url ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
          <Image src={url} alt="미리보기" fill className="object-cover" sizes="100vw" unoptimized />
        </div>
      ) : (
        <div className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-muted text-foreground-subtle">
          <span className="font-display text-3xl font-extrabold tracking-tight text-foreground-subtle/30">GG</span>
          <span className="text-xs">이미지 없음</span>
        </div>
      )}
      <div className="flex gap-2">
        <label className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground">
          이미지 선택
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pick(f);
            }}
          />
        </label>
        {state.kind !== 'none' && (
          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            제거
          </button>
        )}
      </div>
      {err && <p className="text-sm text-danger">{err}</p>}
    </div>
  );
}
