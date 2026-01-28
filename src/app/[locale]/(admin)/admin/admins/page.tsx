
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAdmins } from "@/app/actions/admin";
import Link from "next/link";
import { Shield, ChevronRight, User } from "lucide-react";

export default async function AdminListPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("admin");

    const admins = await getAdmins();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-8 h-8 text-amber-500" />
                        관리자 관리
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        등록된 관리자 계정 목록을 조회합니다.
                    </p>
                </div>
            </div>

            {/* Admin List */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th className="px-6 py-4 font-medium text-zinc-400">이름</th>
                                <th className="px-6 py-4 font-medium text-zinc-400">이메일</th>
                                <th className="px-6 py-4 font-medium text-zinc-400">가입일</th>
                                <th className="px-6 py-4 font-medium text-zinc-400 text-right">상세보기</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        관리자 계정이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr
                                        key={admin.id}
                                        className="group hover:bg-zinc-900/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                                    <span className="font-bold text-zinc-400 group-hover:text-zinc-200">
                                                        {admin.full_name?.charAt(0) || <User className="w-5 h-5" />}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-zinc-200 group-hover:text-white">
                                                    {admin.full_name || "이름 없음"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                                            {admin.id}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            {new Date(admin.created_at).toLocaleDateString("ko-KR")}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/${locale}/admin/admins/${admin.id}`}
                                                className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
