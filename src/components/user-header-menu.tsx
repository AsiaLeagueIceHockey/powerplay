"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { DeleteAccountModal } from "./delete-account-modal";

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
}: {
  user: User | null;
  locale: string;
  isAdmin: boolean;
  points?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

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
        {/* Points Display */}
        <Link
          href={`/${locale}/mypage/points`}
          className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition text-sm font-medium whitespace-nowrap"
        >
          <span>💰</span>
          <span>{points.toLocaleString()}P</span>
        </Link>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-lg transition"
          >
            <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-300 flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="font-medium text-sm hidden md:block">{displayName}</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-50">
              {/* Mobile Only: Username Display */}
              <div className="md:hidden px-4 py-3 border-b border-zinc-100 dark:border-zinc-700 mb-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-0.5">
                  {locale === "ko" ? "로그인 정보" : "Signed in as"}
                </p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {displayName}
                </p>
              </div>

              <div className="px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {locale === "ko" ? "언어 설정" : "Language"}
              </div>
              <div className="flex px-4 py-2 space-x-2">
                <button
                  onClick={() => switchLocale("ko")}
                  className={`flex-1 py-1 text-xs rounded-md border ${
                    locale === "ko"
                      ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  한국어
                </button>
                <button
                  onClick={() => switchLocale("en")}
                  className={`flex-1 py-1 text-xs rounded-md border ${
                    locale === "en"
                      ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  English
                </button>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>

              {/* 포인트 메뉴 */}
              <button
                onClick={() => {
                  router.push(`/${locale}/mypage/points`);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                {locale === "ko" ? "💰 포인트 관리" : "💰 Points"}
              </button>

              {/* 관리자 신청 / 관리자 페이지 */}
              {isAdmin ? (
                <button
                  onClick={() => {
                    router.push(`/${locale}/admin`);
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  {locale === "ko" ? "🛠️ 관리자 페이지" : "🛠️ Admin Page"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    router.push(`/${locale}/admin-apply`);
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  {locale === "ko" ? "🎫 관리자 신청" : "🎫 Apply for Admin"}
                </button>
              )}

              <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>

              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {locale === "ko" ? "로그아웃" : "Logout"}
              </button>

              {/* 회원 탈퇴 */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowDeleteModal(true);
                }}
                className="w-full text-left px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
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

