"use client";

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
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

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

  const handleUserClick = async (targetUser: UserProfile) => {
    if (confirm(t("startChatConfirm"))) {
      setIsCreating(true);
      const { room, error } = await createOrGetRoom(targetUser.id);
      setIsCreating(false);
      
      if (!error && room) {
        onClose();
        router.push(`/${locale}/chat/${room.id}`);
      } else {
        alert("Error creating chat room.");
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
      <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl h-[80vh] sm:h-[600px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold dark:text-zinc-100">{t("userSelectorTitle")}</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder={t("searchUser")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  disabled={isCreating}
                  className="w-full flex items-center p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold shrink-0">
                    {user.full_name?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {user.full_name}
                    </div>
                    {user.clubs?.name && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {user.clubs.name}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-zinc-500">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
