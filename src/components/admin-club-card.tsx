"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Club } from "@/app/actions/types";
import { approveClubMember, rejectClubMember } from "@/app/actions/clubs";
import { Users, MessageCircle, ChevronDown, ChevronUp, UserPlus, Check, X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface PendingMember {
  id: string;
  user_id: string;
  intro_message?: string;
  created_at?: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    position?: string;
  };
}

interface AdminClubCardProps {
  club: Club;
  pendingMembers?: PendingMember[];
}

export function AdminClubCard({ club, pendingMembers = [] }: AdminClubCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPending, setShowPending] = useState(pendingMembers.length > 0);
  const [pending, setPending] = useState(pendingMembers);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const t = useTranslations("admin.clubs");
  const locale = useLocale();
  const router = useRouter();

  const handleApprove = async (membershipId: string) => {
    setProcessingId(membershipId);
    const res = await approveClubMember(membershipId);
    if (res.error) {
      alert(locale === "ko" ? "승인 실패: " + res.error : "Failed: " + res.error);
    } else {
      setPending(prev => prev.filter(m => m.id !== membershipId));
      router.refresh();
    }
    setProcessingId(null);
  };

  const handleReject = async (membershipId: string) => {
    if (!confirm(locale === "ko" ? "이 가입 신청을 거부하시겠습니까?" : "Reject this application?")) return;
    setProcessingId(membershipId);
    const res = await rejectClubMember(membershipId);
    if (res.error) {
      alert(locale === "ko" ? "거부 실패: " + res.error : "Failed: " + res.error);
    } else {
      setPending(prev => prev.filter(m => m.id !== membershipId));
      router.refresh();
    }
    setProcessingId(null);
  };

  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="font-medium text-lg flex items-center gap-2">
            {club.name}
            {pending.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full font-medium">
                {pending.length} {locale === "ko" ? "대기" : "pending"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Users className="w-4 h-4" />
              {t("members", { count: club.member_count || 0 })}
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {club.kakao_open_chat_url && (
              <a
                href={club.kakao_open_chat_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-yellow-400 hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                {t("openChat")}
              </a>
            )}
          </div>
        </div>
        <Link
          href={`/${locale}/admin/clubs/${club.id}/edit`}
          className="text-sm text-blue-400 hover:underline whitespace-nowrap"
        >
          {t("edit")}
        </Link>
      </div>

      {/* Pending Members Section */}
      {pending.length > 0 && (
        <div className="bg-yellow-900/10 border-t border-yellow-700/30 p-4">
          <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            {locale === "ko" ? "가입 대기" : "Pending Applications"} ({pending.length})
          </h4>
          <div className="space-y-2">
            {pending.map((member) => (
              <div key={member.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                      {member.user?.full_name?.[0] || "?"}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium text-white text-sm truncate">
                        {member.user?.full_name || "Unknown"}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">{member.user?.email}</div>
                    </div>
                  </div>
                  {member.intro_message && (
                    <p className="text-xs text-zinc-400 mt-2 ml-10 italic bg-zinc-900/50 rounded px-2 py-1">
                      &ldquo;{member.intro_message}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 ml-10 sm:ml-0">
                  <button
                    onClick={() => handleApprove(member.id)}
                    disabled={processingId === member.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    {locale === "ko" ? "승인" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(member.id)}
                    disabled={processingId === member.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600/80 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    {locale === "ko" ? "거부" : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member List Dropdown */}
      {isExpanded && (
        <div className="bg-zinc-900/50 border-t border-zinc-700 p-4 animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-semibold text-zinc-400 mb-3">
            {t("membersTitle", { count: club.member_count || 0 })}
          </h4>
          
          {club.members && club.members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {club.members.map((member, idx) => (
                <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded p-2 text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                    {member.full_name?.[0] || "?"}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-medium text-white truncate">{member.full_name || "Unknown"}</div>
                    <div className="text-xs text-zinc-500 truncate">{member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">
               {locale === "ko" ? "멤버가 없습니다." : "No members found."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
