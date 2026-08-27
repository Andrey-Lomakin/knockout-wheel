import { useCallback, useEffect, useState } from 'react';
import { getMemeVideos, pickRandomVideo } from '../lib/memes';
import useLatest from './useLatest';

/**
 * Кэш рандомных мемов для кнопки «Крутить»: один раз загружает список
 * и умеет показать/скрыть случайный зацикленный мем во время спина.
 */
export function useMemes() {
  const [videos, setVideos] = useState<string[]>([]);
  const [spinVideo, setSpinVideo] = useState<string | null>(null);
  const latestVideos = useLatest(videos);

  useEffect(() => {
    let alive = true;
    // getMemeVideos не бросает, но .catch оставлен как страховка от unhandled rejection.
    getMemeVideos()
      .then((list) => {
        if (alive) setVideos(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const showRandom = useCallback(
    () => setSpinVideo(pickRandomVideo(latestVideos()) ?? null),
    [latestVideos],
  );
  const hide = useCallback(() => setSpinVideo(null), []);

  return { spinVideo, hasVideos: videos.length > 0, showRandom, hide };
}
