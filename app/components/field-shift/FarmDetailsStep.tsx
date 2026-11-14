import type { Dispatch, SetStateAction } from "react";
import { CROPS, type FarmProfile } from "../../lib/field-shift";
import type { FieldLocation } from "../../lib/field-shift";
import { Icon } from "./SharedUi";

type FarmDetailsStepProps = {
  question: number;
  location: FieldLocation | null;
  profile: FarmProfile;
  setProfile: Dispatch<SetStateAction<FarmProfile>>;
  onNext: () => void;
};

const SOIL_CHOICES = [
  ["unknown", "I don’t know", "We’ll mark this for a local expert to check"],
  ["clay-poor", "Clay · slow drainage", "Water stays after heavy rain"],
  ["loam", "Loam · moderate drainage", "Balanced texture and drainage"],
  ["sandy", "Sandy · fast drainage", "Dries quickly after rain"],
  ["peat", "Peat or organic soil", "High organic matter"],
] as const;

const WATER_CHOICES = [
  ["reliable", "Reliable", "Irrigation is usually available"],
  ["seasonal", "Seasonal", "Availability changes through the year"],
  ["limited", "Limited", "Dry periods often restrict planting"],
  ["unknown", "I don’t know", "We’ll add this to the expert checklist"],
] as const;

export function FarmDetailsStep({ question, location, profile, setProfile, onNext }: FarmDetailsStepProps) {
  return (
    <div className="question-content">
      <div className="selected-field-inline"><Icon name="pin" /><span><small>Working with</small><strong>{location?.name}</strong></span></div>

      {question === 0 && (
        <>
          <h2>What is your current rotation?</h2><p>Choose up to three consecutive seasons.</p>
          <div className="rotation-inputs">
            {profile.rotation.map((crop, index) => (
              <label key={index}>
                <span>Season {index + 1}</span>
                <select name={`rotation-season-${index + 1}`} autoComplete="off" value={crop} onChange={(event) => setProfile((current) => ({ ...current, rotation: current.rotation.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))}>
                  {CROPS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            ))}
          </div>
        </>
      )}

      {question === 1 && (
        <>
          <h2>How would you describe the soil?</h2><p>If you are unsure, choose “I don’t know.” We’ll keep it visible for a local expert.</p>
          <ChoiceList choices={SOIL_CHOICES} selected={profile.soil} onSelect={(soil) => setProfile((current) => ({ ...current, soil }))} />
        </>
      )}

      {question === 2 && (
        <>
          <h2>How reliable is field water?</h2><p>Think about irrigation and usable water during dry weeks.</p>
          <ChoiceList choices={WATER_CHOICES} selected={profile.water} onSelect={(water) => setProfile((current) => ({ ...current, water }))} />
        </>
      )}

      {question === 3 && (
        <>
          <h2>What could limit a new crop?</h2><p>Equipment and buyers matter as much as field conditions when a rotation changes.</p>
          <label className="field-label">
            Equipment
            <select name="equipment" autoComplete="off" className="select-control" value={profile.equipment} onChange={(event) => setProfile((current) => ({ ...current, equipment: event.target.value }))}>
              <option value="standard">Standard paddy equipment</option><option value="flexible">Equipment for several crops</option><option value="manual">Mostly manual</option><option value="unknown">I don’t know</option>
            </select>
          </label>
          <label className="field-label">
            Market access
            <select name="market-access" autoComplete="off" className="select-control" value={profile.market} onChange={(event) => setProfile((current) => ({ ...current, market: event.target.value }))}>
              <option value="local">Local buyers available</option><option value="contract">Contract buyer</option><option value="limited">Limited buyers</option><option value="unknown">I don’t know</option>
            </select>
          </label>
        </>
      )}

      <div className="question-actions step-footer">
        <button className="text-button" type="button" onClick={onNext}>Skip for now</button>
        <button className="primary-button" type="button" onClick={onNext}>{question === 3 ? "Set priorities" : "Next question"}</button>
      </div>
    </div>
  );
}

function ChoiceList({
  choices,
  selected,
  onSelect,
}: {
  choices: ReadonlyArray<readonly [string, string, string]>;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="choice-list">
      {choices.map(([value, label, note]) => (
        <button type="button" key={value} className={selected === value ? "choice selected" : "choice"} aria-pressed={selected === value} onClick={() => onSelect(value)}>
          <span>{label}<small>{note}</small></span><i aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
