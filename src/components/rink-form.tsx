"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRink, updateRink, parseNaverMapUrl } from "@/app/actions/admin";
import { Loader2, MapPin, Search } from "lucide-react";

interface RinkFormProps {
  locale: string;
  rink?: {
    id: string;
    name_ko: string;
    name_en: string;
    map_url: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    rink_type?: "FULL" | "MINI" | null;
  };
}

export function RinkForm({ locale, rink }: RinkFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for auto-filled fields
  const [formData, setFormData] = useState({
    map_url: rink?.map_url || "",
    address: rink?.address || "",
    lat: rink?.lat?.toString() || "",
    lng: rink?.lng?.toString() || "",
  });

  const isEdit = !!rink;

  const handleParseUrl = async () => {
    if (!formData.map_url) {
      setError("네이버 지도 URL을 입력해주세요.");
      return;
    }

    setParsing(true);
    setError(null);

    const result = await parseNaverMapUrl(formData.map_url);

    if (result.success && result.data) {
      setFormData({
        map_url: result.data.mapUrl,
        address: result.data.address,
        lat: result.data.lat.toString(),
        lng: result.data.lng.toString(),
      });
    } else {
      setError(result.error || "URL 파싱 실패");
    }

    setParsing(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formDataObj = new FormData(e.currentTarget);
    
    // Add parsed data to form
    formDataObj.set("map_url", formData.map_url);
    formDataObj.set("address", formData.address);
    formDataObj.set("lat", formData.lat);
    formDataObj.set("lng", formData.lng);

    const result = isEdit
      ? await updateRink(rink.id, formDataObj)
      : await createRink(formDataObj);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${locale}/admin/rinks`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-lg">{error}</div>
      )}

      {/* Naver Map URL - Primary Input */}
      <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            <MapPin className="w-4 h-4 inline mr-1" />
            네이버 지도 URL *
          </label>
          <p className="text-xs text-zinc-500 mb-2">
            네이버 지도에서 링크장을 검색 후 공유 URL을 붙여넣기 하세요.
            <br />
            예: https://naver.me/Fx9u4qot
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={formData.map_url}
              onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
              required={!isEdit}
              placeholder="https://naver.me/..."
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleParseUrl}
              disabled={parsing || !formData.map_url}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  가져오는 중...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  정보 가져오기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Auto-filled Info (Read-only display) */}
        {(formData.lat || formData.address) && (
          <div className="pt-3 border-t border-zinc-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">좌표</span>
              <span className="text-zinc-200 font-mono text-xs">
                {formData.lat && formData.lng ? `${formData.lat}, ${formData.lng}` : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">주소</span>
              <span className="text-zinc-200 text-xs text-right max-w-[250px]">
                {formData.address || "-"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Korean Name - Required */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          한국어 이름 *
        </label>
        <input
          type="text"
          name="name_ko"
          defaultValue={rink?.name_ko || ""}
          required
          placeholder="예: 목동 아이스링크"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* English Name - Required */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          영어 이름 *
        </label>
        <input
          type="text"
          name="name_en"
          defaultValue={rink?.name_en || ""}
          required
          placeholder="e.g. Mokdong Ice Rink"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Rink Type - Optional */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          링크 타입 (선택)
        </label>
        <select
          name="rink_type"
          defaultValue={rink?.rink_type || ""}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          <option value="FULL">정규 규격 (FULL)</option>
          <option value="MINI">미니 링크 (MINI)</option>
        </select>
      </div>

      {/* Hidden fields for parsed data */}
      <input type="hidden" name="address" value={formData.address} />
      <input type="hidden" name="lat" value={formData.lat} />
      <input type="hidden" name="lng" value={formData.lng} />

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
      >
        {loading
          ? isEdit
            ? "저장 중..."
            : "생성 중..."
          : isEdit
            ? "저장"
            : "링크장 추가"}
      </button>
    </form>
  );
}
