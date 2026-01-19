import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkIsSuperUser } from "@/app/actions/superuser";
import { getPlatformBankAccount, getRefundPolicy } from "@/app/actions/points";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage({
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

  const t = await getTranslations("admin.settings");
  
  const [bankAccount, refundPolicy] = await Promise.all([
    getPlatformBankAccount(),
    getRefundPolicy(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
      <SettingsForm 
        bankAccount={bankAccount} 
        refundRules={refundPolicy?.rules || []} 
      />
    </div>
  );
}
