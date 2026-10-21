"use client";
import { buttonStyles, overlayStyles } from "@/components/ui/styles";

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
      <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className={overlayStyles({ density: "roomy" }) + " w-full max-w-sm mx-4"}>
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 id="delete-account-title" className="pp-text-heading">
            {locale === "ko" ? "회원 탈퇴" : "Delete Account"}
          </h2>
        </div>

        <p className="text-sm text-pp-muted text-center mb-6">
          {locale === "ko"
            ? "탈퇴 시 모든 데이터를 조회할 수 없습니다. 정말 탈퇴하시겠습니까?"
            : "All your data will become inaccessible after deletion. Are you sure?"}
        </p>

        <div className="flex gap-3">
          <button type="button"
            onClick={onClose}
            disabled={loading}
            className={`${buttonStyles({ variant: "secondary", size: "compact" })} flex-1`}
          >
            {locale === "ko" ? "취소" : "Cancel"}
          </button>
          <button type="button"
            onClick={handleDelete}
            disabled={loading}
            className={`${buttonStyles({ variant: "danger", size: "compact" })} flex-1`}
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
