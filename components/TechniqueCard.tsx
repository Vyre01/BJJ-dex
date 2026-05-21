'use client';

import Link from 'next/link';
import type { Technique } from '@/lib/types';
import { publicImageUrl } from '@/lib/image';
import { useToggleFlag } from '@/lib/queries';
import { useAuth } from './AuthProvider';
import { StarRating } from './StarRating';
import { SafeImage } from './SafeImage';

export function TechniqueCard({ t }: { t: Technique }) {
  const toggle = useToggleFlag();
  const { user } = useAuth();
  const authed = !!user;

  const imgSrc = t.image_path ? publicImageUrl(t.image_path) : null;

  return (
    <div className="relative rounded-lg bg-surface shadow overflow-hidden">
      <Link href={`/cards/${t.id}`} className="block">
        <div className="aspect-square bg-surface-muted relative">
          <SafeImage src={imgSrc} alt={t.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
        </div>
        <div className="p-2">
          <StarRating value={t.difficulty} size="sm" />
          <div className="text-sm font-medium truncate" title={t.name}>{t.name}</div>
          <div className="text-xs text-foreground-muted truncate">{t.position} · {t.category}</div>
        </div>
      </Link>

      <div className="absolute top-1 right-1 flex gap-1">
        <button
          type="button"
          aria-label={t.is_favorite ? '즐겨찾기 해제' : '즐겨찾기'}
          disabled={!authed || toggle.isPending}
          onClick={(e) => {
            e.preventDefault();
            toggle.mutate({ id: t.id, field: 'is_favorite', value: !t.is_favorite });
          }}
          className={
            'rounded-full bg-surface/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
            (t.is_favorite ? 'text-favorite' : 'text-foreground-subtle')
          }
        >
          ★
        </button>
        <button
          type="button"
          aria-label={t.is_learned ? '익힘 해제' : '익힘'}
          disabled={!authed || toggle.isPending}
          onClick={(e) => {
            e.preventDefault();
            toggle.mutate({ id: t.id, field: 'is_learned', value: !t.is_learned });
          }}
          className={
            'rounded-full bg-surface/90 w-7 h-7 text-sm shadow disabled:opacity-50 ' +
            (t.is_learned ? 'text-learned' : 'text-foreground-subtle')
          }
        >
          ✓
        </button>
      </div>
    </div>
  );
}
