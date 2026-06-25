import { describe, expect, it } from 'vitest';
import { youtubeEmbedUrl } from '@/lib/youtube';

const EMBED = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

describe('youtubeEmbedUrl', () => {
  it('watch?v= 형식', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EMBED);
  });

  it('watch 뒤 추가 파라미터(t, list)도 처리', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=abc')).toBe(EMBED);
  });

  it('youtu.be 단축 + si 파라미터', () => {
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ?si=xyz123')).toBe(EMBED);
  });

  it('shorts 형식', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(EMBED);
  });

  it('이미 embed 형식', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(EMBED);
  });

  it('m.youtube.com 모바일 형식', () => {
    expect(youtubeEmbedUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EMBED);
  });

  it('비유튜브 URL이면 null', () => {
    expect(youtubeEmbedUrl('https://vimeo.com/123456')).toBeNull();
  });

  it('유튜브지만 영상 ID가 없으면 null', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/feed/subscriptions')).toBeNull();
  });

  it('빈 문자열이면 null', () => {
    expect(youtubeEmbedUrl('')).toBeNull();
  });
});
