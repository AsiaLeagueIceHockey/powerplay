"use client";

import { useEffect, useMemo, useState } from "react";

import type { LoungeBusiness } from "@/app/actions/lounge";
import {
  getManagedLoungeNotices,
  type LoungeNotice,
} from "@/app/actions/lounge-notices";

import { LoungeNoticeManager } from "./lounge-notice-manager";

export function LoungeSuperuserNoticeManager({
  locale,
  businesses,
}: {
  locale: string;
  businesses: LoungeBusiness[];
}) {
  const [selectedBusinessId, setSelectedBusinessId] = useState(businesses[0]?.id ?? "");
  const [notices, setNotices] = useState<LoungeNotice[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(businesses[0]));
  const [loadError, setLoadError] = useState(false);
  const [loadedBusinessId, setLoadedBusinessId] = useState<string | null>(null);

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadNotices() {
      if (!selectedBusinessId) {
        setNotices([]);
        setLoadedBusinessId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(false);
      try {
        const nextNotices = await getManagedLoungeNotices(selectedBusinessId);
        if (!cancelled) {
          setNotices(nextNotices);
          setLoadedBusinessId(selectedBusinessId);
        }
      } catch (error) {
        console.error("[lounge-notices] superuser load failed:", error);
        if (!cancelled) {
          setNotices([]);
          setLoadError(true);
          setLoadedBusinessId(selectedBusinessId);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadNotices();
    return () => {
      cancelled = true;
    };
  }, [selectedBusinessId]);

  if (businesses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-800 p-8 text-center text-sm text-zinc-400">
        {locale === "ko" ? "등록된 라운지 비즈니스가 없습니다." : "No Lounge businesses are registered."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <label className="block rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
        <span className="mb-2 block text-sm font-semibold text-zinc-200">
          {locale === "ko" ? "공지 관리 업체" : "Business to manage"}
        </span>
        <select
          value={selectedBusinessId}
          onChange={(event) => {
            setIsLoading(true);
            setLoadedBusinessId(null);
            setNotices([]);
            setSelectedBusinessId(event.target.value);
          }}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 md:max-w-xl"
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name} · {business.is_published
                ? locale === "ko" ? "공개" : "Published"
                : locale === "ko" ? "비공개" : "Hidden"}
            </option>
          ))}
        </select>
      </label>

      {isLoading || loadedBusinessId !== selectedBusinessId ? (
        <div className="rounded-3xl border border-zinc-700 bg-zinc-800 p-8 text-center text-sm text-zinc-400">
          {locale === "ko" ? "공지를 불러오는 중입니다..." : "Loading notices..."}
        </div>
      ) : (
        <LoungeNoticeManager
          key={selectedBusiness?.id}
          locale={locale}
          business={selectedBusiness}
          membership={null}
          membershipActive
          notices={notices}
          initialLoadError={loadError}
        />
      )}
    </div>
  );
}
