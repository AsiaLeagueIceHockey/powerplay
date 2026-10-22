"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trophy, Home, User, MessageCircle, Sparkles } from "lucide-react";

import { useChatUnread } from "@/contexts/chat-unread-context";

export function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Capture-phase focus/blur listeners (extremely reliable across Safari/Chrome and Webviews)
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("contenteditable") === "true")
      ) {
        setIsKeyboardOpen(true);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            active.getAttribute("contenteditable") !== "true")
        ) {
          setIsKeyboardOpen(false);
        }
      }, 50);
    };

    window.addEventListener("focus", handleFocus, true); // Capture phase focus
    window.addEventListener("blur", handleBlur, true);   // Capture phase blur

    // 2. VisualViewport Resize listener (secondary check)
    let visualViewportCleanup: (() => void) | undefined;
    if (window.visualViewport) {
      const visualViewport = window.visualViewport;
      const handleResize = () => {
        // Checking against window.screen.height (which is constant) resolves iOS Safari resizing innerHeight
        const isKeyboard =
          visualViewport.height < window.innerHeight * 0.85 ||
          (window.screen && visualViewport.height < window.screen.height * 0.70);

        if (isKeyboard) {
          setIsKeyboardOpen(true);
        } else {
          const active = document.activeElement;
          if (
            !active ||
            (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA")
          ) {
            setIsKeyboardOpen(false);
          }
        }
      };
      visualViewport.addEventListener("resize", handleResize);
      visualViewportCleanup = () => visualViewport.removeEventListener("resize", handleResize);
    }

    return () => {
      window.removeEventListener("focus", handleFocus, true);
      window.removeEventListener("blur", handleBlur, true);
      if (visualViewportCleanup) {
        visualViewportCleanup();
      }
    };
  }, []);

  const t = useTranslations("common");
  const { totalUnreadCount } = useChatUnread();

  type TabItem = {
    name: string;
    href: string;
    icon: typeof Home;
    badgeCount?: number;
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
    if (path === `/${locale}/youth`) {
      return (
        pathname === `/${locale}/youth` ||
        pathname.startsWith(`/${locale}/youth/`)
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
    },
    {
      name: t("youth"),
      href: `/${locale}/youth`,
      icon: Sparkles,
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
    <nav className={`fixed bottom-0 left-0 right-0 z-40 w-full border-t border-pp-border bg-pp-surface pb-safe transition-all duration-300 bottom-navigation-bar ${isKeyboardOpen ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
      <div className="flex justify-around items-center h-14 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
                active
                  ? "text-pp-link"
                  : "text-pp-muted hover:text-pp-text"
              }`}
              title={tab.name}
              aria-label={tab.name}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {tab.badgeCount && tab.badgeCount > 0 ? (
                  <span className="absolute -right-3 -top-2 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-pp-danger px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                    {tab.badgeCount > 99 ? "99+" : tab.badgeCount}
                  </span>
                ) : null}
              </span>
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{tab.name}</span>
            </Link>
          );
        })}
      </div>
      <style jsx global>{`
        body:has(input:focus, textarea:focus) .bottom-navigation-bar {
          transform: translateY(100%) !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </nav>
  );
}
