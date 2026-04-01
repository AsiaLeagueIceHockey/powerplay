import Link from "next/link";
import { MessageCircleMore, Phone, UserRound } from "lucide-react";

import type { SuperuserChatRoomSummary, SuperuserUnreadRecipient } from "@/app/actions/superuser";
import { CopyButton } from "@/components/copy-button";

function formatDateTime(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildSmsTemplate(locale: string, unreadRecipient: SuperuserUnreadRecipient) {
  const counterpartName =
    unreadRecipient.counterpart.full_name ||
    unreadRecipient.counterpart.email ||
    (locale === "ko" ? "상대방" : "the other participant");

  if (locale === "ko") {
    return `안녕하세요. 파워플레이 운영팀입니다.\n${counterpartName}님과 아직 읽지 않은 채팅이 있어요. 파워플레이에 접속해서 확인 부탁드립니다.`;
  }

  return `Hello from PowerPlay. You still have unread chat messages with ${counterpartName}. Please open PowerPlay and check the chat when you can.`;
}

function roleLabel(locale: string, role: string) {
  if (locale === "ko") {
    if (role === "superuser") return "슈퍼유저";
    if (role === "admin") return "관리자";
    return "일반 유저";
  }

  if (role === "superuser") return "Superuser";
  if (role === "admin") return "Admin";
  return "User";
}

export function SuperuserChatTab({
  locale,
  rooms,
}: {
  locale: string;
  rooms: SuperuserChatRoomSummary[];
}) {
  const roomsWithUnread = rooms.filter((room) => room.totalUnreadCount > 0).length;
  const unreadRecipients = rooms.reduce((sum, room) => sum + room.unreadRecipients.length, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            {locale === "ko" ? "전체 채팅방" : "Total rooms"}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{rooms.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            {locale === "ko" ? "미읽음 있는 방" : "Rooms with unread"}
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{roomsWithUnread}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            {locale === "ko" ? "직접 확인 필요한 사용자" : "Recipients needing follow-up"}
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-400">{unreadRecipients}</p>
        </div>
      </div>

      <div className="space-y-4">
        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 px-6 py-12 text-center text-zinc-500">
            <MessageCircleMore className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>{locale === "ko" ? "개설된 채팅방이 없습니다." : "No chat rooms have been created yet."}</p>
          </div>
        ) : (
          rooms.map((room) => (
            <section
              key={room.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                      {locale === "ko" ? "1:1 채팅" : "1:1 Chat"}
                    </span>
                    {room.totalUnreadCount > 0 ? (
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                        {locale === "ko"
                          ? `미읽음 ${room.totalUnreadCount}건`
                          : `${room.totalUnreadCount} unread`}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {locale === "ko" ? "미읽음 없음" : "All read"}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {(room.participant1.full_name || room.participant1.email) ?? room.participant1.id}
                    <span className="mx-2 text-zinc-500">↔</span>
                    {(room.participant2.full_name || room.participant2.email) ?? room.participant2.id}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {locale === "ko" ? "개설" : "Created"} {formatDateTime(locale, room.created_at)}
                    <span className="mx-2 text-zinc-700">•</span>
                    {locale === "ko" ? "최근 활동" : "Last activity"} {formatDateTime(locale, room.updated_at)}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="space-y-3">
                  {[room.participant1, room.participant2].map((participant) => (
                    <div
                      key={participant.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                              <UserRound className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-medium text-zinc-100">
                                {participant.full_name || participant.email || participant.id}
                              </p>
                              <p className="text-xs text-zinc-500">{roleLabel(locale, participant.role)}</p>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-400">{participant.email}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                            <Phone className="h-4 w-4 text-zinc-500" />
                            {participant.phone ? (
                              <>
                                <a href={`tel:${participant.phone}`} className="hover:text-blue-400">
                                  {participant.phone}
                                </a>
                                <CopyButton text={participant.phone} showText={false} />
                              </>
                            ) : (
                              <span className="text-zinc-500">
                                {locale === "ko" ? "전화번호 미등록" : "No phone number"}
                              </span>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/${locale}/admin/admins/${participant.id}`}
                          className="inline-flex items-center rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
                        >
                          {locale === "ko" ? "프로필 보기" : "View profile"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-zinc-100">
                      {locale === "ko" ? "수동 문자 안내 템플릿" : "Manual follow-up templates"}
                    </h4>
                    <span className="text-xs text-zinc-500">
                      {locale === "ko" ? "미읽음 상대만 표시" : "Only unread recipients"}
                    </span>
                  </div>

                  {room.unreadRecipients.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
                      {locale === "ko"
                        ? "아직 읽지 않은 상대가 없어 별도 문자 안내가 필요하지 않습니다."
                        : "Everyone has read the chat, so no manual follow-up is needed."}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {room.unreadRecipients.map((unreadRecipient) => {
                        const smsTemplate = buildSmsTemplate(locale, unreadRecipient);

                        return (
                          <div
                            key={unreadRecipient.recipient.id}
                            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-amber-100">
                                  {(unreadRecipient.recipient.full_name || unreadRecipient.recipient.email) ??
                                    unreadRecipient.recipient.id}
                                </p>
                                <p className="mt-1 text-xs text-amber-200/70">
                                  {locale === "ko"
                                    ? `${unreadRecipient.counterpart.full_name || unreadRecipient.counterpart.email}님 메시지 ${unreadRecipient.unreadCount}건 미확인`
                                    : `${unreadRecipient.unreadCount} unread message(s) from ${unreadRecipient.counterpart.full_name || unreadRecipient.counterpart.email}`}
                                </p>
                                <p className="mt-2 text-xs text-zinc-400">
                                  {locale === "ko" ? "마지막 미읽음" : "Latest unread"}{" "}
                                  {formatDateTime(locale, unreadRecipient.latestUnreadAt)}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
                                  {smsTemplate}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {unreadRecipient.recipient.phone ? (
                                  <a
                                    href={`sms:${unreadRecipient.recipient.phone}`}
                                    className="inline-flex items-center rounded-full border border-amber-400/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-400/10"
                                  >
                                    {locale === "ko" ? "문자 열기" : "Open SMS"}
                                  </a>
                                ) : null}
                                <CopyButton text={smsTemplate} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:text-white" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
