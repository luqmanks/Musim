"use client";

import { useState } from "react";
import FieldMap, { type FieldLocation } from "./FieldMap";
import PowerPanel from "./PowerPanel";

export default function Dashboard() {
  const [location, setLocation] = useState<FieldLocation | null>(null);

  return (
    // Mobile: map on top, panel below (the page scrolls). Desktop: map left, panel in a right column.
    <div className="flex h-full w-full flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      <div className="relative h-[55dvh] shrink-0 md:h-full md:flex-1">
        <FieldMap onLocationChange={setLocation} />
      </div>
      <aside className="w-full border-zinc-200 bg-white md:h-full md:w-[420px] md:shrink-0 md:overflow-y-auto md:border-l dark:border-zinc-800 dark:bg-zinc-950">
        <PowerPanel location={location} />
      </aside>
    </div>
  );
}
