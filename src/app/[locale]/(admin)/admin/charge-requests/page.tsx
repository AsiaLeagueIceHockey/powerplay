import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkIsSuperUser, getPendingChargeRequests } from "@/app/actions/superuser";
import { getPlatformBankAccount } from "@/app/actions/points";
import { ChargeRequestsList } from "@/components/charge-requests-list";
import { SettingsForm } from "@/components/settings-form";
import { getTranslations } from "next-intl/server";

export default async function ChargeRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    redirect(`/${locale}/admin`);
  }

  const chargeRequests = await getPendingChargeRequests();
  const bankAccount = await getPlatformBankAccount();
  const t = await getTranslations("admin.settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {locale === "ko" ? "충전 요청 관리" : "Charge Requests"}
        </h1>
        <p className="text-zinc-400 mt-1">
          {locale === "ko" 
            ? "사용자의 포인트 충전 요청을 관리합니다."
            : "Manage user point charge requests."}
          {chargeRequests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-amber-900/30 text-amber-400 text-sm rounded-full">
              {chargeRequests.length}{locale === "ko" ? "건 대기 중" : " pending"}
            </span>
          )}
        </p>
      </div>

      {/* 자동 확정 안내 배너 */}
      <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="text-sm">
            <p className="font-medium text-blue-300 mb-1">
              {locale === "ko" ? "자동 경기 확정 안내" : "Automatic Match Confirmation"}
            </p>
            <p className="text-blue-400">
              {locale === "ko" 
                ? "충전 요청을 승인하면, 해당 사용자의 미입금 경기들이 자동으로 확정됩니다. 별도로 미입금 참가자를 처리할 필요가 없습니다."
                : "When you approve a charge request, the user's pending matches will be automatically confirmed. No need to process pending participants separately."}
            </p>
          </div>
        </div>
      </div>

      <ChargeRequestsList 
        chargeRequests={chargeRequests}
        pendingParticipants={[]}
        locale={locale}
      />

      <div className="border-t border-zinc-800 my-8 pt-8">
        <h2 className="text-xl font-bold text-white mb-6">
            {t("title")}
        </h2>
        <SettingsForm bankAccount={bankAccount} />
      </div>
    </div>
  );
}
