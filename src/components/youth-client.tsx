"use client";
import { buttonStyles, surfaceStyles, fieldStyles, segmentedItemStyles } from "@/components/ui/styles";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { updateParentNickname, applyForParentMembership, deleteParentPost, uploadParentPostImage, createParentNews, deleteParentNews, uploadVerificationPhoto, ParentApplication, ParentPost, ParentNews } from "@/app/actions/parent";
import { YouthAccessBanner } from "./youth-access-banner";
import { MessageSquare, Newspaper, ShieldCheck, Clock, AlertTriangle, ChevronRight, PenSquare, ImageIcon, X, Loader2, Trash2, Lock, Pencil, Plus, Heart, Eye } from "lucide-react";

interface YouthClientProps {
  locale: string;
  user: User | null;
  userProfile: { full_name: string | null; parent_verification_status: string; parent_nickname?: string | null } | null;
  myApplication: ParentApplication | null;
  initialPosts: ParentPost[];
  newsList: ParentNews[];
  isSuperUser: boolean;
}

export function YouthClient({
  locale,
  user,
  userProfile,
  myApplication,
  initialPosts,
  newsList,
  isSuperUser,
}: YouthClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"community" | "news">("community");

  // Parent Nickname Editing States
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(userProfile?.parent_nickname || "");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // Application Form State (determined by status)
  const showForm = userProfile?.parent_verification_status === "none" || userProfile?.parent_verification_status === "rejected";
  const [childName, setChildName] = useState(myApplication?.child_name || "");
  const [childBirthYear, setChildBirthYear] = useState(myApplication?.child_birth_year ? String(myApplication?.child_birth_year) : "");
  const [childClub, setChildClub] = useState(myApplication?.child_club || "");
  const [parentType, setParentType] = useState(myApplication?.parent_type || "mother");
  const [verificationPhotoUrl, setVerificationPhotoUrl] = useState(myApplication?.verification_photo_url || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [appDescription, setAppDescription] = useState(myApplication?.description || "");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);

  // Community Post States
  const [posts, setPosts] = useState<ParentPost[]>(initialPosts);
  // News States
  const [news, setNews] = useState<ParentNews[]>(newsList);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [isUploadingNewsImg, setIsUploadingNewsImg] = useState(false);
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const newsFileRef = useRef<HTMLInputElement>(null);

  const status = userProfile?.parent_verification_status || "none";

  // Handle Application Submit
  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !childBirthYear || !childClub || !parentType) {
      setAppError(locale === "ko" ? "필수 항목을 모두 입력해 주세요." : "Please fill in all required fields.");
      return;
    }
    const birthYearNum = parseInt(childBirthYear);
    if (isNaN(birthYearNum) || birthYearNum < 2000 || birthYearNum > new Date().getFullYear()) {
      setAppError(locale === "ko" ? "올바른 출생 연도를 입력해 주세요." : "Please enter a valid birth year.");
      return;
    }

    if (!verificationPhotoUrl) {
      setAppError(locale === "ko" ? "자녀 하키 활동 사진을 업로드해 주세요." : "Please upload a child hockey photo.");
      return;
    }

    setIsSubmittingApp(true);
    setAppError(null);

    const res = await applyForParentMembership(
      childName,
      birthYearNum,
      childClub,
      parentType,
      verificationPhotoUrl,
      appDescription
    );
    setIsSubmittingApp(false);

    if (res.success) {
      router.refresh();
    } else {
      setAppError(res.error || "Failed to submit application.");
    }
  };

  // Handle Verification Photo Upload
  const handleVerificationPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingPhoto(true);
    setAppError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadVerificationPhoto(formData);
    setIsUploadingPhoto(false);

    if (res.url) {
      setVerificationPhotoUrl(res.url);
    } else {
      setAppError(res.error || (locale === "ko" ? "이미지 업로드에 실패했습니다." : "Upload failed"));
    }
  };

  // Image Upload handler for Post/News
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

    setIsUploadingNewsImg(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadParentPostImage(formData);

    setIsUploadingNewsImg(false);
    if (res.url) setNewsImageUrl(res.url);
    else setNewsError(res.error || "Upload failed");
  };

  const handleSaveNickname = async () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      setNicknameError(locale === "ko" ? "닉네임을 입력해 주세요." : "Please enter a nickname.");
      return;
    }
    setIsSavingNickname(true);
    setNicknameError(null);
    const res = await updateParentNickname(trimmed);
    setIsSavingNickname(false);
    if (res.success) {
      setIsEditingNickname(false);
      router.refresh();
    } else {
      setNicknameError(res.error || (locale === "ko" ? "저장에 실패했습니다." : "Failed to save nickname."));
    }
  };

  // Handle Post Delete
  const handlePostDelete = async (postId: string) => {
    if (!confirm(locale === "ko" ? "정말 이 게시글을 삭제하시겠습니까?" : "Are you sure you want to delete this post?")) {
      return;
    }
    const res = await deleteParentPost(postId);
    if (res.success) {
      setPosts(posts.filter((p) => p.id !== postId));
    } else {
      alert(res.error || "Failed to delete post.");
    }
  };

  // Handle News Submit
  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) {
      setNewsError(locale === "ko" ? "제목과 내용을 입력해 주세요." : "Please enter title and content.");
      return;
    }

    setIsSubmittingNews(true);
    setNewsError(null);

    const res = await createParentNews(newsTitle, newsContent, newsImageUrl);
    setIsSubmittingNews(false);

    if (res.success && res.news) {
      setNews([res.news, ...news]);
      setNewsTitle("");
      setNewsContent("");
      setNewsImageUrl("");
      setShowNewsForm(false);
      router.refresh();
    } else {
      setNewsError(res.error || "Failed to create news.");
    }
  };

  // Handle News Delete
  const handleNewsDelete = async (newsId: string) => {
    if (!confirm(locale === "ko" ? "정말 이 소식을 삭제하시겠습니까?" : "Are you sure you want to delete this news?")) {
      return;
    }
    const res = await deleteParentNews(newsId);
    if (res.success) {
      setNews(news.filter((n) => n.id !== newsId));
    } else {
      alert(res.error || "Failed to delete news.");
    }
  };

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

  // ==========================================
  // VIEW 1: Unauthenticated Landing Page
  // ==========================================
  if (!user) {
    return (
      <div data-ui-theme="youth" className="max-w-4xl mx-auto space-y-10 py-6 px-4">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-pp-text dark:text-white leading-tight">
            {locale === "ko" ? "유소년 하키 학부모님들을 위한 공간" : "Space for Youth Hockey Parents"}
          </h1>
          <p className="text-sm sm:text-base text-pp-muted max-w-xl mx-auto leading-relaxed">
            {locale === "ko"
              ? "파워플레이 유스는 인증된 아이스하키 유소년 학부모님들이 함께 소통하는 공간입니다. 서로의 고민을 함께 나눠보세요."
              : "PowerPlay Youth is a community for verified youth ice hockey parents. Share advice and discuss your challenges together."}
          </p>
          <div className="pt-2">
            <Link
              href={`/${locale}/login`}
              className={buttonStyles({ variant: "primary", size: "compact" }) + " inline-flex items-center gap-2"}
            >
              {locale === "ko" ? "로그인하고 인증 받기" : "Login & Request Verification"}
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          <div className={surfaceStyles({ density: "comfortable" }) + " space-y-2"}>
            <div className="w-10 h-10 rounded-xl bg-pp-accent-soft flex items-center justify-center text-pp-accent-text ">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-base font-bold text-pp-text dark:text-white">
              {locale === "ko" ? "학부모 전용 소통 게시판" : "Parent Only Board"}
            </h3>
            <p className="text-xs text-pp-muted leading-relaxed">
              {locale === "ko"
                ? "익명으로 아이스하키 관련 정보 교류와 다양한 고민을 나눌 수 있습니다."
                : "Share information and discuss concerns anonymously with other parents."}
            </p>
          </div>

          <div className={surfaceStyles({ density: "comfortable" }) + " space-y-2"}>
            <div className="w-10 h-10 rounded-xl bg-pp-info-soft flex items-center justify-center text-pp-info-text ">
              <Newspaper size={20} />
            </div>
            <h3 className="text-base font-bold text-pp-text dark:text-white">
              {locale === "ko" ? "아이스하키 소식" : "Hockey News"}
            </h3>
            <p className="text-xs text-pp-muted leading-relaxed">
              {locale === "ko"
                ? "유소년 하키에 필수적인 소식들을 한눈에 확인하세요."
                : "Access essential news and updates for youth hockey parents."}
            </p>
          </div>

          <div className={surfaceStyles({ density: "comfortable" }) + " space-y-2"}>
            <div className="w-10 h-10 rounded-xl bg-pp-success-soft flex items-center justify-center text-pp-success-text ">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-pp-text dark:text-white">
              {locale === "ko" ? "안전한 학부모 인증제" : "Verified Parent Space"}
            </h3>
            <p className="text-xs text-pp-muted leading-relaxed">
              {locale === "ko"
                ? "자녀 정보를 기반으로 운영진이 직접 승인합니다"
                : "Verified directly by the administrator based on child information."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: Pending/Under Review View
  // ==========================================
  if (status === "pending") {
    return (
      <div data-ui-theme="youth" className="max-w-lg mx-auto py-12">
        <div className={surfaceStyles({ density: "none" }) + " text-center space-y-6"}>
          <div className="w-16 h-16 bg-pp-warning-soft text-pp-warning-text rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock size={36} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-pp-text dark:text-white">
              {locale === "ko" ? "학부모 인증 심사 중" : "Verification Under Review"}
            </h1>
            <p className="text-sm text-pp-muted leading-relaxed">
              {locale === "ko"
                ? "제출하신 정보로 학부모 인증 심사가 진행 중입니다. 승인은 보통 1~2일 내에 완료됩니다. 승인이 완료되면 푸시 알림으로 알려드릴게요!"
                : "Your verification is currently under review. This usually takes 1-2 days. You'll receive a push notification once approved!"}
            </p>
          </div>
          <div className="border-t border-pp-border pt-6">
            <div className="text-left space-y-2.5 text-sm bg-pp-surface-muted p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-pp-muted">{locale === "ko" ? "관계" : "Relationship"}</span>
                <span className="font-semibold text-pp-text ">
                  {parentType === "mother" ? (locale === "ko" ? "엄마" : "Mother") : (locale === "ko" ? "아빠" : "Father")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-pp-muted">{locale === "ko" ? "자녀 이름" : "Child Name"}</span>
                <span className="font-semibold text-pp-text ">{childName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pp-muted">{locale === "ko" ? "출생 연도" : "Birth Year"}</span>
                <span className="font-semibold text-pp-text ">{childBirthYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pp-muted">{locale === "ko" ? "소속 클럽" : "Club"}</span>
                <span className="font-semibold text-pp-text ">{childClub}</span>
              </div>
              {verificationPhotoUrl && (
                <div className="space-y-1.5 pt-2 border-t border-pp-border ">
                  <span className="text-pp-muted text-xs block">{locale === "ko" ? "인증 사진" : "Verification Photo"}</span>
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-pp-border bg-pp-surface-muted ">
                    <Image
                      src={verificationPhotoUrl}
                      alt="Verification photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: Rejected / Not Applied / Form Display
  // ==========================================
  if (showForm) {
    return (
      <div data-ui-theme="youth" className="max-w-xl mx-auto py-6 space-y-6">
        {status === "rejected" && (
          <div className="bg-pp-danger-soft border border-pp-danger-border rounded-xl p-5 flex items-start gap-4">
            <AlertTriangle className="text-pp-danger-text shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-pp-danger-text ">
                {locale === "ko" ? "학부모 인증 심사가 반려되었습니다" : "Verification Request Rejected"}
              </h4>
              <p className="text-xs text-pp-danger-text leading-relaxed">
                {locale === "ko" ? "반려 사유: " : "Reason: "}{" "}
                <span className="font-bold underline">{myApplication?.rejection_reason || (locale === "ko" ? "입력 정보를 다시 확인해 주세요." : "Please check your inputs.")}</span>
              </p>
              <p className="text-xs text-pp-danger-text pt-1">
                {locale === "ko" ? "제출 정보를 보완하여 재신청하실 수 있습니다." : "You can submit correct details below to request again."}
              </p>
            </div>
          </div>
        )}

        <div className={surfaceStyles({ density: "roomy" }) + " space-y-6"}>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-pp-accent-soft text-pp-accent-text rounded-xl flex items-center justify-center">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-2xl font-black text-pp-text dark:text-white">
              {locale === "ko" ? "학부모 인증 신청서" : "Parent Verification Form"}
            </h2>
            <p className="text-xs text-pp-muted leading-relaxed">
              {locale === "ko"
                ? "파워유스는 검증된 유소년 하키 학부모만 입장 가능한 프라이빗 커뮤니티입니다. 자녀분의 실명, 출생연도, 실제 활동 중인 클럽명을 올바르게 입력해 주세요."
                : "PowerYouth is exclusive for verified youth hockey parents. Please enter your child's real name, birth year, and current club."}
            </p>
          </div>

          <form onSubmit={handleAppSubmit} className="space-y-4 pt-2">
            {appError && (
              <div className="p-3.5 bg-pp-danger-soft/50 text-pp-danger-text rounded-xl text-xs font-semibold">
                {appError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                {locale === "ko" ? "관계 *" : "Relationship *"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setParentType("mother")}
                  aria-pressed={parentType === "mother"} className={segmentedItemStyles({ selected: parentType === "mother" })}
                >
                  {locale === "ko" ? "엄마" : "Mother"}
                </button>
                <button
                  type="button"
                  onClick={() => setParentType("father")}
                  aria-pressed={parentType === "father"} className={segmentedItemStyles({ selected: parentType === "father" })}
                >
                  {locale === "ko" ? "아빠" : "Father"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor={"youth-client-1"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                {locale === "ko" ? "자녀 이름 *" : "Child Name *"}
              </label>
              <input id={"youth-client-1"}
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
                placeholder={locale === "ko" ? "자녀분의 실명을 입력해 주세요" : "Enter child's full name"}
                className={fieldStyles() + " w-full"}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={"youth-client-2"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                  {locale === "ko" ? "자녀 출생 연도 *" : "Child Birth Year *"}
                </label>
                <input id={"youth-client-2"}
                  type="number"
                  value={childBirthYear}
                  onChange={(e) => setChildBirthYear(e.target.value)}
                  required
                  placeholder="예: 2015"
                  className={fieldStyles() + " w-full"}
                />
              </div>

              <div>
                <label htmlFor={"youth-client-3"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                  {locale === "ko" ? "소속 클럽팀 *" : "Current Club Team *"}
                </label>
                <input id={"youth-client-3"}
                  type="text"
                  value={childClub}
                  onChange={(e) => setChildClub(e.target.value)}
                  required
                  placeholder={locale === "ko" ? "소속 클럽명을 입력해 주세요" : "e.g. Incheon Junior"}
                  className={fieldStyles() + " w-full"}
                />
              </div>
            </div>

            <div>
              <label htmlFor={"youth-client-4"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                {locale === "ko" ? "자녀 하키 활동 사진 *" : "Child Hockey Photo *"}
              </label>
              <input id={"youth-client-4"}
                type="file"
                ref={photoFileRef}
                onChange={handleVerificationPhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => photoFileRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className={buttonStyles({ variant: "outline", size: "compact" }) + " flex items-center gap-1.5"}
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon size={14} />
                  )}
                  {locale === "ko" ? "사진 업로드" : "Upload Photo"}
                </button>
                {verificationPhotoUrl && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-pp-border shrink-0">
                    <Image
                      src={verificationPhotoUrl}
                      alt="Verification photo preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setVerificationPhotoUrl("")}
                      className={buttonStyles({ variant: "danger", size: "compact" }) + " pp-icon-button absolute top-0 right-0"}
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-pp-muted mt-1.5 leading-relaxed">
                {locale === "ko"
                  ? "아이의 아이스하키 활동 사진을 올려주세요. (승인을 확인하는 용도로만 사용됩니다)"
                  : "Please upload a photo of your child participating in ice hockey (used for verification only)."}
              </p>
            </div>

            <div>
              <label htmlFor={"youth-client-5"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                {locale === "ko" ? "가입 신청 한마디 (선택)" : "Intro Memo (Optional)"}
              </label>
              <textarea id={"youth-client-5"}
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                rows={3}
                placeholder={locale === "ko" ? "승인을 돕기 위해 추가로 알리고 싶으신 내용을 적어주세요." : "Add any details that could help verify your application."}
                className={fieldStyles({ multiline: true }) + " w-full pp-textarea"}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingApp}
              className={buttonStyles({ variant: "primary", size: "large" }) + " w-full flex items-center justify-center gap-2"}
            >
              {isSubmittingApp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {locale === "ko" ? "제출 중..." : "Submitting..."}
                </>
              ) : (
                locale === "ko" ? "인증 신청서 제출" : "Submit Verification"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: Approved Space / Dashboard
  // ==========================================
  return (
    <div data-ui-theme="youth" className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Welcome Heading */}
      <div className={surfaceStyles({ density: "default", tone: "muted" }) + " flex flex-wrap items-center justify-between gap-3  "}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-pp-accent-soft text-pp-accent-text text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
            {locale === "ko" ? "인증 학부모" : "Verified"}
          </span>
          <span className="font-extrabold text-pp-text dark:text-white">
            {userProfile?.full_name || user?.email?.split("@")[0]}
          </span>
          <span className="text-pp-muted font-medium">
            ({myApplication?.child_name} {myApplication?.child_birth_year}년생 • {myApplication?.child_club})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-pp-muted font-bold">{locale === "ko" ? "커뮤니티 닉네임:" : "Nickname:"}</span>
          {isEditingNickname ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={nicknameInput}
                aria-label={locale === "ko" ? "닉네임" : "Nickname"}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder={locale === "ko" ? "예: 리틀하키" : "e.g. LittleHockey"}
                className={fieldStyles() + " w-28"}
              />
              <button type="button"
                onClick={handleSaveNickname}
                disabled={isSavingNickname}
                className={buttonStyles({ variant: "primary", size: "compact" })}
              >
                {isSavingNickname ? "..." : (locale === "ko" ? "저장" : "Save")}
              </button>
              <button type="button"
                onClick={() => {
                  setIsEditingNickname(false);
                  setNicknameInput(userProfile?.parent_nickname || "");
                  setNicknameError(null);
                }}
                className={buttonStyles({ variant: "secondary", size: "compact" })}
              >
                {locale === "ko" ? "취소" : "Cancel"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-bold text-pp-accent-text ">
                {userProfile?.parent_nickname || (locale === "ko" ? "미설정" : "Not set")}
              </span>
              <button type="button"
                onClick={() => {
                  setNicknameInput(userProfile?.parent_nickname || "");
                  setIsEditingNickname(true);
                }}
                className={buttonStyles({ variant: "secondary", size: "compact" })}
                title={locale === "ko" ? "닉네임 변경" : "Edit Nickname"}
                aria-label={locale === "ko" ? "닉네임 변경" : "Edit Nickname"}
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          {nicknameError && (
            <span className="text-[10px] font-semibold text-pp-danger-text">{nicknameError}</span>
          )}
        </div>
      </div>

      <YouthAccessBanner />

      {/* Top Tabs (Community / News) */}
      <nav className="flex border-b border-pp-border mb-6" aria-label="Youth sections">
        {[
          { key: "community" as const, label: locale === "ko" ? "학부모 커뮤니티" : "Community" },
          { key: "news" as const, label: locale === "ko" ? "하키 소식" : "Hockey News" }
        ].map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={segmentedItemStyles({ selected: isActive, kind: "tab" }) + " relative flex-1"}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="inline-flex items-center justify-center gap-2">{tab.label}</span>
              {isActive ? (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-pp-accent " />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* ==================================================== */}
      {/* 4A. Parent Community Tab */}
      {/* ==================================================== */}
      {activeTab === "community" && (
        <div className="space-y-6">
          {/* Posts List Feed */}
          {posts.length === 0 ? (
            <div className={surfaceStyles({ density: "roomy", tone: "muted" }) + " text-center "}>
              <MessageSquare className="w-12 h-12 mx-auto text-pp-muted mb-3" />
              <p className="text-sm">{locale === "ko" ? "등록된 게시글이 없습니다. 첫 글을 작성해 보세요!" : "No posts yet. Write the first post!"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={surfaceStyles({ density: "comfortable", interactive: true }) + " group relative flex flex-col justify-between cursor-pointer"}
                >
                  <div>
                    {/* Header (Avatar + Nickname + Date + Delete) */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-pp-accent-soft text-pp-accent-text flex items-center justify-center font-bold text-[10px] uppercase">
                          {post.nickname.charAt(0)}
                        </div>
                        <span className="font-semibold text-pp-muted ">
                          {post.nickname}
                        </span>
                        <span className="text-pp-muted ">•</span>
                        <span className="text-pp-muted ">
                          {formatDate(post.created_at)}
                        </span>
                      </div>

                      {(isSuperUser || post.user_id === user.id) && (
                        <button type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostDelete(post.id);
                          }}
                          className={buttonStyles({ variant: "ghost", size: "compact" }) + " pp-icon-button relative z-10"}
                          title="Delete Post"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Middle: Title, Content Snippet & Image Preview (Blind style side-by-side) */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <h3 className="font-bold text-base text-pp-text dark:text-white leading-snug group-hover:text-pp-accent-text transition">
                          <Link
                            href={`/${locale}/youth/community/${post.id}`}
                            className="block truncate focus:outline-none after:absolute after:inset-0 after:z-0"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-pp-muted line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {post.image_url && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-pp-border bg-pp-surface-muted ">
                          <Image
                            src={post.image_url}
                            alt="Post media thumbnail"
                            fill
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Comment, Likes, and Views Count */}
                  <div className="flex items-center gap-4 text-xs text-pp-muted pt-3 border-t border-pp-border mt-3">
                    <div className="flex items-center gap-1.5 text-pp-muted ">
                      <MessageSquare size={14} className="text-pp-muted" />
                      <span className="font-bold text-[11px]">{post.comment_count || 0}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-pp-muted ">
                      <Heart
                        size={14}
                        className={post.is_liked ? "fill-pp-danger text-pp-danger-text" : "text-pp-muted"}
                      />
                      <span className="font-bold text-[11px]">{post.likes_count || 0}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-pp-muted ">
                      <Eye size={14} className="text-pp-muted" />
                      <span className="font-bold text-[11px]">{post.views_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4B. Hockey News Tab */}
      {/* ==================================================== */}
      {activeTab === "news" && (
        <div className="space-y-6">
          {/* Admin News Write Card */}
          {isSuperUser && (
            <div className={surfaceStyles({ density: "roomy" }) + " "}>
              {!showNewsForm ? (
                <button type="button"
                  onClick={() => setShowNewsForm(true)}
                  className={buttonStyles({ variant: "warning", size: "compact" }) + " w-full flex items-center justify-center gap-2"}
                >
                  <PenSquare size={16} />
                  [어드민] 새 하키 소식(공지) 등록
                </button>
              ) : (
                <form onSubmit={handleNewsSubmit} className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-pp-border ">
                    <h3 className="font-bold text-pp-warning-text flex items-center gap-2">
                      <Lock size={16} />
                      [어드민] 하키 소식 작성
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewsForm(false)}
                      className={buttonStyles({ variant: "secondary", size: "compact" })}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {newsError && (
                    <div className="p-3 bg-pp-danger-soft/50 text-pp-danger-text rounded-xl text-xs font-semibold">
                      {newsError}
                    </div>
                  )}

                  <div>
                    <label htmlFor={"youth-client-6"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                      소식 제목 *
                    </label>
                    <input id={"youth-client-6"}
                      type="text"
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                      required
                      placeholder="예: 2026 여름 방학 주니어 골리 하키 캠프 모집 일정"
                      className={fieldStyles() + " w-full"}
                    />
                  </div>

                  <div>
                    <label htmlFor={"youth-client-7"} className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                      소식 상세 내용 *
                    </label>
                    <textarea id={"youth-client-7"}
                      value={newsContent}
                      onChange={(e) => setNewsContent(e.target.value)}
                      required
                      rows={5}
                      placeholder="상세 혜택, 링크 예약 및 비용 등 공지 내용을 적어주세요."
                      className={fieldStyles({ multiline: true }) + " w-full pp-textarea"}
                    />
                  </div>

                  {/* Photo Upload inside News */}
                  <div>
                    <label className="block text-xs font-bold text-pp-muted uppercase tracking-wider mb-2">
                      커버 이미지 첨부
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        ref={newsFileRef}
                        onChange={(e) => handleImageUpload(e)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => newsFileRef.current?.click()}
                        disabled={isUploadingNewsImg}
                        className={buttonStyles({ variant: "outline", size: "compact" }) + " flex items-center gap-1.5"}
                      >
                        {isUploadingNewsImg ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImageIcon size={14} />
                        )}
                        이미지 선택
                      </button>
                      {newsImageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-pp-border shrink-0">
                          <Image
                            src={newsImageUrl}
                            alt="Upload preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setNewsImageUrl("")}
                            className={buttonStyles({ variant: "danger", size: "compact" }) + " pp-icon-button absolute top-0 right-0"}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewsForm(false)}
                      className={buttonStyles({ variant: "secondary", size: "compact" })}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingNews || isUploadingNewsImg}
                      className={buttonStyles({ variant: "warning", size: "compact" })}
                    >
                      {isSubmittingNews ? (locale === "ko" ? "등록 중..." : "Posting…") : (locale === "ko" ? "등록하기" : "Post")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* News List */}
          {news.length === 0 ? (
            <div className={surfaceStyles({ density: "roomy", tone: "muted" }) + " text-center "}>
              <Newspaper className="w-12 h-12 mx-auto text-pp-muted mb-3" />
              <p className="text-sm">{locale === "ko" ? "등록된 하키 소식이 없습니다." : "No hockey news yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {news.map((item) => (
                <div
                  key={item.id}
                  className={surfaceStyles({ density: "comfortable", interactive: true }) + " group relative flex flex-col justify-between"}
                >
                  <div>
                    {/* Header (Avatar + Notice Label + Date + Delete) */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-pp-warning-soft text-pp-warning-text flex items-center justify-center font-bold text-[10px]">
                          P
                        </div>
                        <span className="font-semibold text-pp-muted ">
                          {locale === "ko" ? "공지사항" : "Notice"}
                        </span>
                        <span className="text-pp-muted ">•</span>
                        <span className="text-pp-muted ">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {isSuperUser && (
                        <button type="button"
                          onClick={() => handleNewsDelete(item.id)}
                          className={buttonStyles({ variant: "ghost", size: "compact" }) + " pp-icon-button"}
                          title="Delete News"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Middle: Title, Content & Image Preview (Blind style side-by-side) */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <h3 className="font-bold text-base text-pp-text dark:text-white leading-snug group-hover:text-pp-warning-text transition">
                          {item.title}
                        </h3>
                        <p className="text-sm text-pp-muted whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </p>
                      </div>

                      {item.image_url && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-pp-border bg-pp-surface-muted ">
                          <Image
                            src={item.image_url}
                            alt="News media thumbnail"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating compose button for community posts */}
      {activeTab === "community" && (
        <Link
          href={`/${locale}/youth/write`}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          title={locale === "ko" ? "새 글 작성" : "Write Post"}
        >
          <Plus size={28} strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}
