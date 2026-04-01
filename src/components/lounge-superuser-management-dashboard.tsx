"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, PencilLine, Phone, UserRound } from "lucide-react";
import type {
  LoungeManagedMembership,
  LoungeBusiness,
  LoungeBusinessCategory,
  LoungeManagedApplication,
  LoungeBusinessPerformance,
} from "@/app/actions/lounge";
import { LoungeBannerManager } from "./lounge-banner-manager";
import { getLoungeBusinessCategoryLabel } from "@/lib/lounge-business-category";
import { LoungeApplicationManager } from "./lounge-application-manager";
import { LoungeFeatureManager } from "./lounge-feature-manager";
import { LoungeMembershipManager } from "./lounge-membership-manager";
import { LoungePerformancePanel } from "./lounge-performance-panel";

interface AdminOption {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: "admin" | "superuser" | null;
}

type LoungeManagementTab = "overview" | "register" | "applications" | "performance" | "featured" | "banner";

type LoungeMembershipPhase = "upcoming" | "active" | "expired" | "canceled";

function formatDateRange(locale: string, startsAt: string, endsAt: string) {
  const formatKstDate = (input: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Seoul",
    }).formatToParts(new Date(input));

    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    return `${year}-${month}-${day}`;
  };

  return `${formatKstDate(startsAt)} ~ ${formatKstDate(endsAt)}`;
}

function getMembershipPhase(membership: LoungeManagedMembership): LoungeMembershipPhase {
  if (membership.status === "canceled") {
    return "canceled";
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date());

  const startsAt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(membership.starts_at));

  const endsAt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(membership.ends_at));

  if (today < startsAt) {
    return "upcoming";
  }

  if (today > endsAt) {
    return "expired";
  }

  return "active";
}

function getMembershipPhaseLabel(locale: string, phase: LoungeMembershipPhase) {
  if (phase === "active") return locale === "ko" ? "운영 중" : "Active";
  if (phase === "upcoming") return locale === "ko" ? "시작 전" : "Upcoming";
  if (phase === "expired") return locale === "ko" ? "만료" : "Expired";
  return locale === "ko" ? "해지" : "Canceled";
}

function getCategoryLabel(locale: string, category?: LoungeBusinessCategory) {
  if (!category) return locale === "ko" ? "비즈니스 미등록" : "No business";
  return getLoungeBusinessCategoryLabel(locale, category);
}

export function LoungeSuperuserManagementDashboard({
  locale,
  memberships,
  applications,
  admins,
  businesses,
  performanceBusinesses,
}: {
  locale: string;
  memberships: LoungeManagedMembership[];
  applications: LoungeManagedApplication[];
  admins: AdminOption[];
  businesses: LoungeBusiness[];
  performanceBusinesses: LoungeBusinessPerformance[];
}) {
  const [activeTab, setActiveTab] = useState<LoungeManagementTab>("overview");
  const [editingMembership, setEditingMembership] = useState<LoungeManagedMembership | null>(null);
  const [selectedPerformanceBusinessId, setSelectedPerformanceBusinessId] = useState<string>(
    performanceBusinesses[0]?.business.id ?? ""
  );

  const sortedMemberships = useMemo(() => {
    return [...memberships].sort((a, b) => {
      const activeOrder = (phase: LoungeMembershipPhase) => {
        if (phase === "active") return 0;
        if (phase === "upcoming") return 1;
        if (phase === "expired") return 2;
        return 3;
      };

      const statusDiff = activeOrder(getMembershipPhase(a)) - activeOrder(getMembershipPhase(b));
      if (statusDiff !== 0) return statusDiff;

      return new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime();
    });
  }, [memberships]);

  const selectedPerformanceBusiness =
    performanceBusinesses.find((item) => item.business.id === selectedPerformanceBusinessId) ??
    performanceBusinesses[0] ??
    null;

  const tabs = [
    { id: "overview" as const, label: locale === "ko" ? "구독 관리" : "Memberships" },
    { id: "register" as const, label: locale === "ko" ? "구독 등록" : "Register" },
    { id: "applications" as const, label: locale === "ko" ? "신청 문의" : "Applications" },
    { id: "performance" as const, label: locale === "ko" ? "성과 확인" : "Performance" },
    { id: "featured" as const, label: locale === "ko" ? "추천 비즈니스" : "Featured" },
    { id: "banner" as const, label: locale === "ko" ? "배너 관리" : "Banner" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-zinc-700 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_38%),linear-gradient(135deg,#3f3f46_0%,#27272a_50%,#18181b_100%)] px-5 py-4 shadow-sm">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900">
            {locale === "ko" ? "PowerPlay Lounge SuperUser" : "PowerPlay Lounge SuperUser"}
          </span>
          <h1 className="mt-3 text-xl font-black tracking-tight text-zinc-100 md:text-2xl">
            {locale === "ko" ? "라운지 구독 운영 관리" : "Lounge membership operations"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            {locale === "ko"
              ? "구독 중인 비즈니스와 계약 기간을 한 곳에서 확인하고, 필요한 경우 바로 조정할 수 있습니다."
              : "Review active lounge memberships and update contract details in one place."}
          </p>
        </div>
      </section>

      <section className="border-b border-zinc-800">
        <div className="flex min-w-max gap-6 overflow-x-auto pb-3">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "overview") {
                    setEditingMembership(null);
                  }
                }}
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

      {activeTab === "overview" ? (
        <div className="space-y-6">
          {editingMembership ? (
            <LoungeMembershipManager
              key={editingMembership.id}
              locale={locale}
              admins={admins}
              initialMembership={editingMembership}
              showRecentList={false}
              title={locale === "ko" ? "구독 정보 수정" : "Edit membership"}
              description={
                locale === "ko"
                  ? "기간, 금액, 메모, 문의 채널을 바로 수정할 수 있습니다."
                  : "Adjust dates, pricing, notes, and inquiry channel."
              }
              onCancel={() => setEditingMembership(null)}
            />
          ) : null}

          <section className="grid gap-4 xl:grid-cols-2">
            {sortedMemberships.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-800 p-8 text-center text-sm text-zinc-400 xl:col-span-2">
                {locale === "ko" ? "등록된 라운지 구독이 없습니다." : "No memberships yet."}
              </div>
            ) : (
              sortedMemberships.map((membership) => {
                const statusLabel = getMembershipPhaseLabel(locale, getMembershipPhase(membership));
                const categoryLabel = getCategoryLabel(locale, membership.business?.category);

                return (
                  <article key={membership.id} className="rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-zinc-950">
                            {statusLabel}
                          </span>
                          <span className="rounded-full bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-zinc-200">
                            {categoryLabel}
                          </span>
                          {membership.business ? (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                membership.business.is_published
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-zinc-900 text-zinc-400"
                              }`}
                            >
                              {membership.business.is_published
                                ? locale === "ko" ? "공개 중" : "Published"
                                : locale === "ko" ? "비공개" : "Hidden"}
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {locale === "ko" ? "비즈니스" : "Business"}
                          </p>
                          <p className="mt-1 text-lg font-bold text-zinc-100">
                            {membership.business?.name || (locale === "ko" ? "아직 등록된 비즈니스 없음" : "No business profile yet")}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingMembership(membership)}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 px-3 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900/60"
                      >
                        <PencilLine className="h-4 w-4" />
                        {locale === "ko" ? "수정" : "Edit"}
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                              {locale === "ko" ? "등록 계정" : "Account"}
                            </p>
                            <Link
                              href={`/${locale}/admin/admins/${membership.user_id}`}
                              className="mt-1 inline-flex items-center gap-2 text-base font-bold text-zinc-100 hover:text-amber-300"
                            >
                              <UserRound className="h-4 w-4" />
                              {membership.user?.full_name || membership.user?.email || membership.user_id}
                            </Link>
                            <p className="mt-1 text-sm text-zinc-400">{membership.user?.email || "-"}</p>
                            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                              <Phone className="h-4 w-4 text-zinc-500" />
                              {membership.user?.phone ? (
                                <a href={`tel:${membership.user.phone}`} className="hover:text-amber-300">
                                  {membership.user.phone}
                                </a>
                              ) : (
                                <span className="text-zinc-500">{locale === "ko" ? "전화번호 없음" : "No phone"}</span>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/${locale}/admin/admins/${membership.user_id}`}
                            className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-white"
                          >
                            {locale === "ko" ? "프로필 상세" : "View profile"}
                          </Link>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                          <CalendarDays className="h-4 w-4 text-zinc-500" />
                          {formatDateRange(locale, membership.starts_at, membership.ends_at)}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                              {locale === "ko" ? "구독료" : "Price"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-100">
                              {membership.price_krw.toLocaleString()} KRW
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                              {locale === "ko" ? "문의 채널" : "Channel"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-100">
                              {membership.inquiry_channel || "manual"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                            {locale === "ko" ? "메모" : "Note"}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                            {membership.note || (locale === "ko" ? "메모 없음" : "No note")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "featured" ? (
        <LoungeFeatureManager locale={locale} businesses={businesses} />
      ) : null}

      {activeTab === "performance" ? (
        <section className="space-y-4">
          <div className="rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">
                  {locale === "ko" ? "비즈니스 성과 확인" : "Business performance"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {locale === "ko"
                    ? "라운지 구독 중인 비즈니스의 노출, 클릭, 일정 성과를 선택해서 확인할 수 있습니다."
                    : "Select an active lounge business to review its impressions, clicks, and schedule performance."}
                </p>
              </div>
              {performanceBusinesses.length > 0 ? (
                <label className="block md:min-w-[320px]">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">
                    {locale === "ko" ? "비즈니스 선택" : "Select business"}
                  </span>
                  <select
                    value={selectedPerformanceBusiness?.business.id ?? ""}
                    onChange={(event) => setSelectedPerformanceBusinessId(event.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
                  >
                    {performanceBusinesses.map((item) => (
                      <option key={item.business.id} value={item.business.id}>
                        {item.business.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>

          <LoungePerformancePanel
            locale={locale}
            business={selectedPerformanceBusiness?.business ?? null}
            metrics={selectedPerformanceBusiness?.metrics ?? {
              businessImpressions: 0,
              businessClicks: 0,
              eventImpressions: 0,
              eventClicks: 0,
              homeBannerImpressions: 0,
              homeBannerClicks: 0,
              ctaClicks: {
                phone: 0,
                kakao: 0,
                instagram: 0,
                website: 0,
                detail: 0,
              },
              sourceBreakdown: {},
            }}
            dailyMetrics={selectedPerformanceBusiness?.dailyMetrics ?? []}
            eventMetrics={selectedPerformanceBusiness?.eventMetrics ?? []}
            emptyTitle={locale === "ko" ? "현재 확인할 수 있는 활성 라운지 비즈니스가 없습니다." : "No active lounge businesses available."}
            emptyDescription={
              locale === "ko"
                ? "운영 중인 라운지 구독과 연결된 비즈니스가 있어야 슈퍼유저 성과 화면이 표시됩니다."
                : "Superuser performance data appears when an active lounge subscription has a connected business."
            }
          />
        </section>
      ) : null}

      {activeTab === "banner" ? (
        <LoungeBannerManager locale={locale} businesses={businesses} />
      ) : null}

      {activeTab === "register" ? (
        <LoungeMembershipManager
          locale={locale}
          admins={admins}
          memberships={memberships}
          title={locale === "ko" ? "라운지 구독 등록" : "Register lounge membership"}
          description={
            locale === "ko"
              ? "신규 관리자 또는 슈퍼유저 계정에 라운지 계약 기간과 금액을 등록합니다."
              : "Assign a new lounge contract to an admin or superuser account."
          }
          showRecentList={false}
        />
      ) : null}

      {activeTab === "applications" ? (
        <LoungeApplicationManager
          locale={locale}
          applications={applications}
        />
      ) : null}
    </div>
  );
}
