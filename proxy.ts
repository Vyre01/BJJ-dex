import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isMockMode } from '@/lib/mock/flag';

export async function proxy(req: NextRequest) {
  // mock 모드는 항상 로그인 상태로 취급한다 (AuthProvider 와 동일). 실제 세션 검사를 건너뛴다.
  if (isMockMode()) return NextResponse.next({ request: req });

  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const needsAuth =
    path === '/cards/new' || /^\/cards\/[^/]+\/edit$/.test(path);

  if (needsAuth && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/cards/:path*'],
};
