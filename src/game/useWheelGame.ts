import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AUTO_SPIN_PAUSE_MS } from './constants';
import { createEntry, loadState, persistState } from './storage';
import { computeElimination, nextAutoAction, selectPodium } from './model';
import type { Announcement } from './model';
import { celebratePlace, celebrateWinner } from '../lib/confetti';
import useLatest from '../hooks/useLatest';
import type { Participant, Weight, WheelParticipant } from './types';

/**
 * Вся логика игры «Колесо выбивания»: состояние, действия и выбранные данные.
 * Компоненты получают только то, что им нужно, через пропсы.
 *
 * Подиум НЕ хранится: он выводится из состава и порядка выбывания (`selectPodium`),
 * поэтому не расходится с реальностью при изменении `enabled` по ходу раунда.
 *
 * Авто-прокрутка: когда включена, после каждого спина (через `handleSpinEnd`)
 * через паузу `AUTO_SPIN_PAUSE_MS` автоматически запускается следующий, пока
 * не останется один участник. Поток управляется через refs и `autoSpinRef`,
 * таймер хранится в `autoTimerRef` — без устаревших замыканий и «неуправляемого» авто-спина.
 */
export function useWheelGame() {
  const [participants, setParticipants] = useState<Participant[]>(() => loadState().participants);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  // Карточка выбывания живёт столько же, сколько задержавшийся сектор: до старта следующего спина.
  // Своего таймера у неё нет намеренно — он бы разъехался с паузой авто-прокрутки.
  const [lastOut, setLastOut] = useState<Announcement | null>(null);
  const [spinDuration, setSpinDuration] = useState(5);
  // Порядок выбывания живёт только в рамках сессии — после перезагрузки сбрасывается.
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  // Выбывший остаётся НА КОЛЕСЕ до следующего спина: иначе сектор исчезает в тот же миг,
  // когда указатель на него встал, и колесо дёргается. В списке участников он уже выбывший.
  const [pendingOutId, setPendingOutId] = useState<string | null>(null);

  // Авто-прокрутка и сигнал запуска спина для колеса.
  const [autoSpin, setAutoSpin] = useState(false);
  // Идёт ли последовательность авто-спинов (стартует по кнопке колеса).
  const [autoActive, setAutoActive] = useState(false);
  const [spinSignal, setSpinSignal] = useState(0);
  const autoSpinRef = useLatest(autoSpin);
  const autoActiveRef = useLatest(autoActive);
  const autoTimerRef = useRef<number>(0);

  const latestParticipants = useLatest(participants);
  const latestEliminated = useLatest(eliminatedIds);

  // Персистим только список участников. Выбывшие и подиум НЕ персистятся:
  // после перезагрузки все снова активны и результаты сброшены.
  useEffect(() => {
    persistState({ participants });
  }, [participants]);

  // Активные участники раунда: включены и ещё не выбыли. Именно их считает шапка.
  const activeParticipants = useMemo(() => {
    const out = new Set(eliminatedIds);
    return participants.filter((p) => p.enabled && !out.has(p.id));
  }, [participants, eliminatedIds]);

  // Состав колеса = активные плюс «задержавшийся» выбывший с прошлого спина.
  // Когда активный остался один, задержку снимаем: иначе колесо показывало бы двоих,
  // кнопка «Крутить» осталась бы активной и следующий спин выбил бы чемпиона.
  const wheelParticipants: WheelParticipant[] = useMemo(() => {
    const toWheel = (list: Participant[]) => list.map((p) => ({ id: p.id, name: p.name, weight: p.weight }));
    if (activeParticipants.length <= 1) return toWheel(activeParticipants);
    const out = new Set(eliminatedIds);
    return toWheel(participants.filter((p) => p.enabled && (!out.has(p.id) || p.id === pendingOutId)));
  }, [participants, eliminatedIds, pendingOutId, activeParticipants]);

  // Подиум — производная величина, не состояние.
  const podium = useMemo(() => selectPodium(participants, eliminatedIds), [participants, eliminatedIds]);

  // Отменяем запланированный авто-спин.
  const cancelAutoTimer = useCallback(() => {
    if (autoTimerRef.current) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = 0;
    }
  }, []);

  // Запрос на один спин: колесо следит за изменением `spinSignal`.
  const requestSpin = useCallback(() => {
    // Убираем с колеса выбывшего на прошлом спине — ровно в момент старта нового.
    setPendingOutId(null);
    setSpinSignal((s) => s + 1);
    setLastResult(null);
    setLastOut(null);
  }, []);

  // Нажатие кнопки в колесе: запускает последовательность авто (если режим включён)
  // или делает одиночный спин. Именно так авто начинает крутить — по кнопке, не автоматически.
  const pressSpin = useCallback(() => {
    if (autoSpinRef()) setAutoActive(true);
    requestSpin();
  }, [requestSpin, autoSpinRef]);

  // Планирует следующий авто-спин через паузу (пока режим и последовательность активны).
  const scheduleNextAutoSpin = useCallback(() => {
    cancelAutoTimer();
    autoTimerRef.current = window.setTimeout(() => {
      autoTimerRef.current = 0;
      if (autoSpinRef() && autoActiveRef()) requestSpin();
    }, AUTO_SPIN_PAUSE_MS);
  }, [cancelAutoTimer, requestSpin, autoSpinRef, autoActiveRef]);

  // Останавливает авто-прокрутку (используется при сбросах/смене списка и переключении режима).
  const stopAuto = useCallback(() => {
    cancelAutoTimer();
    setAutoActive(false);
    setAutoSpin(false);
  }, [cancelAutoTimer]);

  const addParticipants = useCallback(
    (names: string[]) => {
      if (names.length === 0) return;
      stopAuto();
      const entries = names.map((n) => createEntry(n));
      setParticipants((prev) => [...prev, ...entries]);
      setEliminatedIds([]);
      setPendingOutId(null);
      setLastResult(null);
      setLastOut(null);
    },
    [stopAuto],
  );

  // Заменяет весь список участников новыми (используется при открытии шаринг-ссылки).
  const replaceParticipants = useCallback(
    (names: string[]) => {
      if (names.length === 0) return;
      stopAuto();
      const entries = names.map((n) => createEntry(n));
      setParticipants(entries);
      setEliminatedIds([]);
      setPendingOutId(null);
      setLastResult(null);
      setLastOut(null);
    },
    [stopAuto],
  );

  const rename = useCallback((id: string, name: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const setWeight = useCallback((id: string, weight: Weight) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, weight } : p)));
  }, []);

  const toggleEnabled = useCallback((id: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  }, []);

  const remove = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setEliminatedIds((prev) => prev.filter((eliminatedId) => eliminatedId !== id));
  }, []);

  const clear = useCallback(() => {
    stopAuto();
    setParticipants([]);
    setEliminatedIds([]);
    setPendingOutId(null);
    setLastResult(null);
    setLastOut(null);
  }, [stopAuto]);

  const resetRound = useCallback(() => {
    stopAuto();
    setEliminatedIds([]);
    setPendingOutId(null);
    setLastResult(null);
    setLastOut(null);
  }, [stopAuto]);

  // Переключает режим авто-прокрутки (не запускает сам — старт по кнопке колеса).
  const toggleAuto = useCallback(() => {
    cancelAutoTimer();
    setAutoActive(false);
    setAutoSpin((prev) => !prev);
  }, [cancelAutoTimer]);

  // Чистим таймер при размонтировании.
  useEffect(() => () => cancelAutoTimer(), [cancelAutoTimer]);

  const handleSpinStart = useCallback(() => {
    setSpinning(true);
    setLastResult(null);
  }, []);

  const handleSpinEnd = useCallback(
    (p: WheelParticipant) => {
      setSpinning(false);

      // Чистая логика выбивания: выбывший, подсчёт активных и результат.
      const outcome = computeElimination(latestParticipants(), latestEliminated(), p.id, p.name);
      setEliminatedIds(outcome.eliminatedIds);
      setLastResult(outcome.lastResult);
      setLastOut(outcome.announcement);
      // Последний спин не задерживаем: иначе на колесе остались бы двое и чемпион не показался бы.
      setPendingOutId(outcome.stillActive > 1 ? p.id : null);

      // Побочные эффекты (конфетти) — отдельно от чистой модели.
      if (outcome.stillActive === 1) {
        celebrateWinner();
      } else if (outcome.stillActive === 2) {
        celebratePlace();
      }

      // Авто-прокрутка: решение — чистая функция, тут только исполнение.
      switch (nextAutoAction(outcome.stillActive, autoSpinRef(), autoActiveRef())) {
        case 'schedule':
          scheduleNextAutoSpin();
          break;
        case 'stop':
          // Дошли до победителя (или все выбыли) — останавливаем авто полностью.
          setAutoActive(false);
          setAutoSpin(false);
          break;
        case 'idle':
          break;
      }
    },
    [latestParticipants, latestEliminated, autoSpinRef, autoActiveRef, scheduleNextAutoSpin],
  );

  return {
    participants,
    activeCount: activeParticipants.length,
    podium,
    spinning,
    lastResult,
    lastOut,
    pendingOutId,
    spinDuration,
    eliminatedIds,
    wheelParticipants,
    autoSpin,
    autoActive,
    spinSignal,
    setSpinDuration,
    addParticipants,
    replaceParticipants,
    rename,
    setWeight,
    toggleEnabled,
    remove,
    clear,
    resetRound,
    toggleAuto,
    pressSpin,
    stopAuto,
    requestSpin,
    handleSpinStart,
    handleSpinEnd,
  };
}
