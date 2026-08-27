interface SpinButtonProps {
  spinning: boolean;
  disabled: boolean;
  /** Текущий спин-мем (зацикленное видео), если уже выбран. */
  spinVideo: string | null;
  onClick: () => void;
}

/** Центральная кнопка колеса: крутить / крутим + рандомный мем. */
export default function SpinButton({ spinning, disabled, spinVideo, onClick }: SpinButtonProps) {
  return (
    <button className="spin-btn" onClick={onClick} disabled={disabled}>
      {spinning && spinVideo ? (
        <video className="spin-video" src={spinVideo} autoPlay loop muted playsInline />
      ) : spinning ? (
        'Крутим…'
      ) : (
        'Крутить'
      )}
    </button>
  );
}