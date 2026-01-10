"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/actions/auth";

interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export function AdminUserMenu({
  user,
  locale,
}: {
  user: User | null;
  locale: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-zinc-300 hover:bg-zinc-800 px-3 py-2 rounded-lg transition"
      >
        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300">
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
        <span className="font-medium text-sm hidden md:inline">{displayName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 py-1 z-50">
          {/* User Page */}
          <button
            onClick={() => {
              router.push(`/${locale}`);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            🏠 {locale === "ko" ? "사용자 페이지" : "User Page"}
          </button>

          <div className="border-t border-zinc-700 my-1"></div>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
          >
            {locale === "ko" ? "로그아웃" : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
