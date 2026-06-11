'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { isMockMode } from '@/lib/mock/flag';

type Props = Omit<ImageProps, 'src' | 'onError'> & {
  src: string | null | undefined;
  fallbackText?: string;
};

export function SafeImage({ src, alt, fallbackText = '이미지 없음', ...rest }: Props) {
  const [errored, setErrored] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);
  if (lastSrc !== src) {
    setLastSrc(src);
    setErrored(false);
  }

  if (!src || errored) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-surface-muted to-surface text-foreground-subtle">
        <span className="font-display text-3xl font-extrabold tracking-tight text-foreground-subtle/30">GG</span>
        <span className="text-xs">{fallbackText}</span>
      </div>
    );
  }

  return <Image src={src} alt={alt} onError={() => setErrored(true)} unoptimized={isMockMode()} {...rest} />;
}
