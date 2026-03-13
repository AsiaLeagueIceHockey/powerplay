"use client";

import { ReactNode, useTransition } from "react";
import { trackLoungeClick, type LoungeCtaType } from "@/app/actions/lounge";

interface LoungeCtaButtonProps {
  entityType: "business" | "event";
  businessId: string;
  eventId?: string;
  ctaType: LoungeCtaType;
  url: string | null | undefined;
  locale: string;
  source?: string;
  className?: string;
  children: ReactNode;
}

export function LoungeCtaButton({
  entityType,
  businessId,
  eventId,
  ctaType,
  url,
  locale,
  source,
  className = "",
  children,
}: LoungeCtaButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    if (!url) return;

    startTransition(async () => {
      await trackLoungeClick(entityType, businessId, ctaType, eventId, locale, source);
    });

    if (ctaType === "phone") {
      window.location.href = url;
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!url || isPending}
      className={className}
    >
      {children}
    </button>
  );
}
