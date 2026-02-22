"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/app/actions/auth";
import { Loader2, Save } from "lucide-react";

interface ProfileEditorProps {
  initialBio: string | null;
  hockeyStartDate: string | null;
  primaryClubId: string | null;
  detailedPositions: string[] | null;
  stickDirection: string | null;
  phone: string | null;
  clubs: { id: string; name: string }[];
}

export function ProfileEditor({ 
  initialBio, 
  hockeyStartDate, 
  primaryClubId, 
  detailedPositions, 
  stickDirection,
  phone,
  clubs 
}: ProfileEditorProps) {
  const t = useTranslations();
  
  const initialYear = hockeyStartDate ? hockeyStartDate.split("-")[0] : "";
  const initialMonth = hockeyStartDate ? hockeyStartDate.split("-")[1] : "";
  
  const [bio, setBio] = useState(initialBio || "");
  const [startYear, setStartYear] = useState(initialYear);
  const [startMonth, setStartMonth] = useState(initialMonth ? parseInt(initialMonth, 10).toString() : "");
  const [primaryClubIdState, setPrimaryClubIdState] = useState(primaryClubId || "");
  const [positions, setPositions] = useState<string[]>(detailedPositions || []);
  const [stick, setStick] = useState(stickDirection || "");
  const [phoneState, setPhoneState] = useState(phone || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

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
    
    return isBioChanged || isYearChanged || isMonthChanged || isClubChanged || isPosChanged || isStickChanged || isPhoneChanged;
  }, [bio, initialBio, startYear, initialYear, startMonth, initialMonth, primaryClubIdState, primaryClubId, positions, detailedPositions, stick, stickDirection, phoneState, phone]);

  const handleSave = async () => {
    setLoading(true);
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
    
    await updateProfile(fd);
    
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {t("profile.title")}
        </h2>
        {isChanged && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("common.save")}
          </button>
        )}
        {!isChanged && saved && (
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            {t("profile.saved")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Number */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.phone")}
          </label>
          <input
            type="tel"
            value={phoneState}
            onChange={(e) => setPhoneState(e.target.value)}
            placeholder={t("profile.placeholder.phone")}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Experience Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.experience.title")}
          </label>
          <div className="flex gap-2">
            <select
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("profile.experience.placeholderYear")}</option>
              {years.map(y => <option key={`y-${y}`} value={y}>{y}{t("profile.experience.year")}</option>)}
            </select>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("profile.experience.placeholderMonth")}</option>
              {months.map(m => <option key={`m-${m}`} value={m}>{m}{t("profile.experience.month")}</option>)}
            </select>
          </div>
          {experienceText && (
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
              🗓️ {experienceText}
            </p>
          )}
        </div>

        {/* Primary Club */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.team.title")}
          </label>
          <select
            value={primaryClubIdState}
            onChange={(e) => setPrimaryClubIdState(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("profile.team.none")}</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stick Direction */}
        <div className="space-y-3 md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.stick.title")}
          </label>
          <div className="flex gap-3">
            {[
              { val: "LEFT", label: t("profile.stick.left") },
              { val: "RIGHT", label: t("profile.stick.right") }
            ].map(opt => (
              <label 
                key={opt.val} 
                className={`flex items-center justify-center px-4 py-2 border rounded-lg cursor-pointer transition-colors flex-1 md:flex-none md:w-32 ${
                  stick === opt.val 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                    : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    checked
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-3 md:col-span-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("profile.bio.title")}
          </label>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.bio.placeholder")}
              className="w-full h-32 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 transition-all font-normal placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            <div className="absolute bottom-3 right-4 text-xs font-medium text-zinc-400 dark:text-zinc-500 font-mono">
              {bio.length} <span className="text-zinc-300 dark:text-zinc-600">/</span> 500
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
