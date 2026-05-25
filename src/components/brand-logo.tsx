"use client";

import Image from "next/image";

export function BrandLogo({ locale }: { locale: string }) {
  return (
    <a
      href={`/${locale}`}
      className="flex items-center flex-shrink-0 transition-all hover:opacity-90 relative gap-1 sm:gap-2"
      style={{ marginTop: "5px" }}
    >
      <div className="relative flex-shrink-0">
        {/* Light Mode Logo */}
        <Image
          src="/long-logo.jpg"
          alt="PowerPlay Logo"
          width={146}
          height={50}
          className="h-10 w-auto object-contain rounded-sm dark:hidden"
          priority
        />
        {/* Dark Mode Logo */}
        <Image
          src="/long-logo-darkmode.png"
          alt="PowerPlay Logo"
          width={146}
          height={50}
          className="hidden h-10 w-auto object-contain rounded-sm dark:block"
          priority
        />
      </div>
    </a>
  );
}
