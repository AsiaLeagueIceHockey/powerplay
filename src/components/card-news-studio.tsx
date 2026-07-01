"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Check, Sparkles, Users, Calendar, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";

interface SlideData {
  id: string;
  title: string;
  subtitle?: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

const SLIDES: SlideData[] = [
  {
    id: "slide-1",
    title: "총무 혼자 대관 올리고\n관리하는 시대는 끝났다! 🔥",
    subtitle: "파워플레이 '동호회 운영진 승격' & 간편 일정 생성 업데이트",
    bgColor: "bg-slate-900",
    textColor: "text-white",
    accentColor: "text-yellow-400",
  },
  {
    id: "slide-2",
    title: "\"이번 달 4주 치 경기 안내 카톡 쓰고,\n게스트 구하고, 인원 파악하고...\"",
    subtitle: "동호회 회장님·총무님,\n운동하러 와서 관리 업무만 하느라 지치셨죠?\n이제 링크 하나로 10배 편하게 운영하세요.",
    bgColor: "bg-black",
    textColor: "text-white",
    accentColor: "text-sky-400",
  },
  {
    id: "slide-3",
    title: "7월 대관 경기, 하나하나\n올리기 귀찮으셨다면?",
    subtitle: "'일정 복사'와 '간편 경기 생성' 기능으로\n같은 요일, 같은 시간, 같은 링크장의 정기 운동을\n한 달 치 일정 단 30초 만에 업로드 완료!\n더 이상 게시글 작성에 시간을 낭비하지 마세요.",
    bgColor: "bg-blue-950",
    textColor: "text-white",
    accentColor: "text-yellow-400",
  },
  {
    id: "slide-4",
    title: "회장 혼자 다 하지 마세요!\n멤버를 '운영진'으로 승격하세요 🤝",
    subtitle: "믿음직한 팀원에게 '동호회 운영진 권한'을 부여하세요!\n승격된 운영진은 경기 생성부터 TO 관리, 공지 작성까지\n개설자와 완벽히 동일한 권한으로 함께 동호회를 관리합니다.",
    bgColor: "bg-purple-950",
    textColor: "text-white",
    accentColor: "text-green-400",
  },
  {
    id: "slide-5",
    title: "올리는 건 30초,\n관리는 10배 편해지는 파워플레이 🧊",
    subtitle: "지금 바로 우리 동호회의 7월 일정을 등록하고\n스마트한 아이스하키 동호회 운영을 시작해 보세요!\n\n👉 프로필 링크에서 동호회 일정 등록하기",
    bgColor: "bg-blue-600",
    textColor: "text-white",
    accentColor: "text-yellow-300",
  },
];

export function CardNewsStudio() {
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadAllProgress, setDownloadAllProgress] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDownloadSingle = async (index: number) => {
    const el = slideRefs.current[index];
    if (!el) return;
    try {
      setDownloadingIndex(index);
      const ratio = 1080 / el.offsetWidth;
      const dataUrl = await toPng(el, {
        quality: 0.95,
        pixelRatio: ratio,
        style: {
          transform: "none",
        },
      });
      const link = document.createElement("a");
      link.download = `powerplay-cardnews-s1-slide-${index + 1}.png`;
      link.href = dataUrl;
      link.click();
      setSuccessMsg(`슬라이드 ${index + 1} 다운로드 완료!`);
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
      for (let i = 0; i < SLIDES.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const ratio = 1080 / el.offsetWidth;
        const dataUrl = await toPng(el, {
          quality: 0.95,
          pixelRatio: ratio,
          style: { transform: "none" },
        });
        const link = document.createElement("a");
        link.download = `powerplay-cardnews-s1-slide-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        await new Promise((r) => setTimeout(r, 600)); // gap between downloads
      }
      setSuccessMsg("🎉 시리즈 1 전체 슬라이드(5장) 다운로드 완료!");
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
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            인스타 마케팅 스튜디오 (1080x1080)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Series 1: 운영진 구원 1탄 (간편 개설 & 운영진 승격)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            플랩풋볼 스타일 고대비 카드뉴스. 웹 브라우저에서 바로 확인하고 1080x1080 고화질 PNG로 다운로드하세요.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadAll}
            disabled={downloadAllProgress}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 animate-bounce" />
            {downloadAllProgress ? "전체 다운로드 중..." : "전체 슬라이드 PNG로 저장 (5장)"}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 font-medium animate-fade-in">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Grid of Slides */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SLIDES.map((slide, idx) => (
          <div key={slide.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm text-zinc-400 font-medium px-1">
              <span>Slide #{idx + 1}</span>
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
              className={`w-full aspect-square relative overflow-hidden rounded-2xl ${slide.bgColor} ${slide.textColor} flex flex-col justify-between p-8 md:p-10 shadow-2xl border border-white/10 select-none`}
              style={{ fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}
            >
              {/* SLIDE 1: COVER */}
              {idx === 0 && (
                <>
                  {/* Background Image overlay if available */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen pointer-events-none"
                    style={{ backgroundImage: "url('/marketing/cardnews_s1_cover_bg.png')" }}
                  />
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      <div className="inline-block px-3 py-1 rounded-md bg-yellow-400 text-black font-black text-xs tracking-wider uppercase mb-6 shadow-md">
                        POWER PLAY EXCLUSIVE
                      </div>
                      <h2 className={`text-3xl md:text-4xl font-black leading-tight tracking-tight whitespace-pre-line ${slide.accentColor} drop-shadow-lg`}>
                        {slide.title}
                      </h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700/80 shadow-xl">
                        <div className="flex items-center gap-3 text-sm font-bold text-white mb-1">
                          <Users className="w-5 h-5 text-yellow-400" />
                          동호회 운영진 다중 승격 & 간편 대관 등록
                        </div>
                        <p className="text-xs text-slate-300">
                          수도권 아이스하키 동호회 운영진 필수 업데이트!
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black tracking-tighter text-white/80">POWER PLAY</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* SLIDE 2: PROBLEM */}
              {idx === 1 && (
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">
                      THE REALITY OF CLUB ADMINS
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold leading-snug tracking-tight text-white whitespace-pre-line">
                      {slide.title}
                    </h2>
                  </div>

                  {/* Mockup UI: KakaoTalk Chat & Excel */}
                  <div className="my-auto space-y-3 py-4">
                    <div className="p-3.5 rounded-2xl bg-[#FEE500] text-zinc-900 font-medium text-xs shadow-lg max-w-[85%] self-start relative border border-yellow-500">
                      <div className="font-bold text-[10px] text-zinc-600 mb-0.5">총무님 (단톡방 공지)</div>
                      이번주 금요일 22시 목동 대관 참석자 투표해주세요! 입금 후 톡 주셔야 확정입니다~ 😭
                    </div>
                    <div className="p-3.5 rounded-2xl bg-zinc-800 text-zinc-300 text-xs shadow-lg max-w-[80%] ml-auto border border-zinc-700">
                      <div className="font-bold text-[10px] text-zinc-500 mb-0.5">참가자 A</div>
                      저 금요일 야근이라 당일 오후에 보고 말씀드릴게요ㅠㅠ
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <p className={`text-sm font-bold leading-relaxed whitespace-pre-line ${slide.accentColor}`}>
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 3: SOLUTION 1 (EASY REGISTRATION) */}
              {idx === 2 && (
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-bold text-xs mb-3">
                      <Calendar className="w-3.5 h-3.5" /> SOLUTION 1
                    </div>
                    <h2 className={`text-2xl md:text-3xl font-black leading-tight tracking-tight whitespace-pre-line ${slide.accentColor}`}>
                      {slide.title}
                    </h2>
                  </div>

                  {/* Mockup UI: Monthly Match Creation */}
                  <div className="my-auto py-3">
                    <div className="p-4 rounded-xl bg-blue-900/60 border border-blue-400/30 backdrop-blur shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-400/20 pb-2">
                        <span className="text-xs font-extrabold text-blue-200">7월 정기 대관 일정 등록</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white font-bold">간편 모드</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-blue-100">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-yellow-400" />
                          <span>매주 금요일 22:00 ~ 23:30 (목동 아이스링크)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-yellow-400" />
                          <span>지난달 설정(참가비 30,000 P, 정원 20명) 그대로</span>
                        </div>
                      </div>
                      <div className="pt-1">
                        <div className="w-full py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-center text-xs shadow">
                          ⚡ 한 달 치 4경기 1초 만에 복사 & 생성 완료
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm font-medium leading-relaxed text-blue-100 whitespace-pre-line">
                    {slide.subtitle}
                  </p>
                </div>
              )}

              {/* SLIDE 4: SOLUTION 2 (ADMIN DELEGATION) */}
              {idx === 3 && (
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold text-xs mb-3">
                      <UserCheck className="w-3.5 h-3.5" /> SOLUTION 2
                    </div>
                    <h2 className={`text-2xl md:text-3xl font-black leading-tight tracking-tight whitespace-pre-line ${slide.accentColor}`}>
                      {slide.title}
                    </h2>
                  </div>

                  {/* Mockup UI: Admin Promote Button */}
                  <div className="my-auto py-3">
                    <div className="p-4 rounded-xl bg-purple-900/60 border border-purple-400/30 backdrop-blur shadow-xl space-y-3">
                      <div className="text-xs font-bold text-purple-200 mb-1">동호회 멤버 명단 및 권한 관리</div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-950/80 border border-purple-700/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                            K
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">김하키 (FW #88)</div>
                            <div className="text-[10px] text-purple-300">동호회 일반 멤버</div>
                          </div>
                        </div>
                        <button className="px-2.5 py-1 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold text-[11px] shadow-md flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 운영진 승격
                        </button>
                      </div>
                      <div className="text-[11px] text-purple-200 bg-purple-800/40 p-2 rounded border border-purple-600/30">
                        💡 승격된 멤버는 경기 생성, 참가자 확인, 대기자 관리 등을 회장과 똑같이 수행할 수 있습니다!
                      </div>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm font-medium leading-relaxed text-purple-100 whitespace-pre-line">
                    {slide.subtitle}
                  </p>
                </div>
              )}

              {/* SLIDE 5: CTA */}
              {idx === 4 && (
                <div className="relative z-10 flex flex-col justify-between h-full text-center items-center">
                  <div className="w-full pt-4">
                    <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-bold text-xs mb-4 backdrop-blur">
                      ICE HOCKEY COMMUNITY PLATFORM
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-white whitespace-pre-line drop-shadow">
                      {slide.title}
                    </h2>
                  </div>

                  {/* Logo or Graphic */}
                  <div className="my-auto py-6 w-full flex flex-col items-center">
                    <div className="w-24 h-24 rounded-3xl bg-white text-blue-600 flex items-center justify-center font-black text-3xl shadow-2xl mb-4 border-4 border-yellow-400">
                      PP
                    </div>
                    <div className="text-2xl font-black tracking-tighter text-white">
                      POWER PLAY
                    </div>
                    <div className="text-xs font-bold text-blue-200 mt-1">
                      대한민국 아이스하키 동호회 1등 필수 앱
                    </div>
                  </div>

                  <div className="w-full space-y-3 pb-2">
                    <p className={`text-sm font-extrabold leading-relaxed whitespace-pre-line ${slide.accentColor}`}>
                      {slide.subtitle}
                    </p>
                    <div className="w-full py-3 rounded-xl bg-white text-blue-700 font-black text-sm shadow-xl flex items-center justify-center gap-2">
                      프로필 링크에서 우리 동호회 등록하기 <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
