import { describe, expect, it } from 'vitest';
import { derivePoster } from '@/lib/gif';

describe('derivePoster', () => {
  it('Giphy mp4 URL이면 giphy_s.gif 포스터를 도출한다', () => {
    expect(derivePoster('https://media.giphy.com/media/abc123/giphy.mp4')).toBe(
      'https://media.giphy.com/media/abc123/giphy_s.gif',
    );
  });

  it('media 서브도메인 숫자도 허용한다', () => {
    expect(derivePoster('https://media2.giphy.com/media/xyz/giphy.mp4')).toBe(
      'https://media2.giphy.com/media/xyz/giphy_s.gif',
    );
  });

  it('Giphy가 아닌 mp4면 null', () => {
    expect(derivePoster('https://example.com/clip.mp4')).toBeNull();
  });

  it('Giphy gif(비 mp4)면 null', () => {
    expect(derivePoster('https://media.giphy.com/media/abc123/giphy.gif')).toBeNull();
  });

  it('빈 문자열이면 null', () => {
    expect(derivePoster('')).toBeNull();
  });
});
