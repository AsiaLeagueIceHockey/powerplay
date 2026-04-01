"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, User, Phone, Calendar, CreditCard, Shield, X } from "lucide-react";
import type { UserProfile } from "@/app/actions/superuser";
import { CopyButton } from "./copy-button";

interface UserManagementTabProps {
  initialUsers: UserProfile[];
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  superuser: { label: "슈퍼유저", className: "bg-amber-500/20 text-amber-400 border border-amber-500/40" },
  admin: { label: "관리자", className: "bg-blue-500/20 text-blue-400 border border-blue-500/40" },
  user: { label: "유저", className: "bg-zinc-700/60 text-zinc-400 border border-zinc-600" },
};

const POSITION_LABEL: Record<string, string> = {
  FW: "FW",
  DF: "DF",
  G: "G",
  LW: "LW",
  C: "C",
  RW: "RW",
  LD: "LD",
  RD: "RD",
  UNDECIDED: "미정",
};

function formatDateKST(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// User Detail Modal
function UserDetailModal({
  user,
  onClose,
}: {
  user: UserProfile;
  onClose: () => void;
}) {
  const roleInfo = ROLE_BADGE[user.role] ?? ROLE_BADGE.user;

  const clubObj = user.club as any;
  const clubName = Array.isArray(clubObj) ? clubObj[0]?.name : clubObj?.name;

  const formatExperience = (dateString?: string | null) => {
    if (!dateString) return "-";
    const start = new Date(dateString);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths < 1) return "1개월 미만";
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months}개월`;
    return `${years}년 ${months}개월`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-300">
              {user.full_name?.charAt(0) || <User className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-semibold text-white text-lg">{user.full_name || "이름 없음"}</p>
              <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Role & Position */}
          <div className="flex gap-3 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleInfo.className}`}>
              {roleInfo.label}
            </span>
            {user.position && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-zinc-700/60 text-zinc-300 border border-zinc-600">
                {POSITION_LABEL[user.position] ?? user.position}
              </span>
            )}
            {user.preferred_lang && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-zinc-700/60 text-zinc-300 border border-zinc-600">
                {user.preferred_lang === "ko" ? "🇰🇷 한국어" : "🇺🇸 English"}
              </span>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
              <p className="text-xs text-zinc-500 mb-1">자기소개</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={<Phone className="w-4 h-4" />} label="전화번호" value={user.phone || "-"} isPhone />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="생년월일" value={user.birth_date || "-"} />
            <InfoItem
              icon={<CreditCard className="w-4 h-4" />}
              label="충전금액"
              value={`${(user.points || 0).toLocaleString()}원`}
              highlight
            />
            <InfoItem icon={<Shield className="w-4 h-4" />} label="역할" value={roleInfo.label} />
            
            {/* New Hockey Info */}
            <InfoItem icon={<User className="w-4 h-4" />} label="소속팀" value={clubName || "소속팀 없음"} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="구력" value={formatExperience(user.hockey_start_date)} />
            <InfoItem 
              icon={<User className="w-4 h-4" />} 
              label="스틱 방향" 
              value={user.stick_direction?.toUpperCase() === "LEFT" ? "레프트" : user.stick_direction?.toUpperCase() === "RIGHT" ? "라이트" : "-"} 
            />
            <InfoItem 
              icon={<User className="w-4 h-4" />} 
              label="상세 포지션" 
              value={user.detailed_positions && user.detailed_positions.length > 0 
                ? user.detailed_positions.map(p => POSITION_LABEL[p] || p).join(", ") 
                : "-"} 
            />
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">가입일</span>
              <span className="text-zinc-400 font-mono">{formatDateKST(user.created_at)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">마지막 업데이트</span>
              <span className="text-zinc-400 font-mono">{formatDateKST(user.updated_at)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">ID</span>
              <span className="text-zinc-600 font-mono text-[10px] truncate max-w-[240px]">{user.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  highlight,
  isPhone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  isPhone?: boolean;
}) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
      <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      {isPhone && value !== "-" ? (
        <div className="flex items-center justify-between gap-2">
          <a href={`tel:${value}`} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
            {value}
          </a>
          <CopyButton text={value} showText={false} />
        </div>
      ) : (
        <p className={`text-sm font-medium ${highlight ? "text-emerald-400" : "text-zinc-200"}`}>{value}</p>
      )}
    </div>
  );
}

export function UserManagementTab({ initialUsers }: UserManagementTabProps) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [sortField, setSortField] = useState<keyof UserProfile>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = !q
      ? initialUsers
      : initialUsers.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            (u.full_name?.toLowerCase().includes(q) ?? false) ||
            (u.phone?.toLowerCase().includes(q) ?? false)
        );

    result = [...result].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [initialUsers, search, sortField, sortAsc]);

  function handleSort(field: keyof UserProfile) {
    if (sortField === field) {
      setSortAsc((v) => !v);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function SortIcon({ field }: { field: keyof UserProfile }) {
    if (sortField !== field) return null;
    return sortAsc ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3">
          <p className="text-xs text-zinc-500">전체 유저</p>
          <p className="text-2xl font-bold text-white">{initialUsers.length}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3">
          <p className="text-xs text-zinc-500">관리자</p>
          <p className="text-2xl font-bold text-blue-400">
            {initialUsers.filter((u) => u.role === "admin" || u.role === "superuser").length}
          </p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3">
          <p className="text-xs text-zinc-500">총 충전금액</p>
          <p className="text-2xl font-bold text-emerald-400">
            {initialUsers.reduce((sum, u) => sum + (u.points || 0), 0).toLocaleString()}원
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 이메일, 전화번호 검색..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th
                  className="px-5 py-3.5 font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors whitespace-nowrap"
                  onClick={() => handleSort("full_name")}
                >
                  이름 <SortIcon field="full_name" />
                </th>
                <th className="px-5 py-3.5 font-medium text-zinc-400 whitespace-nowrap">이메일</th>
                <th className="px-5 py-3.5 font-medium text-zinc-400 whitespace-nowrap">전화번호</th>
                <th
                  className="px-5 py-3.5 font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors whitespace-nowrap"
                  onClick={() => handleSort("role")}
                >
                  역할 <SortIcon field="role" />
                </th>
                <th
                  className="px-5 py-3.5 font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors whitespace-nowrap"
                  onClick={() => handleSort("points")}
                >
                  충전금액 <SortIcon field="points" />
                </th>
                <th
                  className="px-5 py-3.5 font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors whitespace-nowrap"
                  onClick={() => handleSort("created_at")}
                >
                  가입일 <SortIcon field="created_at" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const roleInfo = ROLE_BADGE[user.role] ?? ROLE_BADGE.user;
                  return (
                    <tr
                      key={user.id}
                      className="group hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                            {user.full_name?.charAt(0) || "?"}
                          </div>
                          <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                            {user.full_name || "이름 없음"}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 text-zinc-400 font-mono text-xs">
                        {user.email}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 text-zinc-400 text-sm">
                        {user.phone ? (
                          <div 
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a 
                              href={`tel:${user.phone}`} 
                              className="hover:text-blue-400 underline decoration-zinc-700 underline-offset-4 decoration-dashed transition-colors"
                            >
                              {user.phone}
                            </a>
                            <CopyButton text={user.phone} showText={false} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ) : (
                          <span className="text-zinc-700">-</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${roleInfo.className}`}>
                          {roleInfo.label}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="px-5 py-3.5 text-sm">
                        <span
                          className={`font-semibold ${(user.points || 0) > 0 ? "text-emerald-400" : "text-zinc-600"}`}
                        >
                          {(user.points || 0).toLocaleString()}원
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5 text-zinc-500 text-xs">
                        {formatDateOnly(user.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/30">
          <p className="text-xs text-zinc-500">
            {filtered.length === initialUsers.length
              ? `총 ${initialUsers.length}명`
              : `${filtered.length}명 검색됨 (전체 ${initialUsers.length}명)`}
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
