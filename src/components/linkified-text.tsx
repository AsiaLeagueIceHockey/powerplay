import { Fragment } from "react";

import { linkifyText } from "@/lib/linkify-text";

export function LinkifiedText({ text }: { text: string }) {
  return (
    <>
      {linkifyText(text).map((segment, index) =>
        segment.type === "link" ? (
          <a
            key={`${segment.href}-${index}`}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-semibold text-pp-accent-text underline decoration-blue-400/60 underline-offset-2 transition-colors hover:text-pp-accent-text "
          >
            {segment.value}
          </a>
        ) : (
          <Fragment key={index}>{segment.value}</Fragment>
        )
      )}
    </>
  );
}
