"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  confirmPointCharge, 
  rejectPointCharge, 
  type ChargeRequestWithUser,
} from "@/app/actions/superuser";
import { CircleDollarSign, Loader2, Check, X } from "lucide-react";

interface Item {
  id: string;
  userName: string;
  userEmail?: string;
  amount: number;
  createdAt: string;
  depositorName?: string;
}

export function ChargeRequestsList({ 
  chargeRequests, 
  locale 
}: { 
  chargeRequests: ChargeRequestWithUser[];
  locale: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const items: Item[] = chargeRequests.map((req) => ({
    id: req.id,
    userName: req.user?.full_name || "Unknown",
    userEmail: req.user?.email,
    amount: req.amount,
    createdAt: req.created_at,
    depositorName: req.depositor_name || undefined,
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleConfirm = async (item: Item) => {
    // Confirmation Dialog
    const message = `${item.userName} | ${item.amount.toLocaleString()}원\n입금 확인하셨나요?`;
    if (!window.confirm(message)) {
        return;
    }

    setLoadingId(item.id);
    try {
      const result = await confirmPointCharge(item.id);
      
      if (!result.success) {
        alert(`처리 실패: ${result.error || "알 수 없는 오류"}`);
        setLoadingId(null);
        return;
      }
      
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Confirm error:", error);
      alert("처리 중 오류가 발생했습니다.");
    }
    setLoadingId(null);
  };

  const handleReject = async (item: Item) => {
    setLoadingId(`reject-${item.id}`);
    try {
      const result = await rejectPointCharge(item.id);
      
      if (!result.success) {
        alert(`처리 실패: ${result.error || "알 수 없는 오류"}`);
        setLoadingId(null);
        return;
      }
      
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Reject error:", error);
      alert("처리 중 오류가 발생했습니다.");
    }
    setLoadingId(null);
  };

  if (items.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-lg p-8 text-center text-zinc-400">
        {locale === "ko" ? "대기 중인 요청이 없습니다." : "No pending requests."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 text-sm">
        <h3 className="font-bold text-blue-400 mb-1 flex items-center gap-2">
            ℹ️ 자동 경기 확정 안내
        </h3>
        <p className="text-zinc-300">
          충전 요청을 승인하면, 해당 사용자의 미입금 경기들이 자동으로 확정됩니다. 별도로 미입금 참가자를 처리할 필요가 없습니다.
        </p>
      </div>

      {items.map((item) => (
        <div 
          key={item.id} 
          className="bg-zinc-800 rounded-lg border border-zinc-700 p-4"
        >
          {/* Header with Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full">
              <CircleDollarSign className="w-3.5 h-3.5" />
              포인트 충전
            </span>
            <span className="text-xs text-zinc-500 ml-auto">
              {new Date(item.createdAt).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Seoul",
              })}
            </span>
          </div>

          {/* User & Amount */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-white font-medium">{item.userName}</p>
              <p className="text-xs text-zinc-500">{item.userEmail}</p>
            </div>
            <div className="text-right">
              <p className="text-xl text-amber-400 font-bold">
                {item.amount.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
              </p>
            </div>
          </div>

          {/* Extra Info */}
          {item.depositorName && (
            <div className="text-sm mb-4 pb-3 border-b border-zinc-700">
              <span className="text-zinc-300">입금자: {item.depositorName}</span>
            </div>
          )}

          {/* Action Buttons with Loading */}
          <div className="flex gap-3">
            <button
              onClick={() => handleConfirm(item)}
              disabled={loadingId !== null}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingId === item.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {loadingId === item.id ? "처리 중..." : "입금 확인"}
            </button>
            <button
              onClick={() => handleReject(item)}
              disabled={loadingId !== null}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingId === `reject-${item.id}` ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              {loadingId === `reject-${item.id}` ? "처리 중..." : "거부"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
