"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  createParentPost, 
  uploadParentPostImage, 
  ParentApplication 
} from "@/app/actions/parent";
import { 
  ArrowLeft, 
  PenSquare, 
  ImageIcon, 
  Loader2, 
  X 
} from "lucide-react";

interface YouthWriteClientProps {
  locale: string;
  user: any;
  userProfile: { full_name: string | null; parent_verification_status: string; parent_nickname?: string | null } | null;
  myApplication: ParentApplication | null;
}

export function YouthWriteClient({
  locale,
  user,
  userProfile,
  myApplication,
}: YouthWriteClientProps) {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(locale === "ko" ? "이미지 파일만 업로드할 수 있습니다." : "Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(locale === "ko" ? "파일 크기는 5MB 이하여야 합니다." : "File size must be under 5MB.");
      return;
    }

    setIsUploadingImg(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadParentPostImage(formData);
    setIsUploadingImg(false);

    if (res.url) {
      setImageUrl(res.url);
    } else {
      setError(res.error || (locale === "ko" ? "이미지 업로드에 실패했습니다." : "Upload failed"));
    }
  };

  // Submit Post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError(locale === "ko" ? "제목과 내용을 입력해 주세요." : "Please enter title and content.");
      return;
    }

    const currentNickname = userProfile?.parent_nickname || userProfile?.full_name || `${myApplication?.child_name || "학부모"} 학부모`;

    setIsSubmitting(true);
    setError(null);

    const res = await createParentPost(title.trim(), content.trim(), currentNickname, imageUrl || undefined);
    setIsSubmitting(false);

    if (res.success) {
      router.push(`/${locale}/youth`);
      router.refresh();
    } else {
      setError(res.error || (locale === "ko" ? "게시글 등록에 실패했습니다." : "Failed to create post."));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href={`/${locale}/youth`}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-sm font-bold transition"
        >
          <ArrowLeft size={16} />
          {locale === "ko" ? "뒤로가기" : "Back"}
        </Link>
      </div>

      {/* Compose Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-black text-zinc-950 dark:text-white flex items-center gap-2">
              <PenSquare size={20} className="text-violet-500" />
              {locale === "ko" ? "커뮤니티 글쓰기" : "Write Post"}
            </h3>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 text-red-200 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {locale === "ko" ? "제목 *" : "Title *"}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={locale === "ko" ? "글 제목을 입력해 주세요" : "Enter post title"}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition text-sm"
              />
            </div>
            <div className="sm:w-1/3">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {locale === "ko" ? "작성자 닉네임" : "Posting as"}
              </label>
              <div className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-xl text-zinc-500 dark:text-zinc-400 text-sm font-bold truncate">
                {userProfile?.parent_nickname || userProfile?.full_name || (locale === "ko" ? "학부모" : "Parent")}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              {locale === "ko" ? "내용 *" : "Content *"}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              placeholder={locale === "ko" ? "학부모님들과 나눌 정겹고 유익한 이야기를 들려주세요." : "Share helpful news or ask questions."}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition text-sm leading-relaxed"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              {locale === "ko" ? "사진 첨부" : "Attach Image"}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isUploadingImg}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {isUploadingImg ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon size={14} />
                )}
                {locale === "ko" ? "이미지 선택" : "Choose Image"}
              </button>
              {imageUrl && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                  <Image
                    src={imageUrl}
                    alt="Upload preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-0 right-0 bg-red-600 text-white p-0.5 hover:bg-red-700 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href={`/${locale}/youth`}
              className="px-5 py-2.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition"
            >
              {locale === "ko" ? "취소" : "Cancel"}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImg}
              className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {locale === "ko" ? "게시 중..." : "Posting..."}
                </span>
              ) : (
                locale === "ko" ? "게시" : "Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
