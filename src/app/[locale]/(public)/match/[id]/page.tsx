import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getMatch } from "@/app/actions/match";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { MatchApplication } from "@/components/match-application";
import { AdminControls } from "@/components/admin-controls";
import { MatchShareButton } from "@/components/match-share-button";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const match = await getMatch(id);

  if (!match) {
    notFound();
  }

  // Format Date Logic
  const date = new Date(match.start_time);
  const dateStr =
    locale === "ko"
      ? date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })
      : date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

  const timeStr = date.toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Calculate remaining spots
  const remaining = {
    fw: match.max_fw - (match.participants_count?.fw || 0),
    df: match.max_df - (match.participants_count?.df || 0),
    g: match.max_g - (match.participants_count?.g || 0),
  };

  // Participant Lists
  const players = {
    fw: match.participants?.filter(
      (p) => p.position === "FW" && ["applied", "confirmed"].includes(p.status)
    ),
    df: match.participants?.filter(
      (p) => p.position === "DF" && ["applied", "confirmed"].includes(p.status)
    ),
    g: match.participants?.filter(
      (p) => p.position === "G" && ["applied", "confirmed"].includes(p.status)
    ),
  };

  // User Status
  const userParticipant = match.participants?.find((p) => p.user?.id === user?.id);
  const isJoined = !!userParticipant;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Admin Controls - One line, Edit only */}
      <AdminControls matchId={match.id} locale={locale} />

      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                match.status === "open"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {t(`match.status.${match.status}`)}
            </span>
          </div>
          
          <MatchShareButton match={match} />
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {locale === "ko"
            ? match.rink?.name_ko
            : match.rink?.name_en || match.rink?.name_ko}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          {dateStr} · {timeStr}
        </p>
      </div>

      {/* Match Details Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4">{t("match.details")}</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">{t("admin.form.fee")}</span>
            <span className="font-semibold text-lg">
              ₩{match.fee.toLocaleString()}
            </span>
          </div>
          
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-2"></div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">FW</span>
            <span className={`font-semibold ${remaining.fw === 0 ? 'text-red-500' : ''}`}>
              {match.participants_count?.fw}/{match.max_fw}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">DF</span>
            <span className={`font-semibold ${remaining.df === 0 ? 'text-red-500' : ''}`}>
               {match.participants_count?.df}/{match.max_df}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">G</span>
            <span className={`font-semibold ${remaining.g === 0 ? 'text-red-500' : ''}`}>
               {match.participants_count?.g}/{match.max_g}
            </span>
          </div>

          <div className="pt-2">
            <a
              href={match.rink?.map_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center"
            >
              📍 {t("match.viewMap")}
            </a>
          </div>
        </div>
      </div>

      {/* Notice */}
      {match.description && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
           <h2 className="text-lg font-bold mb-2">{t("admin.form.description")}</h2>
           <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
             {match.description}
           </p>
        </div>
      )}

      {/* Application - Inline status and button */}
      <MatchApplication 
        matchId={match.id} 
        positions={{
          FW: remaining.fw > 0,
          DF: remaining.df > 0,
          G: remaining.g > 0
        }}
        isJoined={isJoined}
        currentPosition={userParticipant?.position}
        matchStatus={match.status}
      />

      {/* Participant List Header */}
      <h2 className="text-xl font-bold pt-4">
        {locale === "ko" ? "참가자 현황" : "Participants"}
      </h2>

      {/* Participant Cards */}
      <div className="space-y-4">
        {/* FW Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
           <div className="flex items-center space-x-2 mb-4">
             <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-bold">
               {t("match.position.FW")}
             </span>
             <span className="text-zinc-500 text-sm">({players.fw?.length || 0})</span>
           </div>
           
           {players.fw?.length === 0 ? (
             <p className="text-sm text-zinc-400 pl-1">{t("match.noParticipants")}</p>
           ) : (
             <ul className="space-y-3">
               {players.fw?.map((p, i) => (
                 <li key={p.id} className="flex items-center space-x-3 text-sm p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg">
                   <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">
                     {i + 1}
                   </div>
                   <span className="font-medium">
                     {p.user?.full_name || p.user?.email?.split('@')[0]}
                   </span>
                   {p.id === userParticipant?.id && (
                     <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Me</span>
                   )}
                 </li>
               ))}
             </ul>
           )}
        </div>

        {/* DF Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
           <div className="flex items-center space-x-2 mb-4">
             <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded text-xs font-bold">
               {t("match.position.DF")}
             </span>
             <span className="text-zinc-500 text-sm">({players.df?.length || 0})</span>
           </div>
           
           {players.df?.length === 0 ? (
             <p className="text-sm text-zinc-400 pl-1">{t("match.noParticipants")}</p>
           ) : (
             <ul className="space-y-3">
               {players.df?.map((p, i) => (
                 <li key={p.id} className="flex items-center space-x-3 text-sm p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg">
                   <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">
                     {i + 1}
                   </div>
                   <span className="font-medium">
                     {p.user?.full_name || p.user?.email?.split('@')[0]}
                   </span>
                   {p.id === userParticipant?.id && (
                     <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Me</span>
                   )}
                 </li>
               ))}
             </ul>
           )}
        </div>

        {/* G Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
           <div className="flex items-center space-x-2 mb-4">
             <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs font-bold">
               {t("match.position.G")}
             </span>
             <span className="text-zinc-500 text-sm">({players.g?.length || 0})</span>
           </div>
           
           {players.g?.length === 0 ? (
             <p className="text-sm text-zinc-400 pl-1">{t("match.noParticipants")}</p>
           ) : (
             <ul className="space-y-3">
               {players.g?.map((p, i) => (
                 <li key={p.id} className="flex items-center space-x-3 text-sm p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg">
                   <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">
                     {i + 1}
                   </div>
                   <span className="font-medium">
                     {p.user?.full_name || p.user?.email?.split('@')[0]}
                   </span>
                   {p.id === userParticipant?.id && (
                     <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Me</span>
                   )}
                 </li>
               ))}
             </ul>
           )}
        </div>
      </div>
    </div>
  );
}
