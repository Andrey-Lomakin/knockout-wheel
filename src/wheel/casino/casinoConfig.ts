/** Содержимое темы отделено от механики, чтобы менять оформление без правки состояния. */
export const CASINO_CONFIG = {
  symbols: ['🍒', '7️⃣', '🍋', '⭐', '🔔'],
  jackpot: ['7️⃣', '7️⃣', '7️⃣'],
  miss: ['7️⃣', '7️⃣', '🍒'],
  label: 'JACKPOT',
  missLabel: 'ЕЩЁ РАЗ',
  reelStopOffsetsMs: [900, 450, 0],
  jackpotRespinSec: 3,
  jackpotPauseMs: 700,
} as const;
