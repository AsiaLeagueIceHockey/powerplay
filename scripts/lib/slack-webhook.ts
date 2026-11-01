/** Delivery errors must fail CI, rather than producing a misleading success heartbeat. */
export async function postSlackBlocks(webhookUrl: string, blocks: unknown[]): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    // Do not log the webhook URL or third-party response bodies containing secrets.
    throw new Error(`Slack delivery failed (HTTP ${response.status})`);
  }
  console.log("Slack notification sent.");
}
