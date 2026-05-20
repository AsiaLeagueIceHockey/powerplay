"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  createParentComment, 
  deleteParentComment, 
  deleteParentPost,
  ParentPost, 
  ParentComment 
} from "@/app/actions/parent";
import { 
  ArrowLeft, 
  MessageSquare, 
  Trash2, 
  Loader2, 
  User, 
  Clock 
} from "lucide-react";

interface PostDetailClientProps {
  locale: string;
  user: any;
  userProfile?: { parent_nickname?: string | null; full_name?: string | null } | null;
  isAdmin: boolean;
  initialPost: ParentPost;
  initialComments: ParentComment[];
}

export function PostDetailClient({
  locale,
  user,
  userProfile,
  isAdmin,
  initialPost,
  initialComments,
}: PostDetailClientProps) {
  const router = useRouter();
  const [comments, setComments] = useState<ParentComment[]>(initialComments);
  
  // Comment Form States
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Format Date Helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    });
  };

  // Submit Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent) {
      setCommentError(locale === "ko" ? "내용을 입력해 주세요." : "Please enter comment content.");
      return;
    }

    const currentNickname = userProfile?.parent_nickname || userProfile?.full_name || (locale === "ko" ? "학부모" : "Parent");

    setIsSubmitting(true);
    setCommentError(null);

    const res = await createParentComment(initialPost.id, commentContent, currentNickname);
    setIsSubmitting(false);

    if (res.success && res.comment) {
      setComments([...comments, res.comment]);
      setCommentContent("");
      router.refresh();
    } else {
      setCommentError(res.error || "Failed to submit comment.");
    }
  };

  // Delete Comment
  const handleCommentDelete = async (commentId: string) => {
    if (!confirm(locale === "ko" ? "정말 이 댓글을 삭제하시겠습니까?" : "Are you sure you want to delete this comment?")) {
      return;
    }
    const res = await deleteParentComment(commentId);
    if (res.success) {
      setComments(comments.filter((c) => c.id !== commentId));
    } else {
      alert(res.error || "Failed to delete comment.");
    }
  };

  // Delete Post
  const handlePostDelete = async () => {
    if (!confirm(locale === "ko" ? "정말 이 게시글을 삭제하시겠습니까?" : "Are you sure you want to delete this post?")) {
      return;
    }
    const res = await deleteParentPost(initialPost.id);
    if (res.success) {
      router.push(`/${locale}/youth`);
    } else {
      alert(res.error || "Failed to delete post.");
    }
  };

  const isPostOwner = initialPost.user_id === user?.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href={`/${locale}/youth`}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-sm font-bold transition"
        >
          <ArrowLeft size={16} />
          {locale === "ko" ? "파워유스 목록으로" : "Back to PowerYouth"}
        </Link>
      </div>

      {/* Post Detail Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white leading-tight">
                {initialPost.title}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                <span className="text-zinc-500 dark:text-zinc-400 font-bold">
                  {initialPost.nickname}
                </span>
                <span>•</span>
                <span>{formatDate(initialPost.created_at)}</span>
              </div>
            </div>

            {/* Post actions */}
            {(isPostOwner || isAdmin) && (
              <button
                onClick={handlePostDelete}
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                title={locale === "ko" ? "삭제" : "Delete"}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {initialPost.content}
            </p>
          </div>

          {initialPost.image_url && (
            <div className="relative w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 max-h-[450px] aspect-[4/3] flex items-center justify-center">
              <Image
                src={initialPost.image_url}
                alt="Post content picture"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <MessageSquare size={18} className="text-violet-500" />
          <span>{locale === "ko" ? `댓글 ${comments.length}` : `Comments ${comments.length}`}</span>
        </h3>

        {/* Comment list */}
        {comments.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-400 text-sm">
            {locale === "ko" ? "등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!" : "No comments yet. Write the first comment!"}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {comment.nickname}
                    </span>
                    <span className="text-zinc-400 text-[10px]">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>

                  {(isAdmin || comment.user_id === user?.id) && (
                    <button
                      onClick={() => handleCommentDelete(comment.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 rounded transition"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed pl-1">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Comment Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {locale === "ko" ? "댓글 쓰기" : "Write Comment"}
          </h4>

          <form onSubmit={handleCommentSubmit} className="space-y-3">
            {commentError && (
              <div className="p-2 bg-red-950/50 text-red-200 rounded-lg text-xs">
                {commentError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="text-xs text-zinc-400 font-semibold pl-1">
                {locale === "ko" ? "작성자 닉네임: " : "Posting as: "}
                <span className="text-violet-600 dark:text-violet-400 font-bold">
                  {userProfile?.parent_nickname || userProfile?.full_name || (locale === "ko" ? "학부모" : "Parent")}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  required
                  placeholder={locale === "ko" ? "따뜻한 댓글을 남겨주세요." : "Write a kind comment."}
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-violet-500 focus:outline-none transition text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 flex-shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                      <span>작성 중</span>
                    </>
                  ) : (
                    <span>댓글 등록</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
