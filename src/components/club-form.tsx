"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClub, updateClub, uploadClubLogo } from "@/app/actions/clubs";
import { Loader2, MessageCircle, Upload, User, Phone, X, Image as ImageIcon } from "lucide-react";
import type { Club } from "@/app/actions/types";
import Image from "next/image";

interface ClubFormProps {
  locale: string;
  club?: Club;
}

export function ClubForm({ locale, club }: ClubFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>(club?.logo_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!club;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadClubLogo(formData);

    if (result.error) {
      setError("이미지 업로드 실패: " + result.error);
    } else if (result.url) {
      setLogoUrl(result.url);
    }

    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Add logo_url to formData
    formData.set("logo_url", logoUrl);

    const result = isEdit
      ? await updateClub(club.id, formData)
      : await createClub(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${locale}/admin/clubs`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-lg">{error}</div>
      )}

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          <ImageIcon className="w-4 h-4 inline mr-1" />
          동호회 로고/사진 (선택)
        </label>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div 
            className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-800 overflow-hidden shrink-0"
          >
            {logoUrl ? (
              <Image 
                src={logoUrl} 
                alt="Club logo" 
                width={96} 
                height={96} 
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-zinc-600" />
            )}
          </div>

          <div className="flex-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "업로드 중..." : "이미지 선택"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="mt-2 px-3 py-1 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                이미지 삭제
              </button>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              PNG, JPG, GIF (최대 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* 동호회명 */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          동호회명 *
        </label>
        <input
          type="text"
          name="name"
          defaultValue={club?.name || ""}
          required
          placeholder="예: 파워플레이"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          동호회 소개 (선택)
        </label>
        <textarea
          name="description"
          defaultValue={club?.description || ""}
          rows={4}
          placeholder="동호회에 대한 간단한 소개를 입력해주세요."
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Representative Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            <User className="w-4 h-4 inline mr-1" />
            대표자 이름 (선택)
          </label>
          <input
            type="text"
            name="rep_name"
            defaultValue={club?.rep_name || ""}
            placeholder="홍길동"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-300">
            <Phone className="w-4 h-4 inline mr-1" />
            대표자 연락처 (선택)
          </label>
          <input
            type="tel"
            name="rep_phone"
            defaultValue={club?.rep_phone || ""}
            placeholder="010-1234-5678"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 카카오톡 오픈채팅 URL */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-300">
          <MessageCircle className="w-4 h-4 inline mr-1" />
          카카오톡 오픈채팅 URL (선택)
        </label>
        <p className="text-xs text-zinc-500 mb-2">
          동호회 오픈채팅방 링크를 입력하면 멤버들에게 노출됩니다.
        </p>
        <input
          type="url"
          name="kakao_open_chat_url"
          defaultValue={club?.kakao_open_chat_url || ""}
          placeholder="https://open.kakao.com/o/..."
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isEdit ? "저장 중..." : "생성 중..."}
          </>
        ) : isEdit ? (
          "저장"
        ) : (
          "동호회 등록"
        )}
      </button>
    </form>
  );
}
