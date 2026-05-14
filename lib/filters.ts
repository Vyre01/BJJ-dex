import type { Filters, Technique } from './types';

export function filterTechniques(list: Technique[], f: Filters): Technique[] {
  const q = f.q?.trim().toLowerCase();
  return list.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q)) return false;
    if (f.position && t.position !== f.position) return false;
    if (f.category && t.category !== f.category) return false;
    if (f.difficulty !== undefined && t.difficulty < f.difficulty) return false;
    if (f.fav === true && !t.is_favorite) return false;
    if (f.learned === true && !t.is_learned) return false;
    if (f.learned === false && t.is_learned) return false;
    return true;
  });
}
