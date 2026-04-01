"use client";

import { useState, useEffect } from "react";
import { sendTestNotification, getNotificationLogs } from "@/app/actions/push";
import { Bell, Send, RefreshCw, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";

interface NotificationLog {
  id: string;
  user_id: string;
  title: string;
  body: string;
  url: string;
  status: "sent" | "failed" | "no_subscription";
  devices_sent: number;
  error_message?: string;
  created_at: string;
  user?: {
    full_name?: string;
  };
}

export function NotificationTestPanel() {
  const [targetEmail, setTargetEmail] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [title, setTitle] = useState("테스트 알림 🧪");
  const [body, setBody] = useState("이것은 테스트 알림입니다.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLogsLoading(true);
    const { logs: data } = await getNotificationLogs(50);
    setLogs(data as NotificationLog[]);
    setLogsLoading(false);
  }

  async function handleSendTest() {
    if (!targetUserId) {
      setResult({ success: false, message: "사용자 ID를 입력해주세요." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await sendTestNotification(targetUserId, title, body);
      if (response.success) {
        setResult({ 
          success: true, 
          message: `✅ 알림 발송 완료! (${response.sent}개 기기)` 
        });
        loadLogs(); // Refresh logs
      } else {
        setResult({ 
          success: false, 
          message: `❌ 발송 실패: ${response.error}` 
        });
      }
    } catch (err: any) {
      setResult({ success: false, message: `❌ 오류: ${err.message}` });
    }

    setLoading(false);
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "no_subscription":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "발송됨";
      case "failed":
        return "실패";
      case "no_subscription":
        return "구독 없음";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Test Form */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <Bell className="w-5 h-5 text-blue-500" />
          테스트 알림 보내기
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-300">
              대상 사용자 ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="UUID (예: a1b2c3d4-...)"
                className="flex-1 px-3 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-white text-sm placeholder:text-zinc-500"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Supabase Auth에서 사용자 ID를 복사하여 입력하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                내용
              </label>
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSendTest}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "발송 중..." : "테스트 발송"}
            </button>

            {result && (
              <p className={`text-sm ${result.success ? "text-green-400" : "text-red-400"}`}>
                {result.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">발송 기록</h2>
          <button
            onClick={loadLogs}
            disabled={logsLoading}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <RefreshCw className={`w-4 h-4 ${logsLoading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>

        {logsLoading ? (
          <div className="text-center py-8 text-zinc-500">로딩 중...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">발송 기록이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-2 px-2 font-medium text-zinc-500">상태</th>
                  <th className="text-left py-2 px-2 font-medium text-zinc-500">제목</th>
                  <th className="text-left py-2 px-2 font-medium text-zinc-500">기기</th>
                  <th className="text-left py-2 px-2 font-medium text-zinc-500">시간</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/30"
                  >
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(log.status)}
                        <span className="text-xs">{statusLabel(log.status)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-medium truncate max-w-[200px]">{log.title}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[200px]">{log.body}</div>
                    </td>
                    <td className="py-2 px-2 text-center">{log.devices_sent}</td>
                    <td className="py-2 px-2 text-xs text-zinc-500">
                      {new Date(log.created_at).toLocaleString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
