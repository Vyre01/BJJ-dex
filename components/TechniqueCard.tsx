'use client';

import Link from 'next/link';
import type { Technique } from '@/lib/types';
import { publicImageUrl } from '@/lib/image';
import { useToggleFlag } from '@/lib/queries';
import { useAuth } from './AuthProvider';
import { StarRating } from './StarRating';
import { TechniqueMedia } from './TechniqueMedia';

export function TechniqueCard({ t }: { t: Technique }) {
  const toggle = useToggleFlag();
  const { user } = useAuth();
  const authed = !!user;

  const imgSrc = t.image_path ? publicImageUrl(t.image_path) : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-xl hover:shadow-primary/10">
      <Link href={`/cards/${t.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-muted">
          <TechniqueMedia gifUrl={t.gif_url} gifPoster={t.gif_poster} imageSrc={imgSrc} alt={t.name} />
          {/* legibility scrim + depth on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 opacity-80 transition-opacity group-hover:opacity-100" />

          {/* difficulty badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 backdrop-blur-sm">
            <StarRating value={t.difficulty} size="sm" />
          </div>
        </div>

        <div className="p-3">
          <div className="truncate font-semibold leading-snug text-foreground" title={t.name}>
            {t.name}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground-muted">
            <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 font-medium text-foreground-muted">
              {t.position}
            </span>
            <span className="truncate">{t.category}</span>
          </div>
        </div>
      </Link>

      {authed && (
        <div className="absolute right-2 top-2 flex gap-1.5">
          <Link
            href={`/cards/${t.id}/edit`}
            aria-label="수정"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-black/60 hover:text-white focus-visible:opacity-100 active:scale-95 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <IconToggle
            label={t.is_favorite ? '즐겨찾기 해제' : '즐겨찾기'}
            active={t.is_favorite}
            activeColor="favorite"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ id: t.id, field: 'is_favorite', value: !t.is_favorite })}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill={t.is_favorite ? 'currentColor' : 'none'}>
              <path
                d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.9 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </IconToggle>

          <IconToggle
            label={t.is_learned ? '익힘 해제' : '익힘'}
            active={t.is_learned}
            activeColor="learned"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ id: t.id, field: 'is_learned', value: !t.is_learned })}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconToggle>
        </div>
      )}
    </div>
  );
}

function IconToggle({
  label,
  active,
  activeColor,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  activeColor: 'favorite' | 'learned';
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeCls =
    activeColor === 'favorite'
      ? 'bg-favorite text-primary-foreground shadow-favorite/40'
      : 'bg-learned text-primary-foreground shadow-learned/40';
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={
        'flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-60 ' +
        (active
          ? activeCls + ' shadow-lg'
          : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white')
      }
    >
      {children}
    </button>
  );
}
