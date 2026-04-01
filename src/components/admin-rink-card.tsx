"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";

import { ApproveRinkButton } from "@/components/approve-rink-button";
import { deleteRink, getRinkDeleteImpact } from "@/app/actions/admin";

interface AdminRinkCardProps {
  locale: string;
  isSuperUser: boolean;
  rink: {
    id: string;
    name_ko: string;
    name_en: string;
    is_approved: boolean;
    map_url?: string | null;
  };
}

export function AdminRinkCard({ locale, isSuperUser, rink }: AdminRinkCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const impactResult = await getRinkDeleteImpact(rink.id);

    if (!impactResult.success || !impactResult.impact) {
      alert(`삭제 정보를 불러오지 못했습니다: ${impactResult.error || "알 수 없는 오류"}`);
      return;
    }

    const impact = impactResult.impact;
    const confirmMessage = [
      `'${impact.rinkNameKo}' 링크장을 삭제하시겠습니까?`,
      "",
      `연결된 동호회 링크 ${impact.clubLinkCount}건은 함께 해제됩니다.`,
      `연결된 경기 ${impact.linkedMatchCount}건은 삭제되지 않으며 링크장만 해제됩니다.`,
      impact.futureLinkedMatchCount > 0
        ? `예정 경기 ${impact.futureLinkedMatchCount}건은 삭제 후에도 남아 있으며 링크장 미정 상태로 표시됩니다.`
        : null,
      impact.approved
        ? "공개 링크장 목록과 지도에서도 즉시 사라집니다."
        : "승인 대기 중 링크장이므로 공개 목록에는 노출되지 않았습니다.",
      "",
      "이 작업은 되돌릴 수 없습니다.",
    ]
      .filter(Boolean)
      .join("\n");

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteRink(rink.id);

    if (result.error) {
      alert(`삭제 실패: ${result.error}`);
      setIsDeleting(false);
      return;
    }

    router.refresh();
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-zinc-800 rounded-lg relative">
      <div className="pr-20 sm:pr-0 w-full sm:w-auto flex-1">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-medium">{rink.name_ko}</span>
          {!rink.is_approved && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
              승인 대기 중
            </span>
          )}
        </div>
        <div className="text-sm text-zinc-400">{rink.name_en}</div>
      </div>

      <div className="flex items-center gap-3">
        {rink.map_url && (
          <a
            href={rink.map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 flex-shrink-0 rounded-md bg-zinc-700/50 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            title="지도 보기"
          >
            <MapPin className="w-3 h-3" />
            지도
          </a>
        )}
        {!rink.is_approved && isSuperUser && <ApproveRinkButton rinkId={rink.id} />}
        {isSuperUser && (
          <>
            <Link
              href={`/${locale}/admin/rinks/${rink.id}/edit`}
              className="text-sm text-blue-400 hover:underline"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
