'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    setEmail(null);
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b">
      <div className="flex items-center justify-between px-3 h-12">
        <Link href="/" className="font-bold">GrappleGuide</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/favorites" className={pathname === '/favorites' ? 'font-semibold' : 'text-gray-600'}>★</Link>
          <Link href="/learned" className={pathname === '/learned' ? 'font-semibold' : 'text-gray-600'}>✓</Link>
          {email ? (
            <button type="button" onClick={logout} className="text-gray-600">로그아웃</button>
          ) : (
            <Link href="/login" className="text-gray-600">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
