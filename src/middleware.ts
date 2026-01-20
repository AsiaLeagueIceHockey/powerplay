import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { updateSession, checkAdminAccess } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // First, update Supabase session and get user data
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Check if the request is for an admin route (but not admin-apply)
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.includes("/admin") && !pathname.includes("/admin-apply");

  if (isAdminRoute) {
    // Reuse user and supabase from updateSession (no duplicate auth call!)
    const isAdmin = await checkAdminAccess(request, user, supabase);
    if (!isAdmin) {
      // Redirect non-admins to home page
      const locale = pathname.split("/")[1] || "ko";
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // GLOBAL ONBOARDING CHECK
  if (user) {
    // Exclude paths: onboarding, auth, logout, static files
    // already handled by matcher config mostly, but be specific about app routes
    const isExcluded = 
      pathname.includes("/onboarding") || 
      pathname.includes("/auth") || 
      pathname.includes("/login") ||
      pathname.includes("/signup");

    if (!isExcluded) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
        
      if (profile && !profile.onboarding_completed) {
        const locale = pathname.split("/")[1] || "ko";
        return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
      }
    }
  }

  // Then, handle internationalization
  const intlResponse = intlMiddleware(request);

  // Merge cookies from Supabase response into intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files
    // - Internal Next.js paths
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
