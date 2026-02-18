import { getChatRooms } from "@/app/actions/chat";
import { ChatRoomList } from "@/components/chat-room-list";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default async function ChatListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rooms = await getChatRooms();

  return (
    <div className="container max-w-2xl mx-auto px-0 md:px-4 py-6">
      <h1 className="text-xl font-bold mb-4 px-4 md:px-0">
        <ChatTitle />
      </h1>
      <div className="bg-white dark:bg-zinc-900 rounded-none md:rounded-2xl border-y md:border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[400px]">
        <ChatRoomList rooms={rooms} />
      </div>
    </div>
  );
}

function ChatTitle() {
  const t = useTranslations("chat");
  return <>{t("title")}</>;
}
