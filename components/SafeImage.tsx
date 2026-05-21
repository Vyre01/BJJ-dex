'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

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
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
        {fallbackText}
      </div>
    );
  }

  return <Image src={src} alt={alt} onError={() => setErrored(true)} {...rest} />;
}
