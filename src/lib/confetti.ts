import confetti from 'canvas-confetti';

const WINNER_COLORS = ['#fbbf24', '#f59e0b', '#e2e8f0', '#4ade80', '#3b82f6', '#ef4444'];
const PLACE_COLORS = ['#fbbf24', '#e2e8f0', '#94a3b8'];

/** Праздничный салют для победителя (1 место): центральный залп + пушки по краям. */
export function celebrateWinner(): void {
  confetti({ particleCount: 160, spread: 110, origin: { y: 0.6 }, colors: WINNER_COLORS, zIndex: 2000, disableForReducedMotion: true });
  window.setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors: WINNER_COLORS, zIndex: 2000, disableForReducedMotion: true });
  }, 160);
  window.setTimeout(() => {
    confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors: WINNER_COLORS, zIndex: 2000, disableForReducedMotion: true });
  }, 160);
}

/** Лёгкий залп для занятого места (2/3). */
export function celebratePlace(): void {
  confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 }, colors: PLACE_COLORS, zIndex: 2000, disableForReducedMotion: true });
}