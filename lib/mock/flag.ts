/**
 * mock 데이터 모드 판정 (단일 진실).
 * - NEXT_PUBLIC_USE_MOCK === 'true' → 강제 mock
 * - NEXT_PUBLIC_SUPABASE_URL 부재/빈값 → mock (DB 연결 전)
 * - 그 외 → 실 DB
 */
export function isMockMode(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return true;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true;
  return false;
}
