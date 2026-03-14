"use client";

import { useTransition } from "react";
import type { LoungeMembership } from "@/app/actions/lounge";
import { upsertLoungeMembership } from "@/app/actions/lounge";

interface AdminOption {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
}

export function LoungeMembershipManager({
  locale,
  admins,
  memberships,
}: {
  locale: string;
  admins: AdminOption[];
  memberships: LoungeMembership[];
}) {
  const [isPending, startTransition] = useTransition();

  const formatAdminLabel = (admin: AdminOption) => {
    const primary = admin.full_name || (locale === "ko" ? "이름 없음" : "No name");
    const secondary = [admin.email, admin.phone].filter(Boolean).join(" / ");
    return secondary ? `${primary} | ${secondary}` : primary;
  };

  return (
    <div className="space-y-5 rounded-2xl border border-amber-300 bg-[linear-gradient(180deg,#fff9eb_0%,#fffdf8_100%)] p-6 shadow-sm dark:border-amber-900/30 dark:bg-[linear-gradient(180deg,rgba(120,53,15,0.18)_0%,rgba(24,24,27,0.92)_100%)]">
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "슈퍼유저 구독 관리" : "Superuser membership manager"}
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {locale === "ko" ? "관리자 계정에 라운지 구독 기간을 수기 등록합니다." : "Manually assign lounge contract periods to admin accounts."}
        </p>
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-amber-200/80 bg-white p-5 md:grid-cols-2 dark:border-amber-900/30 dark:bg-zinc-950"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await upsertLoungeMembership(formData);
            if (!result.success) {
              alert(result.error || (locale === "ko" ? "등록 실패" : "Save failed"));
              return;
            }
            alert(locale === "ko" ? "구독 기간이 등록되었습니다." : "Membership saved.");
            event.currentTarget.reset();
          });
        }}
      >
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "대상 관리자" : "Target admin"}</span>
          <select name="user_id" required className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <option value="">{locale === "ko" ? "관리자를 선택하세요" : "Select an admin"}</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {formatAdminLabel(admin)}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {locale === "ko"
              ? "동명이인 구분을 위해 이름, 이메일, 전화번호가 함께 표시됩니다."
              : "Name, email, and phone are shown together for identification."}
          </p>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "시작일" : "Start date"}</span>
          <input type="date" name="starts_at" required className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "종료일" : "End date"}</span>
          <input type="date" name="ends_at" required className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "월 구독료" : "Price"}</span>
          <input name="price_krw" inputMode="numeric" defaultValue="100000" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "문의 채널" : "Inquiry channel"}</span>
          <select name="inquiry_channel" defaultValue="manual" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <option value="manual">Manual</option>
            <option value="kakao">Kakao</option>
            <option value="instagram">Instagram</option>
          </select>
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "메모" : "Note"}</span>
          <textarea name="note" rows={3} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <button type="submit" disabled={isPending} className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 md:col-span-2">
          {isPending ? (locale === "ko" ? "저장 중..." : "Saving...") : (locale === "ko" ? "구독 기간 등록" : "Save membership")}
        </button>
      </form>

      <div className="space-y-3 border-t border-amber-200 pt-4 dark:border-amber-900/30">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "최근 등록 내역" : "Recent memberships"}
        </h4>
        <div className="space-y-2">
          {memberships.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "ko" ? "등록된 구독 내역이 없습니다." : "No memberships yet."}
            </p>
          ) : memberships.map((membership) => (
            <div key={membership.id} className="rounded-xl border border-amber-200/80 bg-white px-4 py-3 text-sm dark:border-amber-900/30 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {[membership.user?.full_name, membership.user?.email].filter(Boolean).join(" / ") || membership.user_id}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {membership.starts_at.slice(0, 10)} ~ {membership.ends_at.slice(0, 10)}
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {membership.price_krw.toLocaleString()} KRW
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
