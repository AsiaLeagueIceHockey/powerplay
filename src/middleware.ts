import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { updateSession, checkAdminAccess } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const BOT_UA_PATTERN =
  /Yeti|Googlebot|bingbot|Baiduspider|DuckDuckBot|Slurp|facebookexternalhit|Twitterbot|LinkedInBot|NaverBot|AdsBot|Mediapartners/i;

const BOT_INDEXABLE_TOP_LEVEL = new Set([
  "",
  "/clubs",
  "/rinks",
  "/find-club",
  "/lounge",
]);

function isBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";
  return BOT_UA_PATTERN.test(ua);
}

function resolveBotRewritePath(pathname: string): string | null {
  const match = pathname.match(/^\/(ko|en)(\/.*)?$/);
  if (!match) return null;
  const locale = match[1];
  const rest = (match[2] ?? "").replace(/\/$/, "");

  if (BOT_INDEXABLE_TOP_LEVEL.has(rest)) {
    return `/seo-bot/${locale}${rest}`;
  }

  if (rest.startsWith("/lounge/")) {
    return `/seo-bot/${locale}${rest}`;
  }

  return null;
}

function applyBotResponseHeaders(response: NextResponse): NextResponse {
  const cookieNames = response.cookies.getAll().map((c) => c.name);
  cookieNames.forEach((name) => response.cookies.delete(name));
  response.headers.delete("set-cookie");
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=600, stale-while-revalidate=86400"
  );
  response.headers.set("X-Robots-Tag", "index, follow");
  return response;
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

  // For search engine bots: serve a fully static SEO-friendly response.
  // Naver Yeti and other crawlers reject `Cache-Control: private, no-store`
  // pages as non-indexable. The dynamic public layout cannot avoid that
  // header (UserHeaderLoader reads cookies → forces dynamic rendering),
  // so we rewrite indexable paths to `/seo-bot/[locale]/...` which has its
  // own cookies-free layout and renders fully static (revalidate ISR).
  if (isBot(request)) {
    const rewritePath = resolveBotRewritePath(request.nextUrl.pathname);

    if (rewritePath) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = rewritePath;
      const botResponse = NextResponse.rewrite(rewriteUrl);
      return applyBotResponseHeaders(botResponse);
    }

    // Non-indexable bot requests: keep prior behavior (skip Supabase session,
    // strip cookies, force public cache headers).
    const fallback = intlMiddleware(request);
    return applyBotResponseHeaders(fallback);
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
