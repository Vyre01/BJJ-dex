'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/flag';
import { useAuth } from './AuthProvider';

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const email = user?.email ?? null;

  async function logout() {
    if (isMockMode()) return;
    await createClient().auth.signOut();
  }

  return (
    <header className="glass sticky top-0 z-20 border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between px-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-learned font-display text-sm font-extrabold text-primary-foreground shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
            GG
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Grapple<span className="text-primary">Guide</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavIcon href="/favorites" label="즐겨찾기" active={pathname === '/favorites'} color="favorite">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={pathname === '/favorites' ? 'currentColor' : 'none'}>
              <path
                d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.9 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </NavIcon>
          <NavIcon href="/learned" label="익힘" active={pathname === '/learned'} color="learned">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavIcon>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          {email ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavIcon({
  href,
  label,
  active,
  color,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  color: 'favorite' | 'learned';
  children: React.ReactNode;
}) {
  const activeCls = color === 'favorite' ? 'bg-favorite/12 text-favorite' : 'bg-learned/12 text-learned';
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={
        'flex h-9 w-9 items-center justify-center rounded-full transition-colors ' +
        (active ? activeCls : 'text-foreground-subtle hover:bg-surface-muted hover:text-foreground')
      }
    >
      {children}
    </Link>
  );
}
