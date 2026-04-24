"use client";

import { useState, useTransition } from "react";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { sendChatUnreadEmailReminder } from "@/app/actions/superuser";

interface ChatUnreadEmailButtonProps {
  recipientId: string;
  recipientEmail: string | null;
  counterpartName: string;
  locale: string;
}

interface SendResult {
  success: boolean;
  message: string;
  resendId?: string;
}

/**
 * 슈퍼유저 채팅 모니터링 — 미읽음 사용자에게 이메일 알림 수동 발송
 */
export function ChatUnreadEmailButton({
  recipientId,
  recipientEmail,
  counterpartName,
  locale,
}: ChatUnreadEmailButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SendResult | null>(null);

  const handleClick = () => {
    if (!recipientEmail) return;
    if (
      !confirm(
        locale === "ko"
          ? `${recipientEmail} 로 채팅 미확인 안내 이메일을 보낼까요?`
          : `Send chat reminder email to ${recipientEmail}?`
      )
    ) {
      return;
    }

    setResult(null);
    startTransition(async () => {
      const res = await sendChatUnreadEmailReminder(recipientId, counterpartName);
      if (res.success) {
        setResult({
          success: true,
          message:
            locale === "ko"
              ? `이메일 발송 완료 → ${res.recipientEmail}`
              : `Sent → ${res.recipientEmail}`,
          resendId: res.resendId,
        });
      } else {
        setResult({
          success: false,
          message: res.error || (locale === "ko" ? "발송 실패" : "Failed"),
        });
      }
    });
  };

  if (!recipientEmail) {
    return (
      <span className="inline-flex items-center rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500">
        {locale === "ko" ? "이메일 미등록" : "No email"}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Mail className="h-3.5 w-3.5" />
        )}
        {locale === "ko" ? "이메일 보내기" : "Send email"}
      </button>

      {result && (
        <span
          className={`inline-flex items-center gap-1 text-[11px] ${
            result.success ? "text-green-400" : "text-red-400"
          }`}
        >
          {result.success ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {result.message}
        </span>
      )}
    </div>
  );
}
