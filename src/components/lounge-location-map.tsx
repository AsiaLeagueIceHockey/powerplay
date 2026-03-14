"use client";

import { DynamicRinkMap } from "@/components/dynamic-rink-map";

interface LoungeLocationMapProps {
  name: string;
  address: string;
  mapUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function LoungeLocationMap({
  name,
  address,
  mapUrl,
  lat,
  lng,
}: LoungeLocationMapProps) {
  if (!lat || !lng) {
    return null;
  }

  return (
    <div className="h-52 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <DynamicRinkMap
        isCompact={true}
        rinks={[
          {
            id: `${name}-${lat}-${lng}`,
            name_ko: name,
            name_en: name,
            address,
            map_url: mapUrl ?? undefined,
            lat,
            lng,
          },
        ]}
      />
    </div>
  );
}
