"use client";
import { fieldStyles, overlayStyles, surfaceStyles, iconButtonStyles } from "@/components/ui/styles";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { createOrGetRoom } from "@/app/actions/chat";

interface UserProfile {
  id: string;
  full_name: string;
  primary_club_id: string | null;
  clubs?: {
    name: string;
  } | null;
}

export function ChatUserSelector({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const t = useTranslations("chat");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    const fetchUsers = async () => {
    setIsLoading(true);
    const supabase = createClient();

    // We get current user to filter them out
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profiles along with their primary club name
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        primary_club_id,
        clubs:primary_club_id (name)
      `)
      .neq("id", user?.id)
      .not("full_name", "is", null)
      .order("full_name");

    if (!error && data) {
      setUsers(data as unknown as UserProfile[]);
    }
    setIsLoading(false);
  };

    if (isOpen) void fetchUsers();
  }, [isOpen]);

  const handleUserClick = async (targetUser: UserProfile) => {
    if (confirm(t("startChatConfirm"))) {
      setIsCreating(true);
      // Global selector — no origin context; system message is not emitted.
      const result = await createOrGetRoom(targetUser.id);
      setIsCreating(false);

      if (result.ok) {
        onClose();
        router.push(`/${locale}/chat/${result.roomId}`);
        return;
      }
      if (result.code === "cannot_chat_with_self") {
        alert(t("cannotChatWithSelf"));
      } else {
        alert(t("startChatFailed"));
      }
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.clubs?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="chat-selector-title" className={overlayStyles() + " w-full sm:max-w-md h-[80vh] sm:h-[600px] flex flex-col overflow-hidden"}>
        <div className="flex items-center justify-between p-4 border-b border-pp-border ">
          <h2 id="chat-selector-title" className="pp-text-heading">{t("userSelectorTitle")}</h2>
          <button type="button" onClick={onClose} aria-label={locale === "ko" ? "닫기" : "Close"} className={iconButtonStyles({ variant: "ghost", size: "compact" })}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-pp-border ">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pp-muted" />
            <input
              type="text"
              placeholder={t("searchUser")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${fieldStyles({ leadingIcon: true })} w-full`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-pp-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button type="button"
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  disabled={isCreating}
                  className={`${surfaceStyles({ interactive: true, density: "none" })} flex w-full items-center p-3 text-left disabled:opacity-50`}
                >
                  <div className="w-10 h-10 rounded-full bg-pp-surface-muted flex items-center justify-center text-pp-muted font-bold shrink-0">
                    {user.full_name?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-pp-text ">
                      {user.full_name}
                    </div>
                    {user.clubs?.name && (
                      <div className="text-xs text-pp-muted ">
                        {user.clubs.name}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-pp-muted">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
