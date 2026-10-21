import type { ReactNode } from "react";

/** Deliberately outside the locale/auth/onboarding shell. Fixtures never call business providers. */
export default function DesignSystemLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
