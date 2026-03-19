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
    const normalizedSource = source ?? "direct";
    const key = `lounge-impression:${locale}:${entityType}:${businessId}:${eventId || "none"}:${normalizedSource}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "pending");
    void trackLoungeImpression(entityType, businessId, eventId, locale, normalizedSource)
      .then((result) => {
        if (result.success) {
          sessionStorage.setItem(key, "1");
          return;
        }
        sessionStorage.removeItem(key);
      })
      .catch(() => {
        sessionStorage.removeItem(key);
      });
  }, [businessId, entityType, eventId, locale, source]);

  return null;
}
