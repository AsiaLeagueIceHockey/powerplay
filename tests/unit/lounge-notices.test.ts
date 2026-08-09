import { describe, expect, it, vi } from "vitest";

import {
  fanOutLoungeNotice,
  isValidRequestId,
  validateLoungeNoticeInput,
} from "@/lib/lounge-notices";

describe("Lounge notice helpers", () => {
  it("trims valid input and rejects empty or oversized values", () => {
    expect(validateLoungeNoticeInput("  Title  ", "  Body  ")).toEqual({
      ok: true,
      title: "Title",
      body: "Body",
    });
    expect(validateLoungeNoticeInput(" ", "body").ok).toBe(false);
    expect(validateLoungeNoticeInput("title", " ").ok).toBe(false);
    expect(validateLoungeNoticeInput("x".repeat(121), "body").ok).toBe(false);
    expect(validateLoungeNoticeInput("title", "x".repeat(10_001)).ok).toBe(false);
  });

  it("validates UUID request IDs", () => {
    expect(isValidRequestId("018f4f3c-1f6a-7abc-8def-1234567890ab")).toBe(true);
    expect(isValidRequestId("not-a-uuid")).toBe(false);
  });

  it("deduplicates, excludes the publisher, and classifies delivery outcomes", async () => {
    const send = vi.fn(async (userId: string) => {
      if (userId === "none") return { success: false, error: "No subscriptions" };
      if (userId === "handled") return { success: false, error: "VAPID not configured" };
      if (userId === "throws") throw new Error("network");
      return { success: true, sent: 2 };
    });

    const summary = await fanOutLoungeNotice(
      ["publisher", "ok", "ok", "none", "handled", "throws"],
      "publisher",
      send,
      (() => {
        let time = 10;
        return () => (time += 5);
      })()
    );

    expect(send).toHaveBeenCalledTimes(4);
    expect(summary).toEqual({
      intendedUsers: 4,
      successfulUsers: 1,
      devicesSent: 2,
      noSubscription: 1,
      rejected: 1,
      handledFailures: 1,
      elapsedMs: 5,
    });
  });

  it("runs sequential batches with no more than 25 concurrent sends and no retries", async () => {
    let active = 0;
    let maxActive = 0;
    const calls = new Map<string, number>();
    const releases: Array<() => void> = [];
    const send = vi.fn(async (userId: string) => {
      calls.set(userId, (calls.get(userId) ?? 0) + 1);
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise<void>((resolve) => releases.push(resolve));
      active -= 1;
      return { success: true, sent: 1 };
    });
    const ids = Array.from({ length: 51 }, (_, index) => `user-${index}`);

    const pending = fanOutLoungeNotice(ids, "publisher", send);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(25));
    releases.splice(0).forEach((release) => release());
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(50));
    releases.splice(0).forEach((release) => release());
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(51));
    releases.splice(0).forEach((release) => release());
    await pending;

    expect(maxActive).toBeLessThanOrEqual(25);
    expect(send).toHaveBeenCalledTimes(51);
    expect([...calls.values()].every((count) => count === 1)).toBe(true);
  });
});
