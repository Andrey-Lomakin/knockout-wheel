import { useCallback, useRef, useState } from 'react';
import {
  beginCasinoSpin,
  completeCasinoSpin,
  INITIAL_CASINO_STATE,
} from './casinoModel';
import type { CasinoState } from './casinoModel';

/** Владеет только визуальным состоянием casino-фичи. Игровое состояние сюда не передаётся. */
export function useCasinoSpin() {
  const [state, setState] = useState<CasinoState>(INITIAL_CASINO_STATE);
  const stateRef = useRef(state);

  const beginSpin = useCallback((casinoEligible: boolean) => {
    const next = beginCasinoSpin(stateRef.current, Math.random, casinoEligible);
    stateRef.current = next;
    setState(next);
  }, []);

  const beginNormalSpin = useCallback(() => {
    const next = { ...INITIAL_CASINO_STATE, previousWasCasino: stateRef.current.previousWasCasino };
    stateRef.current = next;
    setState(next);
  }, []);

  const completeSpin = useCallback(() => {
    const next = completeCasinoSpin(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  const reset = useCallback(() => {
    stateRef.current = INITIAL_CASINO_STATE;
    setState(INITIAL_CASINO_STATE);
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  return {
    phase: state.phase,
    outcome: state.outcome,
    beginSpin,
    beginNormalSpin,
    completeSpin,
    reset,
    getState,
  };
}
