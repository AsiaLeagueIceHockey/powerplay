"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side onboarding guard component.
 * Checks if logged-in user has completed onboarding and redirects if not.
 * This replaces the middleware DB query to improve initial page load time.
 */
export function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip check if already on excluded paths
    const isExcluded = 
      pathname.includes("/onboarding") || 
      pathname.includes("/auth") || 
      pathname.includes("/login") ||
      pathname.includes("/signup");

    if (isExcluded) {
      setChecked(true);
      return;
    }

    const checkOnboarding = async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        const locale = pathname.split("/")[1] || "ko";
        router.replace(`/${locale}/onboarding`);
      } else {
        setChecked(true);
      }
    };

    checkOnboarding();
  }, [pathname, router]);

  return null; // This component doesn't render anything
}
