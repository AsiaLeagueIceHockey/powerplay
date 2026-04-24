"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import {
  type EmailRecipient,
  sendTestEmailNotification,
} from "@/app/actions/superuser";

interface EmailTestFormProps {
  recipients: EmailRecipient[];
}

interface TestResult {
  success?: boolean;
  message?: string;
  resendId?: string;
  recipientEmail?: string;
  details?: unknown;
}

/**
 * 실제 운영 알림과 동일한 제목/본문 프리셋
 * 샘플 값: 강남 아이스링크 / 12월 25일 19:00 / 15,000원
 */
const PRESETS = [
  {
    id: "custom",
    label: "✏️ 커스텀 (직접 작성)",
    title: "PowerPlay 테스트 이메일 ✉️",
    body: "Resend 이메일 연동이 정상 동작하는지 확인하는 테스트 메일입니다.\n\n수신 확인 부탁드려요!",
  },
  {
    id: "join-confirmed",
    label: "경기 참가 확정 (유료)",
    title: "경기/게스트/팀매치 참가 확정 🏒",
    body: "강남 아이스링크 (12월 25일 19:00) 참가가 확정되었습니다. (15,000원 차감)",
  },
  {
    id: "join-pending",
    label: "경기 신청 (입금 대기)",
    title: "경기/게스트/팀매치 참가 확정 🏒",
    body: "강남 아이스링크 (12월 25일 19:00) 참가 신청이 완료되었습니다.",
  },
  {
    id: "refund-complete",
    label: "환불 완료",
    title: "환불 완료 💰",
    body: "경기 취소로 15,000원이 환불되었습니다.",
  },
  {
    id: "cancel-complete",
    label: "신청 취소 완료",
    title: "신청 취소 완료 ↩️",
    body: "입금 대기 중이던 경기 신청이 취소되었습니다.",
  },
  {
    id: "waitlist-promoted",
    label: "대기 → 참가 자동 전환 (포인트 충분)",
    title: "대기 전환 및 참가 확정 🎉",
    body: "강남 아이스링크 (12월 25일 19:00) 빈자리가 생겨 대기에서 참가로 전환되었습니다! (15,000원 차감)",
  },
  {
    id: "waitlist-promoted-pending",
    label: "대기 → 참가 전환 (입금 필요)",
    title: "대기 전환 (입금 필요) ⚡️",
    body: "강남 아이스링크 (12월 25일 19:00) 빈 자리가 생겨 대기에서 참가로 전환되었습니다. 경기에 참가하기 위해 결제가 필요합니다!",
  },
  {
    id: "waitlist-registered",
    label: "대기명단 등록 완료",
    title: "대기명단 등록 완료 ⏳",
    body: "강남 아이스링크 (12월 25일 19:00) 대기명단에 등록되었습니다. 자리 발생 시 알려드립니다.",
  },
  {
    id: "match-canceled-by-admin",
    label: "어드민이 경기 취소 (참가자에게)",
    title: "경기 취소 알림 🚫",
    body: "관리자 사정으로 강남 아이스링크 (12월 25일 19:00) 경기가 취소되었습니다. (확정자는 전액 환불)",
  },
  {
    id: "match-info-changed",
    label: "M1: 경기 정보 변경 (참가자에게)",
    title: "경기 정보 변경 안내 📢",
    body: "강남 아이스링크 (12월 25일 19:00) 경기 정보가 변경되었습니다. 앱에서 확인해 주세요.",
  },
  {
    id: "new-participant-admin",
    label: "어드민에게: 새 참가자",
    title: "새 참가자 🏒",
    body: "홍길동님이 강남 아이스링크 (12월 25일 19:00) 경기에 신청했습니다.",
  },
  {
    id: "participant-canceled-admin",
    label: "M6: 어드민에게: 참가자 취소",
    title: "참가자 취소 알림 ↩️",
    body: "홍길동님이 강남 아이스링크 (12월 25일 19:00) 경기 참가를 취소했습니다.",
  },
  {
    id: "d1-reminder",
    label: "M12: D-1 경기 리마인더",
    title: "경기 D-1 리마인더 ⏰",
    body: "내일 경기가 예정되어 있습니다!\n\n📍 강남 아이스링크\n🕐 12월 25일 19:00\n\n준비물 챙기고 좋은 경기 하세요 🏒",
  },
  {
    id: "chat-message",
    label: "1:1 채팅 첫 메시지",
    title: "홍길동",
    body: "안녕하세요! 다음 경기 같이 뛰실 분 찾고 있어요 🏒",
  },
  {
    id: "charge-approved",
    label: "충전 완료",
    title: "충전 완료 💰",
    body: "30,000원 충전이 완료되었습니다.",
  },
  {
    id: "charge-rejected",
    label: "충전 요청 거부",
    title: "충전 요청 거부 ❌",
    body: "충전 요청이 거부되었습니다.\n사유: 입금 확인 불가",
  },
  {
    id: "club-announcement",
    label: "동호회 공지",
    title: "강남 아이스호키",
    body: "이번 주 토요일 정기 경기 안내드립니다. 참여 부탁드려요!",
  },
] as const;

export function EmailTestForm({ recipients }: EmailTestFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [presetId, setPresetId] = useState<string>("custom");
  const [title, setTitle] = useState<string>(PRESETS[0].title);
  const [body, setBody] = useState<string>(PRESETS[0].body);

  const handlePresetChange = (id: string) => {
    setPresetId(id);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) {
      setTitle(preset.title);
      setBody(preset.body);
    }
  };
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<TestResult | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredRecipients = recipients.filter(
    (r) =>
      r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedRecipients = filteredRecipients.slice(0, visibleCount);
  const selectedUser = recipients.find((r) => r.id === selectedUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !title || !body) return;

    setResult(null);

    startTransition(async () => {
      const res = await sendTestEmailNotification(selectedUserId, title, body);
      if (res.success) {
        setResult({
          success: true,
          message: `이메일 발송 성공! → ${res.recipientEmail}`,
          resendId: res.resendId,
          recipientEmail: res.recipientEmail,
        });
      } else {
        setResult({
          success: false,
          message: res.error || "발송 실패",
          recipientEmail: res.recipientEmail,
          details: res.details,
        });
      }
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 알림 시나리오 프리셋 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">
            알림 시나리오 프리셋
          </label>
          <select
            value={presetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            실제 운영 알림(경기 신청/취소/대기 전환/충전/채팅/리마인더 등)과 동일한 제목·본문 템플릿을 선택하면 아래 입력란이 자동으로 채워집니다.
          </p>
        </div>

        {/* 수신자 선택 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-300">
              수신자 선택
            </label>
            <span className="text-xs text-zinc-500">
              Total: {recipients.length} (Filtered: {filteredRecipients.length})
            </span>
          </div>

          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(10);
            }}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />

          <div className="h-64 overflow-y-auto border border-zinc-700 rounded-lg bg-zinc-950 divide-y divide-zinc-800">
            {displayedRecipients.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedUserId(r.id)}
                className={`p-3 cursor-pointer transition flex items-center justify-between ${
                  selectedUserId === r.id
                    ? "bg-blue-900/30 text-blue-100"
                    : "hover:bg-zinc-900 text-zinc-300"
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{r.full_name || "Unknown"}</p>
                  <p className="text-xs opacity-70">{r.email}</p>
                </div>
                <Mail className="w-4 h-4 opacity-50" />
              </div>
            ))}

            {filteredRecipients.length === 0 && (
              <div className="p-4 text-center text-zinc-500 text-sm">
                일치하는 사용자가 없습니다.
              </div>
            )}

            {filteredRecipients.length > visibleCount && (
              <div
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="p-3 text-center text-blue-400 text-sm hover:bg-zinc-900 cursor-pointer font-medium"
              >
                더 보기 (+10)
              </div>
            )}
          </div>

          {selectedUser && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 선택됨:{" "}
              {selectedUser.full_name || selectedUser.email} ({selectedUser.email})
            </p>
          )}
        </div>

        {/* 제목 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">제목 (Subject)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* 본문 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">본문 (Body)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            required
          />
          <p className="text-xs text-zinc-500">줄바꿈은 그대로 표시됩니다.</p>
        </div>

        {/* 결과 */}
        {result && (
          <div
            className={`p-4 rounded-lg space-y-2 ${
              result.success
                ? "bg-green-900/20 text-green-400 border border-green-800"
                : "bg-red-900/20 text-red-400 border border-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="font-medium">{result.message}</span>
            </div>
            {result.resendId && (
              <div className="text-xs text-zinc-400 pl-8">
                Resend ID:{" "}
                <code className="bg-zinc-800 px-1.5 py-0.5 rounded">
                  {result.resendId}
                </code>
              </div>
            )}
            {result.details != null && (
              <details className="pl-8 text-xs">
                <summary className="cursor-pointer text-zinc-400">
                  상세 정보 보기
                </summary>
                <pre className="mt-2 bg-zinc-950 p-3 rounded overflow-x-auto text-zinc-300">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* 발송 버튼 */}
        <button
          type="submit"
          disabled={isPending || !selectedUserId}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              발송 중...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              테스트 이메일 발송
            </>
          )}
        </button>

        {/* 디버그 안내 */}
        <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-4 space-y-1">
          <p className="font-medium text-zinc-400">메일이 안 오면 확인:</p>
          <ol className="list-decimal list-inside space-y-0.5 pl-1">
            <li>스팸/프로모션 함</li>
            <li>Resend 대시보드 → Logs 에서 발송 기록 확인</li>
            <li>Resend → Domains 에서 powerplay.kr 인증 상태</li>
            <li>Vercel 환경변수 RESEND_API_KEY 적용 후 재배포</li>
          </ol>
        </div>
      </form>
    </div>
  );
}
