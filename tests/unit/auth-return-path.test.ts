import { describe, expect, it } from "vitest";

import { sanitizeAuthReturnPath } from "@/lib/auth-return-path";

describe("sanitizeAuthReturnPath", () => {
  it.each([
    ["/ko/lounge/hockey-shop", "ko"],
    ["/en/lounge/rink_1", "ko"],
    ["/ko/lounge/한글-상점", "en"],
  ])("accepts one canonical localized Lounge slug", (path, locale) => {
    expect(sanitizeAuthReturnPath(path, locale)).toBe(path);
  });

  it.each([
    null,
    "",
    "/ko",
    "/ko/lounge",
    "/ko/lounge/a/extra",
    "/fr/lounge/a",
    "/ko/mypage",
    "https://evil.example/ko/lounge/a",
    "//evil.example/ko/lounge/a",
    "/ko/lounge/a?x=1",
    "/ko/lounge/a#x",
    "/ko/lounge/a%2Fextra",
    "/ko/lounge/%61",
    "/ko/lounge/a\\evil",
    "/ko/lounge/a\n",
    "/ko/lounge/-a",
    "/ko/lounge/a-",
  ])("rejects unsafe or non-canonical value %j", (path) => {
    expect(sanitizeAuthReturnPath(path, "en")).toBe("/en");
  });

  it("falls back to Korean for an unsupported current locale", () => {
    expect(sanitizeAuthReturnPath("/account", "fr")).toBe("/ko");
  });
});
