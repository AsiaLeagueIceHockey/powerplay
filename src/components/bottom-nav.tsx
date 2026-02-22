"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, User } from "lucide-react";

export function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations("common");

  // Determine if a path is active
  const isActive = (path: string) => {
    if (path === `/${locale}`) {
      // Exact match for home page
      return pathname === `/${locale}`;
    }
    return pathname.startsWith(path);
  };

  const tabs = [
    {
      name: t("home"),
      href: `/${locale}`,
      icon: Home,
    },
    {
      name: t("myPage"),
      href: `/${locale}/mypage`,
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full border-t border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 md:hidden pb-safe">
      <div className="flex justify-around items-center h-14 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
              title={tab.name}
              aria-label={tab.name}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
