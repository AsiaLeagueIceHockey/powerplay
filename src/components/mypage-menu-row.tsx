import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface MypageMenuRowProps {
  href: string;
  icon: ReactNode;
  label: string;
  description?: string;
}

export function MypageMenuRow({ href, icon, label, description }: MypageMenuRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-pp-surface-muted active:bg-pp-surface-muted "
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-pp-info-soft text-pp-info-text ">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-base font-medium text-pp-text dark:text-white">
          {label}
        </span>
        {description ? (
          <span className="block truncate text-xs text-pp-muted ">
            {description}
          </span>
        ) : null}
      </span>
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-pp-muted " />
    </Link>
  );
}
