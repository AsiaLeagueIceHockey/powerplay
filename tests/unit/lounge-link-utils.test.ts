import { describe, expect, it } from "vitest";
import { sanitizeLoungeActionUrl, sanitizeLoungeExternalUrl } from "@/lib/lounge-link-utils";

describe("lounge-link-utils", () => {
  describe("sanitizeLoungeExternalUrl", () => {
    it("normalizes an Instagram handle into a desktop-safe profile URL", () => {
      expect(sanitizeLoungeExternalUrl("@powerplay.kr", "instagram")).toEqual({
        value: "https://www.instagram.com/powerplay.kr/",
      });
    });

    it("accepts an Instagram URL without a protocol", () => {
      expect(sanitizeLoungeExternalUrl("instagram.com/powerplay.kr", "instagram")).toEqual({
        value: "https://www.instagram.com/powerplay.kr/",
      });
    });

    it("converts mobile Instagram share URLs to a canonical profile URL", () => {
      expect(
        sanitizeLoungeExternalUrl("https://www.instagram.com/_u/powerplay.kr?igsh=abc123", "instagram")
      ).toEqual({
        value: "https://www.instagram.com/powerplay.kr/",
      });
    });

    it("rejects invalid Instagram hosts", () => {
      expect(sanitizeLoungeExternalUrl("https://example.com/powerplay", "instagram")).toEqual({
        value: null,
        error: "Instagram URL must use instagram.com",
      });
    });
  });

  describe("sanitizeLoungeActionUrl", () => {
    it("passes through telephone links", () => {
      expect(sanitizeLoungeActionUrl("phone", "tel:010-1234-5678")).toBe("tel:010-1234-5678");
    });

    it("returns a canonical Instagram URL for CTA clicks", () => {
      expect(sanitizeLoungeActionUrl("instagram", "@powerplay.kr")).toBe(
        "https://www.instagram.com/powerplay.kr/"
      );
    });
  });
});
