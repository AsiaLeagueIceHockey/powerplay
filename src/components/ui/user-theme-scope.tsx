"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** User routes also include onboarding/chat outside the public route group. */
export function UserThemeScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = pathname.split("/")[2];
  if (section === "admin" || section === "instagram") return children;
  const theme = section === "youth" ? "youth" : section === "lounge" || section === "lounge-membership" ? "lounge" : "powerplay";
  return <div className="pp-ui" data-ui-theme={theme}>{children}</div>;
}
