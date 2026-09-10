"use client";

import Script from "next/script";

const token = process.env.NEXT_PUBLIC_BETTER_STACK_RUM_TOKEN;
const environment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV;
const release = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

export function MonitoringRuntime() {
  if (!token) return null;

  const snippet = `!function(b,e,t,r){b[t]=b[t]||function(...a){(b[t].q=b[t].q||[]).push(a)},b[t].l=+new Date;var s=e.createElement('script');s.async=1;s.crossOrigin='anonymous';s.src='https://betterstack.net/b.js?t='+r;(e.head||e.getElementsByTagName('head')[0]).appendChild(s)}(window,document,'betterstack','${token}');betterstack('init',{environment:'${environment}',release:'${release ?? ""}'});`;

  return <Script id="better-stack-runtime" strategy="lazyOnload">{snippet}</Script>;
}
