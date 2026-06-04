import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Technique } from '@/lib/types';

// store 는 모듈 레벨 가변 상태라, 각 테스트마다 모듈을 리셋해 격리한다.
async function freshStore() {
  vi.resetModules();
  return import('@/lib/mock/store');
}

function newTech(over: Partial<Technique> = {}): Technique {
  return {
    id: 'new-1',
    name: '신규기술',
    position: '마운트',
    category: '서브미션',
    difficulty: 3,
    details: null,
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    ...over,
  };
}

describe('mock store', () => {
  let store: typeof import('@/lib/mock/store');

  beforeEach(async () => {
    store = await freshStore();
  });

  it('getAll 은 14개 seed 로 시작', () => {
    expect(store.getAll()).toHaveLength(14);
  });

  it('getAll 반환값을 변형해도 store 에 영향 없음(복사본)', () => {
    const list = store.getAll();
    list[0].name = '변형됨';
    expect(store.getAll()[0].name).not.toBe('변형됨');
  });

  it('getById 로 단건 조회, 없으면 undefined', () => {
    expect(store.getById('mock-armbar')?.name).toBe('암바');
    expect(store.getById('없는id')).toBeUndefined();
  });

  it('toggleFlag 가 해당 필드를 변경', () => {
    store.toggleFlag('mock-omoplata', 'is_favorite', true);
    expect(store.getById('mock-omoplata')?.is_favorite).toBe(true);
    store.toggleFlag('mock-omoplata', 'is_favorite', false);
    expect(store.getById('mock-omoplata')?.is_favorite).toBe(false);
  });

  it('upsert 가 신규를 맨 앞에 추가', () => {
    store.upsert(newTech({ id: 'new-1' }));
    const all = store.getAll();
    expect(all).toHaveLength(15);
    expect(all[0].id).toBe('new-1');
  });

  it('upsert 가 기존 id 를 갱신(개수 불변)', () => {
    store.upsert(newTech({ id: 'mock-armbar', name: '암바수정' }));
    expect(store.getAll()).toHaveLength(14);
    expect(store.getById('mock-armbar')?.name).toBe('암바수정');
  });

  it('remove 가 해당 id 를 삭제', () => {
    store.remove('mock-armbar');
    expect(store.getAll()).toHaveLength(13);
    expect(store.getById('mock-armbar')).toBeUndefined();
  });

  it('toggleFlag 는 seed 원본을 변형하지 않음', async () => {
    store.toggleFlag('mock-omoplata', 'is_favorite', true);
    const { SEED_TECHNIQUES } = await import('@/lib/mock/seed');
    expect(SEED_TECHNIQUES.find((t) => t.id === 'mock-omoplata')?.is_favorite).toBe(false);
  });
});
