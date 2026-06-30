"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Club } from "@/app/actions/types";
import { deleteClub, getClubDeleteImpact, updateClubMemberRole } from "@/app/actions/clubs";
import { Users, MessageCircle, ChevronDown, ChevronUp, Trash2, ChevronRight, Shield, ArrowUpCircle, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface AdminClubCardProps {
  club: Club;
  canDelete?: boolean;
}

export function AdminClubCard({ club, canDelete = false }: AdminClubCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const t = useTranslations("admin.clubs");
  const locale = useLocale();
  const router = useRouter();

  const handleDelete = async () => {
    const impactResult = await getClubDeleteImpact(club.id);

    if (!impactResult.success || !impactResult.impact) {
      alert(
        locale === "ko"
          ? `삭제 정보를 불러오지 못했습니다: ${impactResult.error || "알 수 없는 오류"}`
          : `Failed to load delete details: ${impactResult.error || "Unknown error"}`
      );
      return;
    }

    const impact = impactResult.impact;
    const confirmMessage =
      locale === "ko"
        ? [
            `'${impact.clubName}' 동호회를 삭제하시겠습니까?`,
            "",
            `멤버십 ${impact.memberCount}건, 공지 ${impact.noticeCount}건, 연결 링크장 ${impact.rinkCount}건도 함께 삭제됩니다.`,
            `대표 동호회 설정 ${impact.primaryProfileCount}건은 해제됩니다.`,
            `연결 경기 ${impact.linkedMatchCount}건은 삭제되지 않으며 동호회만 해제됩니다.`,
            impact.futureLinkedMatchCount > 0
              ? `예정 경기 ${impact.futureLinkedMatchCount}건은 삭제 후에도 남아 있으며 '동호회 없음' 상태로 표시됩니다.`
              : null,
            "",
            "이 작업은 되돌릴 수 없습니다.",
          ]
            .filter(Boolean)
            .join("\n")
        : [
            `Delete the club '${impact.clubName}'?`,
            "",
            `${impact.memberCount} memberships, ${impact.noticeCount} notices, and ${impact.rinkCount} linked rinks will also be removed.`,
            `${impact.primaryProfileCount} profiles will lose this club as their primary club.`,
            `${impact.linkedMatchCount} linked matches will remain, but their club will be cleared.`,
            impact.futureLinkedMatchCount > 0
              ? `${impact.futureLinkedMatchCount} upcoming matches will stay published without a club.`
              : null,
            "",
            "This action cannot be undone.",
          ]
            .filter(Boolean)
            .join("\n");

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteClub(club.id);

    if (!result.success) {
      alert(
        locale === "ko"
          ? `삭제 실패: ${result.error || "알 수 없는 오류"}`
          : `Delete failed: ${result.error || "Unknown error"}`
      );
      setIsDeleting(false);
      return;
    }

    router.refresh();
    setIsDeleting(false);
  };

  const handlePromote = async (userId: string) => {
    const msg = locale === "ko" 
      ? "이 멤버를 운영진으로 승격하시겠습니까?\n승격된 멤버는 동호회 경기를 생성할 수 있게 됩니다."
      : "Promote this member to admin?\nThey will be able to create club matches.";
      
    if (!confirm(msg)) return;
    
    setActionLoadingId(userId);
    const result = await updateClubMemberRole(club.id, userId, "admin");
    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setActionLoadingId(null);
  };

  return (
    <div className="bg-zinc-800 hover:bg-zinc-700/80 transition-colors rounded-xl overflow-hidden relative group shadow-sm border border-zinc-700/50">
      <Link href={`/${locale}/admin/clubs/${club.id}/edit`} className="absolute inset-0 z-0" aria-label={t("edit")} />
      
      <div className="p-4 flex flex-row items-center justify-between gap-3 relative z-10 pointer-events-none">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-lg flex items-center gap-2 text-white group-hover:text-blue-400 transition-colors truncate">
            {club.name}
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1 pointer-events-auto overflow-hidden">
            <button 
              onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }}
              className="flex items-center gap-1 hover:text-white transition-colors shrink-0"
            >
              <Users className="w-4 h-4" />
              {t("members", { count: club.members?.length ?? club.member_count ?? 0 })}
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {club.kakao_open_chat_url && (
              <a
                href={club.kakao_open_chat_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-yellow-400 hover:underline relative z-10 shrink-0 truncate"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{t("openChat")}</span>
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto shrink-0">
          {canDelete ? (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting}
              className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors relative z-10"
              title={t("delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
          <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500 group-hover:text-white transition-colors pointer-events-none">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Member List Dropdown */}
      {isExpanded && (
        <div className="bg-zinc-900/50 border-t border-zinc-700 p-4 animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-semibold text-zinc-400 mb-3">
            {t("membersTitle", { count: club.members?.length ?? club.member_count ?? 0 })}
          </h4>
          
          {club.members && club.members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {club.members.map((member, idx) => (
                <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded p-2 text-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                      {member.full_name?.[0] || "?"}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium text-white flex items-center gap-1.5 truncate">
                        {member.full_name || "Unknown"}
                        {member.role === "admin" && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 text-[10px] font-bold border border-blue-900/50 shrink-0">운영진</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">{member.email}</div>
                    </div>
                  </div>
                  {member.role === "member" && member.user_id && (
                    <div className="shrink-0">
                      {actionLoadingId === member.user_id ? (
                        <div className="p-1.5">
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                        </div>
                      ) : (
                        <button 
                          onClick={() => handlePromote(member.user_id)}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition border border-blue-900/50"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          운영진 승격
                        </button>
                      )}
                    </div>
                  )}
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
