
import { surfaceStyles } from "@/components/ui/styles";
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
          className="text-sm text-pp-muted hover:text-pp-muted "
        >
          ← {locale === "ko" ? "충전 금액으로 돌아가기" : "Back to Points"}
        </Link>
        <h1 className="text-2xl font-bold mt-2">{t("title")}</h1>
      </div>

      {/* 은행 계좌 미설정 경고 */}
      {!isBankConfigured && (
        <div className="mb-4 p-4 bg-pp-warning-soft border border-pp-warning-border rounded-xl text-pp-warning-text text-sm">
          ⚠️ {locale === "ko"
            ? "아직 입금 계좌가 설정되지 않았습니다. 관리자에게 문의해주세요."
            : "Bank account not configured yet. Please contact admin."}
        </div>
      )}

      {/* 대기 중인 경기 목록 (있을 경우에만) */}
      {pendingMatches.length > 0 && (
        <div className="mb-4 p-4 bg-pp-warning-soft border border-pp-warning-border rounded-xl">
          <h3 className="font-bold text-pp-warning-text mb-3 flex items-center gap-2">
            ⏳ {locale === "ko" ? "입금 대기 중인 경기" : "Matches Awaiting Payment"}
          </h3>
          <div className="space-y-2">
            {pendingMatches.map((match) => (
              <div
                key={match.id}
                className="flex flex-col text-sm bg-pp-surface p-3 rounded-lg gap-1"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{match.rink_name}</p>
                    <p className="text-pp-muted text-xs">
                      {new Date(match.start_time).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Seoul",
                      })}
                    </p>
                  </div>
                  <span className="font-semibold text-pp-muted whitespace-nowrap">
                    {match.entry_points.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                  </span>
                </div>

                {match.rental_opt_in && match.rental_fee > 0 && (
                  <div className="flex justify-between items-center w-full mt-1 pt-1 border-t border-dashed border-pp-border ">
                     <span className="text-xs text-pp-muted flex items-center gap-1">
                       <span className="inline-block w-1.5 h-1.5 rounded-full bg-pp-info-soft"></span>
                       {locale === "ko" ? "체험 장비 대여" : "Experience Equipment"}
                     </span>
                     <span className="text-xs font-semibold text-pp-info-text ">
                       +{match.rental_fee.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                     </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 총 필요 금액 */}
          <div className="mt-3 pt-3 border-t border-pp-warning-border flex justify-between items-center">
            <span className="text-sm text-pp-warning-text ">
              {locale === "ko" ? "총 필요 금액" : "Total Required"}
            </span>
            <span className="font-bold text-lg text-pp-warning-text ">
              {totalRequiredForMatches.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-pp-muted">
              {locale === "ko" ? "현재 잔액" : "Current Balance"}
            </span>
            <span className="font-medium">
              {currentBalance.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
            </span>
          </div>
          {shortageAmount > 0 && (
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-pp-warning-text font-medium">
                {locale === "ko" ? "💰 추가 충전 필요" : "💰 Additional Needed"}
              </span>
              <span className="font-bold text-pp-warning-text ">
                {shortageAmount.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
              </span>
            </div>
          )}

          {/* 안내 문구 */}
          <p className="mt-3 text-xs text-pp-warning-text ">
            💡 {locale === "ko"
              ? "충전 후 입금 확인이 되면 위 경기들이 자동으로 확정됩니다."
              : "After payment is verified, the matches above will be automatically confirmed."}
          </p>
        </div>
      )}

      {/* 충전 폼 */}
      <div className={surfaceStyles({ density: "default" })}>
        <ChargeForm bankAccount={bankAccount} initialAmount={initialAmount} />
      </div>
    </div>
  );
}

