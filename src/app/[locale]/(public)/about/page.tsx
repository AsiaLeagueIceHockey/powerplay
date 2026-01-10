import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isKo = locale === "ko";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">
          {isKo ? "🏒 Power Play" : "🏒 Power Play"}
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          {isKo 
            ? "아이스하키 동호회 경기 운영 & 용병 매칭 플랫폼"
            : "Ice Hockey Club Match Management & Mercenary Matching Platform"}
        </p>
      </section>

      {/* Problem Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isKo ? "🚩 이런 문제를 해결합니다" : "🚩 Problems We Solve"}
        </h2>
        
        <div className="grid gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">
              {isKo ? "❌ 비효율적인 운영" : "❌ Inefficient Management"}
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              {isKo 
                ? "수기 명단 관리, 반복되는 공지 복사/붙여넣기, 입금 내역 수동 대조"
                : "Manual roster management, repetitive copy-pasting, manual payment tracking"}
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">
              {isKo ? "❌ 정보의 폐쇄성" : "❌ Closed Information"}
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              {isKo 
                ? "카톡 대화에 묻혀 경기 정보(시간/장소) 확인이 어려움"
                : "Match info (time/location) buried in chat messages"}
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">
              {isKo ? "❌ 언어 장벽" : "❌ Language Barrier"}
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              {isKo 
                ? "한국어 공지를 이해하지 못하는 외국인 용병/멤버"
                : "Foreign players who can't understand Korean announcements"}
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isKo ? "💡 Power Play의 해결책" : "💡 Power Play Solution"}
        </h2>
        
        <div className="grid gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
            <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">
              {isKo ? "✅ 링크 하나로 모든 운영" : "✅ One Link for Everything"}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              {isKo 
                ? "경기 생성 → 신청 → 입금 확인 → 팀 밸런싱까지"
                : "From match creation to registration, payments, and team balancing"}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
            <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">
              {isKo ? "✅ 다국어 지원 (KR/EN)" : "✅ Multilingual (KR/EN)"}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              {isKo 
                ? "외국인 멤버도 쉽게 참가할 수 있는 영어 인터페이스"
                : "English interface for easy participation by foreign members"}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
            <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">
              {isKo ? "✅ 카카오톡 최적화 공유" : "✅ KakaoTalk Optimized Sharing"}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              {isKo 
                ? "복사/붙여넣기 없이 깔끔한 공지 생성 및 공유"
                : "Clean announcements without copy/paste hassle"}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isKo ? "⚡ 주요 기능" : "⚡ Key Features"}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <span className="text-2xl">🏒</span>
            <h3 className="font-bold mt-2 mb-1">{isKo ? "경기 관리" : "Match Management"}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isKo ? "경기 생성, 참가 신청, 상태 관리" : "Create matches, register, manage status"}
            </p>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <span className="text-2xl">👥</span>
            <h3 className="font-bold mt-2 mb-1">{isKo ? "포지션별 신청" : "Position-based Registration"}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isKo ? "FW/DF/G 포지션별 인원 관리" : "Manage players by FW/DF/G positions"}
            </p>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <span className="text-2xl">💰</span>
            <h3 className="font-bold mt-2 mb-1">{isKo ? "입금 관리" : "Payment Tracking"}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isKo ? "참가비 입금 상태 실시간 확인" : "Real-time payment status tracking"}
            </p>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <span className="text-2xl">📱</span>
            <h3 className="font-bold mt-2 mb-1">{isKo ? "스마트 공유" : "Smart Sharing"}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isKo ? "카카오톡/글로벌 공유 버튼" : "KakaoTalk/Global share buttons"}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <Link
          href={`/${locale}`}
          className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition"
        >
          {isKo ? "지금 바로 시작하기 →" : "Get Started Now →"}
        </Link>
      </section>
    </div>
  );
}
