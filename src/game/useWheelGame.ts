import { useCallback, useEffect, useMemo, useState } from 'react';
import { EMPTY_PODIUM } from './constants';
import { createEntry, loadState, persistState, restoreIdCounter } from './storage';
import { computeElimination } from './model';
import { celebratePlace, celebrateWinner } from '../lib/confetti';
import useLatest from '../hooks/useLatest';
import type { Participant, Podium, Weight, WheelParticipant } from './types';

/**
 * Вся логика игры «Колесо выбивания»: состояние, действия и выбранные данные.
 * Компоненты получают только то, что им нужно, через пропсы.
 */
export function useWheelGame() {
  const [participants, setParticipants] = useState<Participant[]>(() => loadState().participants);
  // Подиум живёт только в рамках сессии — после перезагрузки страницы сбрасывается.
  const [podium, setPodium] = useState<Podium>(EMPTY_PODIUM);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [spinDuration, setSpinDuration] = useState(5);
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);

  const latestParticipants = useLatest(participants);
  const latestEliminated = useLatest(eliminatedIds);
  const latestPodium = useLatest(podium);

  // Синхронизируем счётчик id после загрузки.
  useEffect(() => {
    restoreIdCounter(participants);
  }, [participants]);

  // Персистим только список участников. Выбывшие и подиум НЕ персистятся:
  // после перезагрузки все снова активны и результаты сброшены.
  useEffect(() => {
    persistState({ participants });
  }, [participants]);

  // Активные участники текущего раунда (включены и не выбыли).
  const activeParticipants = useMemo(
    () => participants.filter((p) => p.enabled && !eliminatedIds.includes(p.id)),
    [participants, eliminatedIds],
  );

  const wheelParticipants: WheelParticipant[] = useMemo(
    () => activeParticipants.map((p) => ({ id: p.id, name: p.name, weight: p.weight })),
    [activeParticipants],
  );

  const addParticipants = useCallback((names: string[]) => {
    if (names.length === 0) return;
    setParticipants((prev) => [...prev, ...names.map((n) => createEntry(n))]);
    setEliminatedIds([]);
    setPodium(EMPTY_PODIUM);
    setLastResult(null);
  }, []);

  // Заменяет весь список участников новыми (используется при открытии шаринг-ссылки).
  const replaceParticipants = useCallback((names: string[]) => {
    if (names.length === 0) return;
    setParticipants(names.map((n) => createEntry(n)));
    setEliminatedIds([]);
    setPodium(EMPTY_PODIUM);
    setLastResult(null);
  }, []);

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
  }, []);

  const clear = useCallback(() => {
    setParticipants([]);
    setEliminatedIds([]);
    setPodium(EMPTY_PODIUM);
    setLastResult(null);
  }, []);

  const resetRound = useCallback(() => {
    setEliminatedIds([]);
    setPodium(EMPTY_PODIUM);
    setLastResult(null);
  }, []);

  const handleSpinStart = useCallback(() => {
    setSpinning(true);
    setLastResult(null);
  }, []);

  const handleSpinEnd = useCallback(
    (p: WheelParticipant) => {
      setSpinning(false);

      // Чистая логика выбивания: выбывший, подсчёт активных, результат и подиум.
      const outcome = computeElimination(
        latestParticipants(),
        latestEliminated(),
        latestPodium(),
        p.id,
        p.name,
      );
      setEliminatedIds(outcome.eliminatedIds);
      setPodium(outcome.podium);
      setLastResult(outcome.lastResult);

      // Побочные эффекты (конфетти) — отдельно от чистой модели.
      if (outcome.stillActive === 1) {
        celebrateWinner();
      } else if (outcome.stillActive === 2) {
        celebratePlace();
      }
    },
    [latestParticipants, latestEliminated, latestPodium],
  );

  return {
    participants,
    podium,
    spinning,
    lastResult,
    spinDuration,
    eliminatedIds,
    wheelParticipants,
    setSpinDuration,
    addParticipants,
    replaceParticipants,
    rename,
    setWeight,
    toggleEnabled,
    remove,
    clear,
    resetRound,
    handleSpinStart,
    handleSpinEnd,
  };
}