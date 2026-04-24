import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkIsSuperUser, getEmailRecipients } from "@/app/actions/superuser";
import { EmailTestForm } from "@/components/email-test-form";

export default async function EmailTestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    redirect(`/${locale}/admin`);
  }

  const recipients = await getEmailRecipients();
  const apiKeyConfigured = !!process.env.RESEND_API_KEY;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Email Notification Test</h1>
        <p className="text-zinc-400 mt-1">
          Resend 이메일 연동 동작을 확인합니다. 선택한 사용자의 등록된 이메일로 테스트 메일이 발송됩니다.
        </p>
      </div>

      {/* 환경변수 상태 표시 */}
      <div
        className={`rounded-xl border p-4 text-sm ${
          apiKeyConfigured
            ? "bg-green-900/20 border-green-800 text-green-300"
            : "bg-red-900/20 border-red-800 text-red-300"
        }`}
      >
        <p className="font-medium">
          {apiKeyConfigured
            ? "✅ RESEND_API_KEY 환경변수가 설정되어 있습니다."
            : "❌ RESEND_API_KEY 환경변수가 설정되지 않았습니다. Vercel 환경변수에 추가하고 재배포하세요."}
        </p>
      </div>

      <EmailTestForm recipients={recipients} />
    </div>
  );
}
