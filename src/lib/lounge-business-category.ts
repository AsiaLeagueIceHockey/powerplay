export const loungeBusinessCategoryOrder = [
  "youth_club",
  "lesson",
  "training_center",
  "tournament",
  "brand",
  "service",
  "other",
] as const;

export type LoungeBusinessCategory = (typeof loungeBusinessCategoryOrder)[number];

export function getLoungeBusinessCategoryLabel(locale: string, category: LoungeBusinessCategory) {
  const isKo = locale === "ko";

  return {
    youth_club: isKo ? "유소년 클럽" : "Youth Club",
    lesson: isKo ? "하키 레슨" : "Lessons",
    training_center: isKo ? "훈련장 / 슈팅센터" : "Training Center",
    tournament: isKo ? "대회" : "Tournament",
    brand: isKo ? "브랜드" : "Brand",
    service: isKo ? "치료/재활" : "Recovery & Rehab",
    other: isKo ? "기타" : "Other",
  }[category];
}

export function getLoungeBusinessCategoryOptions(locale: string) {
  const isKo = locale === "ko";

  return [
    { value: "all" as const, label: isKo ? "전체" : "All" },
    ...loungeBusinessCategoryOrder.map((category) => ({
      value: category,
      label:
        category === "lesson"
          ? isKo
            ? "레슨"
            : "Lessons"
          : category === "training_center"
            ? isKo
              ? "훈련장"
              : "Training"
            : getLoungeBusinessCategoryLabel(locale, category),
    })),
  ];
}

export function getLoungeBusinessCategoryPriority(category: LoungeBusinessCategory) {
  return loungeBusinessCategoryOrder.indexOf(category);
}

export function compareLoungeBusinessCategoryPriority(
  left: LoungeBusinessCategory,
  right: LoungeBusinessCategory
) {
  return getLoungeBusinessCategoryPriority(left) - getLoungeBusinessCategoryPriority(right);
}
