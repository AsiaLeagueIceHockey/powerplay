"use client";

import { useNotification } from "@/contexts/notification-context";
import { Bell } from "lucide-react";

export function NotificationHelpButton() {
  const { openGuide } = useNotification();

  return (
    <button
      onClick={openGuide}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
    >
      <Bell className="w-3.5 h-3.5" />
      <span>알림 설정 확인</span>
    </button>
  );
}
