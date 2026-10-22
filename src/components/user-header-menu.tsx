"use client";
import { buttonStyles } from "@/components/ui/styles";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { DeleteAccountModal } from "./delete-account-modal";
import { useNotification } from "@/contexts/notification-context";
import { useTranslations } from "next-intl";

import { CircleDollarSign, User as UserIcon, ChevronDown, Wrench, Bell, LogOut, Ticket } from "lucide-react";

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
  const tPoints = useTranslations("points");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { openGuide } = useNotification();
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

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <Link
        href={`/${locale}/login`}
        // Secondary so each page's own primary action stays the only prominent one (P7).
        className={buttonStyles({ variant: "secondary", size: "compact" })}
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
          <button type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={buttonStyles({ variant: "secondary", size: "compact" }) + " flex items-center gap-2 group"}
            title={locale === "ko" ? "마이페이지 / 설정" : "My Page / Settings"}
          >
            <div className="w-8 h-8 bg-pp-surface-muted border border-pp-border rounded-full flex items-center justify-center text-pp-muted group-hover:border-pp-border transition">
              <UserIcon size={18} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-pp-muted ">
              <span className="max-w-[100px] truncate">{displayName}</span>
              <span className="text-pp-muted font-normal">{locale === "ko" ? "님" : ""}</span>
            </div>
            <ChevronDown size={14} className={`text-pp-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-pp-surface rounded-xl shadow-xl border border-pp-border py-2 z-20 animate-in fade-in zoom-in-95 duration-100">

              {/* User Info Header (Mobile/Compact context) */}
              <div className="px-4 py-2 mb-2 border-b border-pp-border ">
                <p className="text-xs text-pp-muted font-medium mb-0.5">
                  {locale === "ko" ? "내 계정" : "My Account"}
                </p>
                <p className="text-sm font-medium text-pp-text truncate">
                  {user.email}
                </p>
              </div>

              {/* 1. 마이페이지 (사람) */}
              <Link
                href={`/${locale}/mypage`}
                onClick={() => setIsOpen(false)}
                className={buttonStyles({ variant: "ghost", size: "default" }) + " flex w-full justify-start gap-3"}
              >
                <div className="w-8 h-8 rounded-full bg-pp-accent-soft text-pp-accent-text flex items-center justify-center flex-shrink-0">
                  <UserIcon size={16} />
                </div>
                <span>{locale === "ko" ? "마이페이지" : "My Page"}</span>
              </Link>

              {/* 2. 충전 금액 (동전) */}
              <Link
                href={`/${locale}/mypage/points`}
                onClick={() => setIsOpen(false)}
                className={buttonStyles({ variant: "ghost", size: "default" }) + " flex w-full justify-start gap-3"}
              >
                <div className="w-8 h-8 rounded-full bg-pp-warning-soft text-pp-warning-text flex items-center justify-center flex-shrink-0">
                  <CircleDollarSign size={16} />
                </div>
                <div className="flex flex-col leading-none gap-1">
                  <span className="font-medium">{tPoints("balance")}</span>
                  <span className="text-xs text-pp-muted font-mono">
                    {points.toLocaleString()} {locale === "ko" ? "원" : "KRW"}
                  </span>
                </div>
              </Link>

              {/* 3. 관리자 (툴) */}
              {isAdmin && (
                <Link
                  href={`/${locale}/admin`}
                  onClick={() => setIsOpen(false)}
                  className={buttonStyles({ variant: "ghost", size: "default" }) + " flex w-full justify-start gap-3"}
                >
                  <div className="w-8 h-8 rounded-full bg-pp-accent-soft text-pp-accent-text flex items-center justify-center flex-shrink-0">
                    <Wrench size={16} />
                  </div>
                  <span>{locale === "ko" ? "관리자 페이지" : "Admin Page"}</span>
                </Link>
              )}
              {!isAdmin && (
                <Link
                  href={`/${locale}/admin-apply`}
                  onClick={() => setIsOpen(false)}
                  className={buttonStyles({ variant: "ghost", size: "default" }) + " flex w-full justify-start gap-3"}
                >
                  <div className="w-8 h-8 rounded-full bg-pp-surface-muted text-pp-muted flex items-center justify-center flex-shrink-0">
                    <Ticket size={16} />
                  </div>
                  <span>{locale === "ko" ? "관리자 신청" : "Apply for Admin"}</span>
                </Link>
              )}

               {/* 알림 설정 */}
               <button type="button"
                  onClick={() => {
                    openGuide("notification");
                    setIsOpen(false);
                  }}
                  className={buttonStyles({ variant: "ghost", size: "default" }) + " w-full justify-start gap-3 text-left"}
                >
                  <div className="w-8 h-8 rounded-full bg-pp-surface-muted text-pp-muted flex items-center justify-center flex-shrink-0">
                    <Bell size={16} />
                  </div>
                  <span>{locale === "ko" ? "알림 설정 가이드" : "Notification Guide"}</span>
               </button>

              <div className="border-t border-pp-border my-2"></div>

              {/* 로그아웃 (아이콘 없음 or 간단히) */}
              <button type="button"
                onClick={handleSignOut}
                className={buttonStyles({ variant: "ghost", size: "compact" }) + " w-full justify-start gap-2"}
              >
                <LogOut size={16} />
                <span>{locale === "ko" ? "로그아웃" : "Logout"}</span>
              </button>

              {/* 회원 탈퇴 */}
              <button type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowDeleteModal(true);
                }}
                className={buttonStyles({ variant: "ghost", size: "compact" }) + " w-full justify-start"}
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

