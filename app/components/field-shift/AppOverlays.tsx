import type { ClimateSummary, FieldLocation, RotationScore } from "../../lib/field-shift";
import { Brand, Icon } from "./SharedUi";

type AppOverlaysProps = {
  infoOpen: boolean;
  shareOpen: boolean;
  location: FieldLocation | null;
  climate: ClimateSummary | null;
  results: RotationScore[];
  toast: string;
  onCloseInfo: () => void;
  onCloseShare: () => void;
  onCopyLink: () => void;
};

export function AppOverlays({
  infoOpen,
  shareOpen,
  location,
  climate,
  results,
  toast,
  onCloseInfo,
  onCloseShare,
  onCopyLink,
}: AppOverlaysProps) {
  return (
    <>
      {infoOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={onCloseInfo}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="about-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={onCloseInfo} aria-label="Close"><Icon name="close" /></button>
            <span className="modal-mark">M</span>
            <h2 id="about-title">A rehearsal, not a prescription</h2>
            <p>Musim combines NASA Earth observations, farm details and your priorities to compare possible crop rotations.</p>
            <p>It does not measure conditions directly on your field or replace local agronomic advice. Every result shows its evidence, assumptions and information gaps.</p>
            <button className="primary-button" type="button" onClick={onCloseInfo}>I understand</button>
          </section>
        </div>
      )}

      {shareOpen && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={onCloseShare}>
          <aside className="share-drawer" role="dialog" aria-modal="true" aria-labelledby="share-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={onCloseShare} aria-label="Close"><Icon name="close" /></button>
            <p>Expert handoff</p><h2 id="share-title">Save this field comparison</h2>
            <div className="report-preview"><Brand /><span>{location?.name}</span><strong>{results[1]?.descriptor ?? "Rotation comparison"}</strong><small>{climate?.source} · {climate?.period}</small></div>
            <div className="expert-checklist"><h3>Ask a local expert</h3><ul>{Array.from(new Set(results.flatMap((result) => [...result.risks, ...result.gaps]))).slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul></div>
            <button className="primary-button" type="button" onClick={() => window.print()}>Print or save as PDF</button>
            <button className="secondary-button" type="button" onClick={onCopyLink}>Copy app link</button>
            <p className="drawer-footnote">Confirm with a local expert before changing your rotation.</p>
          </aside>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
