"use client";

import { useEffect, useState } from "react";
import { getAuditLogs, AuditLog } from "@/app/actions/superuser";
import { useFormatter } from "next-intl";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const format = useFormatter();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs(100);
    setLogs(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📜 운영 로그</h1>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700 disabled:opacity-50"
        >
          🔄 새로고침
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-zinc-500">
            로딩 중...
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 p-12 text-zinc-500">
            <span className="text-2xl">📭</span>
            <p>로그가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="p-4">시간</th>
                  <th className="p-4">사용자</th>
                  <th className="p-4">액션</th>
                  <th className="p-4">내용</th>
                  <th className="p-4">메타데이터</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/50">
                    <td className="whitespace-nowrap p-4 text-zinc-400">
                      {format.dateTime(new Date(log.created_at), {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div className="flex flex-col">
                            <span className="font-medium text-white">
                                {log.user.full_name || "이름 없음"}
                            </span>
                            <span className="text-xs text-zinc-500">{log.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">시스템/탈퇴자</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        getActionColor(log.action_type)
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs md:max-w-md">
                        {log.description}
                    </td>
                    <td className="p-4 font-mono text-xs text-zinc-500">
                      {JSON.stringify(log.metadata, null, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getActionColor(action: string) {
  if (action.includes("CREATE")) return "bg-green-500/10 text-green-500";
  if (action.includes("CANCEL")) return "bg-red-500/10 text-red-500";
  if (action.includes("CHARGE")) return "bg-amber-500/10 text-amber-500";
  if (action.includes("JOIN")) return "bg-blue-500/10 text-blue-500";
  return "bg-zinc-500/10 text-zinc-500";
}
