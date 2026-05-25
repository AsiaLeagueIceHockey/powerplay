"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { 
  applyForParentMembership, 
  createParentPost, 
  deleteParentPost, 
  uploadParentPostImage,
  createParentNews,
  deleteParentNews,
  updateParentNickname,
  ParentApplication,
  ParentPost,
  ParentNews
} from "@/app/actions/parent";
import { 
  Sparkles, 
  MessageSquare, 
  Newspaper, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  PenSquare, 
  ImageIcon, 
  X, 
  Loader2, 
  Trash2,
  Lock,
  Pencil,
  Users,
  Plus,
  Heart,
  Eye
} from "lucide-react";

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
  const [appDescription, setAppDescription] = useState(myApplication?.description || "");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Community Post States
  const [posts, setPosts] = useState<ParentPost[]>(initialPosts);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [isUploadingPostImg, setIsUploadingPostImg] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const postFileRef = useRef<HTMLInputElement>(null);

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
    if (!childName || !childBirthYear || !childClub) {
      setAppError(locale === "ko" ? "필수 항목을 모두 입력해 주세요." : "Please fill in all required fields.");
      return;
    }
    const birthYearNum = parseInt(childBirthYear);
    if (isNaN(birthYearNum) || birthYearNum < 2000 || birthYearNum > new Date().getFullYear()) {
      setAppError(locale === "ko" ? "올바른 출생 연도를 입력해 주세요." : "Please enter a valid birth year.");
      return;
    }

    setIsSubmittingApp(true);
    setAppError(null);

    const res = await applyForParentMembership(childName, birthYearNum, childClub, appDescription);
    setIsSubmittingApp(false);

    if (res.success) {
      router.refresh();
    } else {
      setAppError(res.error || "Failed to submit application.");
    }
  };

  // Image Upload handler for Post/News
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "post" | "news") => {
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

    if (type === "post") {
      setIsUploadingPostImg(true);
    } else {
      setIsUploadingNewsImg(true);
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadParentPostImage(formData);

    if (type === "post") {
      setIsUploadingPostImg(false);
      if (res.url) {
        setPostImageUrl(res.url);
      } else {
        setPostError(res.error || "Upload failed");
      }
    } else {
      setIsUploadingNewsImg(false);
      if (res.url) {
        setNewsImageUrl(res.url);
      } else {
        setNewsError(res.error || "Upload failed");
      }
    }
  };

  // Handle Post Submit
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postContent) {
      setPostError(locale === "ko" ? "제목과 내용을 입력해 주세요." : "Please enter title and content.");
      return;
    }

    const currentNickname = userProfile?.parent_nickname || userProfile?.full_name || `${myApplication?.child_name || "학부모"} 학부모`;

    setIsSubmittingPost(true);
    setPostError(null);

    const res = await createParentPost(postTitle, postContent, currentNickname, postImageUrl);
    setIsSubmittingPost(false);

    if (res.success && res.post) {
      setPosts([res.post, ...posts]);
      setPostTitle("");
      setPostContent("");
      setPostImageUrl("");
      setShowPostForm(false);
      router.refresh();
    } else {
      setPostError(res.error || "Failed to create post.");
    }
  };

  // Handle Parent Nickname Update
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
      <div className="max-w-4xl mx-auto space-y-10 py-6 px-4">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <span className="px-2.5 py-0.5 bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
            PowerYouth Space
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            {locale === "ko" ? "유소년 하키 학부모를 위한" : "For Youth Hockey Parents"}{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {locale === "ko" ? "파워유스 커뮤니티" : "PowerYouth Space"}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {locale === "ko" 
              ? "파워유스는 인증된 학부모들만 함께하는 소통 공간입니다. 유소년 대관 정보, 장비 후기 등 유익한 정보를 함께 나눠보세요."
              : "PowerYouth is a verified community for youth hockey parents. Share training schedules, gear reviews, and helpful tips."}
          </p>
          <div className="pt-2">
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-500/10 hover:opacity-95 transition cursor-pointer select-none"
            >
              {locale === "ko" ? "로그인하고 인증 받기" : "Login & Request Verification"}
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {locale === "ko" ? "학부모 전용 소통 게시판" : "Parent Only Board"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {locale === "ko"
                ? "자유로운 닉네임으로 학부모님들 간 활발한 정보 교류와 아이스하키 관련 다양한 고민 상담을 나눌 수 있습니다."
                : "Communicate and share tips comfortably with other hockey parents using a safe nickname."}
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Newspaper size={20} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {locale === "ko" ? "아이스하키 핵심 소식" : "Curated Hockey News"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {locale === "ko"
                ? "장비 리뷰, 신규 유소년 대관 일정 등 유소년 하키에 필수적인 소식들을 한눈에 확인하세요."
                : "Access youth gear reviews, local rink schedules, training tips, and junior hockey information."}
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {locale === "ko" ? "안전한 학부모 인증제" : "Verified Parent Space"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {locale === "ko"
                ? "자녀 정보를 기반으로 운영진이 직접 승인하여, 안심하고 활동할 수 있는 신뢰 공간을 제공합니다."
                : "Only approved parents are granted access, ensuring a safe, helpful, and trusted community."}
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
      <div className="max-w-lg mx-auto py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock size={36} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
              {locale === "ko" ? "학부모 인증 심사 중" : "Verification Under Review"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {locale === "ko"
                ? "제출하신 정보로 학부모 인증 심사가 진행 중입니다. 승인은 보통 1~2일 내에 완료됩니다. 승인이 완료되면 푸시 알림으로 알려드릴게요!"
                : "Your verification is currently under review. This usually takes 1-2 days. You'll receive a push notification once approved!"}
            </p>
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <div className="text-left space-y-2.5 text-sm bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-zinc-400">{locale === "ko" ? "자녀 이름" : "Child Name"}</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{childName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{locale === "ko" ? "출생 연도" : "Birth Year"}</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{childBirthYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{locale === "ko" ? "소속 클럽" : "Club"}</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{childClub}</span>
              </div>
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
      <div className="max-w-xl mx-auto py-6 space-y-6">
        {status === "rejected" && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-5 flex items-start gap-4">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-800 dark:text-red-300">
                {locale === "ko" ? "학부모 인증 심사가 반려되었습니다" : "Verification Request Rejected"}
              </h4>
              <p className="text-xs text-red-700 dark:text-red-400/90 leading-relaxed">
                {locale === "ko" ? "반려 사유: " : "Reason: "}{" "}
                <span className="font-bold underline">{myApplication?.rejection_reason || (locale === "ko" ? "입력 정보를 다시 확인해 주세요." : "Please check your inputs.")}</span>
              </p>
              <p className="text-xs text-red-600 dark:text-red-400/70 pt-1">
                {locale === "ko" ? "제출 정보를 보완하여 재신청하실 수 있습니다." : "You can submit correct details below to request again."}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              {locale === "ko" ? "학부모 인증 신청서" : "Parent Verification Form"}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {locale === "ko"
                ? "파워유스는 검증된 유소년 하키 학부모만 입장 가능한 프라이빗 커뮤니티입니다. 자녀분의 실명, 출생연도, 실제 활동 중인 클럽명을 올바르게 입력해 주세요."
                : "PowerYouth is exclusive for verified youth hockey parents. Please enter your child's real name, birth year, and current club."}
            </p>
          </div>

          <form onSubmit={handleAppSubmit} className="space-y-4 pt-2">
            {appError && (
              <div className="p-3.5 bg-red-900/50 text-red-100 rounded-xl text-xs font-semibold">
                {appError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {locale === "ko" ? "자녀 이름 *" : "Child Name *"}
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
                placeholder={locale === "ko" ? "자녀분의 실명을 입력해 주세요" : "Enter child's full name"}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {locale === "ko" ? "자녀 출생 연도 *" : "Child Birth Year *"}
                </label>
                <input
                  type="number"
                  value={childBirthYear}
                  onChange={(e) => setChildBirthYear(e.target.value)}
                  required
                  placeholder="예: 2015"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {locale === "ko" ? "소속 클럽팀 *" : "Current Club Team *"}
                </label>
                <input
                  type="text"
                  value={childClub}
                  onChange={(e) => setChildClub(e.target.value)}
                  required
                  placeholder={locale === "ko" ? "소속 클럽명을 입력해 주세요" : "e.g. Incheon Junior"}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {locale === "ko" ? "가입 신청 한마디 (선택)" : "Intro Memo (Optional)"}
              </label>
              <textarea
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                rows={3}
                placeholder={locale === "ko" ? "승인을 돕기 위해 추가로 알리고 싶으신 내용을 적어주세요." : "Add any details that could help verify your application."}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingApp}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:opacity-95 hover:scale-[1.005] active:scale-[0.995] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
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
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Welcome Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
            {locale === "ko" ? "인증 학부모" : "Verified"}
          </span>
          <span className="font-extrabold text-zinc-900 dark:text-white">
            {userProfile?.full_name || user?.email?.split("@")[0]}
          </span>
          <span className="text-zinc-400 font-medium">
            ({myApplication?.child_name} {myApplication?.child_birth_year}년생 • {myApplication?.child_club})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-bold">{locale === "ko" ? "커뮤니티 닉네임:" : "Nickname:"}</span>
          {isEditingNickname ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder={locale === "ko" ? "예: 리틀하키" : "e.g. LittleHockey"}
                className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-semibold focus:border-violet-500 focus:outline-none w-28"
              />
              <button
                onClick={handleSaveNickname}
                disabled={isSavingNickname}
                className="px-2 py-0.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-bold transition disabled:opacity-50"
              >
                {isSavingNickname ? "..." : (locale === "ko" ? "저장" : "Save")}
              </button>
              <button
                onClick={() => {
                  setIsEditingNickname(false);
                  setNicknameInput(userProfile?.parent_nickname || "");
                  setNicknameError(null);
                }}
                className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-700 dark:text-zinc-200 rounded text-[10px] font-bold transition"
              >
                {locale === "ko" ? "취소" : "Cancel"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-bold text-violet-600 dark:text-violet-400">
                {userProfile?.parent_nickname || (locale === "ko" ? "미설정" : "Not set")}
              </span>
              <button
                onClick={() => {
                  setNicknameInput(userProfile?.parent_nickname || "");
                  setIsEditingNickname(true);
                }}
                className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-600 transition"
                title={locale === "ko" ? "닉네임 변경" : "Edit Nickname"}
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          {nicknameError && (
            <span className="text-[10px] font-semibold text-red-500">{nicknameError}</span>
          )}
        </div>
      </div>

      {/* Top Tabs (Community / News) */}
      <nav className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6" aria-label="Youth sections">
        {[
          { key: "community" as const, label: locale === "ko" ? "학부모 커뮤니티" : "Community" },
          { key: "news" as const, label: locale === "ko" ? "하키 소식" : "Hockey News" }
        ].map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 pb-3 text-center text-base sm:text-lg font-bold transition-colors cursor-pointer focus:outline-none ${
                isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="inline-flex items-center justify-center gap-2">{tab.label}</span>
              {isActive ? (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-violet-600 dark:bg-violet-400" />
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-400">
              <MessageSquare className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-sm">{locale === "ko" ? "등록된 게시글이 없습니다. 첫 글을 작성해 보세요!" : "No posts yet. Write the first post!"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-500 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Header (Avatar + Nickname + Date + Delete) */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-[10px] uppercase">
                          {post.nickname.charAt(0)}
                        </div>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {post.nickname}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-zinc-400 dark:text-zinc-500">
                          {formatDate(post.created_at)}
                        </span>
                      </div>

                      {(isSuperUser || post.user_id === user.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostDelete(post.id);
                          }}
                          className="relative z-10 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-500 rounded transition animate-in fade-in duration-200 cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Middle: Title, Content Snippet & Image Preview (Blind style side-by-side) */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                          <Link 
                            href={`/${locale}/youth/community/${post.id}`} 
                            className="block truncate focus:outline-none after:absolute after:inset-0 after:z-0"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {post.image_url && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
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
                  <div className="flex items-center gap-4 text-xs text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 mt-3">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <MessageSquare size={14} className="text-zinc-400" />
                      <span className="font-bold text-[11px]">{post.comment_count || 0}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <Heart 
                        size={14} 
                        className={post.is_liked ? "fill-red-500 text-red-500" : "text-zinc-400"} 
                      />
                      <span className="font-bold text-[11px]">{post.likes_count || 0}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <Eye size={14} className="text-zinc-400" />
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              {!showNewsForm ? (
                <button
                  onClick={() => setShowNewsForm(true)}
                  className="w-full py-3 border-2 border-dashed border-amber-500/30 hover:border-amber-500 hover:bg-amber-50/10 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 transition flex items-center justify-center gap-2"
                >
                  <PenSquare size={16} />
                  [어드민] 새 하키 소식(공지) 등록
                </button>
              ) : (
                <form onSubmit={handleNewsSubmit} className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="font-bold text-amber-500 flex items-center gap-2">
                      <Lock size={16} />
                      [어드민] 하키 소식 작성
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewsForm(false)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {newsError && (
                    <div className="p-3 bg-red-950/50 text-red-200 rounded-xl text-xs font-semibold">
                      {newsError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      소식 제목 *
                    </label>
                    <input
                      type="text"
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                      required
                      placeholder="예: 2026 여름 방학 주니어 골리 하키 캠프 모집 일정"
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      소식 상세 내용 *
                    </label>
                    <textarea
                      value={newsContent}
                      onChange={(e) => setNewsContent(e.target.value)}
                      required
                      rows={5}
                      placeholder="상세 혜택, 링크 예약 및 비용 등 공지 내용을 적어주세요."
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none transition text-sm"
                    />
                  </div>

                  {/* Photo Upload inside News */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      커버 이미지 첨부
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        ref={newsFileRef}
                        onChange={(e) => handleImageUpload(e, "news")}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => newsFileRef.current?.click()}
                        disabled={isUploadingNewsImg}
                        className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition flex items-center gap-1.5"
                      >
                        {isUploadingNewsImg ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImageIcon size={14} />
                        )}
                        이미지 선택
                      </button>
                      {newsImageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                          <Image
                            src={newsImageUrl}
                            alt="Upload preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setNewsImageUrl("")}
                            className="absolute top-0 right-0 bg-red-600/80 text-white rounded-bl p-0.5 hover:bg-red-600 transition"
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
                      className="px-4 py-2 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg hover:opacity-90"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingNews || isUploadingNewsImg}
                      className="px-5 py-2 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
                    >
                      {isSubmittingNews ? "등록 중..." : "등록하기"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* News List */}
          {news.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-400">
              <Newspaper className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-sm">{locale === "ko" ? "등록된 하키 소식이 없습니다." : "No hockey news yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header (Avatar + Notice Label + Date + Delete) */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">
                          P
                        </div>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {locale === "ko" ? "공지사항" : "Notice"}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-zinc-400 dark:text-zinc-500">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {isSuperUser && (
                        <button
                          onClick={() => handleNewsDelete(item.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-500 rounded transition"
                          title="Delete News"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Middle: Title, Content & Image Preview (Blind style side-by-side) */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                          {item.title}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {item.content}
                        </p>
                      </div>

                      {item.image_url && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
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
          className="fixed bottom-20 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          title={locale === "ko" ? "새 글 작성" : "Write Post"}
        >
          <Plus size={28} strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}
