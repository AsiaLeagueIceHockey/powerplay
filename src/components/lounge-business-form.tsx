"use client";

import { useState, useTransition } from "react";
import { Loader2, MapPin, Search, Store } from "lucide-react";
import type { LoungeBusiness } from "@/app/actions/lounge";
import { parseNaverMapUrl } from "@/app/actions/admin";
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
  const [parsing, setParsing] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationState, setLocationState] = useState({
    map_url: business?.map_url ?? "",
    address: business?.address ?? "",
    lat: business?.lat?.toString() ?? "",
    lng: business?.lng?.toString() ?? "",
  });

  return (
    <form
      className="space-y-5 rounded-2xl border border-zinc-200 bg-[linear-gradient(180deg,#f5f5f4_0%,#ffffff_100%)] p-6 shadow-sm dark:border-zinc-800 dark:bg-[linear-gradient(180deg,#18181b_0%,#0f172a_100%)]"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("is_published", String(published));
        formData.set("map_url", locationState.map_url);
        formData.set("address", locationState.address);
        formData.set("lat", locationState.lat);
        formData.set("lng", locationState.lng);
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

      <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {locale === "ko" ? "사업장 위치" : "Business location"}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {locale === "ko"
              ? "네이버 지도 URL을 넣으면 주소와 좌표를 자동으로 채웁니다. 목록에는 대략적인 지역이 노출됩니다."
              : "Paste a Naver Map URL to autofill address and coordinates."}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="url"
            value={locationState.map_url}
            onChange={(event) => setLocationState((prev) => ({ ...prev, map_url: event.target.value }))}
            placeholder="https://naver.me/..."
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={async () => {
              if (!locationState.map_url) {
                setMapError(locale === "ko" ? "네이버 지도 URL을 입력하세요." : "Enter a Naver Map URL.");
                return;
              }
              setParsing(true);
              setMapError(null);
              const result = await parseNaverMapUrl(locationState.map_url);
              if (!result.success || !result.data) {
                setMapError(result.error || (locale === "ko" ? "지도 정보를 가져오지 못했습니다." : "Failed to parse map URL."));
                setParsing(false);
                return;
              }
              setLocationState({
                map_url: result.data.mapUrl,
                address: result.data.address,
                lat: result.data.lat.toString(),
                lng: result.data.lng.toString(),
              });
              setParsing(false);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {locale === "ko" ? "정보 가져오기" : "Fetch info"}
          </button>
        </div>
        {mapError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{mapError}</p>
        ) : null}
        <div className="rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900/70">
          <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{locationState.address || (locale === "ko" ? "주소 미등록" : "No address yet")}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {locationState.lat && locationState.lng ? `${locationState.lat}, ${locationState.lng}` : (locale === "ko" ? "좌표 미등록" : "No coordinates yet")}
              </p>
            </div>
          </div>
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
