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
    const base: Array<{ id: LoungeAdminTab; label: string }> = [
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
    { key: "instagram", label: locale === "ko" ? "인스타그램" : "Instagram" },
    { key: "website", label: locale === "ko" ? "웹사이트" : "Website" },
    { key: "phone", label: locale === "ko" ? "전화" : "Phone" },
  ] as const;

  const renderPerformance = () => {
    if (!business) {
      return (
        <section className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/70 p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-zinc-100">
            {locale === "ko" ? "먼저 비즈니스 정보를 등록해주세요" : "Create your business profile first"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {locale === "ko"
              ? "비즈니스 정보가 있어야 라운지 노출과 클릭 데이터를 확인할 수 있습니다."
              : "Performance data appears after your business profile is ready."}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("business")}
            className="mt-4 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950"
          >
            {locale === "ko" ? "비즈니스 등록하러 가기" : "Go to business tab"}
          </button>
        </section>
      );
    }

    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: locale === "ko" ? "비즈니스 노출" : "Business impressions", value: metrics.businessImpressions },
            { label: locale === "ko" ? "비즈니스 클릭" : "Business clicks", value: metrics.businessClicks },
            { label: locale === "ko" ? "일정 노출" : "Event impressions", value: metrics.eventImpressions },
            { label: locale === "ko" ? "일정 클릭" : "Event clicks", value: metrics.eventClicks },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
              <p className="text-sm text-zinc-400">{item.label}</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-zinc-50">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-100">
              {locale === "ko" ? "연락 경로 클릭 수" : "Contact clicks"}
            </h2>
            <div className="mt-4 space-y-3">
              {pathClicks.map((item) => (
                <div key={item.key} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-200">{item.label}</p>
                    <p className="text-lg font-black text-zinc-50">{metrics.ctaClicks[item.key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-100">
              {locale === "ko" ? "최근 7일 노출/클릭" : "Last 7 days"}
            </h2>
            <div className="mt-4 space-y-3">
              {dailyMetrics.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  {locale === "ko" ? "아직 집계된 데이터가 없습니다." : "No data yet."}
                </p>
              ) : (
                dailyMetrics.map((item) => (
                  <div key={item.date} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-200">{item.date}</p>
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span>
                          {locale === "ko" ? "노출" : "Views"} <strong className="text-zinc-100">{item.impressions}</strong>
                        </span>
                        <span>
                          {locale === "ko" ? "클릭" : "Clicks"} <strong className="text-zinc-100">{item.clicks}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-100">
            {locale === "ko" ? "일정별 노출/클릭" : "Event performance"}
          </h2>
          <div className="mt-4 space-y-3">
            {eventMetrics.length === 0 ? (
              <p className="text-sm text-zinc-400">
                {locale === "ko" ? "등록된 일정 또는 집계 데이터가 없습니다." : "No events or metrics yet."}
              </p>
            ) : (
              eventMetrics.slice(0, 6).map((item) => (
                <div key={item.eventId} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-400">{item.startTime.slice(0, 16).replace("T", " ")}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-zinc-400">
                    <span>{locale === "ko" ? "노출" : "Views"} <strong className="text-zinc-100">{item.impressions}</strong></span>
                    <span>{locale === "ko" ? "클릭" : "Clicks"} <strong className="text-zinc-100">{item.clicks}</strong></span>
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
