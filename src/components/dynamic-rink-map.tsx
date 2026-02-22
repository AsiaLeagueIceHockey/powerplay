"use client";

import dynamic from "next/dynamic";
import { Rink, Club } from "@/app/actions/types";
import { Match } from "@/app/actions/match";

const RinkMapComponent = dynamic(
  () => import("@/components/rink-map").then((mod) => mod.RinkMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[12rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-zinc-400 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800">
        지도 로딩중...
      </div>
    )
  }
);

interface RinkMapProps {
  rinks: Rink[];
  matches?: Match[];
  clubs?: Club[];
  isCompact?: boolean;
}

export function DynamicRinkMap(props: RinkMapProps) {
  return <RinkMapComponent {...props} />;
}
