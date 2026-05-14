'use client';

import { useState } from 'react';
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

  async function pick(file: File) {
    setErr(null);
    try {
      const blob = await compressToWebp(file);
      const previewUrl = URL.createObjectURL(blob);
      const next: ImageDraft = { kind: 'new', file, previewUrl, blob };
      setState(next);
      onChange(next);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  function clear() {
    const next: ImageDraft = { kind: 'none' };
    setState(next);
    onChange(next);
  }

  const url =
    state.kind === 'existing' ? state.url : state.kind === 'new' ? state.previewUrl : null;

  return (
    <div className="space-y-2">
      {url ? (
        <div className="relative w-full aspect-square bg-gray-100 rounded">
          <Image src={url} alt="미리보기" fill className="object-cover rounded" sizes="100vw" unoptimized />
        </div>
      ) : (
        <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
          이미지 없음
        </div>
      )}
      <div className="flex gap-2">
        <label className="rounded-md border px-3 py-1 text-sm cursor-pointer">
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
          <button type="button" onClick={clear} className="rounded-md border px-3 py-1 text-sm">
            제거
          </button>
        )}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
