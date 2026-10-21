"use client";
import { surfaceStyles } from "@/components/ui/styles";

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
    <div className={surfaceStyles({ density: "none" }) + " overflow-hidden"}>
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
