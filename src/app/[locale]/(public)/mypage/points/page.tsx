
import { buttonStyles, surfaceStyles } from "@/components/ui/styles";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPointHistory, getMyChargeRequests, getRefundPolicy } from "@/app/actions/points";
import Link from "next/link";
import { Info } from "lucide-react";

export default async function PointsPage({
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

  const t = await getTranslations("points");

  // 병렬 데이터 페칭
  const [
    { data: profile },
    { transactions },
    chargeRequests,
    refundPolicy,
  ] = await Promise.all([
    supabase.from("profiles").select("points").eq("id", user.id).single(),
    getPointHistory(10),
    getMyChargeRequests(),
    getRefundPolicy(),
  ]);

  const points = profile?.points ?? 0;

  const currencyUnit = locale === "ko" ? "원" : "KRW";

  // 거래 타입에 따른 색상
  const getTypeColor = (type: string) => {
    switch (type) {
      case "charge":
        return "text-green-600 dark:text-green-400";
      case "use":
        return "text-red-600 dark:text-red-400";
      case "refund":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-zinc-600 dark:text-zinc-400";
    }
  };

  // 충전 요청 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 포인트 잔액 카드 */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-pp-warning-text text-sm mb-1">{t("balance")}</p>
        <p className="text-4xl font-bold">{points.toLocaleString()}{currencyUnit}</p>
        <Link
          href={`/${locale}/mypage/points/charge`}
          className={`${buttonStyles({ variant: "points", size: "compact" })} mt-4`}
        >
          {t("charge")} →
        </Link>
      </div>

      {/* 포인트 안내 */}
      <div className="flex gap-3 bg-pp-accent-soft p-4 rounded-xl border border-pp-accent ">
        <Info className="w-5 h-5 text-pp-accent-text flex-shrink-0 mt-0.5" />
        <div className="text-sm text-pp-muted space-y-1">
          <p className="font-semibold text-pp-accent-text ">
            {t("infoTitle")}
          </p>
          <p>
            {t("infoDesc")}
          </p>
        </div>
      </div>

      {/* 환불 정책 */}
      {refundPolicy && refundPolicy.rules.length > 0 && (
        <div className={surfaceStyles({ density: "compact" })}>
          <h2 className="text-lg font-bold mb-3">{t("refundPolicy.title")}</h2>
          <p className="text-sm text-pp-muted mb-3">{t("refundPolicy.description")}</p>
          <div className="space-y-2">
            {refundPolicy.rules
              .sort((a, b) => b.hoursBeforeMatch - a.hoursBeforeMatch)
              .map((rule, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm py-2 px-3 bg-pp-surface-muted rounded-lg"
                >
                  <span>
                    {rule.hoursBeforeMatch === 0
                      ? (locale === "ko" ? "당일" : "Same day")
                      : (locale === "ko"
                          ? `경기 ${rule.hoursBeforeMatch}시간 전`
                          : `${rule.hoursBeforeMatch}h before match`)}
                  </span>
                  <span className={rule.refundPercent === 0 ? "text-pp-danger-text" : "text-pp-success-text font-medium"}>
                    {rule.refundPercent === 0
                      ? (locale === "ko" ? "환불 불가" : "No refund")
                      : `${rule.refundPercent}% ${locale === "ko" ? "환불" : "refund"}`}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 충전 요청 내역 */}
      {chargeRequests.length > 0 && (
        <div className={surfaceStyles({ density: "compact" })}>
          <h2 className="text-lg font-bold mb-4">{t("chargeRequest.myRequests")}</h2>
          <div className="space-y-3">
            {chargeRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between py-3 border-b border-pp-border last:border-0"
              >
                <div>
                  <p className="font-medium">{req.amount.toLocaleString()}{currencyUnit}</p>
                  <p className="text-xs text-pp-muted">
                    {new Date(req.created_at).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                      timeZone: "Asia/Seoul"
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(req.status)}`}>
                    {t(`chargeRequest.${req.status}`)}
                  </span>
                  {req.status === "pending" && (
                    <form action={async () => {
                      "use server";
                      const { cancelChargeRequest } = await import("@/app/actions/points");
                      await cancelChargeRequest(req.id);
                    }}>
                      <button
                        type="submit"
                        className={buttonStyles({ variant: "danger", size: "compact" })}
                      >
                        {t("chargeRequest.cancel")}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 포인트 내역 */}
      <div className={surfaceStyles({ density: "compact" })}>
        <h2 className="text-lg font-bold mb-4">{t("history")}</h2>
        {transactions.length === 0 ? (
          <p className="text-pp-muted text-center py-8">{t("noHistory")}</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-pp-border last:border-0"
              >
                <div>
                  <p className="font-medium">{tx.description || t(`transaction.${tx.type}`)}</p>
                  <p className="text-xs text-pp-muted">
                    {new Date(tx.created_at).toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
                      timeZone: "Asia/Seoul",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getTypeColor(tx.type)}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}{currencyUnit}
                  </p>
                  <p className="text-xs text-pp-muted">
                    {tx.balance_after.toLocaleString()}{currencyUnit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
