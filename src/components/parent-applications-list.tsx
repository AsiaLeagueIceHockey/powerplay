"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewParentApplication, ParentApplication } from "@/app/actions/parent";
import { Loader2, Check, X, User, Phone, ShieldAlert, Award, Calendar } from "lucide-react";
import { CopyButton } from "./copy-button";

export function ParentApplicationsList({
  applications,
  locale,
}: {
  applications: ParentApplication[];
  locale: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectReasonId, setRejectReasonId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [, startTransition] = useTransition();

  const handleApprove = async (app: ParentApplication) => {
    const confirmMessage = `${app.user?.full_name || "Unknown"}님의 학부모 신청(${app.child_name})을 승인하시겠습니까?`;
    if (!window.confirm(confirmMessage)) return;

    setLoadingId(app.id);
    try {
      const result = await reviewParentApplication(app.id, "approved");
      if (!result.success) {
        alert(`승인 실패: ${result.error || "알 수 없는 오류"}`);
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectSubmit = async (app: ParentApplication) => {
    if (!rejectionReason.trim()) {
      alert("반려 사유를 입력해 주세요.");
      return;
    }

    setLoadingId(`reject-${app.id}`);
    try {
      const result = await reviewParentApplication(app.id, "rejected", rejectionReason);
      if (!result.success) {
        alert(`반려 실패: ${result.error || "알 수 없는 오류"}`);
      } else {
        setRejectReasonId(null);
        setRejectionReason("");
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingId(null);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-xl p-8 text-center text-zinc-400 border border-zinc-700">
        {locale === "ko" ? "대기 중인 학부모 인증 신청이 없습니다." : "No pending parent applications."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="bg-zinc-800 rounded-xl border border-zinc-700 p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-zinc-700/60">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-violet-900/40 border border-violet-500/30 text-violet-400 text-xs font-bold rounded-md uppercase tracking-wider">
                Parent Auth Request
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              {new Date(app.created_at).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Seoul",
              })}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Applicant details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">신청인 (학부모)</h4>
              <div className="bg-zinc-900/50 p-3 rounded-lg space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-zinc-500" />
                  <span className="font-semibold text-white">
                    {app.user?.full_name || "Unknown"}
                  </span>
                  <span className="text-zinc-500 text-xs">({app.user?.email})</span>
                </div>
                {app.user?.phone && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone size={14} className="text-zinc-500" />
                    <a href={`tel:${app.user.phone}`} className="hover:underline text-blue-400">
                      {app.user.phone}
                    </a>
                    <CopyButton text={app.user.phone} showText={false} className="scale-75 origin-left" />
                  </div>
                )}
              </div>
            </div>

            {/* Child details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">자녀 정보</h4>
              <div className="bg-zinc-900/50 p-3 rounded-lg space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Award size={14} /> 자녀 이름
                  </span>
                  <span className="font-bold text-white">{app.child_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Calendar size={14} /> 출생 연도
                  </span>
                  <span className="font-bold text-white">{app.child_birth_year}년생</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Award size={14} /> 소속 클럽
                  </span>
                  <span className="font-bold text-violet-400">{app.child_club}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User description / Intro memo */}
          {app.description && (
            <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-700/50 text-xs text-zinc-300">
              <p className="font-semibold text-zinc-400 mb-1">가입 신청 한마디:</p>
              <p className="italic">"{app.description}"</p>
            </div>
          )}

          {/* Action buttons */}
          {rejectReasonId !== app.id ? (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleApprove(app)}
                disabled={loadingId !== null}
                className="flex-1 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingId === app.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                승인 완료
              </button>
              <button
                onClick={() => setRejectReasonId(app.id)}
                disabled={loadingId !== null}
                className="flex-1 py-3 bg-zinc-700 text-zinc-200 rounded-xl hover:bg-zinc-600 transition font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                반려 처리
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-red-500/20 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <ShieldAlert size={14} /> 반려 사유 입력
                </span>
                <button
                  onClick={() => {
                    setRejectReasonId(null);
                    setRejectionReason("");
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  취소
                </button>
              </div>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                required
                placeholder="예: 자녀 정보가 불명확합니다. 클럽명을 정확히 기재해 주세요."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:outline-none transition text-xs"
              />

              <button
                onClick={() => handleRejectSubmit(app)}
                disabled={loadingId !== null}
                className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold text-xs flex items-center justify-center gap-2"
              >
                {loadingId === `reject-${app.id}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                반려 사유 전송 및 처리 완료
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
