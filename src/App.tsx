import { useCallback, useEffect, useRef } from 'react';
import { useWheelGame } from './game/useWheelGame';
import AddParticipants from './participants/AddParticipants';
import ParticipantList from './participants/ParticipantList';
import WheelStage from './wheel/WheelStage';
import MusicPlayer from './music/MusicPlayer';
import { buildShareUrl, clearShareParams, parseShareNames } from './lib/share';
import './App.css';

export default function App() {
  const game = useWheelGame();
  const { replaceParticipants } = game;

  // Применяет список из URL, если параметр `users` изменился (защита от повторов).
  const appliedSearchRef = useRef<string | null>(null);

  const applyFromUrl = useCallback(() => {
    const search = window.location.search;
    if (search === appliedSearchRef.current) return;
    const names = parseShareNames(search);
    if (names) {
      replaceParticipants(names);
      // Убираем параметры из URL, чтобы при обновлении не вернулись старые юзеры.
      clearShareParams();
      appliedSearchRef.current = '';
    }
  }, [replaceParticipants]);

  // Читаем параметры при открытии и при навигации (back/forward) в том же окне.
  useEffect(() => {
    applyFromUrl();
    window.addEventListener('popstate', applyFromUrl);
    return () => window.removeEventListener('popstate', applyFromUrl);
  }, [applyFromUrl]);

  const handleShare = useCallback(() => {
    const names = game.participants.map((p) => p.name.trim()).filter(Boolean);
    if (names.length === 0) return;
    const url = buildShareUrl(names);
    navigator.clipboard?.writeText(url).catch(() => {});
  }, [game.participants]);

  return (
    <div className="page">
      <header className="header">
        <h1>Колесо выбивания</h1>
        <span className="count">
          Активных: <b>{game.wheelParticipants.length}</b> из {game.participants.length}
        </span>
      </header>

      <div className="layout">
        <aside className="panel">
          <MusicPlayer />
          <AddParticipants onAdd={game.addParticipants} />
          <ParticipantList
            participants={game.participants}
            eliminatedIds={game.eliminatedIds}
            podium={game.podium}
            onRename={game.rename}
            onWeight={game.setWeight}
            onToggle={game.toggleEnabled}
            onRemove={game.remove}
            onClear={game.clear}
            onShare={handleShare}
          />
        </aside>

        <main className="stage">
          <WheelStage
            participants={game.wheelParticipants}
            spinning={game.spinning}
            durationSec={game.spinDuration}
            spinDuration={game.spinDuration}
            lastResult={game.lastResult}
            autoSpin={game.autoSpin}
            autoRunning={game.autoActive}
            spinSignal={game.spinSignal}
            onDurationChange={game.setSpinDuration}
            onAutoChange={game.toggleAuto}
            onSpinRequest={game.pressSpin}
            onSpinStart={game.handleSpinStart}
            onSpinEnd={game.handleSpinEnd}
            onResetRound={game.resetRound}
          />
        </main>
      </div>
    </div>
  );
}