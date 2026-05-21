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
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl flex items-center justify-center shadow-lg"
    >
      ＋
    </Link>
  );
}
