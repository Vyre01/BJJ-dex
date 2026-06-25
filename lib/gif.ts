/**
 * Giphy mp4 핫링크(`.../giphy.mp4`)면 정지 프레임(poster) URL(`.../giphy_s.gif`)을
 * 도출한다. Giphy 패턴이 아니면 null(이 경우 비디오 첫 프레임이 그대로 노출됨).
 * seed.ts 의 giphy() 헬퍼가 만드는 URL 형식과 짝을 이룬다.
 */
export function derivePoster(url: string): string | null {
  const m = url.match(/^(https:\/\/media\d*\.giphy\.com\/media\/[^/]+\/)giphy\.mp4(?:\?.*)?$/);
  return m ? `${m[1]}giphy_s.gif` : null;
}
