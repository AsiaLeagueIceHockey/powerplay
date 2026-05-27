"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  createParentComment, 
  deleteParentComment, 
  deleteParentPost,
  toggleParentPostLike,
  ParentPost, 
  ParentComment 
} from "@/app/actions/parent";
import { 
  ArrowLeft, 
  MessageSquare, 
  Trash2, 
  Loader2, 
  User, 
  Clock,
  Heart,
  Eye
} from "lucide-react";

interface PostDetailClientProps {
  locale: string;
  user: any;
  userProfile?: { parent_nickname?: string | null; full_name?: string | null } | null;
  isSuperUser: boolean;
  initialPost: ParentPost;
  initialComments: ParentComment[];
}

export function PostDetailClient({
  locale,
  user,
  userProfile,
  isSuperUser,
  initialPost,
  initialComments,
}: PostDetailClientProps) {
  const router = useRouter();
  const [comments, setComments] = useState<ParentComment[]>(initialComments);
  
  // Like states
  const [isLiked, setIsLiked] = useState(!!initialPost.is_liked);
  const [likesCount, setLikesCount] = useState(initialPost.likes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);

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

    const currentNickname = userProfile?.parent_nickname || (locale === "ko" ? "익명 학부모" : "Anonymous Parent");

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

  // Toggle Post Like
  const handleLikeToggle = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic UI update
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    setIsLiked(!previousIsLiked);
    setLikesCount(previousIsLiked ? previousLikesCount - 1 : previousLikesCount + 1);

    const res = await toggleParentPostLike(initialPost.id);
    if (!res.success) {
      // Revert if error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      alert(res.error || "Failed to update like status.");
    } else {
      if (res.isLiked !== undefined) setIsLiked(res.isLiked);
      if (res.likesCount !== undefined) setLikesCount(res.likesCount);
      router.refresh();
    }
    setIsLiking(false);
  };

  const isPostOwner = initialPost.user_id === user?.id;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-1 space-y-6">
      {/* Post Detail Content (Blind style) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {/* Avatar Circle */}
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm uppercase">
            {initialPost.nickname.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {locale === "ko" ? "학부모" : "Parent"}
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">•</span>
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                {initialPost.nickname}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              <span>{formatDate(initialPost.created_at)}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Eye size={11} className="inline text-zinc-400" />
                <span>{initialPost.views_count}</span>
              </span>
            </div>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white leading-tight mt-6">
          {initialPost.title}
        </h1>

        <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed mt-4 font-normal">
          {initialPost.content}
        </p>

        {initialPost.image_url && (
          <div className="relative w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 max-h-[450px] aspect-[4/3] flex items-center justify-center mt-4">
            <Image
              src={initialPost.image_url}
              alt="Post content picture"
              fill
              className="object-contain"
            />
          </div>
        )}

        {/* Action Buttons & Likes/Comments count */}
        <div className="flex items-center justify-between pt-5 mt-6 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-5 text-sm font-semibold text-zinc-500">
            <button
              onClick={handleLikeToggle}
              disabled={isLiking}
              className="flex items-center gap-1.5 hover:text-red-500 transition cursor-pointer select-none"
            >
              <Heart 
                size={18} 
                className={isLiked ? "fill-red-500 text-red-500" : "text-zinc-400"} 
              />
              <span>{likesCount}</span>
            </button>
            
            <div className="flex items-center gap-1.5">
              <MessageSquare size={18} className="text-zinc-400" />
              <span>{comments.length}</span>
            </div>
          </div>

          {(isPostOwner || isSuperUser) && (
            <button
              onClick={handlePostDelete}
              className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition cursor-pointer"
              title={locale === "ko" ? "삭제" : "Delete"}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Spacer (Blind Advertisement / grey spacer style) */}
      <div className="h-2 bg-zinc-50 dark:bg-zinc-950 -mx-1 my-6 border-y border-zinc-100 dark:border-zinc-800" />

      {/* Flat Comments Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs font-bold text-zinc-500 mb-2">
          <span>{locale === "ko" ? `댓글 ${comments.length}` : `Comments ${comments.length}`}</span>
          <span className="text-zinc-400 font-medium">{locale === "ko" ? "시간순" : "Oldest"}</span>
        </div>

        {comments.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-sm">
            {locale === "ko" ? "등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!" : "No comments yet."}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {comments.map((comment) => (
              <div key={comment.id} className="py-4 space-y-1.5 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {locale === "ko" ? "학부모" : "Parent"}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                      {comment.nickname}
                    </span>
                  </div>
                  
                  {(isSuperUser || comment.user_id === user?.id) && (
                    <button
                      onClick={() => handleCommentDelete(comment.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 rounded transition cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                
                <p className="text-[13px] sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed pr-1 whitespace-pre-wrap">
                  {comment.content}
                </p>
                
                <div className="text-[10px] text-zinc-400 font-medium">
                  {formatDate(comment.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Form */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 mt-6">
          <form onSubmit={handleCommentSubmit} className="space-y-2">
            {commentError && (
              <div className="p-2 bg-red-950/50 text-red-200 rounded-lg text-xs">
                {commentError}
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                required
                placeholder={locale === "ko" ? "댓글을 남겨주세요." : "Write a comment."}
                className="flex-1 bg-transparent border-none text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-0 text-sm py-1.5"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 flex-shrink-0 cursor-pointer disabled:opacity-50 select-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                ) : (
                  <span>{locale === "ko" ? "등록" : "Post"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
