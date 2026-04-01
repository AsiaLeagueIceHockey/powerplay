"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLocale } from "next-intl";

interface CopyButtonProps {
  text: string;
  className?: string;
  showText?: boolean;
}

export function CopyButton({ text, className = "", showText = true }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-[10px] font-medium transition-colors ${
        copied 
          ? "text-green-500" 
          : "text-zinc-500 hover:text-zinc-300"
      } ${className}`}
      title={locale === "ko" ? "복사" : "Copy"}
    >
      {copied ? (
        <Check className="w-3 h-3" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {showText && (
        <span>{copied ? (locale === "ko" ? "완료" : "Done") : (locale === "ko" ? "복사" : "Copy")}</span>
      )}
    </button>
  );
}
