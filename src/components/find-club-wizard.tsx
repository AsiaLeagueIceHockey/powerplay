"use client";

import { badgeStyles, buttonStyles, filterChipStyles, surfaceStyles } from "@/components/ui/styles";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  getClubRecommendations,
  type FindClubPreferences,
  type RecommendedClub,
  type FindClubResult,
} from "@/app/actions/find-club";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Baby,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldX,
  Building2,
  MessageCircle,
  Share2,
  Loader2,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

interface FindClubWizardProps {
  regions: string[];
}

type Step = 1 | 2 | 3 | "result";

function OptionCard({
    selected,
    onClick,
    icon,
    label,
    desc,
  }: {
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    desc: string;
  }) {
    return (
      <button type="button"
        onClick={onClick}
        className={`${filterChipStyles({ selected, shape: "row" })} w-full flex items-center gap-4 text-left`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            selected
              ? "bg-pp-accent text-white"
              : "bg-pp-surface-muted text-pp-muted"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base ${selected ? "text-pp-accent-text " : "text-pp-text dark:text-white"}`}>
            {label}
          </p>
          <p className="text-sm text-pp-muted mt-0.5">
            {desc}
          </p>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            selected
              ? "border-pp-accent bg-pp-accent"
              : "border-pp-border "
          }`}
        >
          {selected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </button>
    );
  }

export function FindClubWizard({ regions }: FindClubWizardProps) {
  const t = useTranslations("findClub");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [playerType, setPlayerType] = useState<"adult" | "youth" | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [hasEquipment, setHasEquipment] = useState<boolean | null>(null);

  // Result state
  const [result, setResult] = useState<FindClubResult | null>(null);

  const totalSteps = 3;

  const canProceed = () => {
    switch (step) {
      case 1: return playerType !== null;
      case 2: return selectedRegions.length > 0;
      case 3: return hasEquipment !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    if (step === 3) {
      // Submit and get recommendations
      startTransition(async () => {
        const prefs: FindClubPreferences = {
          playerType: playerType!,
          regions: selectedRegions,
          hasEquipment: hasEquipment!,
        };
        const data = await getClubRecommendations(prefs);
        setResult(data);
        setStep("result");
      });
    } else {
      setStep(((step as number) + 1) as Step);
    }
  };

  const handlePrev = () => {
    if (step === "result") {
      setStep(3);
      return;
    }
    if ((step as number) > 1) {
      setStep(((step as number) - 1) as Step);
    }
  };

  const handleRestart = () => {
    setStep(1);
    setPlayerType(null);
    setSelectedRegions([]);
    setHasEquipment(null);
    setResult(null);
  };

  const handleShare = () => {
    if (!result) return;
    const clubNames = result.recommendations.map((c) => `• ${c.name}`).join("\n");
    const shareText = t("result.shareText", {
      clubs: clubNames,
      url: `https://powerplay.kr/${locale}/find-club`,
    });

    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert(locale === "ko" ? "복사되었습니다!" : "Copied!");
      });
    }
  };

  // ============================================
  // Option card component
  // ============================================
  // ============================================
  // Region grid
  // ============================================
  function renderRegionGrid() {
    const toggleRegion = (r: string) => {
      setSelectedRegions((prev) =>
        prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
      );
    };

    return (
      <>
        <p className="text-sm text-pp-muted mb-3 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 shrink-0" />
          {t("q2.hint")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {regions.map((r) => (
            <button type="button"
              key={r}
              onClick={() => toggleRegion(r)}
              className={`${filterChipStyles({ selected: selectedRegions.includes(r), shape: "row" })} text-center truncate`}
            >
              {r}
            </button>
          ))}
        </div>
      </>
    );
  }

  // ============================================
  // Result card
  // ============================================
  function renderResultCard({ club }: { club: RecommendedClub }) {
    const detailHref = club.type === "business"
      ? `/lounge/${club.slug}`
      : `/clubs/${club.id}`;

    return (
      <Link
        href={detailHref}
        className={`${surfaceStyles({ interactive: true, density: "compact" })} block`}
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-pp-surface-muted flex items-center justify-center overflow-hidden shrink-0 border border-pp-border ">
            {club.logoUrl ? (
              <Image
                src={club.logoUrl}
                alt={club.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-5 h-5 text-pp-muted" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-pp-text dark:text-white truncate">
              {club.name}
            </h3>
            {club.regionLabel && (
              <p className="text-xs text-pp-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                {club.regionLabel}
              </p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight className="w-4 h-4 text-pp-muted shrink-0" />
        </div>

        {/* Badges */}
        {(club.recentMatchCount > 0 || club.hasRentalMatches || club.hasKakaoChat) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {club.recentMatchCount > 0 && (
              <span className={`${badgeStyles({ tone: "neutral" })} inline-flex items-center gap-1 `}>
                <Calendar className="w-3 h-3" />
                {t("result.matches", { count: club.recentMatchCount })}
              </span>
            )}
            {club.hasRentalMatches && (
              <span className={`${badgeStyles({ tone: "success" })} inline-flex items-center gap-1 `}>
                <ShieldCheck className="w-3 h-3" />
                {t("result.rentalBadge")}
              </span>
            )}
            {club.hasKakaoChat && (
              <span className={`${badgeStyles({ tone: "warning" })} inline-flex items-center gap-1 `}>
                <MessageCircle className="w-3 h-3" />
                {t("result.kakaoChat")}
              </span>
            )}
          </div>
        )}

        {/* Rink names */}
        {club.rinkNames.length > 0 && (
          <p className="text-xs text-pp-muted mt-2 truncate">
            🏟️ {club.rinkNames.slice(0, 3).join(", ")}
          </p>
        )}

        {/* Description */}
        {club.description && (
          <p className="text-xs text-pp-muted mt-2 line-clamp-2 leading-relaxed">
            {club.description}
          </p>
        )}
      </Link>
    );
  }

  // ============================================
  // Render
  // ============================================
  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      {step !== "result" && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-pp-muted ">
              {t("step", { current: step, total: totalSteps })}
            </span>
          </div>
          <div className="h-2 bg-pp-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step as number) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[400px]">
        {/* Step 1: Adult / Youth */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-pp-text dark:text-white mb-6">
              {t("q1.title")}
            </h2>
            <div className="space-y-3">
              <OptionCard
                selected={playerType === "adult"}
                onClick={() => setPlayerType("adult")}
                icon={<Users className="w-6 h-6" />}
                label={t("q1.adult")}
                desc={t("q1.adultDesc")}
              />
              <OptionCard
                selected={playerType === "youth"}
                onClick={() => setPlayerType("youth")}
                icon={<Baby className="w-6 h-6" />}
                label={t("q1.youth")}
                desc={t("q1.youthDesc")}
              />
            </div>
          </div>
        )}

        {/* Step 2: Region */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-pp-text dark:text-white mb-6">
              {t("q2.title")}
            </h2>
            {renderRegionGrid()}
          </div>
        )}

        {/* Step 3: Equipment */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-pp-text dark:text-white mb-6">
              {t("q4.title")}
            </h2>
            <div className="space-y-3">
              <OptionCard
                selected={hasEquipment === true}
                onClick={() => setHasEquipment(true)}
                icon={<ShieldCheck className="w-6 h-6" />}
                label={t("q4.yes")}
                desc={t("q4.yesDesc")}
              />
              <OptionCard
                selected={hasEquipment === false}
                onClick={() => setHasEquipment(false)}
                icon={<ShieldX className="w-6 h-6" />}
                label={t("q4.no")}
                desc={t("q4.noDesc")}
              />
            </div>
          </div>
        )}

        {/* Loading */}
        {isPending && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-pp-accent-text animate-spin" />
            <p className="text-pp-muted font-medium">
              {locale === "ko"
                ? "최적의 클럽을 찾고 있어요..."
                : "Finding the best clubs for you..."}
            </p>
          </div>
        )}

        {/* Results */}
        {step === "result" && result && !isPending && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {result.recommendations.length === 0 && (
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-pp-text dark:text-white">
                  {t("result.noResult")}
                </h2>
                <p className="text-pp-muted mt-2 text-sm">
                  {t("result.noResultDesc")}
                </p>
              </div>
            )}

            {/* Recommendation cards */}
            <div className="space-y-3 mb-6">
              {result.recommendations.map((club) => (
                <div key={club.id}>{renderResultCard({ club })}</div>
              ))}
            </div>

            {/* Stats */}
            <p className="text-center text-xs text-pp-muted mb-4">
              {t("result.totalInfo", {
                clubs: result.totalClubCount,
              })}
            </p>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button type="button"
                onClick={handleRestart}
                className={`${buttonStyles({ variant: "outline", size: "compact" })} flex-1 flex items-center justify-center gap-2 `}
              >
                <RotateCcw className="w-4 h-4" />
                {t("restart")}
              </button>
              {result.recommendations.length > 0 && (
                <button type="button"
                  onClick={handleShare}
                  className={`${buttonStyles({ variant: "primary", size: "compact" })} flex-1 flex items-center justify-center gap-2 `}
                >
                  <Share2 className="w-4 h-4" />
                  {t("result.share")}
                </button>
              )}
            </div>

            {/* Browse all */}
            <Link
              href="/clubs"
              className={`${buttonStyles({ variant: "primary", size: "default" })} mt-4`}
            >
              {t("result.viewAll")} →
            </Link>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {step !== "result" && !isPending && (
        <div className="flex gap-3 mt-8">
          {(step as number) > 1 && (
            <button type="button"
              onClick={handlePrev}
              className={`${buttonStyles({ variant: "outline", size: "compact" })} flex items-center justify-center gap-2 `}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("prev")}
            </button>
          )}
          <button type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className={`${buttonStyles({ variant: canProceed() ? "primary" : "ghost", size: "default" })} flex-1 flex items-center justify-center gap-2 `}
          >
            {step === 3 ? (
              <>
                <Sparkles className="w-4 h-4" />
                {locale === "ko" ? "추천 받기" : "Get Recommendations"}
              </>
            ) : (
              <>
                {t("next")}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
