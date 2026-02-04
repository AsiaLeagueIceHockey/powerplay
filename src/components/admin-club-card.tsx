"use client";

import { useState } from "react";
import Link from "next/link";
import { Club } from "@/app/actions/types";
import { Users, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface AdminClubCardProps {
  club: Club;
}

export function AdminClubCard({ club }: AdminClubCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("admin.clubs");
  const locale = useLocale();

  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="font-medium text-lg flex items-center gap-2">
            {club.name}
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Users className="w-4 h-4" />
              {t("members", { count: club.member_count || 0 })}
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {club.kakao_open_chat_url && (
              <a
                href={club.kakao_open_chat_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-yellow-400 hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                {t("openChat")}
              </a>
            )}
          </div>
        </div>
        <Link
          href={`/${locale}/admin/clubs/${club.id}/edit`}
          className="text-sm text-blue-400 hover:underline whitespace-nowrap"
        >
          {t("edit")}
        </Link>
      </div>

      {/* Member List Dropdown */}
      {isExpanded && (
        <div className="bg-zinc-900/50 border-t border-zinc-700 p-4 animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-semibold text-zinc-400 mb-3">
            {t("membersTitle", { count: club.member_count || 0 })}
          </h4>
          
          {club.members && club.members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {club.members.map((member, idx) => (
                <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded p-2 text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                    {member.full_name?.[0] || "?"}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-medium text-white truncate">{member.full_name || "Unknown"}</div>
                    <div className="text-xs text-zinc-500 truncate">{member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">
               {locale === "ko" ? "멤버가 없습니다." : "No members found."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
