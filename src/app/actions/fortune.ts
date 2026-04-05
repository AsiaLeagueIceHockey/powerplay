"use server";

import { createClient } from "@/lib/supabase/server";
import { logAndNotify } from "@/lib/audit";
import {
  buildStoredHockeyFortune,
  getRecentKstDateKeys,
  getTodayKstDateKey,
  type DailyHockeyFortuneProfile,
} from "@/lib/daily-hockey-fortune";

interface FortuneRow {
  fortune_date: string;
  score: number;
  title_ko: string;
  title_en: string;
  summary_ko: string;
  summary_en: string;
  details_ko: string[];
  details_en: string[];
  viewed_at: string | null;
}

interface FortuneDayScore {
  dateKey: string;
  score: number | null;
}

async function getAuthenticatedUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, position, detailed_positions, phone, birth_date, primary_club_id, hockey_start_date, stick_direction")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: (profile ?? null) as DailyHockeyFortuneProfile | null,
  };
}

function localizeFortune(row: FortuneRow, locale: string) {
  const isKo = locale === "ko";

  return {
    score: row.score,
    title: isKo ? row.title_ko : row.title_en,
    summary: isKo ? row.summary_ko : row.summary_en,
    details: isKo ? row.details_ko : row.details_en,
    viewedAt: row.viewed_at,
  };
}

async function getRecentFortuneScoresForUser(userId: string) {
  const supabase = await createClient();
  const recentKeys = getRecentKstDateKeys(7);
  const fromDate = recentKeys[0];
  const toDate = recentKeys[recentKeys.length - 1];

  const { data } = await supabase
    .from("daily_hockey_fortunes")
    .select("fortune_date, score")
    .eq("user_id", userId)
    .gte("fortune_date", fromDate)
    .lte("fortune_date", toDate)
    .order("fortune_date", { ascending: true });

  const scoreMap = new Map((data ?? []).map((item) => [item.fortune_date, item.score]));

  return recentKeys.map((dateKey) => ({
    dateKey,
    score: scoreMap.get(dateKey) ?? null,
  })) satisfies FortuneDayScore[];
}

export async function getTodayFortuneBanner(locale: string) {
  const { supabase, user } = await getAuthenticatedUserAndProfile();

  if (!user) {
    return null;
  }

  const todayKey = getTodayKstDateKey();
  const { data, error } = await supabase
    .from("daily_hockey_fortunes")
    .select("fortune_date, score, title_ko, title_en, summary_ko, summary_en, details_ko, details_en, viewed_at")
    .eq("user_id", user.id)
    .eq("fortune_date", todayKey)
    .maybeSingle();

  if (error) {
    console.error("Error fetching today fortune banner:", error);
    return {
      hasFortune: false,
      score: null,
      title: null,
    };
  }

  if (!data) {
    return {
      hasFortune: false,
      score: null,
      title: null,
    };
  }

  const localized = localizeFortune(data as FortuneRow, locale);

  return {
    hasFortune: true,
    score: localized.score,
    title: localized.title,
  };
}

export async function getDailyHockeyFortuneScreen(locale: string) {
  const { supabase, user, profile } = await getAuthenticatedUserAndProfile();

  if (!user) {
    return null;
  }

  const todayKey = getTodayKstDateKey();
  const { data: existing, error: existingError } = await supabase
    .from("daily_hockey_fortunes")
    .select("fortune_date, score, title_ko, title_en, summary_ko, summary_en, details_ko, details_en, viewed_at")
    .eq("user_id", user.id)
    .eq("fortune_date", todayKey)
    .maybeSingle();

  if (existingError) {
    console.error("Error fetching existing fortune:", existingError);
  }

  let row = existing as FortuneRow | null;
  const shouldAnimateReveal = !row;
  let shouldLogView = false;

  if (!row) {
    const generated = buildStoredHockeyFortune({
      userId: user.id,
      profile,
      fortuneDate: todayKey,
    });

    const { data: inserted, error: insertError } = await supabase
      .from("daily_hockey_fortunes")
      .upsert(
        {
          user_id: user.id,
          fortune_date: generated.fortuneDate,
          score: generated.score,
          title_ko: generated.titleKo,
          title_en: generated.titleEn,
          summary_ko: generated.summaryKo,
          summary_en: generated.summaryEn,
          details_ko: generated.detailsKo,
          details_en: generated.detailsEn,
          dominant_theme: generated.dominantTheme,
          caution_theme: generated.cautionTheme,
          signals: generated.signals,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,fortune_date" }
      )
      .select("fortune_date, score, title_ko, title_en, summary_ko, summary_en, details_ko, details_en, viewed_at")
      .single();

    if (insertError) {
      console.error("Error upserting today fortune:", insertError);
      throw new Error("Failed to create today's fortune");
    }

    row = inserted as FortuneRow;
    shouldLogView = true;
  } else if (!row.viewed_at) {
    const { data: updated, error: updateError } = await supabase
      .from("daily_hockey_fortunes")
      .update({ viewed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("fortune_date", todayKey)
      .select("fortune_date, score, title_ko, title_en, summary_ko, summary_en, details_ko, details_en, viewed_at")
      .single();

    if (updateError) {
      console.error("Error updating fortune viewed_at:", updateError);
    } else {
      row = updated as FortuneRow;
      shouldLogView = true;
    }
  }

  if (shouldLogView) {
    await logAndNotify({
      userId: user.id,
      action: "FORTUNE_VIEW",
      description: `오늘의 하키 운세를 확인했습니다. (${row.score}점)`,
      metadata: {
        fortuneDate: row.fortune_date,
        score: row.score,
        titleKo: row.title_ko,
        titleEn: row.title_en,
      },
      url: "/admin/audit-logs",
    });
  }

  const recentScores = await getRecentFortuneScoresForUser(user.id);
  const localized = localizeFortune(row, locale);

  return {
    displayName: profile?.full_name || user.email?.split("@")[0] || "Player",
    shouldAnimateReveal,
    today: {
      dateKey: row.fortune_date,
      score: localized.score,
      title: localized.title,
      summary: localized.summary,
      details: localized.details,
    },
    recentScores,
  };
}
