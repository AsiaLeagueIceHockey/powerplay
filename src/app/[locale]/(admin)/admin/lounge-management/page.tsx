import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getLoungeManagementPageData } from "@/app/actions/lounge";
import { LoungeSuperuserManagementDashboard } from "@/components/lounge-superuser-management-dashboard";

export default async function LoungeManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getLoungeManagementPageData();

  if (!data.ok) {
    redirect(`/${locale}/admin`);
  }

  return (
    <div className="space-y-6">
      <LoungeSuperuserManagementDashboard
        locale={locale}
        memberships={data.memberships ?? []}
        admins={data.admins ?? []}
        businesses={data.businesses ?? []}
      />
    </div>
  );
}
