'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const email = user?.email ?? null;

  async function logout() {
    await createClient().auth.signOut();
  }

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-3 h-12">
        <Link href="/" className="font-bold">GrappleGuide</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/favorites" className={pathname === '/favorites' ? 'font-semibold' : 'text-foreground-muted'}>★</Link>
          <Link href="/learned" className={pathname === '/learned' ? 'font-semibold' : 'text-foreground-muted'}>✓</Link>
          {email ? (
            <button type="button" onClick={logout} className="text-foreground-muted">로그아웃</button>
          ) : (
            <Link href="/login" className="text-foreground-muted">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
