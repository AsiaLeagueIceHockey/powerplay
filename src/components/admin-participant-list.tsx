"use client";

import { useState } from "react";
import { updatePaymentStatus } from "@/app/actions/admin";
import { useTranslations } from "next-intl";

interface Participant {
  id: string;
  position: "FW" | "DF" | "G";
  status: "applied" | "confirmed" | "pending_payment" | "waiting" | "canceled";
  payment_status: boolean;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export function AdminParticipantList({
  participants,
}: {
  participants: Participant[];
}) {
  const t = useTranslations();
  const [loading, setLoading] = useState<string | null>(null);
  const [optimisticParticipants, setOptimisticParticipants] =
    useState(participants);

  const handleTogglePayment = async (
    participantId: string,
    currentStatus: boolean
  ) => {
    setLoading(participantId);

    // Optimistic update
    setOptimisticParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, payment_status: !currentStatus } : p
      )
    );

    const result = await updatePaymentStatus(participantId, !currentStatus);

    if (result.error) {
      // Revert on error
      setOptimisticParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, payment_status: currentStatus } : p
        )
      );
    }

    setLoading(null);
  };

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

  if (optimisticParticipants.length === 0) {
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
    FW: optimisticParticipants.filter((p) => p.position === "FW"),
    DF: optimisticParticipants.filter((p) => p.position === "DF"),
    G: optimisticParticipants.filter((p) => p.position === "G"),
  };

  return (
    <div className="space-y-6">
      {(["FW", "DF", "G"] as const).map((position) => (
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
                  
                  {/* Payment Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePayment(p.id, p.payment_status)}
                      disabled={loading === p.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        p.payment_status ? 'bg-green-500' : 'bg-zinc-200'
                      }`}
                    >
                      <span
                        className={`${
                          p.payment_status ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </button>
                    <span className={`text-xs font-medium ${p.payment_status ? 'text-green-600' : 'text-zinc-500'}`}>
                       {p.payment_status ? t("participant.payment.paid") : t("participant.payment.unpaid")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
