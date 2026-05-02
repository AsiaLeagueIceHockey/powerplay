import { createHash } from "node:crypto";

export type TamagotchiLocale = "ko" | "en";
export type TamagotchiActionType = "feed" | "train";
export type TamagotchiTone = "normal" | "special" | "encouraging";

export interface TamagotchiTrainingVariant {
  key: string;
  titleKo: string;
  titleEn: string;
  descriptionKo: string;
  descriptionEn: string;
  reactionKo: string;
  reactionEn: string;
  energyDelta: number;
  conditionDelta: number;
}

export interface TamagotchiMealVariant {
  key: string;
  titleKo: string;
  titleEn: string;
  bodyKo: string;
  bodyEn: string;
  energyDelta: number;
  conditionDelta: number;
  special: boolean;
}

export const TAMAGOTCHI_BASELINE = {
  energy: 72,
  condition: 78,
} as const;

export const TAMAGOTCHI_LIMITS = {
  minStat: 40,
  maxStat: 100,
  decayIntervalHours: 12,
  energyDecayPerWindow: 6,
  conditionDecayPerWindow: 5,
  reminderDelayHours: 8,
  specialMealChance: 0.28,
} as const;

export const TAMAGOTCHI_TRAINING_VARIANTS: TamagotchiTrainingVariant[] = [
  {
    key: "stop-lesson",
    titleKo: "스탑 레슨",
    titleEn: "Stop Lesson",
    descriptionKo: "엣지를 세우며 급정지 감각을 다시 잡는 날이에요.",
    descriptionEn: "Today is for sharpening your edges and clean stops.",
    reactionKo: "빙판에서 균형이 한층 안정됐어요.",
    reactionEn: "Your balance on the ice feels steadier already.",
    energyDelta: -4,
    conditionDelta: 14,
  },
  {
    key: "shooting-lesson",
    titleKo: "슈팅 레슨",
    titleEn: "Shooting Lesson",
    descriptionKo: "손목 힘과 릴리즈 타이밍을 가다듬는 훈련이에요.",
    descriptionEn: "A session focused on wrist strength and release timing.",
    reactionKo: "퍽이 더 날카롭게 뻗어나가요.",
    reactionEn: "The puck is coming off the blade much cleaner.",
    energyDelta: -5,
    conditionDelta: 15,
  },
  {
    key: "position-drill",
    titleKo: "포지션 훈련",
    titleEn: "Position Drill",
    descriptionKo: "오늘은 포지셔닝과 시야 판단을 점검해요.",
    descriptionEn: "Today focuses on positioning and reading the play.",
    reactionKo: "움직임이 더 영리해졌어요.",
    reactionEn: "Your movement feels a lot smarter now.",
    energyDelta: -3,
    conditionDelta: 13,
  },
  {
    key: "stamina-block",
    titleKo: "체력 훈련",
    titleEn: "Stamina Block",
    descriptionKo: "후반에도 버틸 수 있는 지구력을 끌어올려요.",
    descriptionEn: "Build stamina so you can hold up deep into the game.",
    reactionKo: "숨이 차도 호흡이 더 빨리 정리돼요.",
    reactionEn: "Even when you gas out, recovery comes faster.",
    energyDelta: -6,
    conditionDelta: 16,
  },
  {
    key: "skating-flow",
    titleKo: "스케이팅 훈련",
    titleEn: "Skating Drill",
    descriptionKo: "엣지 전환과 리듬을 살리는 스케이팅 루틴이에요.",
    descriptionEn: "A skating routine focused on edge transitions and rhythm.",
    reactionKo: "스텝이 더 부드럽고 경쾌해졌어요.",
    reactionEn: "Your stride feels smoother and quicker.",
    energyDelta: -4,
    conditionDelta: 14,
  },
];

const SPECIAL_MEALS: Record<string, Omit<TamagotchiMealVariant, "energyDelta" | "conditionDelta" | "special">> = {
  "stop-lesson": {
    key: "ramen-special",
    titleKo: "링크장 라면 특식",
    titleEn: "Rink Ramen Special",
    bodyKo: "급정지 훈련 뒤 따끈한 라면으로 기분까지 풀렸어요.",
    bodyEn: "A warm rink-side ramen special hit the spot after stop drills.",
  },
  "shooting-lesson": {
    key: "protein-shot",
    titleKo: "프로틴 스낵 특식",
    titleEn: "Protein Snack Special",
    bodyKo: "슈팅 감각을 살린 날이라 단백질 간식이 따라왔어요.",
    bodyEn: "A protein snack showed up to match your sharp shooting day.",
  },
  "position-drill": {
    key: "coach-bento",
    titleKo: "코치 도시락 특식",
    titleEn: "Coach Bento Special",
    bodyKo: "포지션 훈련을 잘 마쳐서 코치 도시락이 준비됐어요.",
    bodyEn: "You nailed positioning work, so a coach-approved bento appeared.",
  },
  "stamina-block": {
    key: "recovery-meal",
    titleKo: "회복 식단 특식",
    titleEn: "Recovery Meal Special",
    bodyKo: "체력 훈련 후 회복용 특식으로 금방 기운을 되찾았어요.",
    bodyEn: "A recovery meal special helped you bounce back fast after stamina work.",
  },
  "skating-flow": {
    key: "fruit-ice-cup",
    titleKo: "프루트 아이스컵 특식",
    titleEn: "Fruit Ice Cup Special",
    bodyKo: "스케이팅 리듬을 타고 나니 시원한 특식이 기다리고 있었어요.",
    bodyEn: "After finding your skating rhythm, a chilled fruit ice cup was waiting.",
  },
};

const DEFAULT_MEAL: TamagotchiMealVariant = {
  key: "regular-meal",
  titleKo: "일반 식사",
  titleEn: "Regular Meal",
  bodyKo: "오늘도 든든하게 먹고 에너지를 채웠어요.",
  bodyEn: "A solid regular meal topped your energy back up.",
  energyDelta: 20,
  conditionDelta: 6,
  special: false,
};

export function getLocalizedText(locale: TamagotchiLocale, ko: string, en: string) {
  return locale === "ko" ? ko : en;
}

function hashToUnitInterval(seed: string) {
  const digest = createHash("sha256").update(seed).digest("hex").slice(0, 8);
  const value = Number.parseInt(digest, 16);
  return value / 0xffffffff;
}

export function selectTrainingVariant(userId: string, dateKey: string) {
  const ratio = hashToUnitInterval(`${userId}:${dateKey}:training`);
  const index = Math.floor(ratio * TAMAGOTCHI_TRAINING_VARIANTS.length) % TAMAGOTCHI_TRAINING_VARIANTS.length;
  return TAMAGOTCHI_TRAINING_VARIANTS[index];
}

export function selectMealVariant(userId: string, dateKey: string, trainingKey: string): TamagotchiMealVariant {
  const ratio = hashToUnitInterval(`${userId}:${dateKey}:meal:${trainingKey}`);
  if (ratio > TAMAGOTCHI_LIMITS.specialMealChance) {
    return DEFAULT_MEAL;
  }

  const special = SPECIAL_MEALS[trainingKey];
  if (!special) {
    return DEFAULT_MEAL;
  }

  return {
    ...special,
    energyDelta: 24,
    conditionDelta: 10,
    special: true,
  };
}

export function getStageLabel(locale: TamagotchiLocale, energy: number, condition: number) {
  const average = (energy + condition) / 2;
  if (average >= 82) {
    return getLocalizedText(locale, "컨디션 최고", "Locked in");
  }

  if (average >= 64) {
    return getLocalizedText(locale, "오늘도 무난해요", "Ready to skate");
  }

  return getLocalizedText(locale, "가볍게 돌봐주세요", "Needs a light reset");
}

export function getStatusTone(energy: number, condition: number) {
  const total = energy + condition;
  if (total >= 160) {
    return "great" as const;
  }
  if (total >= 110) {
    return "steady" as const;
  }
  return "needs-care" as const;
}
