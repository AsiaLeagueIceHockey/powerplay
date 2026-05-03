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
      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 active:bg-zinc-100 dark:active:bg-zinc-800"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-base font-medium text-zinc-900 dark:text-white">
          {label}
        </span>
        {description ? (
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        ) : null}
      </span>
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
    </Link>
  );
}
