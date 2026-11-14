import { Suspense } from "react";
import FieldShiftApp from "../components/FieldShiftApp";

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return <><Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Opening your field plan…</div>}><FieldShiftApp /></Suspense>{children}</>;
}
