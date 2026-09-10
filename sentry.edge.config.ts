import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.BETTER_STACK_SENTRY_DSN,
  enabled: Boolean(process.env.BETTER_STACK_SENTRY_DSN) && (
    process.env.NODE_ENV === "production" || process.env.MONITORING_ENABLED === "true"
  ),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  sendDefaultPii: false,
  tracesSampleRate: 0.05,
  debug: false,
});
