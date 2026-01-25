"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/app/actions/auth";
import { Loader2, Save } from "lucide-react";

interface ProfileEditorProps {
  initialBio: string | null;
}

export function ProfileEditor({ initialBio }: ProfileEditorProps) {
  const t = useTranslations();
  const [bio, setBio] = useState(initialBio || "");
  const [loading, setLoading] = useState(false);
  const [isChanged, setIsChanged] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.set("bio", bio);
    
    await updateProfile(fd);
    
    setLoading(false);
    setIsChanged(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {t("profile.bio.title")}
        </h2>
        {isChanged && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("common.save")}
          </button>
        )}
      </div>

      <textarea
        value={bio}
        onChange={(e) => {
          setBio(e.target.value);
          setIsChanged(e.target.value !== (initialBio || ""));
        }}
        placeholder={t("profile.bio.placeholder")}
        className="w-full h-32 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
      <p className="text-xs text-zinc-500 text-right">
        {bio.length} / 500
      </p>
    </div>
  );
}
