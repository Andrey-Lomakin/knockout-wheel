import { CASINO_CONFIG } from './casinoConfig';

export const CASINO_SPIN_PROBABILITY = 0.6;
export const JACKPOT_PROBABILITY = 0.6;

/** Решает только о запуске автомата. Игровой RNG и веса участников сюда не передаются. */
export function shouldPlayCasino(
  previousWasCasino: boolean,
  random: () => number = Math.random,
  casinoEligible = true,
): boolean {
  return casinoEligible && !previousWasCasino && random() < CASINO_SPIN_PROBABILITY;
}

export type CasinoPhase = 'idle' | 'spinning' | 'result';
export type CasinoReels = readonly [string, string, string];

export interface CasinoOutcome {
  isJackpot: boolean;
  reels: CasinoReels;
}

export interface CasinoState {
  phase: CasinoPhase;
  previousWasCasino: boolean;
  outcome: CasinoOutcome | null;
}

export const INITIAL_CASINO_STATE: CasinoState = {
  phase: 'idle',
  previousWasCasino: false,
  outcome: null,
};

export function createCasinoOutcome(random: () => number = Math.random): CasinoOutcome {
  const isJackpot = random() < JACKPOT_PROBABILITY;
  return {
    isJackpot,
    reels: isJackpot ? CASINO_CONFIG.jackpot : CASINO_CONFIG.miss,
  };
}

export function beginCasinoSpin(
  state: CasinoState,
  random: () => number = Math.random,
  casinoEligible = true,
): CasinoState {
  const active = shouldPlayCasino(state.previousWasCasino, random, casinoEligible);
  return {
    phase: active ? 'spinning' : 'idle',
    previousWasCasino: active,
    outcome: active ? createCasinoOutcome(random) : null,
  };
}

export function completeCasinoSpin(state: CasinoState): CasinoState {
  return state.phase === 'spinning' ? { ...state, phase: 'result' } : state;
}
