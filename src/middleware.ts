import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { updateSession, checkAdminAccess } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const BOT_UA_PATTERN =
  /Yeti|Googlebot|bingbot|Baiduspider|DuckDuckBot|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|NaverBot|AdsBot|Mediapartners/i;

function isBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";
  return BOT_UA_PATTERN.test(ua);
}

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204 });
  }

  if (request.nextUrl.pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/ko";
    return NextResponse.redirect(redirectUrl, 301);
  }

  // For search engine bots: skip Supabase session entirely to avoid
  // unnecessary latency and potential errors that cause "수집제한"
  if (isBot(request)) {
    return intlMiddleware(request);
  }

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
    // - Static files (images, fonts, etc.)
    // - Internal Next.js paths
    // - PWA files (manifest, favicon, sw.js, workbox flow etc.)
    // - SEO files (sitemap.xml, naver-sitemap.xml, robots.txt)
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|sitemap\\.xml|naver-sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
