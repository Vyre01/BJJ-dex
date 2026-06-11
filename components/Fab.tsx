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
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-learned text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 active:scale-95"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
