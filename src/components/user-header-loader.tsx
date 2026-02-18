import { createClient } from "@/lib/supabase/server";
import { UserHeaderMenu } from "./user-header-menu";
import { getUnreadChatCount } from "@/app/actions/chat";

export async function UserHeaderLoader({ locale }: { locale: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  let userPoints = 0;
  let unreadChatCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, points")
      .eq("id", user.id)
      .single();
    
    isAdmin = profile?.role === "admin" || profile?.role === "superuser";
    // Force points to be a number, defaulting to 0 if null/undefined
    userPoints = profile?.points ?? 0;
    
    // Fetch unread chat count
    unreadChatCount = await getUnreadChatCount();
  }

  return (
    <UserHeaderMenu 
      user={user} 
      locale={locale} 
      isAdmin={isAdmin} 
      points={userPoints} 
      initialUnreadCount={unreadChatCount}
    />
  );
}
