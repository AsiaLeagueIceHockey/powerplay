"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { X, Loader2, User as UserIcon } from "lucide-react";
import { getParticipantProfile } from "@/app/actions/admin";

interface Participant {
  id: string;
  position: "FW" | "DF" | "G";
  status: "applied" | "confirmed" | "pending_payment" | "waiting" | "canceled";
  payment_status: boolean;
  rental_opt_in?: boolean;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

export function AdminParticipantList({
  participants,
  matchType,
}: {
  participants: Participant[];
  matchType?: string;
}) {
  const t = useTranslations();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileCache, setProfileCache] = useState<Record<string, any>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      case "applied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      case "waiting":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const handleOpenDetails = async (userId: string) => {
    setSelectedUserId(userId);
    if (!profileCache[userId]) {
      setIsLoadingProfile(true);
      const profile = await getParticipantProfile(userId);
      setProfileCache((prev) => ({ ...prev, [userId]: profile }));
      setIsLoadingProfile(false);
    }
  };

  const formatExperience = (dateString?: string) => {
    if (!dateString) return "-";
    const start = new Date(dateString);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths < 1) return t("profile.experience.lessThanMonth", { fallback: "1개월 미만" });
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months}${t("profile.experience.monthDuration", { fallback: "개월" })}`;
    return t("profile.experience.calculated", { years, months, fallback: `${years}년 ${months}개월` });
  };

  const renderParticipantItem = (p: Participant) => (
    <div
      key={p.id}
      className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {p.user?.full_name || p.user?.email || "Unknown"}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(p.status)}`}>
            {t(`participant.status.${p.status}`)}
          </span>
          {p.rental_opt_in && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {t("match.rentalFee")}
            </span>
          )}
        </div>
        {p.user?.phone && (
          <a
            href={`tel:${p.user.phone}`}
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            📞 {p.user.phone}
          </a>
        )}
      </div>
      
      {p.user?.id && p.status === "confirmed" && (
        <button
          onClick={() => handleOpenDetails(p.user!.id)}
          className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
        >
          {t("common.profile", { fallback: "상세" })}
        </button>
      )}
    </div>
  );

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg dark:bg-zinc-800/50">
        <p className="text-gray-500 dark:text-zinc-400">
          {t("admin.participants.noParticipants")}
        </p>
      </div>
    );
  }

  const grouped = {
    FW: participants.filter((p) => p.position === "FW"),
    DF: participants.filter((p) => p.position === "DF"),
    G: participants.filter((p) => p.position === "G"),
  };

  const isTeamMatch = matchType === "team_match";
  const isTraining = matchType === "training";
  const selectedProfile = selectedUserId ? profileCache[selectedUserId] : null;

  return (
    <div className="space-y-6">
      {isTeamMatch ? (
        <div>
          <h4 className="font-medium text-sm mb-2 text-zinc-400">
            {t("match.teamOpponent")} ({participants.length})
          </h4>
          {participants.length === 0 ? (
            <p className="text-sm text-zinc-500">-</p>
          ) : (
            <div className="space-y-2">{participants.map(renderParticipantItem)}</div>
          )}
        </div>
      ) : isTraining ? (
        <div>
          <h4 className="font-medium text-sm mb-2 text-zinc-400">
            {t("match.guestParticipants")} ({participants.length})
          </h4>
          {participants.length === 0 ? (
            <p className="text-sm text-zinc-500">-</p>
          ) : (
            <div className="space-y-2">{participants.map(renderParticipantItem)}</div>
          )}
        </div>
      ) : (
        (["FW", "DF", "G"] as const).map((position) => (
          <div key={position}>
            <h4 className="font-medium text-sm mb-2 text-zinc-400">
              {t(`match.position.${position}`)} ({grouped[position].length})
            </h4>
            {grouped[position].length === 0 ? (
              <p className="text-sm text-zinc-500">-</p>
            ) : (
              <div className="space-y-2">{grouped[position].map(renderParticipantItem)}</div>
            )}
          </div>
        ))
      )}

      {/* Participant Profile Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center z-10">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-zinc-500" />
                {t("common.profile")}
              </h3>
              <button
                onClick={() => setSelectedUserId(null)}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {isLoadingProfile ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                  <p className="text-sm font-medium">프로필 정보를 불러오는 중...</p>
                </div>
              ) : selectedProfile ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col gap-1">
                      <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedProfile.full_name || "이름 미입력"}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {selectedProfile.email}
                      </span>
                      {selectedProfile.phone && (
                        <a href={`tel:${selectedProfile.phone}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                          📞 {selectedProfile.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedProfile.bio && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        {t("profile.bio.title", { fallback: "자기소개" })}
                      </h4>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        {selectedProfile.bio}
                      </p>
                    </div>
                  )}

                  {/* Hockey Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Experience */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                        {t("profile.experience.title", { fallback: "구력" })}
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatExperience(selectedProfile.hockey_start_date)}
                      </p>
                    </div>

                    {/* Stick Direction */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                        {t("profile.stick.title", { fallback: "스틱 방향" })}
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {selectedProfile.stick_direction?.toUpperCase() === "LEFT" ? t("profile.stick.left", { fallback: "레프트" }) : 
                         selectedProfile.stick_direction?.toUpperCase() === "RIGHT" ? t("profile.stick.right", { fallback: "라이트" }) : 
                         "-"}
                      </p>
                    </div>

                    {/* Primary Club */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 col-span-2">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                        {t("profile.team.title", { fallback: "소속팀" })}
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {selectedProfile.club_name || t("profile.team.none", { fallback: "소속팀 없음" })}
                      </p>
                    </div>

                    {/* Detailed Positions */}
                    {selectedProfile.detailed_positions && selectedProfile.detailed_positions.length > 0 && (
                      <div className="col-span-2 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                          {t("profile.positions.title", { fallback: "상세 포지션" })}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProfile.detailed_positions.map((pos: string) => (
                            <span
                              key={pos}
                              className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-md"
                            >
                              {t(`profile.positions.options.${pos}`, { fallback: pos })}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-500">
                  <p>프로필을 불러올 수 없습니다.</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-b-2xl">
              <button
                onClick={() => setSelectedUserId(null)}
                className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
