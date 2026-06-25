/**
 * 유튜브 영상 URL(watch/youtu.be/shorts/embed)에서 11자 영상 ID를 뽑아
 * 임베드 재생용 URL(https://www.youtube.com/embed/<id>)을 만든다.
 * 유튜브 링크가 아니거나 ID를 못 찾으면 null(상세 화면은 이 경우 링크로 폴백).
 */
export function youtubeEmbedUrl(url: string): string | null {
  if (!/youtube\.com|youtu\.be/.test(url)) return null;
  const patterns = [
    /[?&]v=([\w-]{11})/, // watch?v=ID
    /youtu\.be\/([\w-]{11})/, // youtu.be/ID
    /\/shorts\/([\w-]{11})/, // shorts/ID
    /\/embed\/([\w-]{11})/, // embed/ID
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}
