"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminParticipantList } from "./admin-participant-list";
import { deleteMatch, cancelMatchByAdmin } from "@/app/actions/admin";
import {
  getMatchParticipantsForSuperuser,
  type SuperuserMatchParticipant,
  type SuperuserMatchSummary,
} from "@/app/actions/superuser";
import { AdminNewBadge, markMatchAsSeen } from "./admin-new-badge";
import { CopyButton } from "./copy-button";

export function SuperUserMatchCard({
  match,
  locale,
}: {
  match: SuperuserMatchSummary;
  locale: string;
}) {
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<SuperuserMatchParticipant[] | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);
  const router = useRouter();
  const t = useTranslations("admin");
  const tMatch = useTranslations("match");

  const totalParticipants = match.total_participants || 0;
  const hasParticipants = totalParticipants > 0;
  const isCanceled = match.status === "canceled";

  const handleDelete = async () => {
    if (!confirm(locale === "ko" ? "정말 이 경기를 영구 삭제하시겠습니까? (복구 불가)" : "Are you sure you want to permanently delete this match?")) {
      return;
    }

    setIsProcessing(true);
    const result = await deleteMatch(match.id);
    if (result.error) {
      alert(locale === "ko" ? "삭제 실패: " + result.error : "Delete failed: " + result.error);
      setIsProcessing(false);
    } else {
      router.refresh();
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    const confirmMessage = locale === "ko" 
      ? `현재 ${totalParticipants}명의 참가자가 있습니다.\n경기를 취소하고 전원 환불 처리하시겠습니까?\n(참가자에게 알림이 발송됩니다)`
      : `There are ${totalParticipants} participants.\nDo you want to cancel the match and refund everyone?\n(Notifications will be sent)`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsProcessing(true);
    const result = await cancelMatchByAdmin(match.id);
    if (result.error) {
      alert(locale === "ko" ? "취소 실패: " + result.error : "Cancel failed: " + result.error);
      setIsProcessing(false);
    } else {
      alert(locale === "ko" ? "경기가 취소되고 환불 처리가 완료되었습니다." : "Match canceled and refunds processed.");
      router.refresh();
      setIsProcessing(false);
    }
  };

  const handleToggleParticipants = async () => {
    if (!showParticipants) {
      markMatchAsSeen(match.id, totalParticipants);
      setBadgeKey((prev) => prev + 1);
      if (!participants) {
        setIsLoadingParticipants(true);
        setParticipantsError(null);
        try {
          const result = await getMatchParticipantsForSuperuser(match.id);
          setParticipants(result);
        } catch {
          setParticipantsError(
            locale === "ko" ? "참가자 정보를 불러오지 못했습니다." : "Failed to load participants."
          );
        } finally {
          setIsLoadingParticipants(false);
        }
      }
    }
    setShowParticipants(!showParticipants);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateFormatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: locale === "ko" ? "long" : "short",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Seoul",
    });
    const timeFormatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul",
    });
    return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
  };

  const startDate = new Date(match.start_time);
  const now = new Date();
  const isPastMatch = startDate < now;
  const displayStatus = isPastMatch ? "finished" : match.status;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-900/50 text-green-300 border border-green-800";
      case "closed": return "bg-zinc-700 text-zinc-300 border border-zinc-600";
      case "canceled": return "bg-red-900/50 text-red-300 border border-red-800";
      case "finished": return "bg-gray-700 text-gray-300 border border-gray-600";
      default: return "bg-zinc-700 text-zinc-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open": return locale === "ko" ? "모집중" : "Open";
      case "closed": return locale === "ko" ? "마감" : "Closed";
      case "canceled": return locale === "ko" ? "취소됨" : "Canceled";
      case "finished": return locale === "ko" ? "경기완료" : "Finished";
      default: return status;
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 shadow-sm relative">
      <AdminNewBadge key={badgeKey} matchId={match.id} currentCount={totalParticipants} />

      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-zinc-100 break-keep">
            {locale === "ko"
              ? match.rink?.name_ko
              : match.rink?.name_en || match.rink?.name_ko}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {formatDate(match.start_time)}
          </p>
        </div>
        <div className="flex flex-col flex-none items-end gap-2 ml-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${getStatusColor(displayStatus)}`}>
            {getStatusText(displayStatus)}
          </span>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
              match.match_type === "game"
                ? "bg-purple-900/50 text-purple-300 border border-purple-800"
                : match.match_type === "team_match"
                ? "bg-teal-900/50 text-teal-300 border border-teal-800"
                : "bg-zinc-700 text-zinc-300 border border-zinc-600"
            }`}
          >
            {tMatch(`types.${match.match_type || 'training'}`)}
          </span>
        </div>
      </div>

      {/* Creator Info */}
      {match.creator && (
        <div className="mb-4 text-xs text-zinc-500 bg-zinc-900/30 p-2 rounded border border-zinc-800">
          <span className="text-zinc-400 font-medium">Created by: </span>
          {match.creator.full_name || match.creator.email}
        </div>
      )}

      {match.club?.name ? (
        <div className="mb-4 text-xs text-zinc-300 bg-zinc-900/40 p-2 rounded border border-zinc-800">
          <span className="text-zinc-400 font-medium">{locale === "ko" ? "동호회: " : "Club: "}</span>
          {match.club.name}
        </div>
      ) : null}

      {match.match_type === "team_match" ? (
        <div className="flex justify-center items-center text-sm text-zinc-300 mb-6 bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <span className="font-medium">
            {(match.participants_count.fw + match.participants_count.df + match.participants_count.g) >= match.max_skaters
              ? (locale === "ko" ? "매칭 완료" : "Matched")
              : (locale === "ko" ? "매칭 대기" : "Waiting for Opponent")
            }
          </span>
        </div>
      ) : match.match_type === "training" ? (
        <div className="flex justify-center items-center text-sm text-zinc-300 mb-6 bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <span className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 mb-1">{locale === "ko" ? "게스트" : "Guest"}</span>
            <span className="font-medium">
              {match.participants_count.fw + match.participants_count.df + match.participants_count.g}{locale === "ko" ? "명" : ""}
            </span>
          </span>
        </div>
      ) : (
        <div className="flex justify-between items-center text-sm text-zinc-300 mb-6 bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <span className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 mb-1">Skater</span>
            <span className="font-medium">
              {match.participants_count.fw + match.participants_count.df}/{match.max_skaters}
            </span>
          </span>
          <div className="h-8 w-px bg-zinc-700"></div>
          <span className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 mb-1">Goalie</span>
            <span className="font-medium">
              {match.participants_count.g}/{match.max_goalies}
            </span>
          </span>
        </div>
      )}

      {/* Settlement Bank Account (SuperUser Only) */}
      <div className="mb-6 p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/50 space-y-2">
        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">
          {locale === "ko" ? "정산 계좌번호" : "Settlement Account"}
        </label>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-200 truncate">
            {match.bank_account || (locale === "ko" ? "계좌정보 미입력" : "No account info")}
          </span>
          {match.bank_account && (
            <CopyButton text={match.bank_account} className="flex-shrink-0" />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {isCanceled || isPastMatch ? (
            <button
              disabled
              className="block w-full py-2.5 text-center bg-zinc-800 text-zinc-600 border border-zinc-700 rounded-lg text-sm font-bold cursor-not-allowed"
            >
              {t("matches.edit")}
            </button>
          ) : (
            <Link
              href={`/${locale}/admin/matches/${match.id}/edit`}
              className="block w-full py-2.5 text-center bg-zinc-700 text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-600 transition-colors"
            >
              {t("matches.edit")}
            </Link>
          )}
          
          {isCanceled ? (
             <button
              disabled
              className="block w-full py-2.5 text-center bg-zinc-700/30 text-zinc-500 border border-zinc-700 rounded-lg text-sm font-bold cursor-not-allowed"
            >
              {locale === "ko" ? "취소됨" : "Canceled"}
            </button>
          ) : isPastMatch ? (
             <button
              disabled
              className="block w-full py-2.5 text-center bg-zinc-700/30 text-zinc-500 border border-zinc-700 rounded-lg text-sm font-bold cursor-not-allowed"
            >
              {locale === "ko" ? "경기 완료" : "Finished"}
            </button>
          ) : hasParticipants ? (
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="block w-full py-2.5 text-center bg-orange-500/10 border border-orange-500/50 text-orange-500 rounded-lg text-sm font-bold hover:bg-orange-500/20 transition-colors disabled:opacity-50"
            >
               {isProcessing ? "..." : (locale === "ko" ? "경기 취소" : "Cancel Match")}
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="block w-full py-2.5 text-center bg-red-100/10 border border-red-900/50 text-red-500 rounded-lg text-sm font-bold hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
               {isProcessing ? "..." : t("matches.delete")}
            </button>
          )}
        </div>
        
        <button
          onClick={handleToggleParticipants}
          className="block w-full py-2.5 text-center bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
        >
          {showParticipants ? t("matches.hideParticipants") : t("matches.viewParticipants")}
        </button>
      </div>

      {showParticipants && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
          {isLoadingParticipants ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-400">
              {locale === "ko" ? "참가자 정보를 불러오는 중..." : "Loading participants..."}
            </div>
          ) : participantsError ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-6 text-center text-sm text-red-300">
              {participantsError}
            </div>
          ) : (
            <AdminParticipantList participants={participants ?? []} matchType={match.match_type ?? undefined} />
          )}
        </div>
      )}
    </div>
  );
}
