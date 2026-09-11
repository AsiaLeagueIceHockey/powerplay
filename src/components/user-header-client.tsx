"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { UserHeaderMenu } from "@/components/user-header-menu";
import { UserHeaderSkeleton } from "@/components/skeletons";

type HeaderProfile = { role: string | null; points: number | null };

export function UserHeaderClient({ locale }: { locale: string }) {
  const [state, setState] = useState<{ ready: boolean; user: User | null; profile: HeaderProfile | null }>({
    ready: false,
    user: null,
    profile: null,
  });

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load(user: User | null) {
      if (!user) {
        if (active) setState({ ready: true, user: null, profile: null });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role, points")
        .eq("id", user.id)
        .maybeSingle();

      if (active) setState({ ready: true, user, profile: data as HeaderProfile | null });
    }

    void supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!state.ready) return <UserHeaderSkeleton />;

  return (
    <UserHeaderMenu
      user={state.user}
      locale={locale}
      isAdmin={state.profile?.role === "admin" || state.profile?.role === "superuser"}
      points={state.profile?.points ?? 0}
    />
  );
}
