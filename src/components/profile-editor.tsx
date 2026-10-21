"use client";
import { buttonStyles, fieldStyles, filterChipStyles, surfaceStyles } from "@/components/ui/styles";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { updateProfile, issuePlayerCard } from "@/app/actions/auth";
import { Camera, CreditCard, Loader2, Save, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  prepareProfileImage,
  PROFILE_IMAGE_SOURCE_MAX_BYTES,
} from "@/lib/profile-image-client";
import { BirthDatePicker } from "@/components/birth-date-picker";

interface ProfileEditorProps {
  initialAvatarUrl: string | null;
  initialBio: string | null;
  hockeyStartDate: string | null;
  primaryClubId: string | null;
  detailedPositions: string[] | null;
  stickDirection: string | null;
  phone: string | null;
  birthDate: string | null;
  fullName: string | null;
  clubs: { id: string; name: string }[];
  myClubIds: string[];
  cardIssuedAt?: string | null;
  updatedAt?: string | null;
}

export function ProfileEditor({
  initialAvatarUrl,
  initialBio,
  hockeyStartDate,
  primaryClubId,
  detailedPositions,
  stickDirection,
  phone,
  birthDate,
  fullName,
  clubs,
  myClubIds,
  cardIssuedAt,
  updatedAt
}: ProfileEditorProps) {
  const t = useTranslations();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initialYear = hockeyStartDate ? hockeyStartDate.split("-")[0] : "";
  const initialMonth = hockeyStartDate ? hockeyStartDate.split("-")[1] : "";

  const [bio, setBio] = useState(initialBio || "");
  const [startYear, setStartYear] = useState(initialYear);
  const [startMonth, setStartMonth] = useState(initialMonth ? parseInt(initialMonth, 10).toString() : "");
  const [primaryClubIdState, setPrimaryClubIdState] = useState(primaryClubId || "");
  const [positions, setPositions] = useState<string[]>(detailedPositions || []);
  const [stick, setStick] = useState(stickDirection || "");
  const [phoneState, setPhoneState] = useState(phone || "");
  const [birthDateState, setBirthDateState] = useState(birthDate || "");
  const [nameState, setNameState] = useState(fullName || "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(initialAvatarUrl || "");
  const [loading, setLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  // Check if anything changed
  const isChanged = useMemo(() => {
    const isBioChanged = bio !== (initialBio || "");
    const isYearChanged = startYear !== initialYear;
    const isMonthChanged = startMonth !== (initialMonth ? parseInt(initialMonth, 10).toString() : "");
    const isClubChanged = primaryClubIdState !== (primaryClubId || "");

    // Array comparison
    const initialPos = detailedPositions || [];
    const isPosChanged = positions.length !== initialPos.length || !positions.every(p => initialPos.includes(p));

    const isStickChanged = stick !== (stickDirection || "");
    const isPhoneChanged = phoneState !== (phone || "");
    const isBirthDateChanged = birthDateState !== (birthDate || "");
    const isNameChanged = nameState !== (fullName || "");
    const isAvatarChanged = Boolean(avatarFile) || avatarUrl !== (initialAvatarUrl || "");

    return isBioChanged || isYearChanged || isMonthChanged || isClubChanged || isPosChanged || isStickChanged || isPhoneChanged || isBirthDateChanged || isNameChanged || isAvatarChanged;
  }, [bio, initialBio, startYear, initialYear, startMonth, initialMonth, primaryClubIdState, primaryClubId, positions, detailedPositions, stick, stickDirection, phoneState, phone, birthDateState, birthDate, nameState, fullName, avatarFile, avatarUrl, initialAvatarUrl]);

  const handleAvatarSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSaveError(t("profile.photo.invalidType"));
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    if (file.size > PROFILE_IMAGE_SOURCE_MAX_BYTES) {
      setSaveError(t("profile.photo.tooLarge"));
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }

    setSaveError(null);
    try {
      const preparedFile = await prepareProfileImage(file);
      setAvatarFile(preparedFile);
      setAvatarPreviewUrl(URL.createObjectURL(preparedFile));
    } catch {
      setSaveError(t("profile.photo.processError"));
    }
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleAvatarRemove = () => {
    setSaveError(null);
    setAvatarFile(null);
    setAvatarUrl("");
    setAvatarPreviewUrl("");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (primaryClubIdState && primaryClubIdState !== primaryClubId) {
      if (!myClubIds.includes(primaryClubIdState)) {
        const confirmJoin = window.confirm(
          t("profile.confirmJoinClub", { fallback: "선택하신 동호회의 소속 멤버가 아닙니다. 해당 동호회를 내 소속팀으로 등록(가입)하시겠습니까?" })
        );
        if (!confirmJoin) {
          return;
        }
      }
    }

    setLoading(true);
    setSaveError(null);
    const fd = new FormData();
    fd.set("bio", bio);

    if (startYear && startMonth) {
      fd.set("hockeyStartDate", `${startYear}-${startMonth.padStart(2, '0')}-01`);
    } else {
      fd.set("hockeyStartDate", "");
    }

    fd.set("primaryClubId", primaryClubIdState);
    fd.set("detailedPositions", JSON.stringify(positions));
    fd.set("stickDirection", stick);
    fd.set("phone", phoneState);
    fd.set("birthDate", birthDateState);
    fd.set("fullName", nameState);
    fd.set("avatarUrl", avatarUrl);
    if (avatarFile) fd.set("avatarFile", avatarFile);

    const result = await updateProfile(fd);

    if (result.error) {
      setLoading(false);
      setSaveError(t("profile.saveError"));
      return;
    }

    const savedAvatarUrl = result.avatarUrl ?? avatarUrl;
    setAvatarUrl(savedAvatarUrl || "");
    setAvatarPreviewUrl(savedAvatarUrl || "");
    setAvatarFile(null);

    setLoading(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  };

  const isProfileComplete =
    nameState.trim() !== "" &&
    phoneState.trim() !== "" &&
    startYear !== "" &&
    startMonth !== "" &&
    primaryClubIdState !== "" &&
    stick !== "" &&
    positions.length > 0;

  const handleIssueCard = async () => {
    if (!isProfileComplete) return;

    setCardLoading(true);
    const result = await issuePlayerCard();
    if (result.success) {
      router.push("/ko/mypage/card");
    } else {
      setCardLoading(false);
      alert(t("common.error")); // Assuming common fallback
    }
  };

  const handleViewCard = () => {
    router.push("/ko/mypage/card");
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const POSITION_OPTIONS = [
    { value: "LW", label: t("profile.positions.options.LW") },
    { value: "C", label: t("profile.positions.options.C") },
    { value: "RW", label: t("profile.positions.options.RW") },
    { value: "LD", label: t("profile.positions.options.LD") },
    { value: "RD", label: t("profile.positions.options.RD") },
    { value: "G", label: t("profile.positions.options.G") },
    { value: "UNDECIDED", label: t("profile.positions.options.UNDECIDED") },
  ];

  const togglePosition = (val: string) => {
    setPositions(prev => prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]);
  };

  const experienceText = useMemo(() => {
    if (!startYear || !startMonth) return null;
    const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

    if (diffMonths <= 0) return t("profile.experience.lessThanMonth");

    const y = Math.floor(diffMonths / 12);
    const m = diffMonths % 12;

    if (y === 0) return `${m}${t("profile.experience.monthDuration")}`;
    if (m === 0) return `${y}${t("profile.experience.year")}`;
    return t("profile.experience.calculated", { years: y, months: m });
  }, [startYear, startMonth, t]);

  return (
    <div className="space-y-4">
      {(isChanged || saved) && (
        <div className="flex items-center justify-end px-1">
          <div className="flex items-center gap-3">
            {!isChanged && saved && (
              <span className="text-sm text-pp-success-text font-medium">
                {t("profile.saved")}
              </span>
            )}
            {isChanged && (
              <button type="button"
                onClick={handleSave}
                disabled={loading}
                className={buttonStyles({ variant: "primary", size: "compact" })}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("common.save")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className={`${surfaceStyles({ density: "default" })} space-y-8`}>
        <section className="flex items-center gap-4 border-b border-pp-border pb-6 ">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-pp-surface-muted shadow-md ring-1 ring-pp-border dark:border-pp-border ">
            {avatarPreviewUrl ? (
              <Image
                src={avatarPreviewUrl}
                alt={t("profile.photo.alt")}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-pp-muted ">
                <UserRound className="h-12 w-12" strokeWidth={1.6} aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-pp-text ">
              {t("profile.photo.title")}
            </h2>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleAvatarSelect(file);
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={loading}
                className={`${buttonStyles({ variant: "primary", size: "default" })}`}
              >
                <Camera className="h-4 w-4" />
                {t("profile.photo.choose")}
              </button>
              {avatarPreviewUrl ? (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={loading}
                  aria-label={t("profile.photo.remove")}
                  title={t("profile.photo.remove")}
                  className={`${buttonStyles({ variant: "danger", size: "default", shape: "circle" })}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {saveError ? (
          <p
            role="alert"
            className="rounded-xl border border-pp-danger-border bg-pp-danger-soft px-4 py-3 text-sm text-pp-danger-text "
          >
            {saveError}
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-3">
          <label htmlFor={"profile-editor-1"} className="block text-sm font-medium text-pp-muted ">
            {t("profile.fullName")}
          </label>
          <input id={"profile-editor-1"}
            type="text"
            value={nameState}
            onChange={(e) => setNameState(e.target.value)}
            className={`${fieldStyles()} w-full`}
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-3">
          <label htmlFor={"profile-editor-2"} className="block text-sm font-medium text-pp-muted ">
            {t("profile.phone")}
          </label>
          <input id={"profile-editor-2"}
            type="tel"
            value={phoneState}
            onChange={(e) => setPhoneState(e.target.value)}
            placeholder={t("profile.placeholder.phone")}
            className={`${fieldStyles()} w-full`}
          />
        </div>

        {/* Birth Date */}
        <div className="space-y-3">
          <label htmlFor={"profile-editor-3"} className="block text-sm font-medium text-pp-muted ">
            {t("profile.birthDate")}
          </label>
          <BirthDatePicker id={"profile-editor-3"}
            value={birthDateState}
            onChange={setBirthDateState}
            placeholder={t("profile.placeholder.birthDate")}
          />
        </div>

        {/* Experience Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-pp-muted ">
            {t("profile.experience.title")}
          </label>
          <div className="flex gap-2">
            <select
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              className={`${fieldStyles()} flex-1`}
            >
              <option value="">{t("profile.experience.placeholderYear")}</option>
              {years.map(y => <option key={`y-${y}`} value={y}>{y}{t("profile.experience.year")}</option>)}
            </select>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className={`${fieldStyles()} w-24`}
            >
              <option value="">{t("profile.experience.placeholderMonth")}</option>
              {months.map(m => <option key={`m-${m}`} value={m}>{m}{t("profile.experience.month")}</option>)}
            </select>
          </div>
          {experienceText && (
            <p className="text-sm font-medium text-pp-accent-text mt-1">
              🗓️ {experienceText}
            </p>
          )}
        </div>

        {/* Primary Club */}
        <div className="space-y-3">
          <label htmlFor={"profile-editor-4"} className="block text-sm font-medium text-pp-muted ">
            {t("profile.team.title")}
          </label>
          <select id={"profile-editor-4"}
            value={primaryClubIdState}
            onChange={(e) => setPrimaryClubIdState(e.target.value)}
            className={`${fieldStyles()} w-full`}
          >
            <option value="">{t("profile.team.none")}</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stick Direction */}
        <div className="space-y-3 md:col-span-2">
          <label className="block text-sm font-medium text-pp-muted ">
            {t("profile.stick.title")}
          </label>
          <div className="flex gap-3">
            {[
              { val: "LEFT", label: t("profile.stick.left") },
              { val: "RIGHT", label: t("profile.stick.right") }
            ].map(opt => (
              <label
                key={opt.val}
                className={`${filterChipStyles({ selected: stick === opt.val })} flex-1 md:flex-none md:w-32 focus-within:outline-2 focus-within:outline-offset-2`}
              >
                <input
                  type="radio"
                  name="stickDirection"
                  value={opt.val}
                  checked={stick === opt.val}
                  onChange={(e) => setStick(e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Detailed Positions */}
        <div className="space-y-3 md:col-span-2">
          <label className="block text-sm font-medium text-pp-muted ">
            {t("profile.positions.title")}
          </label>
          <div className="flex flex-wrap gap-2">
            {POSITION_OPTIONS.map(opt => {
              const checked = positions.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => togglePosition(opt.value)}
                  aria-pressed={checked}
                  className={filterChipStyles({ selected: checked })}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player Card Section */}
        <div className="space-y-4 md:col-span-2 pt-4 border-t border-pp-border ">
          <label className="block text-sm font-medium text-pp-muted ">
            {t("profile.card.title", { fallback: "선수 디지털 카드" })}
          </label>
          <div className={`${surfaceStyles({ density: "compact" })} flex flex-col sm:flex-row items-center justify-between`}>
            <div className="text-sm text-pp-muted mb-4 sm:mb-0">
              {cardIssuedAt
                ? t("profile.card.issuedDesc", { fallback: "나의 선수 디지털 카드를 확인해보세요." })
                : t("profile.card.unissuedDesc", { fallback: "프로필을 입력하고, 선수 디지털 카드를 발급 받아 보세요!" })
              }
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {cardIssuedAt && (
                <button
                  type="button"
                  onClick={handleViewCard}
                  className={`${buttonStyles({ variant: "secondary", size: "compact" })} w-full sm:w-auto`}
                >
                  <CreditCard className="w-5 h-5" />
                  {t("profile.card.view", { fallback: "선수 카드 보기" })}
                </button>
              )}

              {(!cardIssuedAt || (updatedAt && cardIssuedAt && new Date(updatedAt) > new Date(cardIssuedAt))) && (
                <button
                  type="button"
                  onClick={handleIssueCard}
                  disabled={!isProfileComplete || cardLoading || isChanged}
                  className={`${buttonStyles({ variant: "primary", size: "compact" })} w-full sm:w-auto`}
                  title={isChanged ? t("profile.card.needSave", { fallback: "변경사항을 먼저 저장해주세요." }) : undefined}
                >
                  {cardLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  {cardIssuedAt
                    ? t("profile.card.reissue", { fallback: "새로 발급받기" })
                    : t("profile.card.create", { fallback: "선수 카드 만들기" })
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-3 md:col-span-2 pt-4 border-t border-pp-border ">
          <label className="block text-sm font-medium text-pp-muted ">
            {t("profile.bio.title")}
          </label>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.bio.placeholder")}
              className={`${fieldStyles({ multiline: true })} pp-textarea w-full resize-none`}
            />
            <div className="absolute bottom-3 right-4 text-xs font-medium text-pp-muted font-mono">
              {bio.length} <span className="text-pp-muted ">/</span> 500
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
