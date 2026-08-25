import { describe, expect, it } from "vitest";

import { linkifyText } from "@/lib/linkify-text";

describe("linkifyText", () => {
  it("turns multiple HTTP URLs into link segments without losing line breaks", () => {
    const text = "네이버\nhttps://naver.me/x4GYBT1J\n쇼핑몰\nhttps://mrbighockey.com/";

    expect(linkifyText(text)).toEqual([
      { type: "text", value: "네이버\n" },
      { type: "link", value: "https://naver.me/x4GYBT1J", href: "https://naver.me/x4GYBT1J" },
      { type: "text", value: "\n쇼핑몰\n" },
      { type: "link", value: "https://mrbighockey.com/", href: "https://mrbighockey.com/" },
    ]);
  });

  it("keeps sentence punctuation outside the link", () => {
    expect(linkifyText("확인: https://example.com/path). 다음 안내" )).toEqual([
      { type: "text", value: "확인: " },
      { type: "link", value: "https://example.com/path", href: "https://example.com/path" },
      { type: "text", value: ")." },
      { type: "text", value: " 다음 안내" },
    ]);
  });

  it("does not create links for non-HTTP schemes", () => {
    const text = "javascript:alert(1) mailto:test@example.com";

    expect(linkifyText(text)).toEqual([{ type: "text", value: text }]);
  });
});
