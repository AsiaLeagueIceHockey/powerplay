"use client";
import { buttonStyles, fieldStyles, surfaceStyles } from "@/components/ui/styles";

import { Suspense, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { signInWithGoogle, signInWithKakao } from "@/app/actions/auth";

function LoginContent() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const oauthError = searchParams.get("error") === "oauth" ? t("oauthFailed") : null;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<"google" | "kakao" | null>(null);

  async function handleGoogleSignIn() {
    setIsLoading("google");
    setError(null);

    const result = await signInWithGoogle(next, locale);

    if (result?.error) {
      setError(result.error);
      setIsLoading(null);
    }
  }

  async function handleKakaoSignIn() {
    setIsLoading("kakao");
    setError(null);

    const result = await signInWithKakao(next, locale);

    if (result?.error) {
      setError(result.error);
      setIsLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className={surfaceStyles({ density: "roomy" })}>
        <h1 className="mb-6 text-center text-2xl font-bold">{t("login")}</h1>

        {(error || oauthError) && (
          <div className="mb-4 rounded-lg bg-pp-danger-soft p-4 text-sm text-pp-danger-text ">
            {error || oauthError}
          </div>
        )}

        <div className="space-y-3">
          {/* Google Login Button */}
          <button type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading !== null}
            className={`${buttonStyles({ variant: "secondary", size: "default" })} w-full`}
          >
            {/* Google Logo SVG */}
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading === "google" ? t("loading") : t("signInWithGoogle")}
          </button>

          {/* Kakao Login Button */}
          <button type="button"
            onClick={handleKakaoSignIn}
            disabled={isLoading !== null}
            className={`${buttonStyles({ variant: "kakao", size: "large" })} w-full`}
          >
            {/* Kakao Logo SVG */}
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#000000"
                d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"
              />
            </svg>
            {isLoading === "kakao" ? t("loading") : t("signInWithKakao")}
          </button>
        </div>

          {/* Email/Password Login (Dev Only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 border-t border-pp-border pt-6 ">
              <div className="mb-4 text-center text-xs font-semibold uppercase text-pp-muted">
                Development Only
              </div>
              <form action={async (formData) => {
                const result = await import("@/app/actions/auth").then(m => m.signIn(formData));
                if (result?.error) setError(result.error);
              }} className="space-y-3">
                <input
                  type="email"
                  name="email"
                  aria-label="Email"
                  placeholder="Email"
                  required
                  className={`${fieldStyles()} w-full`}
                />
                <input
                  type="password"
                  name="password"
                  aria-label="Password"
                  placeholder="Password"
                  required
                  className={`${fieldStyles()} w-full`}
                />
                <button
                  type="submit"
                  className={`${buttonStyles({ variant: "secondary", size: "compact" })} w-full`}
                >
                  Sign in with Email
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-72 max-w-md" aria-hidden="true" />}>
      <LoginContent />
    </Suspense>
  );
}
