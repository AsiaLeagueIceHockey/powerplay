import { setRequestLocale } from "next-intl/server";
import { getAllUsers, checkIsSuperUser } from "@/app/actions/superuser";
import { getAdmins } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, User, Users } from "lucide-react";
import { UserManagementTab } from "@/components/user-management-tab";
import { CopyButton } from "@/components/copy-button";

export default async function AdminListPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { locale } = await params;
    const { tab } = await searchParams;
    setRequestLocale(locale);

    // Auth Check - SuperUser only
    const isSuperUser = await checkIsSuperUser();
    if (!isSuperUser) {
        redirect(`/${locale}/admin`);
    }

    const activeTab = tab === "users" ? "users" : "admins";

    // Parallel fetch based on active tab
    const [admins, allUsers] = await Promise.all([
        activeTab === "admins" ? getAdmins() : Promise.resolve([]),
        activeTab === "users" ? getAllUsers() : Promise.resolve([]),
    ]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-amber-500" />
                <div>
                    <h1 className="text-2xl font-bold text-white">유저 관리</h1>
                    <p className="text-zinc-400 text-sm mt-0.5">관리자 및 전체 유저 정보를 조회합니다.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
                <Link
                    href={`/${locale}/admin/admins?tab=admins`}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "admins"
                            ? "border-amber-500 text-amber-400"
                            : "border-transparent text-zinc-400 hover:text-zinc-300"
                    }`}
                >
                    🛡️ 관리자 관리
                </Link>
                <Link
                    href={`/${locale}/admin/admins?tab=users`}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "users"
                            ? "border-amber-500 text-amber-400"
                            : "border-transparent text-zinc-400 hover:text-zinc-300"
                    }`}
                >
                    👥 유저 관리
                </Link>
            </div>

            {/* Tab Content */}
            {activeTab === "admins" ? (
                /* ── 관리자 관리 탭 ── */
                <div className="space-y-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                        <th className="px-6 py-4 font-medium text-zinc-400">이름</th>
                                        <th className="px-6 py-4 font-medium text-zinc-400">이메일</th>
                                        <th className="px-6 py-4 font-medium text-zinc-400">전화번호</th>
                                        <th className="px-6 py-4 font-medium text-zinc-400">소속 동호회</th>
                                        <th className="px-6 py-4 font-medium text-zinc-400">가입일</th>
                                        <th className="px-6 py-4 font-medium text-zinc-400 text-right">상세보기</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {admins.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
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
                                                    {admin.email}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400 text-sm">
                                                    {admin.phone ? (
                                                        <div className="flex items-center gap-2">
                                                            <a href={`tel:${admin.phone}`} className="hover:text-blue-400 underline decoration-zinc-700 underline-offset-4 decoration-dashed transition-colors">
                                                                {admin.phone}
                                                            </a>
                                                            <CopyButton text={admin.phone} showText={false} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400 text-sm">
                                                    {/* @ts-ignore - Supabase type inference limitation */}
                                                    {admin.club_memberships?.length > 0 
                                                        // @ts-ignore
                                                        ? admin.club_memberships.map((m) => m.club?.name).join(", ") 
                                                        : "-"}
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
            ) : (
                /* ── 유저 관리 탭 ── */
                <UserManagementTab initialUsers={allUsers} />
            )}
        </div>
    );
}
