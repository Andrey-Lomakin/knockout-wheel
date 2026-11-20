import { CASINO_CONFIG } from './casinoConfig';
import SlotReel from './SlotReel';
import type { CasinoOutcome, CasinoPhase } from './casinoModel';
import './casino.css';

interface CasinoOverlayProps {
  phase: CasinoPhase;
  outcome: CasinoOutcome | null;
  durationSec: number;
}

/** Презентационный слой casino-фичи. Не знает об участниках и игровом рандоме. */
export default function CasinoOverlay({ phase, outcome, durationSec }: CasinoOverlayProps) {
  if (phase === 'idle' || !outcome) return null;

  const spinEndMs = durationSec * 1000;
  const title = phase === 'result'
    ? outcome.isJackpot ? CASINO_CONFIG.label : CASINO_CONFIG.missLabel
    : 'LUCKY SPIN';
  const resultClass = phase === 'result' && outcome.isJackpot ? 'is-jackpot' : '';

  return (
    <div className="casino-layer" aria-hidden="true">
      <div className="casino-frame" />
      <div className={`casino-machine ${phase === 'result' ? 'is-result' : ''} ${resultClass}`}>
        <span className="casino-machine-title">{title}</span>
        <div className="casino-reels">
          {outcome.reels.map((symbol, index) => (
            <SlotReel
              key={`${index}-${symbol}`}
              finalSymbol={symbol}
              stopAtMs={spinEndMs - CASINO_CONFIG.reelStopOffsetsMs[index]}
              reelIndex={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
