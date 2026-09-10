import * as Sentry from "@sentry/nextjs";

type OperationalExtra = Partial<
  Record<"attempt" | "matchCount" | "resultCount" | "subscriptionCount", boolean | number | string>
>;

type OperationalErrorContext = {
  domain: "cron" | "match" | "points" | "public-data" | "push";
  operation: string;
  tags?: Record<string, boolean | number | string>;
  extra?: OperationalExtra;
};

/** Records only explicitly whitelisted operational context. */
export function captureOperationalError(
  error: unknown,
  { domain, operation, tags, extra }: OperationalErrorContext
) {
  if (!isMonitoringEnabled()) return;

  Sentry.withScope((scope) => {
    scope.setTag("domain", domain);
    scope.setTag("operation", operation);

    for (const [key, value] of Object.entries(tags ?? {})) {
      scope.setTag(key, String(value));
    }

    if (extra) scope.setExtras(extra);
    Sentry.captureException(normalizeError(error));
  });
}

function isMonitoringEnabled() {
  return Boolean(process.env.BETTER_STACK_SENTRY_DSN) && (
    process.env.NODE_ENV === "production" || process.env.MONITORING_ENABLED === "true"
  );
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error("Operational failure", { cause: error });
}
