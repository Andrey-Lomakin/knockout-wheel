import { describe, expect, it } from 'vitest';
import {
  beginCasinoSpin,
  CASINO_SPIN_PROBABILITY,
  completeCasinoSpin,
  createCasinoOutcome,
  INITIAL_CASINO_STATE,
  JACKPOT_PROBABILITY,
  shouldPlayCasino,
} from './casinoModel';

describe('casinoModel', () => {
  it('включает оформление в 60% финальных спинов', () => {
    expect(CASINO_SPIN_PROBABILITY).toBe(0.6);
    expect(shouldPlayCasino(false, () => 0.59)).toBe(true);
    expect(shouldPlayCasino(false, () => 0.6)).toBe(false);
  });

  it('не разрешает два casino-спина подряд', () => {
    expect(shouldPlayCasino(true, () => 0)).toBe(false);
  });

  it('не запускает casino, когда спин не финальный', () => {
    expect(shouldPlayCasino(false, () => 0, false)).toBe(false);
    expect(beginCasinoSpin(INITIAL_CASINO_STATE, () => 0, false)).toEqual(INITIAL_CASINO_STATE);
  });

  it('выдаёт джекпот с вероятностью 60%', () => {
    expect(JACKPOT_PROBABILITY).toBe(0.6);
    expect(createCasinoOutcome(() => 0.59)).toEqual({
      isJackpot: true,
      reels: ['7️⃣', '7️⃣', '7️⃣'],
    });
    expect(createCasinoOutcome(() => 0.6)).toEqual({
      isJackpot: false,
      reels: ['7️⃣', '7️⃣', '🍒'],
    });
  });

  it('проводит оформление через фазы spin → result и очищает её на обычном спине', () => {
    const spinning = beginCasinoSpin(INITIAL_CASINO_STATE, () => 0);
    expect(spinning.phase).toBe('spinning');
    expect(spinning.previousWasCasino).toBe(true);
    expect(spinning.outcome?.isJackpot).toBe(true);

    const result = completeCasinoSpin(spinning);
    expect(result).toEqual({ ...spinning, phase: 'result' });

    const normal = beginCasinoSpin(result, () => 0);
    expect(normal).toEqual({ phase: 'idle', previousWasCasino: false, outcome: null });
    expect(completeCasinoSpin(normal)).toBe(normal);
  });
});
