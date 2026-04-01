import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8241683fa1c4d86216f57b3215efdf50@o4510822759268352.ingest.us.sentry.io/4510822759923712",
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["error", "warn"] }),
  ],
});
