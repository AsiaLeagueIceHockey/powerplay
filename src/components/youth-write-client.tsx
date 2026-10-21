"use client";
import { surfaceStyles, fieldStyles, buttonStyles } from "@/components/ui/styles";

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
  user: Pick<import("@supabase/supabase-js").User, "id">;
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

    const currentNickname = userProfile?.parent_nickname || `${myApplication?.child_name || "익명"} 학부모`;

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
    <div data-ui-theme="youth" className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href={`/${locale}/youth`}
          className="inline-flex items-center gap-2 text-pp-muted hover:text-pp-text text-sm font-bold transition"
        >
          <ArrowLeft size={16} />
          {locale === "ko" ? "뒤로가기" : "Back"}
        </Link>
      </div>

      {/* Compose Card */}
      <div className={surfaceStyles({ density: "roomy" }) + " "}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-pp-border ">
            <h3 className="text-lg font-black text-pp-text dark:text-white flex items-center gap-2">
              <PenSquare size={20} className="text-pp-accent-text" />
              {locale === "ko" ? "커뮤니티 글쓰기" : "Write Post"}
            </h3>
          </div>

          {error && (
            <div className="p-3 bg-pp-danger-soft/50 text-pp-danger-text rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label htmlFor={"youth-write-client-1"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                {locale === "ko" ? "제목 *" : "Title *"}
              </label>
              <input id={"youth-write-client-1"}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={locale === "ko" ? "글 제목을 입력해 주세요" : "Enter post title"}
                className={fieldStyles() + " w-full"}
              />
            </div>
            <div className="sm:w-1/3">
              <label className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                {locale === "ko" ? "작성자 닉네임" : "Posting as"}
              </label>
              <div className={surfaceStyles({ density: "none" , tone: "muted" }) + " w-full  truncate"}>
                {userProfile?.parent_nickname || (locale === "ko" ? "익명 학부모" : "Anonymous Parent")}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor={"youth-write-client-2"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
              {locale === "ko" ? "내용 *" : "Content *"}
            </label>
            <textarea id={"youth-write-client-2"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              placeholder={locale === "ko" ? "학부모님들과 나눌 정겹고 유익한 이야기를 들려주세요." : "Share helpful news or ask questions."}
              className={fieldStyles({ multiline: true }) + " w-full leading-relaxed pp-textarea"}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
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
                className={buttonStyles({ variant: "outline", size: "compact" }) + " flex items-center gap-1.5"}
              >
                {isUploadingImg ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon size={14} />
                )}
                {locale === "ko" ? "이미지 선택" : "Choose Image"}
              </button>
              {imageUrl && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-pp-border shrink-0">
                  <Image
                    src={imageUrl}
                    alt="Upload preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className={buttonStyles({ variant: "danger", size: "compact" }) + " pp-icon-button absolute top-0 right-0"}
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
              className={buttonStyles({ variant: "secondary", size: "compact" })}
            >
              {locale === "ko" ? "취소" : "Cancel"}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImg}
              className={buttonStyles({ variant: "primary", size: "default" }) + " "}
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
