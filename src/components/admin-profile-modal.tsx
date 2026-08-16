"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, UserRound, X } from "lucide-react";
import {
  getParticipantProfile,
  type ParticipantProfile,
} from "@/app/actions/admin";

type LoadedProfile = {
  userId: string;
  profile: ParticipantProfile | null;
};

export function AdminProfileModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const t = useTranslations();
  const [loadedProfile, setLoadedProfile] = useState<LoadedProfile | null>(null);
  const profile = loadedProfile?.userId === userId ? loadedProfile.profile : null;
  const loading = loadedProfile?.userId !== userId;

  useEffect(() => {
    let active = true;

    getParticipantProfile(userId).then((result) => {
      if (!active) return;
      setLoadedProfile({ userId, profile: result });
    });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const formatExperience = (dateString?: string | null) => {
    if (!dateString) return "-";
    const start = new Date(dateString);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    if (diffMonths < 1) {
      return t("profile.experience.lessThanMonth", { fallback: "1개월 미만" });
    }
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) {
      return `${months}${t("profile.experience.monthDuration", { fallback: "개월" })}`;
    }
    return t("profile.experience.calculated", {
      years,
      months,
      fallback: `${years}년 ${months}개월`,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("common.profile")}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/90 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t("common.profile")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-full bg-zinc-100 p-2 text-zinc-500 transition-colors hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">프로필 정보를 불러오는 중...</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || "프로필 사진"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <UserRound className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {profile.full_name || "이름 미입력"}
                  </p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {profile.email}
                  </p>
                  {profile.phone ? (
                    <a
                      href={`tel:${profile.phone}`}
                      className="mt-1 block text-sm font-medium text-blue-600 dark:text-blue-400"
                    >
                      {profile.phone}
                    </a>
                  ) : null}
                </div>
              </div>

              {profile.bio ? (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t("profile.bio.title", { fallback: "자기소개" })}
                  </h4>
                  <p className="whitespace-pre-wrap rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-200">
                    {profile.bio}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <ProfileItem
                  label={t("profile.birthDate")}
                  value={profile.birth_date || "-"}
                />
                <ProfileItem
                  label={t("profile.experience.title", { fallback: "구력" })}
                  value={formatExperience(profile.hockey_start_date)}
                />
                <ProfileItem
                  label={t("profile.stick.title", { fallback: "스틱 방향" })}
                  value={
                    profile.stick_direction?.toUpperCase() === "LEFT"
                      ? t("profile.stick.left", { fallback: "레프트" })
                      : profile.stick_direction?.toUpperCase() === "RIGHT"
                        ? t("profile.stick.right", { fallback: "라이트" })
                        : "-"
                  }
                />
                <ProfileItem
                  label={t("profile.team.title", { fallback: "소속팀" })}
                  value={profile.club_name || t("profile.team.none", { fallback: "소속팀 없음" })}
                />
                {profile.detailed_positions?.length ? (
                  <div className="col-span-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {t("profile.positions.title", { fallback: "상세 포지션" })}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.detailed_positions.map((position: string) => (
                        <span
                          key={position}
                          className="rounded-md bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                        >
                          {t(`profile.positions.options.${position}`, { fallback: position })}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-zinc-500">프로필을 불러올 수 없습니다.</p>
          )}
        </div>

        <div className="rounded-b-2xl border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-zinc-900 py-3 font-bold text-white dark:bg-white dark:text-zinc-900"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/50 ${className}`}>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
