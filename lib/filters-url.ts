import type { Filters, Position, Category, Difficulty } from './types';
import { POSITIONS, CATEGORIES } from './constants';

export function filtersFromSearchParams(sp: URLSearchParams): Filters {
  const out: Filters = {};
  const q = sp.get('q');
  if (q) out.q = q;

  const pos = sp.get('position');
  if (pos && (POSITIONS as readonly string[]).includes(pos)) out.position = pos as Position;

  const cat = sp.get('category');
  if (cat && (CATEGORIES as readonly string[]).includes(cat)) out.category = cat as Category;

  const diff = sp.get('difficulty');
  if (diff) {
    const n = Number(diff);
    if (Number.isInteger(n) && n >= 1 && n <= 5) out.difficulty = n as Difficulty;
  }

  if (sp.get('fav') === '1') out.fav = true;

  const learned = sp.get('learned');
  if (learned === '1') out.learned = true;
  else if (learned === '0') out.learned = false;

  return out;
}

export function filtersToSearchParams(f: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.position) sp.set('position', f.position);
  if (f.category) sp.set('category', f.category);
  if (f.difficulty) sp.set('difficulty', String(f.difficulty));
  if (f.fav === true) sp.set('fav', '1');
  if (f.learned === true) sp.set('learned', '1');
  else if (f.learned === false) sp.set('learned', '0');
  return sp;
}
