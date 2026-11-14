import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Dispatch, SetStateAction } from "react";
import type { PriorityKey } from "../../lib/field-shift";
import { PRIORITIES } from "./config";

type PrioritiesStepProps = {
  priorities: Record<PriorityKey, number>;
  setPriorities: Dispatch<SetStateAction<Record<PriorityKey, number>>>;
  onCompare: () => void;
};

export function PrioritiesStep({ priorities, setPriorities, onCompare }: PrioritiesStepProps) {
  return (
    <div className="priority-content">
      <div className="step-scroll">
      <p className="step-note">Higher priorities have more influence on the rotation scores.</p>
      <div className="priority-list">
        {PRIORITIES.map((priority) => {
          const value = priorities[priority.key];
          const valueLabel = value === 5 ? "Essential" : value >= 3 ? "Important" : "Helpful";
          return (
            <div key={priority.key} className="priority-row">
              <label htmlFor={`priority-${priority.key}`}><strong>{priority.label}</strong><small>{priority.description}</small></label>
              <Slider id={`priority-${priority.key}`} min={1} max={5} step={1} value={[value]} onValueChange={([nextValue]) => setPriorities((current) => ({ ...current, [priority.key]: nextValue }))} aria-label={`${priority.label} priority`} />
              <output>{valueLabel}</output>
            </div>
          );
        })}
      </div>
      </div>
      <div className="step-footer"><Button className="step-primary" size="lg" type="button" onClick={onCompare}>Compare rotations</Button></div>
    </div>
  );
}
