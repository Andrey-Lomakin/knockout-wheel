import { useEffect, useMemo, useRef, useState } from 'react';
import type { WheelParticipant } from '../game/types';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import { useMemes } from '../hooks/useMemes';
import { buildSegments } from './wheelModel';
import { drawWheel } from './wheelDraw';
import SpinButton from './SpinButton';
import OutBanner from './OutBanner';
import CasinoOverlay from './casino/CasinoOverlay';
import { useCasinoSpin } from './casino/useCasinoSpin';
import { CASINO_CONFIG } from './casino/casinoConfig';
import type { Announcement } from '../game/model';

interface WheelProps {
  participants: WheelParticipant[];
  /** Активные без задержавшегося выбывшего сектора. */
  activeCount: number;
  spinning: boolean;
  durationSec: number;
  /** Идёт ли последовательность авто-спинов. */
  autoRunning: boolean;
  /** Инкрементируется при каждом запросе спина (кнопка или авто). */
  spinSignal: number;
  /** Меняется при явном сбросе или замене раунда. */
  roundRevision: number;
  /** Кого объявлять карточкой; null — карточки нет. */
  lastOut: Announcement | null;
  /** Задержавшийся на колесе выбывший: его сектор гасим. */
  dimmedId: string | null;
  onSpinRequest: () => void;
  onSpinStart: () => void;
  onSpinEnd: (winner: WheelParticipant) => void;
}

/** Canvas-колесо: рисует сегменты и анимирует вращение. */
export default function Wheel({
  participants,
  activeCount,
  spinning,
  durationSec,
  autoRunning,
  spinSignal,
  roundRevision,
  lastOut,
  dimmedId,
  onSpinRequest,
  onSpinStart,
  onSpinEnd,
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // CSS-размер стороны канваса; обновляется по ResizeObserver, а не читается каждый кадр.
  const [size, setSize] = useState(0);

  const { spinVideo, hasVideos, showRandom, hide } = useMemes();
  const {
    phase: casinoPhase,
    outcome: casinoOutcome,
    beginSpin: beginCasinoSpin,
    beginNormalSpin: beginNormalCasinoSpin,
    completeSpin: completeCasinoSpin,
    reset: resetCasinoSpin,
    getState: getCasinoState,
  } = useCasinoSpin();
  const forceNormalSpinRef = useRef(false);
  const { rotation, runSpin, cancelPendingRespin } = useWheelAnimation({
    participants,
    durationSec,
    spinning,
    onSpinStart: () => {
      if (forceNormalSpinRef.current) {
        forceNormalSpinRef.current = false;
        beginNormalCasinoSpin();
      } else {
        beginCasinoSpin(activeCount === 2);
      }
      onSpinStart();
    },
    onSpinEnd: (winner) => {
      const casinoState = getCasinoState();
      if (casinoState.phase === 'spinning' && casinoState.outcome?.isJackpot) {
        completeCasinoSpin();
        forceNormalSpinRef.current = true;
        return {
          respinDurationSec: CASINO_CONFIG.jackpotRespinSec,
          respinDelayMs: CASINO_CONFIG.jackpotPauseMs,
        };
      }
      completeCasinoSpin();
      onSpinEnd(winner);
    },
    onMemeStart: showRandom,
    // Во время авто-последовательности мем спина остаётся на паузе (тот же), не очищаем.
    // В ручном режиме — очищаем после каждого спина.
    onMemeEnd: autoRunning ? undefined : hide,
  });

  // Запускаем спин по каждому новому сигналу (защита от двойного запуска в StrictMode).
  const handledSignalRef = useRef(spinSignal);
  useEffect(() => {
    if (spinSignal > 0 && spinSignal !== handledSignalRef.current) {
      handledSignalRef.current = spinSignal;
      runSpin();
    }
  }, [spinSignal, runSpin]);

  // Следим за реальным размером канваса — иначе после ресайза окна колесо оставалось бы
  // нарисованным в старом разрешении до следующего спина.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const update = () => setSize(canvas.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const segments = useMemo(() => buildSegments(participants), [participants]);

  // Индекс погасшего сектора: выбывший держится на колесе до следующего спина.
  const dimmedIndex = dimmedId ? participants.findIndex((p) => p.id === dimmedId) : -1;

  // Победитель: остался ровно один участник → вместо кнопки показываем мем.
  const isChampion = participants.length === 1;

  // Когда определился победитель — подхватываем случайный зацикленный мем.
  // `hasVideos` в зависимостях обязателен: победитель мог определиться раньше, чем загрузился
  // манифест, и без этого он навсегда остался бы с запасным 🏆.
  useEffect(() => {
    if (isChampion && hasVideos && !spinVideo) showRandom();
  }, [isChampion, hasVideos, spinVideo, showRandom]);

  useEffect(() => {
    forceNormalSpinRef.current = false;
    cancelPendingRespin();
    resetCasinoSpin();
  }, [roundRevision, resetCasinoSpin, cancelPendingRespin]);

  // Отрисовка колеса при изменении поворота, состава или размера.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawWheel(
      canvas,
      ctx,
      size,
      segments,
      participants.map((p) => p.name),
      rotation,
      dimmedIndex,
    );
  }, [segments, participants, rotation, size, dimmedIndex]);

  // Если авто выключили (не победитель, не крутим) — убираем мем, чтобы вернуть «Крутить».
  useEffect(() => {
    if (!autoRunning && !spinning && !isChampion && spinVideo) hide();
  }, [autoRunning, spinning, isChampion, spinVideo, hide]);

  // Кнопка некликабельна, пока показывается мем (спин или пауза авто).
  const isEmpty = participants.length === 0;
  const buttonDisabled = isEmpty || spinning || !!spinVideo;

  return (
    <div className={`wheel-wrap ${isEmpty ? 'is-empty' : ''}`}>
      <canvas ref={canvasRef} className="wheel-canvas" />
      {isEmpty && <p className="wheel-empty">Добавьте участников</p>}
      <div className="wheel-pointer" />
      <OutBanner announcement={lastOut} />
      <CasinoOverlay phase={casinoPhase} outcome={casinoOutcome} durationSec={durationSec} />
      {isChampion ? (
        <div className="spin-btn champion-meme" aria-label="Победитель">
          {spinVideo ? (
            <video className="spin-video" src={spinVideo} autoPlay loop muted playsInline />
          ) : (
            '🏆'
          )}
        </div>
      ) : (
        <SpinButton
          spinning={spinning}
          disabled={buttonDisabled}
          spinVideo={spinVideo}
          onClick={onSpinRequest}
        />
      )}
    </div>
  );
}
