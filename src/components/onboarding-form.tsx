"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/app/actions/auth";
import { joinClub } from "@/app/actions/clubs";
import type { Club, ClubMembership } from "@/app/actions/types";
import { Check, Users, ChevronRight, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  position: "FW" | "DF" | "G" | null;
  preferred_lang: "ko" | "en" | null;
  role: "user" | "admin";
  onboarding_completed?: boolean;
  phone?: string | null;
  birth_date?: string | null;
  terms_agreed?: boolean;
}

interface OnboardingFormProps {
  profile: Profile | null;
  clubs: Club[];
  myClubs: ClubMembership[];
  locale: string;
}

export function OnboardingForm({ profile, clubs, myClubs, locale }: OnboardingFormProps) {
  const router = useRouter();
  const t = useTranslations("profile");
  const tMatch = useTranslations("match");
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedClubs, setSelectedClubs] = useState<string[]>(
    myClubs.map(m => m.club_id)
  );
  
  // Step 1 form data
  const [formData, setFormData] = useState<{
    fullName: string;
    position: "FW" | "DF" | "G" | null;
    preferredLang: string;
    phone: string;
    birthDate: string;
    termsAgreed: boolean;
  }>({
    fullName: profile?.full_name || "",
    position: profile?.position || null,
    preferredLang: profile?.preferred_lang || "ko",
    phone: profile?.phone || "",
    birthDate: profile?.birth_date || "",
    termsAgreed: profile?.terms_agreed || false,
  });

  const handleStep1Submit = async () => {
    if (!formData.termsAgreed) {
      alert(t("terms.required"));
      return;
    }
    setLoading(true);
    
    const fd = new FormData();
    fd.set("fullName", formData.fullName);
    fd.set("position", formData.position || "");
    fd.set("preferredLang", formData.preferredLang);
    fd.set("phone", formData.phone);
    fd.set("birthDate", formData.birthDate);
    fd.set("termsAgreed", formData.termsAgreed.toString());
    
    await updateProfile(fd);
    setLoading(false);
    setStep(2);
  };

  const handleClubToggle = (clubId: string) => {
    setSelectedClubs(prev => 
      prev.includes(clubId) 
        ? prev.filter(id => id !== clubId)
        : [...prev, clubId]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    
    // Join new clubs
    const existingClubIds = myClubs.map(m => m.club_id);
    const newClubIds = selectedClubs.filter(id => !existingClubIds.includes(id));
    
    for (const clubId of newClubIds) {
      await joinClub(clubId);
    }
    
    // Mark onboarding as complete
    const fd = new FormData();
    fd.set("fullName", formData.fullName);
    fd.set("position", formData.position || "");
    fd.set("preferredLang", formData.preferredLang);
    fd.set("phone", formData.phone);
    fd.set("birthDate", formData.birthDate);
    fd.set("termsAgreed", formData.termsAgreed.toString());
    fd.set("onboarding_completed", "true");
    await updateProfile(fd);
    
    router.push(`/${locale}`);
  };

  const handleSkip = async () => {
    // Mark onboarding as complete without changes (if valid)
    const fd = new FormData();
    fd.set("fullName", profile?.full_name || "");
    fd.set("position", profile?.position || "");
    fd.set("preferredLang", profile?.preferred_lang || "ko");
    fd.set("phone", profile?.phone || "");
    fd.set("birthDate", profile?.birth_date || "");
    fd.set("termsAgreed", String(profile?.terms_agreed || false));
    fd.set("onboarding_completed", "true");
    await updateProfile(fd);
    
    router.push(`/${locale}`);
  };

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          step >= 1 ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-700"
        }`}>
          {step > 1 ? <Check className="w-5 h-5" /> : "1"}
        </div>
        <div className={`w-16 h-1 ${step >= 2 ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"}`} />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          step >= 2 ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-700"
        }`}>
          2
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <h1 className="text-2xl font-bold">👋 환영합니다!</h1>
            <p className="text-zinc-500 mt-2">기본 정보를 입력해주세요</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("fullName")} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("phone")} <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("placeholder.phone")}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("birthDate")} <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                placeholder={t("placeholder.birthDate")}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("position")}</label>
              <select
                value={formData.position || ""}
                onChange={(e) => setFormData({ ...formData, position: (e.target.value as "FW" | "DF" | "G" | "") || null })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">{tMatch("position.NONE")}</option>
                <option value="FW">{tMatch("position.FW")}</option>
                <option value="DF">{tMatch("position.DF")}</option>
                <option value="G">{tMatch("position.G")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("preferredLang")}</label>
              <select
                value={formData.preferredLang}
                onChange={(e) => setFormData({ ...formData, preferredLang: e.target.value as "ko" | "en" })}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Terms Agreement */}
            <div className="pt-2">
              <label className="flex items-center space-x-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                <input
                  type="checkbox"
                  checked={formData.termsAgreed}
                  onChange={(e) => setFormData({ ...formData, termsAgreed: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="text-sm">
                  <span className="font-bold">{t("terms.title")}</span>
                  <p className="text-zinc-500">{t("terms.agree")}</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleStep1Submit}
            disabled={loading || !formData.fullName || !formData.phone || !formData.birthDate || !formData.termsAgreed}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>다음 <ChevronRight className="w-5 h-5" /></>}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <h1 className="text-2xl font-bold"><Users className="inline w-7 h-7 mr-2" />동호회 가입</h1>
            <p className="text-zinc-500 mt-2">소속 동호회가 있다면 선택하세요 (선택사항)</p>
          </div>

          {clubs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              등록된 동호회가 없습니다
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleClubToggle(club.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedClubs.includes(club.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{club.name}</div>
                      <div className="text-sm text-zinc-500">
                        멤버 {club.member_count || 0}명
                      </div>
                    </div>
                    {selectedClubs.includes(club.id) && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              이전
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "완료"}
            </button>
          </div>
        </div>
      )}

      {/* Skip Option */}
      <div className="text-center">
        <button
          onClick={handleSkip}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          나중에 설정하기
        </button>
      </div>
    </div>
  );
}
