import { afterEach, describe, expect, it } from 'vitest';

const ORIG = {
  use: process.env.NEXT_PUBLIC_USE_MOCK,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_USE_MOCK = ORIG.use;
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIG.url;
});

describe('isMockMode', () => {
  it('NEXT_PUBLIC_USE_MOCK=true 면 true', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = 'true';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://real.supabase.co';
    const { isMockMode } = await import('@/lib/mock/flag');
    expect(isMockMode()).toBe(true);
  });

  it('SUPABASE_URL 이 없으면 true', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    const { isMockMode } = await import('@/lib/mock/flag');
    expect(isMockMode()).toBe(true);
  });

  it('SUPABASE_URL 있고 플래그 없으면 false (실 DB)', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://real.supabase.co';
    const { isMockMode } = await import('@/lib/mock/flag');
    expect(isMockMode()).toBe(false);
  });
});
