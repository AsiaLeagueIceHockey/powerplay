import { createClient } from "@supabase/supabase-js";

export type HealthCheckResult = { database: "ok" | "error"; durationMs: number };

type HealthDependencies = { now?: () => number; queryDatabase?: () => Promise<unknown> };

export async function checkHealth({ now = Date.now, queryDatabase }: HealthDependencies = {}): Promise<HealthCheckResult> {
  const startedAt = now();
  try {
    await withTimeout(queryDatabase ?? queryPublicRink, 2_000);
    return { database: "ok", durationMs: now() - startedAt };
  } catch {
    return { database: "error", durationMs: now() - startedAt };
  }
}

async function queryPublicRink() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Health check database client is not configured");

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await supabase.from("rinks").select("id").limit(1);
  if (error) throw new Error("Health check database query failed");
}

async function withTimeout<T>(operation: () => Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => { timeoutId = setTimeout(() => reject(new Error("Health check timed out")), timeoutMs); }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
