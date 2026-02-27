"use client";

import { Club } from "@/app/actions/types";
import { joinClub } from "@/app/actions/clubs";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { MessageCircle, Users, Building2, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { extractRegion } from "@/lib/rink-utils";

interface ClubCardProps {
  club: Club;
  initialIsMember: boolean;
}

export function ClubCard({ club, initialIsMember }: ClubCardProps) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const locale = useLocale();
  const router = useRouter();

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMember) return;
    
    if (!confirm(locale === "ko" ? "이 동호회에 가입하시겠습니까?" : "Do you want to join this club?")) {
      return;
    }

    setLoading(true);
    const res = await joinClub(club.id);
    
    if (res.error) {
      if (res.error === "Not authenticated") {
         alert(locale === "ko" ? "로그인이 필요합니다." : "Please login first.");
      } else {
         alert(locale === "ko" ? "가입 실패: " + res.error : "Failed to join: " + res.error);
      }
    } else {
      setIsMember(true);
      alert(locale === "ko" ? "가입되었습니다!" : "Successfully joined!");
    }
    setLoading(false);
  };
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }

  return (
    <div
      onClick={() => router.push(`/${locale}/clubs/${club.id}`)}
      className="block flex flex-col justify-between h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all duration-300 shadow-sm cursor-pointer"
    >
      <div>
        {/* Logo + Header */}
        <div className="flex gap-3 items-start mb-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
            {club.logo_url ? (
              <Image 
                src={club.logo_url} 
                alt={club.name} 
                width={48} 
                height={48} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white line-clamp-1">{club.name}</h3>
              {club.member_count !== undefined && (
                <span className="flex items-center text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full shrink-0 ml-2">
                  <Users className="w-3 h-3 mr-1" />
                  {club.member_count}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description with Expand/Collapse */}
        <div className="relative mb-4">
             <p className={`text-sm text-zinc-600 dark:text-zinc-400 transition-all ${isExpanded ? "" : "line-clamp-2"}`}>
                {club.description || (locale === "ko" ? "소개글이 없습니다." : "No description yet.")}
             </p>
             
             {/* Simple logic: if description is long enough to potentially clamp (rough heuristic or always show if content exists) */
             /* Since we can't easily detect line overflow in SSR/hydration safe way without complex observation, 
                we'll show the toggle if there is a description. Ideally we'd measure. 
                For now, let's assume if length > 50 chars it might need expanding or just always allow expanding if description exists.
             */}
             {club.description && club.description.length > 50 && (
                <button 
                    onClick={toggleExpand}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 mt-1 font-medium bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    {isExpanded ? (
                        <>
                            {locale === "ko" ? "접기" : "Show Less"} <ChevronUp className="w-3 h-3" />
                        </>
                    ) : (
                        <>
                           {locale === "ko" ? "더보기" : "Show More"} <ChevronDown className="w-3 h-3" />
                        </>
                    )}
                </button>
             )}
        </div>
        
        {/* Rinks */}
        {club.rinks && club.rinks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
                {club.rinks.slice(0, 3).map(rink => {
                    const region = extractRegion(rink.address);
                    return (
                        <span key={rink.id} className="flex flex-col gap-0.5 text-xs px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <span className="font-medium">{locale === "ko" ? rink.name_ko : rink.name_en}</span>
                            {region && (
                                <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    {region}
                                </span>
                            )}
                        </span>
                    );
                })}
                {club.rinks.length > 3 && (
                    <span className="text-xs px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center">
                        +{club.rinks.length - 3}
                    </span>
                )}
            </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={isMember || loading}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            isMember
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-default"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          }`}
        >
          {loading
            ? "..."
            : isMember
            ? locale === "ko"
              ? "가입됨"
              : "Joined"
            : locale === "ko"
            ? "참여하기"
            : "Join"}
        </button>

        {/* Kakao Link */}
        {club.kakao_open_chat_url && (
          <a
            href={club.kakao_open_chat_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-10 h-10 bg-[#FAE100] text-[#371D1E] rounded-lg hover:bg-[#FCE620] transition-colors"
            title="KakaoTalk Open Chat"
          >
             <MessageCircle className="w-5 h-5 fill-current" />
          </a>
        )}
      </div>
    </div>
  );
}
