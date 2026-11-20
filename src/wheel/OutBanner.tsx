import type { Announcement } from '../game/model';
import { getPlaceIcon } from '../lib/placeIcons';

const CAPTIONS = { 1: 'победитель', 3: '3 место' } as const;

/**
 * Карточка о том, кто выбыл (или кто победил), поверх нижней части колеса.
 * Показывается, пока живёт `announcement` — то есть до старта следующего спина,
 * ровно как задержавшийся сектор выбывшего. Анимация появления срабатывает сама,
 * потому что между спинами компонент размонтируется.
 */
export default function OutBanner({ announcement }: { announcement: Announcement | null }) {
  if (!announcement) return null;

  const place = announcement.place;

  return (
    <div className="out-banner">
      <span className="out-banner-medal">{place ? getPlaceIcon(place) : '✖'}</span>
      <span className="out-banner-name">{announcement.name}</span>
      <span className="out-banner-caption">{place ? CAPTIONS[place] : 'выбывает'}</span>
    </div>
  );
}
