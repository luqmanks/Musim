import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ClimateSummary, FieldLocation, RotationScore } from "../../lib/field-shift";
import { Brand } from "./SharedUi";

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

export function AppOverlays({ infoOpen, shareOpen, location, climate, results, toast, onCloseInfo, onCloseShare, onCopyLink }: AppOverlaysProps) {
  const expertChecks = Array.from(new Set(results.flatMap((result) => [...result.risks, ...result.gaps]))).slice(0, 5);

  return (
    <>
      <Dialog open={infoOpen} onOpenChange={(open) => { if (!open) onCloseInfo(); }}>
        <DialogContent className="about-dialog">
          <DialogHeader>
            <DialogTitle>A guide, not a prescription</DialogTitle>
            <DialogDescription className="about-copy">
              Musim combines NASA observations, farm details and your priorities to compare rotations. It does not measure your field directly or replace local agronomic advice.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="about-actions">
            <Button type="button" onClick={onCloseInfo}>I understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={shareOpen} onOpenChange={(open) => { if (!open) onCloseShare(); }}>
        <SheetContent className="share-drawer">
          <SheetHeader>
            <SheetTitle>Save this field comparison</SheetTitle>
            <SheetDescription>Take the plan to a local expert before changing your rotation.</SheetDescription>
          </SheetHeader>
          <div className="share-content">
            <Card className="report-preview"><Brand /><span>{location?.name}</span><strong>{results[1]?.descriptor ?? "Rotation comparison"}</strong><small>{climate?.source} Â· {climate?.period}</small></Card>
            {expertChecks.length > 0 && <Card className="expert-checklist"><h3>Check locally</h3><ul>{expertChecks.map((item) => <li key={item}>{item}</li>)}</ul></Card>}
          </div>
          <SheetFooter>
            <Button type="button" onClick={() => window.print()}>Print or save as PDF</Button>
            <Button variant="outline" type="button" onClick={onCopyLink}>Copy app link</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
