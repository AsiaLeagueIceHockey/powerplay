import {
  getLocalizedText,
  getStageLabel,
  selectMealVariant,
  selectTrainingVariant,
  type TamagotchiActionType,
  type TamagotchiLocale,
  type TamagotchiMealVariant,
  type TamagotchiTone,
  TAMAGOTCHI_BASELINE,
  TAMAGOTCHI_LIMITS,
} from "@/lib/tamagotchi-config";

export interface TamagotchiPetSnapshot {
  id?: string;
  userId?: string;
  energy: number;
  condition: number;
  lastDecayAt: string;
  lastInteractedAt: string | null;
  lastFedAt: string | null;
  lastTrainedAt: string | null;
  lastTrainingKey: string | null;
  pendingSpecialMealKey: string | null;
}

export interface TamagotchiReaction {
  actionType: TamagotchiActionType;
  title: string;
  body: string;
  tone: TamagotchiTone;
  variantKey: string;
  stats: {
    energy: number;
    condition: number;
  };
}

export interface TamagotchiViewState {
  energy: number;
  condition: number;
  stageLabel: string;
  canFeed: boolean;
  canTrain: boolean;
  visitMode: "active" | "read_only";
}

const DECAY_WINDOW_MS = TAMAGOTCHI_LIMITS.decayIntervalHours * 60 * 60 * 1000;

function clampStat(value: number) {
  return Math.min(TAMAGOTCHI_LIMITS.maxStat, Math.max(TAMAGOTCHI_LIMITS.minStat, value));
}

function formatDatePart(date: Date, locale: "ko" | "en", part: Intl.DateTimeFormatPartTypes) {
  const formatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.formatToParts(date).find((token) => token.type === part)?.value ?? "00";
}

export function getKstDateKey(date: Date | string = new Date()) {
  const value = typeof date === "string" ? new Date(date) : date;
  const year = formatDatePart(value, "ko", "year");
  const month = formatDatePart(value, "ko", "month");
  const day = formatDatePart(value, "ko", "day");
  return `${year}-${month}-${day}`;
}

export function isSameKstDay(a: string | null, b: Date | string = new Date()) {
  if (!a) {
    return false;
  }

  return getKstDateKey(a) === getKstDateKey(b);
}

export function createDefaultPetSnapshot(now: Date | string = new Date()): TamagotchiPetSnapshot {
  const iso = typeof now === "string" ? now : now.toISOString();
  return {
    energy: TAMAGOTCHI_BASELINE.energy,
    condition: TAMAGOTCHI_BASELINE.condition,
    lastDecayAt: iso,
    lastInteractedAt: iso,
    lastFedAt: null,
    lastTrainedAt: null,
    lastTrainingKey: null,
    pendingSpecialMealKey: null,
  };
}

export function normalizePetState(snapshot: TamagotchiPetSnapshot, now: Date = new Date()) {
  const lastDecay = new Date(snapshot.lastDecayAt);
  const elapsedMs = Math.max(0, now.getTime() - lastDecay.getTime());
  const windows = Math.floor(elapsedMs / DECAY_WINDOW_MS);

  if (windows <= 0) {
    return {
      snapshot,
      changed: false,
      windows,
    };
  }

  const normalized: TamagotchiPetSnapshot = {
    ...snapshot,
    energy: clampStat(snapshot.energy - windows * TAMAGOTCHI_LIMITS.energyDecayPerWindow),
    condition: clampStat(snapshot.condition - windows * TAMAGOTCHI_LIMITS.conditionDecayPerWindow),
    lastDecayAt: new Date(lastDecay.getTime() + windows * DECAY_WINDOW_MS).toISOString(),
  };

  return {
    snapshot: normalized,
    changed:
      normalized.energy !== snapshot.energy ||
      normalized.condition !== snapshot.condition ||
      normalized.lastDecayAt !== snapshot.lastDecayAt,
    windows,
  };
}

export function getActionAvailability(snapshot: TamagotchiPetSnapshot, now: Date = new Date()) {
  const canFeed = !isSameKstDay(snapshot.lastFedAt, now);
  const canTrain = !isSameKstDay(snapshot.lastTrainedAt, now);
  return {
    canFeed,
    canTrain,
    visitMode: canFeed || canTrain ? "active" : "read_only",
  } satisfies Pick<TamagotchiViewState, "canFeed" | "canTrain" | "visitMode">;
}

export function buildViewState(snapshot: TamagotchiPetSnapshot, locale: TamagotchiLocale, now: Date = new Date()): TamagotchiViewState {
  const availability = getActionAvailability(snapshot, now);
  return {
    energy: snapshot.energy,
    condition: snapshot.condition,
    stageLabel: getStageLabel(locale, snapshot.energy, snapshot.condition),
    ...availability,
  };
}

export function applyFeedAction({
  snapshot,
  locale,
  now,
  userId,
}: {
  snapshot: TamagotchiPetSnapshot;
  locale: TamagotchiLocale;
  now: Date;
  userId: string;
}) {
  if (!getActionAvailability(snapshot, now).canFeed) {
    throw new Error("Feed already completed for today");
  }

  const dateKey = getKstDateKey(now);
  const training = selectTrainingVariant(userId, dateKey);
  const meal = snapshot.pendingSpecialMealKey
    ? {
        ...selectMealVariant(userId, dateKey, training.key),
        key: snapshot.pendingSpecialMealKey,
        special: true,
      }
    : selectMealVariant(userId, dateKey, training.key);

  const nextSnapshot: TamagotchiPetSnapshot = {
    ...snapshot,
    energy: clampStat(snapshot.energy + meal.energyDelta),
    condition: clampStat(snapshot.condition + meal.conditionDelta),
    lastFedAt: now.toISOString(),
    lastInteractedAt: now.toISOString(),
    pendingSpecialMealKey: null,
  };

  const reaction: TamagotchiReaction = {
    actionType: "feed",
    title: getLocalizedText(locale, meal.titleKo, meal.titleEn),
    body: getLocalizedText(locale, meal.bodyKo, meal.bodyEn),
    tone: meal.special ? "special" : "normal",
    variantKey: meal.key,
    stats: {
      energy: nextSnapshot.energy,
      condition: nextSnapshot.condition,
    },
  };

  return {
    snapshot: nextSnapshot,
    reaction,
    meal,
  };
}

export function applyTrainAction({
  snapshot,
  locale,
  now,
  userId,
}: {
  snapshot: TamagotchiPetSnapshot;
  locale: TamagotchiLocale;
  now: Date;
  userId: string;
}) {
  if (!getActionAvailability(snapshot, now).canTrain) {
    throw new Error("Training already completed for today");
  }

  const training = selectTrainingVariant(userId, getKstDateKey(now));
  const meal = selectMealVariant(userId, getKstDateKey(now), training.key);
  const nextSnapshot: TamagotchiPetSnapshot = {
    ...snapshot,
    energy: clampStat(snapshot.energy + training.energyDelta),
    condition: clampStat(snapshot.condition + training.conditionDelta),
    lastTrainedAt: now.toISOString(),
    lastInteractedAt: now.toISOString(),
    lastTrainingKey: training.key,
    pendingSpecialMealKey: meal.special ? meal.key : null,
  };

  const reaction: TamagotchiReaction = {
    actionType: "train",
    title: getLocalizedText(locale, training.titleKo, training.titleEn),
    body: getLocalizedText(locale, training.reactionKo, training.reactionEn),
    tone: "encouraging",
    variantKey: training.key,
    stats: {
      energy: nextSnapshot.energy,
      condition: nextSnapshot.condition,
    },
  };

  return {
    snapshot: nextSnapshot,
    reaction,
    training,
  };
}

export function serializeReactionDelta(reaction: TamagotchiReaction) {
  return {
    actionType: reaction.actionType,
    title: reaction.title,
    body: reaction.body,
    tone: reaction.tone,
    variantKey: reaction.variantKey,
    stats: reaction.stats,
  };
}

export function describeReminderState(scheduledFor: string | null, locale: TamagotchiLocale) {
  if (!scheduledFor) {
    return null;
  }

  return {
    scheduledFor,
    label: getLocalizedText(locale, "알림 대기 중", "Reminder queued"),
  };
}

export function formatActionLockMessage(actionType: TamagotchiActionType, locale: TamagotchiLocale) {
  if (actionType === "feed") {
    return getLocalizedText(locale, "오늘 식사는 이미 챙겼어요.", "Today's meal is already done.");
  }

  return getLocalizedText(locale, "오늘 훈련은 이미 끝냈어요.", "Today's training is already complete.");
}

export function getDailyTrainingPreview(userId: string, locale: TamagotchiLocale, now: Date = new Date()) {
  const training = selectTrainingVariant(userId, getKstDateKey(now));
  return {
    key: training.key,
    title: getLocalizedText(locale, training.titleKo, training.titleEn),
    description: getLocalizedText(locale, training.descriptionKo, training.descriptionEn),
  };
}

export function getMealPreview(
  userId: string,
  locale: TamagotchiLocale,
  now: Date = new Date()
): Pick<TamagotchiMealVariant, "key"> & { title: string; special: boolean } {
  const training = selectTrainingVariant(userId, getKstDateKey(now));
  const meal = selectMealVariant(userId, getKstDateKey(now), training.key);
  return {
    key: meal.key,
    title: getLocalizedText(locale, meal.titleKo, meal.titleEn),
    special: meal.special,
  };
}
