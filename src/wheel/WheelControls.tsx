import { SPIN_DURATIONS } from '../game/constants';

interface WheelControlsProps {
  spinDuration: number;
  autoSpin: boolean;
  disabled: boolean;
  onChange: (value: number) => void;
  onAutoChange: () => void;
}

/** Панель управления: выбор длительности и автоматическая прокрутка. */
export default function WheelControls({ spinDuration, autoSpin, disabled, onChange, onAutoChange }: WheelControlsProps) {
  return (
    <div className="controls">
      <label className="control">
        Длительность:
        <select
          className="select"
          value={spinDuration}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
        >
          {SPIN_DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d} сек
            </option>
          ))}
        </select>
      </label>

      <label className="control check">
        <input type="checkbox" checked={autoSpin} onChange={onAutoChange} />
        Автоматическая прокрутка
      </label>
    </div>
  );
}