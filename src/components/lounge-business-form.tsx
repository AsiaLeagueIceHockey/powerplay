"use client";

import { useState, useTransition } from "react";
import { Store } from "lucide-react";
import type { LoungeBusiness } from "@/app/actions/lounge";
import { upsertLoungeBusiness } from "@/app/actions/lounge";

export function LoungeBusinessForm({
  locale,
  business,
}: {
  locale: string;
  business: LoungeBusiness | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [published, setPublished] = useState<boolean>(business?.is_published ?? true);

  return (
    <form
      className="space-y-5 rounded-2xl border border-zinc-200 bg-[linear-gradient(180deg,#f5f5f4_0%,#ffffff_100%)] p-6 shadow-sm dark:border-zinc-800 dark:bg-[linear-gradient(180deg,#18181b_0%,#0f172a_100%)]"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("is_published", String(published));
        startTransition(async () => {
          const result = await upsertLoungeBusiness(formData);
          if (!result.success) {
            alert(result.error || (locale === "ko" ? "저장에 실패했습니다." : "Save failed."));
            return;
          }
          alert(locale === "ko" ? "사업장 정보가 저장되었습니다." : "Business saved.");
        });
      }}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "대표 사업장 정보" : "Representative business"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {locale === "ko" ? "구독 계정당 1개의 대표 사업장만 운영합니다." : "One representative business per subscribed admin."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "사업장명" : "Business name"}</span>
          <input name="name" required defaultValue={business?.name ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "카테고리" : "Category"}</span>
          <select name="category" defaultValue={business?.category ?? "lesson"} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <option value="lesson">{locale === "ko" ? "하키 레슨" : "Lesson"}</option>
            <option value="training_center">{locale === "ko" ? "훈련장 / 슈팅센터" : "Training Center"}</option>
            <option value="tournament">{locale === "ko" ? "대회" : "Tournament"}</option>
            <option value="brand">{locale === "ko" ? "브랜드" : "Brand"}</option>
            <option value="service">{locale === "ko" ? "서비스" : "Service"}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "노출 우선순위" : "Display priority"}</span>
          <input
            name="display_priority"
            inputMode="numeric"
            defaultValue={business?.display_priority ?? 0}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "한 줄 소개" : "Tagline"}</span>
          <input name="tagline" defaultValue={business?.tagline ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "설명" : "Description"}</span>
          <textarea name="description" defaultValue={business?.description ?? ""} rows={5} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Logo URL</span>
          <input name="logo_url" defaultValue={business?.logo_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Cover URL</span>
          <input name="cover_image_url" defaultValue={business?.cover_image_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "주소" : "Address"}</span>
          <input name="address" defaultValue={business?.address ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "전화" : "Phone"}</span>
          <input name="phone" defaultValue={business?.phone ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Kakao URL</span>
          <input name="kakao_open_chat_url" defaultValue={business?.kakao_open_chat_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Instagram URL</span>
          <input name="instagram_url" defaultValue={business?.instagram_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Website URL</span>
          <input name="website_url" defaultValue={business?.website_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
        {locale === "ko" ? "즉시 공개" : "Publish now"}
      </label>

      <button type="submit" disabled={isPending} className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
        {isPending ? (locale === "ko" ? "저장 중..." : "Saving...") : (locale === "ko" ? "사업장 저장" : "Save business")}
      </button>
    </form>
  );
}
