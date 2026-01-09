"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRink, updateRink } from "@/app/actions/admin";

interface RinkFormProps {
  locale: string;
  rink?: {
    id: string;
    name_ko: string;
    name_en: string;
    map_url: string | null;
  };
}

export function RinkForm({ locale, rink }: RinkFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!rink;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = isEdit
      ? await updateRink(rink.id, formData)
      : await createRink(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${locale}/admin/rinks`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-lg">{error}</div>
      )}

      {/* Korean Name */}
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

      {/* English Name */}
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

      {/* Map URL */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          지도 URL (선택)
        </label>
        <input
          type="url"
          name="map_url"
          defaultValue={rink?.map_url || ""}
          placeholder="https://map.naver.com/..."
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
      >
        {loading
          ? isEdit
            ? "저장 중..."
            : "생성 중..."
          : isEdit
            ? "저장"
            : "링크 추가"}
      </button>
    </form>
  );
}
