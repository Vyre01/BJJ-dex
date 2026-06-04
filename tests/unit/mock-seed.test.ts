import { describe, expect, it } from 'vitest';
import { SEED_TECHNIQUES } from '@/lib/mock/seed';
import { filterTechniques } from '@/lib/filters';
import { POSITIONS, CATEGORIES } from '@/lib/constants';

describe('SEED_TECHNIQUES', () => {
  it('14개', () => {
    expect(SEED_TECHNIQUES).toHaveLength(14);
  });

  it('id 가 모두 고유', () => {
    const ids = SEED_TECHNIQUES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('난이도 1~5 가 모두 등장', () => {
    const diffs = new Set(SEED_TECHNIQUES.map((t) => t.difficulty));
    expect([1, 2, 3, 4, 5].every((d) => diffs.has(d as 1 | 2 | 3 | 4 | 5))).toBe(true);
  });

  it('즐겨찾기/익힘/이미지/디테일 상태가 혼재', () => {
    expect(SEED_TECHNIQUES.some((t) => t.is_favorite)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => !t.is_favorite)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.is_learned)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => !t.is_learned)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.image_path !== null)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.image_path === null)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.details !== null)).toBe(true);
    expect(SEED_TECHNIQUES.some((t) => t.details === null)).toBe(true);
  });

  it('position/category 값이 모두 유효(constants 내)', () => {
    for (const t of SEED_TECHNIQUES) {
      expect(POSITIONS).toContain(t.position);
      expect(CATEGORIES).toContain(t.category);
    }
  });

  it('즐겨찾기 필터가 비어있지 않음', () => {
    expect(filterTechniques(SEED_TECHNIQUES, { fav: true }).length).toBeGreaterThan(0);
  });

  it('익힘 필터가 비어있지 않음', () => {
    expect(filterTechniques(SEED_TECHNIQUES, { learned: true }).length).toBeGreaterThan(0);
  });
});
