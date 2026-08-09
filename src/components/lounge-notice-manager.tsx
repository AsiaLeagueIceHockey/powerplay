"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { LoungeBusiness, LoungeMembership } from "@/app/actions/lounge";
import type { LoungeNotice } from "@/app/actions/lounge-notices";
import {
  createLoungeNotice,
  deleteLoungeNotice,
  updateLoungeNotice,
} from "@/app/actions/lounge-notices";

const TITLE_LIMIT = 120;
const BODY_LIMIT = 10_000;

type Feedback = {
  type: "success" | "error";
  message: string;
};

function createRequestId() {
  return crypto.randomUUID();
}

function formatNoticeDate(input: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(input));
}

export function LoungeNoticeManager({
  locale,
  business,
  membership,
  membershipActive,
  notices,
  initialLoadError,
  onCreateBusiness,
}: {
  locale: string;
  business: LoungeBusiness | null;
  membership: LoungeMembership | null;
  membershipActive: boolean;
  notices: LoungeNotice[];
  initialLoadError?: boolean;
  onCreateBusiness?: () => void;
}) {
  const router = useRouter();
  const requestIdRef = useRef("");
  const [managedNotices, setManagedNotices] = useState(notices);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"save" | `delete:${string}` | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(
    initialLoadError
      ? {
          type: "error",
          message:
            locale === "ko"
              ? "공지를 불러오지 못했습니다. 페이지를 새로고침해 다시 시도해주세요."
              : "Notices could not be loaded. Refresh the page to try again.",
        }
      : null
  );

  useEffect(() => {
    setManagedNotices(notices);
  }, [notices]);

  const sortedNotices = useMemo(
    () =>
      [...managedNotices].sort((a, b) => {
        const createdAtDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return createdAtDiff || b.id.localeCompare(a.id);
      }),
    [managedNotices]
  );

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
  };

  const beginEdit = (notice: LoungeNotice) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setBody(notice.body);
    setFeedback(null);
  };

  const validate = () => {
    if (!title.trim() || !body.trim()) {
      return locale === "ko" ? "제목과 내용을 모두 입력해주세요." : "Enter both a title and body.";
    }
    if (title.trim().length > TITLE_LIMIT) {
      return locale === "ko"
        ? `제목은 ${TITLE_LIMIT}자 이내로 입력해주세요.`
        : `Keep the title within ${TITLE_LIMIT} characters.`;
    }
    if (body.trim().length > BODY_LIMIT) {
      return locale === "ko"
        ? `내용은 ${BODY_LIMIT.toLocaleString("ko-KR")}자 이내로 입력해주세요.`
        : `Keep the body within ${BODY_LIMIT.toLocaleString("en-US")} characters.`;
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!business || pendingAction) return;

    const validationError = validate();
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("body", body.trim());
    setPendingAction("save");
    setFeedback(null);

    try {
      if (editingId) {
        formData.set("notice_id", editingId);
        const result = await updateLoungeNotice(formData);
        if (!result.success) {
          setFeedback({
            type: "error",
            message: result.error || (locale === "ko" ? "공지 수정에 실패했습니다." : "Failed to update the notice."),
          });
          return;
        }

        if (result.notice) {
          setManagedNotices((current) =>
            current.map((notice) => (notice.id === result.notice?.id ? result.notice : notice))
          );
        }
        resetForm();
        setFeedback({
          type: "success",
          message: locale === "ko" ? "공지가 수정되었습니다." : "Notice updated.",
        });
      } else {
        if (!requestIdRef.current) {
          requestIdRef.current = createRequestId();
        }
        formData.set("business_id", business.id);
        formData.set("request_id", requestIdRef.current);

        const result = await createLoungeNotice(formData);
        if (!result.success) {
          setFeedback({
            type: "error",
            message: result.error || (locale === "ko" ? "공지 등록에 실패했습니다." : "Failed to publish the notice."),
          });
          return;
        }

        const savedNotice = result.notice;
        if (savedNotice) {
          setManagedNotices((current) => [
            savedNotice,
            ...current.filter((notice) => notice.id !== savedNotice.id),
          ]);
        }
        requestIdRef.current = createRequestId();
        resetForm();
        setFeedback({
          type: "success",
          message:
            result.created === false
              ? locale === "ko"
                ? "이미 등록된 공지를 확인했습니다. 중복 등록하지 않았습니다."
                : "The existing notice was found; no duplicate was published."
              : locale === "ko"
                ? "공지가 바로 공개되었습니다."
                : "Notice published immediately.",
        });
      }

      router.refresh();
    } catch (error) {
      console.error("[lounge-notices] failed to save notice:", error);
      setFeedback({
        type: "error",
        message:
          locale === "ko"
            ? "요청을 완료하지 못했습니다. 다시 시도해주세요."
            : "The request could not be completed. Please try again.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async (notice: LoungeNotice) => {
    if (pendingAction) return;
    const confirmed = window.confirm(
      locale === "ko"
        ? `“${notice.title}” 공지를 삭제할까요? 삭제 후에는 복구할 수 없습니다.`
        : `Delete “${notice.title}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setPendingAction(`delete:${notice.id}`);
    setFeedback(null);
    try {
      const result = await deleteLoungeNotice(notice.id);
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error || (locale === "ko" ? "공지 삭제에 실패했습니다." : "Failed to delete the notice."),
        });
        return;
      }

      setManagedNotices((current) => current.filter((item) => item.id !== notice.id));
      if (editingId === notice.id) resetForm();
      setFeedback({
        type: "success",
        message: locale === "ko" ? "공지가 삭제되었습니다." : "Notice deleted.",
      });
      router.refresh();
    } catch (error) {
      console.error("[lounge-notices] failed to delete notice:", error);
      setFeedback({
        type: "error",
        message:
          locale === "ko"
            ? "삭제 요청을 완료하지 못했습니다. 다시 시도해주세요."
            : "The delete request could not be completed. Please try again.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  if (!membershipActive) {
    return (
      <section className="rounded-3xl border border-zinc-700 bg-zinc-800 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-700 text-zinc-300">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">
              {locale === "ko" ? "활성 라운지 구독이 필요합니다" : "An active Lounge membership is required"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              {locale === "ko"
                ? membership
                  ? "구독 기간이 활성화되면 공지를 등록하고 관리할 수 있습니다."
                  : "라운지 멤버십 등록 후 공지를 바로 공개할 수 있습니다."
                : membership
                  ? "You can publish and manage notices when your membership becomes active."
                  : "Register a Lounge membership to publish notices."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!business) {
    return (
      <section className="rounded-3xl border border-zinc-700 bg-[linear-gradient(180deg,#3f3f46_0%,#27272a_100%)] p-6 shadow-sm">
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                {locale === "ko" ? "비즈니스를 먼저 등록해주세요" : "Create your business first"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {locale === "ko"
                  ? "공지에는 비즈니스 정보와 공유 주소가 연결됩니다. 비즈니스 등록 후 공지를 바로 공개할 수 있습니다."
                  : "Notices use your business identity and share URL. Create the business, then publish your first notice."}
              </p>
            </div>
          </div>
          {onCreateBusiness ? (
            <button
              type="button"
              onClick={onCreateBusiness}
              className="shrink-0 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
            >
              {locale === "ko" ? "비즈니스 등록하기" : "Create business"}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const isSaving = pendingAction === "save";

  return (
    <section className="space-y-5 rounded-3xl border border-zinc-700 bg-[linear-gradient(180deg,#3f3f46_0%,#27272a_100%)] p-6 shadow-sm">
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
          <BellRing className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">
            {locale === "ko" ? "라운지 공지 관리" : "Lounge notices"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {locale === "ko"
              ? business.is_published
                ? "중요한 소식을 작성하면 즉시 공개되며, 새 공지만 알림 구독자에게 전달됩니다."
                : "비공개 업체의 공지는 저장되지만, 업체가 공개되기 전에는 노출되거나 알림으로 전달되지 않습니다."
              : business.is_published
                ? "Publish updates immediately. Only newly created notices notify subscribers."
                : "Notices are saved while hidden, but are not shown or delivered until the business is published."}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-zinc-100">
              {editingId
                ? locale === "ko"
                  ? "공지 수정"
                  : "Edit notice"
                : locale === "ko"
                  ? "새 공지 작성"
                  : "New notice"}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {editingId
                ? locale === "ko"
                  ? "수정해도 기존 공지 주소는 유지됩니다."
                  : "The existing notice URL stays the same after editing."
                : locale === "ko"
                  ? "저장하면 별도 승인 없이 바로 공개됩니다."
                  : "Publishing is immediate and does not require approval."}
            </p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              {locale === "ko" ? "수정 취소" : "Cancel edit"}
            </button>
          ) : null}
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "제목" : "Title"}</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={TITLE_LIMIT}
            disabled={isSaving}
            placeholder={locale === "ko" ? "공지 제목을 입력하세요" : "Enter a notice title"}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400 disabled:opacity-60"
          />
          <span className="block text-right text-xs text-zinc-500">
            {title.length}/{TITLE_LIMIT}
          </span>
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-semibold text-zinc-100">{locale === "ko" ? "내용" : "Body"}</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            maxLength={BODY_LIMIT}
            disabled={isSaving}
            rows={8}
            placeholder={
              locale === "ko"
                ? "운영 안내, 혜택, 준비물 등 알릴 내용을 입력하세요"
                : "Share an update, benefit, preparation details, or other news"
            }
            className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400 disabled:opacity-60"
          />
          <span className="block text-right text-xs text-zinc-500">
            {body.length.toLocaleString(locale === "ko" ? "ko-KR" : "en-US")}/
            {BODY_LIMIT.toLocaleString(locale === "ko" ? "ko-KR" : "en-US")}
          </span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || Boolean(pendingAction)}
            className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving
              ? locale === "ko"
                ? "저장 중..."
                : "Saving..."
              : editingId
                ? locale === "ko"
                  ? "수정 저장"
                  : "Save changes"
                : locale === "ko"
                  ? "지금 공개"
                  : "Publish now"}
          </button>
        </div>
      </form>

      {feedback ? (
        <p
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-red-900/60 bg-red-950/30 text-red-300"
              : "border-emerald-900/60 bg-emerald-950/30 text-emerald-300"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="font-bold text-zinc-100">{locale === "ko" ? "공개된 공지" : "Published notices"}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {locale === "ko" ? "최신 공지부터 표시됩니다." : "Newest notices appear first."}
            </p>
          </div>
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300">
            {sortedNotices.length}
          </span>
        </div>

        {sortedNotices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-5 py-10 text-center">
            <FileText className="mx-auto h-7 w-7 text-zinc-600" />
            <p className="mt-3 font-semibold text-zinc-300">
              {locale === "ko" ? "아직 등록된 공지가 없습니다." : "No notices have been published yet."}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {locale === "ko" ? "첫 공지를 작성해 소식을 알려보세요." : "Write the first notice to share an update."}
            </p>
          </div>
        ) : (
          sortedNotices.map((notice) => {
            const deleting = pendingAction === `delete:${notice.id}`;
            return (
              <article
                key={notice.id}
                className={`rounded-2xl border bg-zinc-900/60 p-5 transition ${
                  editingId === notice.id ? "border-amber-400/70" : "border-zinc-700/80 hover:border-zinc-600"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="break-words text-base font-bold text-zinc-100">{notice.title}</h4>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatNoticeDate(notice.created_at, locale)} KST
                    </p>
                    <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
                      {notice.body}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/${locale}/lounge/${business.slug}/notices/${notice.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {locale === "ko" ? "보기" : "View"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => beginEdit(notice)}
                      disabled={Boolean(pendingAction)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-amber-400/60 hover:text-amber-300 disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {locale === "ko" ? "수정" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(notice)}
                      disabled={Boolean(pendingAction)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-900/60 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-700 hover:bg-red-950/30 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      {deleting
                        ? locale === "ko"
                          ? "삭제 중..."
                          : "Deleting..."
                        : locale === "ko"
                          ? "삭제"
                          : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
