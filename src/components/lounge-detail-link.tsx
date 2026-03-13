"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useTransition } from "react";
import { trackLoungeClick } from "@/app/actions/lounge";

interface LoungeDetailLinkProps {
  entityType: "business" | "event";
  businessId: string;
  href: string;
  locale: string;
  eventId?: string;
  source?: string;
  className?: string;
  children: ReactNode;
}

export function LoungeDetailLink({
  entityType,
  businessId,
  href,
  locale,
  eventId,
  source,
  className = "",
  children,
}: LoungeDetailLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await trackLoungeClick(entityType, businessId, "detail", eventId, locale, source);
      router.push(href);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      {children}
    </button>
  );
}
