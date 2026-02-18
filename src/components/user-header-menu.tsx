"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { DeleteAccountModal } from "./delete-account-modal";
import { useNotification } from "@/contexts/notification-context";
import { useTranslations } from "next-intl";

import { CircleDollarSign, User as UserIcon, ChevronDown, Wrench, Bell, LogOut, Ticket, MessageCircle } from "lucide-react";

interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export function UserHeaderMenu({
  user,
  locale,
  isAdmin,
  points = 0,
  initialUnreadCount = 0,
}: {
  user: User | null;
  locale: string;
  isAdmin: boolean;
  points?: number;
  initialUnreadCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const tPoints = useTranslations("points");
  const tChat = useTranslations("chat");
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { openGuide } = useNotification();
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Update unread count when initialUnreadCount changes
  useEffect(() => {
    setUnreadCount(initialUnreadCount || 0);
  }, [initialUnreadCount]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle locale switch
  const switchLocale = (newLocale: string) => {
    // Replace the locale segment in the pathname
    const segments = pathname.split("/");
    // segments[0] is empty, segments[1] is locale
    segments[1] = newLocale;
    const newPath = segments.join("/");
    router.push(newPath);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <Link
        href={`/${locale}/login`}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
      >
        {locale === "ko" ? "로그인" : "Login"}
      </Link>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition group"
            title={locale === "ko" ? "마이페이지 / 설정" : "My Page / Settings"}
          >
            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:border-zinc-300 dark:group-hover:border-zinc-600 transition">
              <UserIcon size={18} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <span className="max-w-[100px] truncate">{displayName}</span>
              <span className="text-zinc-400 font-normal">{locale === "ko" ? "님" : ""}</span>
              {unreadCount > 0 && (
                <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
              
              {/* User Info Header (Mobile/Compact context) */}
              <div className="px-4 py-2 mb-2 border-b border-zinc-100 dark:border-zinc-700/50">
                <p className="text-xs text-zinc-400 font-medium mb-0.5">
                  {locale === "ko" ? "내 계정" : "My Account"}
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {user.email}
                </p>
              </div>

              {/* 1. 마이페이지 (사람) */}
              <Link
                href={`/${locale}/mypage`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <UserIcon size={16} />
                </div>
                <span>{locale === "ko" ? "마이페이지" : "My Page"}</span>
              </Link>

              {/* 2. 채팅 (메시지) */}
              <Link
                href={`/${locale}/mypage/chat`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 relative">
                  <MessageCircle size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span>{tChat("title")}</span>
              </Link>

              {/* 2. 충전 금액 (동전) */}
              <Link
                href={`/${locale}/mypage/points`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <CircleDollarSign size={16} />
                </div>
                <div className="flex flex-col leading-none gap-1">
                  <span className="font-medium">{tPoints("balance")}</span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {points.toLocaleString()} {locale === "ko" ? "원" : "KRW"}
                  </span>
                </div>
              </Link>

              {/* 3. 관리자 (툴) */}
              {isAdmin && (
                <Link
                  href={`/${locale}/admin`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Wrench size={16} />
                  </div>
                  <span>{locale === "ko" ? "관리자 페이지" : "Admin Page"}</span>
                </Link>
              )}
              {!isAdmin && (
                <Link
                  href={`/${locale}/admin-apply`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center flex-shrink-0">
                    <Ticket size={16} />
                  </div>
                  <span>{locale === "ko" ? "관리자 신청" : "Apply for Admin"}</span>
                </Link>
              )}

               {/* 알림 설정 */}
               <button
                  onClick={() => {
                    openGuide("notification");
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center flex-shrink-0">
                    <Bell size={16} />
                  </div>
                  <span>{locale === "ko" ? "알림 설정 가이드" : "Notification Guide"}</span>
               </button>

              <div className="border-t border-zinc-100 dark:border-zinc-700/50 my-2"></div>

              {/* 로그아웃 (아이콘 없음 or 간단히) */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                <span>{locale === "ko" ? "로그아웃" : "Logout"}</span>
              </button>

              {/* 회원 탈퇴 */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowDeleteModal(true);
                }}
                className="w-full text-left px-4 py-1 text-[10px] text-zinc-400 hover:text-red-500 transition-colors"
              >
                {locale === "ko" ? "회원탈퇴" : "Delete Account"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </>
  );
}

