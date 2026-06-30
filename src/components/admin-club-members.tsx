"use client";

import { useEffect, useState } from "react";
import { getClubMembersList, updateClubMemberRole, removeClubMember } from "@/app/actions/clubs";
import { Shield, User, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

interface AdminClubMembersProps {
  clubId: string;
}

type ClubMember = {
  id: string;
  user_id: string;
  role: "admin" | "member";
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    position: string | null;
  } | null;
};

export function AdminClubMembers({ clubId }: AdminClubMembersProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    loadMembers();
  }, [clubId]);

  const loadMembers = async () => {
    setLoading(true);
    const result = await getClubMembersList(clubId);
    if (result.members) {
      setMembers(result.members as any);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "member") => {
    const isPromoting = newRole === "admin";
    const msg = locale === "ko" 
      ? (isPromoting ? "이 멤버를 운영진으로 승격하시겠습니까?\n승격된 멤버는 동호회 경기를 생성할 수 있게 됩니다." : "운영진 권한을 해제하시겠습니까?")
      : (isPromoting ? "Promote this member to admin?\nThey will be able to create club matches." : "Revoke admin role?");
      
    if (!confirm(msg)) return;
    
    setActionLoadingId(userId);
    const result = await updateClubMemberRole(clubId, userId, newRole);
    if (result.error) {
      alert(result.error);
    } else {
      await loadMembers();
    }
    setActionLoadingId(null);
  };

  const handleRemove = async (userId: string) => {
    if (!confirm(locale === "ko" ? "이 멤버를 내보내시겠습니까?" : "Remove this member?")) return;
    
    setActionLoadingId(userId);
    const result = await removeClubMember(clubId, userId);
    if (result.error) {
      alert(result.error);
    } else {
      await loadMembers();
    }
    setActionLoadingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const admins = members.filter(m => m.role === "admin");
  const regulars = members.filter(m => m.role === "member");

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          운영진 권한 안내
        </h4>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          멤버를 운영진으로 승격하면, 해당 멤버도 동호회 정보 수정 및 <strong>새로운 동호회 경기를 생성/관리할 수 있는 권한</strong>을 갖게 됩니다. 신뢰할 수 있는 멤버만 승격해주세요.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-blue-500" />
          운영진 <span className="text-sm font-normal text-zinc-500">{admins.length}명</span>
        </h3>
        <div className="space-y-2">
          {admins.map(member => (
            <MemberRow 
              key={member.id} 
              member={member} 
              actionLoading={actionLoadingId === member.user_id}
              onDemote={() => handleRoleChange(member.user_id, "member")}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-zinc-500" />
          멤버 <span className="text-sm font-normal text-zinc-500">{regulars.length}명</span>
        </h3>
        {regulars.length === 0 ? (
          <p className="text-zinc-500 text-sm py-4 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">일반 멤버가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {regulars.map(member => (
              <MemberRow 
                key={member.id} 
                member={member} 
                actionLoading={actionLoadingId === member.user_id}
                onPromote={() => handleRoleChange(member.user_id, "admin")}
                onRemove={() => handleRemove(member.user_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberRow({ 
  member, 
  actionLoading, 
  onPromote, 
  onDemote, 
  onRemove 
}: { 
  member: ClubMember; 
  actionLoading: boolean;
  onPromote?: () => void;
  onDemote?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800 border border-zinc-700 rounded-xl shadow-sm">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">
            {member.profiles?.full_name || "이름 없음"}
          </span>
          {member.profiles?.position && (
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">
              {member.profiles.position}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-400 mt-0.5">{member.profiles?.email}</span>
      </div>

      <div className="flex items-center gap-2">
        {actionLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        ) : (
          <>
            {onDemote && (
              <button 
                onClick={onDemote}
                className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 transition border border-amber-900/50"
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                운영진 해제
              </button>
            )}
            
            {onPromote && (
              <button 
                onClick={onPromote}
                className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition border border-blue-900/50"
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                운영진 승격
              </button>
            )}
            
            {onRemove && (
              <button 
                onClick={onRemove}
                className="text-xs flex items-center justify-center w-7 h-7 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition border border-red-900/30"
                title="내보내기"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
