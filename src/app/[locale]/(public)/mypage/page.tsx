import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/app/actions/auth";
import { getMyMatches } from "@/app/actions/mypage";
import { Link } from "@/i18n/navigation";

export default async function MyPage() {
  const user = await getUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations();
  const myMatches = await getMyMatches();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === "ko") {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentColor = (paid: boolean) => {
    return paid
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">{t("mypage.title")}</h1>
      <p className="text-gray-600 mb-6">{t("mypage.subtitle")}</p>

      {myMatches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t("mypage.noMatches")}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            {t("mypage.browseMatches")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myMatches.map((match) => (
            <Link
              key={match.participation.id}
              href={`/match/${match.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="font-medium text-lg">
                    {locale === "ko"
                      ? match.rink?.name_ko
                      : match.rink?.name_en || match.rink?.name_ko}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {formatDate(match.start_time)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Position Badge */}
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium">
                    {t(`match.position.${match.participation.position}`)}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                      match.participation.status
                    )}`}
                  >
                    {t(`participant.status.${match.participation.status}`)}
                  </span>

                  {/* Payment Badge */}
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${getPaymentColor(
                      match.participation.payment_status
                    )}`}
                  >
                    {match.participation.payment_status
                      ? t("participant.payment.paid")
                      : t("participant.payment.unpaid")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
