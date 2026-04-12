"use client";

import Image from "next/image";
import { Trophy } from "lucide-react";
import { useMemo, useTransition } from "react";
import type { LoungeBusiness } from "@/app/actions/lounge";
import { updateLoungeBusinessHomeBanner } from "@/app/actions/lounge";

export function LoungeBannerManager({
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
        if (a.home_banner_enabled !== b.home_banner_enabled) {
          return a.home_banner_enabled ? -1 : 1;
        }

        if (a.home_banner_enabled && b.home_banner_enabled && a.home_banner_order !== b.home_banner_order) {
          return a.home_banner_order - b.home_banner_order;
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
          {locale === "ko" ? "홈 배너 관리" : "Home banner manager"}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {locale === "ko"
            ? "배너 노출을 켠 비즈니스는 홈 상단 배너에서 먼저 노출되고, 그 다음에 인스타그램과 카카오톡 배너가 이어집니다."
            : "Businesses enabled here appear before the Instagram and Kakao banners in the home rotation."}
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
                const enabled = formData.has("home_banner_enabled");
                const title = ((formData.get("home_banner_title") as string) || "").trim();
                const description = ((formData.get("home_banner_description") as string) || "").trim();

                if (enabled && (!title || !description)) {
                  alert(
                    locale === "ko"
                      ? "배너 노출을 켜려면 타이틀과 소개 문구를 모두 입력해주세요."
                      : "Title and description are required when banner exposure is enabled."
                  );
                  return;
                }

                startTransition(async () => {
                  const result = await updateLoungeBusinessHomeBanner(formData);
                  if (!result.success) {
                    alert(result.error || (locale === "ko" ? "저장에 실패했습니다." : "Save failed."));
                    return;
                  }

                  alert(locale === "ko" ? "배너 설정이 저장되었습니다." : "Banner settings saved.");
                });
              }}
            >
              <input type="hidden" name="business_id" value={business.id} />

              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-zinc-700">
                      {business.logo_url ? (
                        <Image
                          src={business.logo_url}
                          alt={business.name}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Trophy className="h-5 w-5 text-amber-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-zinc-100">{business.name}</p>
                        {business.home_banner_enabled ? (
                          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                            {locale === "ko" ? "배너 노출 중" : "Banner on"}
                          </span>
                        ) : null}
                        {business.is_published ? (
                          <span className="rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
                            {locale === "ko" ? "공개 중" : "Published"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-zinc-500">
                            {locale === "ko" ? "비공개" : "Hidden"}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{ownerLabel(business)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-300">
                        {business.home_banner_title || business.name}
                        {" · "}
                        {business.home_banner_description || (locale === "ko" ? "배너 소개 문구를 입력해주세요." : "Add banner description copy.")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 xl:min-w-[360px]">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <input type="checkbox" name="home_banner_enabled" defaultChecked={business.home_banner_enabled} />
                    {locale === "ko" ? "홈 배너 노출 ON" : "Enable home banner"}
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-zinc-100">{locale === "ko" ? "배너 타이틀" : "Banner title"}</span>
                    <input
                      name="home_banner_title"
                      defaultValue={business.home_banner_title ?? ""}
                      placeholder={business.name}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-zinc-100">{locale === "ko" ? "배너 소개" : "Banner description"}</span>
                    <input
                      name="home_banner_description"
                      defaultValue={business.home_banner_description ?? ""}
                      placeholder={locale === "ko" ? "배너에 노출할 한 줄 소개를 입력하세요." : "Add one-line banner copy."}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-zinc-100">{locale === "ko" ? "배너 노출 순서" : "Banner order"}</span>
                    <input
                      name="home_banner_order"
                      inputMode="numeric"
                      defaultValue={business.home_banner_order}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
                    />
                    <p className="text-xs text-zinc-500">
                      {locale === "ko"
                        ? "숫자가 작을수록 먼저 노출됩니다. 예: 1, 2, 3"
                        : "Lower numbers appear earlier. Example: 1, 2, 3."}
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
