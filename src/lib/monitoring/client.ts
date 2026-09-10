type ClientOperationalContext = {
  domain: "client" | "push-client";
  operation: "global-error" | "guide-subscribe" | "register" | "self-repair" | "subscribe";
};

let sentryPromise: Promise<typeof import("@sentry/nextjs") | null> | undefined;

/** Lazy fallback used only when Better Stack's browser tag is not configured. */
export async function captureClientOperationalError(
  error: unknown,
  context: ClientOperationalContext
) {
  if (!isEnabled() || typeof window === "undefined" || isBetterStackTagPresent()) return;

  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.withScope((scope) => {
    scope.setTag("domain", context.domain);
    scope.setTag("operation", context.operation);
    scope.setUser(null);
    Sentry.captureException(error instanceof Error ? error : new Error("Client operational failure"));
  });
}

function getSentry() {
  if (!sentryPromise) {
    sentryPromise = import("@sentry/nextjs")
      .then((Sentry) => {
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_BETTER_STACK_SENTRY_DSN,
          enabled: isEnabled(),
          environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
          release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
          sendDefaultPii: false,
          tracesSampleRate: 0.05,
        });
        return Sentry;
      })
      .catch(() => null);
  }
  return sentryPromise;
}

function isEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_BETTER_STACK_SENTRY_DSN) && (
    process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_MONITORING_ENABLED === "true"
  );
}

function isBetterStackTagPresent() {
  return typeof window !== "undefined" && typeof (window as Window & { betterstack?: unknown }).betterstack === "function";
}
