"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Club } from "@/app/actions/types";
import { deleteClub, getClubDeleteImpact } from "@/app/actions/clubs";
import { Users, MessageCircle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface AdminClubCardProps {
  club: Club;
  canDelete?: boolean;
}

export function AdminClubCard({ club, canDelete = false }: AdminClubCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="font-medium text-lg flex items-center gap-2">
            {club.name}
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
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/clubs/${club.id}/edit`}
            className="text-sm text-blue-400 hover:underline whitespace-nowrap"
          >
            {t("edit")}
          </Link>
          {canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? t("deleting") : t("delete")}
            </button>
          ) : null}
        </div>
      </div>

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
