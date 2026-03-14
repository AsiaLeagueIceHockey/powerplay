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
import { LoungeMembershipManager } from "./lounge-membership-manager";

interface AdminOption {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
}

type LoungeAdminTab = "performance" | "business" | "events" | "operations";

export function LoungeAdminDashboard({
  locale,
  business,
  events,
  metrics,
  dailyMetrics,
  eventMetrics,
  isSuperUser,
  featuredBusinesses,
  admins,
  memberships,
}: {
  locale: string;
  business: LoungeBusiness | null;
  events: LoungeEvent[];
  metrics: LoungeMetricsSummary;
  dailyMetrics: LoungeDailyMetricPoint[];
  eventMetrics: LoungeEventMetricRow[];
  isSuperUser: boolean;
  featuredBusinesses: LoungeBusiness[];
  admins: AdminOption[];
  memberships: LoungeMembership[];
}) {
  const [activeTab, setActiveTab] = useState<LoungeAdminTab>("performance");

  const tabs = useMemo(() => {
    const base = [
      { id: "performance" as const, label: locale === "ko" ? "성과" : "Performance" },
      { id: "business" as const, label: locale === "ko" ? "비즈니스" : "Business" },
      { id: "events" as const, label: locale === "ko" ? "일정 관리" : "Events" },
    ];
    if (isSuperUser) {
      base.push({ id: "operations" as const, label: locale === "ko" ? "운영" : "Operations" });
    }
    return base;
  }, [isSuperUser, locale]);

  const pathClicks = [
    { key: "detail", label: locale === "ko" ? "상세 이동" : "Detail" },
    { key: "kakao", label: locale === "ko" ? "카카오" : "Kakao" },
    { key: "instagram", label: "Instagram" },
    { key: "website", label: locale === "ko" ? "웹사이트" : "Website" },
    { key: "phone", label: locale === "ko" ? "전화" : "Phone" },
  ] as const;

  const renderPerformance = () => {
    if (!business) {
      return (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {locale === "ko" ? "먼저 비즈니스 정보를 등록해주세요" : "Create your business profile first"}
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {locale === "ko"
              ? "비즈니스 정보가 있어야 노출과 클릭 성과를 볼 수 있습니다."
              : "You need a business profile before performance data can appear."}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("business")}
            className="mt-4 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {locale === "ko" ? "비즈니스 탭으로 이동" : "Go to business tab"}
          </button>
        </section>
      );
    }

    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "비즈니스 노출" : "Business impressions"}</p>
            <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{metrics.businessImpressions}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "비즈니스 클릭" : "Business clicks"}</p>
            <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{metrics.businessClicks}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "일정 노출" : "Event impressions"}</p>
            <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{metrics.eventImpressions}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{locale === "ko" ? "일정 클릭" : "Event clicks"}</p>
            <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{metrics.eventClicks}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {locale === "ko" ? "연락 경로 클릭 수" : "Contact path clicks"}
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {pathClicks.map((item) => (
                <div key={item.key} className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{item.label}</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{metrics.ctaClicks[item.key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {locale === "ko" ? "최근 7일 노출/클릭" : "Last 7 days"}
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {dailyMetrics.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {locale === "ko" ? "아직 집계된 데이터가 없습니다." : "No data yet."}
                </p>
              ) : (
                dailyMetrics.map((item) => (
                  <div key={item.date} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{item.date}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {locale === "ko" ? "노출" : "Views"} <strong className="text-zinc-900 dark:text-zinc-100">{item.impressions}</strong>
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {locale === "ko" ? "클릭" : "Clicks"} <strong className="text-zinc-900 dark:text-zinc-100">{item.clicks}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "일정별 노출/클릭" : "Event performance"}
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {eventMetrics.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {locale === "ko" ? "등록된 일정 또는 집계 데이터가 없습니다." : "No events or metrics yet."}
              </p>
            ) : (
              eventMetrics.slice(0, 6).map((item) => (
                <div key={item.eventId} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.startTime.slice(0, 16).replace("T", " ")}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                    <span>{locale === "ko" ? "노출" : "Views"} {item.impressions}</span>
                    <span>{locale === "ko" ? "클릭" : "Clicks"} {item.clicks}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "performance" ? renderPerformance() : null}
      {activeTab === "business" ? <LoungeBusinessForm locale={locale} business={business} /> : null}
      {activeTab === "events" ? <LoungeEventForm locale={locale} events={events} /> : null}
      {activeTab === "operations" && isSuperUser ? (
        <div className="space-y-6">
          <LoungeFeatureManager locale={locale} businesses={featuredBusinesses} />
          <LoungeMembershipManager locale={locale} admins={admins} memberships={memberships} />
        </div>
      ) : null}
    </div>
  );
}
