import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PowerPlay | 파워플레이",
  description: "아이스하키 동호회 경기 운영 & 게스트 매칭 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
