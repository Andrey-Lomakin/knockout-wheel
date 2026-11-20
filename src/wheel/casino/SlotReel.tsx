import { memo, useMemo } from 'react';
import { CASINO_CONFIG } from './casinoConfig';

interface SlotReelProps {
  finalSymbol: string;
  stopAtMs: number;
  reelIndex: number;
}

/** Один барабан: прокручивает символы и останавливается на переданном финальном. */
function SlotReel({ finalSymbol, stopAtMs, reelIndex }: SlotReelProps) {
  const track = useMemo(() => {
    const symbolCount = Math.max(18, Math.ceil(stopAtMs / 80));
    const symbols: string[] = Array.from(
      { length: symbolCount },
      (_, index) => CASINO_CONFIG.symbols[(index + reelIndex * 2) % CASINO_CONFIG.symbols.length],
    );
    symbols.push(finalSymbol);
    return symbols;
  }, [finalSymbol, stopAtMs, reelIndex]);

  return (
    <div className="casino-reel" data-final-symbol={finalSymbol}>
      <div className="casino-reel-track" style={{ animationDuration: `${stopAtMs}ms` }}>
        {track.map((symbol, index) => (
          <span key={`${reelIndex}-${index}`}>{symbol}</span>
        ))}
      </div>
    </div>
  );
}

export default memo(SlotReel);
