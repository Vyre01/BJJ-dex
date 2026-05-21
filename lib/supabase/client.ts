import { createBrowserClient } from '@supabase/ssr';

function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let cached: ReturnType<typeof makeClient> | null = null;

export function createClient() {
  if (cached) return cached;
  cached = makeClient();
  return cached;
}
