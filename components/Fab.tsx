'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export function Fab() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link
      href="/cards/new"
      aria-label="카드 추가"
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground text-3xl flex items-center justify-center shadow-lg"
    >
      ＋
    </Link>
  );
}
