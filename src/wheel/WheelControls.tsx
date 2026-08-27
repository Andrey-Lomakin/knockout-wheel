import { SPIN_DURATIONS } from '../game/constants';

interface WheelControlsProps {
  spinDuration: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

/** Панель управления: выбор длительности вращения. */
export default function WheelControls({ spinDuration, disabled, onChange }: WheelControlsProps) {
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
    </div>
  );
}