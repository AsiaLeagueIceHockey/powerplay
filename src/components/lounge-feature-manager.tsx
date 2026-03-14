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
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "추천 비즈니스 관리" : "Featured business manager"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {locale === "ko"
            ? "추천 노출은 슈퍼유저만 관리합니다. 추천된 비즈니스끼리는 작은 숫자가 먼저 보입니다."
            : "Only superusers manage featured exposure. Among featured businesses, lower numbers appear first."}
        </p>
      </div>

      {sortedBusinesses.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {locale === "ko" ? "등록된 비즈니스가 없습니다." : "No businesses yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {sortedBusinesses.map((business) => (
            <form
              key={business.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
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
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{business.name}</p>
                    {business.is_featured ? (
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {locale === "ko" ? "추천 중" : "Featured"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{ownerLabel(business)}</p>
                  {business.tagline ? (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{business.tagline}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-[auto_110px_auto] md:items-end">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    <input type="hidden" name="is_featured" value="false" />
                    <input type="checkbox" name="is_featured" value="true" defaultChecked={business.is_featured} />
                    {locale === "ko" ? "추천으로 노출" : "Mark as featured"}
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "추천 순서" : "Featured order"}</span>
                    <input
                      name="featured_order"
                      inputMode="numeric"
                      defaultValue={business.featured_order}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
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
