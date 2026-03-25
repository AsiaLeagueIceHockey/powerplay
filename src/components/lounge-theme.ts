export const loungeIceGoldTheme = {
  bannerContainer:
    "overflow-hidden rounded-xl border border-[#d4a017]/25 bg-[radial-gradient(circle_at_top_right,_rgba(243,210,122,0.24),_transparent_30%),linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#d4a017_140%)] px-4 py-3 shadow-sm",
  bannerIcon:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-[#f3d27a] backdrop-blur",
  accentLine:
    "bg-[linear-gradient(90deg,#0f172a_0%,#1e293b_45%,#d4a017_100%)]",
  badge:
    "bg-[#fbf4dd] text-[#8b6814] dark:bg-[#d4a017]/15 dark:text-[#f3d27a]",
  subtleBadge:
    "bg-[#fbf4dd] text-[#7a5a10] dark:bg-[#d4a017]/12 dark:text-[#f3d27a]",
  categoryChip:
    "border-[#edd899] bg-[#fdf7e6] text-[#8a6610] dark:border-[#d4a017]/30 dark:bg-[#d4a017]/12 dark:text-[#f3d27a]",
  hoverBorder: "hover:border-[#d4a017] dark:hover:border-[#d4a017]",
  highlightState:
    "border-[#d4a017] ring-2 ring-[#f3d27a]/60 shadow-lg shadow-[#d4a017]/10 animate-[pulse_1.8s_ease-in-out_3] dark:border-[#d4a017] dark:ring-[#d4a017]/30",
  timeText: "text-[#a17610] dark:text-[#f3d27a]",
  detailShell:
    "border-[#d4a017]/35 bg-white shadow-sm dark:border-[#d4a017]/20 dark:bg-zinc-950",
  fallbackCover:
    "bg-[radial-gradient(circle_at_top_left,_rgba(243,210,122,0.32),_transparent_36%),linear-gradient(135deg,#fff8eb_0%,#ffffff_52%,#f8f1da_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(243,210,122,0.16),_transparent_35%),linear-gradient(135deg,#18181b_0%,#09090b_70%,#2b2414_100%)]",
  shareHover: "hover:text-[#d4a017] dark:hover:text-[#f3d27a]",
  calendarSelected: "bg-[#d4a017] text-[#111827] font-bold shadow-lg",
  calendarToday: "bg-[#0f172a] text-white font-bold",
  calendarHasEvent:
    "bg-[#fcf5de] hover:bg-[#f7ebc7] dark:bg-[#d4a017]/12 dark:hover:bg-[#d4a017]/20",
  calendarEventCount: "text-[#a17610] dark:text-[#f3d27a]",
  dateFilterSelected: "bg-[#d4a017] text-[#111827] shadow-lg",
  dateFilterSelectedSubtext: "text-[#1f2937]/70",
  dateFilterTodayText: "text-[#a17610] dark:text-[#f3d27a] font-semibold",
} as const;

const loungeBusinessCategoryThemes = {
  youth_club: {
    accentLine: "bg-[linear-gradient(90deg,#052e16_0%,#15803d_45%,#86efac_100%)]",
    badge: "bg-[#ecfdf3] text-[#166534] dark:bg-[#15803d]/15 dark:text-[#86efac]",
    subtleBadge: "bg-[#f1fdf5] text-[#166534] dark:bg-[#15803d]/12 dark:text-[#86efac]",
    hoverBorder: "hover:border-[#22c55e] dark:hover:border-[#22c55e]",
  },
  lesson: {
    accentLine: "bg-[linear-gradient(90deg,#0f172a_0%,#1d4ed8_45%,#60a5fa_100%)]",
    badge: "bg-[#eaf3ff] text-[#1f4fa3] dark:bg-[#1d4ed8]/15 dark:text-[#93c5fd]",
    subtleBadge: "bg-[#eef5ff] text-[#234f95] dark:bg-[#1d4ed8]/12 dark:text-[#93c5fd]",
    hoverBorder: "hover:border-[#3b82f6] dark:hover:border-[#3b82f6]",
  },
  training_center: {
    accentLine: "bg-[linear-gradient(90deg,#052e2b_0%,#0f766e_45%,#5eead4_100%)]",
    badge: "bg-[#e8f8f5] text-[#0f766e] dark:bg-[#0f766e]/15 dark:text-[#99f6e4]",
    subtleBadge: "bg-[#edf9f7] text-[#11695f] dark:bg-[#0f766e]/12 dark:text-[#99f6e4]",
    hoverBorder: "hover:border-[#14b8a6] dark:hover:border-[#14b8a6]",
  },
  tournament: {
    accentLine: "bg-[linear-gradient(90deg,#3f0a1d_0%,#9f1239_45%,#fb7185_100%)]",
    badge: "bg-[#fff0f3] text-[#9f1239] dark:bg-[#9f1239]/15 dark:text-[#fda4af]",
    subtleBadge: "bg-[#fff3f5] text-[#8e1a3e] dark:bg-[#9f1239]/12 dark:text-[#fda4af]",
    hoverBorder: "hover:border-[#e11d48] dark:hover:border-[#e11d48]",
  },
  brand: {
    accentLine: "bg-[linear-gradient(90deg,#27104a_0%,#6d28d9_45%,#c4b5fd_100%)]",
    badge: "bg-[#f4efff] text-[#6d28d9] dark:bg-[#6d28d9]/15 dark:text-[#c4b5fd]",
    subtleBadge: "bg-[#f7f2ff] text-[#5b2ab7] dark:bg-[#6d28d9]/12 dark:text-[#c4b5fd]",
    hoverBorder: "hover:border-[#8b5cf6] dark:hover:border-[#8b5cf6]",
  },
  service: {
    accentLine: "bg-[linear-gradient(90deg,#3c2415_0%,#9a3412_45%,#fdba74_100%)]",
    badge: "bg-[#fff4ea] text-[#9a3412] dark:bg-[#9a3412]/15 dark:text-[#fdba74]",
    subtleBadge: "bg-[#fff6ee] text-[#8d3415] dark:bg-[#9a3412]/12 dark:text-[#fdba74]",
    hoverBorder: "hover:border-[#ea580c] dark:hover:border-[#ea580c]",
  },
  other: {
    accentLine: "bg-[linear-gradient(90deg,#0f172a_0%,#1e293b_45%,#d4a017_100%)]",
    badge: "bg-[#fbf4dd] text-[#8b6814] dark:bg-[#d4a017]/15 dark:text-[#f3d27a]",
    subtleBadge: "bg-[#fbf4dd] text-[#7a5a10] dark:bg-[#d4a017]/12 dark:text-[#f3d27a]",
    hoverBorder: "hover:border-[#d4a017] dark:hover:border-[#d4a017]",
  },
} as const;

const loungeEventCategoryThemes = {
  lesson: {
    accentLine: loungeBusinessCategoryThemes.lesson.accentLine,
    categoryChip: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] dark:border-[#1d4ed8]/30 dark:bg-[#1d4ed8]/12 dark:text-[#93c5fd]",
    timeText: "text-[#1d4ed8] dark:text-[#93c5fd]",
    hoverBorder: loungeBusinessCategoryThemes.lesson.hoverBorder,
  },
  training: {
    accentLine: loungeBusinessCategoryThemes.training_center.accentLine,
    categoryChip: "border-[#99f6e4] bg-[#ecfdf5] text-[#0f766e] dark:border-[#0f766e]/30 dark:bg-[#0f766e]/12 dark:text-[#99f6e4]",
    timeText: "text-[#0f766e] dark:text-[#99f6e4]",
    hoverBorder: loungeBusinessCategoryThemes.training_center.hoverBorder,
  },
  tournament: {
    accentLine: loungeBusinessCategoryThemes.tournament.accentLine,
    categoryChip: "border-[#fecdd3] bg-[#fff1f2] text-[#be123c] dark:border-[#9f1239]/30 dark:bg-[#9f1239]/12 dark:text-[#fda4af]",
    timeText: "text-[#be123c] dark:text-[#fda4af]",
    hoverBorder: loungeBusinessCategoryThemes.tournament.hoverBorder,
  },
  promotion: {
    accentLine: loungeBusinessCategoryThemes.brand.accentLine,
    categoryChip: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9] dark:border-[#6d28d9]/30 dark:bg-[#6d28d9]/12 dark:text-[#c4b5fd]",
    timeText: "text-[#6d28d9] dark:text-[#c4b5fd]",
    hoverBorder: loungeBusinessCategoryThemes.brand.hoverBorder,
  },
} as const;

export function getLoungeBusinessCategoryTheme(category: keyof typeof loungeBusinessCategoryThemes) {
  return loungeBusinessCategoryThemes[category];
}

export function getLoungeEventCategoryTheme(category: keyof typeof loungeEventCategoryThemes) {
  return loungeEventCategoryThemes[category];
}
