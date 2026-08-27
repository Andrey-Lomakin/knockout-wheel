interface SpinButtonProps {
  spinning: boolean;
  disabled: boolean;
  /** Текущий спин-мем (зацикленное видео), если выбран. */
  spinVideo: string | null;
  onClick: () => void;
}

/** Центральная кнопка колеса: мем во время спина/авто-паузы, иначе крутить. */
export default function SpinButton({ spinning, disabled, spinVideo, onClick }: SpinButtonProps) {
  return (
    <button className="spin-btn" onClick={onClick} disabled={disabled}>
      {spinVideo ? (
        <video className="spin-video" src={spinVideo} autoPlay loop muted playsInline />
      ) : spinning ? (
        'Крутим…'
      ) : (
        'Крутить'
      )}
    </button>
  );
}