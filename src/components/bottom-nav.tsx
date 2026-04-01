"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trophy, Home, User, MessageCircle } from "lucide-react";

import { useChatUnread } from "@/contexts/chat-unread-context";

function LoungeTrophyFill({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M7 2h10v6.6c0 3.22-2.2 6.03-5.2 6.81V17c0 .2.13.39.31.47l1.7.72c1.06.45 1.83 1.04 2.25 1.81H7.74c.42-.77 1.19-1.36 2.25-1.81l1.7-.72c.18-.08.31-.27.31-.47v-1.59C9.2 14.63 7 11.82 7 8.6V2Z" />
      <path d="M4.9 4.25H7v3.5H5.02a1.75 1.75 0 1 1-.12-3.5Z" />
      <path d="M17 4.25h2.1a1.75 1.75 0 1 1-.12 3.5H17v-3.5Z" />
      <path d="M6.3 20.8h11.4V22H6.3z" />
    </svg>
  );
}

export function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations("common");
  const { totalUnreadCount } = useChatUnread();

  type TabItem = {
    name: string;
    href: string;
    icon: typeof Home;
    badgeCount?: number;
    accent?: "lounge";
  };

  // Determine if a path is active
  const isActive = (path: string) => {
    const normalizedPath = path.split("?")[0];
    if (path === `/${locale}`) {
      return (
        pathname === `/${locale}` ||
        pathname.startsWith(`/${locale}/rinks`) ||
        pathname.startsWith(`/${locale}/clubs`)
      );
    }
    return pathname.startsWith(normalizedPath);
  };

  const tabs: TabItem[] = [
    {
      name: t("home"),
      href: `/${locale}`,
      icon: Home,
    },
    {
      name: t("lounge"),
      href: `/${locale}/lounge?source=bottom-nav`,
      icon: Trophy,
      accent: "lounge",
    },
    {
      name: t("chat"),
      href: `/${locale}/chat`,
      icon: MessageCircle,
      badgeCount: totalUnreadCount,
    },
    {
      name: t("myPage"),
      href: `/${locale}/mypage`,
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full border-t border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 pb-safe">
      <div className="flex justify-around items-center h-14 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          const isLounge = tab.accent === "lounge";
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
              <span className={`relative ${isLounge ? "inline-flex h-6 w-6 items-center justify-center overflow-hidden" : ""}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {isLounge && !active ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 hidden motion-safe:block motion-safe:animate-[lounge-gold-fill_6s_ease-in-out_infinite]"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(112deg, transparent 0%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0.88) 42%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.88) 58%, rgba(0,0,0,0.12) 78%, transparent 100%)",
                      maskImage:
                        "linear-gradient(112deg, transparent 0%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0.88) 42%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.88) 58%, rgba(0,0,0,0.12) 78%, transparent 100%)",
                      WebkitMaskSize: "230% 100%",
                      maskSize: "230% 100%",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[#f0b63a] [filter:drop-shadow(0_0_4px_rgba(240,182,58,0.36))] dark:text-[#f6d895]">
                      <LoungeTrophyFill className="h-[22px] w-[22px]" />
                    </span>
                  </span>
                ) : null}
                {tab.badgeCount && tab.badgeCount > 0 ? (
                  <span className="absolute -right-3 -top-2 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                    {tab.badgeCount > 99 ? "99+" : tab.badgeCount}
                  </span>
                ) : null}
              </span>
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{tab.name}</span>
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes lounge-gold-fill {
          0%,
          50%,
          100% {
            opacity: 0;
            -webkit-mask-position: 140% 0;
            mask-position: 140% 0;
          }

          56% {
            opacity: 0.24;
          }

          92% {
            opacity: 0.98;
            -webkit-mask-position: 52% 0;
            mask-position: 52% 0;
          }

          100% {
            opacity: 0;
            -webkit-mask-position: -48% 0;
            mask-position: -48% 0;
          }
        }
      `}</style>
    </nav>
  );
}
