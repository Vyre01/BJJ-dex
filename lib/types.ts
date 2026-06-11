import type { POSITIONS, CATEGORIES } from './constants';

export type Position = (typeof POSITIONS)[number];
export type Category = (typeof CATEGORIES)[number];
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Technique {
  id: string;
  name: string;
  position: Position;
  category: Category;
  difficulty: Difficulty;
  details: string | null;
  /** Ordered step-by-step instructions for the technique. */
  steps?: string[] | null;
  image_path: string | null;
  /** Animated preview (mp4 or gif URL). Optional — only some cards have one. */
  gif_url?: string | null;
  /** Static still-frame URL shown until the gif plays (hover/tap). */
  gif_poster?: string | null;
  is_favorite: boolean;
  is_learned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Filters {
  q?: string;
  position?: Position;
  category?: Category;
  difficulty?: Difficulty;
  fav?: boolean;
  learned?: boolean;
}
