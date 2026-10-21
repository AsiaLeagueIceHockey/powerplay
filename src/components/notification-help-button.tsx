"use client";
import { buttonStyles } from "@/components/ui/styles";

import { useNotification } from "@/contexts/notification-context";
import { Bell } from "lucide-react";

export function NotificationHelpButton() {
  const { openGuide } = useNotification();

  return (
    <button type="button"
      onClick={() => openGuide()}
      className={buttonStyles({ variant: "primary", size: "compact" })}
    >
      <Bell className="w-3.5 h-3.5" />
      <span>알림 설정 확인</span>
    </button>
  );
}
