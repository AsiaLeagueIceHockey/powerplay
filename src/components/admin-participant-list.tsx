"use client";

import { useTranslations } from "next-intl";

interface Participant {
  id: string;
  position: "FW" | "DF" | "G";
  status: "applied" | "confirmed" | "pending_payment" | "waiting" | "canceled";
  payment_status: boolean;
  rental_opt_in?: boolean; // Added
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg dark:bg-zinc-800">
        <p className="text-gray-500 dark:text-zinc-400">
          {t("admin.participants.noParticipants")}
        </p>
      </div>
    );
  }

  // Group by position
  const grouped = {
    FW: participants.filter((p) => p.position === "FW"),
    DF: participants.filter((p) => p.position === "DF"),
    G: participants.filter((p) => p.position === "G"),
  };

  const isTeamMatch = matchType === "team_match";

  return (
    <div className="space-y-6">
      {isTeamMatch ? (
        // Team Match Layout: Single list for "Opponent Team Representative"
        <div>
          <h4 className="font-medium text-sm mb-2 text-zinc-400">
            {t("match.teamOpponent")} ({participants.length})
          </h4>
          {participants.length === 0 ? (
            <p className="text-sm text-zinc-500">-</p>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-zinc-900">
                        {p.user?.full_name || p.user?.email || "Unknown"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                          p.status
                        )}`}
                      >
                        {t(`participant.status.${p.status}`)}
                      </span>
                    </div>
                    {p.user?.phone && (
                      <a
                        href={`tel:${p.user.phone}`}
                        className="text-xs text-zinc-500 hover:text-blue-600 transition-colors"
                      >
                        📞 {p.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Regular Match Layout: Group by Position
        (["FW", "DF", "G"] as const).map((position) => (
          <div key={position}>
            <h4 className="font-medium text-sm mb-2 text-zinc-400">
              {t(`match.position.${position}`)} ({grouped[position].length})
            </h4>
            {grouped[position].length === 0 ? (
              <p className="text-sm text-zinc-500">-</p>
            ) : (
              <div className="space-y-2">
                {grouped[position].map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-zinc-900">
                          {p.user?.full_name || p.user?.email || "Unknown"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                            p.status
                          )}`}
                        >
                          {t(`participant.status.${p.status}`)}
                        </span>
                        {p.rental_opt_in && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                            {t("match.rentalFee")}
                          </span>
                        )}
                      </div>
                      {p.user?.phone && (
                        <a
                          href={`tel:${p.user.phone}`}
                          className="text-xs text-zinc-500 hover:text-blue-600 transition-colors"
                        >
                          📞 {p.user.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
