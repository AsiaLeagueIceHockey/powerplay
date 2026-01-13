"use client";

import { ClubPost } from "@/app/actions/types";
import { createClubNotice } from "@/app/actions/clubs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, Trash2 } from "lucide-react";

export function AdminClubNotices({
  clubId,
  notices,
}: {
  clubId: string;
  notices: ClubPost[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    const result = await createClubNotice(clubId, title, content);

    if (result.error) {
      alert("공지사항 생성 실패: " + result.error);
    } else {
      setShowForm(false);
      router.refresh();
      // Optional: Reset form?
    }
    setLoading(false);
  };

  return (
    <div className="mt-12 pt-12 border-t border-zinc-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📢 공지사항 관리</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "취소" : "공지사항 작성"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-zinc-800 p-6 rounded-xl border border-zinc-700 animate-in fade-in slide-in-from-top-2"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-zinc-300">
              제목
            </label>
            <input
              name="title"
              required
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="공지사항 제목"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-zinc-300">
              내용
            </label>
            <textarea
              name="content"
              required
              rows={4}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="공지사항 내용"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              등록
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {notices.length === 0 ? (
          <p className="text-zinc-500 text-center py-8 bg-zinc-900/50 rounded-lg">
            등록된 공지사항이 없습니다.
          </p>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg flex justify-between items-start"
            >
              <div>
                <h3 className="font-bold text-lg mb-1">{notice.title}</h3>
                <p className="text-zinc-400 text-sm whitespace-pre-wrap">
                  {notice.content}
                </p>
                <div className="text-xs text-zinc-500 mt-3">
                  {new Date(notice.created_at).toLocaleString("ko-KR")}
                </div>
              </div>
              
              {/* Delete Button - To be implemented if needed */}
              {/* <button className="text-zinc-500 hover:text-red-400 p-2">
                 <Trash2 className="w-4 h-4" />
              </button> */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
