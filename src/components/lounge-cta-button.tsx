"use client";

import { ReactNode, useTransition } from "react";
import { trackLoungeClick, type LoungeCtaType } from "@/app/actions/lounge";
import { sanitizeLoungeActionUrl } from "@/lib/lounge-link-utils";

interface LoungeCtaButtonProps {
  entityType: "business" | "event";
  businessId: string;
  eventId?: string;
  ctaType: Exclude<LoungeCtaType, "detail">;
  url: string | null | undefined;
  locale: string;
  source?: string;
  className?: string;
  ariaLabel?: string;
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
  ariaLabel,
  children,
}: LoungeCtaButtonProps) {
  const [isPending, startTransition] = useTransition();
  const safeUrl = sanitizeLoungeActionUrl(ctaType, url);

  const handleClick = async () => {
    if (!safeUrl) return;

    startTransition(async () => {
      await trackLoungeClick(entityType, businessId, ctaType, eventId, locale, source);
    });

    if (ctaType === "phone") {
      window.location.href = safeUrl;
      return;
    }

    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  if (!safeUrl) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}
