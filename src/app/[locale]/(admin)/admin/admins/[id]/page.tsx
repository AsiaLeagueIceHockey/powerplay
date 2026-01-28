
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAdminDetail } from "@/app/actions/admin";
import Link from "next/link";
import { ChevronLeft, User, Mail, Calendar, Users, Trophy, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

export default async function AdminDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("admin");

    const data = await getAdminDetail(id);

    if (!data) {
        notFound();
    }

    const { profile, clubs, matches } = data;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header & Back Link */}
            <div className="space-y-4">
                <Link
                    href={`/${locale}/admin/admins`}
                    className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    목록으로 돌아가기
                </Link>

                <div className="flex items-center gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl font-bold text-zinc-400">
                            {profile.full_name?.charAt(0) || <User className="w-10 h-10" />}
                        </span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {profile.full_name || "이름 없음"}
                            <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                                ADMIN
                            </span>
                        </h1>
                        <div className="flex items-center gap-4 text-zinc-400">
                            <span className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" />
                                {profile.id} {/* Using ID as Email fallback representation based on list view */}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                가입일: {new Date(profile.created_at).toLocaleDateString("ko-KR")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Managed Clubs */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-500" />
                        소속 동호회
                        <span className="text-sm font-normal text-zinc-500 ml-auto">
                            총 {clubs.length}개
                        </span>
                    </h2>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden min-h-[200px]">
                        {clubs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500">
                                <Users className="w-8 h-8 mb-2 opacity-20" />
                                <p>소속된 동호회가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {clubs.map((club) => (
                                    <div key={club.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {club.logo_url ? (
                                                <img src={club.logo_url} alt={club.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-800" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-zinc-600" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-zinc-200">{club.name}</h3>
                                                <p className="text-xs text-zinc-500 line-clamp-1">{club.description || "설명 없음"}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${club.role === 'manage'
                                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                }`}>
                                                {club.role === 'manage' ? '운영진' : '멤버'}
                                            </span>
                                            <span className="text-[10px] text-zinc-600">
                                                Since {new Date(club.joined_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hosted Matches */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-green-500" />
                        생성한 경기
                        <span className="text-sm font-normal text-zinc-500 ml-auto">
                            총 {matches.length}개
                        </span>
                    </h2>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden min-h-[200px]">
                        {matches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500">
                                <Trophy className="w-8 h-8 mb-2 opacity-20" />
                                <p>생성한 경기가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {matches.map((match) => (
                                    <Link
                                        key={match.id}
                                        href={`/${locale}/admin/matches/${match.id}/edit`}
                                        className="block p-4 hover:bg-zinc-900/50 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-zinc-200 group-hover:text-blue-400 transition-colors flex items-center gap-1">
                                                {match.rink?.name_ko || "경기장 미정"}
                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${match.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    match.status === 'closed' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {match.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {new Date(match.start_time).toLocaleString("ko-KR", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
