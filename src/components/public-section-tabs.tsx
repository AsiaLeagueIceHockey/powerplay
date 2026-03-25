import Link from "next/link";

type PublicSectionTab = "match" | "rink" | "club";

export function PublicSectionTabs({
  locale,
  activeTab,
}: {
  locale: string;
  activeTab: PublicSectionTab;
}) {
  const tabs = [
    { key: "match" as const, href: `/${locale}`, label: locale === "ko" ? "경기" : "Matches" },
    { key: "rink" as const, href: `/${locale}/rinks`, label: locale === "ko" ? "링크장" : "Rinks" },
    { key: "club" as const, href: `/${locale}/clubs`, label: locale === "ko" ? "동호회" : "Clubs" },
  ];

  return (
    <nav className="flex border-b border-zinc-200 dark:border-zinc-800" aria-label="Public sections">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`relative flex-1 pb-3 text-center text-lg font-bold transition-colors ${
              isActive
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="inline-flex items-center justify-center gap-2">{tab.label}</span>
            {isActive ? (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-zinc-900 dark:bg-white" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
