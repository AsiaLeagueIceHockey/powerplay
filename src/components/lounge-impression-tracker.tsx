"use client";

import { useEffect } from "react";
import { trackLoungeImpression } from "@/app/actions/lounge";

interface LoungeImpressionTrackerProps {
  entityType: "business" | "event";
  businessId: string;
  eventId?: string;
  locale: string;
}

export function LoungeImpressionTracker({
  entityType,
  businessId,
  eventId,
  locale,
}: LoungeImpressionTrackerProps) {
  useEffect(() => {
    const key = `lounge-impression:${entityType}:${businessId}:${eventId || "none"}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void trackLoungeImpression(entityType, businessId, eventId, locale);
  }, [businessId, entityType, eventId, locale]);

  return null;
}
