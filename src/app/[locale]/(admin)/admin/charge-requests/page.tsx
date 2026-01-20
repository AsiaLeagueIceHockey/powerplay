import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkIsSuperUser, getPendingChargeRequests, confirmPointCharge, rejectPointCharge, getPendingPaymentParticipants, confirmParticipantPayment, cancelPendingParticipant } from "@/app/actions/superuser";
import { revalidatePath } from "next/cache";

export default async function ChargeRequestsPage({
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

  const t = await getTranslations("admin.chargeRequests");
  const tPending = await getTranslations("admin.pendingParticipants");
  const [requests, pendingParticipants] = await Promise.all([
    getPendingChargeRequests(),
    getPendingPaymentParticipants(),
  ]);

  // Server Action for confirming charge request
  async function handleConfirm(formData: FormData) {
    "use server";
    const requestId = formData.get("requestId") as string;
    await confirmPointCharge(requestId);
    revalidatePath("/admin/charge-requests");
  }

  // Server Action for rejecting charge request
  async function handleReject(formData: FormData) {
    "use server";
    const requestId = formData.get("requestId") as string;
    await rejectPointCharge(requestId);
    revalidatePath("/admin/charge-requests");
  }

  // Server Action for confirming participant payment
  async function handleConfirmParticipant(formData: FormData) {
    "use server";
    const participantId = formData.get("participantId") as string;
    await confirmParticipantPayment(participantId);
    revalidatePath("/admin/charge-requests");
  }

  // Server Action for canceling pending participant
  async function handleCancelParticipant(formData: FormData) {
    "use server";
    const participantId = formData.get("participantId") as string;
    await cancelPendingParticipant(participantId);
    revalidatePath("/admin/charge-requests");
  }

  return (
    <div className="space-y-8">
      {/* Charge Requests Section */}
      <section>
        <h1 className="text-2xl font-bold text-white mb-4">{t("title")}</h1>

        {requests.length === 0 ? (
          <div className="bg-zinc-800 rounded-lg p-8 text-center text-zinc-400">
            {t("noRequests")}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                {/* User & Amount */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium">{req.user?.full_name || req.user?.email}</p>
                    <p className="text-xs text-zinc-500">{req.user?.email}</p>
                  </div>
                  <p className="text-xl text-amber-400 font-bold">
                    {req.amount.toLocaleString()}P
                  </p>
                </div>
                
                {/* Depositor & Date */}
                <div className="flex justify-between text-sm mb-4 pb-3 border-b border-zinc-700">
                  <div>
                    <span className="text-zinc-500">{t("depositorName")}: </span>
                    <span className="text-zinc-300">{req.depositor_name || "-"}</span>
                  </div>
                  <span className="text-zinc-500">
                    {new Date(req.created_at).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <form action={handleConfirm} className="flex-1">
                    <input type="hidden" name="requestId" value={req.id} />
                    <button
                      type="submit"
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      ✓ {t("confirm")}
                    </button>
                  </form>
                  <form action={handleReject} className="flex-1">
                    <input type="hidden" name="requestId" value={req.id} />
                    <button
                      type="submit"
                      className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      ✕ {t("reject")}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Payment Participants Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">{tPending("title")}</h2>
        
        {pendingParticipants.length === 0 ? (
          <div className="bg-zinc-800 rounded-lg p-8 text-center text-zinc-400">
            {tPending("noParticipants")}
          </div>
        ) : (
          <div className="space-y-4">
            {pendingParticipants.map((p) => (
              <div key={p.id} className="bg-zinc-800 rounded-lg border border-amber-700/50 p-4">
                {/* User & Match Info */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium">{p.user?.full_name || p.user?.email}</p>
                    <p className="text-xs text-zinc-500">{p.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-bold">
                      {(p.match?.entry_points || 0).toLocaleString()}P
                    </p>
                    <p className="text-xs text-zinc-500">
                      {tPending("currentBalance")}: {(p.user?.points || 0).toLocaleString()}P
                    </p>
                  </div>
                </div>
                
                {/* Match Info */}
                <div className="flex justify-between text-sm mb-4 pb-3 border-b border-zinc-700">
                  <div>
                    <span className="text-zinc-500">{tPending("match")}: </span>
                    <span className="text-zinc-300">
                      {locale === "ko" ? p.match?.rink?.name_ko : (p.match?.rink?.name_en || p.match?.rink?.name_ko)}
                    </span>
                    <span className="text-xs text-amber-400 ml-2 px-1.5 py-0.5 bg-amber-900/30 rounded">
                      {p.position}
                    </span>
                  </div>
                  <span className="text-zinc-500">
                    {p.match?.start_time && new Date(p.match.start_time).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Seoul",
                    })}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <form action={handleConfirmParticipant} className="flex-1">
                    <input type="hidden" name="participantId" value={p.id} />
                    <button
                      type="submit"
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      ✓ {tPending("confirmPayment")}
                    </button>
                  </form>
                  <form action={handleCancelParticipant} className="flex-1">
                    <input type="hidden" name="participantId" value={p.id} />
                    <button
                      type="submit"
                      className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      ✕ {tPending("cancel")}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
