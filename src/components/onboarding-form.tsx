"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/app/actions/auth";
import { Check, Loader2 } from "lucide-react";
import { BirthDatePicker } from "@/components/birth-date-picker";

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
  locale: string;
}

export function OnboardingForm({ profile, locale }: OnboardingFormProps) {
  const router = useRouter();
  const t = useTranslations("profile");
  const tMatch = useTranslations("match");
  
  const [loading, setLoading] = useState(false);
  
  // Form data
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

  // Terms Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleSubmit = async () => {
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
    fd.set("onboarding_completed", "true"); // Complete onboarding immediately
    
    await updateProfile(fd);
    
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <>
      <div className="space-y-8">
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
              <BirthDatePicker 
                value={formData.birthDate}
                onChange={(date) => setFormData({ ...formData, birthDate: date })}
                placeholder={t("placeholder.birthDate")}
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
              <label className="flex items-start space-x-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition relative">
                <input
                  type="checkbox"
                  checked={formData.termsAgreed}
                  onChange={(e) => setFormData({ ...formData, termsAgreed: e.target.checked })}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm block">{t("terms.title")} <span className="text-red-500 text-xs font-normal">{t("terms.required")}</span></span>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="text-xs text-zinc-500 underline hover:text-blue-500 z-10"
                    >
                      {t("terms.viewDetails")}
                    </button>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1 leading-snug">{t("terms.agree")}</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !formData.fullName || !formData.phone || !formData.birthDate || !formData.termsAgreed}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "완료"}
          </button>
        </div>
      </div>

      {/* Full Screen Modal for Terms */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
              <h3 className="font-bold text-lg">{t("terms.title")}</h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">개인정보 처리방침</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                  {t("terms.privacyPolicySummary")}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">이용약관</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                  {t("terms.termsFullText")}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl sticky bottom-0 z-10">
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, termsAgreed: true }));
                  setShowTermsModal(false);
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition active:scale-[0.98]"
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
