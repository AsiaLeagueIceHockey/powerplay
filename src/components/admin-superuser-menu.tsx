"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const superuserMenuItems = (locale: string) => [
  {
    href: `/${locale}/admin/admins`,
    icon: "👥",
    label: locale === "ko" ? "유저 관리" : "Users",
  },
  {
    href: `/${locale}/admin/points`,
    icon: "💰",
    label: locale === "ko" ? "충전 관리" : "Points",
  },
  {
    href: `/${locale}/admin/admins?tab=chat`,
    icon: "💬",
    label: locale === "ko" ? "채팅 관리" : "Chat monitoring",
  },
  {
    href: `/${locale}/admin/all-matches`,
    icon: "🌎",
    label: locale === "ko" ? "전체 경기" : "All matches",
  },
  {
    href: `/${locale}/admin/lounge-management`,
    icon: "🏆",
    label: locale === "ko" ? "라운지 관리" : "Lounge admin",
  },
  {
    href: `/${locale}/admin/audit-logs`,
    icon: "📜",
    label: locale === "ko" ? "운영 로그" : "Audit logs",
  },
  {
    href: `/${locale}/admin/push-test`,
    icon: "🔔",
    label: "Push Test",
  },
];

export function AdminSuperuserMenu({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const items = superuserMenuItems(locale);
  const currentHref = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {open ? (
        <div className="absolute bottom-full right-0 mb-3 w-52 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          <div className="border-b border-zinc-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            SuperUser
          </div>
          <div className="p-2">
            {items.map((item) => {
              const active = item.href.includes("?")
                ? currentHref === item.href
                : pathname === item.href && !currentHref.startsWith(`${item.href}?`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex flex-col items-center gap-1 px-3 py-2 text-amber-400 hover:text-amber-300"
        aria-label={locale === "ko" ? "슈퍼유저 메뉴 열기" : "Open superuser menu"}
      >
        <span className="flex h-6 w-6 items-center justify-center">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </span>
        <span className="text-xs">{locale === "ko" ? "운영" : "Admin"}</span>
      </button>
    </div>
  );
}
