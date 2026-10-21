"use client";
import { buttonStyles, fieldStyles, filterChipStyles, overlayStyles, surfaceStyles } from "@/components/ui/styles";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { updateProfile } from "@/app/actions/auth";
import { Check, Loader2, X } from "lucide-react";
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
  hockey_start_date?: string | null;
  stick_direction?: "LEFT" | "RIGHT" | null;
  detailed_positions?: string[] | null;
}

interface OnboardingFormProps {
  profile: Profile | null;
  locale: string;
}

const DETAILED_POSITIONS: Record<string, string[]> = {
  FW: ["LW", "C", "RW"],
  DF: ["LD", "RD"],
  G: ["G"],
};

export function OnboardingForm({ profile, locale }: OnboardingFormProps) {
  const copy = useTranslations("onboardingUi");
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
    hockeyStartDate: string;
    stickDirection: "LEFT" | "RIGHT" | null;
    detailedPositions: string[];
  }>({
    fullName: profile?.full_name || "",
    position: profile?.position || null,
    preferredLang: profile?.preferred_lang || "ko",
    phone: profile?.phone || "",
    birthDate: profile?.birth_date || "",
    termsAgreed: profile?.terms_agreed || false,
    hockeyStartDate: profile?.hockey_start_date || "",
    stickDirection: profile?.stick_direction || null,
    detailedPositions: profile?.detailed_positions || [],
  });

  // Terms Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Generate Year/Month options for experience
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => String(currentYear - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  const handleDetailedPositionToggle = (pos: string) => {
    setFormData((prev) => {
      const current = prev.detailedPositions;
      return {
        ...prev,
        detailedPositions: current.includes(pos)
          ? current.filter((p) => p !== pos)
          : [...current, pos],
      };
    });
  };

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

    if (formData.hockeyStartDate) {
      fd.set("hockeyStartDate", formData.hockeyStartDate);
    }
    if (formData.stickDirection) {
      fd.set("stickDirection", formData.stickDirection);
    }
    if (formData.detailedPositions.length > 0) {
      // Must append as a string for FormData, server action should parse it
      fd.set("detailedPositions", JSON.stringify(formData.detailedPositions));
    }

    await updateProfile(fd);

    router.push(`/${locale}`);
    router.refresh();
  };

  // Form Validation Logic
  const isFormValid =
    formData.fullName &&
    formData.phone &&
    formData.birthDate &&
    formData.termsAgreed &&
    formData.hockeyStartDate &&
    formData.stickDirection;

  return (
    <>
      <div className="space-y-8">
        <div className={`${surfaceStyles({ density: "default" })} space-y-6 animate-in fade-in slide-in-from-right-4`}>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{copy("welcome")}</h1>
            <p className="text-pp-muted mt-2">{copy("intro")}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor={"onboarding-form-1"} className="block text-sm font-medium mb-2">{t("fullName")} <span className="text-pp-danger-text">*</span></label>
              <input id={"onboarding-form-1"}
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder={copy("nameExample")}
                className={`${fieldStyles()} w-full`}
              />
            </div>

            <div>
              <label htmlFor={"onboarding-form-2"} className="block text-sm font-medium mb-2">{t("phone")} <span className="text-pp-danger-text">*</span></label>
              <input id={"onboarding-form-2"}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("placeholder.phone")}
                className={`${fieldStyles()} w-full`}
              />
            </div>

            <div>
              <label htmlFor={"onboarding-form-3"} className="block text-sm font-medium mb-2">{t("birthDate")} <span className="text-pp-danger-text">*</span></label>
              <BirthDatePicker id={"onboarding-form-3"}
                value={formData.birthDate}
                onChange={(date) => setFormData({ ...formData, birthDate: date })}
                placeholder={t("placeholder.birthDate")}
              />
            </div>

            <div>
              <label htmlFor={"onboarding-form-4"} className="block text-sm font-medium mb-2">{t("position")}</label>
              <select id={"onboarding-form-4"}
                value={formData.position || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    position: (e.target.value as "FW" | "DF" | "G" | "") || null,
                    detailedPositions: [] // Reset detailed positions when base position changes
                  })
                }}
                className={`${fieldStyles()} w-full`}
              >
                <option value="">{tMatch("position.NONE")}</option>
                <option value="FW">{tMatch("position.FW")}</option>
                <option value="DF">{tMatch("position.DF")}</option>
                <option value="G">{tMatch("position.G")}</option>
              </select>
            </div>

            <div>
              <label htmlFor={"onboarding-form-5"} className="block text-sm font-medium mb-2">{t("preferredLang")}</label>
              <select id={"onboarding-form-5"}
                value={formData.preferredLang}
                onChange={(e) => setFormData({ ...formData, preferredLang: e.target.value as "ko" | "en" })}
                className={`${fieldStyles()} w-full`}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Hockey Start Date (Experience) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {copy("hockeyStart")}<span className="text-pp-danger-text">*</span>
              </label>
              <p className="text-xs text-pp-muted mb-2">{copy("hockeyHelp")}</p>
              <div className="flex gap-2">
                <select
                  value={formData.hockeyStartDate ? formData.hockeyStartDate.split("-")[0] : ""}
                  onChange={(e) => {
                    const year = e.target.value;
                    const month = formData.hockeyStartDate ? formData.hockeyStartDate.split("-")[1] : "01";
                    setFormData({ ...formData, hockeyStartDate: year ? `${year}-${month}-01` : "" });
                  }}
                  className={`${fieldStyles()} w-full`}
                >
                  <option value="">{copy("year")}</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}{copy("yearSuffix")}</option>
                  ))}
                </select>
                <select
                  value={formData.hockeyStartDate ? formData.hockeyStartDate.split("-")[1] : ""}
                  onChange={(e) => {
                    const month = e.target.value;
                    const year = formData.hockeyStartDate ? formData.hockeyStartDate.split("-")[0] : currentYear.toString();
                    setFormData({ ...formData, hockeyStartDate: month ? `${year}-${month}-01` : "" });
                  }}
                  className={`${fieldStyles()} w-full`}
                >
                  <option value="">{copy("month")}</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}{copy("monthSuffix")}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stick Direction */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {copy("stick")}<span className="text-pp-danger-text">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stickDirection"
                    value="LEFT"
                    checked={formData.stickDirection === "LEFT"}
                    onChange={() => setFormData({ ...formData, stickDirection: "LEFT" })}
                    className="w-4 h-4 text-pp-accent-text focus:ring-pp-accent"
                  />
                  <span>{copy("left")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stickDirection"
                    value="RIGHT"
                    checked={formData.stickDirection === "RIGHT"}
                    onChange={() => setFormData({ ...formData, stickDirection: "RIGHT" })}
                    className="w-4 h-4 text-pp-accent-text focus:ring-pp-accent"
                  />
                  <span>{copy("right")}</span>
                </label>
              </div>
            </div>

            {/* Detailed Positions (Conditionally rendered) */}
            {formData.position && DETAILED_POSITIONS[formData.position] && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium mb-2">{copy("positions")}</label>
                <div className="flex flex-wrap gap-2">
                  {DETAILED_POSITIONS[formData.position].map((pos) => {
                    const isSelected = formData.detailedPositions.includes(pos);
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handleDetailedPositionToggle(pos)}
                        aria-pressed={isSelected}
                        className={filterChipStyles({ selected: isSelected })}
                      >
                        {pos}
                        {isSelected && <Check className="w-3 h-3 inline-block ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Terms Agreement */}
            <div className="pt-2">
              <label className="flex items-start space-x-3 p-3 border border-pp-border rounded-lg cursor-pointer hover:bg-pp-surface-muted transition relative">
                <input
                  type="checkbox"
                  checked={formData.termsAgreed}
                  onChange={(e) => setFormData({ ...formData, termsAgreed: e.target.checked })}
                  className="mt-1 w-5 h-5 text-pp-accent-text rounded focus:ring-pp-accent shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm block">{t("terms.title")} <span className="text-pp-danger-text text-xs font-normal">{t("terms.required")}</span></span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className={`${buttonStyles({ variant: "ghost", size: "compact" })} underline z-10`}
                    >
                      {t("terms.viewDetails")}
                    </button>
                  </div>
                  <p className="text-pp-muted text-xs mt-1 leading-snug">{t("terms.agree")}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-pp-muted ">
                    <Link href="/privacy" className="underline underline-offset-2 hover:text-pp-muted ">
                      {locale === "ko" ? "개인정보처리방침" : "Privacy Policy"}
                    </Link>
                    <Link href="/terms" className="underline underline-offset-2 hover:text-pp-muted ">
                      {locale === "ko" ? copy("terms") : "Terms of Service"}
                    </Link>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button type="button"
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className={`${buttonStyles({ variant: "primary", size: "large" })} w-full`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : copy("done")}
          </button>
        </div>
      </div>

      {/* Full Screen Modal for Terms */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" aria-labelledby="onboarding-terms-title" className={overlayStyles() + " w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"}>
            <div className={`${surfaceStyles({ density: "compact" })} flex items-center justify-between sticky top-0 z-10`}>
              <h3 id="onboarding-terms-title" className="font-bold text-lg">{t("terms.title")}</h3>
              <button type="button"
                onClick={() => setShowTermsModal(false)}
                aria-label={locale === "ko" ? "닫기" : "Close"}
                className={buttonStyles({ variant: "secondary", size: "compact", shape: "circle" })}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              <div>
                <h4 className="font-bold text-pp-text mb-2">{copy("privacy")}</h4>
                <p className="text-sm text-pp-muted whitespace-pre-wrap leading-relaxed bg-pp-surface-muted p-4 rounded-lg">
                  {t("terms.privacyPolicySummary")}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-pp-text mb-2">{copy("terms")}</h4>
                <p className="text-sm text-pp-muted whitespace-pre-wrap leading-relaxed bg-pp-surface-muted p-4 rounded-lg">
                  {t("terms.termsFullText")}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-pp-border bg-pp-surface-muted rounded-b-2xl sticky bottom-0 z-10">
              <button type="button"
                onClick={() => setShowTermsModal(false)}
                aria-label={locale === "ko" ? "닫기" : "Close"}
                className={`${buttonStyles({ variant: "primary", size: "default" })} w-full`}
              >
                {copy("confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
