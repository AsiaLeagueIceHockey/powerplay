"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { User as UserIcon, ChevronDown } from "lucide-react";

interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AdminUserMenuProps {
  user: User | null;
  locale: string;
  position?: "top" | "bottom"; // "top" for header (menu goes down), "bottom" for sidebar (menu goes up)
}

export function AdminUserMenu({
  user,
  locale,
  position = "top",
}: AdminUserMenuProps) {
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

  // Menu positioning based on where the button is placed
  const menuPositionClasses = position === "bottom" 
    ? "absolute left-0 bottom-full mb-2" // For sidebar (opens upward)
    : "absolute right-0 mt-2"; // For header (opens downward)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-zinc-300 hover:bg-zinc-800 px-3 py-2 rounded-lg transition group"
      >
        <div className="w-8 h-8 bg-zinc-700 border border-zinc-600 rounded-full flex items-center justify-center text-zinc-300 group-hover:border-zinc-500 transition">
          <UserIcon size={18} />
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-zinc-200">
          <span className="max-w-[100px] truncate">{displayName}</span>
          <span className="text-zinc-400 font-normal">{locale === "ko" ? "님" : ""}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className={`${menuPositionClasses} w-48 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 py-1 z-50`}>
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
