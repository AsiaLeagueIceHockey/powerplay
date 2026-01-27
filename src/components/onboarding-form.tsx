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
          onClick={handleSubmit}
          disabled={loading || !formData.fullName || !formData.phone || !formData.birthDate || !formData.termsAgreed}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "완료"}
        </button>
      </div>
    </div>
  );
}
