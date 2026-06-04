import type { Technique } from '@/lib/types';
import { SEED_TECHNIQUES } from './seed';

// seed 의 deep copy. 전체 페이지 새로고침 시 모듈이 재평가되어 seed 로 복귀한다.
let techniques: Technique[] = SEED_TECHNIQUES.map((t) => ({ ...t }));

export function getAll(): Technique[] {
  return techniques.map((t) => ({ ...t }));
}

export function getById(id: string): Technique | undefined {
  const found = techniques.find((t) => t.id === id);
  return found ? { ...found } : undefined;
}

export function toggleFlag(
  id: string,
  field: 'is_favorite' | 'is_learned',
  value: boolean,
): void {
  techniques = techniques.map((t) => (t.id === id ? { ...t, [field]: value } : t));
}

export function upsert(t: Technique): void {
  const idx = techniques.findIndex((x) => x.id === t.id);
  if (idx >= 0) {
    techniques = techniques.map((x) => (x.id === t.id ? { ...t } : x));
  } else {
    techniques = [{ ...t }, ...techniques];
  }
}

export function remove(id: string): void {
  techniques = techniques.filter((t) => t.id !== id);
}
