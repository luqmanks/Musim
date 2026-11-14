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
      <div className="instruction-card"><span>3</span><p><strong>Set what matters most.</strong> Move each slider from helpful to essential, then compare the rotations.</p></div>
      <div className="priority-list">
        {PRIORITIES.map((priority) => (
          <label key={priority.key} className="priority-row">
            <span><strong>{priority.label}</strong><small>{priority.description}</small></span>
            <input type="range" min="1" max="5" step="1" value={priorities[priority.key]} onChange={(event) => setPriorities((current) => ({ ...current, [priority.key]: Number(event.target.value) }))} aria-label={`${priority.label} priority`} />
            <output>{priorities[priority.key] === 5 ? "Essential" : priorities[priority.key] >= 3 ? "Important" : "Helpful"}</output>
          </label>
        ))}
      </div>
      <button className="primary-button" type="button" onClick={onCompare}>Compare rotations</button>
    </div>
  );
}
