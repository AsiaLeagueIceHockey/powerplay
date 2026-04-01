"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveRink } from "@/app/actions/admin";

export function ApproveRinkButton({ rinkId }: { rinkId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    if (!confirm("이 링크장을 승인하시겠습니까?")) return;

    setLoading(true);
    const result = await approveRink(rinkId);
    
    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="text-sm px-3 py-1 bg-amber-600/20 text-amber-500 rounded hover:bg-amber-600/30 transition-colors disabled:opacity-50"
    >
      {loading ? "승인 중..." : "승인하기"}
    </button>
  );
}
