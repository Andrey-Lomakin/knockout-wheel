import { useCallback, useEffect, useRef, useState } from 'react';
import { getMemeVideos, pickRandomVideo } from '../lib/memes';

/**
 * Кэш рандомных мемов для кнопки «Крутить»: один раз загружает список
 * и умеет показать/скрыть случайный зацикленный мем во время спина.
 */
export function useMemes() {
  const [videos, setVideos] = useState<string[]>([]);
  const [spinVideo, setSpinVideo] = useState<string | null>(null);
  const videosRef = useRef<string[]>([]);
  videosRef.current = videos;

  useEffect(() => {
    getMemeVideos().then(setVideos);
  }, []);

  const showRandom = useCallback(() => setSpinVideo(pickRandomVideo(videosRef.current) ?? null), []);
  const hide = useCallback(() => setSpinVideo(null), []);

  return { spinVideo, hasVideos: videos.length > 0, showRandom, hide };
}