import { NextResponse } from "next/server";

import { checkHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkHealth();
  return createHealthResponse({
    database: result.database,
    durationMs: result.durationMs,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  });
}

export function createHealthResponse({ database, durationMs, timestamp, version }: {
  database: "ok" | "error"; durationMs: number; timestamp: string; version: string;
}) {
  const status = database === "ok" ? "ok" : "error";
  return NextResponse.json(
    { status, version, timestamp, checks: { app: "ok", database }, durationMs },
    { status: status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } }
  );
}
