import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeAuthReturnPath } from "@/lib/auth-return-path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { searchParams, origin } = new URL(request.url);
  const { locale } = await params;
  const code = searchParams.get("code");
  const next = sanitizeAuthReturnPath(searchParams.get("next"), locale);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const errorLocale = locale === "en" ? "en" : "ko";
  return NextResponse.redirect(`${origin}/${errorLocale}/login?error=oauth`);
}
