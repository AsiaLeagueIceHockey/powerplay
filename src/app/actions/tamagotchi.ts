"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAndNotify } from "@/lib/audit";
import type { TamagotchiLocale } from "@/lib/tamagotchi-config";
import {
  applyFeedAction,
  applyTrainAction,
  buildViewState,
  createDefaultPetSnapshot,
  describeReminderState,
  formatActionLockMessage,
  getActionAvailability,
  getDailyTrainingPreview,
  getKstDateKey,
  getMealPreview,
  normalizePetState,
  serializeReactionDelta,
  type TamagotchiPetSnapshot,
  type TamagotchiReaction,
} from "@/lib/tamagotchi-state";
import {
  buildReminderSchedule,
  buildTamagotchiReminderDedupeKey,
  buildTamagotchiReminderPayload,
} from "@/lib/tamagotchi-reminders";
import type { TamagotchiPetColors, TamagotchiScreenState } from "@/lib/tamagotchi-types";
import { isAllowedColor, normalizeColors } from "@/lib/tamagotchi-palette";

export type TamagotchiStateResponse = TamagotchiScreenState;
export interface TamagotchiActionResponse {
  success: boolean;
  error?: string;
  state?: TamagotchiScreenState;
}

interface TamagotchiPetRow {
  id: string;
  user_id: string;
  nickname: string | null;
  energy: number;
  condition: number;
  last_decay_at: string;
  last_interacted_at: string | null;
  last_fed_at: string | null;
  last_trained_at: string | null;
  last_training_key: string | null;
  pending_special_meal_key: string | null;
  helmet_color: string | null;
  jersey_color: string | null;
  skate_color: string | null;
}

const PET_COLUMNS =
  "id, user_id, nickname, energy, condition, last_decay_at, last_interacted_at, last_fed_at, last_trained_at, last_training_key, pending_special_meal_key, helmet_color, jersey_color, skate_color";

function rowToColors(row: TamagotchiPetRow): TamagotchiPetColors {
  return normalizeColors({
    helmet: row.helmet_color ?? undefined,
    jersey: row.jersey_color ?? undefined,
    skate: row.skate_color ?? undefined,
  });
}

function toSnapshot(row: TamagotchiPetRow): TamagotchiPetSnapshot {
  return {
    id: row.id,
    userId: row.user_id,
    energy: row.energy,
    condition: row.condition,
    lastDecayAt: row.last_decay_at,
    lastInteractedAt: row.last_interacted_at,
    lastFedAt: row.last_fed_at,
    lastTrainedAt: row.last_trained_at,
    lastTrainingKey: row.last_training_key,
    pendingSpecialMealKey: row.pending_special_meal_key,
  };
}

function toRowPatch(snapshot: TamagotchiPetSnapshot, userId: string) {
  return {
    user_id: userId,
    energy: snapshot.energy,
    condition: snapshot.condition,
    last_decay_at: snapshot.lastDecayAt,
    last_interacted_at: snapshot.lastInteractedAt,
    last_fed_at: snapshot.lastFedAt,
    last_trained_at: snapshot.lastTrainedAt,
    last_training_key: snapshot.lastTrainingKey,
    pending_special_meal_key: snapshot.pendingSpecialMealKey,
  };
}

async function getAuthedContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, profile };
}

interface PetWithColors {
  snapshot: TamagotchiPetSnapshot;
  colors: TamagotchiPetColors;
}

async function getOrCreatePet(userId: string): Promise<PetWithColors> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tamagotchi_pets")
    .select(PET_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    const row = data as TamagotchiPetRow;
    return { snapshot: toSnapshot(row), colors: rowToColors(row) };
  }

  const snapshot = createDefaultPetSnapshot();
  const { data: inserted, error: insertError } = await supabase
    .from("tamagotchi_pets")
    .insert(toRowPatch(snapshot, userId))
    .select(PET_COLUMNS)
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  const insertedRow = inserted as TamagotchiPetRow;
  return { snapshot: toSnapshot(insertedRow), colors: rowToColors(insertedRow) };
}

async function persistPet(snapshot: TamagotchiPetSnapshot, userId: string): Promise<PetWithColors> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tamagotchi_pets")
    .upsert(toRowPatch(snapshot, userId), { onConflict: "user_id" })
    .select(PET_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as TamagotchiPetRow;
  return { snapshot: toSnapshot(row), colors: rowToColors(row) };
}

async function getPushEnabled(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return (count ?? 0) > 0;
}

async function getQueuedReminder(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tamagotchi_reminder_jobs")
    .select("scheduled_for")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("scheduled_for", { ascending: false })
    .maybeSingle();

  return data?.scheduled_for ?? null;
}

async function enqueueReminder(userId: string, petId: string, dateKey: string, locale: TamagotchiLocale, now: Date) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tamagotchi_reminder_jobs")
    .upsert(
      {
        user_id: userId,
        pet_id: petId,
        trigger_action_type: "complete",
        scheduled_for: buildReminderSchedule(now),
        status: "pending",
        dedupe_key: buildTamagotchiReminderDedupeKey(userId, dateKey),
        payload: buildTamagotchiReminderPayload(locale),
        last_attempt_at: null,
        sent_at: null,
        error_message: null,
      },
      { onConflict: "dedupe_key" }
    );

  if (error) {
    throw new Error(error.message);
  }
}

async function logAction(
  userId: string,
  petId: string,
  actionType: "feed" | "train",
  dateKey: string,
  reaction: TamagotchiReaction
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tamagotchi_action_logs")
    .upsert(
      {
        user_id: userId,
        pet_id: petId,
        action_type: actionType,
        variant_key: reaction.variantKey,
        delta_payload: serializeReactionDelta(reaction),
        kst_date_key: dateKey,
        idempotency_key: `${userId}:${actionType}:${dateKey}`,
      },
      { onConflict: "idempotency_key" }
    );

  if (error) {
    throw new Error(error.message);
  }
}

async function buildState(
  locale: TamagotchiLocale,
  userId: string,
  displayName: string,
  snapshot: TamagotchiPetSnapshot,
  colors: TamagotchiPetColors,
  decayed = false,
  reaction: TamagotchiReaction | null = null
): Promise<TamagotchiScreenState> {
  const view = buildViewState(snapshot, locale);
  const trainingPreview = getDailyTrainingPreview(userId, locale);
  const mealPreview = getMealPreview(userId, locale);
  const pushEnabled = await getPushEnabled(userId);
  const queuedFor = await getQueuedReminder(userId);
  const availability = getActionAvailability(snapshot);

  return {
    displayName,
    dateKey: getKstDateKey(),
    stageLabel: view.stageLabel,
    pet: {
      energy: snapshot.energy,
      condition: snapshot.condition,
      colors,
    },
    status: {
      decayed,
      message: decayed
        ? (locale === "ko"
            ? "잠깐 쉬는 동안 에너지와 컨디션이 조금 내려갔어요."
            : "Energy and condition dipped a little while you were away.")
        : availability.visitMode === "read_only"
          ? (locale === "ko"
              ? "오늘 할 수 있는 행동은 모두 끝났어요. 나중에 다시 상태를 확인해보세요."
              : "You have finished today's actions. Come back later to check the result.")
          : (locale === "ko"
              ? "식사하기와 훈련하기를 마치면 다음 리듬을 위한 준비가 끝나요."
              : "Finish eating and training to set up the next return loop."),
      visitMode: availability.visitMode,
    },
    training: {
      key: trainingPreview.key,
      title: trainingPreview.title,
      description: trainingPreview.description,
      completed: !availability.canTrain,
    },
    meal: {
      key: mealPreview.key,
      title: mealPreview.title,
      special: Boolean(snapshot.pendingSpecialMealKey),
      completed: !availability.canFeed,
    },
    actions: {
      canFeed: availability.canFeed,
      canTrain: availability.canTrain,
      bothCompleted: !availability.canFeed && !availability.canTrain,
    },
    reminder: {
      pushEnabled,
      queuedFor: describeReminderState(queuedFor, locale)?.scheduledFor ?? null,
      hint: pushEnabled
        ? (locale === "ko"
            ? "오늘 루틴을 마치면 약 8시간 뒤 다시 돌아오라는 알림을 준비해둘게요."
            : "Finish today’s loop and we will queue a reminder for about 8 hours later.")
        : (locale === "ko"
            ? "푸시를 켜두면 약 8시간 뒤 다시 돌아올 타이밍을 알려드릴게요."
            : "Turn on push and we will nudge you about 8 hours later."),
    },
    reaction: reaction
      ? {
          title: reaction.title,
          body: reaction.body,
          tone: reaction.tone,
        }
      : null,
  };
}

async function hydratePet(userId: string): Promise<{ pet: PetWithColors; decayed: boolean }> {
  const pet = await getOrCreatePet(userId);
  const normalized = normalizePetState(pet.snapshot);
  if (!normalized.changed) {
    return { pet, decayed: false };
  }

  const persisted = await persistPet(normalized.snapshot, userId);
  return { pet: persisted, decayed: normalized.windows > 0 };
}

export async function getTamagotchiState(locale: string) {
  const typedLocale = locale === "en" ? "en" : "ko";
  const { user, profile } = await getAuthedContext();
  if (!user) {
    return null;
  }

  const hydrated = await hydratePet(user.id);
  return buildState(
    typedLocale,
    user.id,
    profile?.full_name || user.email?.split("@")[0] || "Player",
    hydrated.pet.snapshot,
    hydrated.pet.colors,
    hydrated.decayed
  );
}

async function performAction(actionType: "feed" | "train", locale: string) {
  const typedLocale = locale === "en" ? "en" : "ko";
  const { user, profile } = await getAuthedContext();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const hydrated = await hydratePet(user.id);
  const availability = getActionAvailability(hydrated.pet.snapshot);
  if ((actionType === "feed" && !availability.canFeed) || (actionType === "train" && !availability.canTrain)) {
    return {
      success: false,
      error: formatActionLockMessage(actionType, typedLocale),
      state: await buildState(
        typedLocale,
        user.id,
        profile?.full_name || user.email?.split("@")[0] || "Player",
        hydrated.pet.snapshot,
        hydrated.pet.colors,
        hydrated.decayed
      ),
    };
  }

  const now = new Date();
  const result = actionType === "feed"
    ? applyFeedAction({ snapshot: hydrated.pet.snapshot, locale: typedLocale, now, userId: user.id })
    : applyTrainAction({ snapshot: hydrated.pet.snapshot, locale: typedLocale, now, userId: user.id });

  const storedPet = await persistPet(result.snapshot, user.id);
  const dateKey = getKstDateKey(now);
  await logAction(user.id, storedPet.snapshot.id!, actionType, dateKey, result.reaction);

  const nextAvailability = getActionAvailability(storedPet.snapshot);
  if (!nextAvailability.canFeed && !nextAvailability.canTrain) {
    await enqueueReminder(user.id, storedPet.snapshot.id!, dateKey, typedLocale, now);
  }

  // Audit: notify superusers of tamagotchi engagement (after() — non-blocking)
  logAndNotify({
    userId: user.id,
    action: actionType === "feed" ? "TAMAGOTCHI_FEED" : "TAMAGOTCHI_TRAIN",
    description:
      actionType === "feed"
        ? `다마고치 식사 (에너지 ${storedPet.snapshot.energy}, 컨디션 ${storedPet.snapshot.condition})`
        : `다마고치 훈련 (에너지 ${storedPet.snapshot.energy}, 컨디션 ${storedPet.snapshot.condition})`,
    metadata: {
      pet_id: storedPet.snapshot.id,
      energy: storedPet.snapshot.energy,
      condition: storedPet.snapshot.condition,
      date_key: dateKey,
    },
  });

  revalidatePath(`/${typedLocale}/mypage`);
  revalidatePath(`/${typedLocale}/mypage/tamagotchi`);

  return {
    success: true,
    state: await buildState(
      typedLocale,
      user.id,
      profile?.full_name || user.email?.split("@")[0] || "Player",
      storedPet.snapshot,
      storedPet.colors,
      false,
      result.reaction
    ),
  };
}

export async function feedTamagotchi(locale: string) {
  return performAction("feed", locale);
}

export async function trainTamagotchi(locale: string) {
  return performAction("train", locale);
}

export async function updateTamagotchiColors(
  locale: string,
  colors: TamagotchiPetColors
): Promise<TamagotchiActionResponse> {
  const typedLocale = locale === "en" ? "en" : "ko";
  const { supabase, user, profile } = await getAuthedContext();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // 클라이언트 측 1차 가드 — 실제 권한은 RPC 가 강제
  if (
    !isAllowedColor("helmet", colors.helmet) ||
    !isAllowedColor("jersey", colors.jersey) ||
    !isAllowedColor("skate", colors.skate)
  ) {
    return { success: false, error: "Invalid color selection" };
  }

  const { error: rpcError } = await supabase.rpc("update_tamagotchi_colors", {
    p_helmet: colors.helmet,
    p_jersey: colors.jersey,
    p_skate: colors.skate,
  });

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  revalidatePath(`/${typedLocale}/mypage`);
  revalidatePath(`/${typedLocale}/mypage/tamagotchi`);

  // 갱신된 state 재조회 (디스플레이 일관성)
  const hydrated = await hydratePet(user.id);
  const state = await buildState(
    typedLocale,
    user.id,
    profile?.full_name || user.email?.split("@")[0] || "Player",
    hydrated.pet.snapshot,
    hydrated.pet.colors,
    hydrated.decayed
  );

  return { success: true, state };
}

