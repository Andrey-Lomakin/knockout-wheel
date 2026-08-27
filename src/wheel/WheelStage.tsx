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
  onDurationChange: (value: number) => void;
  onSpinStart: () => void;
  onSpinEnd: (winner: WheelParticipant) => void;
  onResetRound: () => void;
}

/** Сценa: панель управления + колесо + результат/подиум. */
export default function WheelStage(props: WheelStageProps) {
  return (
    <>
      <WheelControls spinDuration={props.spinDuration} disabled={props.spinning} onChange={props.onDurationChange} />
      <Wheel
        participants={props.participants}
        spinning={props.spinning}
        durationSec={props.durationSec}
        onSpinStart={props.onSpinStart}
        onSpinEnd={props.onSpinEnd}
      />
      <ResultPanel lastResult={props.lastResult} onResetRound={props.onResetRound} />
    </>
  );
}