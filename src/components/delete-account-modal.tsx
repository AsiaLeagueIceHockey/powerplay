"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { deleteAccount } from "@/app/actions/auth";

export function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await deleteAccount();
    // redirect happens in server action
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {locale === "ko" ? "회원 탈퇴" : "Delete Account"}
          </h2>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mb-6">
          {locale === "ko"
            ? "탈퇴 시 모든 데이터를 조회할 수 없습니다. 정말 탈퇴하시겠습니까?"
            : "All your data will become inaccessible after deletion. Are you sure?"}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {locale === "ko" ? "취소" : "Cancel"}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading
              ? locale === "ko"
                ? "처리 중..."
                : "Deleting..."
              : locale === "ko"
              ? "탈퇴하기"
              : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
