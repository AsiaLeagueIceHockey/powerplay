"use client";

import { useEffect } from "react";
import { trackLoungeImpression } from "@/app/actions/lounge";

interface LoungeImpressionTrackerProps {
  entityType: "business" | "event";
  businessId: string;
  eventId?: string;
  locale: string;
  source?: string;
}

export function LoungeImpressionTracker({
  entityType,
  businessId,
  eventId,
  locale,
  source,
}: LoungeImpressionTrackerProps) {
  useEffect(() => {
    const key = `lounge-impression:${entityType}:${businessId}:${eventId || "none"}:${source || "direct"}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void trackLoungeImpression(entityType, businessId, eventId, locale, source);
  }, [businessId, entityType, eventId, locale, source]);

  return null;
}
