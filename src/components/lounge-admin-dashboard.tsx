"use client";

import { useMemo, useState } from "react";
import type {
  LoungeBusiness,
  LoungeDailyMetricPoint,
  LoungeEvent,
  LoungeEventMetricRow,
  LoungeMembership,
  LoungeMetricsSummary,
} from "@/app/actions/lounge";
import { LoungeBusinessForm } from "./lounge-business-form";
import { LoungeEventForm } from "./lounge-event-form";
import { LoungeFeatureManager } from "./lounge-feature-manager";
import { LoungePerformancePanel } from "./lounge-performance-panel";

type LoungeAdminTab = "performance" | "business" | "events" | "operations";

export function LoungeAdminDashboard({
  locale,
  business,
  events,
  metrics,
  dailyMetrics,
  eventMetrics,
  membership,
  isSuperUser,
  featuredBusinesses,
}: {
  locale: string;
  business: LoungeBusiness | null;
  events: LoungeEvent[];
  metrics: LoungeMetricsSummary;
  dailyMetrics: LoungeDailyMetricPoint[];
  eventMetrics: LoungeEventMetricRow[];
  membership: LoungeMembership | null;
  isSuperUser: boolean;
  featuredBusinesses: LoungeBusiness[];
}) {
  const [activeTab, setActiveTab] = useState<LoungeAdminTab>("performance");

  const tabs = useMemo(() => {
    const base: Array<{ id: LoungeAdminTab; label: string }> = [
      { id: "performance" as const, label: locale === "ko" ? "성과" : "Performance" },
      { id: "business" as const, label: locale === "ko" ? "비즈니스" : "Business" },
      { id: "events" as const, label: locale === "ko" ? "일정 관리" : "Events" },
    ];

    if (isSuperUser) {
      base.push({ id: "operations" as const, label: locale === "ko" ? "추천 관리" : "Featured" });
    }

    return base;
  }, [isSuperUser, locale]);

  const renderPerformance = () => {
    return (
      <LoungePerformancePanel
        locale={locale}
        business={business}
        metrics={metrics}
        dailyMetrics={dailyMetrics}
        eventMetrics={eventMetrics}
        onEmptyAction={() => setActiveTab("business")}
        onEmptyActionLabel={locale === "ko" ? "비즈니스 등록하러 가기" : "Go to business tab"}
      />
    );
  };

  return (
    <div className="space-y-6">
      <section className="border-b border-zinc-800">
        <div className="flex min-w-max gap-6 overflow-x-auto pb-3">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-3 text-base font-bold transition-colors md:text-lg ${
                  active ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {active ? <span className="absolute bottom-0 left-0 h-0.5 w-full bg-amber-400" /> : null}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "performance" ? renderPerformance() : null}
      {activeTab === "business" ? <LoungeBusinessForm locale={locale} business={business} /> : null}
      {activeTab === "events" ? <LoungeEventForm locale={locale} events={events} membership={membership} /> : null}
      {activeTab === "operations" && isSuperUser ? (
        <div className="space-y-6">
          <LoungeFeatureManager locale={locale} businesses={featuredBusinesses} />
        </div>
      ) : null}
    </div>
  );
}
