import { useCallback, useState } from 'react';
import { buildPlayerSrc, parseYandexMusicUrl } from '../lib/yandexMusic';

/** Состояние плеера Яндекс Музыки: ссылка, распознанный src, ошибка, методы. */
export function useMusicPlayer() {
  const [link, setLink] = useState('');
  const [playerSrc, setPlayerSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    const ref = parseYandexMusicUrl(link);
    if (ref) {
      setPlayerSrc(buildPlayerSrc(ref));
      setError(false);
    } else {
      setPlayerSrc(null);
      setError(true);
    }
  }, [link]);

  const reset = useCallback(() => {
    setPlayerSrc(null);
    setLink('');
    setError(false);
  }, []);

  return { link, playerSrc, error, setLink, load, reset };
}