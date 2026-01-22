import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkIsSuperUser, getPendingChargeRequests, getPendingPaymentParticipants } from "@/app/actions/superuser";
import { ChargeRequestsList } from "@/components/charge-requests-list";

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

  const [chargeRequests, pendingParticipants] = await Promise.all([
    getPendingChargeRequests(),
    getPendingPaymentParticipants(),
  ]);

  const totalCount = chargeRequests.length + pendingParticipants.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          결제 대기 관리
        </h1>
        <p className="text-zinc-400 mt-1">
          포인트 충전 요청과 경기 참가 미입금을 한 곳에서 관리합니다.
          {totalCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-amber-900/30 text-amber-400 text-sm rounded-full">
              {totalCount}건 대기 중
            </span>
          )}
        </p>
      </div>

      <ChargeRequestsList 
        chargeRequests={chargeRequests}
        pendingParticipants={pendingParticipants}
        locale={locale}
      />
    </div>
  );
}
