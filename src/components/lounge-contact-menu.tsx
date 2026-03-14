"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Globe, Instagram, MessageCircle, Phone } from "lucide-react";
import { LoungeCtaButton } from "./lounge-cta-button";

type LoungeContactMenuItem = {
  key: "phone" | "kakao" | "instagram" | "website";
  url: string;
};

export function LoungeContactMenu({
  locale,
  items,
  entityType,
  businessId,
  eventId,
  source,
}: {
  locale: string;
  items: LoungeContactMenuItem[];
  entityType: "business" | "event";
  businessId: string;
  eventId?: string;
  source?: string;
}) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const iconMap = {
    phone: {
      icon: <Phone className="h-4 w-4" />,
      className: "border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200",
    },
    kakao: {
      icon: <MessageCircle className="h-4 w-4" />,
      className: "bg-[#FEE500] text-[#3B1E1E]",
    },
    instagram: {
      icon: <Instagram className="h-4 w-4" />,
      className: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white",
    },
    website: {
      icon: <Globe className="h-4 w-4" />,
      className: "border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200",
    },
  } as const;

  return (
    <div className="flex flex-col items-end gap-2">
      {open ? (
        <div className="flex items-center gap-2 rounded-full bg-zinc-50/90 px-2 py-2 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950/80 dark:ring-zinc-700">
          {items.map((item) => (
            <LoungeCtaButton
              key={item.key}
              entityType={entityType}
              businessId={businessId}
              eventId={eventId}
              ctaType={item.key}
              url={item.url}
              locale={locale}
              source={source}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconMap[item.key].className} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {iconMap[item.key].icon}
            </LoungeCtaButton>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {locale === "ko" ? "연락하기" : "Contact"}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
