import type { WheelParticipant } from '../game/types';
import Wheel from './Wheel';
import WheelControls from './WheelControls';
import ResultPanel from './ResultPanel';

interface WheelStageProps {
  participants: WheelParticipant[];
  spinning: boolean;
  durationSec: number;
  spinDuration: number;
  lastResult: string | null;
  autoSpin: boolean;
  autoRunning: boolean;
  spinSignal: number;
  onDurationChange: (value: number) => void;
  onAutoChange: () => void;
  onSpinRequest: () => void;
  onSpinStart: () => void;
  onSpinEnd: (winner: WheelParticipant) => void;
  onResetRound: () => void;
}

/** Сценa: панель управления + колесо + результат. */
export default function WheelStage(props: WheelStageProps) {
  return (
    <>
      <WheelControls
        spinDuration={props.spinDuration}
        autoSpin={props.autoSpin}
        disabled={props.spinning}
        onChange={props.onDurationChange}
        onAutoChange={props.onAutoChange}
      />
      <Wheel
        participants={props.participants}
        spinning={props.spinning}
        durationSec={props.durationSec}
        autoRunning={props.autoRunning}
        spinSignal={props.spinSignal}
        onSpinRequest={props.onSpinRequest}
        onSpinStart={props.onSpinStart}
        onSpinEnd={props.onSpinEnd}
      />
      <ResultPanel lastResult={props.lastResult} onResetRound={props.onResetRound} />
    </>
  );
}