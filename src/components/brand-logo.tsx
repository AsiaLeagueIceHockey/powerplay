"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export function BrandLogo({ locale }: { locale: string }) {
  const pathname = usePathname();
  const isYouth = pathname.includes(`/${locale}/youth`) || pathname.endsWith(`/youth`);

  return (
    <a
      href={isYouth ? `/${locale}/youth` : `/${locale}`}
      className="flex items-center flex-shrink-0 transition-all hover:opacity-90 relative gap-1 sm:gap-2"
      style={{ marginTop: "5px" }}
    >
      <div className="relative flex-shrink-0">
        {/* Light Mode Logo */}
        <Image
          src="/long-logo.jpg"
          alt="PowerPlay Logo"
          width={110}
          height={38}
          className="h-7 sm:h-9 w-auto object-contain rounded-sm dark:hidden"
          priority
        />
        {/* Dark Mode Logo */}
        <Image
          src="/long-logo-darkmode.png"
          alt="PowerPlay Logo"
          width={110}
          height={38}
          className="hidden h-7 sm:h-9 w-auto object-contain rounded-sm dark:block"
          priority
        />
      </div>
    </a>
  );
}
