import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { updateSession, checkAdminAccess } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // First, update Supabase session
  const supabaseResponse = await updateSession(request);

  // Check if the request is for an admin route
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.includes("/admin");

  if (isAdminRoute) {
    const isAdmin = await checkAdminAccess(request);
    if (!isAdmin) {
      // Redirect non-admins to home page
      const locale = pathname.split("/")[1] || "ko";
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
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
