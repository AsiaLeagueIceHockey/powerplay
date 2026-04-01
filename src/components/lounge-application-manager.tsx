"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquareText, UserRound } from "lucide-react";
import type { LoungeManagedApplication } from "@/app/actions/lounge";
import { updateLoungeMembershipApplicationStatus } from "@/app/actions/lounge";

function formatKstDateTime(input: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(input));
}

function getStatusLabel(locale: string, status: LoungeManagedApplication["status"]) {
  if (status === "pending") return locale === "ko" ? "대기" : "Pending";
  if (status === "contacted") return locale === "ko" ? "연락 완료" : "Contacted";
  if (status === "converted") return locale === "ko" ? "전환 완료" : "Converted";
  return locale === "ko" ? "종료" : "Closed";
}

function getStatusClass(status: LoungeManagedApplication["status"]) {
  if (status === "pending") return "bg-amber-500/15 text-amber-300";
  if (status === "contacted") return "bg-sky-500/15 text-sky-300";
  if (status === "converted") return "bg-emerald-500/15 text-emerald-300";
  return "bg-zinc-900 text-zinc-400";
}

export function LoungeApplicationManager({
  locale,
  applications,
}: {
  locale: string;
  applications: LoungeManagedApplication[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (applications.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-800 p-8 text-center text-sm text-zinc-400">
        {locale === "ko" ? "들어온 멤버십 신청이 없습니다." : "No membership applications yet."}
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <article key={application.id} className="rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(application.status)}`}>
                  {getStatusLabel(locale, application.status)}
                </span>
                <span className="text-xs text-zinc-500">
                  {locale === "ko" ? "신청 시각" : "Requested"} {formatKstDateTime(application.created_at)}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {locale === "ko" ? "신청 계정" : "Applicant"}
                </p>
                <Link
                  href={`/${locale}/admin/admins/${application.user_id}`}
                  className="mt-1 inline-flex items-center gap-2 text-base font-bold text-zinc-100 hover:text-amber-300"
                >
                  <UserRound className="h-4 w-4" />
                  {application.user?.full_name || application.user?.email || application.user_id}
                </Link>
                <p className="mt-1 text-sm text-zinc-400">
                  {[application.user?.email, application.user?.phone].filter(Boolean).join(" / ") || (locale === "ko" ? "연락처 미등록" : "No contact info")}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {locale === "ko" ? "현재 비즈니스" : "Business"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    {application.business?.name || (locale === "ko" ? "아직 없음" : "None yet")}
                  </p>
                  {application.business?.slug ? (
                    <Link
                      href={`/${locale}/lounge/${application.business.slug}`}
                      target="_blank"
                      className="mt-2 inline-flex text-xs text-amber-300 hover:underline"
                    >
                      {locale === "ko" ? "공개 페이지 보기" : "Open public page"}
                    </Link>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {locale === "ko" ? "신청 메모" : "Applicant note"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
                    {application.note || (locale === "ko" ? "남긴 메모 없음" : "No note")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form
            className="mt-5 space-y-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const formData = new FormData(form);
              startTransition(async () => {
                const result = await updateLoungeMembershipApplicationStatus(formData);
                if (!result.success) {
                  alert(result.error || (locale === "ko" ? "상태 변경 실패" : "Failed to update"));
                  return;
                }
                router.refresh();
              });
            }}
          >
            <input type="hidden" name="application_id" value={application.id} />
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-zinc-100">{locale === "ko" ? "처리 상태" : "Status"}</span>
                <select
                  name="status"
                  defaultValue={application.status}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
                >
                  <option value="pending">{locale === "ko" ? "대기" : "Pending"}</option>
                  <option value="contacted">{locale === "ko" ? "연락 완료" : "Contacted"}</option>
                  <option value="converted">{locale === "ko" ? "전환 완료" : "Converted"}</option>
                  <option value="closed">{locale === "ko" ? "종료" : "Closed"}</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-zinc-100">{locale === "ko" ? "운영 메모" : "Ops note"}</span>
                <textarea
                  name="contact_note"
                  rows={3}
                  defaultValue={application.contact_note || ""}
                  placeholder={locale === "ko" ? "연락 내용, 응대 메모, 전환 계획 등을 남기세요." : "Leave contact summary or internal follow-up note."}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-xs text-zinc-400">
                <MessageSquareText className="h-4 w-4" />
                {locale === "ko" ? "프로필 상세에서 전화번호를 열고 직접 연락한 뒤 상태를 갱신하세요." : "Open the admin profile and update the status after contacting them."}
              </p>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
              >
                {isPending ? (locale === "ko" ? "저장 중..." : "Saving...") : (locale === "ko" ? "상태 저장" : "Save status")}
              </button>
            </div>
          </form>
        </article>
      ))}
    </div>
  );
}
