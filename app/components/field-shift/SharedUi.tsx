import type { Step } from "./config";
import {
  ArrowLeft,
  Check,
  Info,
  MapPin,
  Share2,
  X,
  type LucideIcon,
} from "lucide-react";

export type IconName = "info" | "share" | "back" | "pin" | "check" | "close";

export function Icon({ name }: { name: IconName }) {
  const icons: Record<IconName, LucideIcon> = {
    info: Info,
    share: Share2,
    back: ArrowLeft,
    pin: MapPin,
    check: Check,
    close: X,
  };
  const Glyph = icons[name];
  return <Glyph className="icon" aria-hidden="true" />;
}

export function Brand() {
  return (
    <div className="brand" aria-label="Musim Field Shift Malaysia">
      <span className="brand-orbit" aria-hidden="true"><span /></span>
      <div>
        <strong>MUSIM</strong>
        <small>Field Shift Malaysia</small>
      </div>
    </div>
  );
}

export function StepProgress({ step }: { step: Step }) {
  const active = step === "locate" ? 1 : step === "details" ? 2 : step === "priorities" ? 3 : 4;

  return (
    <div className="journey-progress" aria-label={`Step ${active} of 4`}>
      <span>Step {active} of 4</span>
      <div className="journey-track" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={active}>
        <i style={{ width: `${active * 25}%` }} />
      </div>
    </div>
  );
}
