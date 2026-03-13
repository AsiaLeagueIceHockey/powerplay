"use client";

import { useState, useTransition } from "react";
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
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
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
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "대표 사업장 정보" : "Representative business"}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {locale === "ko" ? "구독 계정당 1개의 대표 사업장만 운영합니다." : "One representative business per subscribed admin."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "사업장명" : "Business name"}</span>
          <input name="name" required defaultValue={business?.name ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "카테고리" : "Category"}</span>
          <select name="category" defaultValue={business?.category ?? "lesson"} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950">
            <option value="lesson">{locale === "ko" ? "하키 레슨" : "Lesson"}</option>
            <option value="training_center">{locale === "ko" ? "훈련장 / 슈팅센터" : "Training Center"}</option>
            <option value="tournament">{locale === "ko" ? "대회" : "Tournament"}</option>
            <option value="brand">{locale === "ko" ? "브랜드" : "Brand"}</option>
            <option value="service">{locale === "ko" ? "서비스" : "Service"}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium">{locale === "ko" ? "한 줄 소개" : "Tagline"}</span>
          <input name="tagline" defaultValue={business?.tagline ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium">{locale === "ko" ? "설명" : "Description"}</span>
          <textarea name="description" defaultValue={business?.description ?? ""} rows={5} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Logo URL</span>
          <input name="logo_url" defaultValue={business?.logo_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Cover URL</span>
          <input name="cover_image_url" defaultValue={business?.cover_image_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium">{locale === "ko" ? "주소" : "Address"}</span>
          <input name="address" defaultValue={business?.address ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "전화" : "Phone"}</span>
          <input name="phone" defaultValue={business?.phone ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Kakao URL</span>
          <input name="kakao_open_chat_url" defaultValue={business?.kakao_open_chat_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Instagram URL</span>
          <input name="instagram_url" defaultValue={business?.instagram_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Website URL</span>
          <input name="website_url" defaultValue={business?.website_url ?? ""} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
        {locale === "ko" ? "즉시 공개" : "Publish now"}
      </label>

      <button type="submit" disabled={isPending} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {isPending ? (locale === "ko" ? "저장 중..." : "Saving...") : (locale === "ko" ? "사업장 저장" : "Save business")}
      </button>
    </form>
  );
}
