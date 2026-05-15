"use client";

import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full glass rounded-xl flex items-center justify-center text-slate-500">Memuat Peta...</div>
});

export default function MapWrapper({ initialSettings }) {
  return <MapClient initialSettings={initialSettings} />;
}
