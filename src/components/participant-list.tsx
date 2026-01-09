"use client";

import { useTranslations } from "next-intl";

interface Participant {
  id: string;
  position: string;
  status: string;
  payment_status: boolean;
  team_color: string | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export function ParticipantList({
  fwParticipants,
  dfParticipants,
  gParticipants,
}: {
  fwParticipants: Participant[];
  dfParticipants: Participant[];
  gParticipants: Participant[];
}) {
  const t = useTranslations("match");
  const tParticipant = useTranslations("participant");

  const renderParticipant = (participant: Participant, index: number) => {
    const statusColors = {
      applied: "text-yellow-600 dark:text-yellow-400",
      confirmed: "text-green-600 dark:text-green-400",
      waiting: "text-zinc-500 dark:text-zinc-400",
      canceled: "text-red-600 dark:text-red-400",
    };

    return (
      <div
        key={participant.id}
        className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium dark:bg-zinc-700">
            {index + 1}
          </span>
          <span className="font-medium">
            {participant.user?.full_name ||
              participant.user?.email?.split("@")[0] ||
              "Unknown"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {participant.payment_status && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {tParticipant("payment.paid")}
            </span>
          )}
          <span
            className={`text-sm ${statusColors[participant.status as keyof typeof statusColors]}`}
          >
            {tParticipant(`status.${participant.status}`)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Forwards */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {t("position.FW")}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            ({fwParticipants.length})
          </span>
        </h3>
        <div className="space-y-2">
          {fwParticipants.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No participants yet
            </p>
          ) : (
            fwParticipants.map((p, i) => renderParticipant(p, i))
          )}
        </div>
      </div>

      {/* Defense */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className="rounded bg-orange-100 px-2 py-1 text-sm text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            {t("position.DF")}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            ({dfParticipants.length})
          </span>
        </h3>
        <div className="space-y-2">
          {dfParticipants.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No participants yet
            </p>
          ) : (
            dfParticipants.map((p, i) => renderParticipant(p, i))
          )}
        </div>
      </div>

      {/* Goalies */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className="rounded bg-purple-100 px-2 py-1 text-sm text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            {t("position.G")}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            ({gParticipants.length})
          </span>
        </h3>
        <div className="space-y-2">
          {gParticipants.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No participants yet
            </p>
          ) : (
            gParticipants.map((p, i) => renderParticipant(p, i))
          )}
        </div>
      </div>
    </div>
  );
}
