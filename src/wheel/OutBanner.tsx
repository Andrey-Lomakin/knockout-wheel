import type { Announcement } from '../game/model';

const PLACES = {
  1: { medal: '🥇', caption: 'победитель' },
  3: { medal: '🥉', caption: '3 место' },
} as const;

/**
 * Карточка о том, кто выбыл (или кто победил), поверх нижней части колеса.
 * Показывается, пока живёт `announcement` — то есть до старта следующего спина,
 * ровно как задержавшийся сектор выбывшего. Анимация появления срабатывает сама,
 * потому что между спинами компонент размонтируется.
 */
export default function OutBanner({ announcement }: { announcement: Announcement | null }) {
  if (!announcement) return null;

  const place = announcement.place ? PLACES[announcement.place] : null;

  return (
    <div className="out-banner">
      <span className="out-banner-medal">{place ? place.medal : '✖'}</span>
      <span className="out-banner-name">{announcement.name}</span>
      <span className="out-banner-caption">{place ? place.caption : 'выбывает'}</span>
    </div>
  );
}
