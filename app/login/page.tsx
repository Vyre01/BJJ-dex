'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next');
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast(`로그인 실패: ${error.message}`, 'error');
      return;
    }
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/';
    router.replace(safeNext);
    router.refresh();
  }

  const inputCls =
    'w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-foreground-subtle focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25';

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center p-4">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/30">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-learned font-display text-sm font-extrabold text-primary-foreground shadow-md shadow-primary/30">
            GG
          </span>
          <h1 className="font-display text-xl font-extrabold tracking-tight">로그인</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className={inputCls}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className={inputCls}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? '로그인 중…' : '로그인'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-foreground-muted">불러오는 중…</p>}>
      <LoginForm />
    </Suspense>
  );
}
