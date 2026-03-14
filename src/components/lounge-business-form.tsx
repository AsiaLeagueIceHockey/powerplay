"use client";

import { useRef, useState, useTransition } from "react";
import { Image as ImageIcon, Loader2, MapPin, Search, Store, Upload, X } from "lucide-react";
import type { LoungeBusiness } from "@/app/actions/lounge";
import { parseNaverMapUrl } from "@/app/actions/admin";
import { uploadLoungeImage, upsertLoungeBusiness } from "@/app/actions/lounge";

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<"logo" | "cover" | null>(null);
  const [logoUrl, setLogoUrl] = useState(business?.logo_url ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(business?.cover_image_url ?? "");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [locationState, setLocationState] = useState({
    map_url: business?.map_url ?? "",
    address: business?.address ?? "",
    lat: business?.lat?.toString() ?? "",
    lng: business?.lng?.toString() ?? "",
  });

  const uploadImage = async (target: "logo" | "cover", file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError(locale === "ko" ? "이미지 파일만 업로드할 수 있습니다." : "Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(locale === "ko" ? "파일 크기는 5MB 이하여야 합니다." : "File size must be 5MB or less.");
      return;
    }

    setUploadingTarget(target);
    setUploadError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadLoungeImage(formData);

    if (!result.url) {
      setUploadError(result.error || (locale === "ko" ? "이미지 업로드에 실패했습니다." : "Image upload failed."));
      setUploadingTarget(null);
      return;
    }

    if (target === "logo") {
      setLogoUrl(result.url);
    } else {
      setCoverImageUrl(result.url);
    }

    setUploadingTarget(null);
  };

  return (
    <form
      className="space-y-5 rounded-3xl border border-zinc-700 bg-[linear-gradient(180deg,#3f3f46_0%,#27272a_100%)] p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("is_published", String(published));
        formData.set("map_url", locationState.map_url);
        formData.set("address", locationState.address);
        formData.set("lat", locationState.lat);
        formData.set("lng", locationState.lng);
        formData.set("logo_url", logoUrl);
        formData.set("cover_image_url", coverImageUrl);
        startTransition(async () => {
          const result = await upsertLoungeBusiness(formData);
          if (!result.success) {
            alert(result.error || (locale === "ko" ? "저장에 실패했습니다." : "Save failed."));
            return;
          }
          alert(locale === "ko" ? "비즈니스 정보가 저장되었습니다." : "Business saved.");
        });
      }}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-100">
            {locale === "ko" ? "대표 비즈니스 정보" : "Representative business"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {locale === "ko" ? "구독 계정당 1개의 대표 비즈니스만 운영합니다." : "One representative business per subscribed admin."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "비즈니스명" : "Business name"}</span>
          <input name="name" required defaultValue={business?.name ?? ""} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 placeholder:text-zinc-500" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "카테고리" : "Category"}</span>
          <select name="category" defaultValue={business?.category ?? "lesson"} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100">
            <option value="lesson">{locale === "ko" ? "하키 레슨" : "Lesson"}</option>
            <option value="training_center">{locale === "ko" ? "훈련장 / 슈팅센터" : "Training Center"}</option>
            <option value="tournament">{locale === "ko" ? "대회" : "Tournament"}</option>
            <option value="brand">{locale === "ko" ? "브랜드" : "Brand"}</option>
            <option value="service">{locale === "ko" ? "퍼포먼스 솔루션" : "Performance Solution"}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "한 줄 소개" : "Tagline"}</span>
          <input name="tagline" defaultValue={business?.tagline ?? ""} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "설명" : "Description"}</span>
          <textarea name="description" defaultValue={business?.description ?? ""} rows={5} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-5">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {locale === "ko" ? "로고 이미지" : "Logo image"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              {locale === "ko" ? "프로필처럼 작게 보이는 대표 이미지입니다." : "Small representative image shown like a profile."}
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950">
              {logoUrl ? (
                <img src={logoUrl} alt="Business logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-zinc-400" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage("logo", file);
                }}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingTarget === "logo"}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
              >
                {uploadingTarget === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {locale === "ko" ? "로고 업로드" : "Upload logo"}
              </button>
              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
                >
                  <X className="h-3 w-3" />
                  {locale === "ko" ? "로고 삭제" : "Remove logo"}
                </button>
              ) : null}
              <p className="text-xs text-zinc-400">PNG, JPG, WEBP, GIF / 5MB max</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-5">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {locale === "ko" ? "커버 이미지" : "Cover image"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              {locale === "ko" ? "목록 카드와 상세 상단에 크게 보이는 이미지입니다." : "Large visual used on cards and the detail header."}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950">
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="Business cover" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-zinc-400" />
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage("cover", file);
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingTarget === "cover"}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
              >
                {uploadingTarget === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {locale === "ko" ? "커버 업로드" : "Upload cover"}
              </button>
              {coverImageUrl ? (
                <button
                  type="button"
                  onClick={() => setCoverImageUrl("")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
                >
                  <X className="h-3 w-3" />
                  {locale === "ko" ? "커버 삭제" : "Remove cover"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {uploadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
          {uploadError}
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-5">
        <div>
          <p className="text-sm font-semibold text-zinc-100">
            {locale === "ko" ? "비즈니스 위치" : "Business location"}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            {locale === "ko"
              ? "네이버 지도 URL을 넣으면 주소와 좌표를 자동으로 채웁니다. 목록에는 시/구 정도의 지역이 먼저 노출됩니다."
              : "Paste a Naver Map URL to autofill address and coordinates."}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="url"
            value={locationState.map_url}
            onChange={(event) => setLocationState((prev) => ({ ...prev, map_url: event.target.value }))}
            placeholder="https://naver.me/..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950"
          >
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {locale === "ko" ? "정보 가져오기" : "Fetch info"}
          </button>
        </div>
        {mapError ? <p className="text-sm text-red-600 dark:text-red-400">{mapError}</p> : null}
        <div className="rounded-xl bg-zinc-950 p-4 text-sm">
          <div className="flex items-start gap-2 text-zinc-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{locationState.address || (locale === "ko" ? "주소 미등록" : "No address yet")}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {locationState.lat && locationState.lng ? `${locationState.lat}, ${locationState.lng}` : (locale === "ko" ? "좌표 미등록" : "No coordinates yet")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "전화" : "Phone"}</span>
          <input name="phone" defaultValue={business?.phone ?? ""} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">Kakao URL</span>
          <input name="kakao_open_chat_url" defaultValue={business?.kakao_open_chat_url ?? ""} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">Instagram URL</span>
          <input name="instagram_url" defaultValue={business?.instagram_url ?? ""} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">Website URL</span>
          <input name="website_url" defaultValue={business?.website_url ?? ""} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-200">
        <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
        {locale === "ko" ? "즉시 공개" : "Publish now"}
      </label>

      <button type="submit" disabled={isPending} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50">
        {isPending ? (locale === "ko" ? "저장 중..." : "Saving...") : (locale === "ko" ? "비즈니스 저장" : "Save business")}
      </button>
    </form>
  );
}
