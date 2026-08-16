"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdminProfileModal } from "@/components/admin-profile-modal";

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
          onClick={() => setSelectedUserId(p.user!.id)}
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

      {selectedUserId && (
        <AdminProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
