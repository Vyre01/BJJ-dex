import { describe, expect, it } from 'vitest';
import { filterTechniques } from '@/lib/filters';
import type { Technique } from '@/lib/types';

function tech(over: Partial<Technique> = {}): Technique {
  return {
    id: 't1',
    name: '암바',
    position: '클로즈드 가드',
    category: '서브미션',
    difficulty: 3,
    details: null,
    image_path: null,
    is_favorite: false,
    is_learned: false,
    created_at: '',
    updated_at: '',
    ...over,
  };
}

describe('filterTechniques', () => {
  it('필터 없으면 전체 반환', () => {
    const list = [tech({ id: 'a' }), tech({ id: 'b', name: '트라이앵글' })];
    expect(filterTechniques(list, {})).toHaveLength(2);
  });

  it('q는 대소문자 무시 부분 일치 (한글/영문 혼합)', () => {
    const list = [
      tech({ id: 'a', name: '암바(Armbar)' }),
      tech({ id: 'b', name: '트라이앵글' }),
      tech({ id: 'c', name: 'BJJ Kimura' }),
    ];
    expect(filterTechniques(list, { q: 'arm' }).map((t) => t.id)).toEqual(['a']);
    expect(filterTechniques(list, { q: '트라' }).map((t) => t.id)).toEqual(['b']);
    expect(filterTechniques(list, { q: 'KIMURA' }).map((t) => t.id)).toEqual(['c']);
  });

  it('position 정확 일치', () => {
    const list = [
      tech({ id: 'a', position: '마운트' }),
      tech({ id: 'b', position: '백' }),
    ];
    expect(filterTechniques(list, { position: '마운트' }).map((t) => t.id)).toEqual(['a']);
  });

  it('category 정확 일치', () => {
    const list = [
      tech({ id: 'a', category: '서브미션' }),
      tech({ id: 'b', category: '스윕' }),
    ];
    expect(filterTechniques(list, { category: '스윕' }).map((t) => t.id)).toEqual(['b']);
  });

  it('difficulty는 "이상" 필터', () => {
    const list = [
      tech({ id: 'a', difficulty: 1 }),
      tech({ id: 'b', difficulty: 3 }),
      tech({ id: 'c', difficulty: 5 }),
    ];
    expect(filterTechniques(list, { difficulty: 3 }).map((t) => t.id)).toEqual(['b', 'c']);
  });

  it('fav=true면 즐겨찾기만, undefined면 전체', () => {
    const list = [
      tech({ id: 'a', is_favorite: true }),
      tech({ id: 'b', is_favorite: false }),
    ];
    expect(filterTechniques(list, { fav: true }).map((t) => t.id)).toEqual(['a']);
    expect(filterTechniques(list, {}).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('learned 삼분값: true=익힘만, false=미익힘만, undefined=전체', () => {
    const list = [
      tech({ id: 'a', is_learned: true }),
      tech({ id: 'b', is_learned: false }),
    ];
    expect(filterTechniques(list, { learned: true }).map((t) => t.id)).toEqual(['a']);
    expect(filterTechniques(list, { learned: false }).map((t) => t.id)).toEqual(['b']);
    expect(filterTechniques(list, {}).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('여러 필터 AND 결합', () => {
    const list = [
      tech({ id: 'a', position: '마운트', category: '서브미션', difficulty: 4, is_favorite: true }),
      tech({ id: 'b', position: '마운트', category: '서브미션', difficulty: 2, is_favorite: true }),
      tech({ id: 'c', position: '백',    category: '서브미션', difficulty: 5, is_favorite: true }),
    ];
    const out = filterTechniques(list, {
      position: '마운트',
      category: '서브미션',
      difficulty: 3,
      fav: true,
    });
    expect(out.map((t) => t.id)).toEqual(['a']);
  });
});
