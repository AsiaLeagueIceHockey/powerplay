import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPlatformBankAccount, getUserPendingMatches, getUserPoints } from "@/app/actions/points";
import { ChargeForm } from "@/components/charge-form";
import Link from "next/link";

export default async function ChargePointsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ amount?: string }>;
}) {
  const { locale } = await params;
  const { amount: amountParam } = await searchParams;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("points.chargeRequest");
  const [bankAccount, pendingMatches, currentBalance] = await Promise.all([
    getPlatformBankAccount(),
    getUserPendingMatches(),
    getUserPoints(),
  ]);

  // Calculate required amount for all pending matches
  const totalRequiredForMatches = pendingMatches.reduce((sum, m) => {
    const rentalFee = m.rental_opt_in ? (m.rental_fee || 0) : 0;
    return sum + m.entry_points + rentalFee;
  }, 0);
  
  const shortageAmount = Math.max(0, totalRequiredForMatches - currentBalance);

  // Use shortage amount if there are pending matches, otherwise use query param or default
  const initialAmount = pendingMatches.length > 0 
    ? shortageAmount 
    : (amountParam ? parseInt(amountParam.replace(/[^0-9]/g, "")) || 30000 : 30000);

  // Check if bank account is properly configured
  const isBankConfigured = bankAccount && bankAccount.bank && bankAccount.account;

  return (
    <div className="max-w-xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/${locale}/mypage/points`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← {locale === "ko" ? "충전 금액으로 돌아가기" : "Back to Points"}
        </Link>
        <h1 className="text-2xl font-bold mt-2">{t("title")}</h1>
      </div>

      {/* 은행 계좌 미설정 경고 */}
      {!isBankConfigured && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-700 dark:text-yellow-300 text-sm">
          ⚠️ {locale === "ko" 
            ? "아직 입금 계좌가 설정되지 않았습니다. 관리자에게 문의해주세요."
            : "Bank account not configured yet. Please contact admin."}
        </div>
      )}

      {/* 대기 중인 경기 목록 (있을 경우에만) */}
      {pendingMatches.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <h3 className="font-bold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
            ⏳ {locale === "ko" ? "입금 대기 중인 경기" : "Matches Awaiting Payment"}
          </h3>
          <div className="space-y-2">
            {pendingMatches.map((match) => (
              <div 
                key={match.id} 
                className="flex flex-col text-sm bg-white dark:bg-zinc-800 p-3 rounded-lg gap-1"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{match.rink_name}</p>
                    <p className="text-zinc-500 text-xs">
                      {new Date(match.start_time).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Seoul",
                      })}
                    </p>
                  </div>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {match.entry_points.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                  </span>
                </div>
                
                {match.rental_opt_in && match.rental_fee > 0 && (
                  <div className="flex justify-between items-center w-full mt-1 pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                     <span className="text-xs text-zinc-500 flex items-center gap-1">
                       <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                       {locale === "ko" ? "체험 장비 대여" : "Experience Equipment"}
                     </span>
                     <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                       +{match.rental_fee.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                     </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 총 필요 금액 */}
          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700 flex justify-between items-center">
            <span className="text-sm text-amber-700 dark:text-amber-300">
              {locale === "ko" ? "총 필요 금액" : "Total Required"}
            </span>
            <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
              {totalRequiredForMatches.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">
              {locale === "ko" ? "현재 잔액" : "Current Balance"}
            </span>
            <span className="font-medium">
              {currentBalance.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
            </span>
          </div>
          {shortageAmount > 0 && (
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                {locale === "ko" ? "💰 추가 충전 필요" : "💰 Additional Needed"}
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {shortageAmount.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
              </span>
            </div>
          )}
          
          {/* 안내 문구 */}
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-500">
            💡 {locale === "ko" 
              ? "충전 후 입금 확인이 되면 위 경기들이 자동으로 확정됩니다."
              : "After payment is verified, the matches above will be automatically confirmed."}
          </p>
        </div>
      )}

      {/* 충전 폼 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <ChargeForm bankAccount={bankAccount} initialAmount={initialAmount} />
      </div>
    </div>
  );
}

