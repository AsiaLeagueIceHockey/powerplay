"use client";
import { buttonStyles } from "@/components/ui/styles";

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
      icon: <Phone className="h-4 w-4" strokeWidth={2.4} />,
      className:
        "border border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900",
    },
    kakao: {
      icon: <MessageCircle className="h-4 w-4" />,
      className: "bg-[#FEE500] text-[#3B1E1E]",
    },
    instagram: {
      icon: <Instagram className="h-4 w-4" strokeWidth={2.4} />,
      className:
        "border border-white/20 bg-[#E1306C] bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white shadow-sm",
    },
    website: {
      icon: <Globe className="h-4 w-4" />,
      className: "border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200",
    },
  } as const;

  const ctaLabelMap = {
    phone: locale === "ko" ? "전화하기" : "Call",
    kakao: locale === "ko" ? "카카오톡 열기" : "Open KakaoTalk",
    instagram: locale === "ko" ? "인스타그램 열기" : "Open Instagram",
    website: locale === "ko" ? "웹사이트 열기" : "Open website",
  } as const;

  return (
    <div className="relative flex items-center justify-end">
      {open ? (
        <div className="absolute bottom-full right-0 z-10 mb-2 flex items-center gap-2 rounded-full bg-pp-surface px-2 py-2 shadow-lg ring-1 ring-pp-border ">
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
              ariaLabel={ctaLabelMap[item.key]}
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
        aria-expanded={open}
        className={buttonStyles({ variant: "outline", size: "compact" }) + " inline-flex items-center gap-1"}
      >
        {locale === "ko" ? "연락하기" : "Contact"}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
