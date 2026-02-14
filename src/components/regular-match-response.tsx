"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { respondToRegularMatch, getMyRegularMatchResponse } from "@/app/actions/match";
import { getClubMembershipStatus } from "@/app/actions/clubs";

interface RegularMatchResponseSectionProps {
  matchId: string;
  matchClubId?: string;
}

export function RegularMatchResponseSection({ matchId, matchClubId }: RegularMatchResponseSectionProps) {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<"attending" | "not_attending" | null>(null);
  const [currentPosition, setCurrentPosition] = useState<"FW" | "DF" | "G" | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<"FW" | "DF" | "G">("FW");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!matchClubId) {
        setLoading(false);
        return;
      }
      
      const [status, myResponse] = await Promise.all([
        getClubMembershipStatus(matchClubId),
        getMyRegularMatchResponse(matchId),
      ]);
      
      setIsMember(status === "approved");
      if (myResponse) {
        setCurrentResponse(myResponse.response as "attending" | "not_attending");
        if (myResponse.position) {
          setCurrentPosition(myResponse.position as "FW" | "DF" | "G");
          setSelectedPosition(myResponse.position as "FW" | "DF" | "G");
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [matchId, matchClubId]);

  const handleRespond = async (response: "attending" | "not_attending") => {
    setSubmitting(true);
    const res = await respondToRegularMatch(
      matchId,
      response,
      response === "attending" ? selectedPosition : undefined
    );
    
    if (res.error) {
      alert(locale === "ko" ? "응답 실패: " + res.error : "Failed: " + res.error);
    } else {
      setCurrentResponse(response);
      if (response === "attending") {
        setCurrentPosition(selectedPosition);
      }
      router.refresh();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
      </div>
    );
  }

  if (!isMember) return null;

  // Already responded
  if (currentResponse) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-3">
          📋 {locale === "ko" ? "정규 대관 출석" : "Regular Match Attendance"}
        </h3>
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          currentResponse === "attending"
            ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-700/30"
            : "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700/30"
        }`}>
          <span className="text-2xl">{currentResponse === "attending" ? "✅" : "❌"}</span>
          <div>
            <div className={`font-medium ${
              currentResponse === "attending"
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"
            }`}>
              {currentResponse === "attending"
                ? (locale === "ko" ? "참석 예정" : "Attending")
                : (locale === "ko" ? "불참" : "Not Attending")}
            </div>
            {currentResponse === "attending" && currentPosition && (
              <div className="text-xs text-zinc-500 mt-0.5">
                {locale === "ko" ? "포지션:" : "Position:"} {currentPosition}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setCurrentResponse(null);
              setCurrentPosition(null);
            }}
            className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 underline"
          >
            {locale === "ko" ? "변경" : "Change"}
          </button>
        </div>
      </div>
    );
  }

  // Response form
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold mb-3">
        📋 {locale === "ko" ? "정규 대관 출석" : "Regular Match Attendance"}
      </h3>
      <p className="text-sm text-zinc-500 mb-4">
        {locale === "ko"
          ? "정규 멤버로서 이번 경기에 참석 여부를 알려주세요."
          : "As a regular member, please indicate your attendance for this match."}
      </p>

      {/* Position Selection for attending */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          {locale === "ko" ? "포지션 선택" : "Select Position"}
        </label>
        <div className="flex gap-2">
          {(["FW", "DF", "G"] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setSelectedPosition(pos)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPosition === pos
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Response Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleRespond("attending")}
          disabled={submitting}
          className="py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          ✅ {locale === "ko" ? "참석" : "Attend"}
        </button>
        <button
          onClick={() => handleRespond("not_attending")}
          disabled={submitting}
          className="py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          ❌ {locale === "ko" ? "불참" : "Skip"}
        </button>
      </div>
    </div>
  );
}
