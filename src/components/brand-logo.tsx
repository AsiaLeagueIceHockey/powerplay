export function BrandLogo({ locale }: { locale: string }) {
  return (
    <a
      href={`/${locale}`}
      className="flex items-center flex-shrink-0 transition-all hover:opacity-90 relative gap-1 sm:gap-2"
      style={{ marginTop: "5px" }}
    >
      <picture className="flex-shrink-0">
        <source media="(prefers-color-scheme: dark)" srcSet="/header-logo-dark.webp" type="image/webp" />
        <img src="/header-logo-light.webp" alt="PowerPlay Logo" width={146} height={50} className="h-10 w-auto rounded-sm object-contain" fetchPriority="high" />
      </picture>
    </a>
  );
}
