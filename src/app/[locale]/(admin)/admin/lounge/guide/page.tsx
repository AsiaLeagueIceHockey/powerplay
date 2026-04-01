import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

export default async function LoungeGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <Link
          href={`/${locale}/admin/lounge`}
          className="inline-flex rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
        >
          {locale === "ko" ? "라운지로 돌아가기" : "Back to Lounge"}
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100">
          {locale === "ko" ? "라운지 OPEN 안내" : "Lounge open guide"}
        </h1>
        <p className="text-sm leading-7 text-zinc-400">
          {locale === "ko"
            ? "파워플레이가 왜 라운지를 만들었고, 어떤 방식으로 운영할 예정인지 안내드립니다."
            : "Learn why PowerPlay launched Lounge and how the premium area will operate."}
        </p>
      </div>

      <article className="rounded-3xl border border-zinc-700 bg-zinc-800 p-6 shadow-sm">
        <div className="space-y-5 text-sm leading-7 text-zinc-300">
          <p>안녕하세요, 파워플레이입니다!!</p>
          <p>
            파워플레이는 동호인의 편의를 위해 만든 플랫폼이여서 동호인분들께는 모든 기능을 무료로 제공해드리고 있고,
            동호인뿐 아니라 모든 하키인들의 다양한 교류와 쉬운 사용을 통해 더 많은 참여를 돕고 정보 공유를 빠르게 할 수 있도록 플랫폼을 만들어 운영해오고 있습니다.
          </p>
          <p>
            최근 사업자분들께서 홍보 관련 문의를 많이 주셔서 효과적이게 홍보를 할수있도록 홍보 라운지를 새롭게 오픈하게 되었습니다.
          </p>
          <p>
            홍보 라운지는 사업자분들뿐아니라 그룹레슨하는 감독님들 유소년 클럽 회원모집 등 집중적으로 노출할 수 있는 전용 홍보 공간입니다.
          </p>
          <p>
            유소년 클럽, 회원 모집, 레슨, 지상훈련장, 대회, 이벤트 안내, 상품 및 서비스 홍보 등 다양하게 노출할 수 있는 전용 공간으로
          </p>
          <p>홍보 라운지 입점 시 아래와 같이 유료로 운영될 예정입니다.</p>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="font-semibold text-zinc-100">최초 등록: 200,000원 (첫 달)</p>
            <p className="mt-1 font-semibold text-zinc-100">월 구독료: 100,000원 (둘째 달부터)</p>
          </div>
          <p>
            해당 공간을 통해 보다 많은 하키인들에게 효과적으로 홍보하실 수 있도록 지속적으로 기능과 노출을 강화해 나갈 예정입니다.
          </p>
          <p>
            이용을 원하거나 궁금한 점이 있으면 언제든 편하게 문의 바랍니다.
          </p>
          <p>감사합니다 🙏</p>
        </div>
      </article>
    </div>
  );
}
