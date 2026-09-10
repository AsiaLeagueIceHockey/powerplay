"use client";

import { useEffect } from "react";

import { captureClientOperationalError } from "@/lib/monitoring/client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void captureClientOperationalError(error, { domain: "client", operation: "global-error" });
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-bold">문제가 발생했습니다.</h1>
          <p className="mt-2 text-sm text-zinc-600">잠시 후 다시 시도해주세요.</p>
          <button type="button" onClick={reset} className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">다시 시도</button>
        </main>
      </body>
    </html>
  );
}
