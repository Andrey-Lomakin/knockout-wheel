/** Парсинг ссылок Яндекс Музыки и сборка URL встраиваемого плеера. */

export interface YandexTrackRef {
  trackId?: string;
  albumId?: string;
}

/** Извлекает id трека/альбома из URL вида .../album/{album}/track/{track}. */
export function parseYandexMusicUrl(raw: string): YandexTrackRef | null {
  const text = raw.trim();
  if (!text) return null;

  const track = text.match(/\/album\/(\d+)\/track\/(\d+)/);
  if (track) return { albumId: track[1], trackId: track[2] };

  const album = text.match(/\/album\/(\d+)/);
  if (album) return { albumId: album[1] };

  return null;
}

/** Собирает src для iframe-плеера Яндекс Музыки. */
export function buildPlayerSrc(ref: YandexTrackRef): string {
  if (ref.trackId) {
    const album = ref.albumId ? `/${ref.albumId}` : '';
    return `https://music.yandex.ru/iframe/#track/${ref.trackId}${album}`;
  }
  if (ref.albumId) {
    return `https://music.yandex.ru/iframe/#album/${ref.albumId}`;
  }
  return '';
}