"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClub, updateClub } from "@/app/actions/clubs";
import { Loader2, MessageCircle } from "lucide-react";
import type { Club } from "@/app/actions/types";

interface ClubFormProps {
  locale: string;
  club?: Club;
}

export function ClubForm({ locale, club }: ClubFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!club;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = isEdit
      ? await updateClub(club.id, formData)
      : await createClub(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${locale}/admin/clubs`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-lg">{error}</div>
      )}

      {/* 동호회명 */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          동호회명 *
        </label>
        <input
          type="text"
          name="name"
          defaultValue={club?.name || ""}
          required
          placeholder="예: 하키러브"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          동호회 소개 (선택)
        </label>
        <textarea
          name="description"
          defaultValue={club?.description || ""}
          rows={4}
          placeholder="동호회에 대한 간단한 소개를 입력해주세요."
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 카카오톡 오픈채팅 URL */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          <MessageCircle className="w-4 h-4 inline mr-1" />
          카카오톡 오픈채팅 URL (선택)
        </label>
        <p className="text-xs text-zinc-500 mb-2">
          동호회 오픈채팅방 링크를 입력하면 멤버들에게 노출됩니다.
        </p>
        <input
          type="url"
          name="kakao_open_chat_url"
          defaultValue={club?.kakao_open_chat_url || ""}
          placeholder="https://open.kakao.com/o/..."
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isEdit ? "저장 중..." : "생성 중..."}
          </>
        ) : isEdit ? (
          "저장"
        ) : (
          "동호회 등록"
        )}
      </button>
    </form>
  );
}
