import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMatch, type MatchParticipant } from "@/app/actions/match";
import { getUser } from "@/app/actions/auth";
import { ParticipantList } from "@/components/participant-list";
import { JoinButton } from "@/components/join-button";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const match = await getMatch(id);
  const user = await getUser();
  const t = await getTranslations("match");

  if (!match) {
    notFound();
  }

  const rinkName = locale === "ko" ? match.rink?.name_ko : match.rink?.name_en;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const startDate = new Date(match.start_time);
  const formattedDate = dateFormatter.format(startDate);
  const formattedTime = timeFormatter.format(startDate);

  const statusColors = {
    open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    closed: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
    canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const participants = match.participants || [];

  // Calculate participant counts
  const fwParticipants = participants.filter((p) => p.position === "FW");
  const dfParticipants = participants.filter((p) => p.position === "DF");
  const gParticipants = participants.filter((p) => p.position === "G");

  // Check if user already joined
  const userParticipant = user
    ? participants.find((p) => p.user?.id === user.id)
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[match.status]}`}
          >
            {t(`status.${match.status}`)}
          </span>
        </div>

        <h1 className="mb-2 text-3xl font-bold">{rinkName || "Unknown Rink"}</h1>

        <div className="text-lg text-zinc-600 dark:text-zinc-400">
          {formattedDate} · {formattedTime}
        </div>
      </div>

      {/* Match Info */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">{t("details")}</h2>

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">{t("fee")}</dt>
              <dd className="font-medium">₩{match.fee.toLocaleString()}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">
                {t("position.FW")}
              </dt>
              <dd className="font-medium">
                {fwParticipants.length}/{match.max_fw}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">
                {t("position.DF")}
              </dt>
              <dd className="font-medium">
                {dfParticipants.length}/{match.max_df}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">
                {t("position.G")}
              </dt>
              <dd className="font-medium">
                {gParticipants.length}/{match.max_g}
              </dd>
            </div>
          </dl>

          {match.rink?.map_url && (
            <a
              href={match.rink.map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              📍 {locale === "ko" ? "지도 보기" : "View Map"} →
            </a>
          )}
        </div>

        {/* Description */}
        {match.description && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold">
              {locale === "ko" ? "공지" : "Notice"}
            </h2>
            <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
              {match.description}
            </p>
          </div>
        )}
      </div>

      {/* Join Button */}
      {match.status === "open" && (
        <div className="mb-8">
          <JoinButton
            matchId={match.id}
            userId={user?.id || null}
            userParticipant={userParticipant || null}
            maxFW={match.max_fw}
            maxDF={match.max_df}
            maxG={match.max_g}
            currentFW={fwParticipants.length}
            currentDF={dfParticipants.length}
            currentG={gParticipants.length}
          />
        </div>
      )}

      {/* Participants */}
      <ParticipantList
        fwParticipants={fwParticipants}
        dfParticipants={dfParticipants}
        gParticipants={gParticipants}
      />
    </div>
  );
}
