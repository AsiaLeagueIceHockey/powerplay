"use client";
import { buttonStyles } from "@/components/ui/styles";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function AuthButtons() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-lg bg-pp-surface-muted " />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/mypage"
          className="text-sm font-medium text-pp-muted hover:text-pp-text dark:hover:text-white"
        >
          {user.email?.split("@")[0]}
        </Link>
        <button type="button"
          onClick={handleSignOut}
          className={buttonStyles({ variant: "secondary", size: "compact" })}
        >
          {t("logout")}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className={buttonStyles({ variant: "primary", size: "compact" })}
    >
      {t("login")}
    </Link>
  );
}
