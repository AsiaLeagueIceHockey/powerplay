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
                  
                  {/* Payment status is implied by status, no toggle needed */}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
