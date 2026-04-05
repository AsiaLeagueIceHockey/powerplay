import { createHash } from "node:crypto";

type FortuneRole = "FW" | "DF" | "G" | "NONE";
type FortuneCaseKey =
  | "clutch"
  | "tempo"
  | "steady"
  | "synergy"
  | "positioning"
  | "focus"
  | "recovery"
  | "basics"
  | "defense"
  | "caution"
  | "communication"
  | "hiddenChance";

type ExperienceBucket = "new" | "growing" | "seasoned";

interface RoleCopy {
  labelKo: string;
  labelEn: string;
  focusKo: string;
  focusEn: string;
  styleKo: string;
  styleEn: string;
  cautionKo: string;
  cautionEn: string;
}

interface FortuneCaseTemplate {
  key: FortuneCaseKey;
  scoreMin: number;
  scoreMax: number;
  titleKo: string;
  titleEn: string;
  summaryKo: string;
  summaryEn: string;
  detailsKo: string[];
  detailsEn: string[];
  dominantTheme: string;
  cautionTheme: string;
}

export interface DailyHockeyFortuneProfile {
  full_name?: string | null;
  position?: string | null;
  detailed_positions?: string[] | null;
  phone?: string | null;
  birth_date?: string | null;
  primary_club_id?: string | null;
  hockey_start_date?: string | null;
  stick_direction?: string | null;
}

export interface StoredDailyHockeyFortune {
  fortuneDate: string;
  score: number;
  titleKo: string;
  titleEn: string;
  summaryKo: string;
  summaryEn: string;
  detailsKo: string[];
  detailsEn: string[];
  dominantTheme: string;
  cautionTheme: string;
  signals: Record<string, string | number | boolean>;
}

const ROLE_COPY: Record<FortuneRole, RoleCopy> = {
  FW: {
    labelKo: "포워드",
    labelEn: "forward",
    focusKo: "마무리 타이밍",
    focusEn: "finishing timing",
    styleKo: "빠른 침투와 간결한 마무리",
    styleEn: "quick entries and simple finishes",
    cautionKo: "급한 마무리",
    cautionEn: "rushing the finish",
  },
  DF: {
    labelKo: "디펜스",
    labelEn: "defender",
    focusKo: "간격 유지와 커버",
    focusEn: "gap control and coverage",
    styleKo: "짧은 연결과 안정적인 커버",
    styleEn: "short puck movement and steady cover",
    cautionKo: "과한 전진",
    cautionEn: "overcommitting forward",
  },
  G: {
    labelKo: "골리",
    labelEn: "goalie",
    focusKo: "첫 반응과 시야 확보",
    focusEn: "first reactions and vision",
    styleKo: "차분한 세이브와 리바운드 정리",
    styleEn: "calm saves and rebound control",
    cautionKo: "성급한 무브",
    cautionEn: "jumping too early",
  },
  NONE: {
    labelKo: "플레이어",
    labelEn: "player",
    focusKo: "전체적인 경기 감각",
    focusEn: "overall game feel",
    styleKo: "간결한 연결과 안정적인 판단",
    styleEn: "simple puck movement and steady choices",
    cautionKo: "오버페이스",
    cautionEn: "overpacing",
  },
};

const CASE_POOLS: Record<FortuneRole, FortuneCaseKey[]> = {
  FW: ["clutch", "tempo", "hiddenChance", "synergy", "communication", "caution", "recovery", "basics", "steady", "focus"],
  DF: ["steady", "positioning", "defense", "synergy", "communication", "focus", "recovery", "basics", "hiddenChance", "caution"],
  G: ["focus", "steady", "positioning", "communication", "recovery", "hiddenChance", "caution", "basics", "synergy", "defense"],
  NONE: ["steady", "synergy", "basics", "communication", "hiddenChance", "tempo", "focus", "recovery", "caution", "positioning"],
};

const FORTUNE_CASES: Record<FortuneCaseKey, FortuneCaseTemplate> = {
  clutch: {
    key: "clutch",
    scoreMin: 92,
    scoreMax: 100,
    titleKo: "승부처에서 한 번 해볼 만한 날",
    titleEn: "A day to show up in key moments",
    summaryKo: "오늘은 {roleLabelKo}로서 {focusKo}이 평소보다 날카롭게 살아날 수 있는 날입니다.",
    summaryEn: "Today favors your {focusEn} as a {roleLabelEn}.",
    detailsKo: [
      "{styleKo} 쪽으로 단순하게 가면 찬스에서 깔끔하게 결정지을 수 있어요.",
      "{experienceHintKo}",
      "{cautionKo}만 줄이면 좋은 플레이가 한두 번은 꼭 나올 만한 흐름입니다.",
    ],
    detailsEn: [
      "The more you lean into {styleEn}, the easier good moments may come.",
      "{experienceHintEn}",
      "If you avoid {cautionEn}, this score can turn into a very satisfying skate.",
    ],
    dominantTheme: "clutch",
    cautionTheme: "rush-control",
  },
  tempo: {
    key: "tempo",
    scoreMin: 88,
    scoreMax: 96,
    titleKo: "발이 가볍고 템포가 잘 붙는 날",
    titleEn: "A day when your skating rhythm clicks",
    summaryKo: "몸을 억지로 끌어올리지 않아도 첫 몇 번의 템포가 괜찮게 붙을 수 있는 날입니다.",
    summaryEn: "Timing comes before force today, so {styleEn} should fit you well.",
    detailsKo: [
      "초반부터 세게 몰아붙이기보다 첫 시프트에서 리듬만 잡아도 컨디션이 올라올 수 있어요.",
      "{experienceHintKo}",
      "발이 가볍다고 조급하게 처리하면 오히려 {cautionKo}로 이어질 수 있으니 템포만 유지해보세요.",
    ],
    detailsEn: [
      "Instead of forcing it early, build your rhythm through one or two clean shifts.",
      "{experienceHintEn}",
      "Even with good rhythm, pressing too hard can still become {cautionEn}.",
    ],
    dominantTheme: "tempo",
    cautionTheme: "pace-management",
  },
  steady: {
    key: "steady",
    scoreMin: 85,
    scoreMax: 93,
    titleKo: "침착하게 풀수록 잘 되는 날",
    titleEn: "A day to control the flow with calm",
    summaryKo: "오늘은 화려한 플레이보다 안정적인 선택이 결과로 이어지기 쉬운 날입니다.",
    summaryEn: "Today rewards stable choices more than flashy plays.",
    detailsKo: [
      "{roleLabelKo}로서 {focusKo}을 차분하게 가져가면 잔실수가 줄고 전체 흐름이 편해질 수 있어요.",
      "{experienceHintKo}",
      "오늘은 억지로 속도를 올리기보다 플레이를 단순하게 가져가는 쪽이 더 잘 맞습니다.",
    ],
    detailsEn: [
      "If you stay calm with your {focusEn} as a {roleLabelEn}, small mistakes may drop quickly.",
      "{experienceHintEn}",
      "Today fits sorting the play out better than chasing more speed.",
    ],
    dominantTheme: "calm-control",
    cautionTheme: "overforce",
  },
  synergy: {
    key: "synergy",
    scoreMin: 86,
    scoreMax: 95,
    titleKo: "호흡이 맞을수록 플레이가 쉬워지는 날",
    titleEn: "A day that gets better with team play",
    summaryKo: "혼자 해결하려고 하기보다 패스 타이밍과 커버를 맞출 때 더 잘 풀릴 수 있어요.",
    summaryEn: "Connected team play matters more than individual forcing today.",
    detailsKo: [
      "{styleKo}에 주변 동료와의 타이밍이 맞으면 플레이가 훨씬 가볍게 풀릴 수 있습니다.",
      "{experienceHintKo}",
      "오늘은 한 번 더 주고받는 선택이 오히려 좋은 플레이로 이어질 가능성이 큽니다.",
    ],
    detailsEn: [
      "When teammate timing joins your {styleEn}, the result can be better than expected.",
      "{experienceHintEn}",
      "If you let go of solving everything alone, your overall feel should become easier.",
    ],
    dominantTheme: "team-synergy",
    cautionTheme: "solo-force",
  },
  positioning: {
    key: "positioning",
    scoreMin: 84,
    scoreMax: 92,
    titleKo: "자리 잘 잡는 게 중요한 날",
    titleEn: "A day when positioning does the heavy lifting",
    summaryKo: "오늘은 많이 움직이는 것보다 미리 좋은 위치를 잡는 게 더 중요할 수 있어요.",
    summaryEn: "Today is more about positioning and reads than raw speed.",
    detailsKo: [
      "{roleLabelKo}로서 {focusKo}에 신경 쓰면 크게 튀지 않아도 팀에 도움이 되는 플레이가 늘 수 있습니다.",
      "{experienceHintKo}",
      "오늘은 많이 뛰는 것보다 한 박자 먼저 준비하고 서 있는 쪽이 더 유리합니다.",
    ],
    detailsEn: [
      "As a {roleLabelEn}, leaning into your {focusEn} can raise your impact even if it looks quiet.",
      "{experienceHintEn}",
      "It will help more to be set a beat earlier than to move bigger.",
    ],
    dominantTheme: "positioning",
    cautionTheme: "late-read",
  },
  focus: {
    key: "focus",
    scoreMin: 87,
    scoreMax: 96,
    titleKo: "시야와 판단이 또렷한 날",
    titleEn: "A day when your focus feels sharp",
    summaryKo: "퍽 보는 타이밍과 상황 판단이 평소보다 선명하게 들어올 수 있는 날입니다.",
    summaryEn: "Your reads and attention should feel a beat sharper today.",
    detailsKo: [
      "{roleLabelKo}로서 필요한 순간에만 힘을 쓰면 좋은 판단이 더 자주 나올 수 있어요.",
      "{experienceHintKo}",
      "집중이 잘 되는 날일수록 {cautionKo}로 흐르지 않게 템포를 한번씩 정리해보세요.",
    ],
    detailsEn: [
      "Rather than overplaying your strengths, use them cleanly in the moments that matter.",
      "{experienceHintEn}",
      "Even sharp focus can break quickly if it turns into {cautionEn}.",
    ],
    dominantTheme: "focus",
    cautionTheme: "tension-spike",
  },
  recovery: {
    key: "recovery",
    scoreMin: 80,
    scoreMax: 88,
    titleKo: "무리하지 않는 운영이 필요한 날",
    titleEn: "A day to do well by managing and recovering",
    summaryKo: "오늘은 한 번 터뜨리기보다 페이스를 지키는 쪽이 경기 만족도가 더 높을 수 있어요.",
    summaryEn: "Today is more about balance and recovery than one explosive play.",
    detailsKo: [
      "{styleKo}처럼 힘을 덜 쓰는 선택이 오히려 끝까지 컨디션을 지켜줄 수 있습니다.",
      "{experienceHintKo}",
      "조금 아쉽더라도 {cautionKo}로 이어질 무리수는 줄이는 편이 오늘은 더 낫습니다.",
    ],
    detailsEn: [
      "Lower-stress options like {styleEn} may actually leave you feeling better overall.",
      "{experienceHintEn}",
      "Even if it feels modest, it is better to avoid the push that could become {cautionEn}.",
    ],
    dominantTheme: "recovery",
    cautionTheme: "fatigue",
  },
  basics: {
    key: "basics",
    scoreMin: 82,
    scoreMax: 90,
    titleKo: "기본 플레이가 잘 먹히는 날",
    titleEn: "A day when the basics shine",
    summaryKo: "복잡하게 가기보다 쉬운 패스와 간단한 처리만 해도 흐름이 좋아질 수 있어요.",
    summaryEn: "Simple, clean plays can feel much more rewarding than complex ones today.",
    detailsKo: [
      "{roleLabelKo}로서 기본 동작만 깔끔하게 가져가도 경기 전체가 한결 편해질 수 있습니다.",
      "{experienceHintKo}",
      "오늘은 화려한 한 번보다 반복해서 되는 플레이를 쌓는 쪽이 더 좋습니다.",
    ],
    detailsEn: [
      "Tidying up the core actions of a {roleLabelEn} can settle your whole game today.",
      "{experienceHintEn}",
      "Repeatable plays will likely score better for you than flashy ones right now.",
    ],
    dominantTheme: "basics",
    cautionTheme: "overcomplicate",
  },
  defense: {
    key: "defense",
    scoreMin: 84,
    scoreMax: 93,
    titleKo: "커버와 간격 유지가 빛나는 날",
    titleEn: "A day when quiet defensive work matters",
    summaryKo: "오늘은 과감하게 나가기보다 뒤를 정리하고 간격을 맞추는 플레이가 더 중요할 수 있어요.",
    summaryEn: "Quietly breaking the opponent's flow may matter more than highlight plays today.",
    detailsKo: [
      "{focusKo}을 안정적으로 가져가면 우리 팀 전체 리듬도 같이 편해질 수 있습니다.",
      "{experienceHintKo}",
      "오늘은 앞으로 치고 나가는 순간보다 뒤를 받쳐주는 플레이에서 만족도가 더 클 수 있어요.",
    ],
    detailsEn: [
      "If your {focusEn} stays stable, it can lift the rhythm of the whole group.",
      "{experienceHintEn}",
      "You may feel better today from the moments you clean up than from the ones you jump into.",
    ],
    dominantTheme: "defensive-sense",
    cautionTheme: "chasing",
  },
  caution: {
    key: "caution",
    scoreMin: 80,
    scoreMax: 86,
    titleKo: "서두르지만 않으면 괜찮은 날",
    titleEn: "A day when pace control saves the fortune",
    summaryKo: "컨디션이 아주 나쁜 건 아니지만, 급해지면 리듬이 금방 꼬일 수 있어요.",
    summaryEn: "This is not a bad day, but the flow can shake quickly if you rush.",
    detailsKo: [
      "첫 두세 번의 판단만 차분하게 가져가도 오늘 흐름은 생각보다 괜찮게 갈 수 있습니다.",
      "{experienceHintKo}",
      "{cautionKo} 쪽으로 기울지 않게 시프트마다 호흡을 한번씩 정리해보세요.",
    ],
    detailsEn: [
      "If your first few reads stay calm, today's score can feel better than it looks.",
      "{experienceHintEn}",
      "Take a breath before the play turns toward {cautionEn}.",
    ],
    dominantTheme: "pace-control",
    cautionTheme: "impulse",
  },
  communication: {
    key: "communication",
    scoreMin: 83,
    scoreMax: 91,
    titleKo: "콜 한마디가 잘 먹히는 날",
    titleEn: "A day when communication changes the flow",
    summaryKo: "오늘은 개인 기술보다 짧고 정확한 콜이 플레이를 더 편하게 만들어줄 수 있어요.",
    summaryEn: "Short calls and clean communication may matter more than raw skill today.",
    detailsKo: [
      "특히 {roleLabelKo}로서 먼저 보고 먼저 말해주는 플레이가 잘 맞을 수 있습니다.",
      "{experienceHintKo}",
      "오늘은 말을 많이 하기보다 필요한 순간에 짧게 정리해주는 쪽이 더 좋습니다.",
    ],
    detailsEn: [
      "Especially as a {roleLabelEn}, reads that you call out early can fit very well today.",
      "{experienceHintEn}",
      "It is better to speak clearly at the right moment than to say a lot.",
    ],
    dominantTheme: "communication",
    cautionTheme: "silence",
  },
  hiddenChance: {
    key: "hiddenChance",
    scoreMin: 86,
    scoreMax: 94,
    titleKo: "놓친 뒤에도 다시 기회가 오는 날",
    titleEn: "A day when hidden chances appear",
    summaryKo: "첫 플레이가 아쉬워도 다음 흐름에서 다시 기회를 잡을 수 있는 날입니다.",
    summaryEn: "Even without forcing the spotlight, second chances may find you today.",
    detailsKo: [
      "첫 플레이보다 그다음 흐름에서 {focusKo}이 더 잘 살아날 가능성이 큽니다.",
      "{experienceHintKo}",
      "한 번 놓친 플레이가 있어도 바로 다음 시프트나 다음 터치에서 다시 풀릴 수 있어요.",
    ],
    detailsEn: [
      "Your {focusEn} may show up more in the play after the play than in the first moment.",
      "{experienceHintEn}",
      "Even if you miss one moment, the next one may open again quickly.",
    ],
    dominantTheme: "second-chance",
    cautionTheme: "frustration",
  },
};

function getKstDateFormatter() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function pickIndex(seed: string, length: number) {
  const hash = createHash("sha256").update(seed).digest("hex");
  const value = Number.parseInt(hash.slice(0, 12), 16);
  return value % length;
}

function pickSignedOffset(seed: string, maxOffset: number) {
  const span = maxOffset * 2 + 1;
  return pickIndex(seed, span) - maxOffset;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveRole(profile?: DailyHockeyFortuneProfile | null): FortuneRole {
  const detailed = profile?.detailed_positions?.find((position) =>
    position === "FW" || position === "DF" || position === "G"
  );

  if (detailed) {
    return detailed;
  }

  if (profile?.position === "FW" || profile?.position === "DF" || profile?.position === "G") {
    return profile.position;
  }

  return "NONE";
}

function getProfileCompleteness(profile?: DailyHockeyFortuneProfile | null) {
  const fields = [
    profile?.full_name,
    profile?.phone,
    profile?.birth_date,
    profile?.primary_club_id,
    profile?.hockey_start_date,
    profile?.stick_direction,
    profile?.detailed_positions?.length ? "positions" : profile?.position,
  ];

  return fields.filter(Boolean).length;
}

function getExperienceBucket(profile?: DailyHockeyFortuneProfile | null, fortuneDate?: string): ExperienceBucket {
  if (!profile?.hockey_start_date) {
    return "growing";
  }

  const now = new Date(`${fortuneDate ?? getTodayKstDateKey()}T12:00:00+09:00`);
  const start = new Date(`${profile.hockey_start_date}T12:00:00+09:00`);
  const monthDiff =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  if (monthDiff < 12) {
    return "new";
  }

  if (monthDiff < 36) {
    return "growing";
  }

  return "seasoned";
}

function getExperienceHint(bucket: ExperienceBucket, locale: "ko" | "en") {
  if (locale === "ko") {
    if (bucket === "new") {
      return "새로운 걸 억지로 해보려 하기보다 익숙한 플레이를 깔끔하게 반복하는 편이 더 잘 맞습니다.";
    }

    if (bucket === "seasoned") {
      return "그동안 쌓인 경험이 판단에 도움이 되는 날이라, 무리하지 않아도 좋은 플레이를 만들 수 있어요.";
    }

    return "지금까지 만든 리듬을 믿고 가면 됩니다. 억지로 바꾸려 하기보다 평소 하던 플레이를 이어가는 편이 좋아요.";
  }

  if (bucket === "new") {
    return "Instead of forcing something new, you should find better rhythm by repeating what already feels familiar.";
  }

  if (bucket === "seasoned") {
    return "Your accumulated experience can speed up your reads today, so good moments may come without forcing them.";
  }

  return "Your current habits should connect naturally today, so it is better to ride the flow than to force a new mood.";
}

function interpolate(template: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, value);
  }, template);
}

function buildLocalizedContent(template: FortuneCaseTemplate, role: FortuneRole, bucket: ExperienceBucket) {
  const roleCopy = ROLE_COPY[role];

  const koReplacements = {
    roleLabelKo: roleCopy.labelKo,
    focusKo: roleCopy.focusKo,
    styleKo: roleCopy.styleKo,
    cautionKo: roleCopy.cautionKo,
    experienceHintKo: getExperienceHint(bucket, "ko"),
  };

  const enReplacements = {
    roleLabelEn: roleCopy.labelEn,
    focusEn: roleCopy.focusEn,
    styleEn: roleCopy.styleEn,
    cautionEn: roleCopy.cautionEn,
    experienceHintEn: getExperienceHint(bucket, "en"),
  };

  return {
    titleKo: interpolate(template.titleKo, koReplacements),
    titleEn: interpolate(template.titleEn, enReplacements),
    summaryKo: interpolate(template.summaryKo, koReplacements),
    summaryEn: interpolate(template.summaryEn, enReplacements),
    detailsKo: template.detailsKo.map((line) => interpolate(line, koReplacements)),
    detailsEn: template.detailsEn.map((line) => interpolate(line, enReplacements)),
  };
}

function pickCaseKey(profile: DailyHockeyFortuneProfile | null | undefined, role: FortuneRole, dateKey: string, userId: string) {
  const completeness = getProfileCompleteness(profile);
  const clubSignal = profile?.primary_club_id ? "club" : "solo";
  const seed = `${userId}:${dateKey}:${role}:${completeness}:${clubSignal}:${profile?.stick_direction ?? "unknown"}`;
  const pool = CASE_POOLS[role];

  return pool[pickIndex(`${seed}:case`, pool.length)];
}

function buildScore(template: FortuneCaseTemplate, userId: string, dateKey: string, profile?: DailyHockeyFortuneProfile | null) {
  const baseRange = template.scoreMax - template.scoreMin + 1;
  const baseScore = template.scoreMin + pickIndex(`${userId}:${dateKey}:${template.key}:score`, baseRange);
  const completeness = getProfileCompleteness(profile);
  const completenessBonus = completeness >= 5 ? 1 : 0;
  const clubBonus = profile?.primary_club_id ? 1 : 0;
  const offset = pickSignedOffset(`${userId}:${dateKey}:${template.key}:offset`, 1);

  return clamp(baseScore + completenessBonus + clubBonus + offset, 80, 100);
}

export function getTodayKstDateKey(now = new Date()) {
  return getKstDateFormatter().format(now);
}

export function getRecentKstDateKeys(days: number, now = new Date()) {
  const todayKey = getTodayKstDateKey(now);
  const today = new Date(`${todayKey}T12:00:00+09:00`);

  return Array.from({ length: days }, (_, index) => {
    const value = new Date(today);
    value.setDate(today.getDate() - (days - index - 1));
    return getTodayKstDateKey(value);
  });
}

export function buildStoredHockeyFortune({
  userId,
  profile,
  fortuneDate = getTodayKstDateKey(),
}: {
  userId: string;
  profile?: DailyHockeyFortuneProfile | null;
  fortuneDate?: string;
}): StoredDailyHockeyFortune {
  const role = resolveRole(profile);
  const experienceBucket = getExperienceBucket(profile, fortuneDate);
  const caseKey = pickCaseKey(profile, role, fortuneDate, userId);
  const template = FORTUNE_CASES[caseKey];
  const content = buildLocalizedContent(template, role, experienceBucket);

  return {
    fortuneDate,
    score: buildScore(template, userId, fortuneDate, profile),
    titleKo: content.titleKo,
    titleEn: content.titleEn,
    summaryKo: content.summaryKo,
    summaryEn: content.summaryEn,
    detailsKo: content.detailsKo,
    detailsEn: content.detailsEn,
    dominantTheme: template.dominantTheme,
    cautionTheme: template.cautionTheme,
    signals: {
      caseKey,
      role,
      experienceBucket,
      profileCompleteness: getProfileCompleteness(profile),
      hasPrimaryClub: Boolean(profile?.primary_club_id),
      stickDirection: profile?.stick_direction ?? "unknown",
    },
  };
}

export function getFortuneCaseCatalog() {
  return Object.values(FORTUNE_CASES).map((item) => ({
    key: item.key,
    titleKo: item.titleKo,
    titleEn: item.titleEn,
    scoreRange: `${item.scoreMin}-${item.scoreMax}`,
  }));
}
