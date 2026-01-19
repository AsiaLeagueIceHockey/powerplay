import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPlatformBankAccount } from "@/app/actions/points";
import { ChargeForm } from "@/components/charge-form";
import Link from "next/link";

export default async function ChargePointsPage({
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

  const t = await getTranslations("points.chargeRequest");
  const bankAccount = await getPlatformBankAccount();

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
          ← {locale === "ko" ? "포인트로 돌아가기" : "Back to Points"}
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

      {/* 충전 폼 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <ChargeForm bankAccount={bankAccount} />
      </div>
    </div>
  );
}

