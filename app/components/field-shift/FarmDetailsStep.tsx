import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Dispatch, SetStateAction } from "react";
import { CROPS, type FarmProfile } from "../../lib/field-shift";
import type { FieldLocation } from "../../lib/field-shift";

type FarmDetailsStepProps = {
  question: number;
  location: FieldLocation | null;
  profile: FarmProfile;
  setProfile: Dispatch<SetStateAction<FarmProfile>>;
  onNext: () => void;
};

const SOIL_CHOICES = [
  ["unknown", "I don’t know", "Add this to the local expert checklist"],
  ["clay-poor", "Clay · slow drainage", "Water stays after heavy rain"],
  ["loam", "Loam · moderate drainage", "Balanced texture and drainage"],
  ["sandy", "Sandy · fast drainage", "Dries quickly after rain"],
  ["peat", "Peat or organic soil", "High organic matter"],
] as const;

const WATER_CHOICES = [
  ["reliable", "Reliable", "Irrigation is usually available"],
  ["seasonal", "Seasonal", "Availability changes through the year"],
  ["limited", "Limited", "Dry periods restrict planting"],
  ["unknown", "I don’t know", "Add this to the expert checklist"],
] as const;

const EQUIPMENT_CHOICES = [
  ["standard", "Standard paddy equipment"],
  ["flexible", "Equipment for several crops"],
  ["manual", "Mostly manual"],
  ["unknown", "I don’t know"],
] as const;

const MARKET_CHOICES = [
  ["local", "Local buyers available"],
  ["contract", "Contract buyer"],
  ["limited", "Limited buyers"],
  ["unknown", "I don’t know"],
] as const;

export function FarmDetailsStep({ question, profile, setProfile, onNext }: FarmDetailsStepProps) {
  return (
    <div className="question-content">
      {question === 0 && (
        <>
          <h2>What is your current rotation?</h2><p>Choose up to three consecutive seasons.</p>
          <div className="rotation-inputs">
            {profile.rotation.map((crop, index) => (
              <label key={index}>
                <span>Season {index + 1}</span>
                <FieldSelect value={crop} options={CROPS.map((item) => [item.id, item.label] as const)} onChange={(value) => setProfile((current) => ({ ...current, rotation: current.rotation.map((item, itemIndex) => itemIndex === index ? value : item) }))} />
              </label>
            ))}
          </div>
        </>
      )}

      {question === 1 && (
        <>
          <h2>How would you describe the soil?</h2><p>Choose “I don’t know” if you are unsure.</p>
          <ChoiceList choices={SOIL_CHOICES} selected={profile.soil} onSelect={(soil) => setProfile((current) => ({ ...current, soil }))} />
        </>
      )}

      {question === 2 && (
        <>
          <h2>How reliable is field water?</h2><p>Think about usable water during dry weeks.</p>
          <ChoiceList choices={WATER_CHOICES} selected={profile.water} onSelect={(water) => setProfile((current) => ({ ...current, water }))} />
        </>
      )}

      {question === 3 && (
        <>
          <h2>What could limit a new crop?</h2><p>Equipment and buyers can shape what is practical.</p>
          <label className="field-label">Equipment
            <FieldSelect value={profile.equipment} options={EQUIPMENT_CHOICES} onChange={(equipment) => setProfile((current) => ({ ...current, equipment }))} />
          </label>
          <label className="field-label">Market access
            <FieldSelect value={profile.market} options={MARKET_CHOICES} onChange={(market) => setProfile((current) => ({ ...current, market }))} />
          </label>
        </>
      )}

      <div className="question-actions step-footer">
        <Button variant="ghost" size="lg" type="button" onClick={onNext}>Skip</Button>
        <Button className="step-primary" size="lg" type="button" onClick={onNext}>{question === 3 ? "Set priorities" : "Continue"}</Button>
      </div>
    </div>
  );
}

function FieldSelect({ value, options, onChange }: { value: string; options: ReadonlyArray<readonly [string, string]>; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="shadcn-select"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(([optionValue, label]) => <SelectItem key={optionValue} value={optionValue}>{label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function ChoiceList({ choices, selected, onSelect }: { choices: ReadonlyArray<readonly [string, string, string]>; selected: string; onSelect: (value: string) => void }) {
  return (
    <div className="choice-list">
      {choices.map(([value, label, note]) => (
        <Button type="button" variant="outline" key={value} className={selected === value ? "choice selected" : "choice"} aria-pressed={selected === value} onClick={() => onSelect(value)}>
          <span>{label}<small>{note}</small></span><i aria-hidden="true" />
        </Button>
      ))}
    </div>
  );
}
