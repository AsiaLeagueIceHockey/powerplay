"use client";

import { buttonStyles } from "@/components/ui/styles";

import { useState } from "react";
import { useLocale } from "next-intl";

interface SmartShareProps {
  rinkNameKo: string;
  rinkNameEn: string;
  date: string;
  time: string;
  fee: number;
  matchUrl: string;
  fwCount: number;
  dfCount: number;
  gCount: number;
  maxFw: number;
  maxDf: number;
  maxG: number;
}

export function SmartShare({
  rinkNameKo,
  rinkNameEn,
  date,
  time,
  fee,
  matchUrl,
  fwCount,
  dfCount,
  gCount,
  maxFw,
  maxDf,
  maxG,
}: SmartShareProps) {
  const locale = useLocale();
  const [copied, setCopied] = useState<"kakao" | "global" | null>(null);

  const generateKakaoText = () => {
    return `🏒 아이스하키 경기 안내

📍 ${rinkNameKo}
📅 ${date}
⏰ ${time}
💰 ${fee.toLocaleString()}원

👥 현재 인원
• FW: ${fwCount}/${maxFw}
• DF: ${dfCount}/${maxDf}
• G: ${gCount}/${maxG}

🔗 신청하기
${matchUrl}`;
  };

  const generateGlobalText = () => {
    return `🏒 Ice Hockey Match / 아이스하키 경기

📍 ${rinkNameEn} / ${rinkNameKo}
📅 ${date}
⏰ ${time}
💰 ₩${fee.toLocaleString()}

👥 Current Roster / 현재 인원
• FW: ${fwCount}/${maxFw}
• DF: ${dfCount}/${maxDf}
• G: ${gCount}/${maxG}

🔗 Join / 신청하기
${matchUrl}`;
  };

  const copyToClipboard = async (type: "kakao" | "global") => {
    const text = type === "kakao" ? generateKakaoText() : generateGlobalText();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button"
        onClick={() => copyToClipboard("kakao")}
        className={`${buttonStyles({ variant: copied === "kakao" ? "success" : "kakao", size: "default" })} flex items-center gap-2 `}
      >
        {copied === "kakao" ? (
          <>✓ {locale === "ko" ? "복사됨!" : "Copied!"}</>
        ) : (
          <>📋 {locale === "ko" ? "카카오용 복사" : "Copy for Kakao"}</>
        )}
      </button>

      <button type="button"
        onClick={() => copyToClipboard("global")}
        className={`${buttonStyles({ variant: copied === "global" ? "success" : "primary", size: "default" })} flex items-center gap-2 `}
      >
        {copied === "global" ? (
          <>✓ {locale === "ko" ? "복사됨!" : "Copied!"}</>
        ) : (
          <>🌐 {locale === "ko" ? "글로벌용 복사" : "Copy for Global"}</>
        )}
      </button>
    </div>
  );
}
