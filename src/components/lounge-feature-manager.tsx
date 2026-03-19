"use client";

import { useMemo, useTransition } from "react";
import type { LoungeBusiness } from "@/app/actions/lounge";
import { updateLoungeBusinessFeature } from "@/app/actions/lounge";

export function LoungeFeatureManager({
  locale,
  businesses,
}: {
  locale: string;
  businesses: LoungeBusiness[];
}) {
  const [isPending, startTransition] = useTransition();

  const sortedBusinesses = useMemo(
    () =>
      [...businesses].sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return a.is_featured ? -1 : 1;
        }
        if (a.is_featured && b.is_featured && a.featured_order !== b.featured_order) {
          return a.featured_order - b.featured_order;
        }
        return a.name.localeCompare(b.name, locale === "ko" ? "ko" : "en", { sensitivity: "base" });
      }),
    [businesses, locale]
  );

  const ownerLabel = (business: LoungeBusiness) =>
    [business.owner?.full_name, business.owner?.email, business.owner?.phone].filter(Boolean).join(" / ") ||
    business.owner_user_id;

  return (
    <section className="space-y-4 rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">
          {locale === "ko" ? "추천 비즈니스 관리" : "Featured business manager"}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {locale === "ko"
            ? "추천 노출은 슈퍼유저만 관리합니다. 라운지의 하키 정보 목록 상단에 먼저 노출되며, 추천 순서는 1이 가장 먼저 보입니다."
            : "Only superusers manage featured exposure. Featured businesses appear first in the Lounge info list, and order 1 appears before order 2."}
        </p>
      </div>

      {sortedBusinesses.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {locale === "ko" ? "등록된 비즈니스가 없습니다." : "No businesses yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {sortedBusinesses.map((business) => (
            <form
              key={business.id}
              className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                startTransition(async () => {
                  const result = await updateLoungeBusinessFeature(formData);
                  if (!result.success) {
                    alert(result.error || (locale === "ko" ? "저장에 실패했습니다." : "Save failed."));
                    return;
                  }
                  alert(locale === "ko" ? "추천 설정이 저장되었습니다." : "Featured settings saved.");
                });
              }}
            >
              <input type="hidden" name="business_id" value={business.id} />
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-100">{business.name}</p>
                    {business.is_featured ? (
                      <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-zinc-950">
                        {locale === "ko" ? "추천 중" : "Featured"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{ownerLabel(business)}</p>
                  {business.tagline ? (
                    <p className="mt-2 text-sm text-zinc-300">{business.tagline}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-[auto_110px_auto] md:items-end">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <input type="checkbox" name="is_featured" defaultChecked={business.is_featured} />
                    {locale === "ko" ? "추천으로 노출" : "Mark as featured"}
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-zinc-100">{locale === "ko" ? "추천 순서" : "Featured order"}</span>
                    <input
                      name="featured_order"
                      inputMode="numeric"
                      defaultValue={business.featured_order}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
                    />
                    <p className="text-xs text-zinc-500">
                      {locale === "ko" ? "숫자가 작을수록 먼저 보입니다. 예: 1, 2, 3" : "Lower numbers appear first. Example: 1, 2, 3."}
                    </p>
                  </label>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
                  >
                    {locale === "ko" ? "저장" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          ))}
        </div>
      )}
    </section>
  );
}
