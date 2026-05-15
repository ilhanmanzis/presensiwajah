"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the map component with SSR disabled
const MapDetail = dynamic(() => import("./MapDetail"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/30">
      <div className="flex flex-col items-center gap-2 text-brand-primary">
        <Loader2 size={32} className="animate-spin" />
        <span className="text-sm font-semibold">Memuat Peta...</span>
      </div>
    </div>
  ),
});

export default function MapWrapper(props) {
  return <MapDetail {...props} />;
}
