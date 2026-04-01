import { createClient } from "@/lib/supabase/server";
import { UserHeaderMenu } from "./user-header-menu";

export async function UserHeaderLoader({ locale }: { locale: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  let userPoints = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, points")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin" || profile?.role === "superuser";
    userPoints = profile?.points ?? 0;
  }

  return (
    <UserHeaderMenu 
      user={user} 
      locale={locale} 
      isAdmin={isAdmin} 
      points={userPoints} 
    />
  );
}
