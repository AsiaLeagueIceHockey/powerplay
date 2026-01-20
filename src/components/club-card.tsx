"use client";

import { Club } from "@/app/actions/types";
import { joinClub } from "@/app/actions/clubs";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { MessageCircle, Users, Building2 } from "lucide-react";

interface ClubCardProps {
  club: Club;
  initialIsMember: boolean;
}

export function ClubCard({ club, initialIsMember }: ClubCardProps) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [loading, setLoading] = useState(false);
  const locale = useLocale();

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

  return (
    <Link
      href={`/${locale}/clubs/${club.id}`}
      className="block flex flex-col justify-between h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all duration-300 shadow-sm"
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

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2 min-h-[40px]">
          {club.description || (locale === "ko" ? "소개글이 없습니다." : "No description yet.")}
        </p>
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
    </Link>
  );
}
