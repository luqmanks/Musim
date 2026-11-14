import type { Step } from "./config";

export type IconName = "info" | "share" | "back" | "pin" | "check" | "close";

export function Icon({ name }: { name: IconName }) {
  const paths = {
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    share: <><circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="m8 11 8-4M8 13l8 4" /></>,
    back: <path d="m15 18-6-6 6-6" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
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
    <div className="journey-progress">
      <span>Step {active} of 4</span>
      <ol className="step-progress" aria-label="Progress">
        {["Choose field", "Farm details", "Your goals", "Compare"].map((label, index) => (
          <li key={label} className={index + 1 <= active ? "active" : ""} aria-current={index + 1 === active ? "step" : undefined}>
            <span>{index + 1 < active ? <Icon name="check" /> : index + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
