import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { 
  getPendingChargeRequests,
  getAllUserPoints,
  checkIsSuperUser
} from "@/app/actions/superuser";
import { getPlatformBankAccount } from "@/app/actions/points";
import { ChargeRequestsList } from "@/components/charge-requests-list";
import { PointStatusTab } from "@/components/point-status-tab";
import { SettingsForm } from "@/components/settings-form";
import Link from "next/link";

export default async function PointManagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);

  // Auth Check
  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations("admin.pointManagement");
  const activeTab = tab === "status" ? "status" : "requests";

  // Data for Requests Tab
  const chargeRequests = activeTab === "requests" ? await getPendingChargeRequests() : [];
  const bankAccount = activeTab === "requests" ? await getPlatformBankAccount() : null;
 
  // Data for Status Tab
  const allUserPoints = activeTab === "status" ? await getAllUserPoints() : [];

  return (
    <div className="container mx-auto pb-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        💰 {t("title")}
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-6">
        <Link
            href={`/${locale}/admin/points?tab=requests`}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "requests"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
        >
            {t("tabRequests")}
             {(chargeRequests.length) > 0 && (
                <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {chargeRequests.length}
                </span>
            )}
        </Link>
        <Link
            href={`/${locale}/admin/points?tab=status`}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "status"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
        >
            {t("tabStatus")}
        </Link>
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeTab === "requests" ? (
             <>
                <ChargeRequestsList 
                    chargeRequests={chargeRequests} 
                    locale={locale} 
                />
                
                <div className="mt-12 pt-8 border-t border-zinc-800">
                    <h2 className="text-xl font-bold mb-6 text-white">플랫폼 설정</h2>
                    <SettingsForm bankAccount={bankAccount} />
                </div>
             </>
        ) : (
             <PointStatusTab initialUsers={allUserPoints} />
        )}
      </div>
    </div>
  );
}
