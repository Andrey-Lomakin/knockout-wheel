import { describe, expect, it } from 'vitest';
import { buildPlayerSrc, parseYandexMusicUrl } from './yandexMusic';

describe('parseYandexMusicUrl', () => {
  it('парсит трек с utm-параметрами', () => {
    const ref = parseYandexMusicUrl(
      'https://music.yandex.ru/album/24223317/track/109407308?utm_source=web&utm_medium=copy_link',
    );
    expect(ref).toEqual({ albumId: '24223317', trackId: '109407308' });
  });

  it('парсит альбом без трека', () => {
    expect(parseYandexMusicUrl('https://music.yandex.ru/album/24223317')).toEqual({
      albumId: '24223317',
    });
  });

  it('возвращает null для невалидной ссылки и пустоты', () => {
    expect(parseYandexMusicUrl('')).toBeNull();
    expect(parseYandexMusicUrl('не ссылка')).toBeNull();
  });
});

describe('buildPlayerSrc', () => {
  it('строит iframe-ссылку для трека', () => {
    expect(buildPlayerSrc({ trackId: '109407308', albumId: '24223317' })).toBe(
      'https://music.yandex.ru/iframe/#track/109407308/24223317',
    );
  });
  it('строит iframe-ссылку для альбома', () => {
    expect(buildPlayerSrc({ albumId: '24223317' })).toBe(
      'https://music.yandex.ru/iframe/#album/24223317',
    );
  });
});