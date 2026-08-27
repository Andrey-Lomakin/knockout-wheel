interface ResultPanelProps {
  lastResult: string | null;
  onResetRound: () => void;
}

/** Результат последнего спина + кнопка «Новый раунд». Награды — в списке участников. */
export default function ResultPanel({ lastResult, onResetRound }: ResultPanelProps) {
  return (
    <div className="result" aria-live="polite">
      {lastResult ? (
        <p className="flash">{lastResult}</p>
      ) : (
        <p className="hint">Нажмите «Крутить», чтобы выбить участника.</p>
      )}
      {lastResult && (
        <button className="link-btn reset" onClick={onResetRound}>
          Новый раунд
        </button>
      )}
    </div>
  );
}