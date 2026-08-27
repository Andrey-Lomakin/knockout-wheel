import { useMusicPlayer } from './useMusicPlayer';
import YandexPlayerFrame from './YandexPlayerFrame';

/** Карточка «Яндекс Музыка»: форма ввода ссылки или встроенный плеер с кнопкой сброса. */
export default function MusicPlayer() {
  const { link, playerSrc, error, setLink, load, reset } = useMusicPlayer();

  return (
    <section className="card music">
      <div className="card-head">
        <h2>Яндекс Музыка</h2>
        {playerSrc && (
          <button className="music-close" onClick={reset} title="Сбросить" aria-label="Сбросить">
            ✕
          </button>
        )}
      </div>

      {playerSrc ? (
        <YandexPlayerFrame playerSrc={playerSrc} />
      ) : (
        <>
          <div className="music-input">
            <input
              type="text"
              placeholder="Ссылка на трек: music.yandex.ru/album/…/track/…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
            <button className="btn" onClick={load}>
              Загрузить
            </button>
          </div>
          {error && (
            <p className="empty">Ссылка не распознана. Вставьте трек из Яндекс Музыки.</p>
          )}
        </>
      )}
    </section>
  );
}