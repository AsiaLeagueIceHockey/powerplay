export type LinkifiedTextSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

const HTTP_URL_PATTERN = /https?:\/\/[^\s<>"']+/giu;
const TRAILING_PUNCTUATION_PATTERN = /[.,!?;:)\]}>，。！？；：]+$/u;

export function linkifyText(text: string): LinkifiedTextSegment[] {
  const segments: LinkifiedTextSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(HTTP_URL_PATTERN)) {
    const start = match.index;
    const rawUrl = match[0];

    if (start > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, start) });
    }

    const trailingPunctuation = rawUrl.match(TRAILING_PUNCTUATION_PATTERN)?.[0] ?? "";
    const url = trailingPunctuation
      ? rawUrl.slice(0, -trailingPunctuation.length)
      : rawUrl;

    segments.push({ type: "link", value: url, href: url });

    if (trailingPunctuation) {
      segments.push({ type: "text", value: trailingPunctuation });
    }

    cursor = start + rawUrl.length;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}
