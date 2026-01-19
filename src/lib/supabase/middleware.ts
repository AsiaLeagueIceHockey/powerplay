import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Refreshes the user's session if expired
  // Also returns the user data for reuse
  const { data: { user } } = await supabase.auth.getUser();

  return { supabaseResponse, user, supabase };
}

export async function checkAdminAccess(
  request: NextRequest,
  cachedUser?: { id: string } | null,
  cachedSupabase?: ReturnType<typeof createServerClient>
): Promise<boolean> {
  // Reuse cached user if available (from updateSession)
  if (cachedUser === null) {
    return false;
  }

  // If we have cached user, use it
  if (cachedUser && cachedSupabase) {
    const { data: profile } = await cachedSupabase
      .from("profiles")
      .select("role")
      .eq("id", cachedUser.id)
      .single();

    return profile?.role === "admin" || profile?.role === "superuser";
  }

  // Fallback: Create new Supabase client (shouldn't happen normally)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

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

  return profile?.role === "admin" || profile?.role === "superuser";
}
