import { setRequestLocale } from "next-intl/server";
import { getMatches } from "@/app/actions/match";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const matches = await getMatches();
  const activeMatches = matches.filter((m) => m.status === "open").length;

  return (
    <div>
      <h1 className="text-3xl font-bold">대시보드</h1>
      <p className="mt-4 text-zinc-400">
        파워플레이 관리자 패널에 오신 것을 환영합니다.
      </p>

      {/* Stats Cards */}
      <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-6">
          <h3 className="text-sm font-medium text-zinc-400">전체 경기</h3>
          <p className="mt-2 text-3xl font-bold text-white">{matches.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-6">
          <h3 className="text-sm font-medium text-zinc-400">모집 중</h3>
          <p className="mt-2 text-3xl font-bold text-green-400">
            {activeMatches}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-6">
          <h3 className="text-sm font-medium text-zinc-400">준비 중</h3>
          <p className="mt-2 text-3xl font-bold text-zinc-500">-</p>
        </div>
      </div>
    </div>
  );
}
