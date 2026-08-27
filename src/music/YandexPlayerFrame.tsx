interface YandexPlayerFrameProps {
  playerSrc: string;
}

/** Встроенный iframe-плеер Яндекс Музыки (можно прокручивать). */
export default function YandexPlayerFrame({ playerSrc }: YandexPlayerFrameProps) {
  return (
    <div className="music-playing">
      <iframe
        className="yplayer"
        title="Яндекс Музыка"
        src={playerSrc}
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}