"use client";

import { badgeStyles, surfaceStyles } from "@/components/ui/styles";

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
        className={`${surfaceStyles({ interactive: false, density: "none" })} flex items-center justify-between px-4 py-3`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pp-surface-muted text-xs font-medium ">
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
            <span className={`${badgeStyles({ tone: "success" })} `}>
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
      <div className={surfaceStyles({ interactive: false, density: "roomy" })}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className={`${badgeStyles({ tone: "brand" })} `}>
            {t("position.FW")}
          </span>
          <span className="text-pp-muted ">
            ({fwParticipants.length})
          </span>
        </h3>
        <div className="space-y-2">
          {fwParticipants.length === 0 ? (
            <p className="text-sm text-pp-muted ">
              No participants yet
            </p>
          ) : (
            fwParticipants.map((p, i) => renderParticipant(p, i))
          )}
        </div>
      </div>

      {/* Defense */}
      <div className={surfaceStyles({ interactive: false, density: "roomy" })}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className={`${badgeStyles({ tone: "warning" })} `}>
            {t("position.DF")}
          </span>
          <span className="text-pp-muted ">
            ({dfParticipants.length})
          </span>
        </h3>
        <div className="space-y-2">
          {dfParticipants.length === 0 ? (
            <p className="text-sm text-pp-muted ">
              No participants yet
            </p>
          ) : (
            dfParticipants.map((p, i) => renderParticipant(p, i))
          )}
        </div>
      </div>

      {/* Goalies */}
      <div className={surfaceStyles({ interactive: false, density: "roomy" })}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className={`${badgeStyles({ tone: "neutral" })} `}>
            {t("position.G")}
          </span>
          <span className="text-pp-muted ">
            ({gParticipants.length})
          </span>
        </h3>
        <div className="space-y-2">
          {gParticipants.length === 0 ? (
            <p className="text-sm text-pp-muted ">
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
