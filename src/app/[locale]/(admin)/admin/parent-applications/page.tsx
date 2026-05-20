import { getPendingParentApplications, checkIsAdminOrSuperUser } from "@/app/actions/parent";
import { ParentApplicationsList } from "@/components/parent-applications-list";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AdminParentApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 1. Admin/Superuser Auth Check
  const isAdmin = await checkIsAdminOrSuperUser();
  if (!isAdmin) {
    redirect(`/${locale}/admin`);
  }

  // 2. Fetch pending applications
  const pendingApplications = await getPendingParentApplications();

  return (
    <div className="container mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">
          👶 학부모 승인 관리 (PowerYouth)
        </h1>
        <p className="text-sm text-zinc-400">
          파워유스 입장을 신청한 유소년 학부모의 자녀 정보를 심사하고 승인 또는 반려합니다.
        </p>
      </div>

      <div className="mt-6">
        <ParentApplicationsList
          applications={pendingApplications}
          locale={locale}
        />
      </div>
    </div>
  );
}
