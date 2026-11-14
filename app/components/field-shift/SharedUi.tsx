import type { Step } from "./config";
import {
  ArrowLeft,
  Check,
  Info,
  MapPin,
  Share2,
  Sprout,
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
      <Sprout className="icon" aria-hidden="true" />
      <div>
        <strong>Musim</strong>
        <small>Field Shift Malaysia</small>
      </div>
    </div>
  );
}

export function StepProgress({ step }: { step: Step }) {
  const active = step === "locate" ? 1 : step === "details" ? 2 : step === "priorities" ? 3 : 4;

  return (
    <nav className="setup-progress" aria-label={`Step ${active} of 4`}>
      <ol>{["Field", "Farm details", "Priorities", "Plan"].map((label, index) => (
        <li key={label} data-state={index + 1 < active ? "complete" : index + 1 === active ? "current" : "upcoming"} aria-current={index + 1 === active ? "step" : undefined}>
          <span className="setup-progress-mark">{index + 1 < active ? <Check className="size-3" aria-hidden="true" /> : index + 1}</span>
          <span>{label}</span>
        </li>
      ))}</ol>
    </nav>
  );
}
