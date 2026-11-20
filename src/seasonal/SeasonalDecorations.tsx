import type { SeasonalTheme } from './seasonalModel';
import './seasonal.css';

const SNOWFLAKES = Array.from({ length: 64 }, (_, index) => ({
  left: (index * 37) % 100,
  duration: 8 + (index % 7),
  delay: -(index % 14),
  size: 10 + (index % 5) * 3,
  symbol: index % 3 === 0 ? '❅' : index % 3 === 1 ? '❆' : '✦',
}));

/** Сезонный декоративный слой. Не содержит игрового состояния и не перехватывает события. */
export default function SeasonalDecorations({ theme }: { theme: SeasonalTheme }) {
  if (theme.level === 0) return null;

  return (
    <div className="seasonal-layer" aria-hidden="true">
      {SNOWFLAKES.slice(0, theme.snowflakes).map((flake, index) => (
        <span
          className="seasonal-snowflake"
          key={index}
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            fontSize: flake.size,
          }}
        >
          {flake.symbol}
        </span>
      ))}

      {theme.garland !== 'none' && (
        <div className={`seasonal-garland is-${theme.garland}`}>
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index} style={{ animationDelay: `${(index % 6) * 0.18}s` }} />
          ))}
        </div>
      )}

      {theme.ornaments && (
        <div className="seasonal-ornaments">
          <span>🎄</span><span>🔴</span><span>🟡</span><span>🎁</span>
        </div>
      )}

      {theme.fireworks && (
        <div className="seasonal-fireworks">
          <span>✨</span><span>✨</span><span>✨</span>
        </div>
      )}
    </div>
  );
}
