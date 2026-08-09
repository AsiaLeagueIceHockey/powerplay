"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Check, Sparkles, ShieldCheck, ArrowRight, Copy, Users, Zap, Trophy, MapPin, Heart, Share2, Smile, UserPlus, ArrowUpCircle, ChevronRight } from "lucide-react";
import { TamagotchiAvatar } from "@/components/tamagotchi-avatar";

interface SlideData {
  id: string;
  bgColor: string;
}

// Series 1: Admin & Co-admin focus (Dark Tech & Neon Yellow #E8FF00)
const SLIDES_S1: SlideData[] = [
  { id: "s1-slide-1", bgColor: "bg-[#090D16]" },
  { id: "s1-slide-2", bgColor: "bg-[#0052FF]" },
  { id: "s1-slide-3", bgColor: "bg-[#0A0F1D]" },
  { id: "s1-slide-4", bgColor: "bg-[#090D16]" },
  { id: "s1-slide-5", bgColor: "bg-[#090D16]" },
];

// Series 2: General Player focus - Club Register/Cheer & Guest Match Application (Vibrant Sports Mint #00FFCC)
const SLIDES_S2: SlideData[] = [
  { id: "s2-slide-1", bgColor: "bg-[#0E1726]" },
  { id: "s2-slide-2", bgColor: "bg-[#111C2E]" },
  { id: "s2-slide-3", bgColor: "bg-[#0A101D]" },
  { id: "s2-slide-4", bgColor: "bg-[#0E1726]" },
  { id: "s2-slide-5", bgColor: "bg-[#0A101D]" },
];

// Series 3: Fun Elements - AI Hockey Character & Today's Hockey Fortune (Neon Gaming Pink & Violet #FF007F)
const SLIDES_S3: SlideData[] = [
  { id: "s3-slide-1", bgColor: "bg-[#1A0924]" },
  { id: "s3-slide-2", bgColor: "bg-[#260D36]" },
  { id: "s3-slide-3", bgColor: "bg-[#14061C]" },
  { id: "s3-slide-4", bgColor: "bg-[#1A0924]" },
  { id: "s3-slide-5", bgColor: "bg-[#14061C]" },
];

// Series 4: Ice Rink Map & Schedule (Bright Clean Light-Mode #0066FF)
const SLIDES_S4: SlideData[] = [
  { id: "s4-slide-1", bgColor: "bg-gradient-to-br from-slate-100 via-white to-blue-50" },
  { id: "s4-slide-2", bgColor: "bg-gradient-to-br from-blue-50 via-white to-slate-100" },
  { id: "s4-slide-3", bgColor: "bg-gradient-to-br from-slate-100 via-white to-blue-50" },
  { id: "s4-slide-4", bgColor: "bg-gradient-to-br from-blue-50 via-white to-slate-100" },
  { id: "s4-slide-5", bgColor: "bg-gradient-to-br from-slate-100 via-white to-blue-50" },
];

// Series 5: KakaoTalk Share & One-Link Scoreboard (Dark Sleek Navy & Kakao Gold #FEE500)
const SLIDES_S5: SlideData[] = [
  { id: "s5-slide-1", bgColor: "bg-[#0D131A]" },
  { id: "s5-slide-2", bgColor: "bg-[#141C26]" },
  { id: "s5-slide-3", bgColor: "bg-[#0D131A]" },
  { id: "s5-slide-4", bgColor: "bg-[#141C26]" },
  { id: "s5-slide-5", bgColor: "bg-[#0D131A]" },
];

// Series 6: Youth Hockey & Parent Community (Bright Warm Light-Mode #F59E0B)
const SLIDES_S6: SlideData[] = [
  { id: "s6-slide-1", bgColor: "bg-gradient-to-br from-amber-50 via-white to-orange-50" },
  { id: "s6-slide-2", bgColor: "bg-gradient-to-br from-orange-50 via-white to-amber-50" },
  { id: "s6-slide-3", bgColor: "bg-gradient-to-br from-amber-50 via-white to-orange-50" },
  { id: "s6-slide-4", bgColor: "bg-gradient-to-br from-orange-50 via-white to-amber-50" },
  { id: "s6-slide-5", bgColor: "bg-gradient-to-br from-amber-50 via-white to-orange-50" },
];

const INSTAGRAM_CAPTIONS: Record<string, { title: string; target: string; theme: string; text: string }> = {
  "series-1": {
    title: "Series 1: 운영진 구원 1탄 (1초 일정 복사 & 운영진 공동 관리)",
    target: "동호회 총무 및 운영진 대상 (대관 관리 & 운영진 지정)",
    theme: "Dark Tech & Neon Yellow (운영 효율 극대화 테마)",
    text: `🏒 파워플레이 동호회 운영 업데이트 🏒

아직도 총무님 혼자서 대관 일정 올리고,
카톡방 공지 쓰고, 입금 확인까지 다 하고 계신가요?

이제 파워플레이에서 30초 만에 일정을 공유하고,
동호회 운영 부담을 10배 더 가볍게 줄여보세요!

1️⃣ 7월 정기 대관 &apos;1초 복사&apos;
- 매달 반복되는 링크장, 시간, 참가비 설정!
- [이전달 불러오기] 버튼 한 번이면 이번 달 일정이 1초 만에 자동 생성돼요.

2️⃣ 믿음직한 팀원 '운영진 공동 관리'
- 혼자서 다 하느라 지쳤던 동호회 관리!
- 팀원을 &apos;운영진&apos;으로 승격하여 대관 등록과 출석 관리를 함께 나눌 수 있어요.

💡 이용 방법
1. 파워플레이 프로필 링크 접속 (별도 앱 설치 NO!)
2. [관리자 페이지] ➔ 경기/동호회 탭에서 일정 간편 생성 및 운영진 지정하기

"아이스하키를 더 쉽게, 더 가깝게 🏒"
지금 바로 파워플레이에서 우리 동호회를 시작해보세요!

@powerplay.kr
#파워플레이 #아이스하키 #아이스하키동호회 #성인하키 #유소년하키`,
  },
  "series-2": {
    title: "Series 2: 플레이어 필수 1탄 (소속팀 등록·응원 & 게스트 참가 신청)",
    target: "일반 하키 플레이어 및 동호회원 대상 (팀 성장 지원 & 게스트 출전)",
    theme: "Vibrant Sports Mint (동호회 응원 & 전국 게스트 테마)",
    text: `🏒 파워플레이 하키 플레이어 필수 안내 🏒

우리 동호회를 전국에서 가장 멋진 팀으로 키우고,
다른 팀 게스트 경기도 자유롭게 참가하고 싶으신가요?

이제 파워플레이에서 우리 팀을 직접 응원하고,
원하는 일정에 간편하게 게스트로 출격해보세요!

1️⃣ 우리 동호회 등록 & 응원 투표
- [동호회] 메뉴에서 '파워플레이 아이스하키' 검색!
- [내 소속팀으로 등록] 버튼과 [응원 투표] 버튼을 눌러 우리 팀 인지도를 높여주세요.

2️⃣ 전국 링크장 게스트 참가 신청
- 복잡한 절차나 카톡 문의 없이, 경기 일정 확인 후 즉시 신청!
- 지도에서 내 주변 구장 일정을 확인하고 간편하게 참여할 수 있어요.

💡 이용 방법
1. 파워플레이 프로필 링크 접속 (별도 앱 설치 NO!)
2. [동호회] ➔ 소속팀 등록/응원 & [경기 일정] ➔ 게스트 참가 신청!

"아이스하키를 더 쉽게, 더 가깝게 🏒"
지금 바로 파워플레이에서 스마트한 하키 라이프를 즐기세요!

@powerplay.kr
#파워플레이 #아이스하키 #아이스하키동호회 #성인하키 #유소년하키`,
  },
  "series-3": {
    title: "Series 3: 하키 재미요소 1탄 (AI 하키 캐릭터 & 오늘의 하키 운세)",
    target: "전체 하키 플레이어 대상 (프로필 브랜딩 & 경기 전 운세 재미)",
    theme: "Neon Gaming Pink (AI 캐릭터 & 하키 엔터테인먼트 테마)",
    text: `🏒 파워플레이 AI 캐릭터 & 하키 운세 출시 🏒

아이스하키 경기장에서 뛰는 즐거움에 더해,
내 실력을 증명하고 공유하는 재미까지!

이제 파워플레이에서 나만의 AI 하키 캐릭터를 키우고
경기 전날 '오늘의 하키 운세'까지 확인해보세요!

1️⃣ 나만의 'AI 하키 캐릭터 & 카드'
- 백넘버, 주포지션, 출석률, 스탯이 담긴 프로 수준 플레이어 카드!
- 내 활동 기록에 따라 멋지게 성장하는 나만의 하키 캐릭터.

2️⃣ 퍽이 찰떡같이 붙는 '오늘의 하키 운세'
- 오늘 나에게 행운을 가져다줄 링크장과 포지션은?
- 경기 전날 팀원들과 함께 나누는 유쾌하고 재미있는 하키 운세!

💡 이용 방법
1. 파워플레이 프로필 링크 접속 (별도 앱 설치 NO!)
2. [마이페이지] ➔ 내 프로필 설정 & '오늘의 하키 운세' 확인!

"아이스하키를 더 쉽게, 더 가깝게 🏒"
지금 바로 파워플레이에서 나만의 하키 캐릭터를 만들어보세요!

@powerplay.kr
#파워플레이 #아이스하키 #아이스하키동호회 #성인하키 #유소년하키`,
  },
  "series-4": {
    title: "Series 4: 전국 아이스링크 (지도 탐색 & 구장별 실시간 대관 TO)",
    target: "전체 아이스하키 플레이어 및 팀 운영진 대상",
    theme: "Bright Ice Blue Light-Mode (밝고 산뜻한 지도 & TO 탐색 테마)",
    text: `🏒 파워플레이 전국 아이스링크 지도 출시 🏒

협회 사이트에도 없는 전국 링크장 정보,
매번 블로그 뒤지며 주소와 대관 시간 찾기 힘들지 않으셨나요?

이제 파워플레이 지도에서 내 주변 링크장 정보를 한눈에 확인하고
실시간 정기 대관 일정과 잔여 TO까지 3초 만에 탐색해보세요!

1️⃣ 전국 풀링크 & 미니링크 지도 총망라
- 서울·수도권 및 전국 50여 개 아이스링크 위치와 구장 정보 제공!
- 풀링크, 미니링크 필터로 내가 원하는 구장을 쉽게 찾을 수 있어요.

2️⃣ 구장별 실시간 정기 대관 & 잔여 TO 탐색
- 해당 링크장에서 진행되는 각 팀의 정기 대관 시간표 실시간 로드!
- 문자 문의나 대기 없이 잔여 TO 확인 후 클릭 한 번으로 간편 참가 신청.

💡 이용 방법
1. 파워플레이 프로필 링크 접속 (별도 앱 설치 NO!)
2. [전국 링크장] ➔ 지도에서 구장 선택 후 실시간 대관 일정 확인하기

"아이스하키를 더 쉽게, 더 가깝게 🏒"
지금 바로 파워플레이에서 전국 아이스링크를 탐색해보세요!

@powerplay.kr
#파워플레이 #아이스하키 #아이스하키동호회 #성인하키 #유소년하키`,
  },
  "series-5": {
    title: "Series 5: 카톡 간편 공유 (1초 로그인 & 원링크 실시간 상황판)",
    target: "동호회 단톡방 운영진 및 참가 신청 플레이어 대상",
    theme: "Sleek Navy & Kakao Gold (카톡방 공지 및 상황판 혁신 테마)",
    text: `🏒 파워플레이 카톡 공유 & 원링크 상황판 🏒

아직도 카톡방 공지 글에 참석자 댓글 손으로 세고,
입금 대조하고 취소자 명단 수정하느라 스트레스 받으시나요?

이제 단 하나의 링크 공유로 카톡방 1초 간편 로그인과
실시간 골리·플레이어 TO 상황판을 한 번에 해결해보세요!

1️⃣ 카카오톡 전용 간편 공유 & 1초 로그인
- 번거로운 회원가입 절차 없이 카카오 계정으로 1초 즉시 접속!
- 카톡방에 공유된 링크 하나로 경기 정보 확인과 신청이 동시에 끝나요.

2️⃣ 실시간 플레이어·골리 현황 상황판
- 현재 신청 인원, 골리 TO 마감 여부, 대기자 명단 실시간 자동 업데이트!
- 누가 입금했는지 직관적인 배지로 표시되어 운영진 관리 스트레스 제로.

💡 이용 방법
1. 파워플레이 프로필 링크 접속 (별도 앱 설치 NO!)
2. [경기 일정] ➔ 카톡 공유 버튼으로 우리 동호회 단톡방에 링크 전송!

"아이스하키를 더 쉽게, 더 가깝게 🏒"
지금 바로 파워플레이 원링크 상황판으로 스마트하게 운영해보세요!

@powerplay.kr
#파워플레이 #아이스하키 #아이스하키동호회 #성인하키 #유소년하키`,
  },
  "series-6": {
    title: "Series 6: 유소년 하키 라운지 (클럽 탐색 & 하키맘·대디 커뮤니티)",
    target: "유소년 아이스하키 선수 학부모님 (하키 맘·대디) 대상",
    theme: "Bright Warm Gold Light-Mode (따뜻하고 신뢰감 있는 유소년 소통 테마)",
    text: `🏒 파워플레이 유소년 하키 라운지 오픈 🏒

아이 하키 처음 시작할 때 클럽 선정부터,
장비 구매 조언, 레슨 정보까지 알아보실 곳이 마땅치 않으셨나요?

이제 파워플레이 유소년 라운지에서 전국 유소년 팀 정보를 비교하고
검증된 하키 맘·대디들과 실시간으로 유익한 정보와 고민을 나눠보세요!

1️⃣ 주니어 클럽 & 유소년 레슨 탐색
- 전국 유소년 아이스하키 팀, 레슨, 정기 훈련 링크장 정보 한눈에 비교!
- 우리 아이에게 딱 맞는 최적의 주니어 클럽과 레슨을 쉽게 찾을 수 있어요.

2️⃣ 하키 맘·대디 실시간 Q&A 커뮤니티
- 스케이트 사이즈 조언, 중고 장비 팁, 대회 후기까지 자유로운 소통!
- 하키 학부모님들만의 공감대와 생생한 정보를 나누는 든든한 동반자.

💡 이용 방법
1. 파워플레이 프로필 링크 접속 (별도 앱 설치 NO!)
2. [유소년 하키] ➔ 클럽 정보 탐색 및 커뮤니티에서 질문글 작성하기

"아이스하키를 더 쉽게, 더 가깝게 🏒"
지금 바로 파워플레이 유소년 라운지에서 우리 아이 하키를 시작해보세요!

@powerplay.kr
#파워플레이 #아이스하키 #아이스하키동호회 #성인하키 #유소년하키`,
  },
};

export function CardNewsStudio() {
  const [activeTab, setActiveTab] = useState<"series-1" | "series-2" | "series-3" | "series-4" | "series-5" | "series-6">("series-1");
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadAllProgress, setDownloadAllProgress] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentSlides =
    activeTab === "series-1"
      ? SLIDES_S1
      : activeTab === "series-2"
      ? SLIDES_S2
      : activeTab === "series-3"
      ? SLIDES_S3
      : activeTab === "series-4"
      ? SLIDES_S4
      : activeTab === "series-5"
      ? SLIDES_S5
      : SLIDES_S6;
  const currentCaption = INSTAGRAM_CAPTIONS[activeTab];

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(currentCaption.text);
    setSuccessMsg("📋 인스타 게시물 본문(해시태그 5개 포함)이 클립보드에 1초 복사되었습니다!");
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDownloadSingle = async (index: number) => {
    const el = slideRefs.current[index];
    if (!el) return;
    try {
      setDownloadingIndex(index);
      const size = el.offsetWidth;
      const ratio = 1080 / size;
      const dataUrl = await toPng(el, {
        quality: 1,
        width: size,
        height: size,
        pixelRatio: ratio,
        cacheBust: true,
        style: {
          transform: "none",
          margin: "0",
          width: `${size}px`,
          height: `${size}px`,
          maxHeight: `${size}px`,
          maxWidth: `${size}px`,
          overflow: "hidden",
          borderRadius: "16px",
        },
      });
      const link = document.createElement("a");
      link.download = `powerplay-cardnews-${activeTab}-slide-${index + 1}.png`;
      link.href = dataUrl;
      link.click();
      setSuccessMsg(`슬라이드 ${index + 1}번 1:1 완벽 비율 PNG 저장 완료!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("이미지 다운로드에 실패했습니다.");
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadAllProgress(true);
    try {
      for (let i = 0; i < currentSlides.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const size = el.offsetWidth;
        const ratio = 1080 / size;
        const dataUrl = await toPng(el, {
          quality: 1,
          width: size,
          height: size,
          pixelRatio: ratio,
          cacheBust: true,
          style: {
            transform: "none",
            margin: "0",
            width: `${size}px`,
            height: `${size}px`,
            maxHeight: `${size}px`,
            maxWidth: `${size}px`,
            overflow: "hidden",
            borderRadius: "16px",
          },
        });
        const link = document.createElement("a");
        link.download = `powerplay-cardnews-${activeTab}-slide-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        await new Promise((r) => setTimeout(r, 600));
      }
      const seriesName =
        activeTab === "series-1"
          ? "시리즈 1"
          : activeTab === "series-2"
          ? "시리즈 2"
          : activeTab === "series-3"
          ? "시리즈 3"
          : activeTab === "series-4"
          ? "시리즈 4"
          : activeTab === "series-5"
          ? "시리즈 5"
          : "시리즈 6";
      setSuccessMsg(`🎉 ${seriesName} 전체 슬라이드(5장) 1:1 완벽 비율 PNG 다운로드 완료!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to download all", err);
      alert("전체 다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloadAllProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            인스타 마케팅 스튜디오 v17 (100% Authentic PowerPlay UI Replicas & Rules Compliance)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            파워플레이 SNS 카드뉴스 공식 스튜디오
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            실제 파워플레이 UI(소속팀 등록, 응원 투표, 게스트 참가 신청) 100% 반영 및 1:1 WYSIWYG 보증.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadAll}
            disabled={downloadAllProgress}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 animate-bounce" />
            {downloadAllProgress ? "전체 다운로드 중..." : "전체 슬라이드 PNG로 저장 (5장)"}
          </button>
        </div>
      </div>

      {/* Series Selection Tabs (6 Distinct Theme Colors) */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap items-center gap-3 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 w-fit">
          <button
            onClick={() => setActiveTab("series-1")}
            className={`flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
              activeTab === "series-1"
                ? "bg-[#E8FF00] text-black shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Series 1: 운영진 구원 (일정 복사·운영진 승격)</span>
          </button>
          <button
            onClick={() => setActiveTab("series-2")}
            className={`flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
              activeTab === "series-2"
                ? "bg-[#00FFCC] text-black shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Series 2: 플레이어 필수 (소속팀 등록·게스트 신청)</span>
          </button>
          <button
            onClick={() => setActiveTab("series-3")}
            className={`flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
              activeTab === "series-3"
                ? "bg-[#FF007F] text-white shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Series 3: 하키 재미요소 (AI 캐릭터·하키 운세)</span>
          </button>
          <button
            onClick={() => setActiveTab("series-4")}
            className={`flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
              activeTab === "series-4"
                ? "bg-[#0066FF] text-white shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Series 4: 전국 아이스링크 (지도·대관 TO)</span>
          </button>
          <button
            onClick={() => setActiveTab("series-5")}
            className={`flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
              activeTab === "series-5"
                ? "bg-[#FEE500] text-black shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Series 5: 카톡 공유 (원링크 상황판)</span>
          </button>
          <button
            onClick={() => setActiveTab("series-6")}
            className={`flex items-center gap-2 px-4.5 py-3 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
              activeTab === "series-6"
                ? "bg-[#F59E0B] text-white shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Series 6: 유소년 하키 (하키맘·대디 커뮤니티)</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 font-medium animate-fade-in shadow-lg">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Automated Instagram Post Copy Section */}
      <div className="max-w-7xl mx-auto mb-10 p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-700/80 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                activeTab === "series-1"
                  ? "bg-[#E8FF00]/20 text-[#E8FF00]"
                  : activeTab === "series-2"
                  ? "bg-[#00FFCC]/20 text-[#00FFCC]"
                  : activeTab === "series-3"
                  ? "bg-[#FF007F]/20 text-[#FF007F]"
                  : activeTab === "series-4"
                  ? "bg-[#0066FF]/20 text-[#0066FF]"
                  : activeTab === "series-5"
                  ? "bg-[#FEE500]/20 text-[#FEE500]"
                  : "bg-[#F59E0B]/20 text-[#F59E0B]"
              }`}>
                {currentCaption.theme}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">{currentCaption.target}</span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-white mt-1">{currentCaption.title}</h3>
          </div>
          <button
            onClick={handleCopyCaption}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm border border-white/15 transition cursor-pointer whitespace-nowrap shadow-md"
          >
            <Copy className={`w-4 h-4 ${
              activeTab === "series-1"
                ? "text-[#E8FF00]"
                : activeTab === "series-2"
                ? "text-[#00FFCC]"
                : activeTab === "series-3"
                ? "text-[#FF007F]"
                : activeTab === "series-4"
                ? "text-[#0066FF]"
                : activeTab === "series-5"
                ? "text-[#FEE500]"
                : "text-[#F59E0B]"
            }`} />
            <span>📋 인스타 본문 1초 복사 (해시태그 5개 포함)</span>
          </button>
        </div>
        <div className="relative">
          <pre className="p-4 rounded-xl bg-black/60 border border-zinc-800 text-zinc-300 font-sans text-xs md:text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto selection:bg-[#E8FF00] selection:text-black">
            {currentCaption.text}
          </pre>
          <div className="absolute right-3 bottom-3 text-[11px] text-zinc-500 bg-black/80 px-2 py-1 rounded border border-zinc-800">
            ✅ 해시태그 5개 제한 준수 완료
          </div>
        </div>
      </div>

      {/* Grid of Slides */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentSlides.map((slide, idx) => (
          <div key={slide.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm text-zinc-400 font-medium px-1">
              <span className="font-bold text-zinc-300">Slide #{idx + 1}</span>
              <button
                onClick={() => handleDownloadSingle(idx)}
                disabled={downloadingIndex === idx}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {downloadingIndex === idx ? "저장 중..." : "이 슬라이드만 저장"}
              </button>
            </div>

            {/* 1080x1080 Aspect Square Container */}
            <div
              ref={(el) => { slideRefs.current[idx] = el; }}
              className={`w-full aspect-square relative overflow-hidden rounded-2xl ${slide.bgColor} ${
                activeTab === "series-4" || activeTab === "series-6"
                  ? "text-slate-900 border border-slate-200/80 shadow-xl"
                  : "text-white border border-white/10 shadow-2xl"
              } flex flex-col justify-center p-6 select-none`}
              style={{
                fontFamily: "'Pretendard', 'Apple SD Gothic Neo', -apple-system, sans-serif",
                wordBreak: "keep-all",
              }}
            >
              {/* ========================================================= */}
              {/* SERIES 1 SLIDES (ADMIN FOCUS - DARK TECH & NEON YELLOW)   */}
              {/* ========================================================= */}
              {activeTab === "series-1" && (
                <>
                  {/* S1 - SLIDE 1: COVER */}
                  {idx === 0 && (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center z-0 opacity-45 mix-blend-luminosity scale-105"
                        style={{ backgroundImage: "url('/marketing/cardnews_s1_cover_bg.png')" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/80 to-[#090D16]/40 z-0" />

                      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-[98%] mx-auto z-10">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E8FF00] text-black font-black text-xs tracking-tight mb-5 shadow-lg whitespace-nowrap">
                          <span>🔥 파워플레이 업데이트</span>
                        </div>
                        <h2 className="text-[24px] font-black leading-[1.4] tracking-tight text-white drop-shadow-md flex flex-col items-center">
                          <span className="whitespace-nowrap">아직도 총무 혼자서</span>
                          <span className="whitespace-nowrap">대관 올리고, 공지 쓰고,</span>
                          <span className="text-[#E8FF00] whitespace-nowrap">입금 확인까지 다 하세요?</span>
                        </h2>
                      </div>
                    </>
                  )}

                  {/* S1 - SLIDE 2: EMPATHY */}
                  {idx === 1 && (
                    <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-[98%] mx-auto z-10">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/30 border border-white/20 text-blue-100 font-bold text-xs tracking-wider mb-5 whitespace-nowrap">
                        <span>💬 아이스하키 동호회 현실</span>
                      </div>
                      <h2 className="text-[22px] font-black leading-[1.45] tracking-tight text-white flex flex-col items-center">
                        <span className="whitespace-nowrap">아이스하키 하러 와서</span>
                        <span className="text-[#E8FF00] whitespace-nowrap">카톡방 관리하고 TO 맞추느라</span>
                        <span className="whitespace-nowrap">지치지 않으셨나요?</span>
                      </h2>
                    </div>
                  )}

                  {/* S1 - SLIDE 3: SOLUTION 1 (1-SEC COPY) */}
                  {idx === 2 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>⚡ 1초 일정 복사</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">7월 정기 대관 일정,</span>
                        <span className="whitespace-nowrap">지난달 설정 그대로 <span className="text-[#E8FF00]">&apos;1초 복사&apos;!</span></span>
                      </h2>

                      {/* 100% Authentic bulk-match-form.tsx Replica */}
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-xl flex flex-col gap-3 w-full shrink-0">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[11px]">매주 목요일</span>
                            <span>22:00 ~ 23:30 · 제니스 아이스링크</span>
                          </span>
                          <span className="text-[11px] text-zinc-400 font-medium">정기 대관</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium whitespace-nowrap shadow-sm">
                            <Copy className="w-3.5 h-3.5 shrink-0 text-[#E8FF00]" />
                            <span>이전달 불러오기</span>
                          </div>
                          <div className="flex-1 py-1.5 px-3 bg-blue-600 text-white rounded-lg text-xs font-medium border border-blue-500 text-center whitespace-nowrap shadow-md">
                            <span>4개 경기 일괄 생성</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#E8FF00] font-bold flex-shrink-0">💡 사용법:</span>
                        <span className="text-white flex-shrink-0">[경기 관리]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-white flex-shrink-0">&apos;한달치 생성&apos;</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-[#E8FF00] font-bold underline underline-offset-2 flex-shrink-0">&apos;이전달 불러오기&apos;</span>
                      </div>
                    </div>
                  )}

                  {/* S1 - SLIDE 4: SOLUTION 2 (CO-ADMIN PROMOTION) */}
                  {idx === 3 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/30 text-purple-200 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>🤝 운영진 공동 관리</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">믿음직한 팀원을 <span className="text-[#E8FF00]">&apos;운영진&apos;</span>으로 승격하세요.</span>
                        <span className="whitespace-nowrap">혼자 하던 일을 나눌 수 있습니다!</span>
                      </h2>

                      {/* 100% Authentic admin-club-members.tsx Replica */}
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-xl flex items-center justify-between gap-3 w-full shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                            김
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm truncate">김하키</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-700 text-zinc-300">FW</span>
                            </div>
                            <span className="text-xs text-zinc-400 truncate">📞 010-1234-5678</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-900/30 text-blue-400 border border-blue-900/50 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 shadow-sm">
                          <ArrowUpCircle className="w-3.5 h-3.5 shrink-0 text-[#E8FF00]" />
                          <span>운영진 승격</span>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#E8FF00] font-bold flex-shrink-0">💡 사용법:</span>
                        <span className="text-white flex-shrink-0">[동호회 관리]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-white flex-shrink-0">멤버 목록</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-[#E8FF00] font-bold underline underline-offset-2 flex-shrink-0">&apos;운영진 승격&apos;</span>
                      </div>
                    </div>
                  )}

                  {/* S1 - SLIDE 5: CTA */}
                  {idx === 4 && (
                    <div className="flex flex-col justify-center items-center my-auto text-center w-full z-10 gap-7 py-2">
                      <div>
                        <h2 className="text-[24px] md:text-[26px] font-black leading-[1.3] tracking-tight text-white flex flex-col items-center">
                          <span className="whitespace-nowrap">올리는 건 <span className="text-[#E8FF00]">30초</span>,</span>
                          <span className="whitespace-nowrap">동호회 관리는 <span className="text-[#E8FF00]">10배</span></span>
                          <span className="whitespace-nowrap">쉬워지는 곳.</span>
                        </h2>
                      </div>

                      <div className="flex flex-col items-center w-full gap-3">
                        <img
                          src="/long-logo-darkmode.png"
                          alt="PowerPlay Official Logo"
                          className="h-11 md:h-12 w-auto mx-auto object-contain drop-shadow-lg mix-blend-screen"
                        />
                        <div className="text-[14px] md:text-[15px] font-black text-[#E8FF00] tracking-wide drop-shadow-[0_0_10px_rgba(232,255,0,0.3)] whitespace-nowrap">
                          &quot;아이스하키를 더 쉽게, 더 가깝게&nbsp;&nbsp;🏒&quot;
                        </div>
                      </div>

                      <div className="w-full pt-1">
                        <div className="w-full py-3.5 rounded-xl bg-[#E8FF00] text-black font-black text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-yellow-300 transition cursor-pointer whitespace-nowrap">
                          <span>프로필 링크에서 7월 일정 간편 등록하기</span> <ArrowRight className="w-4 h-4 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ========================================================= */}
              {/* SERIES 2 SLIDES (PLAYER FOCUS - AUTHENTIC POWERPLAY UI)   */}
              {/* ========================================================= */}
              {activeTab === "series-2" && (
                <>
                  {/* S2 - SLIDE 1: COVER (CORE VALUE FOR PLAYERS) */}
                  {idx === 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0E1726] via-[#111C2E]/90 to-[#0E1726]/50 z-0" />

                      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-[98%] mx-auto z-10">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00FFCC] text-black font-black text-xs tracking-tight mb-5 shadow-[0_0_15px_rgba(0,255,204,0.4)] whitespace-nowrap">
                          <span>✨ 하키 플레이어 필수</span>
                        </div>
                        <h2 className="text-[24px] font-black leading-[1.4] tracking-tight text-white drop-shadow-md flex flex-col items-center">
                          <span className="whitespace-nowrap">우리 동호회 응원하고</span>
                          <span className="whitespace-nowrap">전국 게스트 경기도</span>
                          <span className="text-[#00FFCC] whitespace-nowrap">간편하게 참여하세요!</span>
                        </h2>
                      </div>
                    </>
                  )}

                  {/* S2 - SLIDE 2: SOLUTION 1 (CLUB REGISTER & CHEER - 100% AUTHENTIC POWERPLAY UI) */}
                  {idx === 1 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>📣 소속팀 등록 & 응원 투표</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">우리 팀 등록하고 <span className="text-[#00FFCC]">&apos;응원 투표&apos;!</span></span>
                        <span className="whitespace-nowrap">동호회를 더 멋지게 키워주세요.</span>
                      </h2>

                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-[#00FFCC]/40 shadow-xl flex flex-col gap-3 w-full shrink-0">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="text-sm font-black text-white whitespace-nowrap">🏒 파워플레이 아이스하키</span>
                          <span className="text-xs text-zinc-400 font-semibold whitespace-nowrap">멤버 34명</span>
                        </div>
                        {/* 100% Authentic club-subscribe-button.tsx & club-vote-button.tsx Replica */}
                        <div className="grid grid-cols-2 gap-2 pt-0.5 shrink-0">
                          <div className="h-[46px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-bold leading-none tracking-[-0.01em] bg-zinc-900 border border-zinc-700 text-white flex shadow-sm shrink-0">
                            <UserPlus className="w-4 h-4 text-white shrink-0" />
                            <span>내 소속팀으로 등록</span>
                          </div>
                          <div className="h-[46px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-bold leading-none tracking-[-0.01em] bg-rose-100 text-zinc-900 flex shadow-md shrink-0 hover:bg-rose-200">
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                            <span>응원 투표</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#00FFCC] font-bold flex-shrink-0">💡 방법:</span>
                        <span className="text-white flex-shrink-0">[동호회]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-white flex-shrink-0">우리 팀 검색</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-[#00FFCC] font-bold underline underline-offset-2 flex-shrink-0">[응원 투표] 클릭!</span>
                      </div>
                    </div>
                  )}

                  {/* S2 - SLIDE 3: SOLUTION 2 (GUEST MATCH APPLICATION - 100% AUTHENTIC POWERPLAY UI) */}
                  {idx === 2 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>⚡ 전국 게스트 참가 신청</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">다른 동호회에 놀러가고 싶다면?</span>
                        <span className="whitespace-nowrap">복잡한 절차 없이 <span className="text-[#00FFCC]">즉시 참가 신청!</span></span>
                      </h2>

                      {/* 100% Authentic match-card.tsx & join-button.tsx Replica */}
                      <div className="rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-xl flex flex-col w-full shrink-0 overflow-hidden">
                        <div className="h-1 w-full bg-blue-600" />
                        <div className="p-3.5 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-300">07.10 (금) 22:00</span>
                            <div className="flex items-center gap-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-900/40 text-green-300 border border-green-800/50">신청중</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">게스트 경기</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white whitespace-nowrap">제니스 아이스링크 고척</span>
                              <span className="text-[11px] text-zinc-400">서울 구로구 · 참가비 30,000원</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-semibold">
                              <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300">스케이터 17/20</span>
                              <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300">골리 1/2</span>
                            </div>
                          </div>
                          {/* Authentic join-button.tsx Position Selectors */}
                          <div className="grid grid-cols-3 gap-1.5 w-full pt-2 border-t border-zinc-800">
                            <div className="py-1.5 px-2 bg-blue-600 text-white font-bold text-xs rounded-xl text-center shadow-sm">FW (3석)</div>
                            <div className="py-1.5 px-2 bg-blue-600 text-white font-bold text-xs rounded-xl text-center shadow-sm">DF (3석)</div>
                            <div className="py-1.5 px-2 bg-emerald-600 text-white font-bold text-xs rounded-xl text-center shadow-sm">G (1석)</div>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#00FFCC] font-bold flex-shrink-0">💡 방법:</span>
                        <span className="text-white flex-shrink-0">[경기 일정]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-white flex-shrink-0">날짜·구장 선택</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-[#00FFCC] font-bold underline underline-offset-2 flex-shrink-0">[참가 신청]</span>
                      </div>
                    </div>
                  )}

                  {/* S2 - SLIDE 4: WHY USE POWERPLAY? (CLEAR VALUE FOR PLAYERS) */}
                  {idx === 3 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>🗺️ 전국 링크장 일정 탐색</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">지도에서 내 주변 구장 일정을</span>
                        <span className="text-[#00FFCC] whitespace-nowrap">한눈에 확인하고 비교하세요.</span>
                      </h2>

                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col gap-2.5 w-full shrink-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-white whitespace-nowrap">
                          <span className="text-[#00FFCC]">📍</span> <span>서울·수도권 모든 아이스링크 지도 검색</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-white whitespace-nowrap">
                          <span className="text-[#00FFCC]">⚡</span> <span>문자 문의나 대기 없이 클릭 한 번으로 참가</span>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#00FFCC] font-bold flex-shrink-0">💡</span>
                        <span className="text-white flex-shrink-0">별도 앱 설치 없이 링크 클릭 한 번으로 바로 접속!</span>
                      </div>
                    </div>
                  )}

                  {/* S2 - SLIDE 5: CTA */}
                  {idx === 4 && (
                    <div className="flex flex-col justify-center items-center my-auto text-center w-full z-10 gap-7 py-2">
                      <div>
                        <h2 className="text-[24px] md:text-[26px] font-black leading-[1.3] tracking-tight text-white flex flex-col items-center">
                          <span className="whitespace-nowrap">아이스하키를 즐기는</span>
                          <span className="whitespace-nowrap">가장 스마트한 방법,</span>
                          <span className="text-[#00FFCC] whitespace-nowrap">지금 파워플레이에서.</span>
                        </h2>
                      </div>

                      <div className="flex flex-col items-center w-full gap-3">
                        <img
                          src="/long-logo-darkmode.png"
                          alt="PowerPlay Official Logo"
                          className="h-11 md:h-12 w-auto mx-auto object-contain drop-shadow-[0_0_15px_rgba(0,255,204,0.3)] mix-blend-screen"
                        />
                        <div className="text-[14px] md:text-[15px] font-black text-[#00FFCC] tracking-wide drop-shadow-[0_0_10px_rgba(0,255,204,0.3)] whitespace-nowrap">
                          &quot;아이스하키를 더 쉽게, 더 가깝게&nbsp;&nbsp;🏒&quot;
                        </div>
                      </div>

                      <div className="w-full pt-1">
                        <div className="w-full py-3.5 rounded-xl bg-[#00FFCC] text-black font-black text-xs shadow-[0_0_20px_rgba(0,255,204,0.3)] flex items-center justify-center gap-2 hover:bg-teal-300 transition cursor-pointer whitespace-nowrap">
                          <span>프로필 링크에서 우리 동호회 찾기</span> <ArrowRight className="w-4 h-4 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ========================================================= */}
              {/* SERIES 3 SLIDES (FUN ELEMENTS - AI CHARACTER & FORTUNE)   */}
              {/* ========================================================= */}
              {activeTab === "series-3" && (
                <>
                  {/* S3 - SLIDE 1: COVER */}
                  {idx === 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0924] via-[#260D36]/90 to-[#1A0924]/50 z-0" />

                      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-[98%] mx-auto z-10">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF007F] text-white font-black text-xs tracking-tight mb-5 shadow-[0_0_15px_rgba(255,0,127,0.4)] whitespace-nowrap">
                          <span>✨ 하키 라이프의 재미</span>
                        </div>
                        <h2 className="text-[24px] font-black leading-[1.4] tracking-tight text-white drop-shadow-md flex flex-col items-center">
                          <span className="whitespace-nowrap">파워 플레이어 키우기와</span>
                          <span className="whitespace-nowrap">오늘의 운세, 선수 디지털 카드까지</span>
                          <span className="text-[#FF007F] whitespace-nowrap">지금 만나보세요!</span>
                        </h2>
                      </div>
                    </>
                  )}

                  {/* S3 - SLIDE 2: POWER PLAYER (AUTHENTIC TAMAGOTCHI REPLICA) */}
                  {idx === 1 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>✨ 마이페이지 &gt; 파워 플레이어</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">매일 식사와 훈련으로 키우는</span>
                        <span className="whitespace-nowrap"><span className="text-[#FF007F]">나만의 파워 플레이어!</span></span>
                      </h2>

                      {/* 100% Authentic tamagotchi-hero.tsx Replica with Cute Avatar (Compact) */}
                      <div className="p-3.5 rounded-2xl border border-sky-800/60 bg-gradient-to-br from-sky-950/80 via-zinc-900 to-violet-950/80 shadow-xl flex flex-col gap-3 w-full shrink-0 my-1">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-sm font-black text-white">파워 플레이어</span>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 pt-0.5">
                          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-sky-900/60 bg-zinc-900/90 shadow-inner overflow-hidden">
                            <TamagotchiAvatar
                              size={58}
                              colors={{ helmet: "#ffffff", jersey: "#1e3a8a", skate: "#334155" }}
                              action="train"
                              alt="Power Player Character"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-center gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                                <span>에너지</span>
                                <span className="font-black tabular-nums text-white">56</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: "56%" }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                                <span>컨디션</span>
                                <span className="font-black tabular-nums text-white">60</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                                <div className="h-full rounded-full bg-sky-500" style={{ width: "60%" }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <div className="py-2 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                            <span>🍗 오늘 식사 완료</span>
                          </div>
                          <div className="py-2 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                            <span>🏋️ 오늘 훈련 완료</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-1">
                        <span className="text-[#FF007F] font-bold flex-shrink-0">💡 방법:</span>
                        <span className="text-white flex-shrink-0">[마이페이지]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-white flex-shrink-0">[파워 플레이어]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-[#FF007F] font-bold underline underline-offset-2 flex-shrink-0">매일 식사/훈련 루틴 완료!</span>
                      </div>
                    </div>
                  )}

                  {/* S3 - SLIDE 3: TODAY'S HOCKEY FORTUNE (AUTHENTIC UI REPLICA) */}
                  {idx === 2 && (
                    <div className="flex flex-col justify-center items-center my-auto w-full z-10 gap-3 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>🔮 마이페이지 &gt; 오늘의 하키 운세</span>
                      </div>
                      <h2 className="text-[18px] md:text-[20px] font-black leading-[1.35] tracking-tight text-white flex flex-col items-center shrink-0">
                        <span className="whitespace-nowrap">경기 전날 꼭 확인하는 재미!</span>
                        <span className="whitespace-nowrap"><span className="text-[#FF007F]">오늘의 하키 운세를 확인해볼까요?</span></span>
                      </h2>

                      {/* 100% Authentic daily-hockey-fortune-screen.tsx Replica */}
                      <div className="flex flex-col gap-2.5 w-full shrink-0 my-2">
                        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-blue-950/60 via-zinc-900 to-zinc-900 border border-blue-500/40 shadow-xl flex items-center justify-between gap-3 w-full text-left">
                          <div className="flex flex-col gap-1 text-left">
                            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                              <span>✨ 오늘의 하키 운세</span>
                            </div>
                            <div className="text-sm md:text-base font-black text-white leading-snug">
                              시야와 판단이 또렷한 날
                            </div>
                          </div>
                          <div className="flex-shrink-0 rounded-xl bg-zinc-800 border border-white/10 px-3.5 py-2.5 text-sm md:text-base font-black text-white shadow-md">
                            96점
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#FF007F] font-bold flex-shrink-0">💡 방법:</span>
                        <span className="text-white flex-shrink-0">[마이페이지]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-white flex-shrink-0">[오늘의 하키 운세]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-[#FF007F] font-bold underline underline-offset-2 flex-shrink-0">오늘의 플레이 감각 확인!</span>
                      </div>
                    </div>
                  )}

                  {/* S3 - SLIDE 4: PLAYER DIGITAL CARD (AUTHENTIC UI REPLICA) */}
                  {idx === 3 && (
                    <div className="flex flex-col justify-center items-center my-auto w-full z-10 gap-2 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>🃏 프로필 &gt; 선수 디지털 카드</span>
                      </div>
                      <h2 className="text-[17px] md:text-[19px] font-black leading-tight tracking-tight text-white shrink-0 mb-0.5">
                        <span className="whitespace-nowrap">당신의 프로필을 <span className="text-[#FF007F]">디지털 카드</span>로 만나보세요!</span>
                      </h2>

                      {/* 100% Authentic Player Card Replica (Left-Right Side-by-Side Layout) */}
                      <div className="p-3 rounded-[18px] bg-gradient-to-br from-[#18181b] to-[#09090b] border border-zinc-700 shadow-2xl flex flex-col gap-1.5 w-full shrink-0 relative overflow-hidden my-0.5">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none -mr-6 -mt-6" />
                        
                        <div className="flex justify-between items-center z-10 w-full border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm rounded-md pr-2 pl-1.5 py-0.5 border border-white/10">
                            <img src="/favicon.png" alt="PowerPlay" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/10" />
                            <span className="font-bold text-[10px] tracking-wide text-white">파워플레이 아이스하키</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[7px] text-zinc-400 font-medium uppercase tracking-wider block">SERIAL</span>
                            <span className="text-[10px] font-bold tracking-widest text-white">#1016</span>
                          </div>
                        </div>

                        {/* Side-by-Side: Title on Left, Player Graphic on Right */}
                        <div className="z-10 flex items-center justify-between w-full px-3 py-1 my-0.5">
                          <div className="text-left flex flex-col justify-center">
                            <h3 className="text-[18px] md:text-[22px] font-black text-white tracking-wide">
                              파워플레이어
                            </h3>
                          </div>
                          <div className="relative flex-shrink-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            <img 
                              src="/player.svg" 
                              alt="Player Graphic"
                              className="w-16 h-16 md:w-20 md:h-20 object-contain brightness-0 invert opacity-90"
                            />
                          </div>
                        </div>

                        <div className="z-10 w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 grid grid-cols-2 gap-y-1 gap-x-2 text-left">
                          <div>
                            <div className="text-[8px] text-zinc-400 uppercase font-semibold">POSITION</div>
                            <div className="text-[10px] font-bold text-white mt-0.5">RW</div>
                          </div>
                          <div>
                            <div className="text-[8px] text-zinc-400 uppercase font-semibold">SHOT</div>
                            <div className="text-[10px] font-bold text-white mt-0.5">라이트</div>
                          </div>
                          <div>
                            <div className="text-[8px] text-zinc-400 uppercase font-semibold">EXPERIENCE</div>
                            <div className="text-[10px] font-bold text-white mt-0.5">1년 7개월</div>
                          </div>
                          <div>
                            <div className="text-[8px] text-zinc-400 uppercase font-semibold">ISSUED DATE</div>
                            <div className="text-[10px] font-bold text-white mt-0.5">2026-06-30</div>
                          </div>
                        </div>
                      </div>

                      <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#FF007F] font-bold flex-shrink-0">💡 방법:</span>
                        <span className="text-white flex-shrink-0">[마이페이지]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-white flex-shrink-0">[프로필]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-[#FF007F] font-bold underline underline-offset-2 flex-shrink-0">&apos;선수 카드 만들기&apos; 클릭!</span>
                      </div>
                    </div>
                  )}

                  {/* S3 - SLIDE 5: CTA */}
                  {idx === 4 && (
                    <div className="flex flex-col justify-center items-center my-auto text-center w-full z-10 gap-7 py-2">
                      <div>
                        <h2 className="text-[24px] md:text-[26px] font-black leading-[1.35] tracking-tight text-white flex flex-col items-center">
                          <span className="whitespace-nowrap">파워플레이와 함께</span>
                          <span className="text-[#FF007F] whitespace-nowrap">하키 라이프를 10배 더 즐겁게!</span>
                        </h2>
                      </div>

                      <div className="flex flex-col items-center w-full gap-3">
                        <img
                          src="/long-logo-darkmode.png"
                          alt="PowerPlay Official Logo"
                          className="h-11 md:h-12 w-auto mx-auto object-contain drop-shadow-[0_0_15px_rgba(255,0,127,0.3)] mix-blend-screen"
                        />
                        <div className="text-[14px] md:text-[15px] font-black text-[#FF007F] tracking-wide drop-shadow-[0_0_10px_rgba(255,0,127,0.3)] whitespace-nowrap">
                          &quot;아이스하키를 더 쉽게, 더 가깝게&nbsp;&nbsp;🏒&quot;
                        </div>
                      </div>

                      <div className="w-full pt-1">
                        <div className="w-full py-3.5 rounded-xl bg-[#FF007F] text-white font-black text-xs shadow-[0_0_20px_rgba(255,0,127,0.3)] flex items-center justify-center gap-2 hover:bg-pink-600 transition cursor-pointer whitespace-nowrap">
                          <span>마이페이지에서 내 하키 라이프 확인하기</span> <ArrowRight className="w-4 h-4 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ========================================================= */}
              {/* SERIES 4 SLIDES (ICE RINK MAP & LIVE SCHEDULE - LIGHT)    */}
              {/* ========================================================= */}
              {activeTab === "series-4" && (
                <>
                  {/* S4 - SLIDE 1: COVER */}
                  {idx === 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-100/60 via-white to-slate-50/50 z-0" />

                      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-[98%] mx-auto z-10">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0066FF] text-white font-black text-xs tracking-tight mb-5 shadow-md whitespace-nowrap">
                          <span>🗺️ 전국 아이스링크 지도 & 사용 동호회</span>
                        </div>
                        <h2 className="text-[24px] font-black leading-[1.4] tracking-tight text-slate-900 drop-shadow-xs flex flex-col items-center">
                          <span className="whitespace-nowrap">협회 사이트에도 없는</span>
                          <span className="whitespace-nowrap">전국 링크장 정보와 사용 동호회</span>
                          <span className="text-[#0066FF] whitespace-nowrap">3초 만에 탐색하세요!</span>
                        </h2>
                      </div>
                    </>
                  )}

                  {/* S4 - SLIDE 2: EMPATHY */}
                  {idx === 1 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>❓ 링크장 찾기의 답답함</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-slate-900 flex flex-col shrink-0">
                        <span className="whitespace-nowrap">처음 가는 링크장 주소 찾고,</span>
                        <span className="whitespace-nowrap">대관 시간표 알아내느라</span>
                        <span className="text-[#0066FF] whitespace-nowrap">매번 인스타 뒤지지 않으셨나요?</span>
                      </h2>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-md flex flex-col gap-2.5 w-full shrink-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap">
                          <span className="text-rose-500">❌</span> <span>협회 사이트에도 없는 풀링크/미니링크 지도</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap">
                          <span className="text-rose-500">❌</span> <span>어느 동호회가 언제 대관하는지 알기 어려움</span>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#0066FF] font-bold flex-shrink-0">💡 해결:</span>
                        <span className="text-slate-900 flex-shrink-0">파워플레이 전국 지도에서 클릭 한 번으로 끝!</span>
                      </div>
                    </div>
                  )}

                  {/* S4 - SLIDE 3: SOLUTION 1 (NAVER MAP & FILTER REPLICA - LIGHT) */}
                  {idx === 2 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>1️⃣ 전국 링크장 지도 총망라</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-slate-900 flex flex-col shrink-0">
                        <span className="whitespace-nowrap">서울·수도권 및 전국 50여 개 구장,</span>
                        <span className="whitespace-nowrap"><span className="text-[#0066FF]">풀링크·미니링크</span> 지도 탐색!</span>
                      </h2>

                      {/* 100% Authentic rink-explorer.tsx Replica (Light Mode) */}
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col gap-2.5 w-full shrink-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-1">
                          <span className="text-sm font-black text-slate-900 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>🗺️ 전국 아이스링크 지도</span>
                          </span>
                          <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200/60 whitespace-nowrap shrink-0">
                            50개 구장
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5 shrink-0 whitespace-nowrap overflow-hidden">
                          <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-xs shadow-sm shrink-0 whitespace-nowrap inline-flex items-center gap-1">
                            <span>✨</span>
                            <span>전체</span>
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs shrink-0 border border-slate-200/60 whitespace-nowrap inline-flex items-center gap-1">
                            <span>🏒</span>
                            <span>풀링크</span>
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs shrink-0 border border-slate-200/60 whitespace-nowrap inline-flex items-center gap-1">
                            <span>⛸️</span>
                            <span>미니링크</span>
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col mt-0.5 shadow-sm">
                          <span className="text-sm font-black text-slate-900 whitespace-nowrap">수원 아이스하우스</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                            경기 수원시 권선구 효탑로16번길 20 아이스하우스 아이스링크
                          </span>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#0066FF] font-bold flex-shrink-0">💡 사용법:</span>
                        <span className="text-slate-900 flex-shrink-0">[전국 링크장]</span>
                        <span className="text-slate-400 flex-shrink-0">➔</span>
                        <span className="text-slate-900 flex-shrink-0">필터 선택 및 구장 위치 확인</span>
                      </div>
                    </div>
                  )}

                  {/* S4 - SLIDE 4: SOLUTION 2 (LIVE RINK SCHEDULE & TO REPLICA) */}
                  {idx === 3 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>2️⃣ 구장별 사용 동호회 탐색</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-slate-900 flex flex-col shrink-0">
                        <span className="whitespace-nowrap">구장별 어떤 동호회가</span>
                        <span className="text-[#0066FF] whitespace-nowrap">언제 사용중인지 확인해보세요!</span>
                      </h2>

                      {/* 100% Authentic Rink Popup Card Replica from Attached Image (Compact) */}
                      <div className="rounded-2xl bg-white border border-slate-200 shadow-xl p-4 flex flex-col gap-3 w-full shrink-0">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-[18px] font-black text-slate-900 whitespace-nowrap">수원 아이스하우스</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">경기 수원시 권선구 효탑로16번길 20 아이스하우스 아이스링크</span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-slate-100">
                          <h4 className="text-[11px] font-bold text-slate-500 flex items-center gap-1 whitespace-nowrap">
                            <Users className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>주 이용 동호회</span>
                          </h4>
                          <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
                              레드이글스
                            </span>
                            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
                              수원이글스
                            </span>
                            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
                              위닝머신
                            </span>
                            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
                              피키스
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#0066FF] font-bold flex-shrink-0">💡 사용법:</span>
                        <span className="text-slate-900 flex-shrink-0">[전국 링크장]</span>
                        <span className="text-slate-400 flex-shrink-0">➔</span>
                        <span className="text-slate-900 flex-shrink-0">구장 선택 후 주 이용 동호회 확인</span>
                      </div>
                    </div>
                  )}

                  {/* S4 - SLIDE 5: CTA (LIGHT MODE) */}
                  {idx === 4 && (
                    <div className="flex flex-col justify-center items-center my-auto text-center w-full z-10 gap-7 py-2">
                      <div>
                        <h2 className="text-[24px] md:text-[26px] font-black leading-[1.3] tracking-tight text-slate-900 flex flex-col items-center">
                          <span className="whitespace-nowrap">전국 아이스링크 지도,</span>
                          <span className="whitespace-nowrap">지금 파워플레이에서</span>
                          <span className="text-[#0066FF] whitespace-nowrap">탐색해보세요.</span>
                        </h2>
                      </div>

                      <div className="flex flex-col items-center w-full gap-3">
                        <img
                          src="/long-logo.jpg"
                          alt="PowerPlay Official Logo"
                          className="h-11 md:h-12 w-auto mx-auto object-contain drop-shadow-sm mix-blend-multiply"
                        />
                        <div className="text-[14px] md:text-[15px] font-black text-[#0066FF] tracking-wide whitespace-nowrap">
                          &quot;아이스하키를 더 쉽게, 더 가깝게&nbsp;&nbsp;🏒&quot;
                        </div>
                      </div>

                      <div className="w-full pt-1">
                        <div className="w-full py-3.5 rounded-xl bg-[#0066FF] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition cursor-pointer whitespace-nowrap">
                          <span>프로필 링크에서 우리 동호회 시작하기</span> <ArrowRight className="w-4 h-4 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ========================================================= */}
              {/* SERIES 5 SLIDES (KAKAOTALK SHARE & SCOREBOARD - DARK)     */}
              {/* ========================================================= */}
              {activeTab === "series-5" && (
                <>
                  {/* S5 - SLIDE 1: COVER */}
                  {idx === 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D131A] via-[#141C26]/90 to-[#0D131A]/50 z-0" />

                      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-[98%] mx-auto z-10">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEE500] text-zinc-950 font-black text-xs tracking-tight mb-5 shadow-[0_0_15px_rgba(254,229,0,0.4)] whitespace-nowrap">
                          <span>💬 카톡 공유 & 원링크 상황판</span>
                        </div>
                        <h2 className="text-[24px] font-black leading-[1.4] tracking-tight text-white drop-shadow-md flex flex-col items-center">
                          <span className="whitespace-nowrap">단 하나의 링크 공유로</span>
                          <span className="whitespace-nowrap">카톡방 1초 간편 로그인과</span>
                          <span className="text-[#FEE500] whitespace-nowrap">실시간 상황판까지!</span>
                        </h2>
                      </div>
                    </>
                  )}

                  {/* S5 - SLIDE 2: EMPATHY */}
                  {idx === 1 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[#FEE500] font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>❓ 단톡방 공지의 스트레스</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">아직도 카톡방 공지 글에</span>
                        <span className="whitespace-nowrap">참석자 댓글 손으로 세고,</span>
                        <span className="text-[#FEE500] whitespace-nowrap">취소 명단 수정하고 계신가요?</span>
                      </h2>

                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col gap-2.5 w-full shrink-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-white whitespace-nowrap">
                          <span className="text-rose-400">❌</span> <span>투표 글 올리고 누가 입금했는지 일일이 대조</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-white whitespace-nowrap">
                          <span className="text-rose-400">❌</span> <span>취소자 생길 때마다 단톡방 명단 복사 후 재수정</span>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#FEE500] font-bold flex-shrink-0">💡 해결:</span>
                        <span className="text-white flex-shrink-0">카톡 전용 링크 공유로 자동 카운트 & 상황판!</span>
                      </div>
                    </div>
                  )}

                  {/* S5 - SLIDE 3: SOLUTION 1 (KAKAO SHARE & LOGIN REPLICA) */}
                  {idx === 2 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[#FEE500] font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>1️⃣ 카톡 1초 로그인 & 간편 공유</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">회원가입 스트레스 없이</span>
                        <span className="whitespace-nowrap">카카오 계정으로 <span className="text-[#FEE500]">1초 즉시 접속!</span></span>
                      </h2>

                      {/* 100% Authentic smart-share.tsx Replica */}
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-400/40 shadow-xl flex flex-col gap-2.5 w-full shrink-0">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="text-sm font-black text-white flex items-center gap-1.5">
                            <Share2 className="w-4 h-4 text-[#FEE500] shrink-0" />
                            <span>💬 카카오톡 원링크 공유</span>
                          </span>
                          <span className="text-[10px] bg-[#FEE500]/20 text-[#FEE500] font-bold px-2 py-0.5 rounded-md">1초 간편 로그인</span>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2 mt-0.5 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white">🏒 [경기 안내] 7월 5일(금) 22:00 제니스</span>
                            <span className="text-[11px] text-zinc-400 mt-0.5">참가비 30,000원 · 현재 플레이어 12/15명</span>
                          </div>
                          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-3 py-2.5 font-bold text-xs text-[#000000] shadow-sm">
                            <span>💬 카카오 1초 로그인 및 참석 신청</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#FEE500] font-bold flex-shrink-0">💡 사용법:</span>
                        <span className="text-white flex-shrink-0">[경기 상세]</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-white flex-shrink-0">&apos;카톡 공유&apos; 버튼으로 단톡방 전송</span>
                      </div>
                    </div>
                  )}

                  {/* S5 - SLIDE 4: SOLUTION 2 (LIVE SCOREBOARD REPLICA) */}
                  {idx === 3 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[#FEE500] font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>2️⃣ 실시간 플레이어·골리 상황판</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-white flex flex-col shrink-0">
                        <span className="whitespace-nowrap">신청 인원, 골리 TO 마감 여부,</span>
                        <span className="whitespace-nowrap">입금 확인까지 <span className="text-[#FEE500]">실시간 자동 업데이트!</span></span>
                      </h2>

                      {/* 100% Authentic admin-participant-list.tsx Replica */}
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-xl flex flex-col gap-2.5 w-full shrink-0">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="text-sm font-black text-white whitespace-nowrap">📊 실시간 참가자 명단</span>
                          <span className="text-xs text-emerald-400 font-bold whitespace-nowrap">골리 2/2 마감 🔒</span>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-0.5">
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 shadow-sm">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">김</div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-bold text-white truncate">김하키</span>
                                <span className="text-[10px] text-zinc-400">#88</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-700 text-zinc-300">FW</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-900/30 text-green-300 border border-green-800/50 shrink-0">확정</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 shadow-sm">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">박</div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-bold text-white truncate">박퍽</span>
                                <span className="text-[10px] text-zinc-400">#7</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-700 text-zinc-300">DF</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/30 text-amber-300 border border-amber-800/50 shrink-0">입금 대기</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 text-zinc-300 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#FEE500] font-bold flex-shrink-0">💡 사용법:</span>
                        <span className="text-white flex-shrink-0">공유된 링크 접속 시</span>
                        <span className="text-zinc-500 flex-shrink-0">➔</span>
                        <span className="text-[#FEE500] font-bold underline underline-offset-2 flex-shrink-0">실시간 인원 현황 즉시 확인!</span>
                      </div>
                    </div>
                  )}

                  {/* S5 - SLIDE 5: CTA */}
                  {idx === 4 && (
                    <div className="flex flex-col justify-center items-center my-auto text-center w-full z-10 gap-7 py-2">
                      <div>
                        <h2 className="text-[24px] md:text-[26px] font-black leading-[1.3] tracking-tight text-white flex flex-col items-center">
                          <span className="whitespace-nowrap">단톡방 공지 스트레스 제로,</span>
                          <span className="whitespace-nowrap">지금 파워플레이에서</span>
                          <span className="text-[#FEE500] whitespace-nowrap">원링크로 관리하세요.</span>
                        </h2>
                      </div>

                      <div className="flex flex-col items-center w-full gap-3">
                        <img
                          src="/long-logo-darkmode.png"
                          alt="PowerPlay Official Logo"
                          className="h-11 md:h-12 w-auto mx-auto object-contain drop-shadow-[0_0_15px_rgba(254,229,0,0.3)] mix-blend-screen"
                        />
                        <div className="text-[14px] md:text-[15px] font-black text-[#FEE500] tracking-wide drop-shadow-[0_0_10px_rgba(254,229,0,0.3)] whitespace-nowrap">
                          &quot;아이스하키를 더 쉽게, 더 가깝게&nbsp;&nbsp;🏒&quot;
                        </div>
                      </div>

                      <div className="w-full pt-1">
                        <div className="w-full py-3.5 rounded-xl bg-[#FEE500] text-zinc-950 font-black text-xs shadow-[0_0_20px_rgba(254,229,0,0.3)] flex items-center justify-center gap-2 hover:bg-yellow-400 transition cursor-pointer whitespace-nowrap">
                          <span>프로필 링크에서 우리 동호회 시작하기</span> <ArrowRight className="w-4 h-4 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ========================================================= */}
              {/* SERIES 6 SLIDES (YOUTH HOCKEY & COMMUNITY - LIGHT)        */}
              {/* ========================================================= */}
              {activeTab === "series-6" && (
                <>
                  {/* S6 - SLIDE 1: COVER */}
                  {idx === 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-100/60 via-white to-orange-50/50 z-0" />

                      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-[98%] mx-auto z-10">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F59E0B] text-white font-black text-xs tracking-tight mb-5 shadow-md whitespace-nowrap">
                          <span>👶 유소년 하키 라운지 & 커뮤니티</span>
                        </div>
                        <h2 className="text-[24px] font-black leading-[1.4] tracking-tight text-slate-900 drop-shadow-xs flex flex-col items-center">
                          <span className="whitespace-nowrap">우리 아이 하키 팀 탐색부터</span>
                          <span className="whitespace-nowrap">하키 맘·대디 소통까지</span>
                          <span className="text-[#F59E0B] whitespace-nowrap">파워플레이에서 시작하세요!</span>
                        </h2>
                      </div>
                    </>
                  )}

                  {/* S6 - SLIDE 2: EMPATHY */}
                  {idx === 1 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>❓ 하키맘·대디들의 정보 갈증</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-slate-900 flex flex-col shrink-0">
                        <span className="whitespace-nowrap">아이 하키 처음 시작할 때,</span>
                        <span className="whitespace-nowrap">클럽 선정과 장비 구매 조언</span>
                        <span className="text-[#F59E0B] whitespace-nowrap">어디서 알아보셨나요?</span>
                      </h2>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-md flex flex-col gap-2.5 w-full shrink-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap">
                          <span className="text-rose-500">❌</span> <span>전국 주니어 클럽 정보, 레슨, 훈련 시간 비교가 어려움</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap">
                          <span className="text-rose-500">❌</span> <span>스케이트 사이즈, 레슨 정보를 물어볼 학부모 소통 공간 부재</span>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#F59E0B] font-bold flex-shrink-0">💡 해결:</span>
                        <span className="text-slate-900 flex-shrink-0">검증된 학부모님들과 실시간 Q&A 라운지!</span>
                      </div>
                    </div>
                  )}

                  {/* S6 - SLIDE 3: SOLUTION 1 (YOUTH CLUB CARD REPLICA - LIGHT) */}
                  {idx === 2 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>1️⃣ 주니어 클럽 & 유소년 레슨 탐색</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-slate-900 flex flex-col shrink-0">
                        <span className="whitespace-nowrap">전국 유소년 하키 팀, 레슨 정보 및</span>
                        <span className="whitespace-nowrap">정기 훈련 링크장 <span className="text-[#F59E0B]">한눈에 비교!</span></span>
                      </h2>

                      {/* 100% Authentic club-card.tsx Replica (Light Mode) */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col justify-between gap-3 w-full shrink-0">
                        <div>
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                                👶
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 leading-snug">파워플레이 유소년 하키단</span>
                                <span className="text-[11px] text-amber-600 font-bold leading-snug">주니어 클럽 & 유소년 전문 레슨</span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-200">
                              <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                              <span>이번 달 342표</span>
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <div className="flex flex-col gap-0.5 text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                              <span className="font-bold text-[11px]">제니스 아이스링크 고척</span>
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                                <MapPin className="w-2.5 h-2.5 shrink-0" /> 서울 구로구
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                              <span className="font-bold text-[11px]">광교 아이스링크</span>
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                                <MapPin className="w-2.5 h-2.5 shrink-0" /> 경기 수원시
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <div className="flex-1 rounded-lg px-3 py-2 text-center text-xs font-bold bg-rose-100 text-zinc-900 shadow-xs">
                            <span className="inline-flex items-center justify-center gap-1">
                              <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                              <span>응원 투표</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1 rounded-lg bg-[#FEE500] px-3 py-2 text-xs font-black text-black shadow-xs">
                            <span>💬 카톡 문의</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#F59E0B] font-bold flex-shrink-0">💡 사용법:</span>
                        <span className="text-slate-900 flex-shrink-0">[유소년 하키]</span>
                        <span className="text-slate-400 flex-shrink-0">➔</span>
                        <span className="text-slate-900 flex-shrink-0">전국 유소년 클럽 정보 비교 및 상담</span>
                      </div>
                    </div>
                  )}

                  {/* S6 - SLIDE 4: SOLUTION 2 (PARENT COMMUNITY Q&A REPLICA - LIGHT) */}
                  {idx === 3 && (
                    <div className="flex flex-col justify-center my-auto w-full z-10 gap-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-[11px] w-fit whitespace-nowrap shrink-0">
                        <span>2️⃣ 하키맘·대디 실시간 Q&A</span>
                      </div>
                      <h2 className="text-[20px] md:text-[22px] font-black leading-[1.3] tracking-tight text-slate-900 flex flex-col shrink-0">
                        <span className="whitespace-nowrap">스케이트 조언, 장비 팁, 대회 후기까지</span>
                        <span className="whitespace-nowrap"><span className="text-[#F59E0B]">검증된 학부모님들</span>과 나누는 소통!</span>
                      </h2>

                      {/* Authentic Parent Community Post Replica (Light Mode) */}
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col gap-2 w-full shrink-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 text-[10px] font-bold">장비 Q&A</span> 10살 아이 스케이트 사이즈 조언 부탁드려요!</span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium line-clamp-2 pt-0.5 leading-snug">
                          &quot;발 사이즈가 210인데 바우어 슈프림이나 베이퍼 중 어떤 모델이 처음 타는 아이에게 편할까요?&quot;
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> 🏅 하키맘 3년차</span>
                          <span className="flex items-center gap-2 text-slate-500"><span className="flex items-center gap-0.5"><Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> 18</span><span>💬 12</span></span>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700 w-fit mx-auto whitespace-nowrap shrink-0 mt-0.5">
                        <span className="text-[#F59E0B] font-bold flex-shrink-0">💡 사용법:</span>
                        <span className="text-slate-900 flex-shrink-0">[유소년 하키]</span>
                        <span className="text-slate-400 flex-shrink-0">➔</span>
                        <span className="text-slate-900 flex-shrink-0">커뮤니티에서 질문글 작성 & 답변 확인</span>
                      </div>
                    </div>
                  )}

                  {/* S6 - SLIDE 5: CTA (LIGHT MODE) */}
                  {idx === 4 && (
                    <div className="flex flex-col justify-center items-center my-auto text-center w-full z-10 gap-7 py-2">
                      <div>
                        <h2 className="text-[24px] md:text-[26px] font-black leading-[1.3] tracking-tight text-slate-900 flex flex-col items-center">
                          <span className="whitespace-nowrap">우리 아이 하키 라이프,</span>
                          <span className="whitespace-nowrap">지금 파워플레이에서</span>
                          <span className="text-[#F59E0B] whitespace-nowrap">함께 시작하세요.</span>
                        </h2>
                      </div>

                      <div className="flex flex-col items-center w-full gap-3">
                        <img
                          src="/long-logo.jpg"
                          alt="PowerPlay Official Logo"
                          className="h-11 md:h-12 w-auto mx-auto object-contain drop-shadow-sm mix-blend-multiply"
                        />
                        <div className="text-[14px] md:text-[15px] font-black text-[#F59E0B] tracking-wide whitespace-nowrap">
                          &quot;아이스하키를 더 쉽게, 더 가깝게&nbsp;&nbsp;🏒&quot;
                        </div>
                      </div>

                      <div className="w-full pt-1">
                        <div className="w-full py-3.5 rounded-xl bg-[#F59E0B] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-amber-600 transition cursor-pointer whitespace-nowrap">
                          <span>프로필 링크에서 유소년 라운지 가기</span> <ArrowRight className="w-4 h-4 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
