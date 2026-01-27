"use server";

import { createClient } from "@/lib/supabase/server";

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // superuser는 admin의 상위 개념으로 admin 권한을 포함
  return profile?.role === "admin" || profile?.role === "superuser";
}
