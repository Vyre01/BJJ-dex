'use client';

import { useRef, useState } from 'react';
import { SafeImage } from './SafeImage';

type Props = {
  gifUrl?: string | null;
  gifPoster?: string | null;
  imageSrc: string | null;
  alt: string;
};

/**
 * Card media area. When a technique has a `gifUrl` it shows a static poster and
 * plays the clip on hover (desktop) or tap (mobile); otherwise it falls back to
 * the regular image. Uses a plain <video> (not next/image) so animation is kept
 * and no remote-image config is required.
 */
export function TechniqueMedia({ gifUrl, gifPoster, imageSrc, alt }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  if (!gifUrl) {
    return (
      <SafeImage
        src={imageSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    );
  }

  function play() {
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setPlaying(true)).catch(() => {});
  }

  function stop() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
  }

  function toggle(e: React.MouseEvent) {
    // Card is wrapped in a Link — don't navigate when tapping the play badge.
    e.preventDefault();
    e.stopPropagation();
    if (playing) stop();
    else play();
  }

  return (
    <div className="absolute inset-0" onMouseEnter={play} onMouseLeave={stop}>
      <video
        ref={videoRef}
        poster={gifPoster ?? undefined}
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      >
        <source src={gifUrl} type="video/mp4" />
      </video>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? '재생 정지' : 'GIF 재생'}
        className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-colors hover:bg-black/75"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        GIF
      </button>
    </div>
  );
}
