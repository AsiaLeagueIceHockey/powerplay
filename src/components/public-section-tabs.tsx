import { Link } from "@/i18n/navigation";
import { segmentedItemStyles } from "@/components/ui/styles";

type PublicSectionTab = "match" | "rink" | "club";

export function PublicSectionTabs({
  locale,
  activeTab,
}: {
  locale: string;
  activeTab: PublicSectionTab;
}) {
  const tabs = [
    { key: "club" as const, href: `/${locale}/clubs`, label: locale === "ko" ? "동호회" : "Clubs" },
    { key: "rink" as const, href: `/${locale}/rinks`, label: locale === "ko" ? "링크장" : "Rinks" },
    { key: "match" as const, href: `/${locale}?tab=match`, label: locale === "ko" ? "경기" : "Matches" },
  ];

  return (
    <nav className="flex border-b border-pp-border " aria-label="Public sections">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Link
            key={tab.key}
            locale={locale as "ko" | "en"}
            href={tab.key === "match" ? "/?tab=match" : tab.href.replace(`/${locale}`, "") || "/"}
            prefetch={false}
            className={`${segmentedItemStyles({ selected: isActive, kind: "tab" })} relative flex-1 text-center`}
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
