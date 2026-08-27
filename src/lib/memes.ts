/** Загрузка списка зацикленных мемов из манифеста (public/memes/manifest.json). */

let cache: string[] | null = null;

interface ManifestEntry {
  video: string; // путь относительно public/memes, например "mp4/1181.mp4"
}

/**
 * URL-ы всех мемов. Успешный ответ кешируется навсегда, неудачный — нет:
 * при следующем обращении попытка повторится. Функция никогда не reject-ит —
 * мемы это украшение, из-за них приложение падать не должно.
 */
export async function getMemeVideos(): Promise<string[]> {
  if (cache) return cache;
  const base = import.meta.env.BASE_URL; // уважает base: './' → относительные пути
  try {
    const res = await fetch(`${base}memes/manifest.json`);
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, ManifestEntry>;
    cache = Object.values(data).map((entry) => `${base}memes/${entry.video}`);
    return cache;
  } catch {
    return [];
  }
}

/** Случайный мем из списка (или undefined, если список пуст). */
export function pickRandomVideo(videos: string[]): string | undefined {
  if (videos.length === 0) return undefined;
  return videos[Math.floor(Math.random() * videos.length)];
}
