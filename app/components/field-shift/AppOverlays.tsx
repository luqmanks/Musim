import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FieldPlanReport, type FieldPlanReportProps } from "./FieldPlanReport";

type AppOverlaysProps = FieldPlanReportProps & {
  infoOpen: boolean;
  shareOpen: boolean;
  toast: string;
  onCloseInfo: () => void;
  onCloseShare: () => void;
};

export function AppOverlays({ infoOpen, shareOpen, location, climate, results, toast, onCloseInfo, onCloseShare, profile, priorities, scenario }: AppOverlaysProps) {

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
            <SheetTitle>Share your field plan</SheetTitle>
            <SheetDescription>Save a comparison to review with your farm adviser.</SheetDescription>
          </SheetHeader>
          <div className="share-content">
            {results.length ? <FieldPlanReport location={location} climate={climate} results={results} profile={profile} priorities={priorities} scenario={scenario} /> : <p>Load climate data to generate your comparison before saving.</p>}
          </div>
          <SheetFooter>
            <Button type="button" disabled={!results.length} onClick={() => window.print()}>Save as PDF</Button>
            <p className="share-note">Choose Save as PDF in the print window. Includes your farm details, priorities, seasonal rotation plans, scores, local checks and climate data.</p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
