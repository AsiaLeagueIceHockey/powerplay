import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface MypageSubpageHeaderProps {
  locale: string;
  title: string;
  backLabel: string;
}

export function MypageSubpageHeader({ locale, title, backLabel }: MypageSubpageHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <Link
        href={`/${locale}/mypage`}
        aria-label={backLabel}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="truncate text-xl font-bold text-zinc-900 dark:text-white">
        {title}
      </h1>
    </div>
  );
}
