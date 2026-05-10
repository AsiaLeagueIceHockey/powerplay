"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveClub } from "@/app/actions/clubs";

interface MyClubLeaveButtonProps {
  clubId: string;
  confirmLabel: string;
  leaveLabel: string;
}

export function MyClubLeaveButton({
  clubId,
  confirmLabel,
  leaveLabel,
}: MyClubLeaveButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLeave = () => {
    if (!confirm(confirmLabel)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await leaveClub(clubId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleLeave}
        disabled={isPending}
        className="inline-flex flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
      >
        {leaveLabel}
      </button>
      {error ? (
        <span className="text-xs text-rose-500">{error}</span>
      ) : null}
    </div>
  );
}
