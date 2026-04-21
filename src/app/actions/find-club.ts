"use server";

import { createClient } from "@/lib/supabase/server";
import { Club, Rink } from "./types";
import { extractRegion } from "@/lib/rink-utils";

// ============================================
// Types
// ============================================

export interface FindClubPreferences {
  playerType: "adult" | "youth";
  regions: string[]; // array of normalized regions like ["서울 성북구", "경기 고양시"]. Must contain at least one.
  hasEquipment: boolean;
}

export interface RecommendedClub {
  type: "club" | "business";
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  regionLabel: string;
  memberCount: number;
  recentMatchCount: number;
  hasRentalMatches: boolean;
  hasKakaoChat: boolean;
  rinkNames: string[];
  score: number;
  slug?: string; // for lounge businesses
  category?: string;
}

export interface FindClubResult {
  recommendations: RecommendedClub[];
  totalClubCount: number;
  totalBusinessCount: number;
}

// ============================================
// Region helpers
// ============================================

// toBroadRegion removed as we use exact region matching.

// ============================================
// Scoring
// ============================================

function scoreClub(
  club: Club,
  prefs: FindClubPreferences,
  recentMatchCount: number,
  rentalMatchCount: number
): number {
  let score = 0;

  // 1. Region match (weight: critical — user picked at least one region)
  if (!club.rinks || club.rinks.length === 0) {
    // Club has no rink info; cannot match a specific region.
    return -100;
  }
  const clubRegions = club.rinks.map((rink) => extractRegion(rink.address));
  const hasMatchingRegion = clubRegions.some((region) =>
    prefs.regions.includes(region)
  );
  if (hasMatchingRegion) {
    score += 100;
  } else {
    return -100;
  }

  // 2. Equipment rental (weight: medium — critical for beginners)
  if (!prefs.hasEquipment && rentalMatchCount > 0) {
    score += 40;
    if (rentalMatchCount >= 3) score += 10; // Strong rental support
  }

  // 3. Activity match (replacing frequency, just reward active clubs)
  if (recentMatchCount >= 8) {
    score += 25;
  } else if (recentMatchCount >= 2) {
    score += 15;
  } else if (recentMatchCount >= 1) {
    score += 5;
  }

  // 4. Information completeness bonus (platform effect!)
  if (club.description && club.description.length > 10) score += 5;
  if (club.logo_url) score += 5;
  if (club.kakao_open_chat_url) score += 10; // Important for onboarding
  if ((club.member_count ?? 0) > 5) score += 5;

  return score;
}

// ============================================
// Main recommendation action
// ============================================

export async function getClubRecommendations(
  prefs: FindClubPreferences
): Promise<FindClubResult> {
  // Defensive: empty regions produce no results (UI enforces at least one)
  if (prefs.regions.length === 0) {
    return { recommendations: [], totalClubCount: 0, totalBusinessCount: 0 };
  }

  const supabase = await createClient();

  // Parallel fetch: clubs + recent matches + lounge businesses (for youth)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  type ClubRinkJoin = { rink: Rink | null };

  const [clubsResult, matchesResult, memberCountsResult, loungeResult] =
    await Promise.all([
      supabase
        .from("clubs")
        .select("*, club_rinks(rink:rinks(*))")
        .order("name", { ascending: true }),
      supabase
        .from("matches")
        .select("id, club_id, rental_available, start_time")
        .neq("status", "canceled")
        .gte("start_time", thirtyDaysAgo.toISOString()),
      supabase.rpc("get_public_club_member_counts"),
      prefs.playerType === "youth"
        ? supabase
            .from("lounge_businesses")
            .select("*")
            .eq("is_published", true)
            .eq("category", "youth_club")
        : Promise.resolve({ data: [], error: null }),
    ]);

  const clubs = (clubsResult.data || []) as (Club & {
    club_rinks?: ClubRinkJoin[] | null;
  })[];
  const recentMatches = matchesResult.data || [];

  // Build member count map
  const memberCountMap = new Map<string, number>();
  ((memberCountsResult.data || []) as { club_id: string; member_count: number | string | null }[]).forEach(
    (row) => memberCountMap.set(row.club_id, Number(row.member_count ?? 0))
  );

  // Build match stats per club
  const matchCountByClub = new Map<string, number>();
  const rentalCountByClub = new Map<string, number>();
  recentMatches.forEach((m: { club_id: string | null; rental_available: boolean }) => {
    if (!m.club_id) return;
    matchCountByClub.set(m.club_id, (matchCountByClub.get(m.club_id) || 0) + 1);
    if (m.rental_available) {
      rentalCountByClub.set(m.club_id, (rentalCountByClub.get(m.club_id) || 0) + 1);
    }
  });

  // Score and rank clubs (B customers)
  const scoredClubs: RecommendedClub[] = clubs
    .map((club) => {
      const rinks =
        club.club_rinks
          ?.map((cr) => cr.rink)
          .filter((r): r is Rink => Boolean(r)) || [];

      const enrichedClub: Club = {
        ...club,
        rinks,
        member_count: memberCountMap.get(club.id) ?? 0,
      };

      const recentMatchCount = matchCountByClub.get(club.id) || 0;
      const rentalMatchCount = rentalCountByClub.get(club.id) || 0;
      const score = scoreClub(enrichedClub, prefs, recentMatchCount, rentalMatchCount);

      // Derive region label from primary rink
      const primaryRegion = rinks.length > 0 ? extractRegion(rinks[0].address) : "";

      return {
        type: "club" as const,
        id: club.id,
        name: club.name,
        logoUrl: club.logo_url || null,
        description: club.description || null,
        regionLabel: primaryRegion,
        memberCount: memberCountMap.get(club.id) ?? 0,
        recentMatchCount,
        hasRentalMatches: rentalMatchCount > 0,
        hasKakaoChat: Boolean(club.kakao_open_chat_url),
        rinkNames: rinks.map((r) => r.name_ko),
        score,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  // For youth: also include lounge businesses with category "youth_club"
  const scoredBusinesses: RecommendedClub[] = [];
  if (prefs.playerType === "youth" && loungeResult.data) {
    type LoungeBiz = {
      id: string;
      slug: string;
      name: string;
      logo_url: string | null;
      description: string | null;
      tagline: string | null;
      address: string | null;
      kakao_open_chat_url: string | null;
      category: string;
    };
    const businesses = loungeResult.data as LoungeBiz[];

    businesses.forEach((biz) => {
      // 1. Region match — strict equality, same as clubs
      if (!biz.address) return; // No address, cannot match region
      const bizRegion = extractRegion(biz.address);
      if (!prefs.regions.includes(bizRegion)) return; // Mismatch → skip entirely

      let score = 130; // Base (30) + region match (100)

      // 2. Equipment — youth businesses almost always provide equipment
      if (!prefs.hasEquipment) score += 20;

      // 3. Info completeness
      if (biz.description) score += 5;
      if (biz.logo_url) score += 5;
      if (biz.kakao_open_chat_url) score += 10;

      scoredBusinesses.push({
        type: "business",
        id: biz.id,
        name: biz.name,
        logoUrl: biz.logo_url,
        description: biz.tagline || biz.description || null,
        regionLabel: bizRegion,
        memberCount: 0,
        recentMatchCount: 0,
        hasRentalMatches: true, // Youth businesses typically provide gear
        hasKakaoChat: Boolean(biz.kakao_open_chat_url),
        rinkNames: [],
        score,
        slug: biz.slug,
        category: biz.category,
      });
    });
  }

  // Merge and sort (both arrays already filtered to score > 0)
  const allRecommendations = [...scoredClubs, ...scoredBusinesses]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    recommendations: allRecommendations,
    totalClubCount: clubs.length,
    totalBusinessCount: (loungeResult.data || []).length,
  };
}

/**
 * Get available regions from all rinks for the find-club wizard
 */
export async function getAvailableRegions(): Promise<string[]> {
  const supabase = await createClient();

  const { data: rinks } = await supabase
    .from("rinks")
    .select("address")
    .eq("is_approved", true);

  if (!rinks) return [];

  const detailedRegions = new Set<string>();
  rinks.forEach((rink: { address: string | null }) => {
    if (rink.address) {
      const region = extractRegion(rink.address);
      if (region) detailedRegions.add(region);
    }
  });

  // Return with custom sort: 서울 -> 경기 -> 인천 -> ... then alphabetical
  const order = [
    "서울", "경기", "인천", "부산", "대전", "대구",
    "광주", "울산", "세종", "충남", "충북", "강원",
    "전남", "전북", "경남", "경북", "제주",
  ];

  return Array.from(detailedRegions).sort((a, b) => {
    const aProv = a.split(" ")[0];
    const bProv = b.split(" ")[0];
    
    const aIdx = order.indexOf(aProv);
    const aWeight = aIdx === -1 ? order.length : aIdx;
    
    const bIdx = order.indexOf(bProv);
    const bWeight = bIdx === -1 ? order.length : bIdx;

    if (aWeight !== bWeight) return aWeight - bWeight;
    return a.localeCompare(b);
  });
}
