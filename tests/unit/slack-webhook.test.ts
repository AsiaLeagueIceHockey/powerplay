import { afterEach, describe, expect, it, vi } from "vitest";
import { postSlackBlocks } from "../../scripts/lib/slack-webhook";

afterEach(() => vi.unstubAllGlobals());

describe("automation Slack delivery", () => {
  it("posts story blocks", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const blocks = [{ type: "section", text: { type: "plain_text", text: "October" } }];
    await postSlackBlocks("https://example.invalid/webhook", blocks);
    expect(fetchMock).toHaveBeenCalledWith("https://example.invalid/webhook", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ blocks }),
      signal: expect.any(AbortSignal),
    }));
  });

  it("fails the run on rejected delivery without leaking the response body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private response", { status: 429 })));
    await expect(postSlackBlocks("https://example.invalid/webhook", [])).rejects.toThrow("Slack delivery failed (HTTP 429)");
  });

  it("propagates network errors so CI cannot send a success heartbeat", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    await expect(postSlackBlocks("https://example.invalid/webhook", [])).rejects.toThrow("network unavailable");
  });
});
