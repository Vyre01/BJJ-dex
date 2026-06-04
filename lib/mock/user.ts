import type { User } from '@supabase/supabase-js';

/**
 * mock 모드에서 AuthProvider 가 즉시 반환할 가짜 유저.
 * auth 게이트 컴포넌트는 user 존재 여부와 email 만 읽으므로 최소 필드만 채운다.
 */
export const MOCK_USER = {
  id: 'mock-user',
  email: 'designer@grappleguide.local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
} as unknown as User;
