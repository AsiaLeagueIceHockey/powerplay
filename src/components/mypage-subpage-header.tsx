
import { iconButtonStyles } from "@/components/ui/styles";
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
        className={`${iconButtonStyles({ variant: "secondary", size: "compact", shape: "circle" })} flex-shrink-0`}
      >
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="truncate text-xl font-bold text-pp-text dark:text-white">
        {title}
      </h1>
    </div>
  );
}
