"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  confirmPointCharge, 
  rejectPointCharge, 
  confirmParticipantPayment, 
  cancelPendingParticipant,
  type ChargeRequestWithUser,
  type PendingParticipant
} from "@/app/actions/superuser";
import { CircleDollarSign, Users, Loader2, Check, X } from "lucide-react";

interface UnifiedItem {
  id: string;
  type: "charge" | "participant";
  userName: string;
  userEmail?: string;
  amount: number;
  createdAt: string;
  extra?: string; // depositor name or match info
  position?: string;
  currentBalance?: number;
}

export function ChargeRequestsList({ 
  chargeRequests, 
  pendingParticipants,
  locale 
}: { 
  chargeRequests: ChargeRequestWithUser[];
  pendingParticipants: PendingParticipant[];
  locale: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Merge and sort by created_at
  const items: UnifiedItem[] = [
    ...chargeRequests.map((req) => ({
      id: req.id,
      type: "charge" as const,
      userName: req.user?.full_name || "Unknown",
      userEmail: req.user?.email,
      amount: req.amount,
      createdAt: req.created_at,
      extra: req.depositor_name ? `입금자: ${req.depositor_name}` : undefined,
    })),
    ...pendingParticipants.map((p) => ({
      id: p.id,
      type: "participant" as const,
      userName: p.user?.full_name || "Unknown",
      userEmail: p.user?.email,
      amount: p.match?.entry_points || 0,
      createdAt: p.created_at,
      extra: locale === "ko" ? p.match?.rink?.name_ko : (p.match?.rink?.name_en || p.match?.rink?.name_ko),
      position: p.position,
      currentBalance: p.user?.points,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleConfirm = async (item: UnifiedItem) => {
    // Confirmation Dialog
    const message = `${item.userName} | ${item.amount.toLocaleString()}원\n입금 확인하셨나요?`;
    if (!window.confirm(message)) {
        return;
    }

    setLoadingId(item.id);
    try {
      let result;
      if (item.type === "charge") {
        result = await confirmPointCharge(item.id);
      } else {
        result = await confirmParticipantPayment(item.id);
      }
      
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

  const handleReject = async (item: UnifiedItem) => {
    setLoadingId(`reject-${item.id}`);
    try {
      let result;
      if (item.type === "charge") {
        result = await rejectPointCharge(item.id);
      } else {
        result = await cancelPendingParticipant(item.id);
      }
      
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
      {items.map((item) => (
        <div 
          key={`${item.type}-${item.id}`} 
          className={`bg-zinc-800 rounded-lg border p-4 ${
            item.type === "participant" 
              ? "border-amber-700/50" 
              : "border-zinc-700"
          }`}
        >
          {/* Header with Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            {item.type === "charge" ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full">
                <CircleDollarSign className="w-3.5 h-3.5" />
                포인트 충전
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-900/30 text-amber-400 text-xs font-medium rounded-full">
                <Users className="w-3.5 h-3.5" />
                경기 참가
              </span>
            )}
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
              {item.type === "participant" && item.currentBalance !== undefined && (
                <p className="text-xs text-zinc-500">
                  현재 잔액: {item.currentBalance.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                </p>
              )}
            </div>
          </div>

          {/* Extra Info */}
          {item.extra && (
            <div className="text-sm mb-4 pb-3 border-b border-zinc-700">
              <span className="text-zinc-300">{item.extra}</span>
              {item.position && (
                <span className="text-xs text-amber-400 ml-2 px-1.5 py-0.5 bg-amber-900/30 rounded">
                  {item.position}
                </span>
              )}
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
